var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Manga = Schema({
	id: {type: Number, unique: true}
	title: String,
	author: String,
	rank: Number,
	score: Number
});

module.exports = mongoose.model('Manga', Manga);