/* מגן אור – חדר בריחה דיגיטלי באופטיקה (דמו) */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const app = $('#app');
const SVGNS = 'http://www.w3.org/2000/svg';
const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;

/* ---------- state ---------- */
const KEY = 'magen-or-v1';
let state = { strips: {} };
try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.strips) state = s; } catch (e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };

/* ---------- helpers ---------- */
function toast(msg, type = '') {
  const t = $('#toast'); t.textContent = msg; t.className = 'toast show ' + type;
  clearTimeout(toast._t); toast._t = setTimeout(() => t.className = 'toast', 2600);
}
function modal(html, btn = 'המשך', cb) {
  const bg = document.createElement('div'); bg.className = 'modal-bg';
  bg.innerHTML = `<div class="card modal">${html}<p><button class="btn">${btn}</button></p></div>`;
  document.body.appendChild(bg);
  $('.btn', bg).onclick = () => { bg.remove(); cb && cb(); };
}
function confetti() {
  const c = document.createElement('div'); c.className = 'confetti';
  const cols = ['#ff5a5f', '#ffd84d', '#4ee18b', '#4da3ff', '#9b6bff', '#ff9f43'];
  for (let i = 0; i < 90; i++) {
    const p = document.createElement('i');
    p.style.left = Math.random() * 100 + 'vw'; p.style.background = cols[i % cols.length];
    p.style.animationDuration = 2 + Math.random() * 2 + 's'; p.style.animationDelay = Math.random() * .6 + 's';
    c.appendChild(p);
  }
  document.body.appendChild(c); setTimeout(() => c.remove(), 5000);
}
function svgEl(tag, attrs = {}, parent) {
  const e = document.createElementNS(SVGNS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e); return e;
}
/* combination lock. fields: [{label, color, len}] answer: array of strings */
function lock(root, { icon = '🔒', title = 'הזינו את הקוד', fields, answer, onOpen }) {
  const el = document.createElement('div'); el.className = 'lock';
  el.innerHTML = `<div class="icon">${icon}</div><h3>${title}</h3><div class="dial"></div><button class="btn">פתחו את הכספת</button>`;
  const dial = $('.dial', el);
  fields.forEach(f => {
    const l = document.createElement('label');
    l.innerHTML = `<input inputmode="numeric" maxlength="${f.len || 1}" class="${(f.len || 1) > 1 ? 'wide' : ''}" style="${f.color ? 'border-color:' + f.color : ''}" aria-label="${f.label || 'ספרה'}">${f.label ? `<span style="color:${f.color || 'inherit'}">${f.label}</span>` : ''}`;
    dial.appendChild(l);
  });
  const ins = $$('input', el);
  ins.forEach((inp, i) => inp.addEventListener('input', () => {
    inp.value = inp.value.replace(/\D/g, '');
    if (inp.value.length >= (fields[i].len || 1) && ins[i + 1]) ins[i + 1].focus();
  }));
  $('.btn', el).onclick = () => {
    const ok = ins.every((inp, i) => inp.value === String(answer[i]));
    if (ok) {
      el.classList.add('open'); $('.icon', el).textContent = '🔓'; $('.btn', el).disabled = true;
      ins.forEach(i => i.disabled = true); onOpen && onOpen();
    } else {
      el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
      toast('הכספת נשארה נעולה… נסו שוב', 'bad');
    }
  };
  root.appendChild(el); return el;
}
function choiceQ(root, { options, correct, multi = false, onOk, penalty = 0 }) {
  const wrap = document.createElement('div'); wrap.className = 'choices';
  let locked = false;
  options.forEach((o, i) => {
    const b = document.createElement('button'); b.className = 'choice'; b.innerHTML = o;
    b.onclick = () => {
      if (locked) return;
      if (multi) { b.classList.toggle('sel'); return; }
      if (i === correct) { b.classList.add('ok'); locked = true; onOk && onOk(); }
      else { b.classList.add('bad'); toast('לא בדיוק… נסו שוב', 'bad'); setTimeout(() => b.classList.remove('bad'), 900); }
    };
    wrap.appendChild(b);
  });
  root.appendChild(wrap);
  if (multi) {
    const chk = document.createElement('button'); chk.className = 'btn small'; chk.textContent = 'בדיקה';
    chk.onclick = () => {
      if (locked) return;
      const sel = $$('.choice', wrap).map((b, i) => b.classList.contains('sel') ? i : -1).filter(i => i >= 0);
      const ok = sel.length === correct.length && correct.every(c => sel.includes(c));
      if (ok) { locked = true; $$('.choice.sel', wrap).forEach(b => b.classList.add('ok')); onOk && onOk(); }
      else toast('לא בדיוק… נסו שוב', 'bad');
    };
    root.appendChild(chk);
  }
  return wrap;
}
function uvReveal(root, text, onFound) {
  const box = document.createElement('div'); box.className = 'uvbox';
  box.innerHTML = `<div class="hint">🔦 העבירו את פנס ה־UV על המסגרת</div><div class="glow"></div><div class="secret">${text}</div>`;
  let moved = 0;
  const mv = e => {
    const r = box.getBoundingClientRect();
    box.style.setProperty('--x', (e.clientX - r.left) + 'px'); box.style.setProperty('--y', (e.clientY - r.top) + 'px');
    if (++moved === 40 && onFound) onFound();
  };
  box.addEventListener('pointermove', mv); box.addEventListener('pointerdown', mv);
  root.appendChild(box); return box;
}
function stripHTML(m) {
  return `<div class="strip" style="--sc:${m.color}"><span>📜 ${m.strip}</span><span class="digits">${m.digits.join(' ')}</span></div>`;
}

/* ---------- missions ---------- */
const M = [];

