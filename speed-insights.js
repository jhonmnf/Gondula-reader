// Vercel Speed Insights Integration
// Based on @vercel/speed-insights v2.0.0
// Docs: https://vercel.com/docs/speed-insights/quickstart

(function() {
  'use strict';

  // Initialize the queue for Speed Insights
  function initQueue() {
    if (window.si) return;
    window.si = function() {
      (window.siq = window.siq || []).push(arguments);
    };
  }

  // Inject the Speed Insights script
  function injectSpeedInsights() {
    if (!window || typeof window === 'undefined') return;
    
    initQueue();
    
    // The script will be automatically injected by Vercel when deployed
    // This sets up the queue to collect data before the script loads
    var script = document.createElement('script');
    script.defer = true;
    
    // When deployed to Vercel, this path will be automatically configured
    // For local development, this is a no-op
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      script.src = '/_vercel/speed-insights/script.js';
      script.onerror = function() {
        console.log('Speed Insights: Script not available (expected in local development)');
      };
      document.head.appendChild(script);
    } else {
      console.log('Speed Insights: Initialized (will activate when deployed to Vercel)');
    }
  }

  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectSpeedInsights);
  } else {
    injectSpeedInsights();
  }
})();
