var express = require('express');
var mongoose = require('mongoose');
var request = require('request');
var cheerio = require('cheerio');
var async = require("async");

var Anime = require('../models/anime');
var Manga = require('../models/manga');

// look into https://github.com/cheeriojs/cheerio
// var jsdom = require('jsdom').jsdom
//   , myWindow = jsdom().createWindow()
//   , $ = require('jQuery')
//   , jq = require('jQuery').create()
//   , jQuery = require('jQuery').create(myWindow)
//   ;

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
            console.log("retrieved anime: ", a.id);
            var index = notIn.indexOf(a.id);
            if (index > -1) {
                notIn.splice(index, 1);
            }
        });
        console.log("not in: " + notIn);
        console.log("start scrape: ", new Date().getTime());

async.parallel([
    function(callback){
        setTimeout(function(){
            callback(null, 'one');
        }, 200);
    },
    function(callback){
        setTimeout(function(){
            callback(null, 'two');
        }, 100);
    }
],
// optional callback
function(err, results){
    // the results array will equal ['one','two'] even though
    // the second function had a shorter timeout.
});


        async.forEachOf(notIn, function (value, key, callback) {
            scrapeAnime(value, function(stats) {

                return;
            });
            return;


            // fs.readFile(__dirname + value, "utf8", function (err, data) {
            //     if (err) return callback(err);
            //     try {
            //         configs[key] = JSON.parse(data);
            //     } catch (e) {
            //         return callback(e);
            //     }
            //     callback();
            // });
        }, function (err) {
            if (err) {
                console.log("alksdjfd");
                console.log(err);
                sendErrResponse(res, err);
                return;
            }
            // if (err) console.error(err.message);
            // // configs is now a map of JSON data
            // doSomethingWith(configs);
            console.log("end scrape: ", new Date().getTime());
            sendSuccess(res, anime);
            return;
        });

        console.log("lkjasdf");





        // notIn.forEach(function(id) {
        // //for (id in notIn) {
        //     var stats = scrapeAnime(id);
        //     console.log(stats);

        //     var newAnime = new Anime();
        //     newAnime.id = id;
        //     newAnime.title = stats.name;
        //     newAnime.premiered = stats.premiered;
        //     newAnime.studios = stats.studio;
        //     newAnime.rank = stats.rank;
        //     newAnime.score = stats.score;

        //     newAnime.save(function(err) {
        //         if (err) {
        //             console.log("Error saving anime:");
        //             console.log(newAnime);
        //             console.log(err);
        //             sendErrResponse(res, err);
        //             return;
        //         }
        //         //console.log("Anime successfully saved");
        //     });
        // });
        // console.log("end scrape: ", new Date().getTime());
        // sendSuccess(res, anime);
    });
});


// var fetch = function(file,cb){
//      request.get(file, function(err,response,body){
//            if ( err){
//                  cb(err);
//            } else {
//                  cb(null, body); // First param indicates error, null=> no error
//            }
//      });
// }
async.map(["file1", "file2", "file3"], fetch, function(err, results){
    if ( err){
       // either file1, file2 or file3 has raised an error, so you should not use results and handle the error
    } else {
       // results[0] -> "file1" body
       // results[1] -> "file2" body
       // results[2] -> "file3" body
    }
});



var saveAnime = function(stats) {
    console.log("saving anime with stats: ", stats);

    var newAnime = new Anime();
    newAnime.id = value;
    newAnime.title = stats.name;
    newAnime.premiered = stats.premiered;
    newAnime.studios = stats.studio;
    newAnime.rank = Number(stats.rank);
    newAnime.score = Number(stats.score);

    newAnime.save(function(err) {
        if (err) {
            console.log("Error saving anime:");
            console.log(newAnime);
            console.log(err);
            return err;
        } else {
            console.log("Anime successfully saved");
            return null;
        }
    });
}


var scrapeAnime = function(id, callback) {
    var url = "http://myanimelist.net/anime/" + id;
    console.log("scraping: " + url);
    request(url, function(err, resp, body) {
        if (err) {
            // err
        } else {
            var stats = parseAnimeInfo(body);

            callback(body);
        }
    });
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
