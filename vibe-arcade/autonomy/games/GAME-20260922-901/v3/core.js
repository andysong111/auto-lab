(function () {
  'use strict';

  var TICK_LIMIT = 660;
  var STATIONS = [
    { x: 0.23, y: 0.25 },
    { x: 0.77, y: 0.30 },
    { x: 0.50, y: 0.75 }
  ];

  function clamp(value, low, high) {
    return Math.max(low, Math.min(high, value));
  }

  function distance(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function makePing(x, y, station) {
    return { x: x, y: y, station: station, age: 0 };
  }

  function create(seed) {
    return {
      seed: Number(seed) || 0,
      tick: 0,
      x: 0.50,
      y: 0.52,
      score: 0,
      progress: 0,
      interactions: 0,
      taps: 0,
      stations: [0, 0, 0],
      pings: [],
      lastStation: -1,
      cooldown: 0,
      pointerHeld: false,
      intakeMote: { x: 0.50, y: 0.52, active: true },
      intakeCharged: false,
      outputTicks: 0,
      baselineTicks: 0,
      baselineScore: 0,
      safetySweep: false,
      finished: false,
      result: 'COMMISSIONING',
      message: 'Guide the canary to a relay and pulse it.'
    };
  }

  function nearestStation(state) {
    var nearest = -1;
    var nearestDistance = 2;
    for (var i = 0; i < STATIONS.length; i += 1) {
      var d = distance(state, STATIONS[i]);
      if (d < nearestDistance) {
        nearestDistance = d;
        nearest = i;
      }
    }
    return nearestDistance <= 0.145 ? nearest : -1;
  }

  function collectIntakeMote(state) {
    if (!state.intakeMote.active || distance(state, state.intakeMote) > 0.055) {
      return;
    }
    state.intakeMote.active = false;
    state.intakeCharged = true;
    state.interactions += 1;
    state.score += 25;
    state.message = 'Canary contacted the intake mote: live air sample secured.';
  }

  function pulse(state) {
    if (state.cooldown > 0 || state.finished) {
      return;
    }
    state.cooldown = 14;
    var station = nearestStation(state);
    if (station < 0) {
      state.message = 'Pulse missed: move into a relay halo.';
      state.pings.push(makePing(state.x, state.y, -1));
      return;
    }

    state.lastStation = station;
    state.pings.push(makePing(state.x, state.y, station));
    if (state.stations[station] < 3) {
      state.stations[station] += 1;
      state.interactions += 1;
      state.score += 80 + state.stations[station] * 20;
      state.message = 'Relay ' + (station + 1) + ' accepted a canary pulse.';
    } else {
      state.message = 'Relay ' + (station + 1) + ' is already sealed.';
    }
  }

  function allSealed(state) {
    return state.stations[0] === 3 && state.stations[1] === 3 && state.stations[2] === 3;
  }

  function updateBaseline(state) {
    if (state.baselineTicks < 72) {
      state.baselineTicks += 1;
      if (state.baselineTicks % 6 === 0) {
        state.baselineScore += 1;
        state.score += 1;
      }
    }
  }

  function step(state, input) {
    if (state.finished) {
      return;
    }
    input = input || {};
    state.tick += 1;
    updateBaseline(state);
    collectIntakeMote(state);

    var moveX = Number(input.x) || 0;
    var moveY = Number(input.y) || 0;
    var speed = 0.009;
    state.x = clamp(state.x + clamp(moveX, -1, 1) * speed, 0.07, 0.93);
    state.y = clamp(state.y + clamp(moveY, -1, 1) * speed, 0.09, 0.91);

    var hasPointer = input.pointer && isFinite(input.pointer.x) && isFinite(input.pointer.y);
    if (hasPointer) {
      var targetX = clamp(Number(input.pointer.x), 0, 1);
      var targetY = clamp(Number(input.pointer.y), 0, 1);
      var dx = targetX - state.x;
      var dy = targetY - state.y;
      var magnitude = Math.sqrt(dx * dx + dy * dy);
      if (magnitude > 0.001) {
        var dragSpeed = 0.016;
        state.x = clamp(state.x + dx / magnitude * Math.min(dragSpeed, magnitude), 0.07, 0.93);
        state.y = clamp(state.y + dy / magnitude * Math.min(dragSpeed, magnitude), 0.09, 0.91);
      }
      if (!state.pointerHeld) {
        state.pointerHeld = true;
        state.taps += 1;
      }
    } else {
      state.pointerHeld = false;
    }

    collectIntakeMote(state);

    if (state.cooldown > 0) {
      state.cooldown -= 1;
    }
    if (input.action) {
      pulse(state);
    }

    for (var p = state.pings.length - 1; p >= 0; p -= 1) {
      state.pings[p].age += 1;
      if (state.pings[p].age > 34) {
        state.pings.splice(p, 1);
      }
    }

    var seals = state.stations[0] + state.stations[1] + state.stations[2];
    var baselineProgress = Math.floor(state.baselineTicks / 6);
    state.progress = Math.min(12, baselineProgress) + Math.floor((seals / 9) * 70);
    if (allSealed(state)) {
      state.outputTicks += 1;
      state.progress = Math.min(99, 82 + Math.floor(state.outputTicks / 4));
      state.message = 'All relays sealed. Reading the chamber output...';
      if (state.outputTicks >= 72) {
        state.finished = true;
        state.progress = 100;
        state.score += 300;
        state.result = 'CERTIFIED';
        state.message = 'Canary chamber certified.';
      }
    }

    if (!state.finished && state.tick >= TICK_LIMIT) {
      state.safetySweep = true;
      state.finished = true;
      state.progress = 100;
      state.score += seals * 15;
      state.result = seals === 9 ? 'CERTIFIED' : 'SAFETY SWEEP COMPLETE';
      state.message = seals === 9 ? 'Canary chamber certified.' : 'Timed safety sweep logged the current relay seals.';
    }
  }

  function observe(state) {
    return {
      tick: state.tick,
      score: state.score,
      progress: state.progress,
      interactions: state.interactions,
      entities: 4 + state.pings.length + (state.intakeMote.active ? 1 : 0)
    };
  }

  function terminal(state) {
    return state.finished;
  }

  globalThis.TerraProviderCanaryChamberCore = {
    create: create,
    step: step,
    observe: observe,
    terminal: terminal
  };
}());
