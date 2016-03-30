// http://myanimelist.net/animelist/Tigress5
// http://myanimelist.net/animelist/colblitz

String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

if (!window.jQuery) {
    console.log("no jquery");
} else {
    console.log("yeah has jquery");
}

console.log(window.location.href);

var isAnimeList = true;
var type = "anime";

var testType = function() {
    if (window.location.href.includes("mangalist")) {
        isAnimeList = false;
        type = "manga";
    }
};

var testNewList = function() {
    if ($(".header-menu").length) {
        console.log("has header menu");
        return true;
    } else {
        console.log("no header menu");
        return false;
    }
};

var isNewList = testNewList();

var getListIds = function() {
    var ids;
    if (isNewList) {
        var data = $('table.list-table').data();
        ids = data["items"].map(function(o) { return o["anime_id"]; });
    } else {
        var more = $('[id^=more');
        ids = more.map(function(i, el) { return parseInt($(el).attr('id').replace("more", "")); });
    }
    return ids;
};

var ids = getListIds();
console.log(ids);

var getData = function(ids) {
  console.log("data:");
  console.log({"ids": ids, "type": type});
  // TODO: fix de-param-ing in server
  // http://benalman.com/news/2009/12/jquery-14-param-demystified/
  $.ajaxSetup({ traditional: true });
  $.ajax({
    type: 'POST',
    url: "http://www.malcolumns.site/requestData",
    data: {"ids": ids, "type": type},
    success: function(data) {
      console.log("got data: ", data);
      listData = data.content.data;
    }
  });
};

var listData = getData(ids);

var columns = {};

var columnToField = {
  "season": "premiered",
  "studio": "studios",
  "score": "score",
  "rank": "rank",
  "author": "author"
};


var getDataForColumn = function(id, column) {
  var field = columnToField[column];
  console.log("gettingDataForColumn: ", id, " ", column, " ", field);
  if (listData != null) {
    console.log(listData[id]);
    return listData[id][field];
  } else {
    console.log("null list data");
    return "";
  }
};

var addColumn = function(name) {
    // adjust table width;
    // $("#list_surround").width(1100);
    var allItems = []
    // add columns
    if (isNewList) {
        var headerRow = $("tr.list-table-header");
        headerRow.append('<th class="header-title type">' + name.capitalizeFirstLetter() + '</th>');

        var tableRows = $("tr.list-table-data");
        tableRows.map(function(i, el) {
            var id = parseInt($(el).next().attr('id').replace("more-", ""));
            var data = getDataForColumn(id, name);
            $(el).append('<td class="data-' + name + '">' + data + '</td>');
        });
    } else {
        var headers = $('[class^=header_');
        headers.map(function(i, el) {
            var headerTable = $(el).next();
            var headerRow = headerTable.find("tr");
            var headerCol = headerTable.find("td").last();

            var newCell = $('<td class="table_header" width="90" align="center" nowrap=""><strong>' + name.capitalizeFirstLetter() + '</strong></td>');
            headerRow.append(newCell);
            allItems.push(newCell);
        })

        var more = $('[id^=more');
        more.map(function(i, el) {
            var rowTable = $(el).prev();
            var rowRow = rowTable.find("tr");
            var rowCol = rowTable.find("td").last();

            var tdType = rowCol.attr("class");

            var id = parseInt($(el).attr('id').replace("more", ""));
            var data = getDataForColumn(id, name);
            var newCell = $('<td class="' + tdType + '" align="center" width="90"><span id="">' + data + '</span></td>');
            rowRow.append(newCell);
            allItems.push(newCell);
        })
    }

    columns[name] = allItems;
};

var showColumn = function(colName, show) {
  console.log("showing column: " + colName);
  console.log(columns);
  if (colName in columns) {
    if (show) {
      columns[colName].forEach(function(el, i) {
        $(el).show();
      });
    } else {
      columns[colName].forEach(function(el, i) {
        $(el).hide();
      });
    }
  } else {
    if (show) {
      addColumn(colName);
    } else {
      // nothing
    }
  }
};

// TODO: Blech
// addColumn("season");
// addColumn("studio");
// addColumn("score");
// addColumn("rank");

// showColumn("season", false);
// showColumn("studio", false);
// showColumn("score", false);
// showColumn("rank", false);

setTimeout(function(){
    //addColumn('Score', 'score');
    addColumn("season");
addColumn("studio");
addColumn("score");
addColumn("rank");

showColumn("season", false);
showColumn("studio", false);
showColumn("score", false);
showColumn("rank", false);
}, 1000);

var sortColumn = function(name) {
    // http://stackoverflow.com/questions/7831712/jquery-sort-divs-by-innerhtml-of-children
};

var alertFromContent = function(asdf) {
    alert(asdf);
};

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.type == "columns") {
      console.log("got " + JSON.stringify(request.columns));
      for (var colName in request.columns) {
        console.log("want column " + colName + ": " + request.columns[colName]);
        showColumn(colName, request.columns[colName]);
      }
    } else if (request.type == "test") {
      console.log("test");
      $.ajax({
        url: "/requestAnime",
        type: "POST",
        data: {ids: [1, 2, 3]},
        success: function(data) {
          console.log("response:");
          console.log(data);
        },
        error: function() {
          console.log("error");
        }
      });
    }
  }
);