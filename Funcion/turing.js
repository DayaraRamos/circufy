// ============================================================
// Circufy — Máquina de Turing
// Archivo: turing.js
// ============================================================

// ── BG PARTICLES ─────────────────────────────────────────────
const bgc = document.getElementById('bgc');
const bgx = bgc.getContext('2d');
bgc.width = window.innerWidth; bgc.height = window.innerHeight;
const bpts = Array.from({length:40},()=>({x:Math.random()*bgc.width,y:Math.random()*bgc.height,vx:(Math.random()-.5)*.2,vy:(Math.random()-.5)*.2,r:Math.random()*.7+.3}));
(function bl(){
  bgx.clearRect(0,0,bgc.width,bgc.height);
  bpts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>bgc.width)p.vx*=-1;if(p.y<0||p.y>bgc.height)p.vy*=-1;bgx.beginPath();bgx.arc(p.x,p.y,p.r,0,Math.PI*2);bgx.fillStyle='rgba(168,85,247,0.25)';bgx.fill();});
  for(let i=0;i<bpts.length;i++)for(let j=i+1;j<bpts.length;j++){const d=Math.hypot(bpts[i].x-bpts[j].x,bpts[i].y-bpts[j].y);if(d<90){bgx.strokeStyle=`rgba(168,85,247,${(1-d/90)*.04})`;bgx.lineWidth=.5;bgx.beginPath();bgx.moveTo(bpts[i].x,bpts[i].y);bgx.lineTo(bpts[j].x,bpts[j].y);bgx.stroke();}}
  requestAnimationFrame(bl);
})();
window.addEventListener('resize',()=>{bgc.width=window.innerWidth;bgc.height=window.innerHeight;});

// ── STATE ────────────────────────────────────────────────────
let states = [];       // {id, name, x, y, isInitial, isFinal}
let transitions = [];  // {from, read, write, move, to}
let nextStateId = 0;

// Ejecución
let tape = [];
let head = 0;
let curState = null;
let stepNum = 0;
let execHistory = []; // para paso atrás
let execRunning = false;
let autoTimer = null;
let execDone = false;

// Diagrama
let dtool = 'state';
let dragState = null;
let dox = 0, doy = 0;
let transFrom = null;   // estado origen al crear transición
let selectedMove = 'L';
let activeTransIdx = -1;

// ── DIAGRAM CANVAS ───────────────────────────────────────────
const dc = document.getElementById('diagramCanvas');
const dctx = dc.getContext('2d');

function resizeDC() {
  const w = dc.parentElement.clientWidth;
  dc.width = w > 0 ? w : 800;
  dc.height = 400;
}
resizeDC();
window.addEventListener('resize', resizeDC);

// Interacción con el canvas del diagrama
dc.addEventListener('mousedown', e => {
  const p = dcPos(e);
  dcDown(p.x, p.y);
});
dc.addEventListener('mousemove', e => {
  const p = dcPos(e);
  dcMove(p.x, p.y);
});
dc.addEventListener('mouseup', e => dcUp());
dc.addEventListener('dblclick', e => {
  const p = dcPos(e);
  dcDbl(p.x, p.y);
});
dc.addEventListener('touchstart', e => { e.preventDefault(); const p = dcTPos(e); dcDown(p.x,p.y); }, {passive:false});
dc.addEventListener('touchmove', e => { e.preventDefault(); const p = dcTPos(e); dcMove(p.x,p.y); }, {passive:false});
dc.addEventListener('touchend', e => { e.preventDefault(); dcUp(); }, {passive:false});

function dcPos(e) {
  const r = dc.getBoundingClientRect();
  const sx = dc.width / r.width, sy = dc.height / r.height;
  return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
}
function dcTPos(e) {
  const r = dc.getBoundingClientRect();
  const t = e.touches[0];
  const sx = dc.width / r.width, sy = dc.height / r.height;
  return { x: (t.clientX - r.left) * sx, y: (t.clientY - r.top) * sy };
}

function stateAt(x, y) {
  for (let i = states.length - 1; i >= 0; i--) {
    const s = states[i];
    if (Math.hypot(x - s.x, y - s.y) < 26) return s;
  }
  return null;
}

