/* Factory-owned direct-play core. Candidate code may present this state but
 * cannot replace its timing, input, scoring or terminal authority. */
(function (root) {
  'use strict';
  const ACTIONS = Object.freeze(['parry_left', 'parry_right', 'parry_up', 'parry_down']);
  const CODE = Object.freeze({parry_left: 1, parry_right: 2, parry_up: 3, parry_down: 4});
  const DEADLINES = Object.freeze([0, 420, 330, 270]);

  function directions(stage) { return ACTIONS.slice(0, stage + 1); }
  function plan(seed) {
    if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw Error('invalid_seed');
    const stages = {};
    for (let stage = 1; stage <= 3; stage++) {
      const available = directions(stage), length = stage * 2, sequence = ['parry_right'];
      for (let index = 1; index < length; index++) sequence.push(available[(seed + stage * 3 + index * 5) % available.length]);
      stages[stage] = Object.freeze({available: Object.freeze(available), sequence: Object.freeze(sequence), deadline_ticks: DEADLINES[stage]});
    }
    return Object.freeze(stages);
  }
  function createCore(config = {}) {
    if (config.id !== 'threat-parry-v1') throw Error('unsupported_reflex_core');
    function create(seed) {
      const stages = plan(seed), first = stages[1];
      return {
        seed, tick: 0, stage: 1, threatIndex: 0, cue: CODE[first.sequence[0]], miss: 0,
        completed: 0, outcome: 'playing', score: 0, interactions: 0, meaningfulActions: 0,
        deadline: first.deadline_ticks, danger: 1, lastParry: 'ready', stages
      };
    }
    function selectedAction(state, input) {
      const available = state.stages[state.stage]?.available || [];
      return available.find(name => input?.actions?.[name] === true) || null;
    }
    function step(state, input) {
      if (state.outcome !== 'playing') return state;
      state.tick++;
      state.danger = Math.max(0, Math.min(1, (state.deadline - state.tick) / state.stages[state.stage].deadline_ticks));
      if (state.tick >= state.deadline) { state.outcome = 'failure'; state.lastParry = 'missed_deadline'; return state; }
      const action = selectedAction(state, input);
      if (!action) return state;
      state.interactions++; state.meaningfulActions++;
      if (state.miss) { state.miss = 0; state.lastParry = 'recovered'; return state; }
      const actionCode = CODE[action];
      if (actionCode !== state.cue) {
        state.miss = actionCode; state.lastParry = 'wrong_' + action.slice(6);
        state.deadline = Math.max(state.tick + 60, state.deadline - 30);
        return state;
      }
      const stage = state.stage, stagePlan = state.stages[stage];
      state.threatIndex++; state.lastParry = action; state.score += 100 * stage + Math.max(0, state.deadline - state.tick);
      if (state.threatIndex >= stagePlan.sequence.length) {
        state.completed++;
        if (stage === 3) { state.stage = 4; state.outcome = 'success'; state.danger = 0; return state; }
        state.stage++; state.threatIndex = 0;
      }
      const next = state.stages[state.stage];
      state.cue = CODE[next.sequence[state.threatIndex]]; state.deadline = state.tick + next.deadline_ticks; state.danger = 1;
      return state;
    }
    function observe(state) {
      const available = state.outcome === 'playing' ? state.stages[state.stage].available : [];
      return {
        tick: state.tick, score: state.score, progress: state.completed, interactions: state.interactions,
        entities: available.map((action, index) => ({id: action, active: CODE[action] === state.cue, index, danger: state.danger})),
        quality: {
          stage: state.stage, complexity: state.outcome === 'playing' ? available.length : 0,
          objective_progress: state.completed, meaningful_actions: state.meaningfulActions,
          reversible_state_key: [state.stage, state.threatIndex, state.cue, state.miss, state.completed, state.outcome].join(':')
        }
      };
    }
    function terminal(state) { return state.outcome === 'success' || state.outcome === 'failure'; }
    return Object.freeze({create, step, observe, terminal});
  }
  const api = Object.freeze({create: createCore, plan, actions: ACTIONS, version: 'reflexkit-1'});
  root.PlayJoltReflexKit = api;
  if (typeof module !== 'undefined') module.exports = api;
})(globalThis);
