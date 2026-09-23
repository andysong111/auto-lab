(() => {
  'use strict';

  // Each room is [edge triples, key cells, exit, par]. Edge triples are min cell,
  // max cell, and the permanent-key mask required to cross.
  const PACKS = [[
    [[[0,1,0],[0,4,0],[1,2,0],[4,5,0],[4,8,0],[5,9,0],[8,9,0],[8,12,0],[9,10,0],[9,13,0],[10,11,1],[10,14,0],[11,15,0],[12,13,0],[13,14,0],[14,15,0]],[11],13,8],
    [[[0,1,0],[0,4,0],[1,2,0],[1,5,0],[2,6,2],[4,5,0],[4,8,0],[5,9,0],[6,7,0],[6,10,0],[7,11,0],[9,10,0],[10,11,2]],[2,11],0,10],
    [[[0,1,2],[0,4,0],[1,2,3],[1,5,0],[2,6,3],[4,5,0],[4,8,2],[5,6,0],[5,9,0],[8,9,0],[9,10,1],[9,13,0],[10,14,0],[13,14,0],[14,15,0]],[8,10,2],15,14]
  ],[
    [[[0,1,0],[0,4,0],[1,2,0],[4,5,0],[5,9,0],[7,11,0],[9,10,0],[9,13,1],[10,11,0],[10,14,0],[13,14,0]],[13],11,7],
    [[[0,1,0],[0,4,0],[1,5,0],[4,5,0],[5,9,0],[6,7,0],[6,10,0],[7,11,0],[9,10,0],[9,13,0],[10,11,2],[10,14,0],[11,15,0],[12,13,0],[13,14,0],[14,15,2]],[0,15],13,12],
    [[[1,2,0],[1,5,0],[2,3,0],[4,5,0],[5,6,0],[5,9,0],[6,10,1],[9,10,2],[9,13,0],[10,11,2],[10,14,0],[12,13,3],[13,14,0]],[14,2,12],3,15]
  ],[
    [[[0,1,0],[0,4,1],[1,2,0],[2,3,0],[2,6,0],[3,7,0],[4,5,0],[5,9,0],[6,7,0],[6,10,0],[9,10,0],[10,14,0]],[1],7,8],
    [[[1,2,0],[1,5,0],[2,3,0],[2,6,0],[4,5,0],[4,8,2],[5,9,0],[6,10,0],[8,9,0],[8,12,0],[9,10,0],[10,14,1],[12,13,0],[13,14,0],[14,15,0]],[15,6],2,10],
    [[[0,1,3],[0,4,3],[1,2,0],[1,5,0],[2,6,1],[4,5,0],[5,6,0],[5,9,0],[6,10,0],[9,10,1],[10,11,1],[10,14,0],[11,15,0],[14,15,0]],[14,2,0],15,14]
  ],[
    [[[0,4,0],[3,7,0],[4,5,0],[5,9,0],[6,7,0],[6,10,0],[7,11,0],[9,10,1],[9,13,0],[10,11,0],[10,14,0],[11,15,0],[13,14,0],[14,15,0]],[10],15,6],
    [[[0,1,2],[0,4,0],[1,2,0],[1,5,0],[2,6,0],[4,5,0],[4,8,0],[5,9,0],[8,9,0],[8,12,0],[9,13,2],[11,15,0],[12,13,0],[13,14,0],[14,15,0]],[6,13],14,11],
    [[[0,1,2],[0,4,2],[1,5,0],[3,7,0],[4,5,0],[5,6,0],[5,9,0],[6,7,0],[8,9,1],[9,13,0],[13,14,0],[14,15,3]],[7,13,15],3,15]
  ],[
    [[[0,1,0],[0,4,0],[4,5,0],[5,9,0],[6,7,0],[6,10,1],[7,11,0],[9,10,0],[10,11,0],[10,14,0],[11,15,0],[14,15,0]],[6],14,7],
    [[[0,1,1],[0,4,0],[1,2,0],[1,5,0],[2,3,0],[4,5,0],[5,9,0],[9,10,0],[9,13,1],[10,14,0],[12,13,0],[13,14,0],[14,15,0]],[12,0],15,12],
    [[[0,1,0],[0,4,0],[1,2,1],[1,5,0],[2,3,0],[2,6,2],[4,5,0],[5,6,0],[5,9,0],[6,10,0],[9,10,1],[9,13,0],[10,14,0],[12,13,3],[13,14,0]],[14,0,12],3,15]
  ],[
    [[[0,1,0],[0,4,0],[1,2,0],[2,6,0],[4,5,0],[5,9,0],[6,7,0],[6,10,0],[7,11,0],[9,10,1],[10,11,0],[10,14,0],[11,15,0],[14,15,0]],[14],15,8],
    [[[0,1,0],[0,4,0],[1,2,0],[1,5,0],[2,3,0],[3,7,0],[4,5,0],[4,8,0],[5,9,0],[7,11,0],[8,9,0],[8,12,0],[9,10,2],[10,11,0],[11,15,1]],[8,10],0,10],
    [[[1,2,1],[1,5,0],[2,3,0],[2,6,0],[4,5,0],[4,8,2],[5,6,0],[5,9,0],[8,9,1],[9,13,0],[11,15,3],[13,14,0],[14,15,3]],[13,2,15],3,15]
  ]];
  const DIRS = [[-1,0],[0,-1],[1,0],[0,1]];

  function packIndex(seed) {
    const h = Math.imul((seed >>> 0) ^ (seed >>> 16), 1177) >>> 0;
    return ((h ^ (h >>> 13)) >>> 0) % 6;
  }
  function roomFor(seed, stage) { return PACKS[packIndex(seed)][stage - 1]; }
  function target(room, cell, direction, keyMask) {
    const x = cell % 4 + DIRS[direction][0];
    const y = (cell / 4 | 0) + DIRS[direction][1];
    if (x < 0 || x > 3 || y < 0 || y > 3) return -1;
    const next = y * 4 + x;
    const lo = cell < next ? cell : next, hi = cell < next ? next : cell;
    for (let i = 0; i < room[0].length; i += 1) {
      const edge = room[0][i];
      if (edge[0] === lo && edge[1] === hi) return (keyMask & edge[2]) === edge[2] ? next : -1;
    }
    return -1;
  }
  function allKeys(room, mask) { return mask === ((1 << room[1].length) - 1); }
  function direction(input) {
    if (input.x < 0) return 0;
    if (input.y < 0) return 1;
    if (input.x > 0) return 2;
    if (input.y > 0) return 3;
    return -1;
  }
  function move(state, dir) {
    const room = roomFor(state.seed, state.stage);
    let next = target(room, state.cell, dir, state.key_mask);
    if (next === room[2] && !allKeys(room, state.key_mask)) next = -1;
    state.feedback_token += 1;
    state.feedback_from = state.cell;
    state.feedback_to = next < 0 ? state.cell : next;
    state.feedback_kind = next < 0 ? 'blocked' : 'step';
    if (next < 0) return;
    state.cell = next;
    state.moves += 1;
    state.total_moves = state.moves;
    state.room_moves += 1;
    state.meaningful_actions += 1;
    const key = room[1].indexOf(next);
    if (key >= 0 && !(state.key_mask & (1 << key))) {
      state.key_mask |= 1 << key;
      state.feedback_kind = 'key';
    }
    if (next === room[2]) {
      const extra = Math.max(0, state.room_moves - room[3]);
      state.score += Math.max(20, 200 - 15 * extra);
      state.total_par += room[3];
      state.objective_progress += 1;
      state.stage += 1;
      state.cell = 5;
      state.key_mask = 0;
      state.room_moves = 0;
      state.feedback_to = 5;
      state.feedback_kind = state.stage === 4 ? 'success' : 'clear';
      if (state.stage === 4) state.outcome = 'success';
    }
  }
  function create(seed) {
    return { seed:seed >>> 0, tick:0, score:0, stage:1, cell:5, key_mask:0, outcome:'playing', objective_progress:0, meaningful_actions:0, moves:0, total_moves:0, total_par:0, room_moves:0, pointer_actions:0, latch:-1, feedback_token:0, feedback_from:5, feedback_to:5, feedback_kind:'none' };
  }
  function step(state, input) {
    if (state.outcome !== 'playing') return;
    state.tick += 1;
    if (input.action && input.pointer) {
      const d = Math.max(0, Math.min(3, Math.floor(input.pointer.x * 4)));
      state.pointer_actions += 1;
      state.latch = -1;
      move(state, d);
    } else {
      const d = direction(input);
      if (d < 0) state.latch = -1;
      else if (d !== state.latch) { state.latch = d; move(state, d); }
    }
    if (state.outcome === 'playing' && state.tick >= 2400) state.outcome = 'failure';
  }
  function legalCount(state) {
    if (state.outcome !== 'playing') return 0;
    const room = roomFor(state.seed, state.stage);
    let n = 0;
    for (let d = 0; d < 4; d += 1) {
      const p = target(room, state.cell, d, state.key_mask);
      if (p >= 0 && (p !== room[2] || allKeys(room, state.key_mask))) n += 1;
    }
    return n;
  }
  function observe(state) {
    return { tick:state.tick, score:state.score, progress:Math.round(state.tick / 6) / 10, interactions:state.meaningful_actions, entities:16, quality:{ stage:state.stage, complexity:legalCount(state), objective_progress:state.objective_progress, meaningful_actions:state.meaningful_actions, reversible_state_key:state.stage + ':' + state.cell + ':' + state.key_mask + ':' + state.outcome } };
  }
  function terminal(state) { return state.outcome !== 'playing'; }
  globalThis.KeywakeCore = { create, step, observe, terminal, roomFor, packIndex };
})();
