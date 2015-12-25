var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Anime = Schema({
	id: {type: Number, unique: true}
	title: String,
	premiered: String,
	studios: String,
	rank: Number,
	score: Number
});

module.exports = mongoose.model('Anime', Anime);