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

  var aCheckAll = document.getElementById('a-button-select-all');
  aCheckAll.addEventListener('click', function() {
    $('.aColumnCheck').each(function() {
      $(this).prop('checked', true);
    });
    saveState();
  });

  var aUncheckAll = document.getElementById('a-button-deselect-all');
  aUncheckAll.addEventListener('click', function() {
    $('.aColumnCheck').each(function() {
      $(this).prop('checked', false);
    });
    saveState();
  });

  var mCheckAll = document.getElementById('m-button-select-all');
  mCheckAll.addEventListener('click', function() {
    $('.mColumnCheck').each(function() {
      $(this).prop('checked', true);
    });
    saveState();
  });

  var mUncheckAll = document.getElementById('m-button-deselect-all');
  mUncheckAll.addEventListener('click', function() {
    $('.mColumnCheck').each(function() {
      $(this).prop('checked', false);
    });
    saveState();
  });

}, false);