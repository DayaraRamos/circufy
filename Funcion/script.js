// ============================================================
// Circufy — Simulador de Compuertas Lógicas
// Archivo: script.js
// ============================================================

// ── BG PARTICLES ─────────────────────────────────────────────
const bgc = document.getElementById('bgc');
const bgx = bgc.getContext('2d');
bgc.width = window.innerWidth; bgc.height = window.innerHeight;
const bpts = Array.from({length:45},()=>({x:Math.random()*bgc.width,y:Math.random()*bgc.height,vx:(Math.random()-.5)*.25,vy:(Math.random()-.5)*.25,r:Math.random()*.8+.3}));
(function bl(){
  bgx.clearRect(0,0,bgc.width,bgc.height);
  bpts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>bgc.width)p.vx*=-1;if(p.y<0||p.y>bgc.height)p.vy*=-1;bgx.beginPath();bgx.arc(p.x,p.y,p.r,0,Math.PI*2);bgx.fillStyle='rgba(0,220,255,0.3)';bgx.fill();});
  for(let i=0;i<bpts.length;i++) for(let j=i+1;j<bpts.length;j++){const d=Math.hypot(bpts[i].x-bpts[j].x,bpts[i].y-bpts[j].y);if(d<80){bgx.strokeStyle=`rgba(0,220,255,${(1-d/80)*.05})`;bgx.lineWidth=.5;bgx.beginPath();bgx.moveTo(bpts[i].x,bpts[i].y);bgx.lineTo(bpts[j].x,bpts[j].y);bgx.stroke();}}
  requestAnimationFrame(bl);
})();

// ── GATE DEFINITIONS ─────────────────────────────────────────
const GATES = [
  {
    id:'AND', color:'#00dcff', rule:'Ambas = 1 → Salida 1', inputs:2,
    fn:(a,b)=>a&b,
    explain:`La compuerta <strong>AND</strong> funciona como una multiplicación lógica. La salida solo es 1 cuando <strong>todas</strong> las entradas son 1 simultáneamente. Si alguna entrada es 0, la salida es 0.`,
    hint:'Piénsalo como: necesito A Y B para activar la salida.',
    svgPath:`<path d="M10 6L10 42L26 42Q44 42 44 24Q44 6 26 6Z" stroke="currentColor" stroke-width="2.5" fill="currentColor" fill-opacity="0.12"/>`
  },
  {
    id:'OR', color:'#00dcff', rule:'Al menos una = 1 → Salida 1', inputs:2,
    fn:(a,b)=>a|b,
    explain:`La compuerta <strong>OR</strong> funciona como una suma lógica. La salida es 1 cuando <strong>al menos una</strong> entrada es 1. Solo da 0 cuando todas las entradas son 0.`,
    hint:'Piénsalo como: necesito A O B para activar la salida.',
    svgPath:`<path d="M10 6Q16 24 10 42Q26 42 42 24Q26 6 10 6Z" stroke="currentColor" stroke-width="2.5" fill="currentColor" fill-opacity="0.12"/>`
  },
  {
    id:'NOT', color:'#00dcff', rule:'Invierte la entrada: 0↔1', inputs:1,
    fn:(a)=>a^1,
    explain:`La compuerta <strong>NOT</strong> invierte la señal de entrada. Si entra un 1, sale un 0. Si entra un 0, sale un 1. Es la más simple de todas.`,
    hint:'Piénsalo como: si hay señal, la apago; si no hay, la enciendo.',
    svgPath:`<polygon points="10,6 10,42 36,24" stroke="currentColor" stroke-width="2.5" fill="currentColor" fill-opacity="0.12"/><circle cx="40" cy="24" r="5" stroke="currentColor" stroke-width="2" fill="#03080f"/>`
  },
  {
    id:'NAND', color:'#ff2d6b', rule:'AND invertido: 0 solo si ambas = 1', inputs:2,
    fn:(a,b)=>(a&b)^1,
    explain:`La compuerta <strong>NAND</strong> es un AND con la salida invertida. Da 0 <strong>únicamente</strong> cuando todas las entradas son 1. En todos los demás casos da 1.`,
    hint:'NAND = NOT AND. Es el AND al revés.',
    svgPath:`<path d="M10 6L10 42L22 42Q36 42 36 24Q36 6 22 6Z" stroke="currentColor" stroke-width="2.5" fill="currentColor" fill-opacity="0.12"/><circle cx="41" cy="24" r="5" stroke="currentColor" stroke-width="2" fill="#03080f"/>`
  },
  {
    id:'NOR', color:'#ff2d6b', rule:'OR invertido: 1 solo si ambas = 0', inputs:2,
    fn:(a,b)=>(a|b)^1,
    explain:`La compuerta <strong>NOR</strong> es un OR con la salida invertida. Da 1 <strong>únicamente</strong> cuando todas las entradas son 0. En todos los demás casos da 0.`,
    hint:'NOR = NOT OR. Es el OR al revés.',
    svgPath:`<path d="M10 6Q16 24 10 42Q22 42 34 24Q22 6 10 6Z" stroke="currentColor" stroke-width="2.5" fill="currentColor" fill-opacity="0.12"/><circle cx="39" cy="24" r="5" stroke="currentColor" stroke-width="2" fill="#03080f"/>`
  },
  {
    id:'XOR', color:'#ffe600', rule:'Diferentes → 1, Iguales → 0', inputs:2,
    fn:(a,b)=>a^b,
    explain:`La compuerta <strong>XOR</strong> (O exclusivo) da 1 cuando las entradas son <strong>diferentes</strong> entre sí. Si son iguales (ambas 0 o ambas 1), la salida es 0.`,
    hint:'XOR detecta diferencias. Base de los sumadores binarios.',
    svgPath:`<path d="M13 6Q19 24 13 42Q29 42 43 24Q29 6 13 6Z" stroke="currentColor" stroke-width="2.5" fill="currentColor" fill-opacity="0.12"/><path d="M8 6Q14 24 8 42" stroke="currentColor" stroke-width="2" fill="none"/>`
  },
  {
    id:'XNOR', color:'#ffe600', rule:'Iguales → 1, Diferentes → 0', inputs:2,
    fn:(a,b)=>(a^b)^1,
    explain:`La compuerta <strong>XNOR</strong> (O exclusivo negado) da 1 cuando las entradas son <strong>iguales</strong> entre sí. Si son diferentes, la salida es 0.`,
    hint:'XNOR detecta igualdad. Usado en comparadores digitales.',
    svgPath:`<path d="M12 6Q18 24 12 42Q26 42 36 24Q26 6 12 6Z" stroke="currentColor" stroke-width="2.5" fill="currentColor" fill-opacity="0.12"/><path d="M7 6Q13 24 7 42" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="41" cy="24" r="5" stroke="currentColor" stroke-width="2" fill="#03080f"/>`
  },
  {
    id:'BUFFER', color:'#00dcff', rule:'Salida = Entrada (sin cambios)', inputs:1,
    fn:(a)=>a,
    explain:`El <strong>BUFFER</strong> copia la señal de entrada sin modificarla. Se usa para amplificar señales eléctricas y reforzar la corriente en circuitos reales.`,
    hint:'BUFFER = amplificador. La salida siempre es igual a la entrada.',
    svgPath:`<polygon points="10,6 10,42 44,24" stroke="currentColor" stroke-width="2.5" fill="currentColor" fill-opacity="0.12"/>`
  },
];

// ── STATE ─────────────────────────────────────────────────────
let mode = '10';
let numRows = 4;
let answers = [];
let inputs = [];
let activeGate = null;

const CS = { pieces:[], wires:[], tool:'MOVE', wf:null, drag:null, dox:0, doy:0, mx:160, my:210, af:0 };
let PID = 1;

function toD(v){ return mode==='VF'?(v?'V':'F'):String(v); }
function fromD(s){ s=s.trim().toUpperCase(); if(s==='1'||s==='V')return 1; if(s==='0'||s==='F')return 0; return null; }
function correctAns(gi,ri){ const g=GATES[gi]; const{A,B}=inputs[ri]; return g.inputs===1?g.fn(A):g.fn(A,B); }

function initData(){
  answers = Array.from({length:numRows},()=>Array(8).fill(null));
  inputs = Array.from({length:numRows},(_,i)=>({
    A: numRows<=4?[0,0,1,1][i]??0:(i%2?1:0),
    B: numRows<=4?[0,1,0,1][i]??0:Math.floor(i/2)%2
  }));
}

// ── NAVBAR ───────────────────────────────────────────────────
function buildNavbar(){
  const container = document.getElementById('navGates');
  container.innerHTML = '';
  GATES.forEach((g,gi)=>{
    const pct = calcProgress(gi);
    const done = pct === 100;
    const btn = document.createElement('button');
    btn.className = `nav-gate-btn ${g.id.toLowerCase()} ${done?'unlocked':''} ${activeGate===g.id?'active':''}`;
    btn.id = `nav-${g.id}`;
    btn.innerHTML = done
      ? `${g.id} <span class="done-icon">✓</span>`
      : `${g.id} <span class="lock-icon">🔒</span>`;
    btn.title = done ? `${g.id}: ${g.rule}` : 'Completa esta columna en la tabla';
    if(done) btn.onclick = ()=>openCircuit(g.id);
    container.appendChild(btn);
  });
}

