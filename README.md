Last.fm Export Stream
=====================

A readable object stream of a Last.fm user's scrobble history.

### Installation

```bash
npm install lastfmexportstream --save
```

### Options

 - `apiKey`: (required) The Last.fm API key. If you don't have one,
   [get one from Last.fm](http://www.last.fm/api/account/create).
 - `user`: (required) The Last.fm username.
 - `reverse`: (optional, default: false) By default, scrobbles are fetched
   in chronological order, i.e. oldest scrobble first.
   If `reverse: true` the scrobbles will be fetched in reverse order,
   i.e. latest scrobble first.
 - `from`: (optional) A UTC unix timestamp in milliseconds representing
    the date of the earliest scrobble you want. If this option is not
    present the stream will start from the first scrobble.
 - `to`: (optional) A UTC unix timestamp in milliseconds representing
    the date of the latest scrobble you want. If this option is not
    present the stream will end with the latest scrobble.
 - `tracksPerRequest`: (optional, default: 100, max: 200) The number of
   tracks to be fetched per request.
 - `requestsPerMinute`: (optional, default: 60) The maximum number of
   Last.fm API requests per second.
 - `errorDelay`: (optional, default: 10000) The number of milliseconds
   to wait until the next request if an error occurs.

### Track format

 - `time`: A UTC unix timestamp in milliseconds. Represents the time of
   the scrobble.
 - `*MBID`: The [MusicBrainz](http://musicbrainz.org/) ID of the track,
   artist or album respectively, if available.

The rest is rather self explanatory.

```javascript
{ time: 1401571793000,
  artist: 'The Dramatics',
  title: 'Inky Dinky Wang Dang Doo',
  album: 'The Golden Torch Revisited',
  trackMBID: '2c769602-4dfe-458d-b5e6-b0895d120830',
  artistMBID: '1af3791d-816f-4e36-b475-e40d29d1c25b',
  albumMBID: '' }

```

### Example

```javascript
var through = require('through2');
var LastfmExportStream = require('lastfmexportstream');

var soma7soul = new LastfmExportStream({
  apiKey: 'YOUR_LASTFM_API_KEY',
  user: 'soma7soul'
});

soma7soul
  .pipe(through.obj(function (track, enc, callback) {
    console.log(track);
    callback();
  }));
```


