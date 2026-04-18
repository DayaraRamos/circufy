/* ============================================================
   Circufy V3 — JavaScript Logic
   Máquina de Turing Criptográfica
   ============================================================ */

const ALPHABET = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');

// ── STATE ──
const state = {
  inputText: 'HOLA',
  ruleMode: 'general', // 'general' | 'personalized'
  generalRule: { type: 'displacement', value: 3 },
  characterRules: [],
  tapes: [],
  currentStep: 0,
  subProgress: 0, // 0-1 progreso suave dentro del paso actual
  isAnimating: false,
  isPaused: false,
  animationSpeed: 500,
  highlightedLetters: { from: [], to: [], current: [] },
  animationInterval: null
};

// ── DOM ELEMENTS ──
const els = {
  inputMessage: document.getElementById('inputMessage'),
  charCount: document.getElementById('charCount'),
  btnModeGeneral: document.getElementById('btnModeGeneral'),
  btnModePersonalized: document.getElementById('btnModePersonalized'),
  panelGeneralRule: document.getElementById('panelGeneralRule'),
  panelPersonalizedRules: document.getElementById('panelPersonalizedRules'),
  generalRuleType: document.getElementById('generalRuleType'),
  generalDisplacement: document.getElementById('generalDisplacement'),
  generalDisplacementValue: document.getElementById('generalDisplacementValue'),
  rulesList: document.getElementById('rulesList'),
  rulesCount: document.getElementById('rulesCount'),
  alphabetBoard: document.getElementById('alphabetBoard'),
  tapesContainer: document.getElementById('tapesContainer'),
  speedSlider: document.getElementById('speedSlider'),
  speedValue: document.getElementById('speedValue'),
  btnStart: document.getElementById('btnStart'),
  btnPause: document.getElementById('btnPause'),
  btnStep: document.getElementById('btnStep'),
  currentStepDisplay: document.getElementById('currentStepDisplay'),
  stepBadge: document.getElementById('stepBadge'),
  consoleOutput: document.getElementById('consoleOutput'),
  btnClearConsole: document.getElementById('btnClearConsole'),
  resultDisplay: document.getElementById('resultDisplay'),
  statusDot: document.getElementById('statusDot'),
  statusText: document.getElementById('statusText'),
  toast: document.getElementById('toast')
};

// ── INIT ──
function init() {
  initBackgroundCanvas();
  initAlphabetBoard();
  initCharacterRules();
  attachEventListeners();
  updateUI();
  log('Sistema listo para operar', 'info');
}

// ── BACKGROUND CANVAS ──
function initBackgroundCanvas() {
  const canvas = document.getElementById('bgc');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  const particles = [];
  for (let i = 0; i < 50; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 2 + 1
    });
  }
  
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(0, 220, 255, 0.3)';
    
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    
    requestAnimationFrame(animate);
  }
  
  animate();
  
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}

// ── ALPHABET BOARD ──
function initAlphabetBoard() {
  els.alphabetBoard.innerHTML = '';
  ALPHABET.forEach(letter => {
    const div = document.createElement('div');
    div.className = 'alphabet-letter';
    div.textContent = letter;
    div.dataset.letter = letter;
    els.alphabetBoard.appendChild(div);
  });
}

function updateAlphabetBoard() {
  const letters = els.alphabetBoard.querySelectorAll('.alphabet-letter');
  letters.forEach(el => {
    el.classList.remove('from', 'to', 'current');
    const letter = el.dataset.letter;
    
    if (state.highlightedLetters.current.includes(letter)) {
      el.classList.add('current');
    } else if (state.highlightedLetters.from.includes(letter)) {
      el.classList.add('from');
    } else if (state.highlightedLetters.to.includes(letter)) {
      el.classList.add('to');
    }
  });
}

// ── CHARACTER RULES ──
function initCharacterRules() {
  const chars = state.inputText.split('');
  state.characterRules = chars.map((char, index) => ({
    id: `rule-${index}`,
    char: char,
    type: 'displacement',
    value: 3,
    customMap: null
  }));
  updateCharacterRulesUI();
}

