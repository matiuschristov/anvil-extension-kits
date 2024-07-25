# Anvil Extension Kits

## Audio()<br>
`name`: `str`<br>
  **note** - help you remember the name of the sound<br>
`id`: `str`<br>
  **note** - get from anvil.matiuschristov.com/audio<br>
  **note** - the id for an audio file will always be the same<br>

## SpeechAPI()<br>
`self.voices` = list()<br>
  **note** - stores all voices the browser supports<br>
  **note** - mostly internally used<br>
`self.findVoiceByName()`<br>
  **note** - find a voice by its name<br>
  **note** - to pass voice into speech options find URI<br>
`self.findVoiceByURI()`<br>
  **note** - same function as findVoiceByName by argument is voiceURI not name<br>

## Speech()<br>
`text`: `str`<br>
`options`: `dict`<br>
`options.gender` = `'male'` or `'female'`<br>
`options.voice` = 'enter voice nameURI'<br>
`options.voice.male` = []<br>
  **note** - set default array of male voices<br>
`options.voice.female` = []<br>
  **note** - set default array of female voices<br>
`options.rate` = `1`<br>
  **note** - speed is multiplied 1 is normal 1.5 is 1.5x speed<br>
`options.pitch` = `1`<br>
`options.volume` = `1`
