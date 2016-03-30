var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Manga = Schema({
	malid: {type: Number, unique: true},
	title: String,
	author: String,
	rank: Number,
	score: Number,
	time: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Manga', Manga);