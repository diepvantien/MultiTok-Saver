/**
 * TikTok Original Quality Video Downloader - Injected Script
 * Date: 2025-03-12 01:28:52
 * User: diepvantien
 */
(function() {
    // Check if already injected
    if (window.tiktokExtractorActive) {
        console.log('TikTok extractor already active');
        return;
    }
    
    // Mark as injected
    window.tiktokExtractorActive = true;
    
    // State variables
    let videoCollection = [];  // Stores all found videos
    let videoElements = [];    // Stores video elements on page
    let totalVideos = 0;       // Total videos found
    let isScrolling = false;   // Auto-scroll state
    let scrollInterval = null; // Interval handle
    let isComplete = false;    // Whether extraction is complete
    let uiContainer = null;    // Reference to UI container
    
    // Extract profile username from URL
    let profileUsername = location.pathname.split('/')[1];
    if (profileUsername && profileUsername.startsWith('@')) {
        profileUsername = profileUsername.substring(1);
    } else {
        profileUsername = 'tiktok';
    }
    
    // Auto-scroll configuration
    const scrollConfig = {
        scrollInterval: 3000,  // Time between scrolls
        scrollAmount: 800,     // Amount to scroll each time
        noNewVideoLimit: 5,    // Stop after this many scrolls without new videos
        scrollsWithNoNewVideos: 0
    };
    
    // Create UI container
    function createUI() {
        if (uiContainer) return;
        
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
        
        // Add UI content - No user display and Close button
        uiContainer.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h3 style="margin: 0; font-size: 16px;">TikTok Original Video Downloader</h3>
                <div style="font-size: 12px; padding: 2px 6px; background: #2d3748; border-radius: 4px; color: #63b3ed;">
                    Auto-Scroll
                </div>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                <div id="status-message" style="font-size: 13px;">Auto-scrolling in progress...</div>
                <div id="capture-ratio" style="color: #48bb78; font-size: 13px;">Links: 0/0</div>
            </div>
            
            <div style="background: #2d3748; height: 6px; border-radius: 3px; margin: 8px 0;">
                <div id="progress-bar" style="background: #48bb78; height: 6px; width: 0%; border-radius: 3px; transition: width 0.3s;"></div>
            </div>
            
            <div id="url-container" style="max-height: 200px; overflow-y: auto; background: #1a202c; border-radius: 6px; padding: 8px; margin: 8px 0; font-family: monospace; font-size: 11px;">
                <div style="color: #a0aec0; text-align: center;">Auto-scrolling to find videos...</div>
            </div>
            
            <div id="action-buttons" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px;">
                <button id="download-links" style="padding: 8px; background: #2563eb; border: none; color: white; border-radius: 4px; cursor: pointer;">
                    Download Links (.txt)
                </button>
                <button id="copy-links" style="padding: 8px; background: #8b5cf6; border: none; color: white; border-radius: 4px; cursor: pointer;">
                    Copy All Links
                </button>
                <button id="toggle-scroll" style="padding: 8px; background: #d69e2e; border: none; color: white; border-radius: 4px; cursor: pointer;">
                    Stop Auto-Scroll
                </button>
                <button id="close-ui" style="padding: 8px; background: #e53e3e; border: none; color: white; border-radius: 4px; cursor: pointer;">
                    Close
                </button>
            </div>
            
            <div style="margin-top: 8px; font-size: 11px; color: #a0aec0; line-height: 1.4;">
                <span id="completion-status">Auto-scrolling to find videos (0%)...</span>
            </div>
        `;
        
        document.body.appendChild(uiContainer);
        
        // Add event listeners for UI buttons
        document.getElementById('download-links').addEventListener('click', downloadLinksFile);
        document.getElementById('copy-links').addEventListener('click', copyAllLinks);
        document.getElementById('toggle-scroll').addEventListener('click', toggleScrolling);
        document.getElementById('close-ui').addEventListener('click', closeUI);
        
        updateUI();
    }
    
    // Close UI (completely remove from page)
    function closeUI() {
        if (!uiContainer) return;
        
        // Stop scrolling if needed
        if (isScrolling) {
            stopAutoScroll();
        }
        
        // Remove UI from page
        uiContainer.remove();
        uiContainer = null;
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
    
    // Get original download URL for video ID
    function getOriginalDownloadUrl(videoId) {
        return `https://tikwm.com/video/media/hdplay/${videoId}.mp4`;
    }
    
    // Find all videos on the page
    function findVideoElements() {
        videoElements = Array.from(document.querySelectorAll('div[data-e2e="user-post-item"]'));
        const oldCount = totalVideos;
        totalVideos = videoElements.length;
        
        // Process each video element
        videoElements.forEach(element => {
            try {
                const link = element.querySelector('a');
                if (link && link.href && link.href.includes('/video/')) {
                    const videoId = extractVideoId(link.href);
                    if (videoId && !videoCollection.some(v => v.id === videoId)) {
                        // Add new video to collection
                        videoCollection.push({
                            id: videoId,
                            pageUrl: link.href,
                            originalUrl: getOriginalDownloadUrl(videoId)
                        });
                    }
                }
            } catch (e) {}
        });
        
        // Update UI if count changed
        if (oldCount !== totalVideos || videoCollection.length !== oldCount) {
            updateUI();
            console.log(`Found ${totalVideos} videos, collected ${videoCollection.length} URLs`);
            return true; // Videos were found
        }
        
        return false; // No new videos
    }
    
    // Update UI elements
    function updateUI() {
        if (!uiContainer) return;
        
        const statusMessage = document.getElementById('status-message');
        const captureRatio = document.getElementById('capture-ratio');
        const urlContainer = document.getElementById('url-container');
        const progressBar = document.getElementById('progress-bar');
        const completionStatus = document.getElementById('completion-status');
        const toggleScrollButton = document.getElementById('toggle-scroll');
        
        if (!statusMessage || !captureRatio || !urlContainer || !progressBar || !completionStatus) return;
        
        // Update counter
        captureRatio.textContent = `Links: ${videoCollection.length}/${totalVideos}`;
        
        // Update progress bar
        const percentage = totalVideos > 0 ? Math.min(100, Math.round((videoCollection.length / totalVideos) * 100)) : 0;
        progressBar.style.width = `${percentage}%`;
        
        // Update status text
        if (isScrolling) {
            completionStatus.textContent = `Auto-scrolling to find videos (${percentage}% captured)`;
            toggleScrollButton.textContent = 'Stop Auto-Scroll';
        } else {
            completionStatus.textContent = `Found ${videoCollection.length} of ${totalVideos} videos`;
            toggleScrollButton.textContent = 'Start Auto-Scroll';
        }
        
        // Update completion status
        if (videoCollection.length >= totalVideos && !isComplete && totalVideos > 0) {
            progressBar.style.background = '#48bb78'; // Green
            statusMessage.textContent = 'All videos found! Ready to download.';
            isComplete = true;
            
            if (isScrolling) {
                stopAutoScroll();
            }
        }
        
        // Update URL list display
        if (videoCollection.length === 0) {
            urlContainer.innerHTML = `<div style="color: #a0aec0; text-align: center;">No videos found yet...</div>`;
            return;
        }
        
        // Display first 10 videos
        const displayVideos = videoCollection.slice(0, 10);
        
        urlContainer.innerHTML = displayVideos.map((video, index) => `
            <div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #2d3748;">
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: #48bb78;">Video ${index + 1}</span>
                    <span style="color: #a0aec0; font-size: 10px;">${video.id}</span>
                </div>
                <div style="word-break: break-all; color: #e2e8f0; margin-top: 4px; font-size: 10px;">
                    ${video.originalUrl.substring(0, 45)}...
                </div>
            </div>
        `).join('');
        
        if (videoCollection.length > 10) {
            urlContainer.innerHTML += `<div style="color: #a0aec0; text-align: center;">+ ${videoCollection.length - 10} more videos</div>`;
        }
        
        // Send state update to popup
        sendStateUpdate();
    }
    
    // Send state update to popup
    function sendStateUpdate() {
        const percentage = totalVideos > 0 ? Math.min(100, Math.round((videoCollection.length / totalVideos) * 100)) : 0;
        const state = {
            videosFound: videoCollection.length,
            totalVideos: totalVideos,
            percentage: percentage,
            isScrolling: isScrolling,
            isComplete: isComplete,
            message: isScrolling ? 'Auto-scrolling in progress...' : 
                   (isComplete ? 'All videos found!' : `Found ${videoCollection.length} videos`)
        };
        
        chrome.runtime.sendMessage({
            type: 'extractorState',
            state: state
        });
    }
    
    // Auto-scroll implementation - starts automatically
    function startAutoScroll() {
        if (scrollInterval) return; // Already scrolling
        
        isScrolling = true;
        scrollConfig.scrollsWithNoNewVideos = 0;
        
        // First find video elements
        findVideoElements();
        
        // Update UI
        const toggleScrollButton = document.getElementById('toggle-scroll');
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
                    stopAutoScroll();
                }
            } else {
                // Reset counter since we found new videos
                scrollConfig.scrollsWithNoNewVideos = 0;
            }
        }, scrollConfig.scrollInterval);
        
        console.log(`Started auto-scrolling to find videos`);
    }
    
    // Stop auto-scroll
    function stopAutoScroll() {
        if (!isScrolling) return;
        
        clearInterval(scrollInterval);
        scrollInterval = null;
        isScrolling = false;
        
        const toggleScrollButton = document.getElementById('toggle-scroll');
        const statusMessage = document.getElementById('status-message');
        
        if (toggleScrollButton) {
            toggleScrollButton.textContent = 'Start Auto-Scroll';
        }
        
        if (statusMessage) {
            statusMessage.textContent = `Found ${totalVideos} videos, captured ${videoCollection.length} URLs`;
        }
        
        console.log(`Auto-scroll stopped`);
        sendStateUpdate();
    }
    
    // Toggle scrolling status
    function toggleScrolling() {
        if (isScrolling) {
            stopAutoScroll();
        } else {
            startAutoScroll();
        }
        
        // Return the latest state for popup
        return {
            videosFound: videoCollection.length,
            totalVideos: totalVideos,
            percentage: totalVideos > 0 ? Math.min(100, Math.round((videoCollection.length / totalVideos) * 100)) : 0,
            isScrolling: isScrolling,
            isComplete: isComplete
        };
    }
    
    // Create download information text
    function createDownloadText() {
        let text = '';
        
        // Add header with instructions
        text += `# TikTok Original Video Download Links for @${profileUsername}\n`;
        text += `# Generated on: 2025-03-12 01:28:52\n`;
        text += `# Number of videos: ${videoCollection.length}\n\n`;
        text += `# INSTRUCTIONS FOR DOWNLOADING:\n`;
        text += `# 1. Import these links into a download manager (IDM, aria2c, etc.)\n`;
        text += `# 2. Make sure to use these HTTP headers when downloading:\n`;
        text += `#    User-Agent: TikTok 26.2.0 rv:262018 (iPhone; iOS 14.4.2; en_US) Cronet\n`;
        text += `#    Referer: https://www.tiktok.com/\n\n`;
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
    
    // Start extraction
    function startExtraction() {
        createUI();
        startAutoScroll();
        
        return {
            videosFound: videoCollection.length,
            totalVideos: totalVideos,
            percentage: 0,
            isScrolling: true,
            isComplete: false,
            message: 'Extraction started'
        };
    }
    
    // Listen for messages
    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
        try {
            switch (message.action) {
                case 'startExtraction':
                    sendResponse(startExtraction());
                    break;
                    
                case 'toggleScroll':
                    sendResponse(toggleScrolling());
                    break;
                    
                case 'downloadLinks':
                    downloadLinksFile();
                    sendResponse({success: true});
                    break;
                    
                case 'copyLinks':
                    copyAllLinks();
                    sendResponse({success: true});
                    break;
            }
        } catch (e) {
            console.error('Error in message handler:', e);
            sendResponse({error: e.message});
        }
        
        // Return true to indicate you're handling the message asynchronously
        return true;
    });
    
    // Announce presence
    console.log('TikTok Extractor script loaded successfully');
})();