/* ===== משימה 1: מנגנון האור הנעול ===== */
M.push({
  id: 'm1', num: 1, icon: '🪞', title: 'מנגנון האור הנעול', color: 'var(--red)', lockName: 'התיבה האדומה',
  topic: 'החזרה', strip: 'זווית פגיעה שווה זווית החזרה', digits: [7, 6, 9, 1, 3],
  slides: [
    (r, api) => {
      r.innerHTML = `<h2>משימה 1 – מנגנון האור הנעול</h2>
      <p class="story">אתם ניצבים מול מתקן עגול עתיק, אך בעל עיקרון פיזיקלי חשוב באופטיקה. בצידו מותקן מצביע לייזר, ובמרכזו מראה המחוברת למד־זווית. אלו שני הכלים היחידים שיעזרו לכם לחשוף את הקוד.</p>
      <p class="muted">🎯 המטרה: להאיר בלייזר על המראה כך שהקרן המוחזרת תעבור דרך החורים הסודיים בטבעת.</p>`;
      api.done();
    },
    (r, api) => {
      r.innerHTML = `<h2>כוונו את הלייזר</h2>
      <p>הזיזו את המחוון כדי לשנות את זווית הלייזר. מצאו את <b>שלושת החורים הצבעוניים</b> בטבעת – ורשמו את זוויות ההחזרה.</p>
      <div class="stage"><svg viewBox="0 0 400 250" id="m1svg"></svg></div>
      <p><input type="range" min="5" max="85" value="35" id="m1r" aria-label="זווית הלייזר"></p>
      <div class="readout"><div>זווית פגיעה<b id="m1i">35°</b></div><div>זווית החזרה<b id="m1o">35°</b></div></div>
      <table class="table" id="m1t"></table>`;
      const svg = $('#m1svg'), C = { x: 200, y: 225 }, R = 180;
      const holes = [{ a: 20, c: '#4ee18b', n: 'ירוק' }, { a: 50, c: '#ff5a5f', n: 'אדום' }, { a: 70, c: '#ffd84d', n: 'צהוב' }];
      const found = new Set();
      svgEl('path', { d: `M ${C.x - R} ${C.y} A ${R} ${R} 0 0 1 ${C.x + R} ${C.y}`, fill: 'none', stroke: '#8a90c9', 'stroke-width': 10 }, svg);
      for (let a = -80; a <= 80; a += 10) {
        const s = Math.sin(rad(a)), c = Math.cos(rad(a));
        svgEl('line', { x1: C.x + (R - 14) * s, y1: C.y - (R - 14) * c, x2: C.x + (R - 6) * s, y2: C.y - (R - 6) * c, stroke: '#ffffff60' }, svg);
        const t = svgEl('text', { x: C.x + (R - 26) * s, y: C.y - (R - 26) * c + 4, fill: '#ffffff70', 'font-size': 9, 'text-anchor': 'middle' }, svg);
        t.textContent = Math.abs(a);
      }
      svgEl('line', { x1: C.x, y1: C.y, x2: C.x, y2: C.y - R + 20, stroke: '#ffffff50', 'stroke-dasharray': '5 5' }, svg);
      const nt = svgEl('text', { x: C.x, y: C.y - R + 50, fill: '#ffffff80', 'font-size': 10, 'text-anchor': 'middle' }, svg); nt.textContent = 'אנך';
      const holeEls = holes.map(h => svgEl('circle', { cx: C.x + R * Math.sin(rad(h.a)), cy: C.y - R * Math.cos(rad(h.a)), r: 7, fill: '#060820', stroke: h.c, 'stroke-width': 3 }, svg));
      svgEl('rect', { x: C.x - 70, y: C.y - 2, width: 140, height: 10, rx: 3, fill: '#bfe6ff' }, svg);
      const inc = svgEl('line', { stroke: '#ff2a2a', 'stroke-width': 3, 'stroke-linecap': 'round' }, svg);
      const ref = svgEl('line', { stroke: '#ff2a2a', 'stroke-width': 3, 'stroke-linecap': 'round' }, svg);
      const laser = svgEl('rect', { width: 26, height: 12, rx: 3, fill: '#ccc' }, svg);
      const draw = () => {
        const a = +$('#m1r').value, s = Math.sin(rad(a)), c = Math.cos(rad(a));
        const L = { x: C.x - (R - 10) * s, y: C.y - (R - 10) * c };
        inc.setAttribute('x1', L.x); inc.setAttribute('y1', L.y); inc.setAttribute('x2', C.x); inc.setAttribute('y2', C.y);
        ref.setAttribute('x1', C.x); ref.setAttribute('y1', C.y); ref.setAttribute('x2', C.x + R * s); ref.setAttribute('y2', C.y - R * c);
        laser.setAttribute('x', L.x - 13); laser.setAttribute('y', L.y - 6);
        laser.setAttribute('transform', `rotate(${90 - a} ${L.x} ${L.y})`);
        $('#m1i').textContent = a + '°'; $('#m1o').textContent = a + '°';
        holes.forEach((h, i) => {
          const hit = Math.abs(h.a - a) <= 1;
          holeEls[i].setAttribute('fill', hit ? h.c : '#060820');
          if (hit && !found.has(i)) { found.add(i); toast(`הקרן עברה בחור ה${h.n}! 🎉`, 'ok'); }
        });
        $('#m1t').innerHTML = holes.map((h, i) => `<tr><td><span class="lockico" style="background:${h.c}"></span>חור ${h.n}</td><td>${found.has(i) ? `זווית פגיעה ${h.a}° · זווית החזרה <b>${h.a}°</b>` : '❓'}</td></tr>`).join('');
        if (found.size === 3) api.done();
      };
      $('#m1r').oninput = draw; draw();
    },
    (r, api) => {
      r.innerHTML = `<h2>קוד הכספת האדומה</h2>
      <p>סדרו את שלוש זוויות ההחזרה שקיבלתם <b>לפי סדר צבעי הרמזור</b> 🚦 (מלמעלה למטה) – וקיבלתם את הקוד!</p>`;
      lock(r, { fields: [{ label: 'אדום', color: '#ff5a5f', len: 2 }, { label: 'צהוב', color: '#ffd84d', len: 2 }, { label: 'ירוק', color: '#4ee18b', len: 2 }], answer: ['50', '70', '20'], onOpen: api.win });
    }
  ]
});

