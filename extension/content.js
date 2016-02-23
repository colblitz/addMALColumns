// http://myanimelist.net/animelist/Tigress5
// http://myanimelist.net/animelist/colblitz

if (!window.jQuery) {
    console.log("no jquery");
} else {
    console.log("yeah has jquery");
}

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

var getData = function(ids) {

};

var listData = getData(ids);


var addColumn = function(name, key) {
    // adjust table width;
    // $("#list_surround").width(1100);

    // add columns
    if (isNewList) {
        var headerRow = $("tr.list-table-header");
        headerRow.append('<th class="header-title type">' + name + '</th>');

        var tableRows = $("tr.list-table-data");
        tableRows.map(function(i, el) {
            var id = parseInt($(el).next().attr('id').replace("more-", ""));
            var data = id;
            $(el).append('<td class="data ' + key + '">' + data + '</td>');
        });
    } else {
        var headers = $('[class^=header_');
        headers.map(function(i, el) {
            var headerTable = $(el).next();
            var headerRow = headerTable.find("tr");
            var headerCol = headerTable.find("td").last();

            headerRow.append('<td class="table_header" width="90" align="center" nowrap=""><strong>' + name + '</strong></td>');
        })

        var more = $('[id^=more');
        more.map(function(i, el) {
            var rowTable = $(el).prev();
            var rowRow = rowTable.find("tr");
            var rowCol = rowTable.find("td").last();

            var tdType = rowCol.attr("class");

            var id = parseInt($(el).attr('id').replace("more", ""));
            var data = id;
            rowRow.append('<td class="' + tdType + '" align="center" width="90"><span id="">' + data + '</span></td>');
        })
    }
}

setTimeout(function(){
    addColumn('Score', 'score');
}, 1000);

var sortColumn = function(name) {
    // http://stackoverflow.com/questions/7831712/jquery-sort-divs-by-innerhtml-of-children
};

var alertFromContent = function(asdf) {
    alert(asdf);
};

// chrome.runtime.onMessage.addListener(function callback)
// chrome.runtime.onMessage.addListener(
//     function(request, sender, sendResponse) {
//         console.log("alksjdflkajsdflkjalsdfjlajdlkf");
//         if (request.greeting == "hello")
//         alert("hello background");
//     }
// );

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log("got message: " + request);
    console.log(request);
    console.log(request.greeting);

    // if( request.message === "clicked_browser_action" ) {
    //   var firstHref = $("a[href^='http']").eq(0).attr("href");

    //   console.log(firstHref);
    // }
  }
);

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

//var ddd = scrapeAnime(27631);
