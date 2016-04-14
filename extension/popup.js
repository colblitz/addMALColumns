document.addEventListener('DOMContentLoaded', function() {
  // get state
  chrome.storage.local.get(["columns"], function(columns) {
    $('.columnCheck').each(function() {
      if (columns.columns[$(this).prop('name')]) {
        $(this).prop('checked', true);
      }
    });
  });

  var getState = function() {
    var columns = {};
    $('.columnCheck').each(function() {
      columns[$(this).prop('name')] = $(this).prop('checked');
    });
    return columns;
  }

  var saveState = function() {
    var columns = getState();
    chrome.storage.local.set({
      "columns": columns
    }, function() {
      if (chrome.runtime.lastError) {
        alert('Error setting columns:\n' + chrome.runtime.lastError);
      }
    });
  };

  // Add button functionality
  var button = document.getElementById('button');
  button.addEventListener('click', function() {
    chrome.extension.getBackgroundPage().testRequest(getState());
    saveState();
  }, false);

  var checkAll = document.getElementById('button-select-all');
  checkAll.addEventListener('click', function() {
    $('.columnCheck').each(function() {
      $(this).prop('checked', true);
    });
    saveState();
  });

  var uncheckAll = document.getElementById('button-deselect-all');
  uncheckAll.addEventListener('click', function() {
    $('.columnCheck').each(function() {
      $(this).prop('checked', false);
    });
    saveState();
  });

}, false);