function openCircuit(gid){
  activeGate = gid;
  const gi = GATES.findIndex(g=>g.id===gid);
  const g = GATES[gi];

  document.getElementById('circuitSection').style.display='block';
  document.getElementById('emptyCircuit').style.display='none';
  document.getElementById('circuitSectionTitle').textContent = `ARMA EL CIRCUITO — ${gid}`;

  CS.pieces=[]; CS.wires=[]; CS.wf=null; CS.drag=null;
  CS.tool='MOVE';

  buildToolbar();
  buildExpCard(g);
  buildRefTable(gi);
  document.getElementById('verifyResult').style.display='none';
  buildNavbar();
  document.getElementById('circuitSection').scrollIntoView({behavior:'smooth'});
  initMainCanvas();
}

function buildToolbar(){
  const tb = document.getElementById('circToolbar');
  const tools = [
    {id:'MOVE', icon:`<svg viewBox="0 0 16 16" fill="none"><path d="M8 1L8 15M1 8L15 8M8 1L5 4M8 1L11 4M8 15L5 12M8 15L11 12M1 8L4 5M1 8L4 11M15 8L12 5M15 8L12 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`, label:'MOVER', cursor:'default'},
    {id:'INPUT', icon:`<svg viewBox="0 0 16 16" fill="none"><rect x="1" y="4" width="14" height="8" rx="2" stroke="currentColor" stroke-width="1.5"/><text x="8" y="11" text-anchor="middle" fill="currentColor" font-size="5" font-weight="bold">IN</text></svg>`, label:'INPUT', cursor:'cell'},
    {id:'GATE', icon:`<svg viewBox="0 0 16 16" fill="none"><path d="M3 3L3 13L8 13Q14 13 14 8Q14 3 8 3Z" stroke="currentColor" stroke-width="1.5" fill="currentColor" fill-opacity="0.15"/></svg>`, label:'GATE', cursor:'cell'},
    {id:'OUTPUT', icon:`<svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><text x="8" y="11" text-anchor="middle" fill="currentColor" font-size="4.5" font-weight="bold">OUT</text></svg>`, label:'OUTPUT', cursor:'cell'},
    {id:'WIRE', icon:`<svg viewBox="0 0 16 16" fill="none"><line x1="1" y1="8" x2="15" y2="8" stroke="currentColor" stroke-width="2"/><circle cx="1" cy="8" r="2" fill="currentColor"/><circle cx="15" cy="8" r="2" fill="currentColor"/></svg>`, label:'CABLE', cursor:'crosshair'},
    {id:'DEL', icon:`<svg viewBox="0 0 16 16" fill="none"><line x1="3" y1="3" x2="13" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="13" y1="3" x2="3" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`, label:'BORRAR', cursor:'not-allowed'},
  ];
  tb.innerHTML = tools.map(t=>`
    <button class="tool-btn${CS.tool===t.id?' sel':''}" id="tbtn-${t.id}" onclick="selTool('${t.id}','${t.cursor}')" title="${t.label}">
      ${t.icon} ${t.label}
    </button>`).join('');
}

function selTool(tool, cursor){
  CS.tool=tool; CS.wf=null;
  document.querySelectorAll('.tool-btn').forEach(b=>b.classList.remove('sel'));
  const btn = document.getElementById(`tbtn-${tool}`);
  if(btn) btn.classList.add('sel');
  const cv = document.getElementById('mainCircCanvas');
  if(cv) cv.style.cursor = cursor||'default';
  const hints = {
    MOVE:'Arrastra las piezas para posicionarlas · 2x clic en INPUT para cambiar 0/1',
    INPUT:'Haz clic en el canvas para colocar una entrada',
    GATE:'Haz clic en el canvas para colocar la compuerta',
    OUTPUT:'Haz clic en el canvas para colocar la salida',
    WIRE:'Clic en el punto de SALIDA (derecho) → luego clic en el punto de ENTRADA (izquierdo)',
    DEL:'Haz clic sobre una pieza o cable para eliminarlo'
  };
  const hbar = document.querySelector('.circuit-hint-bar');
  if(hbar) hbar.textContent = hints[tool]||'';
}

function buildExpCard(g){
  const card = document.getElementById('expCard');
  card.innerHTML = `
    <div class="exp-gate-name" style="color:${g.color}">⚡ ${g.id}</div>
    <div class="exp-rule">${g.rule}</div>
    <div class="exp-svg-wrap">
      <svg viewBox="0 0 54 48" fill="none" style="color:${g.color}">
        ${g.svgPath}
        ${g.inputs===2
          ?`<line x1="1" y1="16" x2="10" y2="16" stroke="currentColor" stroke-width="2"/>
            <line x1="1" y1="32" x2="10" y2="32" stroke="currentColor" stroke-width="2"/>`
          :`<line x1="1" y1="24" x2="10" y2="24" stroke="currentColor" stroke-width="2"/>`}
        <line x1="44" y1="24" x2="53" y2="24" stroke="currentColor" stroke-width="2"/>
      </svg>
    </div>
    <div class="exp-text">${g.explain}</div>
    <div style="margin-top:10px;padding:8px;background:rgba(255,230,0,0.06);border-left:3px solid var(--gold);font-size:0.72rem;color:var(--gold)">
      💡 ${g.hint}
    </div>`;
}

function buildRefTable(gi){
  const g = GATES[gi];
  const rows = g.inputs===1?[[0],[1]]:[[0,0],[0,1],[1,0],[1,1]];
  const thead = g.inputs===2
    ?`<tr><th>A</th><th>B</th><th>${g.id}</th></tr>`
    :`<tr><th>A</th><th>${g.id}</th></tr>`;
  const tbody = rows.map(r=>{
    const out = g.inputs===1?g.fn(r[0]):g.fn(r[0],r[1]);
    const cells = r.map(v=>`<td class="v${v}">${toD(v)}</td>`).join('')+`<td class="v${out}">${toD(out)}</td>`;
    return`<tr>${cells}</tr>`;
  }).join('');
  document.getElementById('refTable').innerHTML=`<thead>${thead}</thead><tbody>${tbody}</tbody>`;
}

// ── TABLE ────────────────────────────────────────────────────
function buildTable(){
  let h = `<tr><th class="inp-h" style="width:28px">#</th><th class="inp-h">A</th><th class="inp-h">B</th>`;
  GATES.forEach((g,gi)=>{
    h+=`<th class="gate-h" style="min-width:78px">
      <div class="gcol-name" style="color:${g.color}">${g.id}</div>
      <span class="gcol-rule">${g.rule}</span>
      <div class="cprog"><div class="cprog-f" id="cpf-${gi}" style="background:${g.color}"></div></div>
    </th>`;
  });
  document.getElementById('thead').innerHTML = h+'</tr>';

  const tb = document.getElementById('tbody'); tb.innerHTML='';
  for(let ri=0;ri<numRows;ri++){
    const{A,B}=inputs[ri];
    const tr=document.createElement('tr');
    tr.innerHTML=`<td class="rn">${ri+1}</td>
      <td class="inp-c"><span class="inp-val">${toD(A)}</span></td>
      <td class="inp-c"><span class="inp-val">${toD(B)}</span></td>
      ${GATES.map((_,gi)=>{
        const a=answers[ri][gi];
        const cls=a===null?'':(a===correctAns(gi,ri)?'ok':'err');
        return`<td class="${cls}" id="td-${ri}-${gi}">
          <input class="ans-inp" id="inp-${ri}-${gi}" value="${a!==null?toD(a):''}"
            maxlength="1" autocomplete="off" placeholder="${mode==='VF'?'V/F':'0/1'}"
            oninput="onAns(${ri},${gi},this)" onkeydown="onKey(event,${ri},${gi})"/>
        </td>`;
      }).join('')}`;
    tb.appendChild(tr);
  }
  updateAllProgress();
  buildNavbar();
}

function onAns(ri,gi,el){
  const v=fromD(el.value);
  const td=document.getElementById(`td-${ri}-${gi}`);
  td.className='';
  if(v===null){answers[ri][gi]=null;el.value='';return;}
  el.value=toD(v);
  answers[ri][gi]=v;
  const corr=v===correctAns(gi,ri);
  td.className=corr?'ok':'err';
  if(!corr) showToast(`✗ ${GATES[gi].id} fila ${ri+1} — Recuerda: ${GATES[gi].rule}`,'bad');
  else{
    const nxt=document.getElementById(`inp-${ri+1}-${gi}`);
    if(nxt) setTimeout(()=>nxt.focus(),120);
    checkColComplete(gi);
  }
  updateAllProgress();
  buildNavbar();
}

function onKey(e,ri,gi){
  const map={ArrowDown:[ri+1,gi],ArrowUp:[ri-1,gi],ArrowRight:[ri,gi+1],ArrowLeft:[ri,gi-1],Enter:[ri+1,gi]};
  if(map[e.key]){e.preventDefault();const el=document.getElementById(`inp-${map[e.key][0]}-${map[e.key][1]}`);if(el)el.focus();}
}

function checkColComplete(gi){
  const all=Array.from({length:numRows},(_,r)=>answers[r][gi]===correctAns(gi,r)).every(Boolean);
  if(all){
    showToast(`🎉 Columna ${GATES[gi].id} completa — ahora puedes armar el circuito en el navbar`,'ok');
    buildNavbar();
    checkAllComplete();
  }
}

function calcProgress(gi){
  if(!numRows)return 0;
  let c=0;
  for(let r=0;r<numRows;r++) if(answers[r][gi]!==null&&answers[r][gi]===correctAns(gi,r))c++;
  return Math.round(c/numRows*100);
}

