document.addEventListener('DOMContentLoaded', function() {
  // get state
  chrome.storage.local.get(["columns"], function(columns) {
    $('.columnCheck').each(function() {
      if (columns.columns[$(this).prop('name')]) {
        $(this).prop('checked', true);
      }
    });
  });

  // add functionality for button
  var button = document.getElementById('button1');
  button.addEventListener('click', function() {
    var columns = {};
    $('.columnCheck').each(function() {
      columns[$(this).prop('name')] = $(this).prop('checked');
    });

    chrome.extension.getBackgroundPage().testRequest(columns);
    chrome.storage.local.set({"columns": columns}, function() {
      if (chrome.runtime.lastError) {
        alert('Error setting columns:\n' + chrome.runtime.lastError);
      }
    });
  }, false);

  // add functionality for button
  var button2 = document.getElementById('button2');
  button2.addEventListener('click', function() {
    chrome.extension.getBackgroundPage().testButton();
  }, false);
}, false);