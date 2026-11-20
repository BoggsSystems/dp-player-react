/**
 * DigitPop Universal Shoppable Video Embed SDK (v1.js)
 * Usage:
 * <script src="https://player.digitpop.com/v1.js" data-project="PROJECT_ID" async></script>
 */
(function() {
  'use strict';

  if (window.__DigitPopSDK_Loaded) return;
  window.__DigitPopSDK_Loaded = true;

  const scriptTag = document.currentScript || (function() {
    const scripts = document.getElementsByTagName('script');
    for (let i = scripts.length - 1; i >= 0; i--) {
      if (scripts[i].src && (scripts[i].src.includes('/v1.js') || scripts[i].src.includes('/embed.js'))) {
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

  const scriptOrigin = scriptTag ? getOrigin(scriptTag.src) : window.location.origin;

  function initEmbed(targetScript) {
    const projectId = targetScript.getAttribute('data-project');
    if (!projectId) {
      console.warn('[DigitPop] Missing data-project attribute on script tag.');
      return;
    }

    const width = targetScript.getAttribute('data-width') || '100%';
    const aspectRatio = targetScript.getAttribute('data-aspect-ratio') || '16/9';
    const autoplay = targetScript.getAttribute('data-autoplay') || 'false';
    const viewMode = targetScript.getAttribute('data-view-mode') || 'SPLIT_PANEL';

    const container = document.createElement('div');
    container.className = 'digitpop-player-wrapper';
    container.setAttribute('data-digitpop-project', projectId);
    container.style.position = 'relative';
    container.style.width = width;
    container.style.maxWidth = '100%';
    container.style.aspectRatio = aspectRatio;
    container.style.borderRadius = '12px';
    container.style.overflow = 'hidden';
    container.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
    container.style.backgroundColor = '#0b0f17';

    const iframe = document.createElement('iframe');
    const playerUrl = new URL(`${scriptOrigin}/ad/${projectId}`);
    playerUrl.searchParams.set('embed', '1');
    playerUrl.searchParams.set('autoplay', autoplay);
    playerUrl.searchParams.set('viewMode', viewMode);

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
      if (event.origin !== scriptOrigin) return;
      if (!event.data || typeof event.data !== 'object') return;

      if (event.data.type === 'DIGITPOP_RESIZE' && event.data.height) {
        container.style.height = `${event.data.height}px`;
      }
      if (event.data.type === 'DIGITPOP_CHECKOUT' && event.data.checkoutUrl) {
        window.open(event.data.checkoutUrl, '_blank', 'noopener,noreferrer');
      }
    });
  }

  // Auto initialize scripts on page
  function scanAndInit() {
    const scripts = document.querySelectorAll('script[data-project]');
    scripts.forEach((s) => {
      if (!s.__digitpop_initialized) {
        s.__digitpop_initialized = true;
        initEmbed(s);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scanAndInit);
  } else {
    scanAndInit();
  }

  window.DigitPop = {
    version: '1.0.0',
    init: scanAndInit,
  };
})();
