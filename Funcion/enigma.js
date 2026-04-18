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
    
    const label = document.createElement('div');
    label.className = 'tape-label';
    label.textContent = `Cinta ${tapeIndex + 1}`;
    tapeDiv.appendChild(label);
    
    // Show current step or first/last step
    const currentStepIndex = Math.min(state.currentStep, tape.steps.length - 1);
    const step = tape.steps[currentStepIndex];
    
    const slot = document.createElement('div');
    slot.className = 'tape-slot';
    
    if (state.currentStep < tape.steps.length && state.currentStep > 0) {
      slot.classList.add('active');
    } else if (state.currentStep >= tape.steps.length) {
      slot.classList.add('final');
    }
    
    slot.textContent = step.char;
    tapeDiv.appendChild(slot);
    
    const ruleLabel = document.createElement('div');
    ruleLabel.className = 'tape-rule';
    ruleLabel.textContent = tape.rule;
    tapeDiv.appendChild(ruleLabel);
    
    els.tapesContainer.appendChild(tapeDiv);
  });
}

// ── ANIMATION ──
function startAnimation() {
  if (state.isAnimating) return;
  
  initializeTapes();
  state.isAnimating = true;
  state.isPaused = false;
  state.currentStep = 0;
  
  updateStatus('running', 'Procesando...');
  log('Iniciando animación de cifrado', 'transition');
  
  els.btnStart.classList.add('hidden');
  els.btnPause.classList.remove('hidden');
  
  runAnimation();
}

function runAnimation() {
  if (!state.isAnimating || state.isPaused) return;
  
  const maxSteps = Math.max(...state.tapes.map(t => t.steps.length));
  
  if (state.currentStep >= maxSteps) {
    completeAnimation();
    return;
  }
  
  state.animationInterval = setTimeout(() => {
    state.currentStep++;
    updateStepDisplay();
    renderTapes();
    updateAlphabetHighlights();
    
    log(`Paso ${state.currentStep}: Procesando caracteres`, 'transition');
    
    runAnimation();
  }, state.animationSpeed);
}

function pauseAnimation() {
  state.isPaused = !state.isPaused;
  
  if (state.isPaused) {
    clearTimeout(state.animationInterval);
    updateStatus('idle', 'Pausado');
    els.btnPause.textContent = '▶ REANUDAR';
    log('Animación pausada', 'info');
  } else {
    updateStatus('running', 'Procesando...');
    els.btnPause.textContent = '⏸ PAUSAR';
    log('Animación reanudada', 'info');
    runAnimation();
  }
}

function stepForward() {
  if (!state.isAnimating || state.tapes.length === 0) {
    initializeTapes();
    state.isAnimating = true;
    state.isPaused = true;
  }
  
  const maxSteps = Math.max(...state.tapes.map(t => t.steps.length));
  
  if (state.currentStep < maxSteps) {
    state.currentStep++;
    updateStepDisplay();
    renderTapes();
    updateAlphabetHighlights();
    log(`Paso ${state.currentStep}: Avance manual`, 'info');
  } else {
    completeAnimation();
  }
}

function completeAnimation() {
  state.isAnimating = false;
  state.isPaused = false;
  clearTimeout(state.animationInterval);
  
  const finalText = state.tapes.map(t => t.finalChar).join('');
  displayResult(finalText);
  
  updateStatus('accepted', 'Completado');
  log(`Cifrado completado: ${finalText}`, 'ok');
  
  els.btnStart.classList.remove('hidden');
  els.btnPause.classList.add('hidden');
  
  showToast('¡Cifrado completado!', 'ok');
}

function updateAlphabetHighlights() {
  const fromLetters = [];
  const toLetters = [];
  const currentLetters = [];
  
  state.tapes.forEach(tape => {
    if (state.currentStep < tape.steps.length) {
      const step = tape.steps[state.currentStep];
      if (step.fromIndex !== -1) {
        fromLetters.push(ALPHABET[step.fromIndex]);
        toLetters.push(ALPHABET[step.toIndex]);
        currentLetters.push(step.char);
      }
    }
  });
  
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
