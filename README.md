# anvil-extension-kits

## Audio()
`name`: `str` # help you remember the name of the sound
`id`: `str` # get from anvil.matiuschristov.com/audio
  **note** - the id for an audio file will always be the same

## SpeechAPI()
`self.voices` = list()
  **note** - stores all voices the browser supports
  **note** - mostly internally used
`self.findVoiceByName()`
  **note** - find a voice by its name
  **note** - to pass voice into speech options find URI
`self.findVoiceByURI()`
  **note** - same function as findVoiceByName by argument is voiceURI not name

## Speech()
`text`: `str`
`options`: `dict`
`options.gender` = `'male'` or `'female'`
`options.voice` = 'enter voice nameURI'
`options.voice.male` = []
  **note** - set default array of male voices
`options.voice.female` = []
  **note** - set default array of female voices
`options.rate` = `1`
  **note** - speed is multiplied 1 is normal 1.5 is 1.5x speed
`options.pitch` = `1`
`options.volume` = `1`
