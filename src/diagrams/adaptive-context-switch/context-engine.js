// src/diagrams/adaptive-context-switch/context-engine.js
/**
 * Adaptive Context Switching Architecture Simulation Engine (UMD-Lite)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('../../core/registry.js'),
      require('./template.js')
    );
  } else {
    const exports = factory(root.DiagramRegistry, root.ContextTemplate);
    root.AdaptiveContextSwitchSimulation = exports.AdaptiveContextSwitchSimulation;
  }
})(typeof self !== 'undefined' ? self : this, function (DiagramRegistry, ContextTemplate) {
  'use strict';

  const SIBLING_CLUSTERS = {
    social_media: ['Facebook', 'Instagram', 'TikTok', 'YouTube', 'LinkedIn'],
    technology_ai: ['ChatGPT', 'Google Calendar', 'Notion', 'Slack'],
    food_nutrition: ['Home Cooking', 'Street Food', 'Restaurant Dining']
  };

  const CONTEXT_SWITCH_TEMPLATES = [
    "You've shared some great points about {CURRENT_CONTEXT}. Let's switch gears and talk about {NEXT_CONTEXT}. {NEXT_QUESTION}",
    "I really like how clearly you explained {CURRENT_CONTEXT}! Now let's explore {NEXT_CONTEXT} for a bit. {NEXT_QUESTION}",
    "Awesome job discussing {CURRENT_CONTEXT}! To keep things fresh, let's look at another part of this topic: {NEXT_CONTEXT}. {NEXT_QUESTION}",
    "You're doing really well with {CURRENT_CONTEXT}, so let's branch out to {NEXT_CONTEXT}. {NEXT_QUESTION}",
    "That was a solid discussion on {CURRENT_CONTEXT}! Let's shift our focus to {NEXT_CONTEXT} now. {NEXT_QUESTION}"
  ];

  class AdaptiveContextSwitchSimulation {
    constructor(options = {}) {
      this.isHeadless = Boolean(options.headless);
      this.isPaused = false;
      this.autoRunInterval = null;
      this.particles = [];
      this.lastTime = typeof performance !== 'undefined' ? performance.now() : 0;

      // State machine state tracking
      this.state = {
        clusterKey: 'social_media',
        activeSubContext: 'Facebook',
        goodTurnsInCurrentContext: 0,
        targetGoodTurnsForSwitch: 4,
        consecutiveWeakCount: 0,
        maxConsecutiveWeakRetries: 2,
        coveredSubContexts: [],
        decision: 'CONTINUE',
        lastTransitionSpeech: '',
        lastDirective: 'SUB_CONTEXT_FOCUS: Stay on "Facebook" (0/4). Ask 1 follow-up question about "Facebook".'
      };

      if (!this.isHeadless && typeof document !== 'undefined') {
        this.initDom();
      }
    }

    initDom() {
      this.flowCanvas = document.getElementById('context-flow-canvas');
      this.flowCtx = this.flowCanvas ? this.flowCanvas.getContext('2d') : null;
      this.bindControls();
      this.updateDomView();
    }

    bindControls() {
      const btnGood = document.getElementById('btn-context-good-turn');
      const btnWeak = document.getElementById('btn-context-weak-turn');
      const btnOfftopic = document.getElementById('btn-context-offtopic-turn');
      const btnAuto = document.getElementById('btn-context-auto-run');

      if (btnGood) btnGood.onclick = () => this.triggerTurn('good');
      if (btnWeak) btnWeak.onclick = () => this.triggerTurn('weak');
      if (btnOfftopic) btnOfftopic.onclick = () => this.triggerTurn('offtopic');
      if (btnAuto) {
        btnAuto.onclick = () => {
          if (this.autoRunInterval) {
            clearInterval(this.autoRunInterval);
            this.autoRunInterval = null;
            btnAuto.textContent = 'Auto Run';
            btnAuto.classList.remove('border-emerald-500', 'text-emerald-400');
          } else {
            btnAuto.textContent = 'Stop Auto';
            btnAuto.classList.add('border-emerald-500', 'text-emerald-400');
            this.autoRunInterval = setInterval(() => {
              const types = ['good', 'good', 'weak', 'offtopic', 'good'];
              const pick = types[Math.floor(Math.random() * types.length)];
              this.triggerTurn(pick);
            }, 3000);
          }
        };
      }
    }

    evaluateTurnFsm(turnType = 'good') {
      const { state } = this;
      const siblings = SIBLING_CLUSTERS[state.clusterKey] || SIBLING_CLUSTERS.social_media;

      if (turnType === 'offtopic') {
        state.decision = 'REDIRECT';
        state.lastDirective = `SUB_CONTEXT_REDIRECT: Acknowledge in 1 sentence, then redirect to "${state.activeSubContext}" with 1 question.`;
        return { decision: state.decision, directive: state.lastDirective, switched: false };
      }

      if (turnType === 'weak') {
        state.consecutiveWeakCount++;
        if (state.consecutiveWeakCount > state.maxConsecutiveWeakRetries) {
          state.decision = 'WEAK_RESCUE';
          state.lastDirective = `SUB_CONTEXT_RESCUE: Give 1 short phrase for "${state.activeSubContext}", then ask 1 simple A-or-B question.`;
          return { decision: state.decision, directive: state.lastDirective, antiDeadlockRescue: true, switched: false };
        } else {
          state.decision = 'HOLD_WEAK';
          state.lastDirective = `SUB_CONTEXT_HOLD: Stay on "${state.activeSubContext}" (retry ${state.consecutiveWeakCount}/2). Model 1 sentence and invite repetition.`;
          return { decision: state.decision, directive: state.lastDirective, antiDeadlockRescue: false, switched: false };
        }
      }

      // Good Turn
      state.consecutiveWeakCount = 0;
      state.goodTurnsInCurrentContext++;

      if (state.goodTurnsInCurrentContext >= state.targetGoodTurnsForSwitch) {
        state.decision = 'CONTEXT_SWITCH';
        if (!state.coveredSubContexts.includes(state.activeSubContext)) {
          state.coveredSubContexts.push(state.activeSubContext);
        }

        const remaining = siblings.filter(s => !state.coveredSubContexts.includes(s) && s !== state.activeSubContext);
        const nextSub = remaining.length > 0 ? remaining[0] : siblings.find(s => s !== state.activeSubContext) || 'another aspect';
        
        state.lastTransitionSpeech = this.renderBridgeSpeech(state.activeSubContext, nextSub);
        state.activeSubContext = nextSub;
        state.goodTurnsInCurrentContext = 0;
        state.lastDirective = `CONTEXT_SWITCH: "${state.lastTransitionSpeech}"`;
        return { decision: state.decision, directive: state.lastDirective, switched: true, nextSubContext: nextSub };
      }

      state.decision = 'CONTINUE';
      state.lastDirective = `SUB_CONTEXT_FOCUS: Stay on "${state.activeSubContext}" (${state.goodTurnsInCurrentContext}/${state.targetGoodTurnsForSwitch}). Ask 1 follow-up question about "${state.activeSubContext}".`;
      return { decision: state.decision, directive: state.lastDirective, switched: false };
    }

    renderBridgeSpeech(current, next) {
      const idx = Math.floor(Math.random() * CONTEXT_SWITCH_TEMPLATES.length);
      const tmpl = CONTEXT_SWITCH_TEMPLATES[idx];
      return tmpl
        .replace(/\{CURRENT_CONTEXT\}/g, current)
        .replace(/\{NEXT_CONTEXT\}/g, next)
        .replace(/\{NEXT_QUESTION\}/g, `How do you feel about ${next} each day?`);
    }

    renderDirective() {
      return this.state.lastDirective;
    }

    triggerTurn(turnType) {
      const result = this.evaluateTurnFsm(turnType);
      this.spawnTurnPacket(turnType, result);
      this.updateDomView();
      return result;
    }

    spawnTurnPacket(turnType, result) {
      if (this.isHeadless || !this.flowCanvas) return;
      const colorMap = {
        good: '#34d399',
        weak: '#fbbf24',
        offtopic: '#fb7185'
      };
      this.particles.push({
        x: 80,
        y: 160,
        targetX: 800,
        progress: 0,
        speed: 0.015,
        color: colorMap[turnType] || '#38bdf8',
        label: turnType.toUpperCase()
      });
    }

    updateDomView() {
      if (this.isHeadless || typeof document === 'undefined') return;

      const badge = document.getElementById('fsm-decision-badge');
      const activeText = document.getElementById('fsm-active-subcontext');
      const turnsText = document.getElementById('fsm-good-turns-counter');
      const weakText = document.getElementById('fsm-weak-counter');
      const rescueText = document.getElementById('fsm-rescue-flag');
      const directiveBox = document.getElementById('context-directive-text');
      const speechBox = document.getElementById('bridge-transition-speech');
      const pillsBox = document.getElementById('subcontext-cluster-pills');

      if (badge) {
        badge.textContent = this.state.decision;
        badge.className = `fsm-state-badge state-${this.state.decision.toLowerCase().replace('_', '-')}`;
      }
      if (activeText) activeText.textContent = this.state.activeSubContext;
      if (turnsText) turnsText.textContent = `${this.state.goodTurnsInCurrentContext} / ${this.state.targetGoodTurnsForSwitch}`;
      if (weakText) weakText.textContent = `${this.state.consecutiveWeakCount} / ${this.state.maxConsecutiveWeakRetries}`;
      if (rescueText) {
        rescueText.textContent = this.state.decision === 'WEAK_RESCUE' ? 'ACTIVE (A/B)' : 'INACTIVE';
        rescueText.className = this.state.decision === 'WEAK_RESCUE' ? 'font-mono text-red-400 font-bold' : 'font-mono text-zinc-400';
      }
      if (directiveBox) directiveBox.textContent = this.state.lastDirective;
      if (speechBox && this.state.lastTransitionSpeech) {
        speechBox.textContent = `"${this.state.lastTransitionSpeech}"`;
      }

      if (pillsBox) {
        const siblings = SIBLING_CLUSTERS[this.state.clusterKey] || [];
        pillsBox.innerHTML = siblings.map(name => {
          let cls = 'subcontext-pill';
          if (name === this.state.activeSubContext) cls += ' active';
          else if (this.state.coveredSubContexts.includes(name)) cls += ' covered';
          return `<span class="${cls}">${name}</span>`;
        }).join('');
      }
    }

    updateSimulation(now) {
      if (this.isHeadless || !this.flowCtx) return;
      const ctx = this.flowCtx;
      ctx.clearRect(0, 0, this.flowCanvas.width, this.flowCanvas.height);

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.progress += p.speed;
        p.x = 80 + (p.targetX - 80) * p.progress;

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fill();

        if (p.progress >= 1) {
          this.particles.splice(i, 1);
        }
      }
    }
  }

  // Register into DiagramRegistry
  if (DiagramRegistry && typeof DiagramRegistry.register === 'function') {
    let instance = null;

    DiagramRegistry.register({
      id: 'adaptive-context-switch',
      aliases: ['context-switch', 'diagram-slot-3'],
      label: '3. Adaptive Context Switching & Dynamic FSM Pipeline',
      defaultSelected: false,
      mount(container) {
        ContextTemplate.mount(container);
      },
      init() {
        if (!instance) {
          instance = new AdaptiveContextSwitchSimulation();
        }
      },
      activate() {
        if (instance) instance.isPaused = false;
      },
      deactivate() {
        if (instance) {
          instance.isPaused = true;
          if (instance.autoRunInterval) {
            clearInterval(instance.autoRunInterval);
            instance.autoRunInterval = null;
          }
        }
      },
      resize() {},
      handleUrlParams(params) {
        if (instance && params.has('turn')) {
          instance.triggerTurn(params.get('turn'));
        }
      }
    });
  }

  return {
    AdaptiveContextSwitchSimulation,
    SIBLING_CLUSTERS,
    CONTEXT_SWITCH_TEMPLATES
  };
});