function dcDown(x, y) {
  if (dtool === 'state') {
    const hit = stateAt(x, y);
    if (!hit) {
      const name = 'q' + nextStateId;           // ← Cambiado
      states.push({ 
        id: name, 
        name: name, 
        x: x, 
        y: y, 
        isInitial: states.length === 0, 
        isFinal: false 
      });
      nextStateId++;                            // ← Incrementamos aquí
      document.getElementById('diagramHint').classList.add('hidden');
      updateStateSelects();
      renderDiagram();
      showToast('Estado ' + name + ' creado', 'info');
    }
  } else if (dtool === 'trans') {
    const hit = stateAt(x, y);
    if (hit) {
      if (!transFrom) {
        transFrom = hit;
        renderDiagram();
        showToast('Selecciona el estado destino','info');
      } else {
        // Asignar la transición automáticamente usando el formulario
        document.getElementById('fFrom').value = transFrom.id;
        document.getElementById('fTo').value = hit.id;
        transFrom = null;
        renderDiagram();
        showToast('Estados seleccionados — define la transición en el panel derecho','info');
      }
    }
  } else if (dtool === 'move') {
    const hit = stateAt(x, y);
    if (hit) { dragState = hit; dox = x - hit.x; doy = y - hit.y; dc.style.cursor = 'grabbing'; }
  } else if (dtool === 'del') {
    const hit = stateAt(x, y);
    if (hit) {
      states = states.filter(s => s.id !== hit.id);
      transitions = transitions.filter(t => t.from !== hit.id && t.to !== hit.id);
      updateStateSelects();
      renderTransList();
      renderDeltaTable();
      renderDiagram();
      showToast('Estado ' + hit.id + ' eliminado','bad');
    } else {
      // Eliminar transición cercana (aproximado por clic)
      const idx = findTransitionNear(x, y);
      if (idx >= 0) {
        transitions.splice(idx, 1);
        renderTransList();
        renderDeltaTable();
        renderDiagram();
        showToast('Transición eliminada','bad');
      }
    }
  }
}

function dcMove(x, y) {
  if (dragState) {
    dragState.x = x - dox;
    dragState.y = y - doy;
    renderDiagram();
  }
  if (dtool === 'move' && !dragState) {
    dc.style.cursor = stateAt(x, y) ? 'grab' : 'default';
  }
}

function dcUp() {
  if (dragState) { dragState = null; dc.style.cursor = dtool === 'move' ? 'default' : 'crosshair'; }
}

function dcDbl(x, y) {
  const hit = stateAt(x, y);
  if (!hit) return;
  // Ciclo: normal → inicial → final → inicial+final → normal
  if (!hit.isInitial && !hit.isFinal) {
    // Marcar como inicial
    states.forEach(s => s.isInitial = false);
    hit.isInitial = true;
    showToast(hit.id + ' marcado como INICIAL','ok');
  } else if (hit.isInitial && !hit.isFinal) {
    hit.isFinal = true;
    showToast(hit.id + ' marcado como FINAL','ok');
  } else if (hit.isFinal) {
    hit.isInitial = false;
    hit.isFinal = false;
    showToast(hit.id + ' marcado como normal','info');
  }
  renderDiagram();
}

function findTransitionNear(x, y) {
  // Simplificado: buscar por proximidad al punto medio de la curva
  for (let i = 0; i < transitions.length; i++) {
    const t = transitions[i];
    const from = states.find(s => s.id === t.from);
    const to = states.find(s => s.id === t.to);
    if (!from || !to) continue;
    const mx = (from.x + to.x) / 2;
    const my = (from.y + to.y) / 2;
    if (Math.hypot(x - mx, y - my) < 25) return i;
  }
  return -1;
}