function updateCharacterRulesUI() {
  if (state.ruleMode === 'personalized') {
    els.rulesList.innerHTML = '';
    
    if (state.characterRules.length === 0) {
      els.rulesList.innerHTML = '<div class="trans-empty">Configure las reglas para cada carácter</div>';
    } else {
      state.characterRules.forEach((rule, index) => {
        const div = document.createElement('div');
        div.className = 'rule-item';
        div.innerHTML = `
          <div class="rule-char">${rule.char}</div>
          <div class="rule-controls">
            <select class="tm-select" data-index="${index}" data-field="type" style="width: 120px;">
              <option value="displacement" ${rule.type === 'displacement' ? 'selected' : ''}>Desplazamiento</option>
              <option value="custom" ${rule.type === 'custom' ? 'selected' : ''}>Personalizado</option>
            </select>
            ${rule.type === 'displacement' ? `
              <input type="number" class="rule-input" data-index="${index}" data-field="value" 
                value="${rule.value}" min="-26" max="26" style="width: 60px;">
            ` : `
              <input type="text" class="rule-input" data-index="${index}" data-field="customMap" 
                value="${rule.customMap || ''}" maxlength="1" placeholder="K" style="width: 50px;">
            `}
            <span class="rule-label">→ Regla ${index + 1}</span>
          </div>
          <button class="btn-icon" data-action="reset" data-index="${index}">⟲</button>
        `;
        els.rulesList.appendChild(div);
      });
      
      // Attach event listeners to new inputs
      els.rulesList.querySelectorAll('select, input').forEach(el => {
        el.addEventListener('change', handleRuleChange);
      });
      
      els.rulesList.querySelectorAll('[data-action="reset"]').forEach(btn => {
        btn.addEventListener('click', handleRuleReset);
      });
    }
    
    els.rulesCount.textContent = `${state.characterRules.length} reglas`;
  }
}

function handleRuleChange(e) {
  const index = parseInt(e.target.dataset.index);
  const field = e.target.dataset.field;
  const value = e.target.value;
  
  if (field === 'type') {
    state.characterRules[index].type = value;
    if (value === 'custom') {
      state.characterRules[index].customMap = '';
    }
    updateCharacterRulesUI();
  } else if (field === 'value') {
    state.characterRules[index].value = parseInt(value) || 0;
  } else if (field === 'customMap') {
    state.characterRules[index].customMap = value.toUpperCase();
  }
}

function handleRuleReset(e) {
  const index = parseInt(e.target.dataset.index);
  state.characterRules[index] = {
    ...state.characterRules[index],
    type: 'displacement',
    value: 3,
    customMap: null
  };
  updateCharacterRulesUI();
  showToast('Regla reseteada', 'info');
}

// ── TRANSFORM LETTER ──
function transformLetter(char, index, type) {
  if (char === ' ') return { original: ' ', transformed: ' ', rule: 'espacio' };
  
  const charIndex = ALPHABET.indexOf(char.toUpperCase());
  if (charIndex === -1) return { original: char, transformed: char, rule: 'no-letra' };
  
  let newChar = char;
  let rule = '';
  
  const currentRule = type === 'general' 
    ? state.generalRule 
    : state.characterRules[index];
  
  if (currentRule.type === 'displacement') {
    const newIndex = (charIndex + currentRule.value + ALPHABET.length) % ALPHABET.length;
    newChar = ALPHABET[newIndex];
    rule = `${currentRule.value > 0 ? '+' : ''}${currentRule.value}`;
  } else if (currentRule.type === 'custom' && currentRule.customMap) {
    const targetIndex = ALPHABET.indexOf(currentRule.customMap.toUpperCase());
    if (targetIndex !== -1) {
      newChar = ALPHABET[targetIndex];
      rule = `${char}→${newChar}`;
    }
  }
  
  return { original: char, transformed: newChar, rule };
}

// ── INITIALIZE TAPES ──
function initializeTapes() {
  const chars = state.inputText.split('');
  state.tapes = [];
  
  chars.forEach((char, index) => {
    const charIndex = ALPHABET.indexOf(char.toUpperCase());
    
    if (charIndex === -1 || char === ' ') {
      state.tapes.push({
        steps: [{ char, fromIndex: -1, toIndex: -1, rule: 'no-change' }],
        finalChar: char,
        rule: 'no-change'
      });
      return;
    }
    
    const result = transformLetter(char, index, state.ruleMode);
    const targetIndex = ALPHABET.indexOf(result.transformed);
    
    // Calculate intermediate steps
    const steps = [];
    const distance = Math.abs(targetIndex - charIndex);
    const stepCount = Math.min(distance, 5);
    
    if (stepCount === 0) {
      steps.push({ 
        char: char, 
        fromIndex: charIndex, 
        toIndex: charIndex, 
        rule: result.rule 
      });
    } else {
      for (let i = 0; i <= stepCount; i++) {
        const progress = i / stepCount;
        const currentIndex = Math.round(charIndex + (targetIndex - charIndex) * progress);
        steps.push({
          char: ALPHABET[currentIndex],
          fromIndex: charIndex,
          toIndex: targetIndex,
          rule: result.rule
        });
      }
    }
    
    state.tapes.push({
      steps,
      finalChar: result.transformed,
      rule: result.rule
    });
  });
  
  state.currentStep = 0;
  state.subProgress = 0;
  renderTapes();
  log(`Cintas inicializadas: ${state.tapes.length} cintas creadas`, 'ok');
}

