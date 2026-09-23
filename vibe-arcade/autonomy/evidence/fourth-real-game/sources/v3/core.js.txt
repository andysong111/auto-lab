(() => {
  'use strict';

  const BASE_ROOMS = [
    { walls: [1, 3], keys: [], exit: 8, optimal: 2 },
    { walls: [7], keys: [0], exit: 2, optimal: 4 },
    { walls: [], keys: [0, 6], exit: 2, optimal: 6 }
  ];
  const DIRS = [[-1, 0], [0, -1], [1, 0], [0, 1]];

  function transformCell(cell, variant) {
    let x = cell % 3;
    let y = Math.floor(cell / 3);
    if (variant & 4) x = 2 - x;
    for (let i = 0; i < (variant & 3); i += 1) {
      const nextX = 2 - y;
      y = x;
      x = nextX;
    }
    return y * 3 + x;
  }

  function roomFor(seed, roomIndex) {
    const base = BASE_ROOMS[roomIndex];
    const variant = (seed >>> (3 * roomIndex)) & 7;
    return {
      walls: base.walls.map((cell) => transformCell(cell, variant)),
      keys: base.keys.map((cell) => transformCell(cell, variant)),
      exit: transformCell(base.exit, variant),
      optimal: base.optimal
    };
  }

  function has(list, cell) {
    return list.indexOf(cell) !== -1;
  }

  function heldDirection(input) {
    if (input.x < 0) return 0;
    if (input.y < 0) return 1;
    if (input.x > 0) return 2;
    if (input.y > 0) return 3;
    return -1;
  }

  function allKeysHeld(state, room) {
    return state.key_mask === ((1 << room.keys.length) - 1);
  }

  function destination(state, room, direction) {
    const x = state.cell % 3 + DIRS[direction][0];
    const y = Math.floor(state.cell / 3) + DIRS[direction][1];
    if (x < 0 || x > 2 || y < 0 || y > 2) return -1;
    const cell = y * 3 + x;
    if (has(room.walls, cell)) return -1;
    if (cell === room.exit && !allKeysHeld(state, room)) return -1;
    return cell;
  }

  function attempt(state, direction) {
    const room = roomFor(state.seed, state.stage - 1);
    const next = destination(state, room, direction);
    state.feedback_token += 1;
    state.feedback_from = state.cell;
    state.feedback_to = next < 0 ? state.cell : next;
    state.feedback_kind = next < 0 ? 'blocked' : 'step';
    if (next < 0) return;

    state.cell = next;
    state.moves += 1;
    state.room_moves += 1;
    state.meaningful_actions += 1;

    const keyIndex = room.keys.indexOf(next);
    if (keyIndex !== -1 && (state.key_mask & (1 << keyIndex)) === 0) {
      state.key_mask |= (1 << keyIndex);
      state.feedback_kind = 'key';
    }

    if (next === room.exit) {
      const points = Math.max(100, 200 - 20 * Math.max(0, state.room_moves - room.optimal));
      state.score += points;
      state.objective_progress += 1;
      state.stage += 1;
      state.cell = 4;
      state.key_mask = 0;
      state.room_moves = 0;
      state.feedback_kind = state.stage === 4 ? 'success' : 'door';
      state.feedback_to = 4;
      if (state.stage === 4) state.outcome = 'success';
    }
  }

  function create(seed) {
    return {
      seed: seed >>> 0,
      tick: 0,
      score: 0,
      stage: 1,
      cell: 4,
      key_mask: 0,
      outcome: 'playing',
      objective_progress: 0,
      meaningful_actions: 0,
      moves: 0,
      room_moves: 0,
      pointer_actions: 0,
      latch: -1,
      feedback_token: 0,
      feedback_from: 4,
      feedback_to: 4,
      feedback_kind: 'none'
    };
  }

  function step(state, input) {
    if (state.outcome !== 'playing') return;
    state.tick += 1;
    let direction = -1;
    const touching = !!(input.action && input.pointer);
    if (touching) {
      direction = Math.max(0, Math.min(3, Math.floor(input.pointer.x * 4)));
      state.pointer_actions += 1;
      state.latch = -1;
      attempt(state, direction);
    } else {
      direction = heldDirection(input);
      if (direction < 0) {
        state.latch = -1;
      } else if (direction !== state.latch) {
        state.latch = direction;
        attempt(state, direction);
      }
    }
    if (state.outcome === 'playing' && state.tick >= 2400) state.outcome = 'failure';
  }

  function legalCount(state) {
    if (state.outcome !== 'playing') return 0;
    const room = roomFor(state.seed, state.stage - 1);
    let count = 0;
    for (let direction = 0; direction < 4; direction += 1) {
      if (destination(state, room, direction) >= 0) count += 1;
    }
    return count;
  }

  function observe(state) {
    return {
      tick: state.tick,
      score: state.score,
      progress: state.tick / 60,
      interactions: state.meaningful_actions,
      entities: 9,
      quality: {
        stage: state.stage,
        complexity: legalCount(state),
        objective_progress: state.objective_progress,
        meaningful_actions: state.meaningful_actions,
        reversible_state_key: state.stage + ':' + state.cell + ':' + state.key_mask + ':' + state.outcome
      }
    };
  }

  function terminal(state) {
    return state.outcome !== 'playing';
  }

  globalThis.KeywakeCore = { create, step, observe, terminal };
})();
