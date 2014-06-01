var util = require('util');
var Readable = require('stream').Readable;
var LastfmAPI = require('lastfmapi');
var trickle = require('timetrickle');

exports = module.exports = RecentTracksStream;

function RecentTracksStream (options) {
	if (!(this instanceof RecentTracksStream)) { return new RecentTracksStream(options); }
	Readable.call(this, { objectMode: true });

	options = options || {};

	if (!options.user || !options.apiKey) {
		return process.nextTick(function () {
			this.emit('error', new Error('Please provide user and apiKey options'));
		}.bind(this));
	}

	this.apiKey = options.apiKey;
	this.user = options.user;
	this.reverse = options.reverse || false;
	this.from = options.from || null;
	this.to = options.to || null;
	this.tracksPerRequest = options.tracksPerRequest || 100;
	this.requestsPerMinute = options.requestsPerMinute || 60;
	this.errorDelay = options.errorDelay || 60000;

	this.rateLimit = trickle(this.requestsPerMinute, 1000);

	this.api = new LastfmAPI({
		api_key: this.apiKey
	});

	this.totalPages = null;
	this.currentPage = null;
	this.trackBuffer = [];
}

util.inherits(RecentTracksStream, Readable);

RecentTracksStream.prototype.transformTracks = function (tracks) {
	if (!Array.isArray(tracks)) { tracks = [ tracks ]; }

	return tracks.map(function (track) {
		if (!track.date) {
			var now = new Date();
			var utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
			track.date = { uts: +utc };
		} else {
			track.date.uts = parseInt(track.date.uts, 10) * 1000;
		}

		return {
			time: track.date.uts,
			artist: track.artist['#text'],
			title: track.name,
			album: track.album['#text'],
			trackMBID: track.mbid,
			artistMBID: track.artist.mbid,
			albumMBID: track.album.mbid
		};
	});
};

RecentTracksStream.prototype.getNext = function () {
	if (!this.totalPages) {
		this.rateLimit(function () {
			this.api.user.getRecentTracks({
				user: this.user,
				limit: this.tracksPerRequest
			}, function (err, response) {
				if (err) {
					return setTimeout(this.getNext.bind(this), 10000);
				}

				this.totalPages = parseInt(response['@attr'].totalPages, 10);
				this.currentPage = this.reverse ? 1 : this.totalPages;

				setTimeout(this.getNext.bind(this), 1000);
			}.bind(this));
		}.bind(this));

		return;
	}

	var nextTrack = this.trackBuffer.shift();

	if (nextTrack) {
		return this.push(nextTrack);
	}

	if (this.reverse && this.currentPage >= this.totalPages) {
		return this.push(null);
	}

	if (!this.reverse && this.currentPage < 1) {
		return this.push(null);
	}

	this.rateLimit(function () {
		this.api.user.getRecentTracks({
			user: this.user,
			limit: this.tracksPerRequest,
			page: this.currentPage

		}, function (err, response) {
			if (err) {
				return setTimeout(this.getNext.bind(this), 10000);
			}

			this.currentPage += (this.reverse) ? 1 : -1;

			var tracks = this.transformTracks(response.track);

			tracks.forEach(function (track) {
				if (this.reverse) {
					return this.trackBuffer.push(track);
				}

				this.trackBuffer.unshift(track);
			}.bind(this));

			process.nextTick(this.getNext.bind(this));
		}.bind(this));
	}.bind(this));


};

RecentTracksStream.prototype._read = function () {
	this.getNext();
};