// ── RENDER TAPES ──
function renderTapes() {
  els.tapesContainer.innerHTML = '';
  
  if (state.tapes.length === 0) {
    els.tapesContainer.innerHTML = '<div class="tape-hint">Presiona "INICIAR ANIMACIÓN" para ver las cintas en acción</div>';
    return;
  }
  
  state.tapes.forEach((tape, tapeIndex) => {
    const tapeDiv = document.createElement('div');
    tapeDiv.className = 'vertical-tape';
    
    // Label de cinta
    const label = document.createElement('div');
    label.className = 'tape-label';
    label.textContent = `Cinta ${tapeIndex + 1}`;
    tapeDiv.appendChild(label);
    
    // Calcular progreso de esta cinta
    const progress = getTapeProgress(tapeIndex);
    const isDone = isTapeDone(tapeIndex);
    
    // Obtener char original y calcular shift
    const originalChar = tape.steps[0].char;
    const finalChar = tape.finalChar;
    const fromIndex = tape.steps[0].fromIndex;
    const toIndex = tape.steps[0].toIndex;
    
    let shift = 0;
    if (fromIndex !== -1 && toIndex !== -1) {
      shift = toIndex - fromIndex;
      // Normalizar shift para el camino más corto
      if (shift > 13) shift -= 26;
      if (shift < -13) shift += 26;
    }
    
    // Dirección de la flecha
    const dirArrow = shift > 0 ? '↓' : shift < 0 ? '↑' : '·';
    const dirColor = shift < 0 ? '#ff8060' : shift > 0 ? 'var(--green)' : 'var(--dim2)';
    
    // Arrow indicator
    const arrow = document.createElement('div');
    arrow.style.cssText = `
      font-size: 14px;
      color: ${dirColor};
      margin-bottom: 4px;
      letter-spacing: 1px;
      font-weight: bold;
    `;
    arrow.textContent = dirArrow;
    tapeDiv.appendChild(arrow);
    
    // Crear ventana de cinta con scrolling vertical
    const tapeWindow = createTapeWindow(originalChar, fromIndex, toIndex, shift, progress, isDone);
    tapeDiv.appendChild(tapeWindow);
    
    // Resultado final (debajo de la cinta)
    const resultDiv = document.createElement('div');
    resultDiv.style.cssText = `
      margin-top: 8px;
      font-size: 20px;
      font-weight: bold;
      height: 26px;
      color: ${isDone ? 'var(--gold)' : 'rgba(255, 230, 0, 0.15)'};
      text-shadow: ${isDone ? '0 0 8px rgba(255, 230, 0, 0.7)' : 'none'};
      transition: all 0.3s;
      font-family: 'Orbitron', monospace;
    `;
    resultDiv.textContent = isDone ? finalChar : '?';
    tapeDiv.appendChild(resultDiv);
    
    // Label de regla
    const ruleLabel = document.createElement('div');
    ruleLabel.className = 'tape-rule';
    ruleLabel.textContent = tape.rule;
    ruleLabel.style.marginTop = '6px';
    tapeDiv.appendChild(ruleLabel);
    
    els.tapesContainer.appendChild(tapeDiv);
  });
}