// ── DIAGRAM RENDER ───────────────────────────────────────────
function renderDiagram() {
  const W = dc.width, H = dc.height;
  dctx.clearRect(0, 0, W, H);

  // Grid
  dctx.strokeStyle = 'rgba(168,85,247,0.04)'; dctx.lineWidth = 1;
  for (let x = 0; x < W; x += 32) { dctx.beginPath(); dctx.moveTo(x,0); dctx.lineTo(x,H); dctx.stroke(); }
  for (let y = 0; y < H; y += 32) { dctx.beginPath(); dctx.moveTo(0,y); dctx.lineTo(W,y); dctx.stroke(); }

  // Transiciones
  transitions.forEach((t, idx) => {
    const from = states.find(s => s.id === t.from);
    const to   = states.find(s => s.id === t.to);
    if (!from || !to) return;
    const isActive = (idx === activeTransIdx);
    drawTransitionArrow(dctx, from, to, t, isActive);
  });

  // Flecha temporal al crear transición
  if (transFrom) {
    dctx.strokeStyle = 'rgba(255,230,0,0.5)'; dctx.lineWidth = 2; dctx.setLineDash([6,4]);
    dctx.beginPath(); dctx.arc(transFrom.x, transFrom.y, 26, 0, Math.PI * 2);
    dctx.stroke(); dctx.setLineDash([]);
  }

  // Estados
  states.forEach(s => drawState(dctx, s, s.id === curState));
}

function drawTransitionArrow(ctx, from, to, t, isActive) {
  const isSelf = from.id === to.id;
  const col = isActive ? '#ffe600' : 'rgba(0,220,255,0.6)';
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = isActive ? 2.5 : 1.5;
  ctx.shadowColor = isActive ? '#ffe600' : 'transparent'; ctx.shadowBlur = isActive ? 12 : 0;

  const label = `${t.read}/${t.write},${t.move}`;

  if (isSelf) {
    // Auto-bucle
    const lx = from.x, ly = from.y - 58;
    ctx.beginPath();
    ctx.arc(from.x, from.y - 34, 24, 0, Math.PI * 2);
    ctx.stroke(); ctx.shadowBlur = 0;
    // Etiqueta
    ctx.fillStyle = isActive ? '#ffe600' : 'rgba(0,220,255,0.9)';
    ctx.font = 'bold 10px Share Tech Mono,monospace'; ctx.textAlign = 'center';
    ctx.fillText(label, lx, ly - 8);
    return;
  }

  // Flecha entre dos estados distintos
  const dx = to.x - from.x, dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  const ux = dx / dist, uy = dy / dist;

  // Curva perpendicular si hay transición inversa
  const hasReverse = transitions.some(tr => tr.from === to.id && tr.to === from.id);
  const offset = hasReverse ? 22 : 0;
  const px = -uy * offset, py = ux * offset;

  const sx = from.x + ux * 26, sy = from.y + uy * 26;
  const ex = to.x - ux * 26,   ey = to.y - uy * 26;
  const cx = (sx + ex) / 2 + px, cy = (sy + ey) / 2 + py;

  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.quadraticCurveTo(cx, cy, ex, ey);
  ctx.stroke(); ctx.shadowBlur = 0;

  // Punta de flecha
  const ang = Math.atan2(ey - cy, ex - cx);
  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.lineTo(ex - 10 * Math.cos(ang - 0.4), ey - 10 * Math.sin(ang - 0.4));
  ctx.lineTo(ex - 10 * Math.cos(ang + 0.4), ey - 10 * Math.sin(ang + 0.4));
  ctx.closePath(); ctx.fill();

  // Etiqueta
  ctx.fillStyle = isActive ? '#ffe600' : 'rgba(0,220,255,0.9)';
  ctx.font = 'bold 10px Share Tech Mono,monospace'; ctx.textAlign = 'center';
  ctx.fillText(label, cx, cy - 8);
}