/* ===== משימה 2: תיבת החומרים האופטיים ===== */
M.push({
  id: 'm2', num: 2, icon: '🧪', title: 'תיבת החומרים האופטיים', color: 'var(--yellow)', lockName: 'התיבה הצהובה',
  topic: 'חומרים', strip: 'התכונות האופטיות של החומרים קובעות את מסלול הקרן', digits: [8, 3, 0, 2, 8],
  slides: [
    (r, api) => {
      r.innerHTML = `<h2>משימה 2 – תיבת החומרים האופטיים</h2>
      <p class="story">אתם ניצבים מול תיבה מסתורית שבתחתיתה מספרים. חלק מהמספרים הם מסלול סודי שמוביל לפתרון. בתיבה מסומנות ארבע נקודות: A, B, C, D. לרשותכם שתי מראות, זכוכית וגוף שחור – כל אחד מהם משפיע על קרן הלייזר בצורה אחרת.</p>
      <ul><li><b>A</b> – גוף <b>המחזיר</b> אור</li><li><b>B</b> – גוף <b>המעביר</b> אור</li><li><b>C</b> – גוף <b>המחזיר</b> אור</li><li><b>D</b> – גוף <b>הבולע</b> אור</li></ul>`;
      api.done();
    },
    (r, api) => {
      r.innerHTML = `<h2>הניחו את החומרים</h2>
      <p>בחרו חומר מהמגש ואז לחצו על נקודה בתיבה. עקבו אחרי הקרן – <b>המספרים שהקרן עוברת דרכם</b> הם הקוד.</p>
      <div class="row" id="m2tools"></div>
      <div class="stage" style="margin-top:10px"><svg viewBox="-60 -10 520 330" id="m2svg"></svg></div>`;
      const COLS = 9, ROWS = 6, S = 50;
      const slots = { A: { x: 4, y: 1, m: '\\' }, B: { x: 4, y: 3 }, C: { x: 4, y: 5, m: '\\' }, D: { x: 8, y: 5 } };
      const need = { A: 'mirror', B: 'glass', C: 'mirror', D: 'black' };
      const nums = { '2,1': 3, '4,2': 8, '4,4': 1, '6,5': 6, '6,1': 9, '1,4': 2, '7,2': 5, '2,3': 7, '6,3': 4, '8,1': 0, '0,5': 1, '7,4': 2 };
      const items = { mirror: { n: '🪞 מראה', max: 2, c: '#bfe6ff' }, glass: { n: '🔷 זכוכית', max: 1, c: '#7fe7ff55' }, black: { n: '⬛ גוף שחור', max: 1, c: '#111' } };
      const placed = { A: null, B: null, C: null, D: null };
      let tool = 'mirror';
      const tools = $('#m2tools');
      const renderTools = () => {
        tools.innerHTML = '';
        for (const k in items) {
          const used = Object.values(placed).filter(v => v === k).length;
          const b = document.createElement('button'); b.className = 'tool' + (tool === k ? ' sel' : '');
          b.textContent = `${items[k].n} (${items[k].max - used})`; b.onclick = () => { tool = k; renderTools(); };
          tools.appendChild(b);
        }
      };
      const svg = $('#m2svg');
      const draw = () => {
        svg.innerHTML = '';
        svgEl('rect', { x: -4, y: -4, width: COLS * S + 8, height: ROWS * S + 8, rx: 10, fill: '#2a1d10', stroke: '#6b4a26', 'stroke-width': 6 }, svg);
        for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
          svgEl('rect', { x: x * S + 2, y: y * S + 2, width: S - 4, height: S - 4, rx: 6, fill: '#3a2a18' }, svg);
          const n = nums[x + ',' + y];
          if (n !== undefined) { const t = svgEl('text', { x: x * S + S / 2, y: y * S + S / 2 + 8, 'text-anchor': 'middle', 'font-size': 22, 'font-weight': 800, fill: '#d9c39a', 'data-c': x + ',' + y }, svg); t.textContent = n; }
        }
        // laser
        svgEl('rect', { x: -52, y: 1 * S + S / 2 - 9, width: 44, height: 18, rx: 4, fill: '#ccc' }, svg);
        // trace
        let x = -1, y = 1, dx = 1, dy = 0; const pts = [[-8, 1 * S + S / 2]]; const hits = [];
        for (let i = 0; i < 60; i++) {
          x += dx; y += dy;
          if (x < 0 || y < 0 || x >= COLS || y >= ROWS) { pts.push([x * S + S / 2 - dx * S / 2, y * S + S / 2 - dy * S / 2]); break; }
          const key = x + ',' + y;
          if (nums[key] !== undefined) hits.push(key);
          const sl = Object.keys(slots).find(k => slots[k].x === x && slots[k].y === y);
          if (sl && placed[sl]) {
            const it = placed[sl];
            if (it === 'black') { pts.push([x * S + S / 2, y * S + S / 2]); break; }
            if (it === 'mirror') { pts.push([x * S + S / 2, y * S + S / 2]); [dx, dy] = [dy, dx]; }
          }
        }
        svgEl('polyline', { points: pts.map(p => p.join(',')).join(' '), fill: 'none', stroke: '#ff2a2a', 'stroke-width': 4, 'stroke-linejoin': 'round', style: 'filter:drop-shadow(0 0 4px #f00)' }, svg);
        hits.forEach(k => { const t = svg.querySelector(`[data-c="${k}"]`); if (t) { t.setAttribute('fill', '#fff'); t.style.filter = 'drop-shadow(0 0 6px #ff4040)'; } });
        for (const k in slots) {
          const s = slots[k], g = svgEl('g', { style: 'cursor:pointer' }, svg);
          svgEl('rect', { x: s.x * S + 4, y: s.y * S + 4, width: S - 8, height: S - 8, rx: 8, fill: placed[k] ? items[placed[k]].c : '#00000055', stroke: '#ffd84d', 'stroke-width': 2, 'stroke-dasharray': placed[k] ? '' : '4 3' }, g);
          if (placed[k] === 'mirror') svgEl('line', { x1: s.x * S + 8, y1: s.y * S + 8, x2: s.x * S + S - 8, y2: s.y * S + S - 8, stroke: '#fff', 'stroke-width': 4 }, g);
          const t = svgEl('text', { x: s.x * S + 10, y: s.y * S + 18, 'font-size': 14, 'font-weight': 900, fill: '#ffd84d' }, g); t.textContent = k;
          g.addEventListener('click', () => {
            if (placed[k] === tool) placed[k] = null;
            else {
              const used = Object.entries(placed).filter(([kk, v]) => v === tool && kk !== k).length;
              if (used >= items[tool].max) { toast('נגמרו לכם פריטים מהסוג הזה', 'bad'); return; }
              placed[k] = tool;
            }
            renderTools(); draw();
          });
        }
        if (Object.keys(need).every(k => placed[k] === need[k])) { api.done(); if (!draw.ok) { draw.ok = 1; toast('המסלול הסודי נחשף! רשמו את המספרים 🔦', 'ok'); } }
      };
      renderTools(); draw();
    },
    (r, api) => {
      r.innerHTML = `<h2>קוד הכספת הצהובה</h2><p>הזינו את המספרים שהקרן עברה דרכם – לפי הסדר מהלייזר והלאה.</p>`;
      lock(r, { fields: [{}, {}, {}, {}], answer: ['3', '8', '1', '6'], onOpen: () => setTimeout(api.next, 900) });
    },
    (r, api) => {
      r.innerHTML = `<h2>מסר נסתר</h2>
      <p>בתוך הכספת הצהובה מצאתם <b>פנס UV</b> 🟣. הפעילו אותו על המסגרת החיצונית של התיבה – ותגלו מסר נסתר.</p>`;
      uvReveal(r, '"התכונות האופטיות של החומרים<br>קובעות את מסלול הקרן"', () => setTimeout(api.win, 1200));
    }
  ]
});

