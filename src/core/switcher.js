/**
 * Central Hub Lifecycle Switcher & URL Coordinator (UMD-Lite)
 * Architecture Visualizer Hub
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./registry.js'));
  } else {
    const exports = factory(root.DiagramRegistry);
    root.switchDiagram = exports.switchDiagram;
    root.initDiagramSwitcher = exports.initDiagramSwitcher;
    root.bootstrapDiagrams = exports.bootstrapDiagrams;
  }
})(typeof self !== 'undefined' ? self : this, function (DiagramRegistry) {
  'use strict';

  let currentDiagramId = null;

  /**
   * Switch the active diagram in the hub.
   * Toggles .hidden, invokes lifecycle hooks (deactivate/activate/resize), and updates dropdown.
   */
  function switchDiagram(idOrAlias) {
    if (!DiagramRegistry || typeof DiagramRegistry.get !== 'function') return;

    const target = DiagramRegistry.get(idOrAlias);
    if (!target) return;

    const all = DiagramRegistry.list();

    // 1. Deactivate previous diagram if switching
    if (currentDiagramId && currentDiagramId !== target.id) {
      const prev = DiagramRegistry.get(currentDiagramId);
      if (prev && typeof prev.deactivate === 'function') {
        prev.deactivate();
      }
    }

    // 2. Toggle DOM view visibility
    all.forEach((diag) => {
      const viewEl = document.getElementById(getViewId(diag.id));
      if (!viewEl) return;

      if (diag.id === target.id) {
        viewEl.classList.remove('hidden');
      } else {
        viewEl.classList.add('hidden');
      }
    });

    // 3. Sync dropdown selection
    const select = document.getElementById('diagram-select');
    if (select) {
      // Find matching option (check value or canonical id)
      for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].value === target.id || select.options[i].value === idOrAlias) {
          select.selectedIndex = i;
          break;
        }
      }
    }

    currentDiagramId = target.id;

    // 4. Activate new diagram
    if (typeof target.activate === 'function') {
      target.activate();
    }
  }

  function getViewId(diagramId) {
    if (diagramId === 'runpod-serverless') return 'view-runpod-serverless';
    if (diagramId === 'lexis-voice') return 'view-diagram-slot-2';
    return `view-${diagramId}`;
  }

  /**
   * Populate dropdown options and bind event handlers.
   */
  function initDiagramSwitcher() {
    if (typeof document === 'undefined') return;

    const select = document.getElementById('diagram-select');
    const btnBack = document.getElementById('btn-back-to-runpod');
    const diagrams = DiagramRegistry ? DiagramRegistry.list() : [];

    if (select) {
      // Populate select if empty or mismatched
      if (select.options.length === 0 && diagrams.length > 0) {
        diagrams.forEach((diag) => {
          const opt = document.createElement('option');
          opt.value = diag.id;
          opt.textContent = diag.label;
          if (diag.defaultSelected) opt.selected = true;
          select.appendChild(opt);
        });
      }

      select.addEventListener('change', (e) => {
        switchDiagram(e.target.value);
      });
    }

    if (btnBack) {
      btnBack.addEventListener('click', () => {
        switchDiagram('runpod-serverless');
      });
    }

    window.addEventListener('resize', () => {
      if (currentDiagramId && DiagramRegistry) {
        const curr = DiagramRegistry.get(currentDiagramId);
        if (curr && typeof curr.resize === 'function') {
          curr.resize();
        }
      }
    });
  }

  /**
   * Mount all registered diagram templates into #diagram-viewport,
   * initialize simulations, determine initial diagram from URL or defaultSelected,
   * and dispatch URL parameters.
   */
  function bootstrapDiagrams() {
    if (typeof document === 'undefined') return;

    const viewport = document.getElementById('diagram-viewport');
    const diagrams = DiagramRegistry ? DiagramRegistry.list() : [];

    // 1. Mount all templates into viewport
    diagrams.forEach((diag) => {
      if (typeof diag.mount === 'function') {
        diag.mount(viewport);
      }
    });

    // 2. Initialize engines
    diagrams.forEach((diag) => {
      if (typeof diag.init === 'function') {
        diag.init();
      }
    });

    // 3. Initialize UI Switcher
    initDiagramSwitcher();

    // 4. Resolve initial diagram: URL param -> defaultSelected -> first registered
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const diagramParam = params.get('diagram');

    let initialId = null;
    if (diagramParam && DiagramRegistry && DiagramRegistry.get(diagramParam)) {
      initialId = diagramParam;
    } else {
      const defaultDiag = diagrams.find((d) => d.defaultSelected);
      initialId = defaultDiag ? defaultDiag.id : (diagrams[0] ? diagrams[0].id : 'runpod-serverless');
    }

    switchDiagram(initialId);

    // 5. Dispatch URL query parameters to active diagram
    if (DiagramRegistry) {
      const active = DiagramRegistry.get(initialId);
      if (active && typeof active.handleUrlParams === 'function') {
        active.handleUrlParams(params);
      }
    }
  }

  // Auto-bootstrap on DOMContentLoaded in browser
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bootstrapDiagrams);
    } else {
      bootstrapDiagrams();
    }
  }

  return {
    switchDiagram,
    initDiagramSwitcher,
    bootstrapDiagrams
  };
});
