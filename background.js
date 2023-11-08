// background.js

// Array of URLs to check against. You can add more URLs here.
const URLS = ['linkedin.com', 'facebook.com', 'news.ycombinator.com', 'reddit.com'];

function updateActionButton(enabled) {
    if (enabled) {
        chrome.action.setBadgeText({ text: "ON" });
        chrome.action.setBadgeBackgroundColor({ color: '#0000FF' });
    } else {
        chrome.action.setBadgeText({ text: "OFF" });
        chrome.action.setBadgeBackgroundColor({ color: '#777777' });
    }
}

// This function toggles the ENABLED value in chrome storage and updates the action button
function toggleEnabled() {
    chrome.storage.local.get(['ENABLED'], function (result) {
        const currentEnabledStatus = result.ENABLED || false;
        const newEnabledStatus = !currentEnabledStatus;
        chrome.storage.local.set({ 'ENABLED': newEnabledStatus }, function () {
            updateActionButton(newEnabledStatus);
        });
    });
}

// Listen for the action click (e.g., browser action or page action click)
chrome.action.onClicked.addListener((tab) => {
    toggleEnabled();
});

toggleEnabled();

// This function checks if the URL of a tab matches any in the URLS array
function isMatchedUrl(url) {
    return URLS.some(allowedUrl => url.includes(allowedUrl));
}

// This function checks all open tabs and closes those with URLs in the URLS array
function checkAndCloseTabs() {
    chrome.tabs.query({}, function (tabs) {
        tabs.forEach(function (tab) {
            if (tab.url && isMatchedUrl(tab.url)) {
                chrome.tabs.remove(tab.id);
            }
        });
    });
}

// Listen for changes in the chrome storage
chrome.storage.onChanged.addListener(function (changes, namespace) {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
        if (key === 'ENABLED' && newValue === true) {
            checkAndCloseTabs();
        }
    }
});

// Listen for newly created tabs
chrome.tabs.onCreated.addListener(function (tab) {
    chrome.storage.local.get(['ENABLED'], function (result) {
        if (result.ENABLED && tab.url && isMatchedUrl(tab.url)) {
            chrome.tabs.remove(tab.id);
        }
    });
});

// Listen for updated tabs
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    chrome.storage.local.get(['ENABLED'], function (result) {
        if (result.ENABLED && changeInfo.url && isMatchedUrl(changeInfo.url)) {
            chrome.tabs.remove(tabId);
        }
    });
});
