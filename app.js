/**
 * Chaos Keyboard - Core Application Logic
 * Implements Web Audio dynamic synthesis, key shuffling, and interactive chaos animations.
 */

// Key definitions organized by row for standard QWERTY layout
const KEY_LAYOUT = [
  // Number row
  [
    { code: 'Backquote', label: '`', shift: '~' },
    { code: 'Digit1', label: '1', shift: '!' },
    { code: 'Digit2', label: '2', shift: '@' },
    { code: 'Digit3', label: '3', shift: '#' },
    { code: 'Digit4', label: '4', shift: '$' },
    { code: 'Digit5', label: '5', shift: '%' },
    { code: 'Digit6', label: '6', shift: '^' },
    { code: 'Digit7', label: '7', shift: '&' },
    { code: 'Digit8', label: '8', shift: '*' },
    { code: 'Digit9', label: '9', shift: '(' },
    { code: 'Digit0', label: '0', shift: ')' },
    { code: 'Minus', label: '-', shift: '_' },
    { code: 'Equal', label: '=', shift: '+' },
    { code: 'Backspace', label: 'Backspace', isSpecial: true, class: 'backspace' }
  ],
  // Top QWERTY row
  [
    { code: 'Tab', label: 'Tab', isSpecial: true, class: 'tab' },
    { code: 'KeyQ', label: 'Q' },
    { code: 'KeyW', label: 'W' },
    { code: 'KeyE', label: 'E' },
    { code: 'KeyR', label: 'R' },
    { code: 'KeyT', label: 'T' },
    { code: 'KeyY', label: 'Y' },
    { code: 'KeyU', label: 'U' },
    { code: 'KeyI', label: 'I' },
    { code: 'KeyO', label: 'O' },
    { code: 'KeyP', label: 'P' },
    { code: 'BracketLeft', label: '[', shift: '{' },
    { code: 'BracketRight', label: ']', shift: '}' },
    { code: 'Backslash', label: '\\', shift: '|' }
  ],
  // Home row
  [
    { code: 'CapsLock', label: 'Caps', isSpecial: true, class: 'caps' },
    { code: 'KeyA', label: 'A' },
    { code: 'KeyS', label: 'S' },
    { code: 'KeyD', label: 'D' },
    { code: 'KeyF', label: 'F' },
    { code: 'KeyG', label: 'G' },
    { code: 'KeyH', label: 'H' },
    { code: 'KeyJ', label: 'J' },
    { code: 'KeyK', label: 'K' },
    { code: 'KeyL', label: 'L' },
    { code: 'Semicolon', label: ';', shift: ':' },
    { code: 'Quote', label: "'", shift: '"' },
    { code: 'Enter', label: 'Enter', isSpecial: true, class: 'enter' }
  ],
  // Bottom row
  [
    { code: 'ShiftLeft', label: 'Shift', isSpecial: true, class: 'shift' },
    { code: 'KeyZ', label: 'Z' },
    { code: 'KeyX', label: 'X' },
    { code: 'KeyC', label: 'C' },
    { code: 'KeyV', label: 'V' },
    { code: 'KeyB', label: 'B' },
    { code: 'KeyN', label: 'N' },
    { code: 'KeyM', label: 'M' },
    { code: 'Comma', label: ',', shift: '<' },
    { code: 'Period', label: '.', shift: '>' },
    { code: 'Slash', label: '/', shift: '?' },
    { code: 'ShiftRight', label: 'Shift', isSpecial: true, class: 'shift' }
  ],
  // Space row
  [
    { code: 'Space', label: 'SPACE', isSpecial: true, class: 'space' }
  ]
];

// App State
let chaosScore = 0;
let isShiftActive = false;
let isCapsLock = false;
let currentBuffer = "";
let audioCtx = null;

// DOM Elements
const keyboardContainer = document.getElementById('keyboard');
const textDisplay = document.getElementById('textDisplay');
const chaosCountElem = document.getElementById('chaosCount');
const lastSynthElem = document.getElementById('lastSynth');
const entropyFreqElem = document.getElementById('entropyFreq');
const chaosOverlay = document.getElementById('chaosOverlay');
const clearBtn = document.getElementById('clearBtn');

// Key Map to lookup DOM key elements by event code
const keyElementMap = new Map();

/**
 * 1. Initialize and Render Keyboard
 */
