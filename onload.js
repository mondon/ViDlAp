window.addEventListener ("load", giveTabId, false);
window.addEventListener ("DOMActivate", giveTabId, false);

function giveTabId(evt) 
{
    chrome.extension.sendRequest({}, function(response) {});
}
