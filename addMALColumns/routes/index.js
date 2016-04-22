var express = require('express');
var mongoose = require('mongoose');
var request = require('request');
var cheerio = require('cheerio');
var async = require("async");

var Anime = require('../models/anime');
var Manga = require('../models/manga');

var router = express.Router();

var MAXDIFF = 1000 * 60 * 60 * 24 * 7;

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
  res.render('index', {
    title: 'Express'
  });
});

var getDb = function(type) {
  if (type == "anime") {
    return Anime;
  } else if (type == "manga") {
    return Manga;
  }
};

router.post('/requestData', function(req, res) {
  var type = req.body.type;
  var ids = req.body.ids.map(function(a) {
    return Number(a);
  });

  var db = getDb(type);
  var scrapeFunction = function(id, callback) {
    scrape(id, type, callback);
  };

  db.find({}).where('malid').in(ids).exec(function(err, objects) {
    var now = new Date();

    var toGet = ids.slice();
    var toReturn = {};
    console.log("got from db: ", objects.map(function(o) {
      return o.malid;
    }));
    objects.forEach(function(a) {
      toReturn[a.malid] = stripped(type, a);
      var index = toGet.indexOf(a.malid);

      // If we have the data and it's not too old, remove from toGet list
      if (index > -1 && (now - a.time < MAXDIFF)) {
        toGet.splice(index, 1);
      }
    });
    var start = new Date().getTime();
    console.log(start, ": starting to scrape ", toGet.length, " things");
    async.map(toGet, scrapeFunction, function(err, results) {
      if (err) {
        console.log("errors:", err);
      } else {
        var i = 0;
        var retrieved = Object.keys(toReturn).length;
        results.forEach(function(a) {
          if (a != null) {
            toReturn[a.malid] = a;
            i++;
          }
        });
        console.log("no errors, returning ", Object.keys(toReturn).length, " things after ", new Date().getTime() - start, " with ", retrieved, " from db");
        sendSuccess(res, {
          time: new Date().getTime() - start,
          attempted: toGet.length,
          scraped: i,
          data: toReturn
        });
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
        save(id, type, parseInfo(body), callback);
      }
    }
  });
};

var save = function(id, type, info, callback) {
  var newThing;
  if (type == "anime") {
    newThing = new Anime({
      malid: id,
      title: info.name,
      season: info.season,
      studio: info.studio,
      rank: Number(info.rank),
      score: Number(info.score)
    });
  } else if (type == "manga") {
    newThing = new Manga({
      malid: id,
      title: info.name,
      published: info.published,
      author: info.author,
      rank: Number(info.rank),
      score: Number(info.score)
    });
  }

  var newThingData = newThing.toObject();
  delete newThingData._id;

  getDb(type).findOneAndUpdate({
    'malid': id
  }, newThingData, {
    upsert: true,
    new: true
  }, function(err, thing) {
    if (err) {
      console.log("Error saving " + type + ":");
      console.log(err);
      callback(err);
    } else {
      console.log("New entry to db: ", oneLine(type, thing));
      callback(null, stripped(type, thing));
    }
  });
};

var oneLine = function(type, t) {
  if (type == "anime") {
    return [t.malid, t.title, t.season, t.studio, t.rank, t.score, t.time].join(" || ");
  } else if (type == "manga") {
    return [t.malid, t.title, t.published, t.author, t.rank, t.score, t.time].join(" || ");
  }
};

var stripped = function(type, thing) {
  if (type == "anime") {
    return {
      malid: thing.malid,
      title: thing.title,
      season: thing.season,
      studio: thing.studio,
      rank: thing.rank,
      score: thing.score
    };
  } else if (type == "manga") {
    return {
      malid: thing.malid,
      title: thing.title,
      published: thing.published,
      author: thing.author,
      rank: thing.rank,
      score: thing.score
    };
  }
};

var parseInfo = function(data) {
  // TODO: log if get 0 stats
  var $ = cheerio.load(data);
  // both
  var name = $($('span[itemprop="name"]')[0]).text();
  var rank = $($("span:contains('Ranked:')")[0]).parent().contents().filter(function() {
    return this.nodeType == 3;
  }).text().replace(/^\s+|\s+$/g, '').replace('#', '');

  var score = $('span[itemprop="ratingValue"]').text();
  // var stat_4 = $($("span:contains('Score:')")[0]).next().text();

  // anime
  var season = $($("span:contains('Premiered:')")[0]).next().text();
  var aired = $($("span:contains('Aired:')")[0]).parent().contents().filter(function() {
    return this.nodeType == 3;
  }).text().trim();
  var studio = $($("span:contains('Studios:')")[0]).next().text();


  // manga
  var author = $($("span:contains('Authors:')")[0]).next().text();
  // var published = $($("span:contains('Published:')")[0]).next().text();
  var published = $($("span:contains('Published:')")[0]).parent().contents().filter(function() {
    return this.nodeType == 3;
  }).text().replace(/\s+/g, ' ').trim();

  var stats = {
    name: name,
    rank: rank,
    score: score,
    season: (season != "" ? season : aired),
    published: published,
    studio: studio,
    author: author
  };
  return stats;
}

module.exports = router;