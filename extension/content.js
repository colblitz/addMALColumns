// add listener

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.type == "columns") {
      showColumns(request.columns);
    }
  }
);

// util methods

String.prototype.capitalizeFirstLetter = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

var isAnimeList = function() {
  return window.location.href.indexOf("mangalist") == -1;
};

var isNewList = function() {
  return $(".header-menu").length ? true : false;
};

var getField = function(columnId) {
  return columnId.slice(2);
};

var getHeader = function(columnId) {
  return columnId.slice(2).capitalizeFirstLetter();
};

var getClass = function(columnId) {
  return "amc-" + columnId.slice(2);
};

// main methods

var getListIds = function() {
  var ids = [];
  if (newList) {
    var data = $('table.list-table').data();
    data["items"].forEach(function(o) {
      ids.push(o["anime_id"]);
    });
  } else {
    var more = $('[id^=more]');
    more.each(function(i, el) {
      ids.push(parseInt($(el).attr('id').replace("more", "")));
    });
  }
  // todo make this an array
  return ids;
};

var getData = function(ids) {
  // TODO: fix de-param-ing in server
  // http://benalman.com/news/2009/12/jquery-14-param-demystified/
  $.ajaxSetup({ traditional: true });
  $.ajax({
    type: 'POST',
    url: "http://www.malcolumns.site/requestData",
    data: {
      "ids": ids,
      "type": type
    },
    success: function(data) {
      listData = data.content.data;
      console.log(listData);
      refillColumns(listData);
    }
  });
};

var refillColumns = function(listData) {
  for (cName in columns) {
    var field = getField(cName);
    for (id in listData) {
      columns[cName][id].text(listData[id][field]);
    }
  }
};

var getDataForColumn = function(id, column) {
  var field = getField(column);
  if (listData != null) {
    return listData[id][field];
  } else {
    // console.log("null list data");
    return "";
  }
};

var columnWidths = {
  "a-season": 90,
  "a-studio": 100,
  "a-score": 45,
  "a-rank": 50,
  "m-published": 175,
  "m-author": 115,
  "m-score": 45,
  "m-rank": 50
}

var addColumn = function(columnName) {
  var allItems = {};
  var cField = getField(columnName);
  var cHeader = getHeader(columnName);
  var cClass = getClass(columnName);
  var cWidth = columnWidths[columnName];
  headers[columnName] = [];
  // add columns
  if (newList) {
    var headerRow = $("tr.list-table-header");
    var headerCell = $('<th class="header-title ' + cClass + '">' + cHeader + '</th>');
    headerRow.append(headerCell);
    headers[columnName].push(headerCell);

    var tableRows = $("tr.list-table-data");
    tableRows.map(function(i, el) {
      var id = parseInt($(el).next().attr('id').replace("more-", ""));
      // var data = id;
      var data = getDataForColumn(id, columnName);
      var newCell = $('<td class="data ' + cClass + '">' + data + '</td>');
      allItems[id] = newCell;
      $(el).append(newCell);
    });
  } else {
    var headerRows = $('[class^=header_');
    headerRows.map(function(i, el) {
      var headerTable = $(el).next();
      var headerRow = headerTable.find("tr");
      var headerCol = headerTable.find("td").last();

      var newCell = $('<td class="table_header" width="' + cWidth + '" align="center" nowrap=""><strong>' + cHeader + '</strong></td>');
      headerRow.append(newCell);
      headers[columnName].push(newCell);
      // TODO: ??
      // allItems.push(newCell);
    })

    var more = $('[id^=more');
    more.map(function(i, el) {
      var rowTable = $(el).prev();
      var rowRow = rowTable.find("tr");
      var rowCol = rowTable.find("td").last();

      var tdType = rowCol.attr("class");

      var id = parseInt($(el).attr('id').replace("more", ""));
      var data = getDataForColumn(id, columnName);
      var newCell = $('<td class="' + tdType + ' ' + cClass + '" align="center" width="' + cWidth + '"><span id="">' + data + '</span></td>');
      rowRow.append(newCell);
      allItems[id] = newCell;
    })
  }

  columns[columnName] = allItems;
};

var showColumns = function(colNames, show) {
  shownColumns = [];
  for (colName in columns) {
    if (colNames == null || colName in colNames) {
      var shouldShow = show;
      if (show == null) {
        shouldShow = colNames[colName];
      }
      for (id in columns[colName]) {
        $(columns[colName][id]).toggle(shouldShow);
      }
      for (i in headers[colName]) {
        headers[colName][i].toggle(shouldShow);
      }
      if (shouldShow) {
        shownColumns.push(colName);
      }
    }
  }
  // TODO: fix - can't use incremental every time
  // fixTableWidth();
};

var sortColumn = function(name) {
  // http://stackoverflow.com/questions/7831712/jquery-sort-divs-by-innerhtml-of-children
};

var initializeColumns = function() {
  if (type == "anime") {
    addColumn("a-season");
    addColumn("a-studio");
    addColumn("a-score");
    addColumn("a-rank");
  } else {
    addColumn("m-published");
    addColumn("m-author");
    addColumn("m-score");
    addColumn("m-rank");
  }
  showColumns(null, true);
};

var incrementWidth = function(x, n) {
  x.width(x.width() + n);
};

var fixTableWidth = function() {


  var newColumns = 0;
  for (colName in shownColumns) {
    newColumns += columnWidths[shownColumns[colName]];
  }
  // if (type == "anime") {
  //   newColumns = columnWidths["a-season"] +
  //                columnWidths["a-studio"] +
  //                columnWidths["a-score"] +
  //                columnWidths["a-rank"];
  // } else {
  //   newColumns = columnWidths["m-published"] +
  //                columnWidths["m-author"] +
  //                columnWidths["m-score"] +
  //                columnWidths["m-rank"];
  // }

  if (newList) {
    // $(".header").width()
    // $("#list-container").width()
    // $(".cover-block").width()
    // $(".cover-block .image-container").width()
    // $(".status-menu-container").width()
    // $(".list-unit").width()
    // $(".list-unit .list-status-title").width()
    // $(".list-unit .list-stats").width()



  } else {
    // $("#list_surround").width(1200);
    // incrementWidth($("#list_surround"), newColumns);
    // $("#list_surround").width($("#list_surround").width() + newColumns);

    // 920 -> 1100
    // if ($('#list_surround').css('width') == null ) {
    //   console.log("no custom css");
    //   ;
    // }
  }
}

// initialize things

var type = isAnimeList() ? "anime" : "manga";
var newList = isNewList();
var ids = getListIds();
// console.log("type: ", type);
// console.log("isNewList: ", newList);
// console.log("ids: ", ids);
var columns = {};
var headers = {};
var listData = null;
var shownColumns = [];

setTimeout(function() {
  initializeColumns();

  // request to get data
  console.log("1");
  listData = getData(ids);
  console.log("2");
  refillColumns(listData);
  console.log("3");

  chrome.storage.local.get(["columns"], function(columns) {
    console.log("from storage columns: ", columns);
    showColumns(columns.columns);
  });
}, 50);

// TODO: adjust table, check for custom CSS
// fixTableWidth();
incrementWidth($("#list_surround"), 300);

incrementWidth($(".header"), 300);
incrementWidth($("#list-container"), 300);
incrementWidth($(".cover-block"), 300);
incrementWidth($(".cover-block .image-container"), 300);
incrementWidth($(".status-menu-container"), 300);
incrementWidth($(".list-unit"), 300);
incrementWidth($(".list-unit .list-status-title"), 300);
incrementWidth($(".list-unit .list-stats"), 300);