/* ===== משימה 3: מנגנון ההסוואה האופטי ===== */
M.push({
  id: 'm3', num: 3, icon: '🫥', title: 'מנגנון ההסוואה האופטי', color: 'var(--cyan)', lockName: 'התיבה התכולה',
  topic: 'שבירה', strip: 'ככל שמקדם השבירה של החומר גדול יותר – כך זווית השבירה של האור קטנה יותר', digits: [0, 4, 5, 8, 2],
  slides: [
    (r, api) => {
      r.innerHTML = `<h2>משימה 3 – מנגנון ההסוואה האופטי</h2>
      <p class="story">כדי להסתיר אובייקטים מסווגים בפרויקט "מגן אור" משתמשים במערכת הסוואה אופטית. העיקרון: כששני חומרים חולקים את אותו <b>מקדם שבירה</b> – הגבולות ביניהם מתמזגים, והאובייקט "נעלם" מהעין!</p>
      <p>🎯 המשימה: להעלים את מקל הזכוכית. אסור לערבב את החומרים זה בזה!</p>`;
      api.done();
    },
    (r, api) => {
      r.innerHTML = `<h2>העלימו את המקל</h2><p>לחצו על מיכל כדי לטבול בו את מקל הזכוכית.</p><div class="tanks" id="tk"></div><div id="q"></div>`;
      const tanks = [{ n: 'גליצרין', c: '#ff5a5f', num: 30, inv: true }, { n: 'מים', c: '#4ee18b', num: 60 }, { n: 'מי סוכר', c: '#4da3ff', num: 50 }];
      const tk = $('#tk'); let asked = false;
      tanks.forEach(t => {
        const b = document.createElement('button'); b.className = 'tank';
        b.innerHTML = `<div class="glass"><div class="liquid"></div><div class="rod"><div class="sub"></div></div></div><span class="sticker" style="background:${t.c}">${t.num}</span><div class="muted">${t.n}</div>`;
        b.onclick = () => {
          $$('.tank', tk).forEach(x => x.classList.remove('in')); b.classList.add('in');
          const sub = $('.sub', b);
          sub.style.opacity = t.inv ? '0' : '1';
          sub.style.transform = t.inv ? '' : 'translateX(4px)';
          if (t.inv && !asked) {
            asked = true; toast('וואו! המקל נעלם! 🫥', 'ok');
            const q = $('#q'); q.innerHTML = '<h3>מה שם החומר שהעלים את המקל?</h3>';
            choiceQ(q, { options: ['מים', 'מי סוכר', 'גליצרין'], correct: 2, onOk: api.done });
          }
        };
        tk.appendChild(b);
      });
    },
    (r, api) => {
      r.innerHTML = `<h2>מה עומד מאחורי התופעה?</h2>
      <p>קחו את הפנס, הדליקו אותו והכניסו אותו לקופסה עם חיתוך הלייזר. הרמז שיוקרן על הקיר יעזור לכם במשימה הבאה.</p>
      <p class="center row"><button class="btn" id="fl">🔦 הדליקו את הפנס</button></p>
      <div class="wall" id="wall"><div class="msg">כשאור עובר מחומר אחד לחומר אחר הוא משנה את כיוון התקדמותו – זוהי <u>שבירת אור</u>.<br>מקדם השבירה הוא המספר שמתאר כמה החומר גורם לאור לשנות כיוון.</div></div>`;
      $('#fl').onclick = () => { $('#wall').classList.add('lit'); api.done(); };
    },
    (r, api) => {
      r.innerHTML = `<h2>מי שובר יותר?</h2>
      <p>הלייזר מאיר על שני מיכלים: הירוק (מים) והאדום (גליצרין). החליפו ביניהם והשוו את <b>זווית השבירה</b>.</p>
      <p class="muted">זכרו: מקדם שבירה קטן ⟵ זווית שבירה גדולה · מקדם שבירה גדול ⟵ זווית שבירה קטנה</p>
      <div class="row center"><button class="tool sel" data-t="0">🟩 מיכל ירוק</button><button class="tool" data-t="1">🟥 מיכל אדום</button></div>
      <div class="stage" style="margin-top:10px"><svg viewBox="0 0 400 260" id="rf"></svg></div>
      <div class="readout"><div>זווית פגיעה<b>70°</b></div><div>זווית שבירה<b id="rfa"></b></div></div>
      <h3>לאיזה מיכל מקדם שבירה נמוך יותר?</h3><div id="q"></div>`;
      const T = [{ n: 1.33, c: '#4ee18b' }, { n: 1.47, c: '#ff5a5f' }];
      const svg = $('#rf');
      const draw = i => {
        svg.innerHTML = '';
        const t = T[i], O = { x: 200, y: 110 };
        svgEl('rect', { x: 40, y: 110, width: 320, height: 140, fill: t.c + '33', stroke: '#cfe9ff88', 'stroke-width': 3 }, svg);
        svgEl('rect', { x: 40, y: 236, width: 40, height: 14, fill: t.c }, svg);
        svgEl('line', { x1: 200, y1: 20, x2: 200, y2: 250, stroke: '#ffffff60', 'stroke-dasharray': '5 5' }, svg);
        const a = rad(70), b = Math.asin(Math.sin(a) / t.n);
        const L = 105;
        svgEl('line', { x1: O.x - L * Math.sin(a), y1: O.y - L * Math.cos(a), x2: O.x, y2: O.y, stroke: '#ff2a2a', 'stroke-width': 4 }, svg);
        svgEl('line', { x1: O.x, y1: O.y, x2: O.x + 140 * Math.sin(b), y2: O.y + 140 * Math.cos(b), stroke: '#ff2a2a', 'stroke-width': 4 }, svg);
        svgEl('path', { d: `M ${O.x} ${O.y + 50} A 50 50 0 0 0 ${O.x + 50 * Math.sin(b)} ${O.y + 50 * Math.cos(b)}`, fill: 'none', stroke: '#ffd84d', 'stroke-width': 3 }, svg);
        const tx = svgEl('text', { x: O.x + 30, y: O.y + 80, fill: '#ffd84d', 'font-size': 16, 'font-weight': 800 }, svg); tx.textContent = Math.round(deg(b)) + '°';
        $('#rfa').textContent = Math.round(deg(b)) + '°';
      };
      $$('[data-t]', r).forEach(b => b.onclick = () => { $$('[data-t]', r).forEach(x => x.classList.remove('sel')); b.classList.add('sel'); draw(+b.dataset.t); });
      draw(0);
      choiceQ($('#q'), { options: ['🟩 המיכל עם המדבקה הירוקה', '🟥 המיכל עם המדבקה האדומה'], correct: 0, onOk: api.done });
    },
    (r, api) => {
      r.innerHTML = `<h2>מי המדען?</h2>
      <p>לחצו על המדבקות לפי הסדר: <b>ירוקה ← כחולה ← אדומה</b>, והמירו את המספרים לאותיות לפי <b>גימטריה</b>. תקבלו את שם מגלה החוק הפיזיקלי של שבירת האור!</p>
      <div class="row center" id="st"></div><div class="seq" id="sq"></div>
      <table class="table muted" style="max-width:420px;margin:auto"><tr><td>ל = 30</td><td>מ = 40</td><td>נ = 50</td><td>ס = 60</td><td>ע = 70</td></tr></table>
      <h3>מיהו המדען?</h3><div id="q"></div>`;
      const st = [{ c: '#4ee18b', n: 60, l: 'ס' }, { c: '#4da3ff', n: 50, l: 'נ' }, { c: '#ff5a5f', n: 30, l: 'ל' }];
      let k = 0;
      [2, 0, 1].forEach(i => {
        const s = st[i], b = document.createElement('button'); b.className = 'chip'; b.style.background = s.c; b.textContent = s.n;
        b.onclick = () => {
          if (i !== k) { toast('לא לפי הסדר… ירוקה, כחולה, אדומה', 'bad'); return; }
          b.classList.add('used'); b.disabled = true; k++;
          const sp = document.createElement('span'); sp.style.background = s.c; sp.textContent = `${s.n} = ${s.l}`; $('#sq').appendChild(sp);
        };
        $('#st').appendChild(b);
      });
      choiceQ($('#q'), { options: ['ניוטון', 'סנל', 'גלילאו', 'אדיסון'], correct: 1, onOk: api.done });
    },
    (r, api) => {
      r.innerHTML = `<h2>כספת התכלת</h2><p class="story">"רק מי שיודע להעלים – יוכל גם לגלות."</p>
      <p>חוק סנל מתאר את שבירת האור בין שני חומרים. כל הכבוד! הקוד לכספת התכלת הוא: <b style="font-size:24px;letter-spacing:4px">468</b></p>`;
      lock(r, { fields: [{}, {}, {}], answer: ['4', '6', '8'], onOpen: api.win });
    }
  ]
});

