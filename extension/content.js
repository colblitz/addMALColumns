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
    console.log("null list data");
    return "";
  }
};

var addColumn = function(columnName) {
  // adjust table width;
  // $("#list_surround").width(1100);
  var allItems = {};
  var cField = getField(columnName);
  var cHeader = getHeader(columnName);
  var cClass = getClass(columnName);
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

      var newCell = $('<td class="table_header" width="90" align="center" nowrap=""><strong>' + cHeader + '</strong></td>');
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
      var newCell = $('<td class="' + tdType + ' ' + cClass + '" align="center" width="90"><span id="">' + data + '</span></td>');
      rowRow.append(newCell);
      allItems[id] = newCell;
    })
  }

  columns[columnName] = allItems;
};

var showColumns = function(colNames, show) {
  for (colName in columns) {
    if (colNames == null || colName in colNames) {
      for (id in columns[colName]) {
        $(columns[colName][id]).toggle(show);
      }
      for (i in headers[colName]) {
        headers[colName][i].toggle(show);
      }
    }
  }
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

// initialize things

var type = isAnimeList() ? "anime" : "manga";
var newList = isNewList();
var ids = getListIds();
console.log("type: ", type);
console.log("isNewList: ", newList);
console.log("ids: ", ids);
var columns = {};
var headers = {};
var listData = null;

setTimeout(function() {
  initializeColumns();

  // request to get data
  listData = getData(ids);
  refillColumns(listData);
}, 500);