function updateAllProgress(){
  GATES.forEach((_,gi)=>{
    const pct=calcProgress(gi);
    const f=document.getElementById(`cpf-${gi}`);
    if(f)f.style.width=pct+'%';
  });
}

// ── VERIFY ALL ────────────────────────────────────────────────
function verifyAll(){
  if(!activeGate){showToast('Selecciona una compuerta del navbar primero','bad');return;}
  const gi=GATES.findIndex(g=>g.id===activeGate);
  const g=GATES[gi];
  const results=[];

  const tableComplete=Array.from({length:numRows},(_,r)=>answers[r][gi]!==null).every(Boolean);
  if(!tableComplete){
    results.push({pass:false,msg:`La columna <strong>${g.id}</strong> en la tabla no está completa.`,step:1});
  } else {
    const tableCorrect=Array.from({length:numRows},(_,r)=>answers[r][gi]===correctAns(gi,r)).every(Boolean);
    if(tableCorrect){
      results.push({pass:true,msg:`Tabla de verdad correcta — todos los valores de ${g.id} son correctos.`,step:1});
    } else {
      const wrongRows=Array.from({length:numRows},(_,r)=>r).filter(r=>answers[r][gi]!==correctAns(gi,r));
      const details=wrongRows.map(r=>{
        const{A,B}=inputs[r];
        const inp=g.inputs===2?`A=${toD(A)}, B=${toD(B)}`:`A=${toD(A)}`;
        return`fila ${r+1} (${inp}): escribiste ${toD(answers[r][gi])} pero debería ser ${toD(correctAns(gi,r))}`;
      }).join(' · ');
      results.push({pass:false,msg:`Tabla incorrecta — ${details}`,step:1});
    }
  }

  const ins=CS.pieces.filter(p=>p.type==='I');
  const outs=CS.pieces.filter(p=>p.type==='O');
  const gates=CS.pieces.filter(p=>p.type==='G'&&p.gt===g.id);

  if(!gates.length){
    results.push({pass:false,msg:`El circuito no tiene la compuerta ${g.id}. Agrégala con la herramienta GATE.`,step:2});
  } else if(!outs.length){
    results.push({pass:false,msg:'El circuito no tiene un OUTPUT. Agrégalo con la herramienta OUTPUT.',step:2});
  } else if(ins.length<g.inputs){
    results.push({pass:false,msg:`El circuito necesita ${g.inputs} INPUT(s). Tienes ${ins.length}.`,step:2});
  } else {
    const combos=g.inputs===1?[[0],[1]]:[[0,0],[0,1],[1,0],[1,1]];
    let circuitErrors=[];
    for(let ci=0;ci<combos.length;ci++){
      const combo=combos[ci];
      ins.forEach((inp,i)=>{inp.val=combo[i]||0;inp.out=inp.val;});
      simCircuit();
      const outVal=outs[0].out;
      const expected=g.inputs===1?g.fn(combo[0]):g.fn(combo[0],combo[1]);
      const rowIdx=ci<numRows?ci:null;
      const userAns=rowIdx!==null&&answers[rowIdx][gi]!==null?answers[rowIdx][gi]:null;
      if(outVal!==expected){
        const inp=g.inputs===2?`A=${toD(combo[0])}, B=${toD(combo[1])}`:`A=${toD(combo[0])}`;
        circuitErrors.push(`Con ${inp}: circuito da ${toD(outVal)}, debería dar ${toD(expected)}`);
      }
      if(userAns!==null&&outVal!==userAns){
        const inp=g.inputs===2?`A=${toD(combo[0])}, B=${toD(combo[1])}`:`A=${toD(combo[0])}`;
        if(!circuitErrors.find(e=>e.includes(inp)))
          circuitErrors.push(`Con ${inp}: tu tabla dice ${toD(userAns)} pero el circuito da ${toD(outVal)}`);
      }
    }
    if(!circuitErrors.length){
      results.push({pass:true,msg:`¡Circuito correcto! La compuerta ${g.id} funciona perfectamente para todas las combinaciones.`,step:2});
    } else {
      results.push({pass:false,msg:`Circuito incorrecto — ${circuitErrors.join(' · ')}`,step:2});
    }
  }

  showVerifyResults(results, g);
}

function showVerifyResults(results, g){
  const el=document.getElementById('verifyResult');
  el.style.display='block';
  const allPass=results.every(r=>r.pass);

  const stepsHtml=results.map(r=>`
    <div class="vr-step">
      <div class="vr-step-title">// PASO ${r.step}: ${r.step===1?'TABLA DE VERDAD':'CIRCUITO ARMADO'}</div>
      <div class="vr-item ${r.pass?'pass':'fail'}">
        <span class="vr-icon">${r.pass?'✓':'✗'}</span>
        <span>${r.msg}</span>
      </div>
    </div>`).join('');

  let finalMsg='';
  if(allPass){
    finalMsg=`<div class="vr-final ok">🎉 ¡EXCELENTE! Todo correcto — dominas la compuerta ${g.id}</div>`;
  } else if(results[0]?.pass && !results[1]?.pass){
    finalMsg=`<div class="vr-final bad">⚡ Tabla correcta — revisa el circuito</div>`;
  } else if(!results[0]?.pass){
    finalMsg=`<div class="vr-final bad">✗ Corrige la tabla primero, luego el circuito</div>`;
  }

  el.innerHTML=stepsHtml+finalMsg;
  el.scrollIntoView({behavior:'smooth',block:'nearest'});

  if(allPass){
    showToast(`🎉 ¡Perfecto! Compuerta ${g.id} dominada al 100%`,'ok');
    const navBtn=document.getElementById(`nav-${g.id}`);
    if(navBtn) navBtn.innerHTML=`${g.id} <span class="done-icon">★</span>`;
  }
}

// ── CANVAS PRINCIPAL ──────────────────────────────────────────
let canvasReady = false;

function resizeCanvas(cv) {
  if (!cv) return;
  const wrap = cv.parentElement;
  const w = wrap ? wrap.clientWidth : 900;
  cv.width = w > 0 ? w : 900;
}

function initMainCanvas(){
  const cv = document.getElementById('mainCircCanvas');
  if(!cv) return;
  if(canvasReady) return;
  canvasReady = true;

  // ── FIX: medir bien el ancho real del contenedor ──
  resizeCanvas(cv);
  cv.height = 500;

  const pos = e => {
    const r = cv.getBoundingClientRect();
    const sx = cv.width / r.width, sy = cv.height / r.height;
    return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
  };
  const tpos = e => {
    const r = cv.getBoundingClientRect();
    const t = e.touches[0];
    const sx = cv.width / r.width, sy = cv.height / r.height;
    return { x: (t.clientX - r.left) * sx, y: (t.clientY - r.top) * sy };
  };

  cv.addEventListener('mousedown', e => { e.preventDefault(); const p = pos(e); onDown(p.x, p.y); });
  cv.addEventListener('mousemove', e => { const p = pos(e); onMove(p.x, p.y); });
  cv.addEventListener('mouseup', () => onUp());
  cv.addEventListener('mouseleave', () => { CS.mx = -999; CS.my = -999; });
  cv.addEventListener('dblclick', e => { const p = pos(e); onDbl(p.x, p.y); });
  cv.addEventListener('contextmenu', e => e.preventDefault());
  cv.addEventListener('touchstart', e => { e.preventDefault(); const p = tpos(e); onDown(p.x, p.y); }, { passive: false });
  cv.addEventListener('touchmove', e => { e.preventDefault(); const p = tpos(e); onMove(p.x, p.y); }, { passive: false });
  cv.addEventListener('touchend', e => { e.preventDefault(); onUp(); }, { passive: false });

  // Hint bar
  const wrap = cv.parentElement;
  if(!wrap.querySelector('.circuit-hint-bar')){
    const hbar = document.createElement('div');
    hbar.className = 'circuit-hint-bar';
    hbar.textContent = 'Selecciona una herramienta del toolbar para comenzar';
    wrap.appendChild(hbar);
  }

  // ── FIX: resize correcto al cambiar tamaño de ventana ──
  window.addEventListener('resize', () => {
    resizeCanvas(cv);
    const fc = document.getElementById('finalCanvas');
    if(fc) resizeCanvas(fc);
    bgc.width = window.innerWidth;
    bgc.height = window.innerHeight;
  });

  (function loop(){ requestAnimationFrame(loop); drawCanvas(); })();
}

