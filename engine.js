// 1. DYNAMIC BACKGROUND MOTION ENGINE
class AmbientCircles extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
          background-color: var(--bg-color, #e6f0fa);
        }
        canvas {
          width: 1080px;
          height: 1920px;
          display: block;
        }
      </style>
      <canvas id="circleCanvas" width="1080" height="1920"></canvas>
    `;
    this.canvas = this.shadowRoot.getElementById('circleCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.circles = [];
    this.speedMultiplier = 2.5;
  }

  init(config) {
    if (config.backgroundColor) {
      this.style.setProperty('--bg-color', config.backgroundColor);
    }
    this.speedMultiplier = config.animationSpeed || 2.5;

    const baseColors = [
      { r: 0, g: 51, b: 160 },   // #0033a0
      { r: 64, g: 102, b: 184 }  // #4066b8
    ];

    const count = config.circleCount || 20;
    this.circles = [];

    for (let i = 0; i < count; i++) {
      const selectedColor = baseColors[i % baseColors.length];
      const alpha = (0.08 + Math.random() * 0.22).toFixed(2);

      this.circles.push({
        x: Math.random() * 1080,
        y: Math.random() * 1920,
        baseRadius: 120 + Math.random() * 330,
        radius: 0,
        color: `rgba(${selectedColor.r}, ${selectedColor.g}, ${selectedColor.b}, ${alpha})`,
        vx: (Math.random() - 0.5) * this.speedMultiplier,
        vy: (Math.random() - 0.5) * this.speedMultiplier,
        scaleAngle: Math.random() * Math.PI * 2,
        scaleSpeed: 0.005 + Math.random() * 0.015
      });
    }

    this.animate();
  }

  animate() {
    this.ctx.clearRect(0, 0, 1080, 1920);
    this.ctx.globalCompositeOperation = 'multiply';

    this.circles.forEach(c => {
      c.x += c.vx;
      c.y += c.vy;

      if (c.x < -150 || c.x > 1230) c.vx *= -1;
      if (c.y < -150 || c.y > 2070) c.vy *= -1;

      c.scaleAngle += c.scaleSpeed;
      c.radius = c.baseRadius * (0.7 + Math.sin(c.scaleAngle) * 0.3);

      this.ctx.beginPath();
      this.ctx.fillStyle = c.color;
      this.ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
      this.ctx.fill();
    });

    requestAnimationFrame(() => this.animate());
  }
}
customElements.define('ambient-circles', AmbientCircles);

// 2. DATA LOADER & RENDERER
async function loadSignageData() {
  try {
    const response = await fetch('content.json');
    const data = await response.json();

    // Set frame color dynamically
    if (data.display && data.display.frameColor) {
      document.body.style.borderColor = data.display.frameColor;
    }

    // Initialize/Update background engine config
    const bgComponent = document.querySelector('ambient-circles');
    if (bgComponent && data.display) {
      bgComponent.init(data.display);
    }

    // Render Announcement Display
    const container = document.getElementById('cards-container');
    const item = data.announcement;

    if (item) {
      let sessionsHTML = item.sessions.map(s => `
        <div class="session-row">
          <div class="session-date">${s.date} <span class="lang-tag">${s.lang}</span></div>
          <div class="session-times">
            <span><b>Geneva:</b> ${s.timeGeneva}</span>
            <span><b>NY:</b> ${s.timeNY}</span>
            <span><b>Bangkok:</b> ${s.timeBangkok}</span>
          </div>
        </div>
      `).join('');

      container.innerHTML = `
        <div class="main-card">
          <div class="badge">${item.badge}</div>
          <h2 class="card-title">${item.title}</h2>
          <p class="card-desc">${item.description}</p>
          <div class="sessions-grid">
            ${sessionsHTML}
          </div>
          <div class="card-footer">${item.footer}</div>
        </div>
      `;
    }
  } catch (err) {
    console.error('Waiting for content.json...', err);
  }
}

loadSignageData();
setInterval(loadSignageData, 120000);
