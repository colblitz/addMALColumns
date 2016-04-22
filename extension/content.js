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
  return "" + columnId.slice(2);
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

function sortUsingCustom(parent, childSelector, sortFunction) {
  var items = parent.children(childSelector).sort(sortFunction);
  parent.append(items);
};

var months = {
  "Jan" : "01",
  "Feb" : "02",
  "Mar" : "03",
  "Apr" : "04",
  "May" : "05",
  "Jun" : "06",
  "Jul" : "07",
  "Aug" : "08",
  "Sep" : "09",
  "Oct" : "10",
  "Nov" : "11",
  "Dec" : "12"
};

var seasons = {
  "Spring" : "04",
  "Summer" : "07",
  "Fall"   : "10",
  "Winter" : "01"
};

var getColumnSortValue = function(v, columnName) {
  // score/rank
  if (!isNaN(parseFloat(v))) {
    return parseFloat(v);
  }
  if (columnName.indexOf("season") > -1 || columnName.indexOf("published") > -1) {
    // only use first part of ranges
    if (v.indexOf("to") > -1) {
      v = v.split("to")[0].trim();
    }
    // is date, else is season
    if (v.indexOf(",") > -1) {
      var year = v.split(",")[1].trim();
      var mon = v.split(",")[0].trim().split(" ")[0].trim();
      var day = v.split(",")[0].trim().split(" ")[1].trim();
      v = year + months[mon] + day;
    } else {
      var year = v.split(" ")[1].trim();
      var season = v.split(" ")[0].trim();
      v = year + seasons[season];
    }
    return v;
  }
  return v;
};

var columnFunction = function(columnName) {
  return function() {
    sortUsingCustom($('.list-table'), "tbody.list-item", function(a, b) {
      var vA = getColumnSortValue($("td." + columnName, a).text(), columnName);
      var vB = getColumnSortValue($("td." + columnName, b).text(), columnName);
      return columnSortDir[columnName] * ((vA < vB) ? -1 : (vA > vB) ? 1 : 0);
    });
    columnSortDir[columnName] *= -1;
  };
};

var columnSortDir = {};

var flatten = function(a) {
  return $.map(a, function(n){
   return n;
  });
};

var insertListAfter = function(a, l) {
  var attach = a;
  for (var i = 0; i < l.length; i++) {
    $(l[i]).insertAfter($(attach));
    attach = l[i];
  }
};

var columnLists = {};
var columnAttach = {};
var getColumnLists = function() {

  var rows = $('#list_surround table');
  var currentChunk = "";
  var chunk = [];
  var attachRow;
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var isRow = $(row).next().is('[id^=more');
    if (!isRow) {
      if ($(row).is('[class^=header_')) {
        attachRow = $(row).next();
        currentChunk = $(row).attr('class');
      }

      if (chunk.length != 0) {
        columnLists[currentChunk] = chunk.slice();
        columnAttach[currentChunk] = attachRow;
        chunk = [];
      }
    } else {
      chunk.push([$(row), $(row).next()]);
    }
  }
};

var oldColumnFunction = function(sectionName, columnName) {
  return function() {
    // sort things
    columnLists[sectionName].sort(function(a, b) {
      var vA = getColumnSortValue($(a[0]).find('td.' + columnName).text(), columnName);
      var vB = getColumnSortValue($(b[0]).find('td.' + columnName).text(), columnName);
      return columnSortDir[columnName] * ((vA < vB) ? -1 : (vA > vB) ? 1 : 0);
    });
    columnSortDir[columnName] *= -1;
    // detach things
    for (var i = 0; i < columnLists[sectionName].length; i++) {
      columnLists[sectionName][i][0].detach();
      columnLists[sectionName][i][1].detach();
    }
    // get copy of things and redo styling
    var toInsert = flatten(columnLists[sectionName]);
    var newClass = "td1";
    for (var i = 0; i < toInsert.length; i ++) {
      // only table elements, not more divs
      if ($(toInsert[i]).is('table')) {
        $(toInsert[i]).find('td').removeClass("td1 td2").addClass(newClass);
        newClass = (newClass == "td1" ? "td2" : "td1");
      }
    }
    // insert (copy of) things back in
    insertListAfter(columnAttach[sectionName], toInsert);
  };
};


var addColumn = function(columnName) {
  var allItems = {};
  var cField = getField(columnName);
  var cHeader = getHeader(columnName);
  var cClass = getClass(columnName);
  var cWidth = columnWidths[columnName];
  columnSortDir[cField] = 1;
  headers[columnName] = [];
  // add columns
  if (newList) {
    var headerRow = $("tr.list-table-header");
    var headerId = "header-link-" + cHeader;
    var headerCell = $('<th class="header-title ' + cClass + '"><a id="' + headerId + '" class="link sort">' + cHeader + '</a></th>');

    $(headerCell).click(function() {
      columnFunction(cField).call();
    });

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

      $(newCell).click(function() {
        oldColumnFunction($(el).attr('class'), cField).call();
      });

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

      var tdType = rowCol.attr("class").split(' ')[0];

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

// initialize things

var type = isAnimeList() ? "anime" : "manga";
var newList = isNewList();
var ids = getListIds();
var columns = {};
var headers = {};
var listData = null;
var shownColumns = [];

setTimeout(function() {
  if (!newList) {
    getColumnLists();
  }
  initializeColumns();

  // request to get data
  listData = getData(ids);
  refillColumns(listData);

  chrome.storage.local.get(["columns"], function(columns) {
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