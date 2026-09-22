(function () {
  'use strict';

  function roundedRect(ctx, x, y, w, h, r) {
    var radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function text(ctx, value, x, y, size, color, align) {
    ctx.fillStyle = color;
    ctx.font = '700 ' + size + 'px system-ui, sans-serif';
    ctx.textAlign = align || 'left';
    ctx.fillText(value, x, y);
  }

  function draw(ctx, snapshot, dimensions) {
    var state = snapshot.state || snapshot;
    var width = dimensions.width;
    var height = dimensions.height;
    var scale = Math.min(width / 1000, height / 1000);
    var ox = (width - 1000 * scale) / 2;
    var oy = (height - 1000 * scale) / 2;
    var stations = [{ x: 230, y: 275 }, { x: 770, y: 325 }, { x: 500, y: 760 }];

    ctx.clearRect(0, 0, width, height);
    var background = ctx.createLinearGradient(0, 0, width, height);
    background.addColorStop(0, '#091d2b');
    background.addColorStop(1, '#16283d');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);

    roundedRect(ctx, 45, 45, 910, 910, 42);
    ctx.fillStyle = '#0c1724';
    ctx.fill();
    ctx.strokeStyle = '#315069';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(102, 190, 194, 0.15)';
    ctx.lineWidth = 2;
    for (var line = 0; line < 6; line += 1) {
      ctx.beginPath();
      ctx.arc(500, 510, 120 + line * 62, Math.PI * 1.05, Math.PI * 1.93);
      ctx.stroke();
    }

    ctx.strokeStyle = '#35576b';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(stations[0].x, stations[0].y);
    ctx.lineTo(stations[1].x, stations[1].y);
    ctx.lineTo(stations[2].x, stations[2].y);
    ctx.closePath();
    ctx.stroke();

    for (var i = 0; i < stations.length; i += 1) {
      var charge = state.stations[i];
      var sx = stations[i].x;
      var sy = stations[i].y;
      ctx.beginPath();
      ctx.arc(sx, sy, 74, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(86, 166, 170, 0.10)';
      ctx.fill();
      ctx.strokeStyle = charge === 3 ? '#d8d27a' : '#4d8490';
      ctx.lineWidth = 5;
      ctx.stroke();
      for (var c = 0; c < 3; c += 1) {
        ctx.beginPath();
        ctx.arc(sx - 22 + c * 22, sy, 7, 0, Math.PI * 2);
        ctx.fillStyle = c < charge ? '#f4df72' : '#243d4d';
        ctx.fill();
      }
      text(ctx, 'R' + (i + 1), sx, sy + 42, 16, '#b8d5d6', 'center');
    }

    for (var p = 0; p < state.pings.length; p += 1) {
      var ping = state.pings[p];
      var radius = 15 + ping.age * 3;
      ctx.beginPath();
      ctx.arc(ping.x * 1000, ping.y * 1000, radius, 0, Math.PI * 2);
      ctx.strokeStyle = ping.station >= 0 ? 'rgba(244,223,114,' + (1 - ping.age / 35) + ')' : 'rgba(236,115,102,' + (1 - ping.age / 35) + ')';
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    var px = state.x * 1000;
    var py = state.y * 1000;
    ctx.beginPath();
    ctx.arc(px, py, 35, 0, Math.PI * 2);
    ctx.fillStyle = '#f6d94c';
    ctx.fill();
    ctx.strokeStyle = '#fff1a5';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = '#172331';
    ctx.beginPath();
    ctx.arc(px + 11, py - 7, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(px + 33, py + 1);
    ctx.lineTo(px + 48, py + 8);
    ctx.lineTo(px + 33, py + 14);
    ctx.fill();

    roundedRect(ctx, 90, 78, 820, 98, 22);
    ctx.fillStyle = '#122737';
    ctx.fill();
    text(ctx, 'TERRA PROVIDER', 122, 118, 19, '#76b7bb');
    text(ctx, 'CANARY CHAMBER', 122, 148, 29, '#edf5ed');
    text(ctx, state.result, 874, 129, 17, state.finished ? '#f4df72' : '#8ecad0', 'right');

    roundedRect(ctx, 115, 875, 770, 32, 15);
    ctx.fillStyle = '#203b4c';
    ctx.fill();
    roundedRect(ctx, 115, 875, 770 * Math.max(0, Math.min(100, state.progress)) / 100, 32, 15);
    ctx.fillStyle = state.finished ? '#f4df72' : '#62b9bb';
    ctx.fill();
    text(ctx, 'COMMISSIONING OUTPUT  ' + state.progress + '%', 500, 899, 15, '#102231', 'center');

    text(ctx, state.message, 500, 838, 18, '#c5dfe0', 'center');
    text(ctx, 'MOVE  •  SPACE PULSE  •  TAP/DRAG TO GUIDE', 500, 210, 14, '#6d9da4', 'center');
    ctx.restore();
  }

  globalThis.TerraProviderCanaryChamberArt = { draw: draw };
}());
