const fs = require('fs');
const crypto = require('crypto');
let spawn = require('child_process').spawn;

function generateMD5(file) {
    let md5 = [];
    return new Promise((resolve, reject) => {
        let md5Calculation = spawn('md5sum', [file]);
        md5Calculation.stdout.on('data', (chunk) => {
            md5.push(chunk);
        })
        md5Calculation.on('close', (code) => {
            if (code !== 0) {
                return reject(`md5sum process exited with code ${code}`);
            }
            md5 = Buffer.concat(md5).toString().toString().trim();
            resolve(md5.split(' ')[0]);
        });
    });
}

exports = module.exports = (app, Modules) => {
    const Routes = {
        Central: new app.virtual("anvil.matiuschristov.com"),
    };

    Routes.Central.use((req, res, next) => {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
        next();
    });
    Routes.Central.use((req, res, next) => {
        res.setHeaders({
            'Connection': 'keep-alive',
            'Server': 'cdn-mac',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
        });
        Modules.server.cors(res, {
            origin: "*",
            method: "*",
            header: "*"
        });
        if (req.path.startsWith('/assets/')) {
            Modules.server.cache(res, {
                duration: 60 * 60 * 24 * 7,
                validate: false,
                private: false,
            });
        }
        next();
    });

    let parentDirAudio = `${__dirname}/library-audio`;
    let parentDirImage = `${__dirname}/library-image`;

    function getParentDir(type) {
        switch (type) {
            case 'audio':
                return parentDirAudio;
            case 'image':
                return parentDirImage;
        }
    }

    Routes.Central.use(Modules.server.static(`${__dirname}/static`));
    Routes.Central.post('/upload/:type', (req, res, next) => {
        if (!['audio', 'image'].includes(req.params.type)) return res.sendStatus(500);
        const parentDir = getParentDir(req.params.type);
        const formBoundary = req.headers['content-type'].split('; ')[1].split('=').slice(1);
        const formBoundaryStart = Buffer.from(`--${formBoundary}\r\n`);
        const formBoundaryFinish = Buffer.from(`\r\n--${formBoundary}\r\n`);
        const formBoundaryEnd = Buffer.from(`\r\n--${formBoundary}--\r\n`);
        const formBoundaryMetaEnd = Buffer.from(`\r\n\r\n`);
        const files = [];
        let size = 0;

        req.on('data', (d) => {
            size += d.length;
            let boundary = d.indexOf(formBoundaryStart);
            function writeData() {
                let fileData;
                if (d.indexOf(formBoundaryFinish) != -1) {
                    fileData = d.slice(0, d.indexOf(formBoundaryFinish));
                    d = d.slice(d.indexOf(formBoundaryFinish));
                } else if (d.indexOf(formBoundaryEnd) != -1) {
                    fileData = d.slice(0, d.indexOf(formBoundaryEnd));
                    d = d.slice(d.indexOf(formBoundaryEnd));
                } else {
                    fileData = d;
                    d = Buffer.alloc(0);
                }
                files[files.length - 1].data.write(fileData);
            }
            while (boundary != -1) {
                if (boundary > 0) {
                    writeData();
                }
                fs.mkdirSync(`${__dirname}/temp-uploads`, { recursive: true });
                const fileID = crypto.randomUUID();
                const filePath = `${__dirname}/temp-uploads/${fileID}`;
                files.push({ id: fileID, data: fs.createWriteStream(filePath), path: filePath });
                files[files.length - 1].metadata = d.slice(d.indexOf(formBoundaryStart) + formBoundaryStart.length, d.indexOf(formBoundaryMetaEnd)).toString();
                files[files.length - 1].name = files[files.length - 1].metadata.match(/name="([^"]*)"/)[1];
                files[files.length - 1].filename = files[files.length - 1].metadata.match(/filename="([^"]*)"/)[1];
                files[files.length - 1].type = files[files.length - 1].metadata.match(/Content-Type:\s*([\w\/-]+)/)[1];
                delete files[files.length - 1].metadata;
                d = d.slice(d.indexOf(formBoundaryMetaEnd) + formBoundaryMetaEnd.length);
                if (d.length > 0) writeData(d, files);
                boundary = d.indexOf(formBoundaryStart);
            }
            if (d.length > 0) {
                writeData();
            }
        });
        req.on('end', async () => {
            if (size > (1024 * 1024 * 10)) {
                res.status(413);
                res.send('The file you are uploading is over 10MB');
                return;
            }
            fs.mkdirSync(parentDir, { recursive: true });
            for (const file of files) {
                await (new Promise((resolve, reject) => {
                    file.data.on('close', async () => {
                        delete file.data;
                        file.md5 = await generateMD5(file.path);
                        const currentPath = `${parentDir}/${file.md5}`;
                        if (!fs.existsSync(currentPath) && !fs.existsSync(`${currentPath}.json`)) {
                            fs.renameSync(file.path, currentPath);
                            file.size = fs.statSync(currentPath).size;
                            file.path = currentPath;
                            fs.writeFileSync(`${currentPath}.json`, JSON.stringify(file));
                        } else {
                            fs.unlinkSync(file.path);
                        }
                        resolve();
                    });
                    file.data.end();
                }));
            }
            res.json(files);
        });
    });
    Routes.Central.get('/download/:type/:id', (req, res, next) => {
        if (!['audio', 'image'].includes(req.params.type)) return res.sendStatus(500);
        const parentDir = getParentDir(req.params.type);
        if (fs.existsSync(`${parentDir}/${req.params.id}`)) {
            let data = fs.createReadStream(`${parentDir}/${req.params.id}`);
            let metadata = JSON.parse(fs.readFileSync(`${parentDir}/${req.params.id}.json`));
            res.setHeaders({
                'Content-Disposition': `${parentDir.endsWith('image') ? 'inline' : 'attachment'}; filename="${metadata.filename}"`,
                'Content-Type': metadata.type,
                'Content-Length': metadata.size
            });
            data.pipe(res, { end: true });
        } else {
            res.status(404);
            res.send('File not found');
        }
    });

    Routes.Central.use((req, res, next) => {
        res.sendStatus(404);
    });

    return Routes.Central;
};