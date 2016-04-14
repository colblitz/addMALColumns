var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Anime = Schema({
	malid: {type: Number, unique: true},
	title: String,
	season: String,
	studio: String,
	rank: Number,
	score: Number,
	time: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Anime', Anime);