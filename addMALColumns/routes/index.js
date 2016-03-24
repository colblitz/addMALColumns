var express = require('express');
var mongoose = require('mongoose');
var request = require('request');
var cheerio = require('cheerio');
var async = require("async");

var Anime = require('../models/anime');
var Manga = require('../models/manga');

var router = express.Router();

var MAXDIFF = 1000 * 60;// 1000 * 60 * 60 * 24; // milliseconds in a day

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

    Anime.find({}).where('malid').in(req.body.ids).exec(function(err, anime) {
        var now = new Date();

        var toGet = req.body.ids.slice();
        var toReturn = {};
        anime.forEach(function(a) {
            console.log("retrieved anime: ", a.malid);
            toReturn[a.malid] = a;
            var index = toGet.indexOf(a.malid);

            if (index > -1 && (now - a.time < MAXDIFF)) {
                toGet.splice(index, 1);
            }
        });
        var start = new Date().getTime();

        var scrapeFunction = function(id, callback) {
            console.log("scrapeFunction: ", id);
            scrapeAnime(id, callback);
        }

        async.map(toGet, scrapeFunction, function(err, results) {
            if (err) {
                console.log("errors:", err);
            } else {
                console.log("no errors");
                console.log("results: ", results);
                results.forEach(function(a) {
                    toReturn[a.malid] = a;
                });
                sendSuccess(res, {time: new Date().getTime() - start, anime: toReturn});
                return;
            }
        });
    });
});

var scrapeAnime = function(id, callback) {
    var url = "http://myanimelist.net/anime/" + id;
    console.log("scraping: " + url);
    request(url, function(err, resp, body) {
        if (err) {
            callback(err);
        } else {
            saveAnime(id, parseAnimeInfo(body), callback);
        }
    });
}

var saveAnime = function(id, stats, callback) {
    console.log("saving anime with stats: ", stats);

    var newAnime = new Anime({
        malid: id,
        title: stats.name,
        premiered: stats.premiered,
        studios: stats.studio,
        rank: Number(stats.rank),
        score: Number(stats.score)
    });

    // MyModel.findOneAndUpdate(query, req.newData, {upsert:true}, function(err, doc){
    //     if (err) return res.send(500, { error: err });
    //     return res.send("succesfully saved");
    // });

    var newAnimeData = newAnime.toObject();
    delete newAnimeData._id;

    // Anime.update({_id: newAnime._id}, newAnimeData, {upsert: true}, function(err, anime) {
    //     if (err) {
    //         console.log("Error saving anime:");
    //         console.log(newAnime);
    //         console.log(err);
    //         callback(err);
    //     } else {
    //         console.log("Anime successfully saved");
    //         console.log(anime);
    //         callback(null, anime);
    //     }
    // });

    // var query = {'username':req.user.username};
    // req.newData.username = req.user.username;
    // MyModel.findOneAndUpdate(query, req.newData, {upsert:true}, function(err, doc){
    //     if (err) return res.send(500, { error: err });
    //     return res.send("succesfully saved");
    // });

// var contact = new Contact({
//   phone: request.phone,
//   status: request.status
// });

// // Convert the Model instance to a simple object using Model's 'toObject' function
// // to prevent weirdness like infinite looping...
// var upsertData = contact.toObject();

// // Delete the _id property, otherwise Mongo will return a "Mod on _id not allowed" error
// delete upsertData._id;

// // Do the upsert, which works like this: If no Contact document exists with
// // _id = contact.id, then create a new doc using upsertData.
// // Otherwise, update the existing doc with upsertData
// Contact.update({_id: contact.id}, upsertData, {upsert: true}, function(err{...});

    Anime.findOneAndUpdate({'malid': id}, newAnimeData, {upsert:true, new:true}, function(err, anime) {
        if (err) {
            console.log("Error saving anime:");
            console.log(err);
            callback(err);
        } else {
            console.log("Anime successfully saved");
            console.log(anime);
            callback(null, anime);
        }
    });

    // newAnime.save(function(err) {
    //     if (err) {
    //         console.log("Error saving anime:");
    //         console.log(newAnime);
    //         console.log(err);
    //         callback(err);
    //     } else {
    //         console.log("Anime successfully saved");
    //         console.log(newAnime);
    //         callback(null, newAnime);
    //     }
    // });
}

var parseAnimeInfo = function(data) {
    console.log("parsing");
    var $ = cheerio.load(data);
    var name = $($('span[itemprop="name"]')[0]).text();
    var stat_1 = $($("span:contains('Premiered:')")[0]).next().text();
    var stat_2 = $($("span:contains('Studios:')")[0]).next().text();
    var stat_3 = $($("span:contains('Ranked:')")[0]).parent().contents().filter(function() {
        return this.nodeType == 3;
    }).text().replace(/^\s+|\s+$/g, '').replace('#','');

    var stat_4 = $($("span:contains('Score:')")[0]).next().text();
    console.log("got stuff");
    console.log([name, stat_1, stat_2, stat_3, stat_4]);
    var stats = {
        name: name,
        premiered: stat_1,
        studio: stat_2,
        rank: stat_3,
        score: stat_4};
    return stats;
}

module.exports = router;
