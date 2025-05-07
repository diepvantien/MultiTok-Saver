/**
 * TikTok Video Downloader - Background Script
 * Date: 2025-03-12 03:42:14
 * User: diepvantien
 * Author: Diệp Văn Tiến
 * Version: 1.1.0
 */

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('TikTok Video Downloader extension installed');
});

// Listen for extension icon clicks
chrome.action.onClicked.addListener((tab) => {
  if (tab.url && tab.url.includes('tiktok.com')) {
    // Check if extractor is already running
    chrome.scripting.executeScript({
      target: {tabId: tab.id},
      function: isExtractorActive
    }).then((results) => {
      if (results[0] && results[0].result) {
        // If active, toggle UI visibility
        chrome.scripting.executeScript({
          target: {tabId: tab.id},
          function: toggleUIVisibility
        });
      } else {
        // If not active, inject and start
        chrome.scripting.executeScript({
          target: {tabId: tab.id},
          files: ['content.js']
        }).then(() => {
          chrome.scripting.executeScript({
            target: {tabId: tab.id},
            function: startExtractor,
            args: ["2025-03-12 03:42:14", "diepvantien"]
          });
        });
      }
    }).catch(error => {
      // If checking for active extractor fails, start fresh
      console.error("Error checking extractor status:", error);
      
      // Inject content script directly
      chrome.scripting.executeScript({
        target: {tabId: tab.id},
        files: ['content.js']
      }).then(() => {
        chrome.scripting.executeScript({
          target: {tabId: tab.id},
          function: startExtractor,
          args: ["2025-03-12 03:42:14", "diepvantien"]
        });
      });
    });
  } else {
    // Not on TikTok - show alert
    chrome.scripting.executeScript({
      target: {tabId: tab.id},
      function: () => {
        alert('Please navigate to a TikTok profile page to use this extension.');
      }
    });
  }
});

// Check if extractor is active
function isExtractorActive() {
  return window.tiktokExtractorActive === true;
}

// Toggle UI visibility
function toggleUIVisibility() {
  if (window.toggleTikTokUIVisibility) {
    window.toggleTikTokUIVisibility();
    return true;
  }
  return false;
}

// Start the extractor
function startExtractor(date, username) {
  if (window.startTikTokExtraction) {
    window.startTikTokExtraction(date, username);
    return true;
  }
  return false;
}