/**
 * Zero-Build Component & DOM Template Helper (UMD-Lite)
 * Architecture Visualizer Hub
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.DiagramDOM = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Tagged template literal helper for clean HTML composition.
   * Flattens arrays and filters out null/undefined values.
   */
  function html(strings, ...values) {
    let result = '';
    for (let i = 0; i < strings.length; i++) {
      result += strings[i];
      if (i < values.length) {
        const val = values[i];
        if (Array.isArray(val)) {
          result += val.join('');
        } else if (val !== null && val !== undefined) {
          result += String(val);
        }
      }
    }
    return result;
  }

  /**
   * Convert value safely to string with null/undefined fallback to empty string.
   */
  function raw(val) {
    return String(val ?? '');
  }

  /**
   * Create a reusable component wrapper function from a render function.
   */
  function createComponent(renderFn) {
    if (typeof renderFn !== 'function') {
      throw new TypeError('createComponent requires a render function');
    }
    return function (props = {}) {
      return renderFn(props);
    };
  }

  /**
   * Mount an HTML string into a container element or by element ID.
   */
  function mountTemplate(containerOrId, htmlString) {
    let target = containerOrId;
    if (typeof containerOrId === 'string' && typeof document !== 'undefined') {
      target = document.getElementById(containerOrId);
    }
    if (!target) {
      throw new Error(`Target container not found: ${containerOrId}`);
    }
    if (typeof target.insertAdjacentHTML === 'function') {
      target.insertAdjacentHTML('beforeend', htmlString);
    } else if ('innerHTML' in target) {
      target.innerHTML += htmlString;
    }
    return target;
  }

  return {
    html,
    raw,
    createComponent,
    mountTemplate
  };
});
