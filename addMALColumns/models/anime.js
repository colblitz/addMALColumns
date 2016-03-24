var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Anime = Schema({
	malid: {type: Number, unique: true},
	title: String,
	premiered: String,
	studios: String,
	rank: Number,
	score: Number,
	time: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Anime', Anime);