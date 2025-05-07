/**
 * TikTok Original Quality Video Downloader - Content Script
 * Date: 2025-03-12 03:42:14
 * User: diepvantien
 * Author: Diệp Văn Tiến
 * Version: 1.1.0
 */
(function() {
  // Check if already injected
  if (window.tiktokExtractorActive === true) {
    console.log('TikTok extractor already active');
    return;
  }
  
  // Set up global variables for API access
  window.tiktokExtractorActive = false;
  window.startTikTokExtraction = startExtraction;
  window.toggleTikTokUIVisibility = toggleUIVisibility;
  
  // State variables
  let videoCollection = [];  // Stores all found videos
  let videoElements = [];    // Stores video elements on page
  let totalVideos = 0;       // Total videos found
  let isScrolling = false;   // Auto-scroll state
  let scrollInterval = null; // Interval handle
  let isComplete = false;    // Whether extraction is complete
  let uiContainer = null;    // Reference to UI container
  let currentDate = "";      // Current date string
  let currentUser = "";      // Current username
  let uiVisible = true;      // Whether UI is visible
  let foundSameCount = 0;    // Counter for finding same number of videos
  let previousVideoCount = 0;// Previous number of videos found
  let fullPageScansCount = 0;// Count of full page scans
  let seenVideoIds = new Set(); // Track seen video IDs to prevent duplicates
  
  // Author and donation information
  const authorInfo = {
    name: "Diệp Văn Tiến",
    momo: "https://me.momo.vn/OeIGiJsViJfDfntmiRId",
    bank: "Vietinbank: 109866849450"
  };
  
  // Extract profile username from URL
  let profileUsername = location.pathname.split('/')[1];
  if (profileUsername && profileUsername.startsWith('@')) {
    profileUsername = profileUsername.substring(1);
  } else {
    profileUsername = 'tiktok';
  }
  
  // Auto-scroll configuration
  const scrollConfig = {
    scrollInterval: 1500,     // Time between scrolls
    scrollAmount: 800,        // Amount to scroll each time
    noNewVideoLimit: 5,       // Stop after this many scrolls without new videos
    scrollsWithNoNewVideos: 0,
    extraScanAttempts: 2      // Reduced number of extra scans
  };
  
  // Toggle UI visibility
  function toggleUIVisibility() {
    if (!uiContainer) {
      createUI();
      return;
    }
    
    uiVisible = !uiVisible;
    uiContainer.style.display = uiVisible ? 'block' : 'none';
  }
  
  // Start extraction process
  function startExtraction(date, username) {
    // Set current date and username
    currentDate = date || "2025-03-12 03:42:14";
    currentUser = username || "diepvantien";
    
    console.log(`Starting TikTok extraction for ${profileUsername} by ${currentUser}`);
    
    // Create UI and start scrolling
    createUI();
    startAutoScroll();
    
    // Mark as active
    window.tiktokExtractorActive = true;
  }
  
  // Create UI container
  function createUI() {
    if (uiContainer) {
      uiContainer.style.display = 'block';
      uiVisible = true;
      return;
    }
    
    uiContainer = document.createElement('div');
    uiContainer.id = 'tiktok-original-downloader';
    uiContainer.style = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0,0,0,0.9);
      color: white;
      width: 350px;
      padding: 15px;
      border-radius: 10px;
      font-family: Arial, sans-serif;
      z-index: 9999999;
      box-shadow: 0 4px 15px rgba(0,0,0,0.5);
    `;
    
    // Add UI content
    uiContainer.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h3 style="margin: 0; font-size: 16px;">TikTok Original Video Downloader</h3>
        <div style="font-size: 12px; padding: 2px 6px; background: #2d3748; border-radius: 4px; color: #63b3ed;">
          @${profileUsername}
        </div>
      </div>
      
      <div style="margin-bottom: 10px; padding: 5px; border-radius: 4px; background: #2d3748; font-size: 12px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
          <span>Videos on Page:</span>
          <span style="color: #4ade80;" id="page-videos-count">0</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>Links Found:</span>
          <span style="color: #4ade80;" id="found-links-count">0</span>
        </div>
      </div>
      
      <div style="display: flex; justify-content: space-between; margin: 8px 0;">
        <div id="status-message" style="font-size: 13px;">Auto-scrolling in progress...</div>
        <div id="capture-ratio" style="color: #48bb78; font-size: 13px;">0%</div>
      </div>
      
      <div style="background: #2d3748; height: 6px; border-radius: 3px; margin: 8px 0;">
        <div id="progress-bar" style="background: #48bb78; height: 6px; width: 0%; border-radius: 3px; transition: width 0.3s;"></div>
      </div>
      
      <div style="background: #1a202c; border-radius: 6px; padding: 10px; margin: 10px 0; text-align: center; font-size: 13px;">
        <div style="margin-bottom: 5px; color: #a0aec0;">Extraction Progress</div>
        <div id="extraction-summary" style="color: #4ade80; font-weight: bold;">
          Searching for videos...
        </div>
      </div>
      
      <div id="action-buttons" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px;">
        <button id="download-links-ui" style="padding: 8px; background: #2563eb; border: none; color: white; border-radius: 4px; cursor: pointer;">
          Download Links (.txt)
        </button>
        <button id="copy-links-ui" style="padding: 8px; background: #8b5cf6; border: none; color: white; border-radius: 4px; cursor: pointer;">
          Copy All Links
        </button>
        <button id="toggle-scroll-ui" style="padding: 8px; background: #d69e2e; border: none; color: white; border-radius: 4px; cursor: pointer;">
          Stop Auto-Scroll
        </button>
        <button id="close-ui" style="padding: 8px; background: #e53e3e; border: none; color: white; border-radius: 4px; cursor: pointer;">
          Close
        </button>
      </div>
      
      <div style="margin-top: 10px; padding: 8px; background: #1a202c; border-radius: 6px; font-size: 11px; color: #a0aec0;">
        <div style="margin-bottom: 5px; color: #a0aec0;">Author: ${authorInfo.name}</div>
        <div style="margin-bottom: 3px;">
          <span>Momo:</span> 
          <a href="${authorInfo.momo}" target="_blank" style="color: #63b3ed; text-decoration: none;">Donate via Momo</a>
        </div>
        <div style="color: #a0aec0;">${authorInfo.bank}</div>
      </div>
      
      <div style="margin-top: 8px; font-size: 11px; color: #a0aec0; line-height: 1.4;">
        <span id="completion-status">Auto-scrolling to find videos (0%)...</span>
      </div>
    `;
    
    document.body.appendChild(uiContainer);
    
    // Add event listeners for UI buttons
    document.getElementById('download-links-ui').addEventListener('click', downloadLinksFile);
    document.getElementById('copy-links-ui').addEventListener('click', copyAllLinks);
    document.getElementById('toggle-scroll-ui').addEventListener('click', toggleScrolling);
    document.getElementById('close-ui').addEventListener('click', toggleUIVisibility);
    
    updateUI();
    uiVisible = true;
  }
  
  // Extract video ID from URL
  function extractVideoId(url) {
    try {
      const match = url.match(/\/video\/(\d+)/);
      return match && match[1] ? match[1] : '';
    } catch (e) {
      return '';
    }
  }
  
  // Is this URL a valid TikTok video URL?
  function isValidTikTokVideo(url) {
    // Check if URL is a string
    if (typeof url !== 'string') return false;
    
    // Check if it's a TikTok URL and has /video/ path
    return url.includes('tiktok.com/') && 
           url.includes('/video/') &&
           !url.includes('/tag/') &&
           !url.includes('/music/') &&
           !url.includes('/trending/');
  }
  
  // Get original download URL for video ID
  function getOriginalDownloadUrl(videoId) {
    return `https://tikwm.com/video/media/hdplay/${videoId}.mp4`;
  }
  
  // Find all videos on the page - improved accuracy
  function findVideoElements() {
    // Primary approach: find all links that go to videos
    const allVideoLinks = Array.from(document.querySelectorAll('a[href*="/video/"]'))
      .filter(a => isValidTikTokVideo(a.href));
    
    const validVideoUrls = [];
    
    // Process found links
    allVideoLinks.forEach(link => {
      if (link && link.href) {
        // Extract video ID
        const videoId = extractVideoId(link.href);
        
        // Only add new, valid video IDs
        if (videoId && !seenVideoIds.has(videoId)) {
          seenVideoIds.add(videoId);
          validVideoUrls.push({
            url: link.href,
            id: videoId
          });
        }
      }
    });
    
    // Update total videos count - this is the count of unique video IDs we've seen
    const oldCount = videoCollection.length;
    
    // Add new videos to collection
    validVideoUrls.forEach(video => {
      videoCollection.push({
        id: video.id,
        pageUrl: video.url,
        originalUrl: getOriginalDownloadUrl(video.id)
      });
    });
    
    // Set total videos to the actual number we've found so far
    totalVideos = videoCollection.length;
    
    // Update UI if count changed
    if (oldCount !== videoCollection.length) {
      updateUI();
      console.log(`Found ${videoCollection.length} videos`);
      return true; // Videos were found
    }
    
    return false; // No new videos
  }
  
  // Perform a full page scan from top to bottom
  function performFullPageScan() {
    return new Promise(resolve => {
      const originalScroll = window.scrollY;
      let currentScroll = 0;
      const screenHeight = window.innerHeight;
      const scanInterval = setInterval(() => {
        // Scroll to specific position
        window.scrollTo(0, currentScroll);
        
        // Find videos at this position
        findVideoElements();
        
        // Move down one viewport
        currentScroll += screenHeight;
        
        // If we're beyond document height, stop
        if (currentScroll >= document.body.scrollHeight) {
          clearInterval(scanInterval);
          
          // Scroll back to original position
          window.scrollTo(0, originalScroll);
          
          // Log scan completion
          console.log(`Full page scan complete - found ${videoCollection.length} videos`);
          fullPageScansCount++;
          resolve();
        }
      }, 500);
    });
  }
  
  // Update UI elements
  function updateUI() {
    if (!uiContainer) return;
    
    // Get UI elements
    const statusMessage = document.getElementById('status-message');
    const captureRatio = document.getElementById('capture-ratio');
    const extractionSummary = document.getElementById('extraction-summary');
    const progressBar = document.getElementById('progress-bar');
    const completionStatus = document.getElementById('completion-status');
    const toggleScrollButton = document.getElementById('toggle-scroll-ui');
    const pageVideosCount = document.getElementById('page-videos-count');
    const foundLinksCount = document.getElementById('found-links-count');
    
    // Update counters - now both show the same accurate count
    if (pageVideosCount) pageVideosCount.textContent = videoCollection.length;
    if (foundLinksCount) foundLinksCount.textContent = videoCollection.length;
    
    if (!statusMessage || !captureRatio || !progressBar) return;
    
    // Update capture ratio - now 100% when complete
    const percentage = isComplete ? 100 : Math.min(95, Math.round((videoCollection.length / (videoCollection.length + 5)) * 100));
    captureRatio.textContent = `${percentage}%`;
    
    // Update progress bar
    progressBar.style.width = `${percentage}%`;
    
    // Update extraction summary
    if (extractionSummary) {
      if (videoCollection.length === 0) {
        extractionSummary.textContent = 'Searching for videos...';
      } else if (isComplete) {
        extractionSummary.textContent = `Found ${videoCollection.length} videos!`;
      } else if (fullPageScansCount > 0) {
        extractionSummary.textContent = `Deep scan: ${videoCollection.length} videos found (scan ${fullPageScansCount}/${scrollConfig.extraScanAttempts+1})`;
      } else {
        extractionSummary.textContent = `Found ${videoCollection.length} videos`;
      }
    }
    
    // Update status text
    if (isScrolling) {
      if (fullPageScansCount > 0) {
        completionStatus.textContent = `Deep scanning page (${fullPageScansCount}/${scrollConfig.extraScanAttempts+1})...`;
      } else {
        completionStatus.textContent = `Auto-scrolling to find videos...`;
      }
      
      if (toggleScrollButton) toggleScrollButton.textContent = 'Stop Auto-Scroll';
    } else {
      completionStatus.textContent = `Found ${videoCollection.length} videos`;
      if (toggleScrollButton) toggleScrollButton.textContent = 'Start Auto-Scroll';
    }
    
    // Update completion status
    if (isComplete) {
      progressBar.style.background = '#48bb78'; // Green
      statusMessage.textContent = `Found ${videoCollection.length} videos! Ready to download.`;
      
      if (isScrolling) {
        stopAutoScroll();
      }
    }
  }
  
  // Auto-scroll implementation with enhanced scanning
  async function startAutoScroll() {
    if (scrollInterval) return; // Already scrolling
    
    isScrolling = true;
    scrollConfig.scrollsWithNoNewVideos = 0;
    
    // First find video elements
    findVideoElements();
    
    // Update UI
    const toggleScrollButton = document.getElementById('toggle-scroll-ui');
    if (toggleScrollButton) toggleScrollButton.textContent = 'Stop Auto-Scroll';
    
    // Start scroll interval
    scrollInterval = setInterval(() => {
      // Scroll down
      window.scrollBy(0, scrollConfig.scrollAmount);
      
      // Check if we've reached the bottom
      const scrolledToBottom = (window.innerHeight + window.pageYOffset) >= document.documentElement.scrollHeight - 100;
      
      // Check if new videos appeared
      const foundNewVideos = findVideoElements();
      
      if (!foundNewVideos) {
        scrollConfig.scrollsWithNoNewVideos++;
        const completionStatus = document.getElementById('completion-status');
        if (completionStatus) {
          completionStatus.textContent = `Scrolling... No new videos for ${scrollConfig.scrollsWithNoNewVideos} scrolls`;
        }
        
        // Try scrolling to bottom after a few unsuccessful attempts
        if (scrollConfig.scrollsWithNoNewVideos === 3) {
          window.scrollTo(0, document.body.scrollHeight);
        } 
        
        // Stop if we've tried enough times or reached the bottom
        if (scrollConfig.scrollsWithNoNewVideos >= scrollConfig.noNewVideoLimit || scrolledToBottom) {
          // Clear the auto-scroll interval
          clearInterval(scrollInterval);
          scrollInterval = null;
          
          // Start extra scan process to catch remaining videos
          performExtraScans();
        }
      } else {
        // Reset counter since we found new videos
        scrollConfig.scrollsWithNoNewVideos = 0;
      }
    }, scrollConfig.scrollInterval);
    
    console.log(`Started auto-scrolling to find videos`);
  }
  
  // Perform extra scanning to catch all videos
  async function performExtraScans() {
    // Update UI to indicate we're doing extra scanning
    const statusMessage = document.getElementById('status-message');
    if (statusMessage) {
      statusMessage.textContent = 'Performing deep scan to find videos...';
    }
    
    // Perform up to 2 full-page scans (reduced from 3)
    for (let i = 0; i < scrollConfig.extraScanAttempts; i++) {
      if (!isScrolling) break; // Stop if user cancelled
      
      await performFullPageScan();
      
      // Wait a moment between scans
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // If we haven't found any new videos, we can stop early
      if (i >= 1 && foundSameCount >= 2) {
        break;
      }
    }
    
    // Complete the extraction
    stopAutoScroll();
  }
  
  // Stop auto-scroll
  function stopAutoScroll() {
    if (!isScrolling) return;
    
    if (scrollInterval) {
      clearInterval(scrollInterval);
      scrollInterval = null;
    }
    
    isScrolling = false;
    
    const toggleScrollButton = document.getElementById('toggle-scroll-ui');
    const statusMessage = document.getElementById('status-message');
    
    if (toggleScrollButton) {
      toggleScrollButton.textContent = 'Start Auto-Scroll';
    }
    
    if (statusMessage) {
      statusMessage.textContent = `Found ${videoCollection.length} videos`;
    }
    
    console.log(`Auto-scroll stopped`);
    isComplete = true;
    updateUI();
  }
  
  // Toggle scrolling status
  function toggleScrolling() {
    if (isScrolling) {
      stopAutoScroll();
    } else {
      startAutoScroll();
    }
  }
  
  // Create download information text
  function createDownloadText() {
    let text = '';
    
    // Add header with instructions
    text += `# TikTok Original Video Download Links for @${profileUsername}\n`;
    text += `# Generated on: ${currentDate}\n`;
    text += `# Created by: ${authorInfo.name}\n`;
    text += `# Number of videos: ${videoCollection.length}\n\n`;
    text += `# INSTRUCTIONS FOR DOWNLOADING:\n`;
    text += `# 1. Import these links into a download manager (IDM, aria2c, etc.)\n`;
    text += `# 2. Make sure to use these HTTP headers when downloading:\n`;
    text += `#    User-Agent: TikTok 26.2.0 rv:262018 (iPhone; iOS 14.4.2; en_US) Cronet\n`;
    text += `#    Referer: https://www.tiktok.com/\n\n`;
    text += `# Donate: ${authorInfo.momo} or ${authorInfo.bank}\n\n`;
    text += `# FORMAT: original_url|filename\n\n`;
    
    // Add video links
    videoCollection.forEach((video, index) => {
      text += `${video.originalUrl}|${profileUsername}_video_${index + 1}.mp4\n`;
    });
    
    return text;
  }
  
  // Download links text file
  function downloadLinksFile() {
    if (videoCollection.length === 0) {
      alert('No videos found yet. Let the auto-scroll complete first!');
      return;
    }
    
    // Create content
    const text = createDownloadText();
    
    // Create filename with link count
    const filename = `${profileUsername}_${videoCollection.length}_original_links.txt`;
    
    try {
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      // Create hidden download link
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      
      // Add to document, trigger click and cleanup
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      const statusMessage = document.getElementById('status-message');
      if (statusMessage) {
        statusMessage.textContent = `Downloaded ${videoCollection.length} links!`;
      }
    } catch (e) {
      console.error("Error downloading file:", e);
      alert('Download failed. Browser may be blocking downloads.');
    }
  }
  
  // Copy all links to clipboard
  function copyAllLinks() {
    if (videoCollection.length === 0) {
      alert('No videos found yet. Let the auto-scroll complete first!');
      return;
    }
    
    // Create content
    const text = createDownloadText();
    
    // Copy to clipboard
    navigator.clipboard.writeText(text)
      .then(() => {
        const statusMessage = document.getElementById('status-message');
        if (statusMessage) {
          statusMessage.textContent = `Copied ${videoCollection.length} links to clipboard!`;
          setTimeout(() => {
            statusMessage.textContent = isScrolling ? 'Auto-scrolling in progress...' : `Found ${videoCollection.length} videos`;
          }, 2000);
        }
      })
      .catch(err => {
        console.error('Failed to copy links:', err);
        alert('Failed to copy links to clipboard. Try the download button instead.');
      });
  }
})();