/* ===== משימה 4: משימת ה־RGB ===== */
M.push({
  id: 'm4', num: 4, icon: '🌈', title: 'משימת ה־RGB', color: 'var(--green)', lockName: 'התיבה הירוקה',
  topic: 'צבעים', strip: 'האור הלבן הוא תוצאה של צירוף כל צבעי האור הנראה', digits: [1, 4, 0, 5, 3],
  slides: [
    (r, api) => {
      r.innerHTML = `<h2>משימה 4 – משימת ה־RGB</h2>
      <p class="story">צוות LaserShield-X, לפניכם מנגנון האבטחה הנוסף של "מגן אור". המערכת מגנה על הקוד באמצעות מסך צבעים ספקטרלי. שישה מקורות אור מוזנים למערכת – אך רק שילוב אחד נכון יבטל את ההסוואה.</p>`;
      api.done();
    },
    (r, api) => {
      r.innerHTML = `<h2>הרכיבו אור לבן</h2><p>בחרו <b>שלושה</b> פנסי צבע שיחד יוצרים <b>אור לבן</b>.</p>
      <div class="mix" id="mx"></div><div class="lamps" id="lp"></div>`;
      const L = [{ n: 'ירוק', c: '#00ff00' }, { n: 'אדום', c: '#ff0000' }, { n: 'כחול', c: '#0000ff' }, { n: 'ורוד', c: '#ff66cc' }, { n: 'צהוב', c: '#ffff00' }, { n: 'חום', c: '#8b4513' }];
      const on = [];
      const pos = [[0, -35], [-42, 32], [42, 32]];
      const draw = () => {
        $('#mx').innerHTML = on.map((i, k) => `<div class="beam" style="background:${L[i].c};left:calc(50% - 90px + ${pos[k][0]}px);top:calc(50% - 90px + ${pos[k][1]}px)"></div>`).join('');
        $$('.lamp', r).forEach((b, i) => b.classList.toggle('on', on.includes(i)));
        if (on.length === 3) {
          const ok = [0, 1, 2].every(i => on.includes(i));
          if (ok) { toast('אור לבן! 🤍 R G B', 'ok'); api.done(); } else toast('זה לא אור לבן… נסו שילוב אחר', 'bad');
        }
      };
      L.forEach((l, i) => {
        const b = document.createElement('button'); b.className = 'lamp'; b.style.setProperty('--lc', l.c);
        b.innerHTML = `<span class="bulb"></span>${l.n}`;
        b.onclick = () => {
          const k = on.indexOf(i);
          if (k >= 0) on.splice(k, 1); else { if (on.length >= 3) on.shift(); on.push(i); }
          draw();
        };
        $('#lp').appendChild(b);
      });
    },
    (r, api) => {
      r.innerHTML = `<h2>אילו מספרים לא נעלמו?</h2>
      <p>הציבו את שלושת הפנסים מעל דף המספרים והדליקו אותם. המספרים שלא שייכים לקוד ייעלמו!</p>
      <p class="center row"><button class="btn" id="lt">💡 הדליקו את הפנסים</button></p>
      <div class="paper" id="pp"></div><p class="muted center">סמנו את המספרים שנשארו ולחצו "בדיקה"</p><div id="q"></div>`;
      const digits = [8, 3, 1, 9, 5, 2, 6, 7, 4];
      const keep = [3, 5, 7], cols = ['#d94', '#c33', '#39c', '#9c3', '#36c', '#c6c', '#f80', '#3a6', '#888'];
      digits.forEach((d, i) => {
        const b = document.createElement('button'); b.textContent = d; b.style.color = cols[i];
        if (!keep.includes(d)) b.classList.add('fade');
        b.onclick = () => b.classList.toggle('sel');
        $('#pp').appendChild(b);
      });
      $('#lt').onclick = () => $('#pp').classList.add('lit');
      const chk = document.createElement('button'); chk.className = 'btn small'; chk.textContent = 'בדיקה';
      chk.onclick = () => {
        const sel = $$('#pp button.sel').map(b => +b.textContent).sort();
        if (sel.join() === keep.join()) { toast('נכון! 3, 5, 7 ✨', 'ok'); api.done(); } else toast('לא בדיוק… הדליקו את הפנסים ובדקו שוב', 'bad');
      };
      $('#q').className = 'row center'; $('#q').appendChild(chk);
    },
    (r, api) => {
      r.innerHTML = `<h2>נפיצה – קשת בענן בכיתה</h2>
      <p>הצלחתם לחשוף את שלוש הספרות – אבל הסדר קריטי! האירו באור לבן על הדיסק: הוא מפריד את האור לצבעיו בתהליך שנקרא <b>נפיצה</b> (בדיוק כמו קשת בענן 🌈).</p>
      <div class="stage"><svg viewBox="0 0 400 200" id="dp"></svg></div>
      <p>לחצו על הצבעים <b>לפי הסדר</b> שבו הם מופיעים בנפיצה (מלמעלה למטה):</p>
      <div class="seq" id="sq"></div><div class="chips" id="ch"></div>`;
      const C = [['אדום', '#ff3b3b'], ['כתום', '#ff9f43'], ['צהוב', '#ffe14d'], ['ירוק', '#4ee18b'], ['כחול', '#3d8bff'], ['אינדיגו', '#5b4bff'], ['סגול', '#a64dff']];
      const svg = $('#dp');
      svgEl('line', { x1: 10, y1: 100, x2: 190, y2: 100, stroke: '#fff', 'stroke-width': 6 }, svg);
      svgEl('circle', { cx: 200, cy: 100, r: 30, fill: '#cfd6ff', stroke: '#fff', 'stroke-width': 2 }, svg);
      svgEl('circle', { cx: 200, cy: 100, r: 6, fill: '#666' }, svg);
      C.forEach((c, i) => svgEl('line', { x1: 220, y1: 100, x2: 390, y2: 25 + i * 25, stroke: c[1], 'stroke-width': 5 }, svg));
      const order = [3, 0, 5, 2, 6, 1, 4]; let k = 0;
      order.forEach(i => {
        const b = document.createElement('button'); b.className = 'chip'; b.style.background = C[i][1]; b.textContent = C[i][0];
        b.onclick = () => {
          if (i !== k) { toast('לא הצבע הבא ברצף… הסתכלו שוב על הקשת', 'bad'); return; }
          b.classList.add('used'); b.disabled = true; k++;
          const s = document.createElement('span'); s.style.background = C[i][1]; s.textContent = C[i][0]; $('#sq').appendChild(s);
          if (k === 7) { toast('רצף הקשת המושלם! 🌈', 'ok'); api.done(); }
        };
        $('#ch').appendChild(b);
      });
    },
    (r, api) => {
      r.innerHTML = `<h2>קוד התיבה הירוקה</h2>
      <p>הקוד מסתתר במספרי ה־<b>RGB</b> (ראשי התיבות של שלושת צבעי הפנסים שהצבתם) – <b>לפי הסדר שלהם בנפיצה</b>.</p>
      <table class="table" style="max-width:300px">
      <tr><td>🟠 כתום</td><td>1</td></tr><tr><td>🔴 אדום</td><td>3</td></tr><tr><td>🟡 צהוב</td><td>2</td></tr><tr><td>🟢 ירוק</td><td>5</td></tr>
      <tr><td>🔵 כחול</td><td>7</td></tr><tr><td>🟣 סגול</td><td>2</td></tr><tr><td>🟪 אינדיגו</td><td>4</td></tr></table>`;
      lock(r, { fields: [{}, {}, {}], answer: ['3', '5', '7'], onOpen: api.win });
    }
  ]
});