// ── CREATE TAPE WINDOW ──
function createTapeWindow(char, fromIndex, toIndex, shift, progress, isDone) {
  const CELL_HEIGHT = 38;
  const VISIBLE_CELLS = 7;
  const halfWindow = Math.floor(VISIBLE_CELLS / 2);
  
  // Si no es letra válida, mostrar estático
  if (fromIndex === -1) {
    const staticDiv = document.createElement('div');
    staticDiv.style.cssText = `
      width: 56px;
      height: ${VISIBLE_CELLS * CELL_HEIGHT}px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--dim);
      background: linear-gradient(180deg, #040404 0%, rgba(0, 255, 65, 0.03) 50%, #040404 100%);
      font-size: 24px;
      color: var(--dim2);
      font-family: 'Orbitron', monospace;
    `;
    staticDiv.textContent = char;
    return staticDiv;
  }
  
  // Posición animada actual (fraccionaria)
  const currentPos = fromIndex + (shift * progress);
  const centerFloat = currentPos;
  const centerInt = Math.floor(centerFloat);
  const subPixel = (centerFloat - centerInt) * CELL_HEIGHT;
  
  // Crear container de ventana
  const windowDiv = document.createElement('div');
  windowDiv.style.cssText = `
    width: 56px;
    height: ${VISIBLE_CELLS * CELL_HEIGHT}px;
    overflow: hidden;
    position: relative;
    border: 1px solid rgba(0, 255, 65, 0.15);
    background: linear-gradient(180deg, #040404 0%, rgba(0, 255, 65, 0.03) 50%, #040404 100%);
  `;
  
  // Fade superior e inferior
  const fadeOverlay = document.createElement('div');
  fadeOverlay.style.cssText = `
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 2;
    background: linear-gradient(180deg, 
      #040404 0%, 
      transparent 22%, 
      transparent 78%, 
      #040404 100%
    );
  `;
  windowDiv.appendChild(fadeOverlay);
  
  // Container de celdas que se mueve
  const scrollContainer = document.createElement('div');
  scrollContainer.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    transform: translateY(${-subPixel - CELL_HEIGHT}px);
    transition: transform 0.1s linear;
  `;
  
  // Calcular rango de celdas a mostrar
  const startPos = centerInt - halfWindow - 1;
  const endPos = centerInt + halfWindow + 1;
  
  for (let pos = startPos; pos <= endPos; pos++) {
    const alphabetIndex = ((pos % 26) + 260) % 26;
    const letterChar = ALPHABET[alphabetIndex];
    const distFromCenter = Math.abs(pos - centerFloat);
    const isCenter = distFromCenter < 0.5;
    const fade = Math.max(0, 1 - distFromCenter * 0.30);
    
    const cellDiv = document.createElement('div');
    cellDiv.style.cssText = `
      height: ${CELL_HEIGHT}px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: ${isCenter ? '24px' : Math.max(12, 16 - Math.floor(distFromCenter) * 2) + 'px'};
      font-weight: ${isCenter ? 'bold' : 'normal'};
      color: ${isCenter 
        ? (isDone ? 'var(--gold)' : 'var(--green)') 
        : `rgba(0, 255, 65, ${(fade * 0.5).toFixed(2)})`
      };
      background: ${isCenter 
        ? (isDone ? 'rgba(255, 230, 0, 0.08)' : 'rgba(0, 255, 65, 0.08)')
        : 'transparent'
      };
      border-top: ${isCenter ? (isDone ? '1px solid rgba(255, 230, 0, 0.4)' : '1px solid rgba(0, 255, 65, 0.4)') : 'none'};
      border-bottom: ${isCenter ? (isDone ? '1px solid rgba(255, 230, 0, 0.4)' : '1px solid rgba(0, 255, 65, 0.4)') : 'none'};
      letter-spacing: 1px;
      user-select: none;
      transition: color 0.1s, background 0.1s;
      font-family: 'Orbitron', monospace;
    `;
    cellDiv.textContent = letterChar;
    scrollContainer.appendChild(cellDiv);
  }
  
  windowDiv.appendChild(scrollContainer);
  return windowDiv;
}

// ── HELPER: Get tape progress ──
function getTapeProgress(tapeIndex) {
  if (state.currentStep > tapeIndex) return 1;
  if (state.currentStep === tapeIndex) return Math.min(state.subProgress || 0, 1);
  return 0;
}

// ── HELPER: Is tape done ──
function isTapeDone(tapeIndex) {
  return state.currentStep > tapeIndex || 
         (state.currentStep === tapeIndex && (state.subProgress || 0) >= 0.999) ||
         state.currentStep >= state.tapes.length;
}

// ── ANIMATION ──
function startAnimation() {
  if (state.isAnimating) return;
  
  initializeTapes();
  state.isAnimating = true;
  state.isPaused = false;
  state.currentStep = 0;
  state.subProgress = 0;
  
  updateStatus('running', 'Procesando...');
  log('Iniciando animación de cifrado', 'transition');
  
  els.btnStart.classList.add('hidden');
  els.btnPause.classList.remove('hidden');
  
  runAnimationRAF();
}

let lastTimestamp = null;
let animationFrameId = null;

function runAnimationRAF() {
  if (!state.isAnimating || state.isPaused) {
    lastTimestamp = null;
    return;
  }
  
  const maxSteps = state.tapes.length;
  
  if (state.currentStep >= maxSteps) {
    completeAnimation();
    return;
  }
  
  animationFrameId = requestAnimationFrame((timestamp) => {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const deltaTime = timestamp - lastTimestamp;
    lastTimestamp = timestamp;
    
    // Incrementar subProgress
    state.subProgress += deltaTime / state.animationSpeed;
    
    if (state.subProgress >= 1) {
      // Completar este paso y avanzar al siguiente
      state.subProgress = 0;
      state.currentStep++;
      updateStepDisplay();
      updateAlphabetHighlights();
      
      if (state.currentStep < maxSteps) {
        log(`Paso ${state.currentStep}: Procesando caracteres`, 'transition');
      }
    }
    
    // Renderizar las cintas con el progreso actual
    renderTapes();
    
    runAnimationRAF();
  });
}

function pauseAnimation() {
  state.isPaused = !state.isPaused;
  
  if (state.isPaused) {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    lastTimestamp = null;
    updateStatus('idle', 'Pausado');
    els.btnPause.textContent = '▶ REANUDAR';
    log('Animación pausada', 'info');
  } else {
    updateStatus('running', 'Procesando...');
    els.btnPause.textContent = '⏸ PAUSAR';
    log('Animación reanudada', 'info');
    lastTimestamp = null;
    runAnimationRAF();
  }
}

function stepForward() {
  if (!state.isAnimating || state.tapes.length === 0) {
    initializeTapes();
    state.isAnimating = true;
    state.isPaused = true;
    state.currentStep = 0;
    state.subProgress = 0;
  }
  
  const maxSteps = state.tapes.length;
  
  if (state.currentStep < maxSteps) {
    // Animar suavemente el subProgress de 0 a 1
    const startTime = performance.now();
    const animateSub = (timestamp) => {
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / 400, 1);
      
      state.subProgress = progress;
      renderTapes();
      updateAlphabetHighlights();
      
      if (progress < 1) {
        requestAnimationFrame(animateSub);
      } else {
        state.currentStep++;
        state.subProgress = 0;
        updateStepDisplay();
        renderTapes();
        log(`Paso ${state.currentStep}: Avance manual`, 'info');
        
        if (state.currentStep >= maxSteps) {
          completeAnimation();
        }
      }
    };
    
    requestAnimationFrame(animateSub);
  } else {
    completeAnimation();
  }
}

function completeAnimation() {
  state.isAnimating = false;
  state.isPaused = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  lastTimestamp = null;
  
  state.currentStep = state.tapes.length;
  state.subProgress = 1;
  
  const finalText = state.tapes.map(t => t.finalChar).join('');
  displayResult(finalText);
  
  updateStatus('accepted', 'Completado');
  log(`Cifrado completado: ${finalText}`, 'ok');
  
  els.btnStart.classList.remove('hidden');
  els.btnPause.classList.add('hidden');
  
  renderTapes(); // Final render
  
  showToast('¡Cifrado completado!', 'ok');
}

function updateAlphabetHighlights() {
  const fromLetters = [];
  const toLetters = [];
  const currentLetters = [];
  
  // Solo destacar la cinta activa actual
  if (state.currentStep < state.tapes.length) {
    const tape = state.tapes[state.currentStep];
    const step = tape.steps[0]; // Primer paso tiene la info from/to
    
    if (step.fromIndex !== -1) {
      fromLetters.push(ALPHABET[step.fromIndex]);
      toLetters.push(ALPHABET[step.toIndex]);
      
      // Calcular letra actual basada en subProgress
      const shift = step.toIndex - step.fromIndex;
      let normalizedShift = shift;
      if (normalizedShift > 13) normalizedShift -= 26;
      if (normalizedShift < -13) normalizedShift += 26;
      
      const currentFloat = step.fromIndex + (normalizedShift * state.subProgress);
      const currentIdx = Math.round(currentFloat);
      const normalizedIdx = ((currentIdx % 26) + 260) % 26;
      currentLetters.push(ALPHABET[normalizedIdx]);
    }
  }
  
  state.highlightedLetters = { from: fromLetters, to: toLetters, current: currentLetters };
  updateAlphabetBoard();
}

function updateStepDisplay() {
  els.currentStepDisplay.textContent = state.currentStep;
  els.stepBadge.textContent = `PASO ${state.currentStep}`;
}

// ── RESULT ──
function displayResult(text) {
  const resultDiv = els.resultDisplay.querySelector('.result-text') || 
    document.createElement('div');
  
  if (!resultDiv.parentElement) {
    resultDiv.className = 'result-text';
    els.resultDisplay.innerHTML = '';
    els.resultDisplay.appendChild(resultDiv);
  }
  
  resultDiv.textContent = text;
  resultDiv.classList.remove('empty');
}

// ── CONSOLE LOG ──
function log(message, type = 'info') {
  const line = document.createElement('div');
  line.className = `console-line ${type}`;
  line.innerHTML = `
    <span class="cl-step">[${new Date().toLocaleTimeString()}]</span>
    <span class="cl-msg">${message}</span>
  `;
  els.consoleOutput.appendChild(line);
  els.consoleOutput.scrollTop = els.consoleOutput.scrollHeight;
}

function clearConsole() {
  els.consoleOutput.innerHTML = '';
  log('Consola limpiada', 'info');
}

// ── STATUS ──
function updateStatus(status, text) {
  els.statusDot.className = `status-dot ${status}`;
  els.statusText.textContent = text;
}

// ── TOAST ──
function showToast(message, type = 'info') {
  els.toast.textContent = message;
  els.toast.className = `show ${type}`;
  setTimeout(() => {
    els.toast.classList.remove('show');
  }, 3000);
}

// ── UPDATE UI ──
function updateUI() {
  // Update character count
  els.charCount.textContent = `${state.inputText.length} caracteres → ${state.inputText.length} reglas configurables`;
  
  // Update mode panels
  if (state.ruleMode === 'general') {
    els.panelGeneralRule.classList.remove('hidden');
    els.panelPersonalizedRules.classList.add('hidden');
    els.btnModeGeneral.classList.add('active');
    els.btnModePersonalized.classList.remove('active');
  } else {
    els.panelGeneralRule.classList.add('hidden');
    els.panelPersonalizedRules.classList.remove('hidden');
    els.btnModeGeneral.classList.remove('active');
    els.btnModePersonalized.classList.add('active');
    updateCharacterRulesUI();
  }
  
  // Update general rule display
  const sign = state.generalRule.value > 0 ? '+' : '';
  els.generalDisplacementValue.textContent = `${sign}${state.generalRule.value}`;
  
  // Update speed display
  els.speedValue.textContent = `${state.animationSpeed}ms`;
}

// ── EVENT LISTENERS ──
function attachEventListeners() {
  // Input message
  els.inputMessage.addEventListener('input', (e) => {
    state.inputText = e.target.value.toUpperCase();
    initCharacterRules();
    updateUI();
  });
  
  // Mode toggle
  els.btnModeGeneral.addEventListener('click', () => {
    state.ruleMode = 'general';
    updateUI();
    log('Modo cambiado a: Regla General', 'info');
  });
  
  els.btnModePersonalized.addEventListener('click', () => {
    state.ruleMode = 'personalized';
    updateUI();
    log('Modo cambiado a: Regla Personalizada', 'info');
  });
  
  // General rule controls
  els.generalRuleType.addEventListener('change', (e) => {
    state.generalRule.type = e.target.value;
    updateUI();
  });
  
  els.generalDisplacement.addEventListener('input', (e) => {
    state.generalRule.value = parseInt(e.target.value);
    updateUI();
  });
  
  // Animation controls
  els.btnStart.addEventListener('click', startAnimation);
  els.btnPause.addEventListener('click', pauseAnimation);
  els.btnStep.addEventListener('click', stepForward);
  
  // Speed control
  els.speedSlider.addEventListener('input', (e) => {
    state.animationSpeed = parseInt(e.target.value);
    updateUI();
  });
  
  // Console
  els.btnClearConsole.addEventListener('click', clearConsole);
}

// ── START ──
init();
