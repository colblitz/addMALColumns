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

console.log(ids);
