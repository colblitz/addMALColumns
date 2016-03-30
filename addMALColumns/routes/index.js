var express = require('express');
var mongoose = require('mongoose');
var request = require('request');
var cheerio = require('cheerio');
var async = require("async");

var Anime = require('../models/anime');
var Manga = require('../models/manga');

var router = express.Router();

var MAXDIFF = 1000 * 60 * 60 * 24; // milliseconds in a day

////////
// Stuff

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

router.get('/', function(req, res, next) {
 	res.render('index', { title: 'Express' });
});

var getDb = function(type) {
    if (type == "anime") {
        return Anime;
    } else if (type == "manga") {
        return Manga;
    }
};


router.post('/requestData', function(req, res) {
	console.log(req.body.ids);

    var type = req.body.type;
    var ids = req.body.ids;

    var db = getDb(type);
    var scrapeFunction = function(id, callback) {
        scrape(id, type, callback);
    };

    db.find({}).where('malid').in(ids).exec(function(err, objects) {
        var now = new Date();

        var toGet = ids.slice();
        var toReturn = {};
        objects.forEach(function(a) {
            console.log("retrieved " + type + ": ", a.malid);
            toReturn[a.malid] = a;
            var index = toGet.indexOf(a.malid);

            // If we have the data and it's not too old, remove from toGet list
            if (index > -1 && (now - a.time < MAXDIFF)) {
                toGet.splice(index, 1);
            }
        });
        var start = new Date().getTime();

        async.map(toGet, scrapeFunction, function(err, results) {
            if (err) {
                console.log("errors:", err);
            } else {
                console.log("no errors");
                console.log("results: ", results);
                results.forEach(function(a) {
                    if (a != null) {
                        toReturn[a.malid] = a;
                    }
                });
                sendSuccess(res, {time: new Date().getTime() - start, data: toReturn});
                return;
            }
        });
    });
});

var scrape = function(id, type, callback) {
    var url = "http://myanimelist.net/" + type + "/" + id;
    console.log("scraping: " + url);
    request(url, function(err, resp, body) {
        if (resp.statusCode == 404) {
            callback(null, null);
        } else {
            if (err) {
                callback(err);
            } else {
                save(id, type, parseInfo(type, body), callback);
            }
        }
    });
};

var save = function(id, type, info, callback) {
    console.log("saving " + type + " with info: ", info);

    var newThing;
    if (type == "anime") {
        newThing = new Anime({
            malid: id,
            title: info.name,
            premiered: info.premiered,
            studios: info.studio,
            rank: Number(info.rank),
            score: Number(info.score)
        });
    } else if (type == "manga") {
        newThing = new Manga({
            malid: id,
            title: info.name,
            author: info.author,
            rank: Number(info.rank),
            score: Number(info.score)
        });
    }

    var newThingData = newThing.toObject();
    delete newThingData._id;

    getDb(type).findOneAndUpdate({'malid': id}, newThingData, {upsert:true, new:true}, function(err, thing) {
        if (err) {
            console.log("Error saving " + type + ":");
            console.log(err);
            callback(err);
        } else {
            console.log(type + " successfully saved");
            console.log(thing);
            callback(null, thing);
        }
    });
};

var parseInfo = function(type, data) {
    if (type == "anime") {
        return parseAnimeInfo(data);
    } else if (type == "manga") {
        return parseMangaInfo(data);
    }
}

// var scrapeAnime = function(id, callback) {
//     var url = "http://myanimelist.net/anime/" + id;
//     console.log("scraping: " + url);
//     request(url, function(err, resp, body) {
//         if (err) {
//             callback(err);
//         } else {
//             saveAnime(id, parseAnimeInfo(body), callback);
//         }
//     });
// }

// var saveAnime = function(id, stats, callback) {
//     console.log("saving anime with stats: ", stats);

//     var newAnime = new Anime({
//         malid: id,
//         title: stats.name,
//         premiered: stats.premiered,
//         studios: stats.studio,
//         rank: Number(stats.rank),
//         score: Number(stats.score)
//     });

//     var newAnimeData = newAnime.toObject();
//     delete newAnimeData._id;

//     Anime.findOneAndUpdate({'malid': id}, newAnimeData, {upsert:true, new:true}, function(err, anime) {
//         if (err) {
//             console.log("Error saving anime:");
//             console.log(err);
//             callback(err);
//         } else {
//             console.log("Anime successfully saved");
//             console.log(anime);
//             callback(null, anime);
//         }
//     });
// }

var parseAnimeInfo = function(data) {
    console.log("parsing");
    var $ = cheerio.load(data);
    var name = $($('span[itemprop="name"]')[0]).text();
    var stat_1 = $($("span:contains('Premiered:')")[0]).next().text();
    var stat_2 = $($("span:contains('Studios:')")[0]).next().text();
    var stat_3 = $($("span:contains('Ranked:')")[0]).parent().contents().filter(function() {
        return this.nodeType == 3;
    }).text().replace(/^\s+|\s+$/g, '').replace('#','');

    var stat_4 = $('span[itemprop="ratingValue"]').text();
    // var stat_4 = $($("span:contains('Score:')")[0]).next().text();
    var stats = {
        name: name,
        premiered: stat_1,
        studio: stat_2,
        rank: stat_3,
        score: stat_4};
    console.log("got stuff:\n", stats);
    return stats;
};

var parseMangaInfo = function(data) {
    console.log("parsing");
    var $ = cheerio.load(data);
    var name = $($('span[itemprop="name"]')[0]).text();
    var stat_1 = $($("span:contains('Authors:')")[0]).next().text();
    var stat_3 = $($("span:contains('Ranked:')")[0]).parent().contents().filter(function() {
        return this.nodeType == 3;
    }).text().replace(/^\s+|\s+$/g, '').replace('#','');

    // var stat_4 = $($("span:contains('Score:')")[0]).next().text();
    var stat_4 = $('span[itemprop="ratingValue"]').text();
    var stats = {
        name: name,
        author: stat_1,
        rank: stat_3,
        score: stat_4};
    console.log("got stuff:\n", stats);
    return stats;
};


// var scrapeManga = function(id, callback) {
//     var url = "http://myanimelist.net/manga/" + id;
//     console.log("scraping: " + url);
//     request(url, function(err, resp, body) {
//         if (err) {
//             callback(err);
//         } else {
//             saveManga(id, parseMangaInfo(body), callback);
//         }
//     });
// }

// var saveManga = function(id, stats, callback) {
//     console.log("saving manga with stats: ", stats);

//     var newManga = new Manga({
//         malid: id,
//         title: stats.name,
//         author: stats.author,
//         rank: Number(stats.rank),
//         score: Number(stats.score)
//     });

//     var newMangaData = newManga.toObject();
//     delete newMangaData._id;

//     Manga.findOneAndUpdate({'malid': id}, newMangaData, {upsert:true, new:true}, function(err, manga) {
//         if (err) {
//             console.log("Error saving anime:");
//             console.log(err);
//             callback(err);
//         } else {
//             console.log("Anime successfully saved");
//             console.log(anime);
//             callback(null, anime);
//         }
//     });
// }




module.exports = router;
