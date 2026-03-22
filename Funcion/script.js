// ============================================================
// Circufy — Simulador de Compuertas Lógicas
// Archivo: script.js
// Descripción: Lógica de la tabla de verdad y simulador de circuitos
// ============================================================

// ── BG ──────────────────────────────────────────────────────────
const bgc=document.getElementById('bgc'),bgx=bgc.getContext('2d');
bgc.width=window.innerWidth;bgc.height=window.innerHeight;
const pts=Array.from({length:40},()=>({x:Math.random()*bgc.width,y:Math.random()*bgc.height,vx:(Math.random()-.5)*.25,vy:(Math.random()-.5)*.25,r:Math.random()*.8+.3}));
(function bl(){bgx.clearRect(0,0,bgc.width,bgc.height);pts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>bgc.width)p.vx*=-1;if(p.y<0||p.y>bgc.height)p.vy*=-1;bgx.beginPath();bgx.arc(p.x,p.y,p.r,0,Math.PI*2);bgx.fillStyle='rgba(0,220,255,0.3)';bgx.fill();});for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){const d=Math.hypot(pts[i].x-pts[j].x,pts[i].y-pts[j].y);if(d<80){bgx.strokeStyle=`rgba(0,220,255,${(1-d/80)*.05})`;bgx.lineWidth=.5;bgx.beginPath();bgx.moveTo(pts[i].x,pts[i].y);bgx.lineTo(pts[j].x,pts[j].y);bgx.stroke();}}requestAnimationFrame(bl);})();

// ── GATES ────────────────────────────────────────────────────────
const GATES=[
  {id:'AND',  color:'#00dcff',rule:'Ambas=1→1',   fn:(a,b)=>a&b,  inputs:2},
  {id:'OR',   color:'#00dcff',rule:'≥1→1',         fn:(a,b)=>a|b,  inputs:2},
  {id:'NOT',  color:'#00dcff',rule:'Invierte A',   fn:(a)=>a^1,    inputs:1},
  {id:'NAND', color:'#ff2d6b',rule:'AND inv.',     fn:(a,b)=>(a&b)^1,inputs:2},
  {id:'NOR',  color:'#ff2d6b',rule:'OR inv.',      fn:(a,b)=>(a|b)^1,inputs:2},
  {id:'XOR',  color:'#ffe600',rule:'Dif→1',        fn:(a,b)=>a^b,  inputs:2},
  {id:'XNOR', color:'#ffe600',rule:'Igual→1',      fn:(a,b)=>(a^b)^1,inputs:2},
  {id:'BUFFER',color:'#00dcff',rule:'Sal=A',       fn:(a)=>a,      inputs:1},
];

let mode='10', numRows=4;
let answers=[], inputs=[];

function toD(v){return mode==='VF'?(v?'V':'F'):String(v);}
function fromD(s){s=s.trim().toUpperCase();if(s==='1'||s==='V')return 1;if(s==='0'||s==='F')return 0;return null;}
function correctAns(gi,ri){const g=GATES[gi];const{A,B}=inputs[ri];return g.inputs===1?g.fn(A):g.fn(A,B);}

function initData(){
  answers=Array.from({length:numRows},()=>Array(8).fill(null));
  inputs=Array.from({length:numRows},(_,i)=>({
    A:numRows<=4?[0,0,1,1][i]??0:(i%2?1:0),
    B:numRows<=4?[0,1,0,1][i]??0:Math.floor(i/2)%2
  }));
}

// ── TABLE ────────────────────────────────────────────────────────
function buildTable(){
  // HEAD
  let h=`<tr><th class="inp-h" style="width:28px">#</th><th class="inp-h">A</th><th class="inp-h">B</th>`;
  GATES.forEach((g,gi)=>{
    h+=`<th class="gate-h" style="min-width:78px">
      <div class="gcol-name" style="color:${g.color}">${g.id}</div>
      <span class="gcol-rule">${g.rule}</span>
      <div class="cprog"><div class="cprog-f" id="cpf-${gi}" style="background:${g.color}"></div></div>
    </th>`;
  });
  document.getElementById('thead').innerHTML=h+'</tr>';

  // BODY
  const tb=document.getElementById('tbody');tb.innerHTML='';
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
  if(corr){
    const nxt=document.getElementById(`inp-${ri+1}-${gi}`);
    if(nxt)setTimeout(()=>nxt.focus(),120);
    checkColComplete(gi);
  } else {
    showToast(`✗ ${GATES[gi].id} fila ${ri+1} — Recuerda: ${GATES[gi].rule}`,'bad');
  }
  updateAllProgress();
}

