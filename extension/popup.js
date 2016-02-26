document.addEventListener('DOMContentLoaded', function() {
  var button = document.getElementById('button1');
  button.addEventListener('click', function() {
    console.log("lakjsdflkjalksdjf");

    var columns = {};
    $('.columnCheck').each(function() {
      columns[$(this).prop('name')] = $(this).prop('checked');
    });
    console.log(columns);

    chrome.extension.getBackgroundPage().testRequest();
    // chrome.tabs.getSelected(null, function(tab) {
    //     chrome.tabs.sendRequest(tab.id, {greeting: "hello"});
    // });
  }, false);
}, false);