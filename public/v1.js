/**
 * ShopVideo.tv Universal Shoppable Video Embed SDK (v1.js)
 * High-performance, lightweight (zero external dependencies) embed loader.
 *
 * Usage:
 * <script src="https://player.shopvideo.tv/v1.js" data-shopvideo-id="VIDEO_ID" async></script>
 */
(function() {
  'use strict';

  if (window.__ShopVideoSDK_Loaded) return;
  window.__ShopVideoSDK_Loaded = true;

  const scriptTag = document.currentScript || (function() {
    const scripts = document.getElementsByTagName('script');
    for (let i = scripts.length - 1; i >= 0; i--) {
      if (scripts[i].src && (scripts[i].src.includes('/embed.js') || scripts[i].src.includes('/v1.js'))) {
        return scripts[i];
      }
    }
    return null;
  })();

  const getOrigin = (url) => {
    try {
      const parsed = new URL(url);
      return parsed.origin;
    } catch (e) {
      return window.location.origin;
    }
  };

  const scriptOrigin = scriptTag ? getOrigin(scriptTag.src) : (window.location.origin.includes('player.shopvideo.tv') ? window.location.origin : 'https://player.shopvideo.tv');

  function initEmbed(targetScript) {
    const videoId = targetScript.getAttribute('data-shopvideo-id') ||
                    targetScript.getAttribute('data-video-id') ||
                    targetScript.getAttribute('data-project');

    if (!videoId) {
      console.warn('[ShopVideo] Missing data-shopvideo-id attribute on script tag.');
      return;
    }

    const width = targetScript.getAttribute('data-width') || '100%';
    const aspectRatio = targetScript.getAttribute('data-aspect-ratio') || '16/9';
    const autoplay = targetScript.getAttribute('data-autoplay') || 'false';
    const viewMode = targetScript.getAttribute('data-view-mode') || 'SPLIT_PANEL';
    const theme = targetScript.getAttribute('data-theme') || 'dark';

    const container = document.createElement('div');
    container.className = 'shopvideo-player-wrapper';
    container.setAttribute('data-shopvideo-id', videoId);
    container.style.position = 'relative';
    container.style.width = width;
    container.style.maxWidth = '100%';
    container.style.aspectRatio = aspectRatio;
    container.style.borderRadius = '12px';
    container.style.overflow = 'hidden';
    container.style.boxShadow = '0 12px 36px rgba(0,0,0,0.35)';
    container.style.backgroundColor = '#0b0f17';

    const iframe = document.createElement('iframe');
    const playerUrl = new URL(`${scriptOrigin}/ad/${videoId}`);
    playerUrl.searchParams.set('embed', '1');
    playerUrl.searchParams.set('autoplay', autoplay);
    playerUrl.searchParams.set('viewMode', viewMode);
    playerUrl.searchParams.set('theme', theme);

    iframe.src = playerUrl.toString();
    iframe.style.position = 'absolute';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.display = 'block';
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
    iframe.setAttribute('allowfullscreen', 'true');
    iframe.setAttribute('loading', 'lazy');

    container.appendChild(iframe);
    targetScript.parentNode.insertBefore(container, targetScript.nextSibling);

    window.addEventListener('message', function(event) {
      if (event.origin !== scriptOrigin && !event.origin.includes('shopvideo.tv') && !event.origin.includes('opportunity-system.com')) {
        return;
      }
      if (!event.data || typeof event.data !== 'object') return;

      if ((event.data.type === 'SHOPVIDEO_RESIZE' || event.data.type === 'DIGITPOP_RESIZE') && event.data.height) {
        container.style.height = `${event.data.height}px`;
      }
      if ((event.data.type === 'SHOPVIDEO_CHECKOUT' || event.data.type === 'DIGITPOP_CHECKOUT') && event.data.checkoutUrl) {
        window.open(event.data.checkoutUrl, '_blank', 'noopener,noreferrer');
      }
    });
  }

  // Auto initialize scripts on page
  function scanAndInit() {
    const scripts = document.querySelectorAll('script[data-shopvideo-id], script[data-video-id], script[data-project]');
    scripts.forEach((s) => {
      if (!s.__shopvideo_initialized) {
        s.__shopvideo_initialized = true;
        initEmbed(s);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scanAndInit);
  } else {
    scanAndInit();
  }

  window.ShopVideo = {
    version: '1.0.0',
    init: scanAndInit,
  };

  // Legacy alias
  window.DigitPop = window.ShopVideo;
})();