function onKey(e,ri,gi){
  const map={ArrowDown:[ri+1,gi],ArrowUp:[ri-1,gi],ArrowRight:[ri,gi+1],ArrowLeft:[ri,gi-1],Enter:[ri+1,gi]};
  if(map[e.key]){e.preventDefault();const el=document.getElementById(`inp-${map[e.key][0]}-${map[e.key][1]}`);if(el)el.focus();}
}

function checkColComplete(gi){
  const all=Array.from({length:numRows},(_,r)=>answers[r][gi]===correctAns(gi,r)).every(Boolean);
  if(all){
    showToast(`🎉 Columna ${GATES[gi].id} completa — ¡Ahora arma el circuito!`,'ok');
    unlockCircuit(gi);
  }
}

function updateAllProgress(){
  GATES.forEach((_,gi)=>{
    let c=0;
    for(let r=0;r<numRows;r++)if(answers[r][gi]!==null&&answers[r][gi]===correctAns(gi,r))c++;
    const pct=numRows?Math.round(c/numRows*100):0;
    const f=document.getElementById(`cpf-${gi}`);if(f)f.style.width=pct+'%';
  });
}

// ── CIRCUIT CARDS ────────────────────────────────────────────────
const CS={};// circuitStates per gate index
let PID=1;

function buildCircuits(){
  const grid=document.getElementById('circGrid');grid.innerHTML='';
  GATES.forEach((g,gi)=>{
    CS[gi]={pieces:[],wires:[],tool:'MOVE',wf:null,drag:null,dox:0,doy:0,mx:0,my:0,af:0};
    const card=document.createElement('div');
    card.className='circ-card';card.id=`ccard-${gi}`;
    card.innerHTML=`
      <div class="cc-header">
        <span class="cc-gate-name" style="color:${g.color}">⚡ ${g.id}</span>
        <span style="font-size:0.6rem;color:var(--dim2)">${g.rule}</span>
        <span class="cc-status" id="ccstat-${gi}">BLOQUEADO</span>
      </div>
      <div class="cc-toolbox" id="cctb-${gi}">
        <div class="tool-piece" id="tp-${gi}-MOVE" onclick="selTool(${gi},'MOVE')" title="Mover piezas">
          <svg viewBox="0 0 20 20" fill="none" style="width:18px;height:18px"><path d="M10 2L10 18M2 10L18 10M10 2L7 5M10 2L13 5M10 18L7 15M10 18L13 15M2 10L5 7M2 10L5 13M18 10L15 7M18 10L15 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg> MOVER
        </div>
        <div class="tool-piece" id="tp-${gi}-INPUT" onclick="selTool(${gi},'INPUT')" title="Agregar entrada">
          <svg viewBox="0 0 20 20" fill="none" style="width:18px;height:18px"><rect x="2" y="5" width="16" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/><text x="10" y="14" text-anchor="middle" fill="currentColor" font-size="6" font-weight="bold">IN</text></svg> INPUT
        </div>
        <div class="tool-piece" id="tp-${gi}-GATE" onclick="selTool(${gi},'GATE')" title="Agregar compuerta">
          <svg viewBox="0 0 20 20" fill="none" style="width:18px;height:18px"><path d="M3 4L3 16L9 16Q17 16 17 10Q17 4 9 4Z" stroke="currentColor" stroke-width="1.5" fill="currentColor" fill-opacity="0.1"/></svg> GATE
        </div>
        <div class="tool-piece" id="tp-${gi}-OUTPUT" onclick="selTool(${gi},'OUTPUT')" title="Agregar salida">
          <svg viewBox="0 0 20 20" fill="none" style="width:18px;height:18px"><circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5"/><text x="10" y="14" text-anchor="middle" fill="currentColor" font-size="5" font-weight="bold">OUT</text></svg> OUTPUT
        </div>
        <div class="tool-piece" id="tp-${gi}-WIRE" onclick="selTool(${gi},'WIRE')" title="Conectar con cable">
          <svg viewBox="0 0 20 20" fill="none" style="width:18px;height:18px"><line x1="2" y1="10" x2="18" y2="10" stroke="currentColor" stroke-width="2"/><circle cx="2" cy="10" r="2.5" fill="currentColor"/><circle cx="18" cy="10" r="2.5" fill="currentColor"/></svg> CABLE
        </div>
        <div class="tool-piece" id="tp-${gi}-DEL" onclick="selTool(${gi},'DEL')" title="Borrar">
          <svg viewBox="0 0 20 20" fill="none" style="width:18px;height:18px"><line x1="4" y1="4" x2="16" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="16" y1="4" x2="4" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> BORRAR
        </div>
      </div>
      <div style="padding:4px 10px;font-size:0.58rem;color:var(--dim2);background:rgba(0,0,0,0.3);" id="cc-hint-${gi}">
        Selecciona MOVER y arrastra piezas · CABLE: clic salida → clic entrada · 2x clic INPUT = toggle
      </div>
      <div class="cc-canvas-wrap">
        <canvas class="cc" id="cc-${gi}"></canvas>
        <div class="cc-locked-msg" id="cclock-${gi}">
          <div class="lk-icon">🔒</div>
          <div>Completa la columna <strong style="color:${g.color}">${g.id}</strong> en la tabla</div>
        </div>
      </div>
      <div class="cc-actions">
        <button class="cc-btn" onclick="clrCircuit(${gi})">↺ Limpiar</button>
        <button class="cc-btn verify" onclick="verifyCircuit(${gi})">⚡ Verificar</button>
      </div>`;
    grid.appendChild(card);
    setupCanvas(gi);
  });
}

