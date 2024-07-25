function copyToClipboard(text) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.top = '0';
    textarea.style.left = '0';
    textarea.style.position = 'fixed';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
        var successful = document.execCommand('copy');
        var msg = successful ? 'successful' : 'unsuccessful';
        console.log('Copying text command was ' + msg);
    } catch (err) {
        console.error('Unable to copy', err);
    }

    document.body.removeChild(textarea);
}


function copyCodeToClipboard() {
    this.textContent = "Copied to Clipboard";
    setTimeout(() => {
        this.textContent = "Copy to Clipboard";
    }, 1000);
    const code = this.parentElement.children[0];
    copyToClipboard(code.textContent);
}

const upload_file_audio = document.getElementById('upload-file');
if (upload_file_audio) {
    let buttonElement = upload_file_audio.parentElement.children[2];
    function setMessage(text, button = false) {
        upload_file_audio.parentElement.classList.add("anvil-button-container-complete");
        upload_file_audio.parentElement.children[1].style.display = "block";
        if (!button) {
            buttonElement.style.display = "none";
        }
        upload_file_audio.parentElement.children[1].textContent = text;
    }

    upload_file_audio.addEventListener("change", () => {
        const xhr = new XMLHttpRequest();
        function errorAction(event) {
            setMessage(`Upload failed: ${event.type}`);
        }
        xhr.upload.addEventListener("error", errorAction);
        xhr.upload.addEventListener("abort", errorAction);
        xhr.upload.addEventListener("timeout", errorAction);

        const upload_data = new FormData();
        const file = upload_file_audio.files[0];
        upload_data.append("file", file);
        if (file.size > (1024 * 1024 * 10)) {
            setMessage('The file you are trying to upload is over 10MB');
        }

        xhr.onload = async () => {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    const file = JSON.parse(xhr.responseText)[0];
                    const type = upload_file_audio.getAttribute('accept').split('/')[0];
                    // buttonElement.style.marginTop = '0.2rem';
                    const copyText = `${type == 'image' ? 'source URL' : 'audio ID'} to clipboard`;
                    buttonElement.textContent = `Copy ${copyText}`;
                    buttonElement.onclick = () => {
                        copyToClipboard(type == 'image' ? `https://anvil.matiuschristov.com/download/image/${file.md5}` : file.md5);
                        buttonElement.textContent = `Copied ${copyText}`
                        setTimeout(() => {
                            buttonElement.textContent = `Copy ${copyText}`
                        }, 1000);
                    };
                    // setMessage(`Upload complete ${file.md5}`, true);
                } else {
                    setMessage(`Upload failed ${xhr.status}`);
                }
            }
        };
        xhr.open("POST", `/upload/${upload_file_audio.getAttribute('accept').split('/')[0]}`, true);
        xhr.send(upload_data);
    });
}