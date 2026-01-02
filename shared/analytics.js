/**
 * Privacy-Respecting Analytics Utility
 *
 * A lightweight wrapper around Plausible Analytics that automatically tracks:
 * - Page views (automatic)
 * - Button clicks and interactions (via data-track attributes)
 * - Session duration (automatic)
 * - Device/browser info (automatic)
 *
 * Usage:
 * 1. Add Plausible script to your HTML head (see SETUP below)
 * 2. Include this script after Plausible
 * 3. Call Analytics.init() when DOM is ready
 * 4. Add data-track="event-name" to elements you want to track
 *
 * SETUP:
 * Add this to your <head> section:
 * <script defer data-domain="arohaislove.github.io" src="https://plausible.io/js/script.js"></script>
 * <script src="/shared/analytics.js"></script>
 *
 * Then in your code or at the end of <body>:
 * <script>
 *   if (document.readyState === 'loading') {
 *     document.addEventListener('DOMContentLoaded', () => Analytics.init());
 *   } else {
 *     Analytics.init();
 *   }
 * </script>
 */

(function(window) {
  'use strict';

  // Check if Plausible is available
  const plausible = window.plausible || function() {
    console.warn('Plausible not loaded - analytics disabled');
  };

  /**
   * Analytics utility object
   */
  const Analytics = {
    // Track if we've already initialized
    _initialized: false,

    // Track session start time for duration calculation
    _sessionStart: null,

    /**
     * Initialize analytics tracking
     * Sets up automatic click tracking for elements with data-track attributes
     */
    init: function() {
      if (this._initialized) {
        console.warn('Analytics already initialized');
        return;
      }

      this._initialized = true;
      this._sessionStart = Date.now();

      // Track session duration on page unload
      this._trackSessionDuration();

      // Set up automatic click tracking
      this._setupClickTracking();

      // Track initial page view (Plausible does this automatically, but we log it)
      console.log('[Analytics] Tracking page view:', window.location.pathname);
    },

    /**
     * Manually track a custom event
     * @param {string} eventName - Name of the event to track
     * @param {object} props - Optional properties to attach to the event
     */
    track: function(eventName, props = {}) {
      if (!this._initialized) {
        console.warn('Analytics not initialized. Call Analytics.init() first.');
        return;
      }

      console.log('[Analytics] Tracking event:', eventName, props);
      plausible(eventName, { props: props });
    },

    /**
     * Track session duration when user leaves the page
     * @private
     */
    _trackSessionDuration: function() {
      const self = this;

      window.addEventListener('beforeunload', function() {
        if (self._sessionStart) {
          const duration = Math.round((Date.now() - self._sessionStart) / 1000); // in seconds
          const minutes = Math.floor(duration / 60);
          const seconds = duration % 60;

          // Track duration in buckets for better analytics
          let durationBucket = '0-30s';
          if (duration > 300) durationBucket = '5min+';
          else if (duration > 180) durationBucket = '3-5min';
          else if (duration > 120) durationBucket = '2-3min';
          else if (duration > 60) durationBucket = '1-2min';
          else if (duration > 30) durationBucket = '30s-1min';

          plausible('Session Duration', {
            props: {
              duration: `${minutes}m ${seconds}s`,
              bucket: durationBucket,
              seconds: duration
            }
          });
        }
      });
    },

    /**
     * Set up automatic click tracking for interactive elements
     * @private
     */
    _setupClickTracking: function() {
      const self = this;

      // Track clicks on the entire document
      document.addEventListener('click', function(event) {
        // Find the clicked element or closest trackable parent
        let element = event.target;
        let trackableElement = null;
        let maxDepth = 5; // Don't traverse too far up the DOM

        // Walk up the DOM tree to find an element with data-track or a trackable element
        while (element && maxDepth > 0) {
          // Check if element has data-track attribute
          if (element.hasAttribute && element.hasAttribute('data-track')) {
            trackableElement = element;
            break;
          }

          // Check if element is inherently trackable (button, link, input, etc.)
          if (self._isTrackableElement(element)) {
            trackableElement = element;
            break;
          }

          element = element.parentElement;
          maxDepth--;
        }

        // If we found a trackable element, track it
        if (trackableElement) {
          self._trackElementClick(trackableElement);
        }
      });

      // Track form submissions
      document.addEventListener('submit', function(event) {
        const form = event.target;
        const eventName = form.getAttribute('data-track') ||
                         form.getAttribute('id') ||
                         form.getAttribute('name') ||
                         'Form Submit';

        self.track('Form: ' + eventName);
      });

      // Track input changes (for toggles, checkboxes, selects)
      document.addEventListener('change', function(event) {
        const element = event.target;

        // Only track if element has data-track or is a checkbox/radio/select
        if (element.hasAttribute('data-track') ||
            element.type === 'checkbox' ||
            element.type === 'radio' ||
            element.tagName === 'SELECT') {

          const eventName = element.getAttribute('data-track') ||
                           element.getAttribute('id') ||
                           element.getAttribute('name') ||
                           element.type ||
                           'Input Change';

          const value = element.type === 'checkbox' ? element.checked :
                       element.type === 'radio' ? element.value :
                       element.tagName === 'SELECT' ? element.value : '';

          self.track('Input: ' + eventName, { value: String(value) });
        }
      });
    },

    /**
     * Check if an element should be tracked automatically
     * @private
     */
    _isTrackableElement: function(element) {
      if (!element || !element.tagName) return false;

      const tag = element.tagName.toLowerCase();
      const trackableTags = ['button', 'a', 'input', 'select', 'textarea'];

      // Check if it's a trackable tag
      if (trackableTags.includes(tag)) return true;

      // Check if it has role="button" or similar
      const role = element.getAttribute('role');
      if (role && (role === 'button' || role === 'link')) return true;

      // Check if it has onclick handler
      if (element.onclick) return true;

      return false;
    },

    /**
     * Track a click on a specific element
     * @private
     */
    _trackElementClick: function(element) {
      // Get event name from data-track attribute, or fall back to other identifiers
      let eventName = element.getAttribute('data-track');

      if (!eventName) {
        // Fall back to element text, id, or tag name
        const text = (element.textContent || '').trim().substring(0, 50);
        const id = element.getAttribute('id');
        const tag = element.tagName.toLowerCase();

        eventName = text || id || `${tag} click`;
      }

      // Get additional context
      const props = {};

      // Add element type
      props.element = element.tagName.toLowerCase();

      // Add href for links
      if (element.tagName === 'A' && element.href) {
        props.href = element.href;
      }

      // Add button type
      if (element.tagName === 'BUTTON' && element.type) {
        props.type = element.type;
      }

      // Track the event
      this.track('Click: ' + eventName, props);
    }
  };

  // Expose Analytics globally
  window.Analytics = Analytics;

  // Auto-initialize if DOM is already ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      console.log('[Analytics] DOM ready - call Analytics.init() to start tracking');
    });
  } else {
    console.log('[Analytics] Analytics utility loaded - call Analytics.init() to start tracking');
  }

})(window);