function onDown(mx,my){
  const t=CS.tool;
  if(t==='DEL'){
    const p=pAt(mx,my);
    if(p){CS.pieces=CS.pieces.filter(x=>x.id!==p.id);CS.wires=CS.wires.filter(w=>w.fid!==p.id&&w.tid!==p.id);simCircuit();}
    else{
      CS.wires=CS.wires.filter(w=>{
        const fp=oPort(w.fid),tp=iPort(w.tid,w.tp);if(!fp||!tp)return false;
        const cx=(fp.x+tp.x)/2;
        for(let t=0;t<=1;t+=0.04){if(Math.hypot(mx-bz(fp.x,cx,cx,tp.x,t),my-bz(fp.y,fp.y,tp.y,tp.y,t))<14)return false;}
        return true;
      });simCircuit();
    }return;
  }
  if(t==='WIRE'){
    const port=nearPort(mx,my,22);
    if(!CS.wf){
      if(port&&port.type==='out'){CS.wf=port;showToast('Cable iniciado ⚡ haz clic en una ENTRADA','ok');}
      else showToast('Haz clic cerca del punto de SALIDA (lado derecho)','bad');
    } else {
      if(port&&port.type==='in'&&port.pid!==CS.wf.pid){
        if(!CS.wires.find(w=>w.tid===port.pid&&w.tp===port.pi)){
          CS.wires.push({fid:CS.wf.pid,tid:port.pid,tp:port.pi,v:0});
          simCircuit();showToast('✓ Cable conectado','ok');
        } else showToast('Esa entrada ya tiene cable','bad');
        CS.wf=null;
      } else if(port&&port.type==='out'){CS.wf=port;}
      else{CS.wf=null;showToast('Cable cancelado','bad');}
    }return;
  }
  if(t==='MOVE'){
    const p=pAt(mx,my);
    if(p){CS.drag=p;CS.dox=mx-p.x;CS.doy=my-p.y;
      const cv=document.getElementById('mainCircCanvas');
      if(cv)cv.style.cursor='grabbing';}
    return;
  }
  const gi=GATES.findIndex(g=>g.id===activeGate);
  const g=GATES[gi];
  if(t==='INPUT') CS.pieces.push({id:PID++,type:'I',x:mx-22,y:my-18,w:44,h:36,val:0,out:0});
  else if(t==='GATE'&&g) CS.pieces.push({id:PID++,type:'G',gt:g.id,x:mx-36,y:my-26,w:72,h:52,out:0,col:g.color});
  else if(t==='OUTPUT') CS.pieces.push({id:PID++,type:'O',x:mx-18,y:my-18,w:36,h:36,out:0});
  simCircuit();
}

function onMove(mx,my){
  CS.mx=mx;CS.my=my;
  if(CS.drag){CS.drag.x=mx-CS.dox;CS.drag.y=my-CS.doy;simCircuit();}
  if(CS.tool==='MOVE'&&!CS.drag){
    const cv=document.getElementById('mainCircCanvas');
    if(cv)cv.style.cursor=pAt(mx,my)?'grab':'default';
  }
}

function onUp(){
  if(CS.drag){
    CS.drag=null;
    const cv=document.getElementById('mainCircCanvas');
    if(cv&&CS.tool==='MOVE')cv.style.cursor='default';
  }
}

function onDbl(mx,my){
  const p=pAt(mx,my);
  if(p&&p.type==='I'){p.val^=1;p.out=p.val;simCircuit();
    if(activeGate){const gi=GATES.findIndex(g=>g.id===activeGate);buildRefTable(gi);}
  }
}

// ── PORT HELPERS ─────────────────────────────────────────────
function oPort(id){
  const p=CS.pieces.find(x=>x.id===id);if(!p||p.type==='O')return null;
  const bubble=['NAND','NOR','NOT','XNOR'];
  const hb=p.type==='G'&&bubble.includes(p.gt);
  return{x:p.x+p.w+(hb?10:0),y:p.y+p.h/2};
}
function iPorts(p){
  if(p.type==='I')return[];
  if(p.type==='O')return[{x:p.x,y:p.y+p.h/2}];
  const g=GATES.find(x=>x.id===p.gt);if(!g)return[];
  if(g.inputs===1)return[{x:p.x,y:p.y+p.h/2}];
  return[{x:p.x,y:p.y+p.h*.35},{x:p.x,y:p.y+p.h*.65}];
}
function iPort(id,pi){const p=CS.pieces.find(x=>x.id===id);if(!p)return null;return iPorts(p)[pi]||null;}

function nearPort(mx,my,r){
  for(const p of CS.pieces){const op=oPort(p.id);if(op&&Math.hypot(mx-op.x,my-op.y)<r)return{pid:p.id,type:'out',pi:0};}
  for(const p of CS.pieces){const ips=iPorts(p);for(let i=0;i<ips.length;i++){if(Math.hypot(mx-ips[i].x,my-ips[i].y)<r)return{pid:p.id,type:'in',pi:i};}}
  return null;
}
function pAt(mx,my){
  for(let i=CS.pieces.length-1;i>=0;i--){const p=CS.pieces[i];if(mx>=p.x-4&&mx<=p.x+p.w+4&&my>=p.y-4&&my<=p.y+p.h+4)return p;}
  return null;
}

// ── SIMULATION ───────────────────────────────────────────────
function simCircuit(){
  CS.pieces.forEach(p=>{p.out=p.type==='I'?p.val:0;});
  for(let pass=0;pass<12;pass++){
    CS.pieces.forEach(p=>{
      if(p.type==='I')return;
      const ips=iPorts(p);
      const iv=ips.map((_,i)=>{const w=CS.wires.find(w=>w.tid===p.id&&w.tp===i);if(!w)return 0;const src=CS.pieces.find(x=>x.id===w.fid);return src?src.out:0;});
      if(p.type==='O'){p.out=iv[0]||0;}
      else if(p.type==='G'){const g=GATES.find(x=>x.id===p.gt);p.out=g?(g.inputs===1?g.fn(iv[0]||0):g.fn(iv[0]||0,iv[1]||0)):0;}
    });
  }
  CS.wires.forEach(w=>{const src=CS.pieces.find(x=>x.id===w.fid);w.v=src?src.out:0;});
}

function clrMainCircuit(){CS.pieces=[];CS.wires=[];CS.wf=null;CS.drag=null;document.getElementById('verifyResult').style.display='none';}

// ── DRAW ─────────────────────────────────────────────────────
function bz(p0,p1,p2,p3,t){return(1-t)**3*p0+3*(1-t)**2*t*p1+3*(1-t)*t**2*p2+t**3*p3;}