function selTool(gi,tool){
  CS[gi].tool=tool;CS[gi].wf=null;
  document.querySelectorAll(`#cctb-${gi} .tool-piece`).forEach(e=>e.classList.remove('selected'));
  const btn=document.getElementById(`tp-${gi}-${tool}`);if(btn)btn.classList.add('selected');
  const cv=document.getElementById(`cc-${gi}`);
  if(!cv)return;
  const cursors={MOVE:'default',INPUT:'cell',GATE:'cell',OUTPUT:'cell',WIRE:'crosshair',DEL:'not-allowed'};
  cv.style.cursor=cursors[tool]||'default';
  const hints={
    MOVE:'Arrastra las piezas para moverlas · 2x clic en INPUT para cambiar 0/1',
    INPUT:'Haz clic en el canvas para colocar una entrada',
    GATE:'Haz clic en el canvas para colocar la compuerta',
    OUTPUT:'Haz clic en el canvas para colocar la salida',
    WIRE:'Clic en el punto de SALIDA (derecha) → luego clic en punto de ENTRADA (izquierda)',
    DEL:'Haz clic sobre una pieza o cable para eliminarlo'
  };
  const h=document.getElementById(`cc-hint-${gi}`);
  if(h)h.textContent=hints[tool]||'';
}

function unlockCircuit(gi){
  document.getElementById(`ccard-${gi}`).classList.add('unlocked');
  document.getElementById(`cclock-${gi}`).style.display='none';
  document.getElementById(`ccstat-${gi}`).textContent='ARMAR';
  selTool(gi,'MOVE');
}

