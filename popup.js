/**
 * TikTok Video Downloader - Popup Script
 * Date: 2025-03-12 01:57:27
 * User: diepvantien2
 */
document.addEventListener('DOMContentLoaded', function() {
  // Get UI elements
  const startExtractionBtn = document.getElementById('start-extraction');
  const downloadLinksBtn = document.getElementById('download-links');
  const copyLinksBtn = document.getElementById('copy-links');
  const stopScrollBtn = document.getElementById('stop-scroll');
  const statusMessage = document.getElementById('status-message');
  const captureRatio = document.getElementById('capture-ratio');
  const progressBar = document.getElementById('progress-bar');
  const completionStatus = document.getElementById('completion-status');
  const currentProfile = document.getElementById('current-profile');
  const videosCount = document.getElementById('videos-count');
  
  // Check if we're on TikTok
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentTab = tabs[0];
    
    if (!currentTab || !currentTab.url || !currentTab.url.includes('tiktok.com')) {
      statusMessage.textContent = 'Please open a TikTok profile';
      startExtractionBtn.classList.add('disabled');
      completionStatus.textContent = 'Please navigate to a TikTok profile';
      currentProfile.textContent = 'N/A';
      return;
    }
    
    // Extract profile name from URL
    try {
      const url = new URL(currentTab.url);
      const pathParts = url.pathname.split('/').filter(p => p);
      if (pathParts.length > 0 && pathParts[0].startsWith('@')) {
        currentProfile.textContent = pathParts[0];
      } else {
        currentProfile.textContent = 'Unknown';
      }
    } catch (e) {
      currentProfile.textContent = 'Unknown';
    }
    
    // Check if extraction is already active
    chrome.scripting.executeScript({
      target: {tabId: currentTab.id},
      function: isExtractionActive
    }).then((results) => {
      if (results && results[0] && results[0].result) {
        startExtractionBtn.textContent = 'Extraction Active';
        startExtractionBtn.classList.add('disabled');
        downloadLinksBtn.classList.remove('disabled');
        copyLinksBtn.classList.remove('disabled');
        stopScrollBtn.classList.remove('disabled');
        updateStatus();
      }
    }).catch((error) => {
      console.log('Extraction not active yet');
    });
  });
  
  // Start extraction button
  startExtractionBtn.addEventListener('click', function() {
    if (startExtractionBtn.classList.contains('disabled')) return;
    
    startExtractionBtn.textContent = 'Starting...';
    startExtractionBtn.disabled = true;
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentTab = tabs[0];
      if (!currentTab) return;
      
      chrome.scripting.executeScript({
        target: {tabId: currentTab.id},
        files: ['content.js']
      }).then(() => {
        // After script is injected, send a message to start extraction
        chrome.scripting.executeScript({
          target: {tabId: currentTab.id},
          function: startExtraction,
          args: ['2025-03-12 01:57:27', 'diepvantien2']
        }).then(() => {
          startExtractionBtn.textContent = 'Extraction Active';
          startExtractionBtn.classList.add('disabled');
          downloadLinksBtn.classList.remove('disabled');
          copyLinksBtn.classList.remove('disabled');
          stopScrollBtn.classList.remove('disabled');
          updateStatus();
        });
      }).catch(error => {
        console.error('Error injecting script:', error);
        startExtractionBtn.textContent = 'Retry';
        startExtractionBtn.disabled = false;
      });
    });
  });
  
  // Download links button
  downloadLinksBtn.addEventListener('click', function() {
    if (downloadLinksBtn.classList.contains('disabled')) return;
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        function: downloadLinks
      });
    });
  });
  
  // Copy links button
  copyLinksBtn.addEventListener('click', function() {
    if (copyLinksBtn.classList.contains('disabled')) return;
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        function: copyLinks
      });
    });
  });
  
  // Stop scroll button
  stopScrollBtn.addEventListener('click', function() {
    if (stopScrollBtn.classList.contains('disabled')) return;
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        function: toggleScrolling
      }).then((results) => {
        if (results && results[0] && results[0].result) {
          stopScrollBtn.textContent = results[0].result ? 'Start Scroll' : 'Stop Scroll';
        }
      });
    });
  });
  
  // Update status of extraction
  function updateStatus() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        function: getExtractionStatus
      }).then((results) => {
        if (results && results[0] && results[0].result) {
          const status = results[0].result;
          
          // Update UI with status info
          videosCount.textContent = `${status.found}/${status.total}`;
          captureRatio.textContent = `${status.percentage}%`;
          progressBar.style.width = `${status.percentage}%`;
          statusMessage.textContent = status.message;
          completionStatus.textContent = status.completionText;
          
          // Adjust buttons
          stopScrollBtn.textContent = status.isScrolling ? 'Stop Scroll' : 'Start Scroll';
          
          // Schedule next update
          setTimeout(updateStatus, 1000);
        }
      });
    });
  }
});

// Check if extraction is active
function isExtractionActive() {
  return window.tiktokExtractorActive === true;
}

// Start extraction
function startExtraction(date, username) {
  if (window.startTikTokExtraction) {
    window.startTikTokExtraction(date, username);
    return true;
  }
  return false;
}

// Download links
function downloadLinks() {
  if (window.downloadTikTokLinks) {
    window.downloadTikTokLinks();
    return true;
  }
  return false;
}

// Copy links
function copyLinks() {
  if (window.copyTikTokLinks) {
    window.copyTikTokLinks();
    return true;
  }
  return false;
}

// Toggle scrolling
function toggleScrolling() {
  if (window.toggleTikTokScrolling) {
    return window.toggleTikTokScrolling();
  }
  return false;
}

// Get extraction status
function getExtractionStatus() {
  if (window.getTikTokExtractionStatus) {
    return window.getTikTokExtractionStatus();
  }
  return null;
}