(function () {
  'use strict';

  var COLS = 4;
  var ROWS = 3;
  var RUN_TICKS = 2700;
  var CHARGE_TICKS = 45;

  function indexOf(x, y) {
    return y * COLS + x;
  }

  function clamp(value, low, high) {
    return Math.max(low, Math.min(high, value));
  }

  function makeRandom(seed) {
    var value = (seed >>> 0) || 23;
    return function () {
      var mixed;
      value = (value + 0x6D2B79F5) >>> 0;
      mixed = value;
      mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
      mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
      return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
    };
  }

  function outletChoices(row) {
    var choices = [];
    var direction;
    for (direction = -1; direction <= 1; direction += 1) {
      if (row + direction >= 0 && row + direction < ROWS) choices.push(direction);
    }
    return choices;
  }

  function trace(state) {
    var row = 1;
    var x;
    var tile;
    for (x = 0; x < COLS; x += 1) {
      tile = state.board[indexOf(x, row)];
      row += tile.outlet;
      if (row < 0 || row >= ROWS) return { connected: false, leak: true, row: row };
    }
    return { connected: row === state.target, leak: false, row: row };
  }

  function buildBoard(state) {
    var random = makeRandom((state.seed + Math.imul(state.boardNumber + 1, 1103515245)) >>> 0);
    var route = [];
    var row = 1;
    var x;
    var y;
    var choices;
    var outlet;
    var i;
    var routePiece;
    var tile;
    var scrambleCount;

    for (x = 0; x < COLS; x += 1) {
      choices = outletChoices(row);
      outlet = choices[Math.floor(random() * choices.length)];
      route.push({ x: x, y: row, outlet: outlet });
      row += outlet;
    }
    state.target = row;
    state.board = [];
    for (y = 0; y < ROWS; y += 1) {
      for (x = 0; x < COLS; x += 1) {
        state.board.push({ outlet: Math.floor(random() * 3) - 1 });
      }
    }
    for (i = 0; i < route.length; i += 1) {
      routePiece = route[i];
      state.board[indexOf(routePiece.x, routePiece.y)].outlet = routePiece.outlet;
    }

    /* The constructed route is intentionally disturbed, never discarded. */
    scrambleCount = Math.min(COLS, 1 + Math.min(state.circuits, 3));
    for (i = 0; i < scrambleCount; i += 1) {
      routePiece = route[(state.boardNumber + i * 3) % route.length];
      tile = state.board[indexOf(routePiece.x, routePiece.y)];
      tile.outlet = tile.outlet === 1 ? -1 : tile.outlet + 1;
    }
    if (trace(state).connected) {
      routePiece = route[0];
      tile = state.board[indexOf(routePiece.x, routePiece.y)];
      tile.outlet = tile.outlet === 0 ? 1 : 0;
    }
  }

  function create(seed) {
    var state = {
      seed: (Number(seed) || 23) >>> 0,
      tick: 0,
      score: 0,
      circuits: 0,
      rotations: 0,
      cursor: { x: 0, y: 1 },
      board: [],
      boardNumber: 0,
      target: 1,
      charge: 0,
      pulse: 0,
      particles: [],
      previousAction: false,
      pointerWasDown: false,
      ignorePointerReleaseAction: false,
      heldX: 0,
      heldY: 0,
      repeatX: 0,
      repeatY: 0,
      terminal: false
    };
    buildBoard(state);
    return state;
  }

  function rotate(state, x, y) {
    var tile = state.board[indexOf(x, y)];
    tile.outlet = tile.outlet === 1 ? -1 : tile.outlet + 1;
    state.rotations += 1;
  }

  function move(state, axis, direction) {
    var held = axis === 'x' ? 'heldX' : 'heldY';
    var repeat = axis === 'x' ? 'repeatX' : 'repeatY';
    var maximum = axis === 'x' ? COLS - 1 : ROWS - 1;
    if (direction === 0) {
      state[held] = 0;
      state[repeat] = 0;
      return;
    }
    if (state[held] !== direction) {
      state.cursor[axis] = clamp(state.cursor[axis] + direction, 0, maximum);
      state[repeat] = 12;
    } else if (state[repeat] <= 0) {
      state.cursor[axis] = clamp(state.cursor[axis] + direction, 0, maximum);
      state[repeat] = 12;
    } else {
      state[repeat] -= 1;
    }
    state[held] = direction;
  }

  function hitTest(pointer) {
    var px = Number(pointer.x);
    var py = Number(pointer.y);
    if (!Number.isFinite(px) || !Number.isFinite(py)) return null;
    if (px < 0.08 || px > 0.92 || py < 0.23 || py > 0.75) return null;
    return {
      x: clamp(Math.floor((px - 0.08) * COLS / 0.84), 0, COLS - 1),
      y: clamp(Math.floor((py - 0.23) * ROWS / 0.52), 0, ROWS - 1)
    };
  }

  function makeBurst(state) {
    var i;
    state.pulse = 36;
    state.particles = [];
    for (i = 0; i < 20; i += 1) {
      state.particles.push({ angle: i * Math.PI * 2 / 20, life: 24 + (i % 5) * 3 });
    }
  }

  function step(state, input) {
    var control = input || {};
    var horizontal;
    var vertical;
    var hasPointer;
    var tapped;
    var result;
    var i;

    if (state.terminal) return state;
    horizontal = control.x === 1 ? 1 : (control.x === -1 ? -1 : 0);
    vertical = control.y === 1 ? 1 : (control.y === -1 ? -1 : 0);
    move(state, 'x', horizontal);
    move(state, 'y', vertical);

    hasPointer = control.pointer !== null && typeof control.pointer === 'object';
    if (hasPointer && !state.pointerWasDown) {
      tapped = hitTest(control.pointer);
      if (tapped) {
        state.cursor.x = tapped.x;
        state.cursor.y = tapped.y;
        rotate(state, tapped.x, tapped.y);
      }
      state.ignorePointerReleaseAction = true;
    } else if (!hasPointer && control.action && !state.previousAction && !state.ignorePointerReleaseAction) {
      rotate(state, state.cursor.x, state.cursor.y);
    }
    if (!hasPointer) state.ignorePointerReleaseAction = false;
    state.pointerWasDown = hasPointer;
    state.previousAction = !!control.action;

    result = trace(state);
    state.charge = result.connected ? Math.min(CHARGE_TICKS, state.charge + 1) : 0;
    if (state.charge === CHARGE_TICKS) {
      state.circuits += 1;
      state.score += 100 + Math.floor((RUN_TICKS - state.tick) / 90);
      state.boardNumber += 1;
      state.charge = 0;
      makeBurst(state);
      buildBoard(state);
    }

    if (state.pulse > 0) state.pulse -= 1;
    for (i = state.particles.length - 1; i >= 0; i -= 1) {
      state.particles[i].life -= 1;
      if (state.particles[i].life <= 0) state.particles.splice(i, 1);
    }
    state.tick += 1;
    if (state.tick >= RUN_TICKS) state.terminal = true;
    return state;
  }

  function observe(state) {
    return {
      tick: state.tick,
      score: state.score,
      progress: Math.min(100, Math.floor(state.tick * 100 / RUN_TICKS)),
      interactions: state.rotations + state.circuits,
      entities: 12 + state.particles.length
    };
  }

  function terminal(state) {
    return state.terminal === true;
  }

  globalThis.PrismRelayCore = {
    create: create,
    step: step,
    observe: observe,
    terminal: terminal
  };
}());