function drawCanvas(){
  const cv=document.getElementById('mainCircCanvas');if(!cv)return;
  const ctx=cv.getContext('2d');
  const W=cv.width,H=cv.height;
  CS.af=(CS.af||0)+1;

  ctx.clearRect(0,0,W,H);

  ctx.strokeStyle='rgba(0,220,255,0.04)';ctx.lineWidth=1;
  for(let x=0;x<W;x+=28){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let y=0;y<H;y+=28){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

  CS.wires.forEach(w=>{
    const fp=oPort(w.fid),tp=iPort(w.tid,w.tp);if(!fp||!tp)return;
    const on=w.v,cx=(fp.x+tp.x)/2;
    ctx.strokeStyle=on?'#00ffaa':'#1a3550';ctx.lineWidth=on?2.5:2;
    ctx.shadowColor=on?'#00ffaa':'transparent';ctx.shadowBlur=on?10:0;
    ctx.beginPath();ctx.moveTo(fp.x,fp.y);ctx.bezierCurveTo(cx,fp.y,cx,tp.y,tp.x,tp.y);ctx.stroke();ctx.shadowBlur=0;
    if(on){
      const t=(CS.af%60)/60;
      const px=bz(fp.x,cx,cx,tp.x,t),py=bz(fp.y,fp.y,tp.y,tp.y,t);
      ctx.beginPath();ctx.arc(px,py,4,0,Math.PI*2);ctx.fillStyle='#fff';ctx.shadowColor='#00ffaa';ctx.shadowBlur=16;ctx.fill();ctx.shadowBlur=0;
    }
  });

  if(CS.wf){
    const fp=oPort(CS.wf.pid);
    if(fp){
      const cx=(fp.x+CS.mx)/2;
      ctx.strokeStyle='#ffe60099';ctx.lineWidth=2;ctx.setLineDash([7,5]);
      ctx.shadowColor='#ffe600';ctx.shadowBlur=8;
      ctx.beginPath();ctx.moveTo(fp.x,fp.y);ctx.bezierCurveTo(cx,fp.y,cx,CS.my,CS.mx,CS.my);ctx.stroke();
      ctx.setLineDash([]);ctx.shadowBlur=0;
      ctx.beginPath();ctx.arc(fp.x,fp.y,8,0,Math.PI*2);ctx.strokeStyle='#ffe600';ctx.lineWidth=2;ctx.shadowColor='#ffe600';ctx.shadowBlur=18;ctx.stroke();ctx.shadowBlur=0;
    }
  }

  if(CS.tool==='WIRE'){
    CS.pieces.forEach(p=>{
      if(!CS.wf){const op=oPort(p.id);if(op){ctx.beginPath();ctx.arc(op.x,op.y,9,0,Math.PI*2);ctx.strokeStyle='#ffe60055';ctx.lineWidth=1.5;ctx.stroke();}}
      else{iPorts(p).forEach(ip=>{ctx.beginPath();ctx.arc(ip.x,ip.y,9,0,Math.PI*2);ctx.strokeStyle='#00ffaa55';ctx.lineWidth=1.5;ctx.stroke();});}
    });
    const hp=nearPort(CS.mx,CS.my,22);
    if(hp){
      const isO=hp.type==='out';
      const pt=isO?oPort(hp.pid):(iPorts(CS.pieces.find(x=>x.id===hp.pid))||[])[hp.pi];
      if(pt){ctx.beginPath();ctx.arc(pt.x,pt.y,12,0,Math.PI*2);ctx.strokeStyle=isO?'#ffe600':'#00ffaa';ctx.lineWidth=2.5;ctx.shadowColor=isO?'#ffe600':'#00ffaa';ctx.shadowBlur=22;ctx.stroke();ctx.shadowBlur=0;}
    }
  }

  CS.pieces.forEach(p=>drawP(ctx,p));
}

function drawP(ctx,p){
  const{x,y,w,h}=p;
  if(p.type==='I'){
    const c=p.val?'#00ffaa':'#ff2d6b';
    ctx.strokeStyle=c;ctx.fillStyle=c+'18';ctx.lineWidth=2;ctx.shadowColor=c;ctx.shadowBlur=p.val?14:3;
    ctx.beginPath();ctx.roundRect(x,y,w,h,4);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
    ctx.fillStyle='#4a7090';ctx.font='bold 8px Share Tech Mono';ctx.textAlign='center';ctx.fillText('IN',x+w/2,y+13);
    ctx.fillStyle=c;ctx.font='bold 16px Orbitron,monospace';ctx.textAlign='center';ctx.shadowColor=c;ctx.shadowBlur=p.val?14:0;
    ctx.fillText(p.val,x+w/2,y+h-7);ctx.shadowBlur=0;
    ctx.beginPath();ctx.arc(x+w,y+h/2,5,0,Math.PI*2);ctx.fillStyle=p.val?'#00ffaa':'#0d1e30';ctx.strokeStyle=c;ctx.lineWidth=1.5;ctx.shadowColor=c;ctx.shadowBlur=p.val?10:0;ctx.fill();ctx.stroke();ctx.shadowBlur=0;
    ctx.fillStyle='#1a3550';ctx.font='7px Rajdhani';ctx.textAlign='center';ctx.fillText('2x clic',x+w/2,y+h+10);
    return;
  }
  if(p.type==='O'){
    const c=p.out?'#00ffaa':'#ff2d6b';
    ctx.strokeStyle=c;ctx.fillStyle=c+'18';ctx.lineWidth=2;ctx.shadowColor=c;ctx.shadowBlur=p.out?20:5;
    ctx.beginPath();ctx.arc(x+w/2,y+h/2,h/2,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
    ctx.fillStyle=c;ctx.font='bold 16px Orbitron,monospace';ctx.textAlign='center';ctx.shadowColor=c;ctx.shadowBlur=p.out?16:0;
    ctx.fillText(p.out,x+w/2,y+h/2+6);ctx.shadowBlur=0;
    ctx.fillStyle=c+'99';ctx.font='7px Share Tech Mono';ctx.textAlign='center';ctx.fillText('OUT',x+w/2,y-7);
    ctx.beginPath();ctx.arc(x,y+h/2,5,0,Math.PI*2);ctx.fillStyle='#0d1e30';ctx.strokeStyle=c;ctx.lineWidth=1.5;ctx.fill();ctx.stroke();
    return;
  }
  if(p.type==='G'){
    const col=p.col||'#00dcff',id=p.gt;
    ctx.strokeStyle=col;ctx.lineWidth=2;ctx.fillStyle=col+'15';ctx.shadowColor=col;ctx.shadowBlur=7;
    ctx.beginPath();
    if(id==='AND'||id==='NAND'){ctx.moveTo(x,y);ctx.lineTo(x+w*.5,y);ctx.arcTo(x+w,y,x+w,y+h/2,h/2);ctx.arcTo(x+w,y+h,x+w*.5,y+h,h/2);ctx.lineTo(x,y+h);ctx.closePath();}
    else if(id==='OR'||id==='NOR'){ctx.moveTo(x,y);ctx.quadraticCurveTo(x+w*.3,y+h/2,x,y+h);ctx.quadraticCurveTo(x+w*.6,y+h,x+w,y+h/2);ctx.quadraticCurveTo(x+w*.6,y,x,y);}
    else if(id==='XOR'||id==='XNOR'){ctx.moveTo(x+7,y);ctx.quadraticCurveTo(x+w*.3+7,y+h/2,x+7,y+h);ctx.quadraticCurveTo(x+w*.6,y+h,x+w,y+h/2);ctx.quadraticCurveTo(x+w*.6,y,x+7,y);ctx.closePath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+w*.25,y+h/2,x,y+h);}
    else{ctx.moveTo(x,y);ctx.lineTo(x+w*(id==='NOT'?.8:1),y+h/2);ctx.lineTo(x,y+h);ctx.closePath();}
    ctx.fill();ctx.stroke();ctx.shadowBlur=0;
    if(['NAND','NOR','NOT','XNOR'].includes(id)){ctx.beginPath();ctx.arc(x+w+5,y+h/2,5,0,Math.PI*2);ctx.fillStyle='#03080f';ctx.fill();ctx.strokeStyle=col;ctx.shadowColor=col;ctx.shadowBlur=9;ctx.stroke();ctx.shadowBlur=0;}
    ctx.fillStyle=col;ctx.font='bold 9px Share Tech Mono,monospace';ctx.textAlign='center';ctx.fillText(id,x+w/2+(id==='XOR'||id==='XNOR'?3:0),y+h/2+3);
    iPorts(p).forEach(ip=>{ctx.beginPath();ctx.arc(ip.x,ip.y,5,0,Math.PI*2);ctx.fillStyle='#0d1e30';ctx.strokeStyle=col;ctx.lineWidth=1.5;ctx.fill();ctx.stroke();});
    const op=oPort(p.id);
    if(op){ctx.beginPath();ctx.arc(op.x,op.y,5,0,Math.PI*2);ctx.fillStyle=p.out?'#00ffaa':'#0d1e30';ctx.strokeStyle=col;ctx.lineWidth=1.5;ctx.shadowColor=p.out?'#00ffaa':'transparent';ctx.shadowBlur=p.out?10:0;ctx.fill();ctx.stroke();ctx.shadowBlur=0;}
  }
}

// ── CONTROLS ─────────────────────────────────────────────────
function setMode(m){
  mode=m;
  document.getElementById('btn10').classList.toggle('active',m==='10');
  document.getElementById('btnVF').classList.toggle('active',m==='VF');
  for(let ri=0;ri<numRows;ri++){
    const{A,B}=inputs[ri];
    const row=document.querySelector(`#tbody tr:nth-child(${ri+1})`);
    if(row){row.querySelectorAll('.inp-val')[0].textContent=toD(A);row.querySelectorAll('.inp-val')[1].textContent=toD(B);}
    GATES.forEach((_,gi)=>{const inp=document.getElementById(`inp-${ri}-${gi}`);if(inp&&answers[ri][gi]!==null)inp.value=toD(answers[ri][gi]);if(inp)inp.placeholder=mode==='VF'?'V/F':'0/1';});
  }
  if(activeGate){const gi=GATES.findIndex(g=>g.id===activeGate);buildRefTable(gi);}
}

function addRow(){
  if(numRows>=16){showToast('Máximo 16 filas','bad');return;}
  numRows++;document.getElementById('rowCount').textContent=numRows;
  answers.push(Array(8).fill(null));
  const i=numRows-1;inputs.push({A:i%2?1:0,B:Math.floor(i/2)%2});
  buildTable();
}
function removeRow(){
  if(numRows<=1){showToast('Mínimo 1 fila','bad');return;}
  numRows--;document.getElementById('rowCount').textContent=numRows;
  answers.pop();inputs.pop();buildTable();
}
function resetAll(){initData();buildTable();CS.pieces=[];CS.wires=[];CS.wf=null;activeGate=null;document.getElementById('circuitSection').style.display='none';document.getElementById('emptyCircuit').style.display='block';buildNavbar();}

let toastT;
function showToast(msg,type){const t=document.getElementById('toast');t.textContent=msg;t.className=`show ${type}`;clearTimeout(toastT);toastT=setTimeout(()=>t.className='',2600);}

// ── NIVEL FINAL ──────────────────────────────────────────────
const FCS = { pieces:[], wires:[], tool:'MOVE', wf:null, drag:null, dox:0, doy:0, mx:200, my:210, af:0 };
let finalCanvasReady = false;

function checkAllComplete(){
  const allDone = GATES.every((_,gi)=>calcProgress(gi)===100);
  if(allDone){
    document.getElementById('navFinalBtn').style.display='block';
    document.getElementById('finalLocked').style.display='block';
  }
}

function openFinal(){
  document.getElementById('circuitSection').style.display='none';
  document.getElementById('emptyCircuit').style.display='none';
  document.getElementById('finalLocked').style.display='none';
  document.getElementById('finalSection').style.display='block';
  document.getElementById('finalResult').style.display='none';
  FCS.pieces=[]; FCS.wires=[]; FCS.wf=null; FCS.drag=null; FCS.tool='MOVE';
  buildFinalToolbar();
  initFinalCanvas();
  updateGuideSteps();
  document.getElementById('finalSection').scrollIntoView({behavior:'smooth'});
}

function buildFinalToolbar(){
  const tb = document.getElementById('finalToolbar');
  const tools = [
    {id:'MOVE', label:'MOVER', cursor:'default', icon:`<svg viewBox="0 0 16 16" fill="none"><path d="M8 1L8 15M1 8L15 8M8 1L5 4M8 1L11 4M8 15L5 12M8 15L11 12M1 8L4 5M1 8L4 11M15 8L12 5M15 8L12 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`},
    {id:'INPUT', label:'INPUT', cursor:'cell', icon:`<svg viewBox="0 0 16 16" fill="none"><rect x="1" y="4" width="14" height="8" rx="2" stroke="currentColor" stroke-width="1.5"/><text x="8" y="11" text-anchor="middle" fill="currentColor" font-size="5" font-weight="bold">IN</text></svg>`},
    {id:'GATE', label:'GATE', cursor:'cell', icon:`<svg viewBox="0 0 16 16" fill="none"><path d="M3 3L3 13L8 13Q14 13 14 8Q14 3 8 3Z" stroke="currentColor" stroke-width="1.5" fill="currentColor" fill-opacity="0.15"/></svg>`},
    {id:'OUTPUT', label:'OUTPUT', cursor:'cell', icon:`<svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><text x="8" y="11" text-anchor="middle" fill="currentColor" font-size="4.5" font-weight="bold">OUT</text></svg>`},
    {id:'WIRE', label:'CABLE', cursor:'crosshair', icon:`<svg viewBox="0 0 16 16" fill="none"><line x1="1" y1="8" x2="15" y2="8" stroke="currentColor" stroke-width="2"/><circle cx="1" cy="8" r="2" fill="currentColor"/><circle cx="15" cy="8" r="2" fill="currentColor"/></svg>`},
    {id:'DEL', label:'BORRAR', cursor:'not-allowed', icon:`<svg viewBox="0 0 16 16" fill="none"><line x1="3" y1="3" x2="13" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="13" y1="3" x2="3" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`},
  ];
  const gateSelect = `<select id="finalGateSelect" style="padding:5px 8px;background:var(--panel);border:1px solid var(--dim);color:var(--neon);font-family:'Share Tech Mono',monospace;font-size:0.65rem;cursor:pointer">
    ${GATES.map(g=>`<option value="${g.id}">${g.id}</option>`).join('')}
  </select>`;
  tb.innerHTML = tools.map(t=>`
    <button class="tool-btn${FCS.tool===t.id?' sel':''}" id="ftbtn-${t.id}" onclick="selFinalTool('${t.id}','${t.cursor}')" title="${t.label}">
      ${t.icon} ${t.label}
    </button>`).join('') + `<span style="font-size:0.62rem;color:var(--dim2);align-self:center">Compuerta:</span>` + gateSelect;
}

function selFinalTool(tool, cursor){
  FCS.tool=tool; FCS.wf=null;
  document.querySelectorAll('#finalToolbar .tool-btn').forEach(b=>b.classList.remove('sel'));
  const btn=document.getElementById(`ftbtn-${tool}`); if(btn)btn.classList.add('sel');
  const cv=document.getElementById('finalCanvas'); if(cv)cv.style.cursor=cursor||'default';
}

function fOPort(id){
  const p=FCS.pieces.find(x=>x.id===id); if(!p||p.type==='O')return null;
  const bubble=['NAND','NOR','NOT','XNOR'];
  const hb=p.type==='G'&&bubble.includes(p.gt);
  return{x:p.x+p.w+(hb?10:0),y:p.y+p.h/2};
}
function fIPorts(p){
  if(p.type==='I')return[];
  if(p.type==='O')return[{x:p.x,y:p.y+p.h/2}];
  const g=GATES.find(x=>x.id===p.gt); if(!g)return[];
  if(g.inputs===1)return[{x:p.x,y:p.y+p.h/2}];
  return[{x:p.x,y:p.y+p.h*.35},{x:p.x,y:p.y+p.h*.65}];
}
function fIPort(id,pi){const p=FCS.pieces.find(x=>x.id===id);if(!p)return null;return fIPorts(p)[pi]||null;}
function fNearPort(mx,my,r){
  for(const p of FCS.pieces){const op=fOPort(p.id);if(op&&Math.hypot(mx-op.x,my-op.y)<r)return{pid:p.id,type:'out',pi:0};}
  for(const p of FCS.pieces){const ips=fIPorts(p);for(let i=0;i<ips.length;i++){if(Math.hypot(mx-ips[i].x,my-ips[i].y)<r)return{pid:p.id,type:'in',pi:i};}}
  return null;
}
function fPAt(mx,my){
  for(let i=FCS.pieces.length-1;i>=0;i--){const p=FCS.pieces[i];if(mx>=p.x-4&&mx<=p.x+p.w+4&&my>=p.y-4&&my<=p.y+p.h+4)return p;}
  return null;
}

function simFinal(){
  FCS.pieces.forEach(p=>{p.out=p.type==='I'?p.val:0;});
  for(let pass=0;pass<15;pass++){
    FCS.pieces.forEach(p=>{
      if(p.type==='I')return;
      const ips=fIPorts(p);
      const iv=ips.map((_,i)=>{const w=FCS.wires.find(w=>w.tid===p.id&&w.tp===i);if(!w)return 0;const src=FCS.pieces.find(x=>x.id===w.fid);return src?src.out:0;});
      if(p.type==='O'){p.out=iv[0]||0;}
      else if(p.type==='G'){const g=GATES.find(x=>x.id===p.gt);p.out=g?(g.inputs===1?g.fn(iv[0]||0):g.fn(iv[0]||0,iv[1]||0)):0;}
    });
  }
  FCS.wires.forEach(w=>{const src=FCS.pieces.find(x=>x.id===w.fid);w.v=src?src.out:0;});
  updateGuideSteps();
}

function updateGuideSteps(){
  const ins=FCS.pieces.filter(p=>p.type==='I');
  const gates=FCS.pieces.filter(p=>p.type==='G');
  const outs=FCS.pieces.filter(p=>p.type==='O');
  const uniqueGates=[...new Set(gates.map(g=>g.gt))];
  const hasLevels=FCS.wires.some(w=>{
    const from=FCS.pieces.find(x=>x.id===w.fid);
    const to=FCS.pieces.find(x=>x.id===w.tid);
    return from&&to&&from.type==='G'&&to.type==='G';
  });

  const steps=[ins.length>=3, uniqueGates.length>=4, hasLevels, outs.length>=1, false];

  steps.forEach((done,i)=>{
    const step=document.getElementById(`gstep-${i+1}`);
    const check=document.getElementById(`gscheck-${i+1}`);
    if(!step)return;
    step.classList.remove('active','done');
    if(done){step.classList.add('done');if(check)check.textContent='✓';}
    else{
      const prevDone=i===0||steps[i-1];
      if(prevDone)step.classList.add('active');
      if(check)check.textContent='○';
    }
  });
}

function clrFinal(){FCS.pieces=[];FCS.wires=[];FCS.wf=null;FCS.drag=null;document.getElementById('finalResult').style.display='none';updateGuideSteps();}

function getBoolExpr(pieceId, visited=new Set()){
  if(visited.has(pieceId))return '?';
  visited.add(pieceId);
  const p=FCS.pieces.find(x=>x.id===pieceId);
  if(!p)return '?';
  if(p.type==='I') return p.label||'?';
  if(p.type==='G'){
    const ips=fIPorts(p);
    const exprs=ips.map((_,i)=>{
      const w=FCS.wires.find(w=>w.tid===p.id&&w.tp===i);
      if(!w)return '?';
      return getBoolExpr(w.fid, new Set(visited));
    });
    switch(p.gt){
      case 'AND':  return exprs.length===2?`(${exprs[0]}·${exprs[1]})`:`(${exprs[0]})`;
      case 'OR':   return exprs.length===2?`(${exprs[0]}+${exprs[1]})`:`(${exprs[0]})`;
      case 'NOT':  return `¬${exprs[0]}`;
      case 'NAND': return exprs.length===2?`¬(${exprs[0]}·${exprs[1]})`:`¬(${exprs[0]})`;
      case 'NOR':  return exprs.length===2?`¬(${exprs[0]}+${exprs[1]})`:`¬(${exprs[0]})`;
      case 'XOR':  return exprs.length===2?`(${exprs[0]}⊕${exprs[1]})`:`(${exprs[0]})`;
      case 'XNOR': return exprs.length===2?`¬(${exprs[0]}⊕${exprs[1]})`:`¬(${exprs[0]})`;
      case 'BUFFER': return exprs[0];
      default: return '?';
    }
  }
  return '?';
}

function analyzeFinal(){
  const ins=FCS.pieces.filter(p=>p.type==='I');
  const gates=FCS.pieces.filter(p=>p.type==='G');
  const outs=FCS.pieces.filter(p=>p.type==='O');
  const uniqueGates=[...new Set(gates.map(g=>g.gt))];

  const el=document.getElementById('finalResult');
  el.style.display='block';

  const reqs=[
    {ok:ins.length>=3, msg:`Entradas (INPUT): ${ins.length} de mínimo 3`},
    {ok:uniqueGates.length>=4, msg:`Compuertas diferentes: ${uniqueGates.length} de mínimo 4 (${uniqueGates.join(', ')||'ninguna'})`},
    {ok:outs.length>=1, msg:`Salida (OUTPUT): ${outs.length>=1?'✓ presente':'✗ falta'}`},
    {ok:FCS.wires.length>=4, msg:`Conexiones (cables): ${FCS.wires.length} de mínimo 4`},
  ];

  const allOk=reqs.every(r=>r.ok);
  const reqsHtml=reqs.map(r=>`<div class="req-check ${r.ok?'ok':'fail'}">${r.ok?'✓':'✗'} ${r.msg}</div>`).join('');

  if(!allOk){
    el.innerHTML=`
      <div class="fr-title">// REQUISITOS DEL CIRCUITO</div>
      ${reqsHtml}
      <div style="margin-top:10px;padding:8px;background:rgba(255,45,107,0.08);border:1px solid rgba(255,45,107,0.3);font-size:0.72rem;color:var(--red)">
        ✗ El circuito no cumple todos los requisitos. Revisa los puntos en rojo.
      </div>`;
    showToast('✗ El circuito no cumple los requisitos mínimos','bad');
    return;
  }

  const labels=['A','B','C','D','E','F'];
  ins.forEach((inp,i)=>{inp.label=labels[i]||`X${i}`;});

  const ordered=[];
  const visited=new Set();
  function topoSort(pid){
    if(visited.has(pid))return; visited.add(pid);
    const p=FCS.pieces.find(x=>x.id===pid); if(!p||p.type==='I')return;
    fIPorts(p).forEach((_,i)=>{const w=FCS.wires.find(w=>w.tid===pid&&w.tp===i);if(w)topoSort(w.fid);});
    if(p.type==='G')ordered.push(p);
  }
  outs.forEach(o=>{const w=FCS.wires.find(w=>w.tid===o.id);if(w)topoSort(w.fid);});
  gates.forEach(g=>{if(!visited.has(g.id))topoSort(g.id);});

  const boolLevels=ordered.map((g,i)=>{
    const expr=getBoolExpr(g.id);
    return{gate:g.gt,level:i+1,expr,piece:g};
  });

  const finalExpr=outs.map((o,i)=>{
    const w=FCS.wires.find(w=>w.tid===o.id);
    return w?getBoolExpr(w.fid):'?';
  }).join(', ');

  const inLabels=ins.map((inp,i)=>labels[i]||`X${i}`);
  const combos=[];
  for(let i=0;i<Math.pow(2,ins.length);i++){
    const bits=ins.map((_,j)=>(i>>>(ins.length-1-j))&1);
    combos.push(bits);
  }

  const gateHeaders=boolLevels.map(l=>`f${l.level}(${l.gate})`);

  const tableRows=combos.map(bits=>{
    ins.forEach((inp,i)=>{inp.val=bits[i];inp.out=bits[i];});
    simFinal();
    const gateCols=boolLevels.map(l=>`<td class="v${l.piece.out}">${l.piece.out}</td>`).join('');
    const outVal=outs[0]?.out??0;
    return`<tr>${bits.map(b=>`<td class="v${b}">${b}</td>`).join('')}${gateCols}<td class="v${outVal}">${outVal}</td></tr>`;
  }).join('');

  ins.forEach(inp=>{inp.val=0;inp.out=0;});simFinal();

  const boolHtml=boolLevels.map(l=>`
    <div class="bool-level">
      <div class="bl-name">Nivel ${l.level} — Compuerta ${l.gate}</div>
      <div class="bl-fn">f${l.level} = ${l.expr}</div>
      <div class="bl-out">Operador: ${l.gate==='AND'?'Multiplicación (·)':l.gate==='OR'?'Suma (+)':l.gate==='NOT'?'Negación (¬)':l.gate==='NAND'?'NAND ¬(·)':l.gate==='NOR'?'NOR ¬(+)':l.gate==='XOR'?'XOR (⊕)':l.gate==='XNOR'?'XNOR ¬(⊕)':'Buffer'}</div>
    </div>`).join('');

  el.innerHTML=`
    <div class="fr-title">// REQUISITOS</div>
    ${reqsHtml}
    <div style="margin-top:12px;padding:8px;background:rgba(0,255,170,0.08);border:1px solid rgba(0,255,170,0.3);font-size:0.75rem;color:var(--green);font-family:'Orbitron',monospace;text-align:center">
      🎉 ¡CIRCUITO VÁLIDO! Cumple todos los requisitos
    </div>
    <div class="fr-title" style="margin-top:14px">// FUNCIÓN BOOLEANA POR NIVELES</div>
    ${boolHtml}
    <div style="margin-top:8px;padding:8px;background:rgba(255,230,0,0.08);border-left:3px solid var(--gold);font-family:'Share Tech Mono',monospace;font-size:0.78rem;color:var(--gold)">
      F(${inLabels.join(',')}) = ${finalExpr}
    </div>
    <div class="fr-title" style="margin-top:14px">// TABLA DE VERDAD COMPLETA</div>
    <div style="overflow-x:auto">
      <table class="final-tt">
        <thead><tr>
          ${inLabels.map(l=>`<th>${l}</th>`).join('')}
          ${gateHeaders.map(h=>`<th>${h}</th>`).join('')}
          <th>SALIDA</th>
        </tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>`;

  showToast('🎉 ¡Circuito analizado! Función booleana generada','ok');

  const s5=document.getElementById('gstep-5');
  const c5=document.getElementById('gscheck-5');
  if(s5){s5.classList.add('done');if(c5)c5.textContent='✓';}
}

// ── FINAL CANVAS ──────────────────────────────────────────────
function initFinalCanvas(){
  const cv = document.getElementById('finalCanvas');
  if(!cv) return;

  // ── FIX PRINCIPAL: medir el ancho real y asignar altura grande ──
  const doInit = () => {
    resizeCanvas(cv);
    cv.height = 600;

    if(finalCanvasReady){
      FCS.pieces=[]; FCS.wires=[]; simFinal(); return;
    }
    finalCanvasReady = true;

    const pos = e => {
      const r = cv.getBoundingClientRect();
      const sx = cv.width / r.width, sy = cv.height / r.height;
      return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
    };
    const tpos = e => {
      const r = cv.getBoundingClientRect();
      const t = e.touches[0];
      const sx = cv.width / r.width, sy = cv.height / r.height;
      return { x: (t.clientX - r.left) * sx, y: (t.clientY - r.top) * sy };
    };

    cv.addEventListener('mousedown', e => { e.preventDefault(); const p = pos(e); fOnDown(p.x, p.y); });
    cv.addEventListener('mousemove', e => { const p = pos(e); fOnMove(p.x, p.y); });
    cv.addEventListener('mouseup', () => fOnUp());
    cv.addEventListener('mouseleave', () => { FCS.mx = -999; FCS.my = -999; });
    cv.addEventListener('dblclick', e => { const p = pos(e); fOnDbl(p.x, p.y); });
    cv.addEventListener('contextmenu', e => e.preventDefault());
    cv.addEventListener('touchstart', e => { e.preventDefault(); const p = tpos(e); fOnDown(p.x, p.y); }, { passive: false });
    cv.addEventListener('touchmove', e => { e.preventDefault(); const p = tpos(e); fOnMove(p.x, p.y); }, { passive: false });
    cv.addEventListener('touchend', e => { e.preventDefault(); fOnUp(); }, { passive: false });

    (function loop(){ requestAnimationFrame(loop); drawFinal(); })();
  };

  // Esperar un frame para que el DOM esté visible y tenga dimensiones reales
  requestAnimationFrame(() => setTimeout(doInit, 30));
}

function fOnDown(mx,my){
  const t=FCS.tool;
  if(t==='DEL'){
    const p=fPAt(mx,my);
    if(p){FCS.pieces=FCS.pieces.filter(x=>x.id!==p.id);FCS.wires=FCS.wires.filter(w=>w.fid!==p.id&&w.tid!==p.id);simFinal();}
    else{FCS.wires=FCS.wires.filter(w=>{const fp=fOPort(w.fid),tp=fIPort(w.tid,w.tp);if(!fp||!tp)return false;const cx=(fp.x+tp.x)/2;for(let t=0;t<=1;t+=0.04){if(Math.hypot(mx-bz(fp.x,cx,cx,tp.x,t),my-bz(fp.y,fp.y,tp.y,tp.y,t))<14)return false;}return true;});simFinal();}
    return;
  }
  if(t==='WIRE'){
    const port=fNearPort(mx,my,22);
    if(!FCS.wf){if(port&&port.type==='out'){FCS.wf=port;showToast('Cable iniciado ⚡ haz clic en una ENTRADA','ok');}else showToast('Haz clic cerca del punto de SALIDA','bad');}
    else{
      if(port&&port.type==='in'&&port.pid!==FCS.wf.pid){
        if(!FCS.wires.find(w=>w.tid===port.pid&&w.tp===port.pi)){FCS.wires.push({fid:FCS.wf.pid,tid:port.pid,tp:port.pi,v:0});simFinal();showToast('✓ Cable conectado','ok');}
        else showToast('Esa entrada ya tiene cable','bad');
        FCS.wf=null;
      } else if(port&&port.type==='out'){FCS.wf=port;}
      else{FCS.wf=null;showToast('Cable cancelado','bad');}
    }return;
  }
  if(t==='MOVE'){const p=fPAt(mx,my);if(p){FCS.drag=p;FCS.dox=mx-p.x;FCS.doy=my-p.y;document.getElementById('finalCanvas').style.cursor='grabbing';}return;}

  const sel=document.getElementById('finalGateSelect');
  const gid=sel?sel.value:'AND';
  const g=GATES.find(x=>x.id===gid);
  if(t==='INPUT') FCS.pieces.push({id:PID++,type:'I',x:mx-22,y:my-18,w:44,h:36,val:0,out:0,label:''});
  else if(t==='GATE'&&g) FCS.pieces.push({id:PID++,type:'G',gt:gid,x:mx-36,y:my-26,w:72,h:52,out:0,col:g.color});
  else if(t==='OUTPUT') FCS.pieces.push({id:PID++,type:'O',x:mx-18,y:my-18,w:36,h:36,out:0});
  simFinal();
}

function fOnMove(mx,my){
  FCS.mx=mx; FCS.my=my;
  if(FCS.drag){FCS.drag.x=mx-FCS.dox;FCS.drag.y=my-FCS.doy;simFinal();}
  if(FCS.tool==='MOVE'&&!FCS.drag){const cv=document.getElementById('finalCanvas');if(cv)cv.style.cursor=fPAt(mx,my)?'grab':'default';}
}
function fOnUp(){if(FCS.drag){FCS.drag=null;const cv=document.getElementById('finalCanvas');if(cv&&FCS.tool==='MOVE')cv.style.cursor='default';}}
function fOnDbl(mx,my){const p=fPAt(mx,my);if(p&&p.type==='I'){p.val^=1;p.out=p.val;simFinal();}}

function drawFinal(){
  const cv=document.getElementById('finalCanvas');if(!cv)return;
  const ctx=cv.getContext('2d');
  const W=cv.width,H=cv.height;
  FCS.af=(FCS.af||0)+1;
  ctx.clearRect(0,0,W,H);

  // Grid dorada para el nivel final
  ctx.strokeStyle='rgba(255,230,0,0.04)';ctx.lineWidth=1;
  for(let x=0;x<W;x+=28){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let y=0;y<H;y+=28){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

  FCS.wires.forEach(w=>{
    const fp=fOPort(w.fid),tp=fIPort(w.tid,w.tp);if(!fp||!tp)return;
    const on=w.v,cx=(fp.x+tp.x)/2;
    ctx.strokeStyle=on?'#00ffaa':'#1a3550';ctx.lineWidth=on?2.5:2;
    ctx.shadowColor=on?'#00ffaa':'transparent';ctx.shadowBlur=on?8:0;
    ctx.beginPath();ctx.moveTo(fp.x,fp.y);ctx.bezierCurveTo(cx,fp.y,cx,tp.y,tp.x,tp.y);ctx.stroke();ctx.shadowBlur=0;
    if(on){const t=(FCS.af%60)/60;const px=bz(fp.x,cx,cx,tp.x,t),py=bz(fp.y,fp.y,tp.y,tp.y,t);ctx.beginPath();ctx.arc(px,py,4,0,Math.PI*2);ctx.fillStyle='#fff';ctx.shadowColor='#00ffaa';ctx.shadowBlur=14;ctx.fill();ctx.shadowBlur=0;}
  });

  if(FCS.wf){const fp=fOPort(FCS.wf.pid);if(fp){const cx=(fp.x+FCS.mx)/2;ctx.strokeStyle='#ffe60099';ctx.lineWidth=2;ctx.setLineDash([7,5]);ctx.shadowColor='#ffe600';ctx.shadowBlur=8;ctx.beginPath();ctx.moveTo(fp.x,fp.y);ctx.bezierCurveTo(cx,fp.y,cx,FCS.my,FCS.mx,FCS.my);ctx.stroke();ctx.setLineDash([]);ctx.shadowBlur=0;ctx.beginPath();ctx.arc(fp.x,fp.y,8,0,Math.PI*2);ctx.strokeStyle='#ffe600';ctx.lineWidth=2;ctx.shadowColor='#ffe600';ctx.shadowBlur=18;ctx.stroke();ctx.shadowBlur=0;}}

  if(FCS.tool==='WIRE'){
    FCS.pieces.forEach(p=>{if(!FCS.wf){const op=fOPort(p.id);if(op){ctx.beginPath();ctx.arc(op.x,op.y,9,0,Math.PI*2);ctx.strokeStyle='#ffe60055';ctx.lineWidth=1.5;ctx.stroke();}}else{fIPorts(p).forEach(ip=>{ctx.beginPath();ctx.arc(ip.x,ip.y,9,0,Math.PI*2);ctx.strokeStyle='#00ffaa55';ctx.lineWidth=1.5;ctx.stroke();})}});
    const hp=fNearPort(FCS.mx,FCS.my,22);
    if(hp){const isO=hp.type==='out';const pt=isO?fOPort(hp.pid):(fIPorts(FCS.pieces.find(x=>x.id===hp.pid))||[])[hp.pi];if(pt){ctx.beginPath();ctx.arc(pt.x,pt.y,12,0,Math.PI*2);ctx.strokeStyle=isO?'#ffe600':'#00ffaa';ctx.lineWidth=2.5;ctx.shadowColor=isO?'#ffe600':'#00ffaa';ctx.shadowBlur=22;ctx.stroke();ctx.shadowBlur=0;}}
  }

  FCS.pieces.forEach(p=>drawFinalPiece(ctx,p));
}

function drawFinalPiece(ctx,p){
  const{x,y,w,h}=p;
  if(p.type==='I'){
    const c=p.val?'#00ffaa':'#ff2d6b';
    ctx.strokeStyle=c;ctx.fillStyle=c+'18';ctx.lineWidth=2;ctx.shadowColor=c;ctx.shadowBlur=p.val?14:3;
    ctx.beginPath();ctx.roundRect(x,y,w,h,4);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
    ctx.fillStyle='#4a7090';ctx.font='bold 8px Share Tech Mono';ctx.textAlign='center';ctx.fillText(p.label||'IN',x+w/2,y+13);
    ctx.fillStyle=c;ctx.font='bold 16px Orbitron,monospace';ctx.textAlign='center';ctx.shadowColor=c;ctx.shadowBlur=p.val?14:0;
    ctx.fillText(p.val,x+w/2,y+h-7);ctx.shadowBlur=0;
    ctx.beginPath();ctx.arc(x+w,y+h/2,5,0,Math.PI*2);ctx.fillStyle=p.val?'#00ffaa':'#0d1e30';ctx.strokeStyle=c;ctx.lineWidth=1.5;ctx.shadowColor=c;ctx.shadowBlur=p.val?10:0;ctx.fill();ctx.stroke();ctx.shadowBlur=0;
    ctx.fillStyle='#1a3550';ctx.font='7px Rajdhani';ctx.textAlign='center';ctx.fillText('2x clic',x+w/2,y+h+10);
    return;
  }
  if(p.type==='O'){
    const c=p.out?'#00ffaa':'#ff2d6b';
    ctx.strokeStyle=c;ctx.fillStyle=c+'18';ctx.lineWidth=2;ctx.shadowColor=c;ctx.shadowBlur=p.out?20:5;
    ctx.beginPath();ctx.arc(x+w/2,y+h/2,h/2,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
    ctx.fillStyle=c;ctx.font='bold 16px Orbitron,monospace';ctx.textAlign='center';ctx.shadowColor=c;ctx.shadowBlur=p.out?16:0;
    ctx.fillText(p.out,x+w/2,y+h/2+6);ctx.shadowBlur=0;
    ctx.fillStyle=c+'99';ctx.font='7px Share Tech Mono';ctx.textAlign='center';ctx.fillText('OUT',x+w/2,y-7);
    ctx.beginPath();ctx.arc(x,y+h/2,5,0,Math.PI*2);ctx.fillStyle='#0d1e30';ctx.strokeStyle=c;ctx.lineWidth=1.5;ctx.fill();ctx.stroke();
    return;
  }
  if(p.type==='G'){
    const col=p.col||'#00dcff',id=p.gt;
    ctx.strokeStyle=col;ctx.lineWidth=2;ctx.fillStyle=col+'15';ctx.shadowColor=col;ctx.shadowBlur=7;
    ctx.beginPath();
    if(id==='AND'||id==='NAND'){ctx.moveTo(x,y);ctx.lineTo(x+w*.5,y);ctx.arcTo(x+w,y,x+w,y+h/2,h/2);ctx.arcTo(x+w,y+h,x+w*.5,y+h,h/2);ctx.lineTo(x,y+h);ctx.closePath();}
    else if(id==='OR'||id==='NOR'){ctx.moveTo(x,y);ctx.quadraticCurveTo(x+w*.3,y+h/2,x,y+h);ctx.quadraticCurveTo(x+w*.6,y+h,x+w,y+h/2);ctx.quadraticCurveTo(x+w*.6,y,x,y);}
    else if(id==='XOR'||id==='XNOR'){ctx.moveTo(x+7,y);ctx.quadraticCurveTo(x+w*.3+7,y+h/2,x+7,y+h);ctx.quadraticCurveTo(x+w*.6,y+h,x+w,y+h/2);ctx.quadraticCurveTo(x+w*.6,y,x+7,y);ctx.closePath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+w*.25,y+h/2,x,y+h);}
    else{ctx.moveTo(x,y);ctx.lineTo(x+w*(id==='NOT'?.8:1),y+h/2);ctx.lineTo(x,y+h);ctx.closePath();}
    ctx.fill();ctx.stroke();ctx.shadowBlur=0;
    if(['NAND','NOR','NOT','XNOR'].includes(id)){ctx.beginPath();ctx.arc(x+w+5,y+h/2,5,0,Math.PI*2);ctx.fillStyle='#03080f';ctx.fill();ctx.strokeStyle=col;ctx.shadowColor=col;ctx.shadowBlur=9;ctx.stroke();ctx.shadowBlur=0;}
    ctx.fillStyle=col;ctx.font='bold 9px Share Tech Mono,monospace';ctx.textAlign='center';ctx.fillText(id,x+w/2+(id==='XOR'||id==='XNOR'?3:0),y+h/2+3);
    fIPorts(p).forEach(ip=>{ctx.beginPath();ctx.arc(ip.x,ip.y,5,0,Math.PI*2);ctx.fillStyle='#0d1e30';ctx.strokeStyle=col;ctx.lineWidth=1.5;ctx.fill();ctx.stroke();});
    const op=fOPort(p.id);
    if(op){ctx.beginPath();ctx.arc(op.x,op.y,5,0,Math.PI*2);ctx.fillStyle=p.out?'#00ffaa':'#0d1e30';ctx.strokeStyle=col;ctx.lineWidth=1.5;ctx.shadowColor=p.out?'#00ffaa':'transparent';ctx.shadowBlur=p.out?10:0;ctx.fill();ctx.stroke();ctx.shadowBlur=0;}
  }
}

// ── INIT ─────────────────────────────────────────────────────
initData();
buildTable();
buildNavbar();