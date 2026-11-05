/**
 * Diagram Plugin Registry Module (UMD-Lite)
 * Architecture Visualizer Hub
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.DiagramRegistry = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const registry = new Map();
  const aliasMap = new Map();

  const DiagramRegistry = {
    /**
     * Register a diagram manifest with the hub.
     * @param {Object} manifest
     * @param {string} manifest.id - Canonical unique identifier
     * @param {string[]} [manifest.aliases] - Alternate URL identifiers
     * @param {string} manifest.label - Human-readable label for dropdown
     * @param {boolean} [manifest.defaultSelected] - Whether selected on initial load
     * @param {Function} [manifest.mount] - Mounts diagram HTML into viewport
     * @param {Function} [manifest.init] - Instantiates controller/simulation classes
     * @param {Function} [manifest.activate] - Unpauses loop and resizes on display
     * @param {Function} [manifest.deactivate] - Pauses animation loop on hide
     * @param {Function} [manifest.resize] - Recalculates layout and dimensions
     * @param {Function} [manifest.handleUrlParams] - Processes query parameters
     */
    register(manifest) {
      if (!manifest || typeof manifest !== 'object') {
        throw new TypeError('Diagram manifest must be a non-null object');
      }
      if (!manifest.id || typeof manifest.id !== 'string') {
        throw new Error('Diagram manifest must specify a valid string id');
      }
      if (!manifest.label || typeof manifest.label !== 'string') {
        throw new Error(`Diagram ${manifest.id} must specify a valid string label`);
      }

      const entry = {
        id: manifest.id,
        aliases: Array.isArray(manifest.aliases) ? [...manifest.aliases] : [],
        label: manifest.label,
        hidden: Boolean(manifest.hidden),
        defaultSelected: Boolean(manifest.defaultSelected),
        mount: typeof manifest.mount === 'function' ? manifest.mount : null,
        init: typeof manifest.init === 'function' ? manifest.init : null,
        activate: typeof manifest.activate === 'function' ? manifest.activate : null,
        deactivate: typeof manifest.deactivate === 'function' ? manifest.deactivate : null,
        resize: typeof manifest.resize === 'function' ? manifest.resize : null,
        handleUrlParams: typeof manifest.handleUrlParams === 'function' ? manifest.handleUrlParams : null
      };

      registry.set(manifest.id, entry);
      aliasMap.set(manifest.id, manifest.id);
      entry.aliases.forEach((alias) => {
        aliasMap.set(alias, manifest.id);
      });

      return entry;
    },

    /**
     * Retrieve a registered diagram by canonical ID or alias.
     */
    get(idOrAlias) {
      if (!idOrAlias || typeof idOrAlias !== 'string') return null;
      const canonicalId = aliasMap.get(idOrAlias);
      if (!canonicalId) return null;
      return registry.get(canonicalId) || null;
    },

    /**
     * List all registered diagrams in registration order.
     */
    list() {
      return Array.from(registry.values());
    },

    /**
     * Clear all registered diagrams (used in tests).
     */
    clear() {
      registry.clear();
      aliasMap.clear();
    }
  };

  return DiagramRegistry;
});