function initKeyboard() {
  keyboardContainer.innerHTML = '';
  
  KEY_LAYOUT.forEach((rowKeys, rowIndex) => {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'keyboard-row';
    rowDiv.dataset.row = rowIndex;

    rowKeys.forEach((keyData) => {
      const keyBtn = document.createElement('button');
      keyBtn.className = `key ${keyData.class || ''}`;
      keyBtn.dataset.code = keyData.code;
      keyBtn.dataset.label = keyData.label;
      if (keyData.shift) keyBtn.dataset.shift = keyData.shift;
      if (keyData.isSpecial) keyBtn.dataset.special = 'true';

      keyBtn.textContent = keyData.label;
      
      // Store in reference map
      keyElementMap.set(keyData.code, keyBtn);

      // On-screen click listener
      keyBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        triggerKey(keyData.code, keyData);
      });

      rowDiv.appendChild(keyBtn);
    });

    keyboardContainer.appendChild(rowDiv);
  });
}

/**
 * 2. The Web Audio Chaos Synthesizer
 * Generates dynamic frequencies, random waveforms, pitch bends, and modulation
 */
function playChaosAudio() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const now = audioCtx.currentTime;
  const duration = 0.15 + Math.random() * 0.25; // 150ms to 400ms duration

  // Random synth oscillators
  const oscillatorTypes = ['sine', 'triangle', 'square', 'sawtooth'];
  const waveType = oscillatorTypes[Math.floor(Math.random() * oscillatorTypes.length)];

  // Randomized base pitch between 110Hz (A2) and 1760Hz (A6)
  // Micro-chaotic intervals and microtonal variations
  const baseFreq = 110 + Math.pow(Math.random(), 1.5) * 1650;
  const freqEnd = baseFreq * (0.3 + Math.random() * 1.8);

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();

  // Setup oscillator
  osc.type = waveType;
  osc.frequency.setValueAtTime(baseFreq, now);
  
  // Chaotic frequency slide (chirp/drop)
  if (Math.random() > 0.4) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqEnd), now + duration);
  }

  // Setup dynamic resonant filter
  filter.type = Math.random() > 0.5 ? 'lowpass' : 'bandpass';
  filter.frequency.setValueAtTime(baseFreq * (1.2 + Math.random() * 2), now);
  filter.Q.setValueAtTime(2 + Math.random() * 10, now);

  // Setup Gain ADSR envelope
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.25, now + 0.02); // Snappy attack
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration); // Smooth decay

  // Connect Audio Graph: Oscillator -> Filter -> Gain -> Destination
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);

  // Trigger
  osc.start(now);
  osc.stop(now + duration);

  // Update telemetry
  lastSynthElem.textContent = waveType.toUpperCase();
  entropyFreqElem.textContent = `${Math.round(baseFreq)} Hz`;
}

/**
 * 3. Visual Chaos: Apply dynamic transform animations & screen flashes
 */
const CHAOS_ANIMATIONS = ['chaos-spin', 'chaos-shake', 'chaos-scale', 'chaos-flip'];

function applyVisualChaos(keyElement) {
  if (!keyElement) return;

  // Clear previous animations
  CHAOS_ANIMATIONS.forEach(cls => keyElement.classList.remove(cls));

  // Force reflow
  void keyElement.offsetWidth;

  // Select a random transform animation
  const selectedAnim = CHAOS_ANIMATIONS[Math.floor(Math.random() * CHAOS_ANIMATIONS.length)];
  keyElement.classList.add(selectedAnim);

  // Random color flash on the active key
  const randomHue = Math.floor(Math.random() * 360);
  keyElement.style.backgroundColor = `hsl(${randomHue}, 85%, 35%)`;
  keyElement.style.borderColor = `hsl(${randomHue}, 100%, 70%)`;
  keyElement.style.boxShadow = `0 0 25px hsl(${randomHue}, 100%, 60%)`;

  setTimeout(() => {
    keyElement.classList.remove(selectedAnim);
    keyElement.style.backgroundColor = '';
    keyElement.style.borderColor = '';
    keyElement.style.boxShadow = '';
  }, 450);

  // Flash background overlay
  chaosOverlay.style.background = `radial-gradient(circle at center, hsla(${randomHue}, 100%, 50%, 0.35) 0%, transparent 70%)`;
  chaosOverlay.classList.remove('flash-chaos');
  void chaosOverlay.offsetWidth;
  chaosOverlay.classList.add('flash-chaos');
}

/**
 * 4. The Chaos Mechanic: Scramble positions of keys across the keyboard
 * Uses CSS flex `order` randomization to smoothly and dynamically shuffle keys
 */