function setupCanvas(gi){
  const cv=document.getElementById(`cc-${gi}`);
  if(!cv)return;
  // Set fixed size
  cv.width=320;cv.height=200;

  const pos=e=>{const r=cv.getBoundingClientRect();const sx=cv.width/r.width,sy=cv.height/r.height;return{x:(e.clientX-r.left)*sx,y:(e.clientY-r.top)*sy};};
  const tpos=e=>{const r=cv.getBoundingClientRect();const t=e.touches[0];const sx=cv.width/r.width,sy=cv.height/r.height;return{x:(t.clientX-r.left)*sx,y:(t.clientY-r.top)*sy};};

  cv.addEventListener('mousedown',e=>{e.preventDefault();const p=pos(e);onDown(gi,p.x,p.y);});
  cv.addEventListener('mousemove',e=>{const p=pos(e);onMove(gi,p.x,p.y);});
  cv.addEventListener('mouseup',e=>{onUp(gi);});
  cv.addEventListener('mouseleave',e=>{CS[gi].mx=-999;CS[gi].my=-999;});
  cv.addEventListener('dblclick',e=>{const p=pos(e);onDbl(gi,p.x,p.y);});
  cv.addEventListener('contextmenu',e=>{e.preventDefault();});
  cv.addEventListener('touchstart',e=>{e.preventDefault();const p=tpos(e);onDown(gi,p.x,p.y);},{passive:false});
  cv.addEventListener('touchmove',e=>{e.preventDefault();const p=tpos(e);onMove(gi,p.x,p.y);},{passive:false});
  cv.addEventListener('touchend',e=>{e.preventDefault();onUp(gi);},{passive:false});

  // Start render loop
  (function loop(){requestAnimationFrame(loop);draw(gi);})();
}

function onDown(gi,mx,my){
  const s=CS[gi];
  if(!document.getElementById(`ccard-${gi}`).classList.contains('unlocked'))return;
  const t=s.tool;

  if(t==='DEL'){
    // Delete piece or wire
    const p=pAt(gi,mx,my);
    if(p){s.pieces=s.pieces.filter(x=>x.id!==p.id);s.wires=s.wires.filter(w=>w.fid!==p.id&&w.tid!==p.id);sim(gi);}
    else{
      // delete wire by proximity
      s.wires=s.wires.filter(w=>{
        const fp=oPort(s,w.fid),tp=iPort(s,w.tid,w.tp);
        if(!fp||!tp)return false;
        const cx=(fp.x+tp.x)/2;
        for(let t=0;t<=1;t+=0.04){
          const bx=bz(fp.x,cx,cx,tp.x,t),by=bz(fp.y,fp.y,tp.y,tp.y,t);
          if(Math.hypot(mx-bx,my-by)<12)return false;
        }return true;
      });sim(gi);
    }
    return;
  }

  if(t==='WIRE'){
    // Find nearest port (large hit area)
    const port=nearPort(s,mx,my,22);
    if(!s.wf){
      if(port&&port.type==='out'){
        s.wf=port;
        showToast('Cable iniciado ⚡ ahora haz clic en una ENTRADA','ok');
      } else {
        showToast('Haz clic cerca del punto derecho (salida) de un componente','bad');
      }
    } else {
      if(port&&port.type==='in'&&port.pid!==s.wf.pid){
        if(!s.wires.find(w=>w.tid===port.pid&&w.tp===port.pi)){
          s.wires.push({fid:s.wf.pid,tid:port.pid,tp:port.pi,v:0});
          sim(gi);showToast('✓ Cable conectado','ok');
        } else showToast('Esa entrada ya tiene cable','bad');
        s.wf=null;
      } else if(port&&port.type==='out'){
        s.wf=port;
      } else {
        s.wf=null;showToast('Cable cancelado','bad');
      }
    }
    return;
  }

  if(t==='MOVE'){
    const p=pAt(gi,mx,my);
    if(p){s.drag=p;s.dox=mx-p.x;s.doy=my-p.y;
      document.getElementById(`cc-${gi}`).style.cursor='grabbing';}
    return;
  }

  // Place new piece
  const g=GATES[gi];
  if(t==='INPUT') s.pieces.push({id:PID++,type:'I',x:mx-22,y:my-18,w:44,h:36,val:0,out:0});
  else if(t==='GATE') s.pieces.push({id:PID++,type:'G',gt:g.id,x:mx-36,y:my-26,w:72,h:52,out:0,col:g.color});
  else if(t==='OUTPUT') s.pieces.push({id:PID++,type:'O',x:mx-18,y:my-18,w:36,h:36,out:0});
  sim(gi);
}

