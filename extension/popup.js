document.addEventListener('DOMContentLoaded', function() {
  var button = document.getElementById('button1');
  button.addEventListener('click', function() {
    console.log("lakjsdflkjalksdjf");
    chrome.extension.getBackgroundPage().testRequest();
    // chrome.tabs.getSelected(null, function(tab) {
    //     chrome.tabs.sendRequest(tab.id, {greeting: "hello"});
    // });
  }, false);
}, false);