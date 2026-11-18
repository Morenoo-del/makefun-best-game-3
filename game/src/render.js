// TIDEWARDEN — every pixel the player sees, drawn on one canvas.
// Palette: deep teal sea, warm sand, amber lighthouse light. The build
// phase is dusk; the night phase is dark with the lighthouse beam sweeping.
// The HUD, build menu and end screens are all canvas-drawn so screenshots
// show the whole game at a glance.

import {
  BUILD_PADS, LIGHTHOUSE, PATH_POINTS, TOWER_ORDER, TOWERS,
  TOTAL_NIGHTS, TOWN_MAX_HP, VIEW_H, VIEW_W,
} from './config.js';
import { NIGHT_TIPS } from './levels.js';

const SAND = '#e3b96f';
const SAND_DARK = '#c99a4e';
const PATH_SAND = '#b98a44';
const SEA_DEEP = '#0a3d56';
const SEA = '#0e5a74';
const SKY_DUSK = ['#2b3a67', '#e07a5f'];
const SKY_NIGHT = ['#070b1d', '#14264d'];

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.uiButtons = []; // rebuilt each frame: {x,y,w,h,action,label}
  }

  button(x, y, w, h, action, label) {
    this.uiButtons.push({ x, y, w, h, action, label });
    return { x, y, w, h };
  }

  buttonAt(x, y) {
    for (let i = this.uiButtons.length - 1; i >= 0; i--) {
      const b = this.uiButtons[i];
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return b;
    }
    return null;
  }

  draw(world) {
    const ctx = this.ctx;
    this.uiButtons = [];
    ctx.save();
    if (world.shake > 0) {
      const s = world.shake * 7;
      ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
    }
    const night = world.phase === 'night' || world.phase === 'defeat';
    this.drawSky(ctx, night, world.time);
    this.drawSea(ctx, world.time);
    this.drawBeach(ctx, world.time);
    this.drawPath(ctx);
    this.drawPads(ctx, world);
    this.drawLighthouse(ctx, world, night);
    for (const t of world.towers) this.drawTower(ctx, t, world);
    for (const e of world.enemies) this.drawEnemy(ctx, e, world.time);
    this.drawProjectiles(ctx, world);
    this.drawParticles(ctx, world);
    this.drawFloaters(ctx, world);
    ctx.restore();
    if (world.phase === 'title') this.drawTitle(ctx, world);
    else {
      this.drawHUD(ctx, world);
      if (world.phase === 'build') this.drawBuildPhase(ctx, world);
      if (world.phase === 'paused') this.drawPause(ctx, world);
      if (world.phase === 'victory') this.drawEnd(ctx, world, true);
      if (world.phase === 'defeat') this.drawEnd(ctx, world, false);
      this.drawBanner(ctx, world);
    }
  }

  drawSky(ctx, night, t) {
    const [top, bottom] = night ? SKY_NIGHT : SKY_DUSK;
    const g = ctx.createLinearGradient(0, 0, 0, 210);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_W, 210);
    // Stars at night, a low sun at dusk.
    if (night) {
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 60; i++) {
        const sx = (i * 211.7) % VIEW_W;
        const sy = (i * 97.3) % 150;
        const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.8 + i));
        ctx.globalAlpha = tw * 0.9;
        ctx.fillRect(sx, sy, 2, 2);
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#f4f1de';
      ctx.beginPath(); ctx.arc(860, 120, 26, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e0d9b8';
      ctx.beginPath(); ctx.arc(852, 114, 6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(868, 128, 4, 0, Math.PI * 2); ctx.fill();
    } else {
      const sunY = 150 + Math.sin(t * 0.2) * 4;
      const sg = ctx.createRadialGradient(180, sunY, 4, 180, sunY, 90);
      sg.addColorStop(0, 'rgba(255,214,140,0.95)');
      sg.addColorStop(1, 'rgba(255,214,140,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(60, 30, 260, 220);
      ctx.fillStyle = '#ffd68c';
      ctx.beginPath(); ctx.arc(180, sunY, 30, 0, Math.PI * 2); ctx.fill();
    }
  }

  drawSea(ctx, t) {
    ctx.fillStyle = SEA_DEEP;
    ctx.fillRect(0, 210, 340, VIEW_H - 210);
    const g = ctx.createLinearGradient(0, 210, 340, 210);
    g.addColorStop(0, SEA);
    g.addColorStop(1, SEA_DEEP);
    ctx.fillStyle = g;
    ctx.fillRect(0, 210, 340, VIEW_H - 210);
    // Rolling wave lines.
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    for (let row = 0; row < 7; row++) {
      const y = 240 + row * 62;
      ctx.beginPath();
      for (let x = 0; x <= 340; x += 12) {
        const yy = y + Math.sin(x * 0.03 + t * 1.4 + row * 1.7) * 7;
        if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    // Foam at the shoreline.
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let i = 0; i < 5; i++) {
      const fy = 230 + i * 96 + Math.sin(t * 1.1 + i * 2.2) * 6;
      ctx.beginPath();
      ctx.ellipse(330, fy, 26, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawBeach(ctx, t) {
    ctx.fillStyle = SAND;
    ctx.fillRect(340, 210, VIEW_W - 340, VIEW_H - 210);
    ctx.fillStyle = SAND_DARK;
    for (let i = 0; i < 90; i++) {
      const sx = 350 + ((i * 137.5) % 920);
      const sy = 220 + ((i * 89.7) % 480);
      ctx.fillRect(sx, sy, 3, 2);
    }
    // Dune grass tufts along the top of the beach.
    ctx.strokeStyle = '#7fb069';
    ctx.lineWidth = 2;
    for (let i = 0; i < 14; i++) {
      const gx = 380 + i * 62;
      const gy = 216;
      ctx.beginPath();
      ctx.moveTo(gx, gy); ctx.lineTo(gx - 4, gy - 12);
      ctx.moveTo(gx, gy); ctx.lineTo(gx + 3, gy - 14);
      ctx.moveTo(gx, gy); ctx.lineTo(gx + 7, gy - 9);
      ctx.stroke();
    }
    void t;
  }

  drawPath(ctx) {
    ctx.strokeStyle = PATH_SAND;
    ctx.lineWidth = 44;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(PATH_POINTS[0][0], PATH_POINTS[0][1]);
    for (let i = 1; i < PATH_POINTS.length; i++) ctx.lineTo(PATH_POINTS[i][0], PATH_POINTS[i][1]);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(PATH_POINTS[0][0], PATH_POINTS[0][1] - 22);
    for (let i = 1; i < PATH_POINTS.length; i++) ctx.lineTo(PATH_POINTS[i][0], PATH_POINTS[i][1] - 22);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(PATH_POINTS[0][0], PATH_POINTS[0][1] + 22);
    for (let i = 1; i < PATH_POINTS.length; i++) ctx.lineTo(PATH_POINTS[i][0], PATH_POINTS[i][1] + 22);
    ctx.stroke();
  }

  drawPads(ctx, world) {
    for (const pad of BUILD_PADS) {
      const occupied = world.towerAtPad(pad);
      const selected = world.selectedPad === pad;
      ctx.beginPath();
      ctx.arc(pad.x, pad.y, 24, 0, Math.PI * 2);
      ctx.fillStyle = occupied ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.28)';
      ctx.fill();
      ctx.strokeStyle = selected ? '#ffe66d' : 'rgba(90,60,20,0.55)';
      ctx.lineWidth = selected ? 3 : 2;
      ctx.setLineDash(selected ? [] : [6, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
      if (!occupied && world.phase === 'build') {
        ctx.fillStyle = 'rgba(90,60,20,0.6)';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+', pad.x, pad.y + 1);
      }
    }
  }

  drawLighthouse(ctx, world, night) {
    const { x, y } = LIGHTHOUSE;
    // Sweeping beam at night.
    if (night) {
      const ang = world.time * 0.5;
      const bx = x + Math.cos(ang) * 420;
      const by = y - 30 + Math.sin(ang) * 120;
      const g = ctx.createLinearGradient(x, y - 30, bx, by);
      g.addColorStop(0, 'rgba(255,230,109,0.35)');
      g.addColorStop(1, 'rgba(255,230,109,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x - 8, y - 44);
      ctx.lineTo(bx, by - 26);
      ctx.lineTo(bx, by + 26);
      ctx.lineTo(x + 8, y - 44);
      ctx.closePath();
      ctx.fill();
    }
    // Tower body: white with red bands.
    ctx.fillStyle = '#f8f9fa';
    ctx.beginPath();
    ctx.moveTo(x - 18, y + 22); ctx.lineTo(x - 12, y - 46);
    ctx.lineTo(x + 12, y - 46); ctx.lineTo(x + 18, y + 22);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e63946';
    ctx.fillRect(x - 15, y - 26, 30, 10);
    ctx.fillRect(x - 17, y + 2, 34, 10);
    ctx.fillStyle = '#343a40';
    ctx.fillRect(x - 14, y - 56, 28, 12);
    ctx.fillStyle = '#ffe66d';
    ctx.beginPath(); ctx.arc(x, y - 50, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6c757d';
    ctx.beginPath(); ctx.ellipse(x, y + 24, 26, 7, 0, 0, Math.PI * 2); ctx.fill();
    // Town health as a small heart bar above the lighthouse.
    const frac = world.townHp / TOWN_MAX_HP;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    roundRect(ctx, x - 30, y - 78, 60, 9, 4); ctx.fill();
    ctx.fillStyle = frac > 0.5 ? '#80ed99' : frac > 0.25 ? '#ffd166' : '#ff5964';
    roundRect(ctx, x - 30, y - 78, 60 * frac, 9, 4); ctx.fill();
  }

  drawTower(ctx, t, world) {
    const selected = world.selectedTower === t;
    // Buff glow from moon lanterns.
    if (t.type === 'moon') {
      const g = ctx.createRadialGradient(t.x, t.y - 12, 4, t.x, t.y - 12, t.range);
      g.addColorStop(0, 'rgba(224,170,255,0.20)');
      g.addColorStop(1, 'rgba(224,170,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(t.x, t.y - 12, t.range, 0, Math.PI * 2); ctx.fill();
    }
    if (selected) {
      ctx.strokeStyle = '#ffe66d';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(t.x, t.y - 8, t.range, 0, Math.PI * 2); ctx.stroke();
    }
    // Stone base.
    ctx.fillStyle = '#8d99ae';
    ctx.beginPath(); ctx.ellipse(t.x, t.y + 8, 22, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6c757d';
    ctx.fillRect(t.x - 14, t.y - 6, 28, 14);
    if (t.type === 'harpoon') {
      ctx.save();
      ctx.translate(t.x, t.y - 12);
      ctx.rotate(t.angle);
      ctx.fillStyle = t.color;
      ctx.fillRect(0, -3, 26, 6);
      ctx.fillStyle = '#343a40';
      ctx.beginPath(); ctx.moveTo(26, -5); ctx.lineTo(34, 0); ctx.lineTo(26, 5); ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.fillStyle = t.color;
      ctx.beginPath(); ctx.arc(t.x, t.y - 12, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = t.dark;
      ctx.beginPath(); ctx.arc(t.x, t.y - 12, 5, 0, Math.PI * 2); ctx.fill();
    } else if (t.type === 'coral') {
      ctx.fillStyle = t.color;
      ctx.beginPath(); ctx.arc(t.x, t.y - 18, 9, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(t.x - 9, t.y - 8, 6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(t.x + 9, t.y - 8, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(t.x, t.y - 20, 3, 0, Math.PI * 2); ctx.fill();
    } else if (t.type === 'tide') {
      ctx.save();
      ctx.translate(t.x, t.y - 14);
      ctx.rotate(t.angle);
      ctx.fillStyle = t.dark;
      ctx.fillRect(-6, -7, 26, 14);
      ctx.fillStyle = t.color;
      ctx.fillRect(12, -5, 10, 10);
      ctx.restore();
      ctx.fillStyle = t.color;
      ctx.beginPath(); ctx.arc(t.x, t.y - 12, 9, 0, Math.PI * 2); ctx.fill();
    } else {
      // Moon lantern: post + glowing orb.
      ctx.strokeStyle = '#5e35b1';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(t.x, t.y - 4); ctx.lineTo(t.x, t.y - 26); ctx.stroke();
      const pulse = 10 + Math.sin(world.time * 3 + t.id) * 2;
      const g = ctx.createRadialGradient(t.x, t.y - 30, 2, t.x, t.y - 30, pulse + 8);
      g.addColorStop(0, 'rgba(255,255,255,0.95)');
      g.addColorStop(0.5, 'rgba(224,170,255,0.8)');
      g.addColorStop(1, 'rgba(224,170,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(t.x, t.y - 30, pulse + 8, 0, Math.PI * 2); ctx.fill();
    }
    // Level pips.
    for (let i = 0; i < t.level; i++) {
      ctx.fillStyle = '#ffe66d';
      ctx.beginPath(); ctx.arc(t.x - 8 + i * 8, t.y + 16, 3, 0, Math.PI * 2); ctx.fill();
    }
  }

  drawEnemy(ctx, e, t) {
    const bob = Math.sin(e.wobble) * 2;
    const x = e.x;
    const y = e.y + bob;
    const slow = t < e.slowUntil;
    // Health bar.
    const frac = Math.max(0, e.hp / e.maxHp);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    roundRect(ctx, x - 16, y - e.r - 12, 32, 5, 2); ctx.fill();
    ctx.fillStyle = frac > 0.5 ? '#80ed99' : frac > 0.25 ? '#ffd166' : '#ff5964';
    roundRect(ctx, x - 16, y - e.r - 12, 32 * frac, 5, 2); ctx.fill();
    if (slow) {
      ctx.strokeStyle = 'rgba(127,240,193,0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, e.r + 4, 0, Math.PI * 2); ctx.stroke();
    }
    if (e.flash > 0) ctx.globalAlpha = 0.6;
    ctx.fillStyle = e.def.color;
    ctx.strokeStyle = e.def.dark;
    ctx.lineWidth = 2;
    if (e.type === 'crab') {
      ctx.beginPath(); ctx.ellipse(x, y, e.r, e.r * 0.75, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(x - e.r - 3, y - 4, 5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + e.r + 3, y - 4, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(x - 5, y - 4, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 5, y - 4, 2.5, 0, Math.PI * 2); ctx.fill();
    } else if (e.type === 'eel') {
      ctx.beginPath();
      for (let i = 0; i <= 6; i++) {
        const px = x - e.r + (i / 6) * e.r * 2;
        const py = y + Math.sin(e.wobble * 2 + i) * 4;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.lineTo(x + e.r, y + 5); ctx.lineTo(x - e.r, y + 5);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(x + e.r - 4, y - 3, 2.5, 0, Math.PI * 2); ctx.fill();
    } else if (e.type === 'sailor') {
      ctx.beginPath(); ctx.arc(x, y - 6, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillRect(x - 8, y + 2, 16, 14);
      ctx.fillStyle = e.def.dark;
      ctx.fillRect(x - 8, y + 12, 5, 8);
      ctx.fillRect(x + 3, y + 12, 5, 8);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(x - 3, y - 7, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 3, y - 7, 2, 0, Math.PI * 2); ctx.fill();
    } else if (e.type === 'squid' || e.type === 'inkling') {
      ctx.beginPath(); ctx.ellipse(x, y - 2, e.r * 0.9, e.r, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = e.def.color;
      ctx.lineWidth = 3;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(x + i * 4, y + e.r * 0.6);
        ctx.quadraticCurveTo(x + i * 5, y + e.r + 6 + Math.sin(e.wobble + i) * 3, x + i * 6, y + e.r + 4);
        ctx.stroke();
      }
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(x - 4, y - 5, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 4, y - 5, 2.5, 0, Math.PI * 2); ctx.fill();
    } else if (e.type === 'wraith') {
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(x - e.r, y + e.r);
      ctx.quadraticCurveTo(x - e.r, y - e.r, x, y - e.r);
      ctx.quadraticCurveTo(x + e.r, y - e.r, x + e.r, y + e.r);
      ctx.quadraticCurveTo(x + e.r / 2, y + e.r - 6, x, y + e.r);
      ctx.quadraticCurveTo(x - e.r / 2, y + e.r - 6, x - e.r, y + e.r);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#083344';
      ctx.beginPath(); ctx.arc(x - 5, y - 4, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 5, y - 4, 3, 0, Math.PI * 2); ctx.fill();
    } else if (e.type === 'kraken') {
      ctx.beginPath(); ctx.ellipse(x, y, e.r, e.r * 0.8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = e.def.color;
      ctx.lineWidth = 6;
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x + i * 9, y + e.r * 0.5);
        ctx.quadraticCurveTo(x + i * 12, y + e.r + 14, x + i * 16, y + e.r + 8 + Math.sin(e.wobble + i) * 5);
        ctx.stroke();
      }
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(x - 12, y - 8, 5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 12, y - 8, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#083344';
      ctx.beginPath(); ctx.arc(x - 12, y - 8, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 12, y - 8, 2.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawProjectiles(ctx, world) {
    for (const pr of world.projectiles) {
      ctx.save();
      ctx.translate(pr.x, pr.y);
      ctx.rotate(pr.angle);
      ctx.fillStyle = pr.color;
      if (pr.kind === 'tide') {
        ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(-2, -2, 2, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillRect(-8, -2, 16, 4);
        ctx.beginPath(); ctx.moveTo(8, -4); ctx.lineTo(14, 0); ctx.lineTo(8, 4); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
  }

  drawParticles(ctx, world) {
    for (const p of world.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawFloaters(ctx, world) {
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const f of world.floaters) {
      ctx.globalAlpha = Math.max(0, f.life / f.max);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }

  drawHUD(ctx, world) {
    ctx.fillStyle = 'rgba(7,11,29,0.82)';
    roundRect(ctx, 12, 10, 1256, 52, 10); ctx.fill();
    ctx.fillStyle = '#ffe66d';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('TIDEWARDEN', 26, 36);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`🪙 ${world.gold}g`, 220, 36);
    // Town health hearts.
    let hearts = '';
    for (let i = 0; i < TOWN_MAX_HP; i++) hearts += i < world.townHp ? '♥' : '♡';
    ctx.fillStyle = '#ff5964';
    ctx.font = '16px sans-serif';
    ctx.fillText(hearts, 330, 36);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`Night ${Math.min(world.night, TOTAL_NIGHTS)}/${TOTAL_NIGHTS}`, 640, 36);
    if (world.phase === 'night') {
      ctx.fillText(`Foes left: ${world.enemiesRemaining()}`, 780, 36);
    } else {
      ctx.fillStyle = '#9bf6ff';
      ctx.fillText('Build phase', 780, 36);
    }
    ctx.fillStyle = '#c9d1d9';
    ctx.font = '15px sans-serif';
    ctx.fillText(`Kills ${world.kills}  •  ${world.earned}g earned`, 920, 36);
    // Speed / mute / pause buttons (speed only matters while a night runs).
    this.drawSmallButton(ctx, 1150, 20, 34, '⏸', 'pause', world.phase === 'paused');
    this.drawSmallButton(ctx, 1192, 20, 34, '♪', 'mute', world.sound?.muted);
    if (world.phase === 'night') {
      this.drawSmallButton(ctx, 1080, 20, 62, world.speed === 1 ? '▶ 1×' : '▶ 2×', 'speed', false);
    }
  }

  drawSmallButton(ctx, x, y, w, label, action, active) {
    ctx.fillStyle = active ? '#ffd166' : 'rgba(255,255,255,0.14)';
    roundRect(ctx, x, y, w, 32, 7); ctx.fill();
    ctx.fillStyle = active ? '#1a1a2e' : '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + w / 2, y + 17);
    this.button(x, y, w, 32, action, label);
  }

  drawBuildPhase(ctx, world) {
    // Night banner + start button.
    ctx.fillStyle = 'rgba(7,11,29,0.72)';
    roundRect(ctx, 340, 660, 600, 48, 10); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Tip: ${NIGHT_TIPS[world.night - 1]}`, 356, 684);
    const b = this.button(980, 656, 200, 56, 'start-night', 'Sound the horn');
    ctx.fillStyle = '#ffd166';
    roundRect(ctx, b.x, b.y, b.w, b.h, 10); ctx.fill();
    ctx.fillStyle = '#1a1a2e';
    ctx.font = 'bold 19px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🔔 SOUND THE HORN', b.x + b.w / 2, b.y + 29);
    // Build menu / tower panel.
    if (world.selectedPad) this.drawTowerPicker(ctx, world);
    else if (world.selectedTower) this.drawTowerPanel(ctx, world);
    else {
      ctx.fillStyle = 'rgba(7,11,29,0.6)';
      roundRect(ctx, 340, 610, 600, 40, 10); ctx.fill();
      ctx.fillStyle = '#e0e0e0';
      ctx.font = '15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Click a glowing + pad to build  •  Click a tower to upgrade or sell  •  Space starts the night', 640, 630);
    }
  }

  drawTowerPicker(ctx, world) {
    const y = 560;
    ctx.fillStyle = 'rgba(7,11,29,0.88)';
    roundRect(ctx, 300, y - 14, 680, 150, 12); ctx.fill();
    ctx.fillStyle = '#ffe66d';
    ctx.font = 'bold 17px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Build a tower', 320, y + 8);
    TOWER_ORDER.forEach((id, i) => {
      const def = TOWERS[id];
      const x = 320 + i * 165;
      const afford = world.gold >= def.cost;
      const b = this.button(x, y + 26, 150, 96, `build:${id}`, def.name);
      ctx.fillStyle = afford ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)';
      roundRect(ctx, b.x, b.y, b.w, b.h, 9); ctx.fill();
      ctx.strokeStyle = def.color;
      ctx.lineWidth = 2;
      roundRect(ctx, b.x, b.y, b.w, b.h, 9); ctx.stroke();
      ctx.fillStyle = def.color;
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(def.name, b.x + 75, b.y + 20);
      ctx.fillStyle = afford ? '#ffffff' : '#888888';
      ctx.font = '13px sans-serif';
      ctx.fillText(def.blurb, b.x + 75, b.y + 42);
      ctx.fillStyle = '#ffe66d';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(`${def.cost}g  [${i + 1}]`, b.x + 75, b.y + 68);
    });
  }

  drawTowerPanel(ctx, world) {
    const t = world.selectedTower;
    if (!t) return;
    const y = 560;
    ctx.fillStyle = 'rgba(7,11,29,0.88)';
    roundRect(ctx, 300, y - 14, 680, 150, 12); ctx.fill();
    ctx.fillStyle = t.color;
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${t.name}  •  Level ${t.level + 1}/3`, 320, y + 10);
    ctx.fillStyle = '#ffffff';
    ctx.font = '15px sans-serif';
    const stat = t.type === 'moon'
      ? `Buffs nearby towers ×${t.buff.toFixed(2)} damage`
      : `Damage ${Math.round(t.damage)}  •  Range ${Math.round(t.range)}  •  Rate ${t.rate.toFixed(2)}s`;
    ctx.fillText(stat, 320, y + 36);
    ctx.fillStyle = '#c9d1d9';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Shots fired ${t.shotsFired}  •  Kills ${t.kills}  •  Invested ${t.spent}g`, 320, y + 60);
    const up = t.nextUpgrade();
    if (up) {
      const afford = world.gold >= up.cost;
      const b = this.button(320, y + 76, 320, 44, 'upgrade', `Upgrade — ${up.cost}g`);
      ctx.fillStyle = afford ? '#ffd166' : 'rgba(255,255,255,0.15)';
      roundRect(ctx, b.x, b.y, b.w, b.h, 9); ctx.fill();
      ctx.fillStyle = afford ? '#1a1a2e' : '#888888';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`⬆ ${up.note} — ${up.cost}g`, b.x + b.w / 2, b.y + 23);
      ctx.fillStyle = '#c9d1d9';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'left';
    } else {
      ctx.fillStyle = '#80ed99';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('★ Fully upgraded', 320, y + 100);
    }
    const sb = this.button(660, y + 76, 300, 44, 'sell', `Sell for ${t.sellValue()}g`);
    ctx.fillStyle = 'rgba(255,89,100,0.85)';
    roundRect(ctx, sb.x, sb.y, sb.w, sb.h, 9); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Sell for ${t.sellValue()}g (70%)`, sb.x + sb.w / 2, sb.y + 23);
  }

  drawBanner(ctx, world) {
    if (world.banner && world.time < world.bannerUntil) {
      const alpha = Math.min(1, (world.bannerUntil - world.time) / 0.6);
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 26px sans-serif';
      const w = ctx.measureText(world.banner).width;
      ctx.fillStyle = 'rgba(7,11,29,0.8)';
      roundRect(ctx, VIEW_W / 2 - w / 2 - 18, 84, w + 36, 44, 10); ctx.fill();
      ctx.fillStyle = '#ffe66d';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(world.banner, VIEW_W / 2, 106);
      ctx.globalAlpha = 1;
    }
  }

  drawTitle(ctx, world) {
    ctx.fillStyle = 'rgba(4,8,20,0.62)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffe66d';
    ctx.font = 'bold 84px sans-serif';
    ctx.fillText('TIDEWARDEN', VIEW_W / 2, 210);
    ctx.fillStyle = '#9bf6ff';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('Hold the lighthouse. Ten nights. One last light.', VIEW_W / 2, 272);
    ctx.fillStyle = '#ffffff';
    ctx.font = '19px sans-serif';
    const lines = [
      'Creatures rise from the deep each night and march on Saltspire Cove.',
      'Build towers on the glowing pads, earn gold for every creature sunk,',
      'upgrade your towers — and keep the lighthouse standing through Night 10.',
      '',
      'Click a pad to build  •  Click a tower to upgrade or sell  •  Space: start night',
      'F: speed  •  P: pause  •  M: mute  •  R: restart',
    ];
    lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, 330 + i * 28));
    const b = this.button(VIEW_W / 2 - 130, 520, 260, 62, 'start-game', 'Begin the watch');
    ctx.fillStyle = '#ffd166';
    roundRect(ctx, b.x, b.y, b.w, b.h, 12); ctx.fill();
    ctx.fillStyle = '#1a1a2e';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('▶  BEGIN THE WATCH', b.x + b.w / 2, b.y + 32);
    if (world.bestNight > 0) {
      ctx.fillStyle = '#c9d1d9';
      ctx.font = '17px sans-serif';
      ctx.fillText(`Best watch so far: Night ${world.bestNight} of ${TOTAL_NIGHTS}`, VIEW_W / 2, 620);
    }
    ctx.fillStyle = '#8d99ae';
    ctx.font = '14px sans-serif';
    ctx.fillText('A tower defence of tide, gold and lamplight — original art and music, made in code.', VIEW_W / 2, 668);
  }

  drawPause(ctx, world) {
    ctx.fillStyle = 'rgba(4,8,20,0.66)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 54px sans-serif';
    ctx.fillText('PAUSED', VIEW_W / 2, 300);
    ctx.font = '20px sans-serif';
    ctx.fillText('P or click Resume to keep the watch.', VIEW_W / 2, 360);
    const b = this.button(VIEW_W / 2 - 100, 400, 200, 54, 'resume', 'Resume');
    ctx.fillStyle = '#ffd166';
    roundRect(ctx, b.x, b.y, b.w, b.h, 10); ctx.fill();
    ctx.fillStyle = '#1a1a2e';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('▶ RESUME', b.x + b.w / 2, b.y + 28);
    void world;
  }

  drawEnd(ctx, world, won) {
    ctx.fillStyle = won ? 'rgba(6,26,12,0.72)' : 'rgba(26,6,10,0.72)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.textAlign = 'center';
    ctx.fillStyle = won ? '#80ed99' : '#ff5964';
    ctx.font = 'bold 64px sans-serif';
    ctx.fillText(won ? 'THE LIGHT HOLDS!' : 'THE LIGHT GOES OUT', VIEW_W / 2, 210);
    ctx.fillStyle = '#ffffff';
    ctx.font = '22px sans-serif';
    ctx.fillText(
      won ? 'Dawn breaks over Saltspire Cove. The Kraken is sunk, the town is safe.'
        : `The tide took the lighthouse on Night ${world.night}. The cove falls dark.`,
      VIEW_W / 2, 268,
    );
    ctx.font = 'bold 20px sans-serif';
    const stats = [
      `Nights survived: ${won ? TOTAL_NIGHTS : world.night - 1} / ${TOTAL_NIGHTS}`,
      `Creatures sunk: ${world.kills}`,
      `Gold earned: ${world.earned}g  •  Towers built: ${world.towersBuilt}`,
      `Town health left: ${world.townHp} / ${TOWN_MAX_HP}`,
    ];
    stats.forEach((s, i) => {
      ctx.fillStyle = '#e0e0e0';
      ctx.font = '19px sans-serif';
      ctx.fillText(s, VIEW_W / 2, 330 + i * 30);
    });
    if (won) {
      ctx.fillStyle = '#ffe66d';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('★ ★ ★  Warden of the Tide  ★ ★ ★', VIEW_W / 2, 470);
    }
    const b = this.button(VIEW_W / 2 - 130, 520, 260, 60, 'restart', 'Play again');
    ctx.fillStyle = '#ffd166';
    roundRect(ctx, b.x, b.y, b.w, b.h, 12); ctx.fill();
    ctx.fillStyle = '#1a1a2e';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('↻  PLAY AGAIN  (R)', b.x + b.w / 2, b.y + 31);
  }
}