function onMove(gi,mx,my){
  const s=CS[gi];
  s.mx=mx;s.my=my;
  if(s.drag){s.drag.x=mx-s.dox;s.drag.y=my-s.doy;sim(gi);}
}

function onUp(gi){
  const s=CS[gi];
  if(s.drag){
    s.drag=null;
    if(s.tool==='MOVE'){
      const cursors={MOVE:'default',INPUT:'cell',GATE:'cell',OUTPUT:'cell',WIRE:'crosshair',DEL:'not-allowed'};
      const cv=document.getElementById(`cc-${gi}`);
      if(cv)cv.style.cursor=cursors[s.tool]||'default';
    }
  }
}

function onDbl(gi,mx,my){
  const p=pAt(gi,mx,my);
  if(p&&p.type==='I'){p.val^=1;p.out=p.val;sim(gi);}
}

// ── PORT HELPERS ─────────────────────────────────────────────────
function oPort(s,id){
  const p=s.pieces.find(x=>x.id===id);if(!p||p.type==='O')return null;
  const hasBubble=p.type==='G'&&['NAND','NOR','NOT','XNOR'].includes(p.gt);
  return{x:p.x+p.w+(hasBubble?10:0),y:p.y+p.h/2};
}
function iPorts(p){
  if(p.type==='I')return[];
  if(p.type==='O')return[{x:p.x,y:p.y+p.h/2}];
  const g=GATES.find(x=>x.id===p.gt);if(!g)return[];
  if(g.inputs===1)return[{x:p.x,y:p.y+p.h/2}];
  return[{x:p.x,y:p.y+p.h*.35},{x:p.x,y:p.y+p.h*.65}];
}
function iPort(s,id,pi){const p=s.pieces.find(x=>x.id===id);if(!p)return null;return iPorts(p)[pi]||null;}

function nearPort(s,mx,my,r){
  // Check output ports first
  for(const p of s.pieces){
    const op=oPort(s,p.id);
    if(op&&Math.hypot(mx-op.x,my-op.y)<r)return{pid:p.id,type:'out',pi:0};
  }
  // Check input ports
  for(const p of s.pieces){
    const ips=iPorts(p);
    for(let i=0;i<ips.length;i++){
      if(Math.hypot(mx-ips[i].x,my-ips[i].y)<r)return{pid:p.id,type:'in',pi:i};
    }
  }
  return null;
}

function pAt(gi,mx,my){
  const s=CS[gi];
  for(let i=s.pieces.length-1;i>=0;i--){
    const p=s.pieces[i];
    if(mx>=p.x-4&&mx<=p.x+p.w+4&&my>=p.y-4&&my<=p.y+p.h+4)return p;
  }return null;
}

// ── SIMULATION ───────────────────────────────────────────────────
function sim(gi){
  const s=CS[gi];
  s.pieces.forEach(p=>{p.out=p.type==='I'?p.val:0;});
  for(let pass=0;pass<12;pass++){
    s.pieces.forEach(p=>{
      if(p.type==='I')return;
      const ips=iPorts(p);
      const iv=ips.map((_,i)=>{
        const w=s.wires.find(w=>w.tid===p.id&&w.tp===i);
        if(!w)return 0;
        const src=s.pieces.find(x=>x.id===w.fid);return src?src.out:0;
      });
      if(p.type==='O'){p.out=iv[0]||0;}
      else if(p.type==='G'){
        const g=GATES.find(x=>x.id===p.gt);
        p.out=g?(g.inputs===1?g.fn(iv[0]||0):g.fn(iv[0]||0,iv[1]||0)):0;
      }
    });
  }
  s.wires.forEach(w=>{const src=s.pieces.find(x=>x.id===w.fid);w.v=src?src.out:0;});
}

function clrCircuit(gi){CS[gi].pieces=[];CS[gi].wires=[];CS[gi].wf=null;CS[gi].drag=null;}

