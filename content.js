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

if (isNewList) {
    var data = $('table.list-table').data();
    var ids = data["items"].map(function(o) { return o["anime_id"]; });
} else {
    var more = $('[id^=more');
    var ids = more.map(function(i, el) { return parseInt($(el).attr('id').replace("more", "")); });
}

if (isNewList) {

} else {
    $("#list_surround").width(1100);
    var headers = $('[class^=header_');
    headers.map(function(i, el) {
        var headerTable = $(el).next();
        var headerRow = headerTable.find("tr");
        var headerCol = headerTable.find("td").last();

        headerRow.append('<td class="table_header" width="70" align="center" nowrap=""><strong>Tags</strong></td>');
        headerRow.append('<td class="table_header" width="70" align="center" nowrap=""><strong>Tags</strong></td>');
        headerRow.append('<td class="table_header" width="70" align="center" nowrap=""><strong>Tags</strong></td>');
    })

    var more = $('[id^=more');
    more.map(function(i, el) {
        var rowTable = $(el).prev();
        var rowRow = rowTable.find("tr");
        var rowCol = rowTable.find("td").last();
        
        var tdType = rowCol.attr("class");
        rowRow.append('<td class="' + tdType + '" align="center" width="70"><span id=""></span></td>');
        rowRow.append('<td class="' + tdType + '" align="center" width="70"><span id=""></span></td>');
        rowRow.append('<td class="' + tdType + '" align="center" width="70"><span id=""></span></td>');
    })
}

console.log(ids);
