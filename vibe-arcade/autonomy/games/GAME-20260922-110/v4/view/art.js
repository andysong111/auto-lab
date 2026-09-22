(function () {
  'use strict';

  function routeLine(ctx, points, color, lineWidth) {
    var i;
    if (points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }

  function draw(ctx, snapshot, size) {
    var state = snapshot.state;
    var width = size.width;
    var height = size.height;
    var left = width * 0.08;
    var top = height * 0.23;
    var boardWidth = width * 0.84;
    var boardHeight = height * 0.52;
    var cellWidth = boardWidth / 4;
    var cellHeight = boardHeight / 3;
    var route = [];
    var row = 1;
    var leaking = false;
    var x;
    var y;
    var cx;
    var cy;
    var outlet;
    var selected;
    var receiverX;
    var receiverY;
    var active;
    var targetY;
    var seconds;
    var particle;
    var distance;
    var sky;

    route.push({ x: left - cellWidth * 0.3, y: top + (row + 0.5) * cellHeight });
    for (x = 0; x < 4; x += 1) {
      route.push({ x: left + (x + 0.5) * cellWidth, y: top + (row + 0.5) * cellHeight });
      row += state.board[row * 4 + x].outlet;
      route.push({ x: left + (x + 1) * cellWidth, y: top + (row + 0.5) * cellHeight });
      if (row < 0 || row > 2) {
        leaking = true;
        break;
      }
    }

    sky = ctx.createLinearGradient(0, 0, width, height);
    sky.addColorStop(0, '#061126');
    sky.addColorStop(1, '#151641');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#e8fbff';
    ctx.font = '700 ' + Math.max(22, width * 0.058) + 'px system-ui';
    ctx.fillText('PRISM RELAY', left, height * 0.09);
    ctx.fillStyle = '#9dbbd0';
    ctx.font = Math.max(11, width * 0.024) + 'px system-ui';
    ctx.fillText('Guide light through the prism field.', left, height * 0.13);

    seconds = Math.max(0, Math.ceil((2700 - state.tick) / 60));
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffd071';
    ctx.font = '700 ' + Math.max(18, width * 0.045) + 'px system-ui';
    ctx.fillText(seconds + 's', left + boardWidth, height * 0.09);
    ctx.fillStyle = '#b8e9df';
    ctx.font = Math.max(12, width * 0.027) + 'px system-ui';
    ctx.fillText('CIRCUITS ' + state.circuits + '   SCORE ' + state.score, left + boardWidth, height * 0.13);

    ctx.fillStyle = 'rgba(119,191,228,0.07)';
    ctx.fillRect(left, top, boardWidth, boardHeight);
    ctx.strokeStyle = 'rgba(180,238,255,0.28)';
    ctx.lineWidth = 1;
    ctx.strokeRect(left, top, boardWidth, boardHeight);

    for (y = 0; y < 3; y += 1) {
      for (x = 0; x < 4; x += 1) {
        cx = left + (x + 0.5) * cellWidth;
        cy = top + (y + 0.5) * cellHeight;
        selected = state.cursor.x === x && state.cursor.y === y;
        outlet = state.board[y * 4 + x].outlet;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.fillStyle = selected ? 'rgba(101,238,219,0.20)' : 'rgba(161,216,248,0.10)';
        ctx.strokeStyle = selected ? '#92fff0' : 'rgba(205,242,255,0.52)';
        ctx.lineWidth = selected ? 3 : 1;
        ctx.beginPath();
        ctx.moveTo(-cellWidth * 0.29, 0);
        ctx.lineTo(0, -cellHeight * 0.30);
        ctx.lineTo(cellWidth * 0.29, 0);
        ctx.lineTo(0, cellHeight * 0.30);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = '#c2fff5';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-cellWidth * 0.13, 0);
        ctx.lineTo(cellWidth * 0.31, outlet * cellHeight * 0.29);
        ctx.stroke();
        ctx.fillStyle = '#c2fff5';
        ctx.beginPath();
        ctx.arc(cellWidth * 0.31, outlet * cellHeight * 0.29, Math.max(3, width * 0.007), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    receiverX = left + boardWidth + cellWidth * 0.12;
    for (y = 0; y < 3; y += 1) {
      receiverY = top + (y + 0.5) * cellHeight;
      active = y === state.target;
      ctx.strokeStyle = active ? '#79ffe0' : 'rgba(130,185,210,0.32)';
      ctx.lineWidth = active ? 4 : 2;
      ctx.beginPath();
      ctx.arc(receiverX, receiverY, cellHeight * 0.19, 0, Math.PI * 2);
      ctx.stroke();
      if (active) {
        ctx.fillStyle = '#79ffe0';
        ctx.beginPath();
        ctx.arc(receiverX, receiverY, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.save();
    ctx.shadowBlur = state.charge > 0 ? 18 : 8;
    ctx.shadowColor = leaking ? '#e99365' : '#72f5d8';
    routeLine(ctx, route, leaking ? '#db986d' : '#6ee7d0', state.charge > 0 ? 6 : 3);
    ctx.restore();

    ctx.fillStyle = '#ffca69';
    ctx.beginPath();
    ctx.arc(route[0].x, route[0].y, 9, 0, Math.PI * 2);
    ctx.fill();

    targetY = top + (state.target + 0.5) * cellHeight;
    ctx.strokeStyle = '#ffe391';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(receiverX, targetY, cellHeight * 0.28, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * state.charge / 45);
    ctx.stroke();

    if (state.pulse > 0) {
      ctx.fillStyle = 'rgba(111,255,218,' + (state.pulse / 80) + ')';
      ctx.beginPath();
      ctx.arc(receiverX, targetY, cellHeight * (0.25 + (36 - state.pulse) * 0.017), 0, Math.PI * 2);
      ctx.fill();
    }
    for (x = 0; x < state.particles.length; x += 1) {
      particle = state.particles[x];
      distance = (36 - particle.life) * cellHeight * 0.009;
      ctx.fillStyle = 'rgba(157,255,226,' + (particle.life / 42) + ')';
      ctx.beginPath();
      ctx.arc(receiverX + Math.cos(particle.angle) * distance, targetY + Math.sin(particle.angle) * distance, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = '#b6cedd';
    ctx.font = Math.max(11, width * 0.023) + 'px system-ui';
    ctx.fillText('Tap a prism to rotate  •  arrows select + Space rotates', width / 2, height * 0.84);
    ctx.fillStyle = '#7192b0';
    ctx.fillText(state.circuits === 0 ? 'SPARK' : (state.circuits === 1 ? 'SURGE' : 'SPECTRUM'), width / 2, height * 0.885);

    if (state.terminal) {
      ctx.fillStyle = 'rgba(3,10,28,0.80)';
      ctx.fillRect(0, 0, width, height);
      ctx.textAlign = 'center';
      ctx.fillStyle = state.circuits >= 3 ? '#85ffe2' : '#ffd28d';
      ctx.font = '700 ' + Math.max(26, width * 0.07) + 'px system-ui';
      ctx.fillText(state.circuits >= 3 ? 'RELAY COMPLETE' : 'RELAY INCOMPLETE', width / 2, height * 0.43);
      ctx.fillStyle = '#edfaff';
      ctx.font = Math.max(16, width * 0.038) + 'px system-ui';
      ctx.fillText(state.circuits + ' circuits lit  •  ' + state.score + ' points', width / 2, height * 0.50);
      ctx.fillStyle = '#a8c4d8';
      ctx.font = Math.max(12, width * 0.027) + 'px system-ui';
      ctx.fillText('Select Play Again below to replay this seed.', width / 2, height * 0.56);
    }
  }

  globalThis.PrismRelayView = { draw: draw };
}());