function verifyCircuit(gi){
  const s=CS[gi];const g=GATES[gi];
  const ins=s.pieces.filter(p=>p.type==='I');
  const outs=s.pieces.filter(p=>p.type==='O');
  const gates=s.pieces.filter(p=>p.type==='G'&&p.gt===g.id);
  if(!gates.length){showToast(`✗ Agrega la compuerta ${g.id}`, 'bad');return;}
  if(!outs.length){showToast('✗ Agrega un OUTPUT','bad');return;}
  if(ins.length<g.inputs){showToast(`✗ Necesitas ${g.inputs} INPUT(s)`,'bad');return;}
  const combos=g.inputs===1?[[0],[1]]:[[0,0],[0,1],[1,0],[1,1]];
  let ok=true;
  for(const combo of combos){
    ins.forEach((inp,i)=>{inp.val=combo[i]||0;inp.out=inp.val;});
    sim(gi);
    if(outs[0].out!==(g.inputs===1?g.fn(combo[0]):g.fn(combo[0],combo[1]))){ok=false;break;}
  }
  if(ok){
    showToast(`🎉 ¡Circuito ${g.id} correcto!`,'ok');
    document.getElementById(`ccard-${gi}`).classList.add('solved');
    document.getElementById(`ccstat-${gi}`).textContent='✓ OK';
    document.getElementById(`ccstat-${gi}`).classList.add('done');
  } else {
    showToast(`✗ Incorrecto — revisa conexiones de ${g.id}`,'bad');
  }
  sim(gi);
}

// ── DRAW ─────────────────────────────────────────────────────────
function bz(p0,p1,p2,p3,t){return(1-t)**3*p0+3*(1-t)**2*t*p1+3*(1-t)*t**2*p2+t**3*p3;}