function scrambleKeyboard() {
  const allKeys = Array.from(document.querySelectorAll('.key'));
  
  // Create an array of random distinct orders or random row reordering
  allKeys.forEach((key) => {
    // Random CSS flex order between 1 and 200
    const randomOrder = Math.floor(Math.random() * 200);
    key.style.order = randomOrder;

    // Small chaotic tilt/rotation on resting position
    const randomTilt = (Math.random() * 12 - 6).toFixed(1);
    key.style.transform = `rotate(${randomTilt}deg)`;
  });
}

/**
 * 5. Handle Keystrokes & Update Text Buffer
 */
function handleKeyContent(code, keyData) {
  if (!keyData) {
    // Attempt fallback from code
    if (code.startsWith('Key')) {
      const char = code.replace('Key', '');
      currentBuffer += (isShiftActive || isCapsLock) ? char.toUpperCase() : char.toLowerCase();
    } else if (code.startsWith('Digit')) {
      currentBuffer += code.replace('Digit', '');
    } else if (code === 'Space') {
      currentBuffer += ' ';
    }
  } else if (keyData.isSpecial) {
    if (keyData.code === 'Backspace') {
      currentBuffer = currentBuffer.slice(0, -1);
    } else if (keyData.code === 'Enter') {
      currentBuffer += '\n';
    } else if (keyData.code === 'Tab') {
      currentBuffer += '    ';
    } else if (keyData.code === 'Space') {
      currentBuffer += ' ';
    } else if (keyData.code === 'ShiftLeft' || keyData.code === 'ShiftRight') {
      isShiftActive = !isShiftActive;
      updateKeyLabels();
      return;
    } else if (keyData.code === 'CapsLock') {
      isCapsLock = !isCapsLock;
      updateKeyLabels();
      return;
    }
  } else {
    let char = keyData.label;
    if (isShiftActive && keyData.shift) {
      char = keyData.shift;
    } else if (isShiftActive || isCapsLock) {
      char = char.toUpperCase();
    } else {
      char = char.toLowerCase();
    }
    currentBuffer += char;
  }

  // Reset shift after single character if active
  if (isShiftActive && !code.includes('Shift')) {
    isShiftActive = false;
    updateKeyLabels();
  }

  updateDisplay();
}

function updateKeyLabels() {
  document.querySelectorAll('.key').forEach(key => {
    const special = key.dataset.special;
    if (special) return;
    
    const label = key.dataset.label;
    const shift = key.dataset.shift;

    if (isShiftActive && shift) {
      key.textContent = shift;
    } else if (isShiftActive || isCapsLock) {
      key.textContent = label.toUpperCase();
    } else {
      key.textContent = label.toLowerCase();
    }
  });
}

function updateDisplay() {
  // Update text display keeping the cursor intact
  textDisplay.innerHTML = '';
  const textNode = document.createTextNode(currentBuffer);
  const cursor = document.createElement('span');
  cursor.className = 'cursor';
  textDisplay.appendChild(textNode);
  textDisplay.appendChild(cursor);
  textDisplay.scrollTop = textDisplay.scrollHeight;
}

/**
 * Master Key Event Trigger
 */
function triggerKey(code, keyDataObj = null) {
  // 1. Increment Chaos Level
  chaosScore++;
  chaosCountElem.textContent = chaosScore;

  // 2. Play Web Audio synth chaos
  playChaosAudio();

  // 3. Find key element and execute visual transform chaos
  const keyElem = keyElementMap.get(code) || document.querySelector(`[data-code="${code}"]`);
  applyVisualChaos(keyElem);

  // 4. Update typed text content
  const foundData = keyDataObj || findKeyData(code);
  handleKeyContent(code, foundData);

  // 5. THE CHAOS MECHANIC: Scramble all keys instantly
  scrambleKeyboard();
}

function findKeyData(code) {
  for (const row of KEY_LAYOUT) {
    const match = row.find(k => k.code === code);
    if (match) return match;
  }
  return null;
}

/**
 * Physical Keyboard Listeners
 */
window.addEventListener('keydown', (e) => {
  // Prevent browser default actions for keys like Tab, Space, Backspace inside app
  if (['Tab', 'Space', 'Backspace'].includes(e.code) || e.code.startsWith('Arrow')) {
    e.preventDefault();
  }

  triggerKey(e.code);
});

// Clear Button
clearBtn.addEventListener('click', () => {
  currentBuffer = '';
  updateDisplay();
});

// Initial boot
document.addEventListener('DOMContentLoaded', () => {
  initKeyboard();
  updateDisplay();
});