/* ===== משימה 5: הסיב האופטי ===== */
M.push({
  id: 'm5', num: 5, icon: '💡', title: 'משימת הסיב האופטי', color: 'var(--orange)', lockName: 'התיבה הכתומה',
  topic: 'סיב אופטי', strip: 'בסיב אופטי מתבצעת החזרה גמורה', digits: [3, 0, 1, 7, 4],
  slides: [
    (r, api) => {
      r.innerHTML = `<h2>משימה 5 – הסיב האופטי</h2>
      <p class="story">כחלק משכבת הגנה נוספת, "מגן אור" מעבירה מידע קריטי רק דרך <b>סיבים אופטיים</b> – טכנולוגיה המבוססת על <b>החזרה פנימית גמורה</b>, שמונעת דליפת אור ונתונים. רק צוות שישלוט במסלול האור וישמור אותו כלוא בתוך הסיב יחשוף את הקוד!</p>`;
      api.done();
    },
    (r, api) => {
      r.innerHTML = `<h2>לכלוא את האור</h2>
      <p>הטו את הלייזר כך שהקרן תוחזר בתוך הנוזל <b>לפחות 3 פעמים</b> בלי לצאת ממנו.</p>
      <div class="stage"><svg viewBox="0 0 400 230" id="aq"></svg></div>
      <p><input type="range" min="15" max="80" value="30" id="ag" aria-label="זווית הלייזר"></p>
      <div class="readout"><div>זווית פגיעה בפני המים<b id="aa"></b></div><div>החזרות בתוך הנוזל<b id="ab"></b></div></div>
      <div id="q"></div>`;
      const n = 1.4, crit = deg(Math.asin(1 / n)), svg = $('#aq');
      const TOP = 150, BOT = 210, X0 = 20, X1 = 380;
      let asked = false;
      const draw = () => {
        const a = +$('#ag').value; svg.innerHTML = '';
        svgEl('rect', { x: X0, y: TOP, width: X1 - X0, height: BOT - TOP, fill: '#4da3ff33' }, svg);
        svgEl('rect', { x: X0, y: 40, width: X1 - X0, height: BOT - 40, fill: 'none', stroke: '#cfe9ff99', 'stroke-width': 3 }, svg);
        svgEl('line', { x1: X0, y1: TOP, x2: X1, y2: TOP, stroke: '#cfe9ff', 'stroke-width': 2 }, svg);
        let x = X0, y = BOT - 10, dy = -1; const pts = [[x, y]]; let bounces = 0, escaped = false;
        const tn = Math.tan(rad(a));
        for (let i = 0; i < 20; i++) {
          const ty = dy < 0 ? TOP : BOT, nx = x + Math.abs(y - ty) * tn;
          if (nx >= X1) { pts.push([X1, y + dy * (X1 - x) / tn]); break; }
          x = nx; y = ty; pts.push([x, y]);
          if (dy < 0 && a < crit) { escaped = true; break; }
          dy = -dy; bounces++;
        }
        svgEl('polyline', { points: pts.map(p => p.join(',')).join(' '), fill: 'none', stroke: '#ff2a2a', 'stroke-width': 3, style: 'filter:drop-shadow(0 0 3px #f00)' }, svg);
        if (escaped) {
          const b = Math.asin(Math.min(1, n * Math.sin(rad(a))));
          svgEl('line', { x1: x, y1: y, x2: x + 60 * Math.sin(b), y2: y - 60 * Math.cos(b), stroke: '#ff2a2a', 'stroke-width': 3, opacity: .9 }, svg);
          const t = svgEl('text', { x: Math.min(x + 20, 300), y: 22, fill: '#ff6b7a', 'font-size': 14, 'font-weight': 700 }, svg); t.textContent = 'האור בורח החוצה!';
        }
        svgEl('rect', { x: 2, y: BOT - 16, width: 22, height: 12, rx: 3, fill: '#ccc' }, svg);
        $('#aa').textContent = a + '°'; $('#ab').textContent = escaped ? 0 : bounces;
        if (!escaped && bounces >= 3 && !asked) {
          asked = true; toast('האור כלוא בתוך הנוזל! 🎉', 'ok');
          askPics();
        }
      };
      const pic = type => {
        let p = '';
        if (type === 0) p = `<polyline points="10,80 50,30 90,80 130,30 170,80 190,55" fill="none" stroke="#ff2a2a" stroke-width="3"/>`;
        if (type === 1) p = `<polyline points="10,80 40,30 70,0" fill="none" stroke="#ff2a2a" stroke-width="3"/>`;
        if (type === 2) p = `<polyline points="10,80 50,30 110,95" fill="none" stroke="#ff2a2a" stroke-width="3"/><line x1="50" y1="30" x2="60" y2="0" stroke="#ff2a2a" stroke-width="3"/>`;
        return `<svg viewBox="0 0 200 100"><rect x="0" y="30" width="200" height="60" fill="#4da3ff33"/><line x1="0" y1="30" x2="200" y2="30" stroke="#cfe9ff"/>${p}</svg>`;
      };
      function askPics() {
        const q = $('#q');
        q.innerHTML = `<h3>לחצו על האיור שמתאר בצורה המדויקת ביותר את התקדמות הקרן</h3><p class="muted">שימו לב: תשובה שגויה תגרום להשהיה!</p><div class="pics"></div><div class="penalty" id="pen"></div>`;
        const order = [1, 0, 2]; let busy = false;
        order.forEach(t => {
          const b = document.createElement('button'); b.innerHTML = pic(t);
          b.onclick = () => {
            if (busy) return;
            if (t === 0) {
              b.classList.add('ok'); busy = true;
              modal('<h2>הצלחתם! 🎉</h2><p>ראיתם שלא כל זווית מאפשרת החזרה גמורה – רק מעבר ל<b>זווית הקריטית</b> האור נשאר כלוא בתוך המים.</p><p style="font-size:22px">המספר הראשון לכספת הכתומה: <b>1</b></p>', 'המשך', api.done);
            } else {
              b.classList.add('bad'); busy = true; let s = 5;
              const tick = () => { $('#pen').textContent = s > 0 ? `⏳ השהיה… ${s}` : ''; if (s-- > 0) setTimeout(tick, 1000); else { busy = false; b.classList.remove('bad'); } };
              tick();
            }
          };
          $('.pics', q).appendChild(b);
        });
      }
      $('#ag').oninput = draw; draw();
    },
    (r, api) => {
      r.innerHTML = `<h2>הספרה שבכיור</h2>
      <p>המספר הבא מסתתר בתחתית הכיור. השתמשו בבקבוק עם פנס ה־UV: מלאו אותו במים ופתחו את הפקק – זרם המים יוביל את האור!</p>
      <div class="stage"><svg viewBox="0 0 400 240" id="bt"></svg></div>
      <div class="row center" style="margin-top:10px"><button class="btn small" id="fill">💧 מלאו את הבקבוק</button><button class="btn small blue" id="open" disabled>🚰 פתחו את הפקק</button></div>
      <div id="q"></div>`;
      const svg = $('#bt');
      svgEl('rect', { x: 230, y: 190, width: 160, height: 40, rx: 8, fill: '#9aa3b5' }, svg);
      svgEl('rect', { x: 240, y: 196, width: 140, height: 28, rx: 6, fill: '#5d6577' }, svg);
      const four = svgEl('text', { x: 330, y: 218, 'font-size': 24, 'font-weight': 900, fill: '#5d6577', 'text-anchor': 'middle' }, svg); four.textContent = '4';
      svgEl('rect', { x: 40, y: 40, width: 80, height: 150, rx: 16, fill: '#111', stroke: '#444', 'stroke-width': 3 }, svg);
      const water = svgEl('rect', { x: 46, y: 184, width: 68, height: 0, fill: '#4da3ff88' }, svg);
      svgEl('rect', { x: 60, y: 24, width: 40, height: 18, rx: 4, fill: '#a64dff' }, svg);
      const uv = svgEl('text', { x: 80, y: 37, 'font-size': 11, 'text-anchor': 'middle', fill: '#fff', 'font-weight': 800 }, svg); uv.textContent = 'UV';
      svgEl('circle', { cx: 120, cy: 150, r: 4, fill: '#333' }, svg);
      const stream = svgEl('path', { d: 'M 120 150 Q 240 150 320 205', fill: 'none', stroke: '#c58bff', 'stroke-width': 7, 'stroke-linecap': 'round', opacity: 0, style: 'filter:drop-shadow(0 0 8px #a64dff);transition:opacity 1s' }, svg);
      $('#fill').onclick = () => {
        let h = 0; $('#fill').disabled = true;
        const f = () => { h += 4; water.setAttribute('height', h); water.setAttribute('y', 184 - h); if (h < 140) requestAnimationFrame(f); else $('#open').disabled = false; };
        f();
      };
      $('#open').onclick = () => {
        $('#open').disabled = true; stream.setAttribute('opacity', 1);
        setTimeout(() => {
          four.setAttribute('fill', '#e7b8ff'); four.style.filter = 'drop-shadow(0 0 8px #b34dff)';
          const q = $('#q'); q.innerHTML = '<h3>מהו המספר שהתקבל?</h3>';
          choiceQ(q, { options: ['1', '4', '7', '9'], correct: 1, onOk: () => { modal('<h2>גיליתם כיצד עובד סיב אופטי! 💡</h2><p>האור שעבר דרך חור הבקבוק נכלא בתוך זרם המים – בדיוק כמו באקווריום ובסיב אופטי. נוצרה <b>החזרה גמורה</b>, והאור עבר בתוך הזרם בלי לצאת ממנו.</p>', 'המשך', api.done); } });
        }, 1100);
      };
    },
    (r, api) => {
      r.innerHTML = `<h2>הלוח הפלואורסנטי</h2>
      <p>המספר האחרון נמצא בקצה הסיב האופטי. קודם בדקו איך הלוח עובד: <b>החזיקו לחוץ</b> על היד במשך כמה שניות כדי להאיר עליה ב־UV, ואז שחררו.</p>
      <div class="stage"><svg viewBox="0 0 400 200" id="fb"></svg></div>
      <div class="row center" style="margin-top:10px"><button class="btn small" id="uvb">🟣 החזיקו לחוץ להארה</button><button class="btn small blue" id="fib" disabled>🧵 הצמידו את קצה הסיב ללוח</button></div>
      <div id="q"></div>`;
      const svg = $('#fb');
      svgEl('rect', { x: 20, y: 20, width: 360, height: 160, rx: 10, fill: '#1d2a1d', stroke: '#3a4a3a', 'stroke-width': 3 }, svg);
      const glow = svgEl('text', { x: 130, y: 130, 'font-size': 90, 'text-anchor': 'middle', opacity: 0 }, svg); glow.textContent = '✋';
      glow.style.filter = 'drop-shadow(0 0 12px #7dff7d)';
      const hand = svgEl('text', { x: 130, y: 130, 'font-size': 90, 'text-anchor': 'middle' }, svg); hand.textContent = '✋';
      const seven = svgEl('text', { x: 300, y: 125, 'font-size': 70, 'font-weight': 900, 'text-anchor': 'middle', fill: '#9dff9d', opacity: 0 }, svg); seven.textContent = '7';
      seven.style.filter = 'drop-shadow(0 0 12px #7dff7d)';
      let t0 = 0, charged = false;
      const btn = $('#uvb');
      const down = e => { e.preventDefault(); t0 = Date.now(); svg.style.background = '#2a0a4a'; btn.textContent = '🟣 מאירים…'; };
      const up = () => {
        if (!t0) return; svg.style.background = '';
        const held = Date.now() - t0; t0 = 0; btn.textContent = '🟣 החזיקו לחוץ להארה';
        if (held < 1500) { toast('החזיקו קצת יותר זמן…', 'bad'); return; }
        hand.setAttribute('opacity', 0); glow.setAttribute('fill', '#9dff9d'); glow.style.color = '#9dff9d';
        glow.setAttribute('opacity', 1); glow.style.transition = 'opacity 6s'; setTimeout(() => glow.setAttribute('opacity', .15), 50);
        if (!charged) { charged = true; toast('הלוח "זוכר" את האור וזוהר! ✨', 'ok'); $('#fib').disabled = false; }
      };
      btn.addEventListener('pointerdown', down); btn.addEventListener('pointerup', up); btn.addEventListener('pointerleave', up);
      $('#fib').onclick = () => {
        $('#fib').disabled = true; seven.style.transition = 'opacity 1.5s'; seven.setAttribute('opacity', 1);
        const q = $('#q'); q.innerHTML = '<h3>מהו המספר?</h3>';
        choiceQ(q, { options: ['1', '4', '7', '8'], correct: 2, onOk: api.done });
      };
    },
    (r, api) => {
      r.innerHTML = `<h2>קוד הכספת הכתומה</h2><p>כל המספרים בידיים שלכם – באקווריום, בכיור ובקצה הסיב. פתחו את הכספת!</p>`;
      lock(r, { fields: [{}, {}, {}], answer: ['1', '4', '7'], onOpen: api.win });
    }
  ]
});

