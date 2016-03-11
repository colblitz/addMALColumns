var express = require('express');
var mongoose = require('mongoose');
var Anime = require('../models/anime');
var Manga = require('../models/manga');
var router = express.Router();

var sendSuccess = function(res, content) {
	res.status(200).json({
		success: true,
		content: content
	}).end();
};

var sendErrResponse = function(res, err) {
	res.status(400).json({
		success: false,
		err: err
	}).end();
};

var sendJson = function(res, content) {
	res.json(content);
};

/* GET home page. */
router.get('/', function(req, res, next) {
 	res.render('index', { title: 'Express' });
});

router.get('/test', function(req, res) {
	var test = {blah: "alskdjf"};
	sendSuccess(res, test);
});

router.get('/json', function(req, res) {
	sendJson(res, {json: "testjson"});
});

router.post('/requestAnime', function(req, res) {
	console.log(req.body.ids);

    Anime.find({}).where('id').in(req.body.ids).exec(function(err, anime) {
        var notIn = req.body.ids.slice();

        anime.forEach(function(a) {
            console.log("retrieved anime: ");
            console.log(a);
            var index = notIn.indexOf(a.id);
            if (index > -1) {
                notIn.splice(index, 1);
            }
        });
        console.log("not in: " + notIn);
        notIn.forEach(function(id) {
        //for (id in notIn) {
            var newAnime = new Anime();
            newAnime.id = id;
            newAnime.title = "asdf";
            newAnime.premiered = "alskdjf";
            newAnime.studios = "alksjflajeflk";
            newAnime.rank = 123;
            newAnime.score = 15.1452;

            newAnime.save(function(err) {
                if (err) {
                    console.log("Error saving anime: " + err);
                    sendErrResponse(res, err);
                    return;
                }
                console.log("Anime successfully saved");
            });
        });
        sendSuccess(res, anime);
    });
});

var scrapeAnime = function(id) {
    return $.ajax({
        url: "http://myanimelist.net/anime/" + id,
        type: 'GET',
        dataType: "html",
        success: function (data) {
            return data;
        },
        error: function () {
            console.log("error");
        }
    });
}

var parseAnimeInfo = function(data) {
    var stat_1 = $($(data.responseText).find("span:contains('Premiered')")[0]).next().text();
    var stat_2 = $($(data.responseText).find("span:contains('Studios')")[0]).next().text();
    var stat_3 = $($(data.responseText).find("span:contains('Ranked')")[0]).next().text();
    var stat_4 = $($(data.responseText).find("span:contains('Score')")[0]).next().text();
    return [stat_1, stat_2, stat_3, stat_4];
}

module.exports = router;
