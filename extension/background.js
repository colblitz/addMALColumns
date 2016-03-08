// http://stackoverflow.com/questions/11752341/chrome-extension-communication-between-content-script-and-background-html

function testRequest(columnsVar) {
    chrome.tabs.getSelected(null, function(tab) {
    	chrome.tabs.sendMessage(tab.id, {type: "columns", columns: columnsVar});
    });
}

function testButton() {
    chrome.tabs.getSelected(null, function(tab) {
    	chrome.tabs.sendMessage(tab.id, {type: "test"});
    });
}