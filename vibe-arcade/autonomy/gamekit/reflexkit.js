/* Factory-owned direct-play core. Candidate code may present this state but
 * cannot replace its timing, input, scoring or terminal authority. */
(function (root) {
  'use strict';
  const ACTIONS = Object.freeze(['parry_left', 'parry_right', 'parry_up', 'parry_down']);
  const CODE = Object.freeze({parry_left: 1, parry_right: 2, parry_up: 3, parry_down: 4});
  const DEADLINES = Object.freeze([0, 420, 330, 270]);
  const RIFT_ACTIONS = Object.freeze(['shift_left', 'shift_right', 'dash_left', 'dash_right', 'surge']);
  const RIFT_DEADLINES = Object.freeze([0, 360, 270, 210]);
  const WEAVE_ACTIONS = Object.freeze(['weave_left', 'weave_right', 'weave_up', 'weave_down']);
  const DOCK_ACTIONS = Object.freeze(['orbit_left', 'orbit_right', 'charge_pulse', 'slingshot', 'dock']);
  const VENT_ACTIONS = Object.freeze(['vent_left', 'vent_right', 'crossfeed', 'coolant_burst']);
  const VENT_DEADLINES = Object.freeze([0, 360, 300, 240]);
  const SURF_ACTIONS = Object.freeze(['bank_left', 'bank_right', 'pulse_jump', 'undertow']);
  const SURF_DEADLINES = Object.freeze([0, 300, 240, 180]);
  const CASCADE_ACTIONS = Object.freeze(['link_left', 'link_right', 'arc_bridge', 'ground_pulse']);
  const CASCADE_DEADLINES = Object.freeze([0, 420, 330, 270]);

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
  function riftPlan(seed) {
    if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw Error('invalid_seed');
    const stages = {};
    for (let stage = 1; stage <= 3; stage++) {
      const lanes = stage + 2, openings = [], gate_count = stage + 1;
      let previous = Math.floor(lanes / 2);
      for (let index = 0; index < gate_count; index++) {
        let opening = (seed + stage * 7 + index * 5) % lanes;
        if (opening === previous) opening = (opening + 1 + ((seed + index) % (lanes - 1))) % lanes;
        openings.push(opening); previous = opening;
      }
      stages[stage] = Object.freeze({lanes, openings: Object.freeze(openings), deadline_ticks: RIFT_DEADLINES[stage]});
    }
    return Object.freeze(stages);
  }
  function weavePlan(seed) {
    if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw Error('invalid_seed');
    const stages = {};
    for (let stage = 1; stage <= 3; stage++) {
      const sockets = stage + 1, tail = Array.from({length: sockets - 1}, (_, index) => index + 1);
      const rotation = tail.length ? (seed + stage * 3) % tail.length : 0;
      const order = [0, ...tail.slice(rotation), ...tail.slice(0, rotation)], operations = {};
      for (let index = 0; index < order.length; index++) {
        const socket = order[index], next = order[index + 1];
        operations[socket] = (1 << socket) | (next === undefined ? 0 : (1 << next));
      }
      stages[stage] = Object.freeze({
        sockets,
        order: Object.freeze(order),
        operations: Object.freeze(operations),
        start_mask: 1 << order[0],
        move_limit: sockets
      });
    }
    return Object.freeze(stages);
  }
  function dockPlan(seed) {
    if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw Error('invalid_seed');
    const stages = {};
    for (let stage = 1; stage <= 3; stage++) {
      const slots = stage + 3, gateCount = stage + 1, targets = [];
      let previous = 0;
      for (let gate = 0; gate < gateCount; gate++) {
        let target = 1 + ((seed + stage * 5 + gate * 3) % (slots - 1));
        if (target === previous) target = 1 + (target % (slots - 1));
        targets.push(target); previous = target;
      }
      const available = ['orbit_left', 'orbit_right'];
      if (stage >= 2) available.push('charge_pulse');
      if (stage >= 3) available.push('slingshot');
      available.push('dock');
      stages[stage] = Object.freeze({slots, gate_count: gateCount, targets: Object.freeze(targets), available: Object.freeze(available)});
    }
    return Object.freeze(stages);
  }
  function ventPlan(seed) {
    if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw Error('invalid_seed');
    const stages = {};
    for (let stage = 1; stage <= 3; stage++) {
      const length = stage + 2, hazards = [0];
      for (let beat = 1; beat < length; beat++) hazards.push((seed + stage * 5 + beat * 3) % 2);
      stages[stage] = Object.freeze({
        hazards: Object.freeze(hazards),
        available: Object.freeze(VENT_ACTIONS.slice(0, stage + 1)),
        deadline_ticks: VENT_DEADLINES[stage]
      });
    }
    return Object.freeze(stages);
  }
  function surfPlan(seed) {
    if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw Error('invalid_seed');
    const stages = {};
    for (let stage = 1; stage <= 3; stage++) {
      const bands = stage + 2, gateCount = stage + 2, targets = [2];
      for (let gate = 1; gate < gateCount; gate++) {
        const previous = targets[gate - 1], options = [];
        if (previous > 0) options.push(previous - 1);
        if (previous < bands - 1) options.push(previous + 1);
        if (stage >= 2 && previous + 2 < bands) options.push(previous + 2);
        if (stage >= 3 && previous !== 0) options.push(0);
        const target = options[(seed + stage * 7 + gate * 3) % options.length];
        targets.push(target);
      }
      stages[stage] = Object.freeze({
        bands,
        gate_count: gateCount,
        targets: Object.freeze(targets),
        available: Object.freeze(SURF_ACTIONS.slice(0, stage + 1)),
        deadline_ticks: SURF_DEADLINES[stage]
      });
    }
    return Object.freeze(stages);
  }
  function cascadePlan(seed) {
    if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw Error('invalid_seed');
    const stages = {};
    for (let stage = 1; stage <= 3; stage++) {
      const available = CASCADE_ACTIONS.slice(0, stage + 1), nodeCount = stage + 2, sequence = ['link_right'];
      for (let node = 1; node < nodeCount; node++) sequence.push(available[(seed + stage * 11 + node * 5) % available.length]);
      stages[stage] = Object.freeze({available: Object.freeze(available), sequence: Object.freeze(sequence), node_count: nodeCount, deadline_ticks: CASCADE_DEADLINES[stage]});
    }
    return Object.freeze(stages);
  }
  function createThreatParryCore() {
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
      state.threatIndex++; state.lastParry = action; state.score += 100 * stage;
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
        entities: available.length,
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
  function createRiftThreadCore() {
    function create(seed) {
      const stages = riftPlan(seed), first = stages[1];
      return {
        seed, tick: 0, stage: 1, gateIndex: 0, lane: Math.floor(first.lanes / 2), opening: first.openings[0],
        cleared: 0, completed: 0, outcome: 'playing', score: 0, interactions: 0, meaningfulActions: 0,
        deadline: first.deadline_ticks, danger: 1, lastMove: 'ready', stages
      };
    }
    function selectedAction(input) { return RIFT_ACTIONS.find(name => input?.actions?.[name] === true) || null; }
    function step(state, input) {
      if (state.outcome !== 'playing') return state;
      state.tick++;
      const stagePlan = state.stages[state.stage];
      state.danger = Math.max(0, Math.min(1, (state.deadline - state.tick) / stagePlan.deadline_ticks));
      if (state.tick >= state.deadline) { state.outcome = 'failure'; state.lastMove = 'gate_collision'; return state; }
      const action = selectedAction(input);
      if (!action) return state;
      state.interactions++;
      if (action !== 'surge') {
        if ((action === 'dash_left' && state.stage < 2) || (action === 'dash_right' && state.stage < 3)) return state;
        const delta = action === 'shift_left' ? -1 : action === 'shift_right' ? 1 : action === 'dash_left' ? -2 : 2;
        const next = Math.max(0, Math.min(stagePlan.lanes - 1, state.lane + delta));
        if (next !== state.lane) { state.lane = next; state.meaningfulActions++; state.lastMove = action; }
        else state.lastMove = 'rail_block';
        return state;
      }
      state.meaningfulActions++;
      if (state.lane !== state.opening) { state.outcome = 'failure'; state.lastMove = 'wrong_surge'; return state; }
      state.cleared++; state.score += 150 * state.stage; state.gateIndex++; state.lastMove = 'gate_cleared';
      if (state.gateIndex >= stagePlan.openings.length) {
        state.completed++;
        if (state.stage === 3) { state.stage = 4; state.outcome = 'success'; state.danger = 0; return state; }
        state.stage++; state.gateIndex = 0;
        const nextStage = state.stages[state.stage]; state.lane = Math.floor(nextStage.lanes / 2);
      }
      const next = state.stages[state.stage]; state.opening = next.openings[state.gateIndex]; state.deadline = state.tick + next.deadline_ticks; state.danger = 1;
      return state;
    }
    function observe(state) {
      const active = state.outcome === 'playing' ? state.stages[state.stage] : {lanes: 0};
      return {
        tick: state.tick, score: state.score, progress: state.completed, interactions: state.interactions,
        entities: active.lanes,
        quality: {
          stage: state.stage, complexity: state.outcome === 'playing' ? active.lanes - 1 : 0,
          objective_progress: state.completed, meaningful_actions: state.meaningfulActions,
          reversible_state_key: [state.stage, state.gateIndex, state.lane, state.opening, state.cleared, state.completed, state.outcome].join(':')
        }
      };
    }
    function terminal(state) { return state.outcome === 'success' || state.outcome === 'failure'; }
    return Object.freeze({create, step, observe, terminal});
  }
  function createConstellationWeaveCore() {
    function create(seed) {
      const stages = weavePlan(seed), first = stages[1];
      return {
        seed, tick: 0, stage: 1, moves: 0, litMask: first.start_mask, usedMask: 0,
        woven: 0, completed: 0, outcome: 'playing', score: 0, interactions: 0,
        meaningfulActions: 0, lastWeave: 'ready', stages
      };
    }
    function selectedAction(input) { return WEAVE_ACTIONS.find(name => input?.actions?.[name] === true) || null; }
    function loadStage(state, stage) {
      const next = state.stages[stage];
      state.stage = stage; state.moves = 0; state.litMask = next.start_mask; state.usedMask = 0;
    }
    function step(state, input) {
      if (state.outcome !== 'playing') return state;
      state.tick++;
      const action = selectedAction(input);
      if (!action) return state;
      state.interactions++; state.meaningfulActions++;
      const socket = WEAVE_ACTIONS.indexOf(action), stagePlan = state.stages[state.stage];
      if (socket < 0 || socket >= stagePlan.sockets) {
        state.outcome = 'failure'; state.lastWeave = 'locked_socket'; return state;
      }
      const wasLit = (state.litMask & (1 << socket)) !== 0, wasUsed = (state.usedMask & (1 << socket)) !== 0;
      state.moves++; state.litMask ^= stagePlan.operations[socket]; state.usedMask ^= 1 << socket;
      if (!wasUsed) state.woven++;
      state.lastWeave = wasUsed ? 'crossed_thread' : wasLit ? 'chain_weave' : 'open_weave';
      if (!wasUsed) state.score += 80 * state.stage + (wasLit ? 70 : 20);
      if (state.moves < stagePlan.move_limit) return state;
      if (state.litMask !== 0 || state.usedMask !== (1 << stagePlan.sockets) - 1) {
        state.outcome = 'failure'; state.lastWeave = 'lattice_overload'; return state;
      }
      state.completed++;
      if (state.stage === 3) { state.stage = 4; state.outcome = 'success'; state.lastWeave = 'lattice_complete'; return state; }
      loadStage(state, state.stage + 1); state.lastWeave = 'constellation_complete';
      return state;
    }
    function observe(state) {
      const active = state.outcome === 'playing' ? state.stages[state.stage] : {sockets: 0, operations: {}};
      return {
        tick: state.tick, score: state.score, progress: state.completed, interactions: state.interactions,
        entities: active.sockets,
        quality: {
          stage: state.stage, complexity: state.outcome === 'playing' ? active.sockets : 0,
          objective_progress: state.completed, meaningful_actions: state.meaningfulActions,
          reversible_state_key: [state.stage, state.moves, state.litMask, state.usedMask, state.woven, state.completed, state.outcome].join(':')
        }
      };
    }
    function terminal(state) { return state.outcome === 'success' || state.outcome === 'failure'; }
    return Object.freeze({create, step, observe, terminal});
  }
  function createOrbitDockCore() {
    function create(seed) {
      const stages = dockPlan(seed), first = stages[1];
      return {
        seed, tick: 0, stage: 1, gateIndex: 0, position: 0, target: first.targets[0], warning: 0,
        docked: 0, completed: 0, outcome: 'playing', score: 0, interactions: 0,
        meaningfulActions: 0, deadline: 2700, danger: 1, lastDock: 'ready', stages
      };
    }
    function selectedAction(state, input) {
      const available = state.stages[state.stage]?.available || [];
      return available.find(name => input?.actions?.[name] === true) || null;
    }
    function move(state, delta, action, reward) {
      const slots = state.stages[state.stage].slots;
      state.position = (state.position + delta + slots) % slots;
      state.warning = 0; state.lastDock = action; state.score += reward * state.stage;
    }
    function step(state, input) {
      if (state.outcome !== 'playing') return state;
      state.tick++;
      state.danger = Math.max(0, (state.deadline - state.tick) / state.deadline);
      if (state.tick >= state.deadline) { state.outcome = 'failure'; state.lastDock = 'relay_timeout'; return state; }
      const action = selectedAction(state, input);
      if (!action) return state;
      state.interactions++; state.meaningfulActions++;
      if (action === 'orbit_left') { move(state, -1, action, 4); return state; }
      if (action === 'orbit_right') { move(state, 1, action, 4); return state; }
      if (action === 'charge_pulse') { move(state, 2, action, 7); return state; }
      if (action === 'slingshot') { move(state, 3, action, 10); return state; }
      if (state.position !== state.target) {
        if (!state.warning) { state.warning = 1; state.lastDock = 'alignment_warning'; return state; }
        state.outcome = 'failure'; state.lastDock = 'second_bad_dock'; return state;
      }
      const stagePlan = state.stages[state.stage];
      state.docked++; state.gateIndex++; state.warning = 0; state.lastDock = 'gate_docked';
      state.score += 120 * state.stage;
      if (state.gateIndex >= stagePlan.gate_count) {
        state.completed++;
        if (state.stage === 3) { state.stage = 4; state.outcome = 'success'; state.lastDock = 'relay_complete'; return state; }
        state.stage++; state.gateIndex = 0; state.position = 0; state.lastDock = 'ring_complete';
      }
      const next = state.stages[state.stage]; state.target = next.targets[state.gateIndex];
      return state;
    }
    function observe(state) {
      const active = state.outcome === 'playing' ? state.stages[state.stage] : {slots: 0, available: []};
      return {
        tick: state.tick, score: state.score, progress: state.completed, interactions: state.interactions,
        entities: active.slots,
        quality: {
          stage: state.stage, complexity: active.available.length, objective_progress: state.completed,
          meaningful_actions: state.meaningfulActions,
          reversible_state_key: [state.stage, state.gateIndex, state.position, state.target, state.warning, state.docked, state.completed, state.outcome].join(':')
        }
      };
    }
    function terminal(state) { return state.outcome === 'success' || state.outcome === 'failure'; }
    return Object.freeze({create, step, observe, terminal});
  }
  function createThermalVentCore() {
    function create(seed) {
      const stages = ventPlan(seed), first = stages[1];
      return {
        seed, tick: 0, stage: 1, beat: 0, leftHeat: 1, rightHeat: 1, hazard: first.hazards[0],
        warning: 0, cooled: 0, completed: 0, outcome: 'playing', score: 0, interactions: 0,
        meaningfulActions: 0, deadline: first.deadline_ticks, danger: 1, lastVent: 'ready', stages
      };
    }
    function selectedAction(state, input) {
      const available = state.stages[state.stage]?.available || [];
      return available.find(name => input?.actions?.[name] === true) || null;
    }
    function loadStage(state, stage) {
      const next = state.stages[stage];
      state.stage = stage; state.beat = 0; state.leftHeat = 1; state.rightHeat = 1;
      state.hazard = next.hazards[0]; state.warning = 0; state.deadline = state.tick + next.deadline_ticks; state.danger = 1;
    }
    function step(state, input) {
      if (state.outcome !== 'playing') return state;
      state.tick++;
      const stagePlan = state.stages[state.stage];
      state.danger = Math.max(0, Math.min(1, (state.deadline - state.tick) / stagePlan.deadline_ticks));
      if (state.tick >= state.deadline) { state.outcome = 'failure'; state.lastVent = 'thermal_timeout'; return state; }
      const action = selectedAction(state, input);
      if (!action) return state;
      state.interactions++; state.meaningfulActions++;
      const direct = action === 'vent_left' || action === 'vent_right';
      const correct = action === (state.hazard === 0 ? 'vent_left' : 'vent_right');
      const stageMarker = state.stage === 1 ? 'ready' : 'chamber_stable';
      if (state.warning) {
        if (direct && !correct) { state.warning = 2; state.outcome = 'failure'; state.lastVent = 'chamber_overload'; return state; }
        state.leftHeat = 1; state.rightHeat = 1; state.warning = 0; state.lastVent = stageMarker; return state;
      }
      if (direct && !correct) {
        state.leftHeat = state.hazard === 0 ? 4 : 2; state.rightHeat = state.hazard === 1 ? 4 : 2;
        state.warning = 1; state.lastVent = 'thermal_warning'; state.deadline = Math.max(state.tick + 90, state.deadline - 45); return state;
      }
      if (!direct) {
        state.leftHeat = 1; state.rightHeat = 1; state.lastVent = state.lastVent === action ? stageMarker : action; return state;
      }
      state.leftHeat = 1; state.rightHeat = 1;
      state.warning = 0; state.lastVent = action; state.beat++; state.cooled++;
      state.score += correct ? 70 * state.stage : 35 * state.stage;
      if (state.beat >= stagePlan.hazards.length) {
        state.completed++;
        if (state.stage === 3) { state.stage = 4; state.outcome = 'success'; state.danger = 0; state.lastVent = 'thermal_complete'; return state; }
        loadStage(state, state.stage + 1); state.lastVent = 'chamber_stable'; return state;
      }
      state.hazard = stagePlan.hazards[state.beat]; state.deadline = state.tick + stagePlan.deadline_ticks; state.danger = 1;
      return state;
    }
    function observe(state) {
      const active = state.outcome === 'playing' ? state.stages[state.stage] : {available: []};
      return {
        tick: state.tick, score: state.score, progress: state.completed, interactions: state.interactions,
        entities: state.outcome === 'playing' ? 4 : 0,
        quality: {
          stage: state.stage, complexity: active.available.length, objective_progress: state.completed,
          meaningful_actions: state.meaningfulActions,
          reversible_state_key: [state.stage, state.beat, state.leftHeat, state.rightHeat, state.hazard, state.warning, state.lastVent, state.completed, state.outcome].join(':')
        }
      };
    }
    function terminal(state) { return state.outcome === 'success' || state.outcome === 'failure'; }
    return Object.freeze({create, step, observe, terminal});
  }
  function createCurrentSurfCore() {
    function create(seed) {
      const stages = surfPlan(seed), first = stages[1];
      return {
        seed, tick: 0, stage: 1, gateIndex: 0, band: 1, target: first.targets[0], warning: 0,
        cleared: 0, completed: 0, outcome: 'playing', score: 0, interactions: 0,
        meaningfulActions: 0, deadline: first.deadline_ticks, danger: 1, lastRide: 'ready', stages
      };
    }
    function selectedAction(state, input) {
      const available = state.stages[state.stage]?.available || [];
      return available.find(name => input?.actions?.[name] === true) || null;
    }
    function destination(state, action) {
      const bands = state.stages[state.stage].bands;
      if (action === 'bank_left') return Math.max(0, state.band - 1);
      if (action === 'bank_right') return Math.min(bands - 1, state.band + 1);
      if (action === 'pulse_jump') return Math.min(bands - 1, state.band + 2);
      return 0;
    }
    function loadStage(state, stage) {
      const next = state.stages[stage];
      state.stage = stage; state.gateIndex = 0; state.band = 1; state.target = next.targets[0];
      state.warning = 0; state.deadline = state.tick + next.deadline_ticks; state.danger = 1;
    }
    function step(state, input) {
      if (state.outcome !== 'playing') return state;
      state.tick++;
      const stagePlan = state.stages[state.stage];
      state.danger = Math.max(0, Math.min(1, (state.deadline - state.tick) / stagePlan.deadline_ticks));
      if (state.tick >= state.deadline) { state.outcome = 'failure'; state.lastRide = 'break_collision'; return state; }
      const action = selectedAction(state, input);
      if (!action) return state;
      state.interactions++; state.meaningfulActions++;
      const warningCode = SURF_ACTIONS.indexOf(action) + 1;
      if (state.warning) {
        if (state.warning === warningCode) { state.outcome = 'failure'; state.lastRide = 'second_missed_gate'; return state; }
        state.warning = 0; state.lastRide = 'wake_recovered'; return state;
      }
      const previousBand = state.band, nextBand = destination(state, action), moved = nextBand !== state.band;
      state.lastRide = moved ? action : 'rail_scrape';
      if (nextBand !== state.target) {
        state.band = previousBand;
        state.warning = warningCode; state.deadline = Math.max(state.tick + 60, state.deadline - 30); state.lastRide = 'wake_warning'; return state;
      }
      state.band = nextBand;
      state.gateIndex++; state.cleared++; state.lastRide = 'gate_carved';
      state.score += 120 * state.stage;
      if (state.gateIndex >= stagePlan.gate_count) {
        state.completed++;
        if (state.stage === 3) { state.stage = 4; state.outcome = 'success'; state.danger = 0; state.lastRide = 'current_mastered'; return state; }
        loadStage(state, state.stage + 1); state.lastRide = 'current_cleared'; return state;
      }
      state.target = stagePlan.targets[state.gateIndex]; state.deadline = state.tick + stagePlan.deadline_ticks; state.danger = 1;
      return state;
    }
    function observe(state) {
      const active = state.outcome === 'playing' ? state.stages[state.stage] : {bands: 0, available: []};
      return {
        tick: state.tick, score: state.score, progress: state.completed, interactions: state.interactions,
        entities: state.outcome === 'playing' ? active.bands + 2 : 0,
        quality: {
          stage: state.stage, complexity: active.available.length, objective_progress: state.completed,
          meaningful_actions: state.meaningfulActions,
          reversible_state_key: [state.stage, state.gateIndex, state.band, state.target, state.warning, state.cleared, state.completed, state.outcome].join(':')
        }
      };
    }
    function terminal(state) { return state.outcome === 'success' || state.outcome === 'failure'; }
    return Object.freeze({create, step, observe, terminal});
  }
  function createPulseCascadeCore() {
    function create(seed) {
      const stages = cascadePlan(seed), first = stages[1];
      return {
        seed, tick: 0, stage: 1, nodeIndex: 0, cue: first.sequence[0], warning: null,
        linked: 0, completed: 0, outcome: 'playing', score: 0, interactions: 0,
        meaningfulActions: 0, deadline: first.deadline_ticks, danger: 1, lastLink: 'ready', stages
      };
    }
    function selectedAction(state, input) {
      const available = state.stages[state.stage]?.available || [];
      return available.find(name => input?.actions?.[name] === true) || null;
    }
    function step(state, input) {
      if (state.outcome !== 'playing') return state;
      state.tick++;
      const stagePlan = state.stages[state.stage];
      state.danger = Math.max(0, Math.min(1, (state.deadline - state.tick) / stagePlan.deadline_ticks));
      if (state.tick >= state.deadline) { state.outcome = 'failure'; state.lastLink = 'cascade_timeout'; return state; }
      const action = selectedAction(state, input);
      if (!action) return state;
      state.interactions++; state.meaningfulActions++;
      if (state.warning) {
        if (state.warning === action) { state.outcome = 'failure'; state.lastLink = 'repeated_unstable_link'; return state; }
        state.warning = null; state.lastLink = 'link_recovered'; state.deadline = state.tick + stagePlan.deadline_ticks; state.danger = 1; return state;
      }
      if (action !== state.cue) {
        state.warning = action; state.lastLink = 'unstable_link'; state.deadline = Math.max(state.tick + 90, state.deadline - 45); return state;
      }
      state.warning = null; state.nodeIndex++; state.linked++; state.lastLink = 'chain_linked'; state.score += 90 * state.stage;
      if (state.nodeIndex >= stagePlan.node_count) {
        state.completed++;
        if (state.stage === 3) { state.stage = 4; state.outcome = 'success'; state.danger = 0; state.lastLink = 'cascade_complete'; return state; }
        state.stage++; state.nodeIndex = 0; state.lastLink = 'array_ignited';
      }
      const next = state.stages[state.stage]; state.cue = next.sequence[state.nodeIndex]; state.deadline = state.tick + next.deadline_ticks; state.danger = 1;
      return state;
    }
    function observe(state) {
      const active = state.outcome === 'playing' ? state.stages[state.stage] : {available: [], node_count: 0};
      return {
        tick: state.tick, score: state.score, progress: state.completed, interactions: state.interactions,
        entities: state.outcome === 'playing' ? active.node_count + 2 : 0,
        quality: {
          stage: state.stage, complexity: active.available.length, objective_progress: state.completed,
          meaningful_actions: state.meaningfulActions,
          reversible_state_key: [state.stage, state.nodeIndex, state.cue, state.warning, state.linked, state.completed, state.outcome].join(':')
        }
      };
    }
    function terminal(state) { return state.outcome === 'success' || state.outcome === 'failure'; }
    return Object.freeze({create, step, observe, terminal});
  }
  function createCore(config = {}) {
    if (config.id === 'threat-parry-v1') return createThreatParryCore();
    if (config.id === 'rift-thread-v1') return createRiftThreadCore();
    if (config.id === 'constellation-weave-v1') return createConstellationWeaveCore();
    if (config.id === 'orbit-dock-v1') return createOrbitDockCore();
    if (config.id === 'thermal-vent-v1') return createThermalVentCore();
    if (config.id === 'current-surf-v1') return createCurrentSurfCore();
    if (config.id === 'pulse-cascade-v1') return createPulseCascadeCore();
    throw Error('unsupported_reflex_core');
  }
  const api = Object.freeze({create: createCore, plan, riftPlan, weavePlan, dockPlan, ventPlan, surfPlan, cascadePlan, actions: ACTIONS, riftActions: RIFT_ACTIONS, weaveActions: WEAVE_ACTIONS, dockActions: DOCK_ACTIONS, ventActions: VENT_ACTIONS, surfActions: SURF_ACTIONS, cascadeActions: CASCADE_ACTIONS, version: 'reflexkit-5'});
  root.PlayJoltReflexKit = api;
  if (typeof module !== 'undefined') module.exports = api;
})(globalThis);
