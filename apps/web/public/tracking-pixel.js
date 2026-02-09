/**
 * MarketingOS Attribution Tracking Pixel
 * 
 * Instrucciones de uso:
 * 1. Copia este snippet y pégalo antes del cierre </body> en tu landing page
 * 2. Reemplaza YOUR_ORG_ID con tu organization ID real
 * 3. El pixel trackear automáticamente:
 *    - Page views
 *    - UTM parameters
 *    - Clicks en elementos con data-track-click
 *    - Form submissions con data-track-form
 */

(function() {
  'use strict';
  
  // ========== CONFIGURACIÓN ==========
  const CONFIG = {
    baseUrl: 'https://finanzas-production-8433.up.railway.app',
    organizationId: 'YOUR_ORG_ID', // ⚠️ CAMBIAR ESTO
    debug: false, // Cambiar a true para ver logs en consola
  };

  // ========== UTILS ==========
  function log(...args) {
    if (CONFIG.debug) {
      console.log('[MarketingOS Tracking]', ...args);
    }
  }

  function getVisitorId() {
    let vid = localStorage.getItem('mkt_visitor_id');
    if (!vid) {
      vid = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substring(7);
      localStorage.setItem('mkt_visitor_id', vid);
    }
    return vid;
  }

  function getSessionId() {
    let sid = sessionStorage.getItem('mkt_session_id');
    if (!sid) {
      sid = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(7);
      sessionStorage.setItem('mkt_session_id', sid);
    }
    return sid;
  }

  function getUTMParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
      utm_content: params.get('utm_content'),
      utm_term: params.get('utm_term'),
    };
  }

  function getDevice() {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  // ========== TRACKING PIXEL ==========
  function trackPixel(eventType, additionalParams = {}) {
    const visitorId = getVisitorId();
    const sessionId = getSessionId();
    const utm = getUTMParams();
    
    const params = new URLSearchParams({
      event: eventType,
      visitorId: visitorId,
      sessionId: sessionId,
      org: CONFIG.organizationId,
      page: window.location.pathname,
      referrer: document.referrer,
      device: getDevice(),
      ...utm,
      ...additionalParams,
    });

    // Remove null/undefined values
    for (let [key, value] of params.entries()) {
      if (!value) {
        params.delete(key);
      }
    }

    const img = new Image();
    img.src = CONFIG.baseUrl + '/api/tracking/pixel.gif?' + params.toString();
    img.style.display = 'none';
    document.body.appendChild(img);

    log('Pixel tracked:', eventType, params.toString());
  }

  // ========== EVENT TRACKING API ==========
  function trackEvent(eventType, metadata = {}) {
    const visitorId = getVisitorId();
    const sessionId = getSessionId();
    const utm = getUTMParams();

    fetch(CONFIG.baseUrl + '/api/tracking/event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: eventType,
        visitorId,
        sessionId,
        organizationId: CONFIG.organizationId,
        source: utm.utm_source,
        medium: utm.utm_medium,
        campaign: utm.utm_campaign,
        metadata: {
          ...metadata,
          page: window.location.pathname,
          referrer: document.referrer,
          device: getDevice(),
        },
      }),
    })
    .then(res => res.json())
    .then(data => {
      log('Event tracked:', eventType, data);
    })
    .catch(err => {
      console.error('Error tracking event:', err);
    });
  }

  // ========== AUTO-TRACKING ==========
  
  // 1. Track page view immediately
  trackPixel('page_view');

  // 2. Track clicks on elements with data-track-click
  document.addEventListener('click', function(e) {
    const element = e.target.closest('[data-track-click]');
    if (element) {
      const trackId = element.dataset.trackClick;
      trackEvent('cta_click', {
        element: trackId,
        text: element.textContent.substring(0, 100),
        href: element.href || null,
      });
    }
  });

  // 3. Track form submissions with data-track-form
  document.addEventListener('submit', function(e) {
    const form = e.target.closest('[data-track-form]');
    if (form) {
      const trackId = form.dataset.trackForm;
      trackEvent('form_submit', {
        form: trackId,
      });
    }
  });

  // 4. Track time on page (send on beforeunload)
  let pageStartTime = Date.now();
  window.addEventListener('beforeunload', function() {
    const timeOnPage = Math.round((Date.now() - pageStartTime) / 1000);
    if (timeOnPage > 3) { // Solo si estuvo más de 3 segundos
      trackEvent('time_on_page', {
        seconds: timeOnPage,
      });
    }
  });

  // ========== PUBLIC API ==========
  // Exponer funciones para tracking manual
  window.MarketingOSTracker = {
    trackEvent: trackEvent,
    trackPixel: trackPixel,
    getVisitorId: getVisitorId,
    getSessionId: getSessionId,
  };

  log('MarketingOS Tracker initialized', {
    visitorId: getVisitorId(),
    sessionId: getSessionId(),
    utm: getUTMParams(),
  });

})();

/**
 * EJEMPLOS DE USO MANUAL:
 * 
 * 1. Track un evento custom:
 *    window.MarketingOSTracker.trackEvent('video_play', { video_id: '123' });
 * 
 * 2. Track un click en un botón:
 *    <button data-track-click="hero_cta">Empieza Gratis</button>
 * 
 * 3. Track un formulario:
 *    <form data-track-form="signup_form">...</form>
 * 
 * 4. Obtener visitor ID:
 *    const vid = window.MarketingOSTracker.getVisitorId();
 */