/* ===== משימה 6: שריג הנפיצה ===== */
M.push({
  id: 'm6', num: 6, icon: '🍫', title: 'משימת שריג הנפיצה', color: 'var(--pink)', lockName: 'הכספת הוורודה',
  topic: 'שריג נפיצה', strip: 'שריג נפיצה מפצל את האור הלבן לצבעים המרכיבים אותו', digits: [2, 4, 6, 3, 8],
  slides: [
    (r, api) => {
      r.innerHTML = `<h2>משימה 6 – שריג הנפיצה</h2>
      <p class="story">באגף מיוחד של "מגן אור" מייצרים שבבים בעלי תבנית נפיצה. הוכיחו שאתם מסוגלים לייצר תבנית כזו – לא על שבב, אלא על <b>שוקולד</b>! 🍫</p>
      <p>אם תצליחו להפוך שוקולד חום לשוקולד בשלל צבעי האור – תקבלו את קוד הכספת.</p>`;
      api.done();
    },
    (r, api) => {
      r.innerHTML = `<h2>מעבדת השוקולד</h2><p>בצעו את השלבים לפי הסדר:</p>
      <div class="choco" id="ch">🍫<div class="fog" id="fg"></div></div>
      <div class="steps" style="margin-top:12px" id="sp"></div><p id="msg" class="center muted"></p>`;
      const S = [['🔥 התיכו', 'השוקולד נמס בכורית האלומיניום…', '🫕'], ['🫗 שפכו על השריג', 'השוקולד נשפך על שריג הנפיצה…', '🟫'], ['〰️ נערו קלות', 'בועות האוויר יוצאות…', '🟫'], ['❄️ קררו בקרח יבש', 'השוקולד מתמצק במקרר המיוחד…', '🧊']];
      let k = 0;
      S.forEach((s, i) => {
        const b = document.createElement('button'); b.className = 'btn small' + (i ? '' : ''); b.textContent = s[0]; b.disabled = i > 0;
        b.onclick = () => {
          const ch = $('#ch'); $('#msg').textContent = s[1]; b.disabled = true;
          ch.firstChild.textContent = s[2];
          if (i === 3) { $('#fg').classList.add('on'); setTimeout(() => { $('#fg').classList.remove('on'); ch.classList.add('rainbow'); ch.firstChild.textContent = '✨'; $('#msg').textContent = 'וואו! השוקולד מפזר את האור לכל צבעי הקשת!'; api.done(); }, 2200); }
          else $$('#sp .btn')[i + 1].disabled = false;
          k++;
        };
        $('#sp').appendChild(b);
      });
    },
    (r, api) => {
      r.innerHTML = `<h2>הכספת הוורודה</h2><p>הראיתם למדריך את השוקולד "הצבעוני" – והוא לחש לכם את הקוד: <b style="font-size:24px;letter-spacing:4px">258</b></p>`;
      lock(r, { fields: [{}, {}, {}], answer: ['2', '5', '8'], onOpen: api.win });
    }
  ]
});