function draw(gi){
  const cv=document.getElementById(`cc-${gi}`);if(!cv)return;
  const ctx=cv.getContext('2d');
  const W=cv.width,H=cv.height;
  const s=CS[gi];s.af=(s.af||0)+1;

  ctx.clearRect(0,0,W,H);
  // grid
  ctx.strokeStyle='rgba(0,220,255,0.04)';ctx.lineWidth=1;
  for(let x=0;x<W;x+=24){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let y=0;y<H;y+=24){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

  // draw wires
  s.wires.forEach(w=>{
    const fp=oPort(s,w.fid),tp=iPort(s,w.tid,w.tp);
    if(!fp||!tp)return;
    const on=w.v,cx=(fp.x+tp.x)/2;
    ctx.strokeStyle=on?'#00ffaa':'#1a3550';ctx.lineWidth=on?2.2:1.8;
    ctx.shadowColor=on?'#00ffaa':'transparent';ctx.shadowBlur=on?8:0;
    ctx.beginPath();ctx.moveTo(fp.x,fp.y);ctx.bezierCurveTo(cx,fp.y,cx,tp.y,tp.x,tp.y);ctx.stroke();ctx.shadowBlur=0;
    if(on){
      const t=(s.af%60)/60;
      const px=bz(fp.x,cx,cx,tp.x,t),py=bz(fp.y,fp.y,tp.y,tp.y,t);
      ctx.beginPath();ctx.arc(px,py,3.5,0,Math.PI*2);
      ctx.fillStyle='#fff';ctx.shadowColor='#00ffaa';ctx.shadowBlur=14;ctx.fill();ctx.shadowBlur=0;
    }
  });

  // wire preview while connecting
  if(s.wf){
    const fp=oPort(s,s.wf.pid);
    if(fp){
      const cx=(fp.x+s.mx)/2;
      ctx.strokeStyle='#ffe60099';ctx.lineWidth=1.8;ctx.setLineDash([6,4]);
      ctx.shadowColor='#ffe600';ctx.shadowBlur=6;
      ctx.beginPath();ctx.moveTo(fp.x,fp.y);ctx.bezierCurveTo(cx,fp.y,cx,s.my,s.mx,s.my);ctx.stroke();
      ctx.setLineDash([]);ctx.shadowBlur=0;
      // dot on source
      ctx.beginPath();ctx.arc(fp.x,fp.y,7,0,Math.PI*2);
      ctx.strokeStyle='#ffe600';ctx.lineWidth=2;ctx.shadowColor='#ffe600';ctx.shadowBlur=15;ctx.stroke();ctx.shadowBlur=0;
    }
  }

  // port highlights in WIRE mode
  if(s.tool==='WIRE'){
    s.pieces.forEach(p=>{
      if(!s.wf){
        const op=oPort(s,p.id);
        if(op){
          ctx.beginPath();ctx.arc(op.x,op.y,8,0,Math.PI*2);
          ctx.strokeStyle='#ffe60066';ctx.lineWidth=1.5;ctx.stroke();
        }
      } else {
        iPorts(p).forEach(ip=>{
          ctx.beginPath();ctx.arc(ip.x,ip.y,8,0,Math.PI*2);
          ctx.strokeStyle='#00ffaa66';ctx.lineWidth=1.5;ctx.stroke();
        });
      }
    });
    // hover highlight
    const hp=nearPort(s,s.mx,s.my,22);
    if(hp){
      const isO=hp.type==='out';
      const pt=isO?oPort(s,hp.pid):(iPorts(s.pieces.find(x=>x.id===hp.pid))||[])[hp.pi];
      if(pt){
        ctx.beginPath();ctx.arc(pt.x,pt.y,11,0,Math.PI*2);
        ctx.strokeStyle=isO?'#ffe600':'#00ffaa';ctx.lineWidth=2.5;
        ctx.shadowColor=isO?'#ffe600':'#00ffaa';ctx.shadowBlur=20;ctx.stroke();ctx.shadowBlur=0;
      }
    }
  }

  // draw pieces
  s.pieces.forEach(p=>drawP(ctx,p,s,gi));
}

function drawP(ctx,p,s,gi){
  const{x,y,w,h}=p;
  if(p.type==='I'){
    const c=p.val?'#00ffaa':'#ff2d6b';
    ctx.strokeStyle=c;ctx.fillStyle=c+'18';ctx.lineWidth=2;ctx.shadowColor=c;ctx.shadowBlur=p.val?12:3;
    ctx.beginPath();ctx.roundRect(x,y,w,h,4);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
    ctx.fillStyle='#4a7090';ctx.font='bold 7px Share Tech Mono';ctx.textAlign='center';ctx.fillText('IN',x+w/2,y+11);
    ctx.fillStyle=c;ctx.font='bold 15px Orbitron,monospace';ctx.textAlign='center';ctx.shadowColor=c;ctx.shadowBlur=p.val?12:0;
    ctx.fillText(p.val,x+w/2,y+h-6);ctx.shadowBlur=0;
    // output port circle
    ctx.beginPath();ctx.arc(x+w,y+h/2,5,0,Math.PI*2);
    ctx.fillStyle=p.val?'#00ffaa':'#0d1e30';ctx.strokeStyle=c;ctx.lineWidth=1.5;
    ctx.shadowColor=c;ctx.shadowBlur=p.val?8:0;ctx.fill();ctx.stroke();ctx.shadowBlur=0;
    // hint
    ctx.fillStyle='#1a3550';ctx.font='6px Rajdhani';ctx.textAlign='center';ctx.fillText('2x clic',x+w/2,y+h+9);
    return;
  }
  if(p.type==='O'){
    const c=p.out?'#00ffaa':'#ff2d6b';
    ctx.strokeStyle=c;ctx.fillStyle=c+'18';ctx.lineWidth=2;ctx.shadowColor=c;ctx.shadowBlur=p.out?18:4;
    ctx.beginPath();ctx.arc(x+w/2,y+h/2,h/2,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
    ctx.fillStyle=c;ctx.font='bold 15px Orbitron,monospace';ctx.textAlign='center';ctx.shadowColor=c;ctx.shadowBlur=p.out?14:0;
    ctx.fillText(p.out,x+w/2,y+h/2+5);ctx.shadowBlur=0;
    ctx.fillStyle=c+'99';ctx.font='7px Share Tech Mono';ctx.textAlign='center';ctx.fillText('OUT',x+w/2,y-6);
    // input port
    ctx.beginPath();ctx.arc(x,y+h/2,5,0,Math.PI*2);
    ctx.fillStyle='#0d1e30';ctx.strokeStyle=c;ctx.lineWidth=1.5;ctx.fill();ctx.stroke();
    return;
  }
  if(p.type==='G'){
    const col=p.col||'#00dcff',id=p.gt;
    ctx.strokeStyle=col;ctx.lineWidth=2;ctx.fillStyle=col+'15';ctx.shadowColor=col;ctx.shadowBlur=6;
    ctx.beginPath();
    if(id==='AND'||id==='NAND'){ctx.moveTo(x,y);ctx.lineTo(x+w*.5,y);ctx.arcTo(x+w,y,x+w,y+h/2,h/2);ctx.arcTo(x+w,y+h,x+w*.5,y+h,h/2);ctx.lineTo(x,y+h);ctx.closePath();}
    else if(id==='OR'||id==='NOR'){ctx.moveTo(x,y);ctx.quadraticCurveTo(x+w*.3,y+h/2,x,y+h);ctx.quadraticCurveTo(x+w*.6,y+h,x+w,y+h/2);ctx.quadraticCurveTo(x+w*.6,y,x,y);}
    else if(id==='XOR'||id==='XNOR'){ctx.moveTo(x+7,y);ctx.quadraticCurveTo(x+w*.3+7,y+h/2,x+7,y+h);ctx.quadraticCurveTo(x+w*.6,y+h,x+w,y+h/2);ctx.quadraticCurveTo(x+w*.6,y,x+7,y);ctx.closePath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+w*.25,y+h/2,x,y+h);}
    else{ctx.moveTo(x,y);ctx.lineTo(x+w*(id==='NOT'?.8:1),y+h/2);ctx.lineTo(x,y+h);ctx.closePath();}
    ctx.fill();ctx.stroke();ctx.shadowBlur=0;
    if(['NAND','NOR','NOT','XNOR'].includes(id)){
      ctx.beginPath();ctx.arc(x+w+5,y+h/2,5,0,Math.PI*2);
      ctx.fillStyle='#03080f';ctx.fill();ctx.strokeStyle=col;ctx.shadowColor=col;ctx.shadowBlur=8;ctx.stroke();ctx.shadowBlur=0;
    }
    ctx.fillStyle=col;ctx.font='bold 8px Share Tech Mono,monospace';ctx.textAlign='center';
    ctx.fillText(id,x+w/2+(id==='XOR'||id==='XNOR'?3:0),y+h/2+3);
    // input ports
    iPorts(p).forEach(ip=>{
      ctx.beginPath();ctx.arc(ip.x,ip.y,5,0,Math.PI*2);
      ctx.fillStyle='#0d1e30';ctx.strokeStyle=col;ctx.lineWidth=1.5;ctx.fill();ctx.stroke();
    });
    // output port
    const op=oPort(s,p.id);
    if(op){
      ctx.beginPath();ctx.arc(op.x,op.y,5,0,Math.PI*2);
      ctx.fillStyle=p.out?'#00ffaa':'#0d1e30';ctx.strokeStyle=col;ctx.lineWidth=1.5;
      ctx.shadowColor=p.out?'#00ffaa':'transparent';ctx.shadowBlur=p.out?8:0;
      ctx.fill();ctx.stroke();ctx.shadowBlur=0;
    }
  }
}

// ── CONTROLS ─────────────────────────────────────────────────────
// ── CONTROLS ─────────────────────────────────────────────────────
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
function resetAll(){initData();buildTable();GATES.forEach((_,gi)=>{clearCircuit(gi);});}

let toastT;
function showToast(msg,type){const t=document.getElementById('toast');t.textContent=msg;t.className=`show ${type}`;clearTimeout(toastT);toastT=setTimeout(()=>t.className='',2400);}

// ── INIT ─────────────────────────────────────────────────────────
initData();buildTable();buildCircuits();

// Select INPUT tool by default on each card
GATES.forEach((_,gi)=>selectTool(gi,'INPUT'));