function drawState(ctx, s, isActive) {
  const R = 24;
  const col = s.isFinal ? '#ffe600' : (s.isInitial ? '#00ffaa' : '#00dcff');
  const glowCol = isActive ? '#a855f7' : col;

  ctx.strokeStyle = glowCol; ctx.lineWidth = isActive ? 3 : 2;
  ctx.fillStyle = isActive ? 'rgba(168,85,247,0.15)' : col + '12';
  ctx.shadowColor = glowCol; ctx.shadowBlur = isActive ? 24 : 8;

  ctx.beginPath(); ctx.arc(s.x, s.y, R, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;

  // Doble círculo para estado final
  if (s.isFinal) {
    ctx.strokeStyle = '#ffe600'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(s.x, s.y, R - 5, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Flecha de estado inicial
  if (s.isInitial) {
    ctx.strokeStyle = '#00ffaa'; ctx.lineWidth = 2; ctx.fillStyle = '#00ffaa';
    ctx.beginPath(); ctx.moveTo(s.x - R - 20, s.y); ctx.lineTo(s.x - R, s.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s.x - R, s.y); ctx.lineTo(s.x - R - 8, s.y - 5); ctx.lineTo(s.x - R - 8, s.y + 5); ctx.closePath(); ctx.fill();
  }

  // Nombre
  ctx.fillStyle = isActive ? '#a855f7' : col;
  ctx.font = 'bold 11px Orbitron,monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = isActive ? '#a855f7' : col; ctx.shadowBlur = isActive ? 16 : 0;
  ctx.fillText(s.name, s.x, s.y); ctx.shadowBlur = 0; ctx.textBaseline = 'alphabetic';
}

// Loop de renderizado del diagrama
(function dloop(){ requestAnimationFrame(dloop); renderDiagram(); })();

// ── TOOL SELECTION ───────────────────────────────────────────
function setDTool(tool) {
  dtool = tool; transFrom = null;
  document.querySelectorAll('.dtool-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('dtool-' + tool)?.classList.add('active');
  const cursors = { state:'crosshair', trans:'pointer', move:'default', del:'not-allowed' };
  dc.style.cursor = cursors[tool] || 'default';
}

// ── STATE SELECTS ────────────────────────────────────────────
function updateStateSelects() {
  const selIds = ['fFrom', 'fTo'];
  selIds.forEach(id => {
    const sel = document.getElementById(id);
    const prev = sel.value;
    sel.innerHTML = states.map(s => `<option value="${s.id}">${s.id}${s.isFinal?' ✓':''}</option>`).join('');
    if (states.find(s => s.id === prev)) sel.value = prev;
  });
  document.getElementById('transCount').textContent = transitions.length;
}

// ── MOVE SELECTION ───────────────────────────────────────────
function setMove(m) {
  selectedMove = m;
  document.getElementById('moveL').classList.toggle('active', m === 'L');
  document.getElementById('moveR').classList.toggle('active', m === 'R');
}

// ── ADD TRANSITION ───────────────────────────────────────────
function addTransition() {
  if (states.length < 1) { showToast('Crea al menos 1 estado primero','bad'); return; }
  const from  = document.getElementById('fFrom').value;
  const read  = document.getElementById('fRead').value;
  const write = document.getElementById('fWrite').value;
  const move  = selectedMove;
  const to    = document.getElementById('fTo').value;

  if (!from || !to) { showToast('Selecciona estados válidos','bad'); return; }

  // Verificar si ya existe la misma regla
  const exists = transitions.find(t => t.from === from && t.read === read);
  if (exists) { showToast('Ya existe una transición desde ' + from + ' leyendo ' + read,'bad'); return; }

  transitions.push({ from, read, write, move, to });
  renderTransList();
  renderDeltaTable();
  updateStateSelects();
  showToast('✓ Transición agregada: ' + from + ' → ' + to,'ok');
}

// ── RENDER TRANSITION LIST ───────────────────────────────────
function renderTransList() {
  const list = document.getElementById('transList');
  document.getElementById('transCount').textContent = transitions.length;
  if (!transitions.length) {
    list.innerHTML = '<div class="trans-empty">No hay transiciones. Agrega estados y define las reglas.</div>';
    return;
  }
  list.innerHTML = transitions.map((t, i) => `
    <div class="trans-item${i === activeTransIdx ? ' active-trans' : ''}" id="titem-${i}">
      <span class="ti-from">${t.from}</span>
      <span class="ti-arrow">→</span>
      <span class="ti-rule">[${t.read}] wr:${t.write} mv:${t.move} nxt:${t.to}</span>
      <button class="ti-del" onclick="deleteTransition(${i})">✕</button>
    </div>`).join('');
}

function deleteTransition(i) {
  transitions.splice(i, 1);
  renderTransList();
  renderDeltaTable();
}

// ── DELTA TABLE ──────────────────────────────────────────────
function renderDeltaTable() {
  const wrap = document.getElementById('deltaTableWrap');
  if (!states.length || !transitions.length) {
    wrap.innerHTML = '<div class="trans-empty">Sin transiciones definidas.</div>';
    return;
  }
  const symbols = [...new Set(transitions.map(t => t.read))].sort();
  const header = `<tr><th>δ</th>${symbols.map(s=>`<th>${s}</th>`).join('')}</tr>`;
  const rows = states.map(s => {
    const cells = symbols.map(sym => {
      const t = transitions.find(tr => tr.from === s.id && tr.read === sym);
      const isAct = t && t.from === curState && sym === (tape[head] || 'B');
      return `<td class="${t?'defined':''}${isAct?' active-cell':''}">${t?`(${t.write},${t.move},${t.to})`:'—'}</td>`;
    });
    return `<tr><td style="color:var(--neon)">${s.id}</td>${cells.join('')}</tr>`;
  });
  wrap.innerHTML = `<table class="delta-tt"><thead>${header}</thead><tbody>${rows.join('')}</tbody></table>`;
}

// ── TAPE RENDER ──────────────────────────────────────────────
function renderTape() {
  const row  = document.getElementById('tapeRow');
  const hrow = document.getElementById('tapeHeadRow');
  if (!tape.length) { row.innerHTML = '<span style="color:var(--dim2);font-size:0.65rem;padding:14px">Sin cinta. Ingresa una cadena y pulsa INICIAR.</span>'; hrow.innerHTML=''; return; }

  // Mostrar ventana de celdas alrededor del cabezal
  const start = Math.max(0, head - 8);
  const end   = Math.min(tape.length - 1, head + 8);

  let cells = '', heads = '';
  for (let i = start; i <= end; i++) {
    const sym = tape[i] || 'B';
    const isH = i === head;
    const cls = isH ? 'tape-cell active' : `tape-cell v${sym === 'B' ? 'blank' : sym}`;
    cells += `<div class="${cls}">${sym === 'B' ? '□' : sym}</div>`;
    heads += `<div class="tape-head-cell${isH?' active':''}">${isH ? '▲' : ''}</div>`;
  }
  row.innerHTML = cells;
  hrow.innerHTML = heads;

  // Stats
  document.getElementById('tsCurState').textContent = curState || '—';
  document.getElementById('tsStep').textContent = stepNum;
  document.getElementById('tsSymbol').textContent = tape[head] || 'B';
}

// ── EXECUTION ────────────────────────────────────────────────
function validateInput(el) {
  el.value = el.value.replace(/[^01]/g, '');
  el.classList.toggle('error', false);
}

function initExecution() {
  const str = document.getElementById('inputString').value.trim();
  if (!str && str !== '0' && str !== '1') {
    if (str.length === 0) { showToast('Ingresa una cadena','bad'); return; }
  }
  if (!/^[01]*$/.test(str)) { showToast('Solo se permiten 0 y 1','bad'); return; }
  if (!states.length) { showToast('Diseña la máquina primero','bad'); return; }
  const init = states.find(s => s.isInitial);
  if (!init) { showToast('Define un estado inicial (doble clic en un estado)','bad'); return; }
  if (!transitions.length) { showToast('Agrega transiciones primero','bad'); return; }

  // Preparar cinta
  tape = str.length ? str.split('') : ['B'];
  // Agregar blancos a izquierda y derecha
  tape = ['B','B',...tape,'B','B'];
  head = 2; // apuntar al primer símbolo real
  curState = init.id;
  stepNum = 0;
  execHistory = [];
  execDone = false;
  activeTransIdx = -1;

  clearConsole();
  log('SYS', `Iniciando con cadena: "${str || 'ε'}" · Estado inicial: ${init.id}`, 'info');
  document.getElementById('resultBanner').className = 'result-banner hidden';
  setNavStatus('running', 'EJECUTANDO');

  renderTape();
  renderDeltaTable();
  renderTransList();
  enableExecBtns(true);
  showToast('▶ Ejecución iniciada — usa PASO o EJECUTAR','info');
}

function enableExecBtns(enabled) {
  document.getElementById('btnStep').disabled = !enabled;
  document.getElementById('btnRun').disabled  = !enabled;
  document.getElementById('btnStepBack').disabled = true;
}

function getCurrentTransition() {
  const sym = tape[head] || 'B';
  return transitions.findIndex(t => t.from === curState && t.read === sym);
}

function stepForward() {
  if (execDone) { showToast('La ejecución ya terminó. Presiona ↺ RESET','info'); return; }
  const tidx = getCurrentTransition();
  if (tidx < 0) {
    // Sin transición → RECHAZADA
    const isFinal = states.find(s => s.id === curState)?.isFinal;
    if (isFinal) {
      finalize(true);
    } else {
      log(stepNum, `Sin transición desde ${curState} leyendo "${tape[head]||'B'}" → RECHAZADA`, 'error');
      finalize(false);
    }
    return;
  }

  // Guardar snapshot para "atrás"
  execHistory.push({ tape: [...tape], head, curState, stepNum, activeTransIdx, tapeClone: JSON.stringify(tape) });

  const t = transitions[tidx];
  const prevSym = tape[head] || 'B';

  // Aplicar transición
  tape[head] = t.write;
  const prevHead = head;
  head += t.move === 'R' ? 1 : -1;

  // Expandir cinta si es necesario
  if (head < 0) { tape.unshift('B'); head = 0; }
  if (head >= tape.length) tape.push('B');

  const prevState = curState;
  curState = t.to;
  stepNum++;
  activeTransIdx = tidx;

  log(stepNum, `${prevState} · lee "${prevSym}" → escribe "${t.write}" · mueve ${t.move} → ${t.to}`, 'transition');

  renderTape();
  renderDeltaTable();
  renderTransList();
  document.getElementById('tsAction').textContent = `${t.write} / ${t.move}`;
  document.getElementById('btnStepBack').disabled = false;

  // Verificar si llegamos a estado final sin más transiciones
  const finalState = states.find(s => s.id === curState);
  if (finalState?.isFinal) {
    const nextTrans = transitions.find(tr => tr.from === curState && tr.read === (tape[head] || 'B'));
    if (!nextTrans) {
      setTimeout(() => finalize(true), 200);
    }
  }
}

function stepBack() {
  if (!execHistory.length) return;
  const snap = execHistory.pop();
  tape = JSON.parse(snap.tapeClone);
  head = snap.head;
  curState = snap.curState;
  stepNum = snap.stepNum;
  activeTransIdx = snap.activeTransIdx;
  execDone = false;
  document.getElementById('resultBanner').className = 'result-banner hidden';
  setNavStatus('running', 'EJECUTANDO');
  renderTape();
  renderDeltaTable();
  renderTransList();
  if (!execHistory.length) document.getElementById('btnStepBack').disabled = true;
  log('←', 'Paso deshecho', 'info');
}

function runAll() {
  if (execDone) { showToast('Reinicia primero','info'); return; }
  clearAutoTimer();
  const speed = parseInt(document.getElementById('speedRange').value);
  const delay = Math.max(80, 600 - speed * 55);

  function tick() {
    if (execDone) return;
    const tidx = getCurrentTransition();
    if (tidx < 0) {
      const isFinal = states.find(s => s.id === curState)?.isFinal;
      finalize(isFinal);
      return;
    }
    stepForward();
    if (!execDone && stepNum < 500) autoTimer = setTimeout(tick, delay);
    else if (stepNum >= 500) { log('SYS','Límite de 500 pasos alcanzado — posible bucle infinito','error'); finalize(false); }
  }
  tick();
}

function finalize(accepted) {
  execDone = true;
  clearAutoTimer();
  const banner = document.getElementById('resultBanner');
  if (accepted) {
    banner.textContent = '✅ CADENA ACEPTADA';
    banner.className = 'result-banner accepted';
    log('FIN', '✅ CADENA ACEPTADA — estado final: ' + curState, 'ok');
    setNavStatus('accepted', 'ACEPTADA');
    showToast('✅ Cadena ACEPTADA','ok');
  } else {
    banner.textContent = '❌ CADENA RECHAZADA';
    banner.className = 'result-banner rejected';
    log('FIN', '❌ CADENA RECHAZADA — estado: ' + curState, 'error');
    setNavStatus('rejected', 'RECHAZADA');
    showToast('❌ Cadena RECHAZADA','bad');
  }
  document.getElementById('btnStep').disabled = true;
  document.getElementById('btnRun').disabled  = true;
}

function resetExec() {
  clearAutoTimer();
  tape = [];
  head = 0;
  curState = null;
  stepNum = 0;
  execHistory = [];
  execDone = false;
  activeTransIdx = -1;
  renderTape();
  renderDeltaTable();
  renderTransList();
  document.getElementById('resultBanner').className = 'result-banner hidden';
  document.getElementById('tsAction').textContent = '—';
  document.getElementById('tsSymbol').textContent = '—';
  document.getElementById('tsCurState').textContent = '—';
  document.getElementById('tsStep').textContent = '0';
  enableExecBtns(false);
  setNavStatus('idle', 'LISTO');
}

function clearAutoTimer() {
  if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
}

// ── SPEED LABEL ───────────────────────────────────────────────
document.getElementById('speedRange').addEventListener('input', function() {
  document.getElementById('speedLabel').textContent = this.value;
});

// ── NAV STATUS ───────────────────────────────────────────────
function setNavStatus(type, text) {
  const dot = document.querySelector('.status-dot');
  dot.className = 'status-dot ' + type;
  document.getElementById('statusText').textContent = text;
}

// ── CONSOLE ──────────────────────────────────────────────────
function log(step, msg, type = 'info') {
  const wrap = document.getElementById('consoleWrap');
  const div = document.createElement('div');
  div.className = 'console-line ' + type;
  div.innerHTML = `<span class="cl-step">${String(step).padStart(3,'0')}</span><span class="cl-msg">${msg}</span>`;
  wrap.appendChild(div);
  wrap.scrollTop = wrap.scrollHeight;
}

function clearConsole() {
  document.getElementById('consoleWrap').innerHTML =
    '<div class="console-line welcome"><span class="cl-step">SYS</span><span class="cl-msg">Consola limpiada.</span></div>';
}

// ── TOAST ────────────────────────────────────────────────────
let toastT;
function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `show ${type}`;
  clearTimeout(toastT);
  toastT = setTimeout(() => t.className = '', 2600);
}

// ── PRESETS ──────────────────────────────────────────────────
function loadPreset(name) {
  resetExec();
  states = [];
  transitions = [];
  nextStateId = 0;
  activeTransIdx = -1;

  if (name === 'equal01') {
    // L = { 0^n 1^n | n >= 1 }
    states = [
      { id:'q0', name:'q0', x:80,  y:200, isInitial:true,  isFinal:false },
      { id:'q1', name:'q1', x:240, y:200, isInitial:false, isFinal:false },
      { id:'q2', name:'q2', x:400, y:200, isInitial:false, isFinal:false },
      { id:'q3', name:'q3', x:560, y:200, isInitial:false, isFinal:false },
      { id:'qf', name:'qf', x:560, y:80,  isInitial:false, isFinal:true  },
    ];
    stateId = 5;
    transitions = [
      { from:'q0', read:'0', write:'X', move:'R', to:'q1' },
      { from:'q1', read:'0', write:'0', move:'R', to:'q1' },
      { from:'q1', read:'Y', write:'Y', move:'R', to:'q1' },
      { from:'q1', read:'1', write:'Y', move:'L', to:'q2' },
      { from:'q2', read:'0', write:'0', move:'L', to:'q2' },
      { from:'q2', read:'Y', write:'Y', move:'L', to:'q2' },
      { from:'q2', read:'X', write:'X', move:'R', to:'q0' },
      { from:'q0', read:'Y', write:'Y', move:'R', to:'q3' },
      { from:'q3', read:'Y', write:'Y', move:'R', to:'q3' },
      { from:'q3', read:'B', write:'B', move:'R', to:'qf' },
    ];
    document.getElementById('inputString').value = '0011';
    showToast('Cargado: 0ⁿ1ⁿ — prueba con "0011"','ok');

  } else if (name === 'palindrome') {
    // Palíndromo sobre {0,1}
    states = [
      { id:'q0', name:'q0', x:80,  y:200, isInitial:true,  isFinal:false },
      { id:'q1', name:'q1', x:240, y:120, isInitial:false, isFinal:false },
      { id:'q2', name:'q2', x:400, y:120, isInitial:false, isFinal:false },
      { id:'q3', name:'q3', x:240, y:280, isInitial:false, isFinal:false },
      { id:'q4', name:'q4', x:400, y:280, isInitial:false, isFinal:false },
      { id:'q5', name:'q5', x:560, y:200, isInitial:false, isFinal:false },
      { id:'qf', name:'qf', x:560, y:80,  isInitial:false, isFinal:true  },
    ];
    stateId = 7;
    transitions = [
      { from:'q0', read:'0', write:'X', move:'R', to:'q1' },
      { from:'q0', read:'1', write:'Y', move:'R', to:'q3' },
      { from:'q0', read:'X', write:'X', move:'R', to:'q5' },
      { from:'q0', read:'Y', write:'Y', move:'R', to:'q5' },
      { from:'q0', read:'B', write:'B', move:'R', to:'qf' },
      { from:'q1', read:'0', write:'0', move:'R', to:'q1' },
      { from:'q1', read:'1', write:'1', move:'R', to:'q1' },
      { from:'q1', read:'X', write:'X', move:'R', to:'q1' },
      { from:'q1', read:'Y', write:'Y', move:'R', to:'q1' },
      { from:'q1', read:'B', write:'B', move:'L', to:'q2' },
      { from:'q2', read:'0', write:'X', move:'L', to:'q5' },
      { from:'q2', read:'X', write:'X', move:'L', to:'q5' },
      { from:'q3', read:'0', write:'0', move:'R', to:'q3' },
      { from:'q3', read:'1', write:'1', move:'R', to:'q3' },
      { from:'q3', read:'X', write:'X', move:'R', to:'q3' },
      { from:'q3', read:'Y', write:'Y', move:'R', to:'q3' },
      { from:'q3', read:'B', write:'B', move:'L', to:'q4' },
      { from:'q4', read:'1', write:'Y', move:'L', to:'q5' },
      { from:'q4', read:'Y', write:'Y', move:'L', to:'q5' },
      { from:'q5', read:'0', write:'0', move:'L', to:'q5' },
      { from:'q5', read:'1', write:'1', move:'L', to:'q5' },
      { from:'q5', read:'X', write:'X', move:'L', to:'q5' },
      { from:'q5', read:'Y', write:'Y', move:'L', to:'q5' },
      { from:'q5', read:'B', write:'B', move:'R', to:'q0' },
    ];
    document.getElementById('inputString').value = '0110';
    showToast('Cargado: Palíndromo — prueba con "0110" o "010"','ok');

  } else if (name === 'unary') {
    // Suma unaria: 1^a 0 1^b → 1^(a+b)
    states = [
      { id:'q0', name:'q0', x:80,  y:200, isInitial:true,  isFinal:false },
      { id:'q1', name:'q1', x:280, y:200, isInitial:false, isFinal:false },
      { id:'qf', name:'qf', x:480, y:200, isInitial:false, isFinal:true  },
    ];
    stateId = 3;
    transitions = [
      { from:'q0', read:'1', write:'1', move:'R', to:'q0' },
      { from:'q0', read:'0', write:'1', move:'R', to:'q1' },
      { from:'q1', read:'1', write:'1', move:'R', to:'q1' },
      { from:'q1', read:'B', write:'B', move:'L', to:'qf' },
    ];
    document.getElementById('inputString').value = '1110111';
    showToast('Cargado: Suma unaria — entrada: "1^a 0 1^b"','ok');
  }

  updateStateSelects();
  renderTransList();
  renderDeltaTable();
  document.getElementById('diagramHint').classList.add('hidden');
}

// ── INIT ─────────────────────────────────────────────────────
updateStateSelects();
renderTransList();
renderDeltaTable();
renderTape();
setNavStatus('idle', 'LISTO');