/* ---------- strip bar ---------- */
function renderBar() {
  $('#stripBar').innerHTML = M.map(m => `<span class="${state.strips[m.id] ? 'on' : ''}" style="${state.strips[m.id] ? `background:${m.color};color:${m.color}` : ''}" title="${m.title}"></span>`).join('');
}

/* ---------- screens ---------- */
function home() {
  renderBar();
  const n = Object.keys(state.strips).length;
  app.innerHTML = `
  <section class="card hero">
    <div class="big">🔐</div>
    <h1>חדר בריחה: מגן אור</h1>
    <p class="story" style="text-align:right">צוותים יקרים, נבחרתם לקחת חלק באתגר מסווג במסגרת פרויקט <b>LaserShield-X</b> – "מגן אור". מאחורי דפנות הפלדה של הכספת מסתתר צופן, ורק צוות חד מחשבה ומדויק יצליח לחשוף אותו.<br><br>
    כל חידה שתפצחו תעניק לכם <b>רצועה</b> שתעזור לחשוף ספרה אחת מקוד הכספת. שימו לב – רק אם תניחו את הרצועות במקום המדויק על הלוח, ייחשף הרצף האמיתי!</p>
    <p class="muted">אפשר לפתור את המשימות בכל סדר. נאספו ${n} מתוך ${M.length} רצועות.</p>
    ${n === M.length ? '<p><button class="btn" id="final">🏁 לכספת הסופית</button></p>' : ''}
  </section>
  <div class="grid-missions">${M.map(m => `
    <button class="mission ${state.strips[m.id] ? 'done' : ''}" style="--mc:${m.color}" data-m="${m.id}">
      <span class="num">${m.num}</span><div class="ico">${m.icon}</div>
      <h3>${m.title}</h3><p class="muted"><span class="lockico"></span>${m.lockName}</p>
    </button>`).join('')}</div>
  <p class="center row" style="margin-top:20px">
    ${n ? '<button class="skip" id="reset">איפוס המשחק</button>' : ''}
    <button class="skip" id="demo">מצב הדגמה: לאסוף את כל הרצועות</button>
  </p>`;
  $$('[data-m]').forEach(b => b.onclick = () => play(M.find(m => m.id === b.dataset.m)));
  const f = $('#final'); if (f) f.onclick = finalBoard;
  const rs = $('#reset'); if (rs) rs.onclick = () => { state = { strips: {} }; save(); home(); };
  $('#demo').onclick = () => { M.forEach(m => state.strips[m.id] = 1); save(); home(); };
  scrollTo(0, 0);
}

function play(m, idx = 0) {
  renderBar();
  app.innerHTML = `<section class="card" style="--mc:${m.color}">
    <div class="slide-head"><span class="pill">${m.icon} משימה ${m.num}</span><div class="dots">${m.slides.map((_, i) => `<i class="${i <= idx ? 'on' : ''}"></i>`).join('')}</div></div>
    <div id="slide"></div>
    <div class="nav"><button class="btn ghost small" id="back">→ ${idx ? 'הקודם' : 'למשימות'}</button><button class="btn" id="next" disabled>הבא ←</button></div>
    <p class="center"><button class="skip" id="skip">דילוג על השלב (להדגמה)</button></p>
  </section>`;
  const next = $('#next'), last = idx === m.slides.length - 1;
  if (last) next.classList.add('hidden');
  const api = {
    done: () => { next.disabled = false; },
    next: () => play(m, idx + 1),
    win: () => {
      state.strips[m.id] = 1; save(); renderBar(); confetti();
      modal(`<h2>${m.lockName} נפתחה! 🎉</h2><p>מצאתם בתוכה רצועה:</p>${stripHTML(m)}<p class="muted">שמרו אותה – תצטרכו אותה לכספת הסופית.</p>`, 'חזרה למשימות', home);
    }
  };
  next.onclick = api.next;
  $('#back').onclick = () => idx ? play(m, idx - 1) : home();
  $('#skip').onclick = () => last ? api.win() : api.next();
  m.slides[idx]($('#slide'), api);
  scrollTo(0, 0);
}

function finalBoard() {
  renderBar();
  const order = M.map(m => m.id);
  const placed = {}; let sel = null;
  const WIN = 2; // מיקום החלון בכל רצועה
  app.innerHTML = `<section class="card">
    <h2>🏁 הכספת הסופית</h2>
    <p>הניחו כל רצועה בשורה שמתאימה לנושא שלה: בחרו רצועה ואז לחצו על השורה. כשכל הרצועות יונחו נכון – <b>החלון</b> יחשוף את הקוד!</p>
    <div class="board" id="bd"></div>
    <h3>הרצועות שלכם</h3><div class="bank" id="bk"></div>
    <div id="lk"></div>
  </section>`;
  const shuffled = [3, 0, 5, 1, 4, 2].map(i => M[i]);
  const draw = () => {
    const allOk = order.every(id => placed[id] === id);
    $('#bd').innerHTML = M.map(m => {
      const s = placed[m.id] && M.find(x => x.id === placed[m.id]);
      const digits = s ? s.digits.map((d, i) => allOk && i === WIN ? `<span class="win">${d}</span>` : d).join(' ') : '';
      return `<div class="slot ${allOk ? 'ok' : ''}" data-s="${m.id}"><span class="lab">${m.num}. ${m.topic}</span>${s ? `<div class="strip" style="--sc:${s.color}"><span>${s.strip}</span><span class="digits">${digits}</span></div>` : '<span class="muted">— לחצו כאן להנחת רצועה —</span>'}</div>`;
    }).join('');
    $('#bk').innerHTML = shuffled.filter(m => !Object.values(placed).includes(m.id)).map(m =>
      `<div class="strip ${sel === m.id ? 'sel' : ''}" style="--sc:${m.color}" data-k="${m.id}"><span>${m.strip}</span><span class="digits">${m.digits.join(' ')}</span></div>`).join('') || '<p class="muted">כל הרצועות על הלוח.</p>';
    $$('[data-k]').forEach(e => e.onclick = () => { sel = e.dataset.k; draw(); });
    $$('[data-s]').forEach(e => e.onclick = () => {
      const s = e.dataset.s;
      if (placed[s]) { delete placed[s]; draw(); return; }
      if (!sel) { toast('קודם בחרו רצועה מלמטה'); return; }
      placed[s] = sel; sel = null; draw();
    });
    if (Object.keys(placed).length === M.length && !allOk) toast('משהו לא במקום… לחצו על שורה כדי להחזיר רצועה', 'bad');
    if (allOk && !$('#lk').childElementCount) {
      toast('החלון נפתח! קראו את הספרות המודגשות מלמעלה למטה', 'ok');
      lock($('#lk'), { icon: '🏦', title: 'קוד הכספת הסופית', fields: M.map(() => ({})), answer: M.map(m => String(m.digits[WIN])), onOpen: () => {
        confetti(); setTimeout(confetti, 800);
        modal('<div style="font-size:70px">🏆</div><h2>פיצחתם את מגן אור!</h2><p>הוכחתם חדות מחשבה ודיוק: החזרה, שבירה, חוק סנל, נפיצה, צבעי האור והחזרה גמורה – הכל בידיים שלכם.</p>', 'חזרה למסך הבית', home);
      } });
    }
  };
  draw(); scrollTo(0, 0);
}

$('#homeBtn').onclick = home;
home();
})();
