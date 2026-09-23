(() => {
  'use strict';
  let reduced = false;
  let token = -1;
  let began = 0;
  let lastTick = -1;
  let lastState = null;
  const DURATION = 260;
  const STATIC_DURATION = 410;

  function roomData(state) {
    const base = [
      { walls: [1, 3], keys: [], exit: 8 },
      { walls: [7], keys: [0], exit: 2 },
      { walls: [], keys: [0, 6], exit: 2 }
    ][Math.min(2, Math.max(0, state.stage - 1))];
    const variant = (state.seed >>> (3 * Math.min(2, Math.max(0, state.stage - 1)))) & 7;
    const transform = (cell) => {
      let x = cell % 3;
      let y = Math.floor(cell / 3);
      if (variant & 4) x = 2 - x;
      for (let i = 0; i < (variant & 3); i += 1) {
        const nx = 2 - y;
        y = x;
        x = nx;
      }
      return y * 3 + x;
    };
    return { walls: base.walls.map(transform), keys: base.keys.map(transform), exit: transform(base.exit) };
  }

  function keyCount(state) {
    if (state.stage > 3) return { held: 0, total: 0 };
    const room = roomData(state);
    let held = 0;
    for (let i = 0; i < room.keys.length; i += 1) if (state.key_mask & (1 << i)) held += 1;
    return { held, total: room.keys.length };
  }

  function presentation() {
    const elapsed = performance.now() - began;
    const active = token >= 0 && elapsed < (reduced ? STATIC_DURATION : DURATION);
    return { reduced_motion: reduced, feedback_active: active, static_feedback: !!(reduced && active) };
  }

  function setReducedMotion(value) { reduced = !!value; }
  function cellCenter(cell, left, top, side) {
    return [left + (cell % 3 + 0.5) * side / 3, top + (Math.floor(cell / 3) + 0.5) * side / 3];
  }
  function rounded(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  }

  function draw(ctx, snapshot, size) {
    const state = snapshot.state;
    const width = size.width;
    const height = size.height;
    const now = performance.now();
    if (state.tick < lastTick || (lastState && state.stage === 1 && state.tick < 3)) {
      token = -1;
      began = now;
    }
    if (state.feedback_token !== token) {
      token = state.feedback_token;
      began = now;
    }
    lastTick = state.tick;
    lastState = state;

    const scale = Math.min(width / 390, height / 350);
    const font = (n) => Math.max(14, Math.round(n * scale));
    ctx.clearRect(0, 0, width, height);
    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, '#17232d'); bg.addColorStop(1, '#0b1016');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height);

    const boardSide = Math.min(width * 0.62, height * 0.55, 215 * scale);
    const boardLeft = (width - boardSide) / 2;
    const boardTop = 53 * scale;
    const room = roomData(state);
    ctx.fillStyle = '#a9c8ce'; ctx.font = '700 ' + font(16) + 'px system-ui'; ctx.textAlign = 'center';
    ctx.fillText(state.stage <= 3 ? 'ROOM ' + state.stage : 'KEYWAKE OPEN', width / 2, 25 * scale);
    ctx.fillStyle = '#7d959b'; ctx.font = '600 ' + font(12) + 'px system-ui';
    const kc = keyCount(state);
    ctx.fillText(state.stage <= 3 ? 'BRASS KEYS  ' + kc.held + ' / ' + kc.total : 'ALL THREE HATCHES OPEN', width / 2, 43 * scale);

    rounded(ctx, boardLeft - 8 * scale, boardTop - 8 * scale, boardSide + 16 * scale, boardSide + 16 * scale, 13 * scale);
    ctx.fillStyle = '#22323a'; ctx.fill();
    for (let cell = 0; cell < 9; cell += 1) {
      const x = boardLeft + (cell % 3) * boardSide / 3;
      const y = boardTop + Math.floor(cell / 3) * boardSide / 3;
      const s = boardSide / 3;
      rounded(ctx, x + 3 * scale, y + 3 * scale, s - 6 * scale, s - 6 * scale, 8 * scale);
      ctx.fillStyle = room.walls.indexOf(cell) >= 0 ? '#10171d' : '#38505a'; ctx.fill();
      ctx.strokeStyle = room.walls.indexOf(cell) >= 0 ? '#5b7379' : '#59717a'; ctx.lineWidth = Math.max(1, 1.5 * scale); ctx.stroke();
      if (room.walls.indexOf(cell) >= 0) {
        ctx.strokeStyle = '#789197'; ctx.lineWidth = 3 * scale;
        ctx.beginPath(); ctx.moveTo(x + s * .27, y + s * .27); ctx.lineTo(x + s * .73, y + s * .73); ctx.moveTo(x + s * .73, y + s * .27); ctx.lineTo(x + s * .27, y + s * .73); ctx.stroke();
      }
    }
    if (state.stage <= 3) {
      const [ex, ey] = cellCenter(room.exit, boardLeft, boardTop, boardSide);
      const hatchOpen = kc.held === kc.total;
      ctx.fillStyle = hatchOpen ? '#e4b75d' : '#8a6a2d';
      rounded(ctx, ex - boardSide / 10, ey - boardSide / 8, boardSide / 5, boardSide / 4, 5 * scale); ctx.fill();
      ctx.fillStyle = '#153c3d'; ctx.fillRect(ex - boardSide / 17, ey - boardSide / 15, boardSide / 8.5, boardSide / 6);
      for (let i = 0; i < room.keys.length; i += 1) {
        if (state.key_mask & (1 << i)) continue;
        const [kx, ky] = cellCenter(room.keys[i], boardLeft, boardTop, boardSide);
        ctx.strokeStyle = '#f2cb65'; ctx.lineWidth = 4 * scale;
        ctx.beginPath(); ctx.arc(kx - 7 * scale, ky, 7 * scale, 0, Math.PI * 2); ctx.moveTo(kx, ky); ctx.lineTo(kx + 15 * scale, ky); ctx.moveTo(kx + 10 * scale, ky); ctx.lineTo(kx + 10 * scale, ky + 6 * scale); ctx.stroke();
      }
    }

    const active = token >= 0 && now - began < (reduced ? STATIC_DURATION : DURATION);
    let drawCell = state.cell;
    let interp = 1;
    if (active && !reduced && state.feedback_kind !== 'blocked') interp = Math.min(1, (now - began) / DURATION);
    const from = state.feedback_from;
    const to = state.feedback_to;
    const [fx, fy] = cellCenter(from, boardLeft, boardTop, boardSide);
    const [tx, ty] = cellCenter(to, boardLeft, boardTop, boardSide);
    let px = tx, py = ty;
    if (active && !reduced && state.feedback_kind !== 'blocked') { px = fx + (tx - fx) * interp; py = fy + (ty - fy) * interp; }
    if (active && (reduced || state.feedback_kind === 'blocked')) {
      const [rx, ry] = cellCenter(drawCell, boardLeft, boardTop, boardSide);
      ctx.strokeStyle = state.feedback_kind === 'blocked' ? '#ff8979' : '#d8f5ed'; ctx.lineWidth = 4 * scale;
      ctx.strokeRect(rx - boardSide / 7, ry - boardSide / 7, boardSide * 2 / 7, boardSide * 2 / 7);
    }
    ctx.fillStyle = '#ff7d6e'; ctx.beginPath(); ctx.arc(px, py, boardSide / 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffe0c9'; ctx.beginPath(); ctx.arc(px - boardSide / 25, py - boardSide / 30, boardSide / 28, 0, Math.PI * 2); ctx.fill();

    const padY = height * .80; const padH = height * .18;
    const labels = ['LEFT', 'UP', 'RIGHT', 'DOWN'];
    for (let i = 0; i < 4; i += 1) {
      const x = i * width / 4 + 4 * scale; const w = width / 4 - 8 * scale;
      rounded(ctx, x, padY, w, padH, 10 * scale); ctx.fillStyle = '#27404a'; ctx.fill(); ctx.strokeStyle = '#5e8790'; ctx.lineWidth = 1.5 * scale; ctx.stroke();
      ctx.fillStyle = '#e4f0ee'; ctx.textAlign = 'center'; ctx.font = '800 ' + font(13) + 'px system-ui'; ctx.fillText(labels[i], x + w / 2, padY + padH * .58);
    }
  }

  globalThis.KeywakeArt = { draw, presentation, setReducedMotion, keyCount };
})();
