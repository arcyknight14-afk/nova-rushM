(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const ui = {
    score: document.getElementById('scoreText'),
    combo: document.getElementById('comboText'),
    hud: document.getElementById('hud'),
    waveCard: document.getElementById('waveCard'),
    wave: document.getElementById('waveText'),
    waveCount: document.getElementById('waveCountText'),
    waveCountLabel: document.getElementById('waveCountLabel'),
    hp: document.getElementById('hpText'),
    hpBar: document.getElementById('hpBar'),
    dash: document.getElementById('dashText'),
    dashBar: document.getElementById('dashBar'),
    overdrive: document.getElementById('overdriveText'),
    overdriveBar: document.getElementById('overdriveBar'),
    laser: document.getElementById('laserText'),
    laserBar: document.getElementById('laserBar'),
    mod: document.getElementById('modText'),
    challenge: document.getElementById('challengeText'),
    bossHud: document.getElementById('bossHud'),
    bossName: document.getElementById('bossNameText'),
    bossPhase: document.getElementById('bossPhaseText'),
    bossHpBar: document.getElementById('bossHpBar'),
    modeSelect: document.getElementById('modeSelect'),
    modeDescription: document.getElementById('modeDescription'),
    overlay: document.getElementById('centerOverlay'),
    menuHomeScreen: document.getElementById('menuHomeScreen'),
    menuPlayScreen: document.getElementById('menuPlayScreen'),
    playMenuBtn: document.getElementById('playMenuBtn'),
    backToMainBtn: document.getElementById('backToMainBtn'),
    upgradeOverlay: document.getElementById('upgradeOverlay'),
    upgradeChoices: document.getElementById('upgradeChoices'),
    start: document.getElementById('startBtn'),
    stickZone: document.getElementById('stickZone'),
    stickKnob: document.getElementById('stickKnob'),
    dashMobile: document.getElementById('dashMobile'),
    laserMobile: document.getElementById('laserMobile'),
    overdriveMobile: document.getElementById('overdriveMobile'),
    credits: document.getElementById('creditsOverlay'),
    creditsBtn: document.getElementById('creditsBtn'),
    creditsClose: document.getElementById('creditsCloseBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    pauseOverlay: document.getElementById('pauseOverlay'),
    resumeBtn: document.getElementById('resumeBtn'),
    pauseSettingsBtn: document.getElementById('pauseSettingsBtn'),
    pauseControlsBtn: document.getElementById('pauseControlsBtn'),
    menuBtn: document.getElementById('menuBtn'),
    recordsPanel: document.getElementById('recordsPanel'),
    customizeBtn: document.getElementById('customizeBtn'),
    customizeOverlay: document.getElementById('customizeOverlay'),
    customizeClose: document.getElementById('customizeCloseBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    settingsOverlay: document.getElementById('settingsOverlay'),
    settingsClose: document.getElementById('settingsCloseBtn'),
    controlsBtn: document.getElementById('controlsBtn'),
    controlsOverlay: document.getElementById('controlsOverlay'),
    controlsClose: document.getElementById('controlsCloseBtn'),
    effectsSelect: document.getElementById('effectsSelect'),
    shakeToggle: document.getElementById('shakeToggle'),
    soundToggle: document.getElementById('soundToggle'),
    fullscreenToggle: document.getElementById('fullscreenToggle'),
    skinSelect: document.getElementById('skinSelect'),
    skinHint: document.getElementById('skinHint')
  };

  const TAU = Math.PI * 2;
  const DPR_LIMIT = 1.25;
  function isTouchDevice() {
    return matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }
  const FX = {
    quality: 'medium',
    maxParticles: 260,
    maxShockwaves: 24,
    maxFloaters: 14,
    lowGlow: true,
    maxZenWisps: 82,
    particleScale: 0.78,
    trailChance: 0.72,
    backdropRings: 3,
    backdropAlpha: 0.72,
    wispAlpha: 0.76,
    gridAlpha: 0.82,
    starStep: 2,
    shockwaveScale: 0.82
  };

  const SETTINGS_KEY = 'novaRushSettingsV1';
  const RECORDS_KEY = 'novaRushRecordsV1';
  const defaultSettings = { quality: 'medium', shake: true, sound: true, skin: 'nova' };
  let settings = loadSettings();
  let records = loadRecords();

  function loadSettings() {
    try { return { ...defaultSettings, ...(JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') || {}) }; }
    catch { return { ...defaultSettings }; }
  }

  function saveSettings() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch {}
  }

  function skinDefs() {
    return {
      nova: { id:'nova', name:'Nova', short:'базовый', hint:'Стандартное ядро Nova Rush.', primary:'#8cf8ff', secondary:'#d875ff', aura:'#37f8ff' },
      prism: { id:'prism', name:'Prism', short:'волна 15', hint:'Открывается за достижение: дойти до 15-й волны в Classic.', primary:'#9efbff', secondary:'#8f9cff', aura:'#7cecff', unlock: r => (r.bestWave || 0) >= 15 },
      eclipse: { id:'eclipse', name:'Eclipse', short:'комбо x25', hint:'Открывается за достижение: собрать комбо x25.', primary:'#ffffff', secondary:'#ff68f0', aura:'#9f6bff', unlock: r => (r.bestCombo || 1) >= 25 },
      aegis: { id:'aegis', name:'Aegis', short:'50 разломов', hint:'Открывается за достижение: закрыть 50 разломов в Rift.', primary:'#d4fff2', secondary:'#5affd7', aura:'#52ff8f', unlock: r => (r.bossBest || 0) >= 50 },
      phantom: { id:'phantom', name:'Phantom', short:'Survival 3:00', hint:'Открывается за достижение: прожить 3:00 в Survival.', primary:'#eff8ff', secondary:'#73a6ff', aura:'#8cf8ff', unlock: r => (r.rushBestTime || 0) >= 180 },
      monolith: { id:'monolith', name:'Monolith', short:'One HP волна 6', hint:'Открывается за достижение: дойти до 6-й волны в One HP.', primary:'#fff0d8', secondary:'#ffe35a', aura:'#ffbf52', unlock: r => (r.oneHpBest || 0) >= 6 }
    };
  }

  function isSkinUnlocked(id) {
    const defs = skinDefs();
    const skin = defs[id] || defs.nova;
    return !skin.unlock || skin.unlock(records || {});
  }

  function getSelectedSkin() {
    const defs = skinDefs();
    const id = settings.skin in defs ? settings.skin : 'nova';
    return isSkinUnlocked(id) ? defs[id] : defs.nova;
  }


  function isFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
  }

  async function toggleFullscreen() {
    try {
      if (isFullscreen()) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      } else {
        const target = document.documentElement;
        if (target.requestFullscreen) await target.requestFullscreen();
        else if (target.webkitRequestFullscreen) target.webkitRequestFullscreen();
      }
    } catch (e) {
      console.warn('Fullscreen toggle failed', e);
    } finally {
      renderSettingsUI();
    }
  }

  function loadRecords() {
    try {
      return { bestScore:0, bestWave:0, bestCombo:1, rushBestScore:0, rushBestTime:0, bossBest:0, oneHpBest:0, runs:0, ...(JSON.parse(localStorage.getItem(RECORDS_KEY) || '{}') || {}) };
    } catch {
      return { bestScore:0, bestWave:0, bestCombo:1, rushBestScore:0, rushBestTime:0, bossBest:0, oneHpBest:0, runs:0 };
    }
  }

  function saveRecords() {
    try { localStorage.setItem(RECORDS_KEY, JSON.stringify(records)); } catch {}
  }

  function applySettings() {
    const q = settings.quality || 'medium';
    FX.quality = q;

    if (q === 'low') {
      FX.lowGlow = true;
      FX.maxParticles = 95;
      FX.maxShockwaves = 7;
      FX.maxZenWisps = 24;
      FX.particleScale = 0.34;
      FX.trailChance = 0.25;
      FX.backdropRings = 1;
      FX.backdropAlpha = 0.26;
      FX.wispAlpha = 0.32;
      FX.gridAlpha = 0.45;
      FX.starStep = 4;
      FX.shockwaveScale = 0.42;
    } else if (q === 'high') {
      FX.lowGlow = false;
      FX.maxParticles = 520;
      FX.maxShockwaves = 42;
      FX.maxZenWisps = 145;
      FX.particleScale = 1.28;
      FX.trailChance = 1;
      FX.backdropRings = 6;
      FX.backdropAlpha = 1.15;
      FX.wispAlpha = 1.15;
      FX.gridAlpha = 1.05;
      FX.starStep = 1;
      FX.shockwaveScale = 1.22;
    } else {
      FX.lowGlow = true;
      FX.maxParticles = 240;
      FX.maxShockwaves = 20;
      FX.maxZenWisps = 76;
      FX.particleScale = 0.74;
      FX.trailChance = 0.68;
      FX.backdropRings = 3;
      FX.backdropAlpha = 0.72;
      FX.wispAlpha = 0.76;
      FX.gridAlpha = 0.82;
      FX.starStep = 2;
      FX.shockwaveScale = 0.80;
    }

    // Apply immediately, not only to newly spawned effects.
    if (particles.length > FX.maxParticles) particles.length = FX.maxParticles;
    if (shockwaves.length > FX.maxShockwaves) shockwaves.length = FX.maxShockwaves;
    if (zenWisps.length > FX.maxZenWisps) zenWisps.length = FX.maxZenWisps;
    document.documentElement.dataset.fxQuality = q;
    renderSettingsUI();
    updateAmbient();
  }

  function renderSettingsUI() {
    if (!isSkinUnlocked(settings.skin)) settings.skin = 'nova';
    if (ui.effectsSelect) {
      ui.effectsSelect.querySelectorAll('button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.quality === settings.quality);
        btn.setAttribute('aria-pressed', btn.dataset.quality === settings.quality ? 'true' : 'false');
      });
    }
    if (ui.shakeToggle) {
      ui.shakeToggle.classList.toggle('active', !!settings.shake);
      ui.shakeToggle.textContent = settings.shake ? 'Вкл' : 'Выкл';
    }
    if (ui.soundToggle) {
      ui.soundToggle.classList.toggle('active', !!settings.sound);
      ui.soundToggle.textContent = settings.sound ? 'Вкл' : 'Выкл';
    }
    if (ui.fullscreenToggle) {
      const on = isFullscreen();
      ui.fullscreenToggle.classList.toggle('active', on);
      ui.fullscreenToggle.textContent = on ? 'Вкл' : 'Выкл';
      ui.fullscreenToggle.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    if (ui.skinSelect) {
      const defs = skinDefs();
      ui.skinSelect.innerHTML = Object.values(defs).map(skin => {
        const unlocked = isSkinUnlocked(skin.id);
        const active = settings.skin === skin.id && unlocked;
        return `<button type="button" class="skin-btn${active ? ' active' : ''}${unlocked ? '' : ' locked'}" data-skin="${skin.id}" aria-pressed="${active ? 'true' : 'false'}">
          <span class="skin-swatch ${skin.id}"></span>
          <b>${skin.name}</b>
          <small>${unlocked ? skin.short : 'закрыт'}</small>
        </button>`;
      }).join('');
      const activeSkin = getSelectedSkin();
      if (ui.skinHint) ui.skinHint.textContent = `${activeSkin.name}: ${activeSkin.hint} Все скины только косметические.`;
    }
  }

  function renderRecords() {
    if (!ui.recordsPanel) return;
    const fmt = n => Math.floor(n || 0).toLocaleString('ru-RU');
    const timeFmt = n => formatTime(n || 0);
    ui.recordsPanel.innerHTML = `<b>Records</b><div class="records-grid">
      <span><small>Счет</small><strong>${fmt(records.bestScore)}</strong></span>
      <span><small>Волна</small><strong>${fmt(records.bestWave)}</strong></span>
      <span><small>Комбо</small><strong>x${fmt(records.bestCombo || 1)}</strong></span>
      <span><small>Survival</small><strong>${timeFmt(records.rushBestTime || 0)}</strong></span>
      <span><small>Разломы</small><strong>${fmt(records.bossBest)}</strong></span>
    </div>`;
  }

  // Asset-based Sci-Fi SFX. The game now prefers real audio files from assets/sfx,
  // and falls back to tiny WebAudio synths if a file is missing or blocked by browser policy.
  let audioCtx = null;
  let audioUnlocked = false;
  let lastSfxAt = Object.create(null);
  let ambientAudio = null;
  let ambientStarted = false;
  const ambientFile = 'assets/sfx/ambient_wormhole_v42.ogg';

  function ambientVolume() {
    const q = settings.quality || 'medium';
    if (q === 'low') return 0.13;
    if (q === 'high') return 0.22;
    return 0.17;
  }

  function ensureAmbient() {
    if (ambientAudio) return ambientAudio;
    try {
      ambientAudio = new Audio(ambientFile);
      ambientAudio.loop = true;
      ambientAudio.preload = 'auto';
      ambientAudio.volume = ambientVolume();
    } catch {}
    return ambientAudio;
  }

  function startAmbient() {
    if (!settings.sound) return;
    const a = ensureAmbient();
    if (!a) return;
    try {
      a.volume = ambientVolume();
      const pr = a.play();
      if (pr && pr.catch) pr.catch(() => {});
      ambientStarted = true;
    } catch {}
  }

  function stopAmbient() {
    if (!ambientAudio) return;
    try { ambientAudio.pause(); ambientAudio.currentTime = 0; } catch {}
    ambientStarted = false;
  }

  function updateAmbient() {
    const a = ensureAmbient();
    if (!a) return;
    a.volume = settings.sound ? ambientVolume() : 0;
    if (settings.sound && audioUnlocked && ambientStarted && a.paused) startAmbient();
    if (!settings.sound && !a.paused) { try { a.pause(); } catch {} }
  }

  const sfxFiles = {
    dash: 'assets/sfx/dash_warp_v42.ogg',
    enemy: 'assets/sfx/enemy.ogg',
    explode: 'assets/sfx/explode.ogg',
    shield: ['assets/sfx/shield.ogg', 'assets/sfx/gp_shield_alt.ogg'],
    hurt: ['assets/sfx/hurt.ogg', 'assets/sfx/gp_hurt_alt.ogg'],
    overdrive: 'assets/sfx/overdrive.ogg',
    bossHit: ['assets/sfx/bossHit.ogg', 'assets/sfx/gp_boss_hit_ui.ogg'],
    bossHitRico: 'assets/sfx/bossHit_ricochet_v43.ogg',
    bossDown: 'assets/sfx/bossDown.ogg',
    bossSpawn: ['assets/sfx/bossSpawn.ogg', 'assets/sfx/gp_boss_spawn_alt.ogg'],
    bossLaser: 'assets/sfx/bossLaser_implode_v43.ogg',
    bossSeeker: 'assets/sfx/bossSeeker.ogg',
    bossPulse: 'assets/sfx/bossPulse.ogg',
    bossShield: 'assets/sfx/bossShield.ogg',
    nodeDown: ['assets/sfx/nodeDown.ogg', 'assets/sfx/gp_node_alt.ogg'],
    mirrorEcho: ['assets/sfx/mirrorEcho_single_shot_v43.ogg', 'assets/sfx/gp_mirror_glitch.ogg'],
    enemyCharge: 'assets/sfx/enemyCharge.ogg',
    needle: 'assets/sfx/needle.ogg',
    mineDeploy: 'assets/sfx/mineDeploy.ogg',
    rift: ['assets/sfx/rift.ogg', 'assets/sfx/gp_rift_glitch.ogg'],
    laserTiny: 'assets/sfx/laserTiny.ogg',
    upgrade: ['assets/sfx/upgrade.ogg', 'assets/sfx/gp_upgrade_alt.ogg', 'assets/sfx/ui_upgrade.ogg'],
    pickup: ['assets/sfx/pickup.ogg', 'assets/sfx/gp_pickup_alt.ogg'],
    shoot: 'assets/sfx/shoot.ogg',
    mine: 'assets/sfx/mine.ogg',

    // UI pack sounds
    uiHover: 'assets/sfx/ui_hover.ogg',
    uiClick: ['assets/sfx/ui_click_a.ogg', 'assets/sfx/ui_click_b.ogg'],
    uiBack: 'assets/sfx/ui_back.ogg',
    uiOpen: 'assets/sfx/ui_open.ogg',
    uiClose: 'assets/sfx/ui_close.ogg',
    uiSelect: 'assets/sfx/ui_select.ogg',
    uiToggle: 'assets/sfx/ui_toggle.ogg',
    uiConfirm: 'assets/sfx/ui_confirm.ogg',
    uiUpgrade: 'assets/sfx/ui_upgrade.ogg',
    uiDenied: 'assets/sfx/ui_denied.ogg'
  };

  const sfxVolumes = {
    dash: 0.36,
    enemy: 0.32,
    explode: 0.46,
    shield: 0.36,
    hurt: 0.42,
    overdrive: 0.42,
    bossHit: 0.34,
    bossHitRico: 0.31,
    bossDown: 0.50,
    bossSpawn: 0.34,
    bossLaser: 0.30,
    bossSeeker: 0.25,
    bossPulse: 0.38,
    bossShield: 0.33,
    nodeDown: 0.23,
    mirrorEcho: 0.24,
    enemyCharge: 0.25,
    needle: 0.22,
    mineDeploy: 0.21,
    rift: 0.25,
    laserTiny: 0.25,
    upgrade: 0.34,
    pickup: 0.20,
    shoot: 0.23,
    mine: 0.26,
    uiHover: 0.12,
    uiClick: 0.20,
    uiBack: 0.18,
    uiOpen: 0.18,
    uiClose: 0.16,
    uiSelect: 0.18,
    uiToggle: 0.18,
    uiConfirm: 0.24,
    uiUpgrade: 0.20,
    uiDenied: 0.18
  };

  const sfxPools = Object.create(null);
  const lastAssetVariant = Object.create(null);
  let lastBossHitSfx = null;

  function buildSfxPool() {
    Object.entries(sfxFiles).forEach(([name, src]) => {
      if (sfxPools[name]) return;
      const urls = Array.isArray(src) ? src : [src];
      const baseSize = ['pickup','enemy','shoot','laserTiny','needle','bossSeeker','mirrorEcho'].includes(name) ? 3 : 2;
      const copiesPerVariant = name.startsWith('ui') ? 2 : baseSize;
      sfxPools[name] = [];
      for (const url of urls) {
        for (let i = 0; i < copiesPerVariant; i++) {
          const a = new Audio(url);
          a.preload = 'auto';
          a.volume = sfxVolumes[name] || 0.35;
          a.dataset.variant = url;
          sfxPools[name].push(a);
        }
      }
    });
  }

  buildSfxPool();

  function unlockAudio() {
    if (audioUnlocked || !settings.sound) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    try {
      if (AC) {
        audioCtx = audioCtx || new AC();
        if (audioCtx.state === 'suspended') audioCtx.resume();
      }
      Object.values(sfxPools).flat().forEach(a => { try { a.load(); } catch {} });
      const amb = ensureAmbient();
      if (amb) { try { amb.load(); } catch {} }
      audioUnlocked = true;
      if (ambientStarted) startAmbient();
    } catch {}
  }

  function sfxAllowed(name, gap = 0.035) {
    if (!settings.sound) return false;
    const now = performance.now() / 1000;
    if ((lastSfxAt[name] || 0) + gap > now) return false;
    lastSfxAt[name] = now;
    return true;
  }

  function playAssetSfx(name, intensity = 1) {
    const pool = sfxPools[name];
    if (!pool || !pool.length) return false;
    const ready = pool.filter(x => x.paused || x.ended);
    let candidates = ready.length ? ready : pool;
    if (candidates.length > 1 && lastAssetVariant[name]) {
      const filtered = candidates.filter(x => x.dataset.variant !== lastAssetVariant[name]);
      if (filtered.length) candidates = filtered;
    }
    const a = candidates[Math.floor(Math.random() * candidates.length)];
    try {
      a.pause();
      a.currentTime = 0;
      a.volume = Math.max(0, Math.min(0.75, (sfxVolumes[name] || 0.35) * Math.max(0.35, Math.min(1.6, intensity))));
      lastAssetVariant[name] = a.dataset.variant || '';
      const pr = a.play();
      if (pr && pr.catch) pr.catch(() => synthSfx(name, intensity));
      return true;
    } catch {
      return false;
    }
  }

  function tone(freq, duration = 0.08, type = 'sine', gain = 0.035, slide = 1) {
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide !== 1) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t + duration);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(g); g.connect(audioCtx.destination);
    osc.start(t); osc.stop(t + duration + 0.03);
  }

  function noise(duration = 0.08, gain = 0.025, filterFreq = 800) {
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    const len = Math.max(1, Math.floor(audioCtx.sampleRate * duration));
    const buffer = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = audioCtx.createBufferSource();
    const filt = audioCtx.createBiquadFilter();
    const g = audioCtx.createGain();
    filt.type = 'lowpass';
    filt.frequency.value = filterFreq;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    src.buffer = buffer;
    src.connect(filt); filt.connect(g); g.connect(audioCtx.destination);
    src.start(t); src.stop(t + duration + 0.02);
  }

  function synthSfx(name, intensity = 1) {
    const g = Math.min(1.8, Math.max(0.25, intensity));
    if (!audioCtx) return;
    if (name === 'dash') { tone(520, 0.055, 'triangle', 0.020*g, 0.42); noise(0.070, 0.018*g, 5200); setTimeout(() => tone(140, 0.055, 'sine', 0.018*g, 0.62), 22); }
    else if (name === 'enemy') { tone(420, 0.045, 'triangle', 0.020*g, 1.55); }
    else if (name === 'explode') { tone(90, 0.11, 'sine', 0.045*g, 0.55); noise(0.12, 0.030*g, 900); }
    else if (name === 'shield') { tone(220, 0.08, 'square', 0.025*g, 0.72); noise(0.055, 0.015*g, 1400); }
    else if (name === 'hurt') { tone(120, 0.13, 'sawtooth', 0.040*g, 0.65); noise(0.10, 0.020*g, 700); }
    else if (name === 'overdrive') { tone(180, 0.28, 'sawtooth', 0.035*g, 3.2); setTimeout(() => tone(540, 0.12, 'triangle', 0.022*g, 1.35), 80); }
    else if (name === 'bossHit') { tone(75, 0.09, 'sine', 0.045*g, 0.72); tone(260, 0.055, 'square', 0.014*g, 1.2); }
    else if (name === 'bossHitRico') { tone(620, 0.055, 'square', 0.018*g, 0.55); noise(0.045, 0.010*g, 4200); }
    else if (name === 'bossDown') { tone(130, 0.28, 'sawtooth', 0.045*g, 0.55); noise(0.22, 0.035*g, 1000); }
    else if (name === 'upgrade') { tone(330, 0.06, 'triangle', 0.025*g, 1.35); setTimeout(() => tone(520, 0.07, 'triangle', 0.020*g, 1.25), 65); }
    else if (name === 'pickup') { tone(720, 0.035, 'sine', 0.012*g, 1.18); }
    else if (name === 'shoot') { tone(620, 0.04, 'square', 0.018*g, 1.8); }
    else if (name === 'mine') { tone(280, 0.05, 'triangle', 0.015*g, 0.7); }
    else if (name === 'bossLaser') { tone(520, 0.11, 'sawtooth', 0.025*g, 1.9); }
    else if (name === 'bossSeeker') { tone(880, 0.04, 'sine', 0.014*g, 1.25); }
    else if (name === 'bossPulse') { tone(110, 0.13, 'sawtooth', 0.032*g, 0.7); noise(0.08, 0.018*g, 900); }
    else if (name === 'bossSpawn') { tone(170, 0.24, 'sawtooth', 0.025*g, 1.7); }
    else if (name === 'bossShield') { tone(260, 0.12, 'triangle', 0.020*g, 0.8); }
    else if (name === 'nodeDown') { tone(760, 0.035, 'square', 0.014*g, 0.85); }
    else if (name === 'enemyCharge') { tone(420, 0.08, 'sawtooth', 0.018*g, 1.8); }
    else if (name === 'needle') { tone(920, 0.035, 'triangle', 0.012*g, 1.8); }
    else if (name === 'mineDeploy') { tone(360, 0.035, 'square', 0.010*g, 0.9); }
    else if (name === 'mirrorEcho') { tone(560, 0.045, 'square', 0.018*g, 1.25); noise(0.035, 0.010*g, 3200); }
    else if (name === 'rift') { tone(210, 0.13, 'sawtooth', 0.018*g, 1.4); }
    else if (name === 'laserTiny') { tone(740, 0.035, 'square', 0.012*g, 1.4); }
    else if (name === 'uiHover') { tone(920, 0.035, 'sine', 0.008*g, 1.08); }
    else if (name === 'uiClick') { tone(520, 0.045, 'triangle', 0.013*g, 1.18); }
    else if (name === 'uiBack' || name === 'uiClose') { tone(360, 0.055, 'triangle', 0.012*g, 0.82); }
    else if (name === 'uiOpen' || name === 'uiSelect') { tone(480, 0.070, 'sine', 0.014*g, 1.45); }
    else if (name === 'uiToggle') { tone(410, 0.050, 'square', 0.010*g, 1.25); }
    else if (name === 'uiConfirm' || name === 'uiUpgrade') { tone(540, 0.065, 'triangle', 0.014*g, 1.36); setTimeout(() => tone(820, 0.055, 'sine', 0.010*g, 1.12), 45); }
    else if (name === 'uiDenied') { tone(190, 0.075, 'sawtooth', 0.014*g, 0.65); }
  }

  function playBossHitSfx(intensity = 1) {
    const variants = ['bossHit', 'bossHitRico'];
    let key = variants[Math.floor(Math.random() * variants.length)];
    if (variants.length > 1 && key === lastBossHitSfx) {
      key = variants.find(v => v !== lastBossHitSfx) || key;
    }
    lastBossHitSfx = key;
    playSfx(key, intensity);
  }

  function playSfx(name, intensity = 1) {
    const gap = name === 'pickup' ? 0.018
      : (name === 'uiHover' ? 0.075
      : (name.startsWith('ui') ? 0.035
      : (['shoot','laserTiny','needle','bossSeeker'].includes(name) ? 0.035
      : (name === 'enemyCharge' ? 0.18 : 0.045))));
    if (!sfxAllowed(name, gap)) return;
    unlockAudio();
    if (!playAssetSfx(name, intensity)) synthSfx(name, intensity);
  }

  function updateRecords(reason) {
    const bossDefeated = Math.max(0, (state.bossIndex || 0) - (state.mode === 'boss' && reason !== 'GAME OVER' ? 0 : 0));
    records.runs = (records.runs || 0) + 1;
    records.bestScore = Math.max(records.bestScore || 0, Math.floor(state.score || 0));
    records.bestWave = Math.max(records.bestWave || 0, state.mode === 'classic' || state.mode === 'onehp' ? (state.wave || 0) : 0);
    records.bestCombo = Math.max(records.bestCombo || 1, state.bestCombo || 1);
    if (state.mode === 'rush') {
      records.rushBestScore = Math.max(records.rushBestScore || 0, Math.floor(state.score || 0));
      records.rushBestTime = Math.max(records.rushBestTime || 0, Math.floor(runTimer || state.time || 0));
    }
    if (state.mode === 'boss') records.bossBest = Math.max(records.bossBest || 0, state.riftsClosed || 0);
    if (state.mode === 'onehp') records.oneHpBest = Math.max(records.oneHpBest || 0, state.wave || 0);
    saveRecords();
    renderRecords();
    renderSettingsUI();
  }

  let W = 1, H = 1, DPR = 1;
  let last = performance.now();
  let running = false;
  let paused = false;
  let gameOver = false;
  let shake = 0;
  let flash = 0;
  let slowMo = 1;
  let hueShift = 0;
  let spawnTimer = 0;
  let waveTimer = 0;
  let arenaPulse = 0;
  let choosingUpgrade = false;
  let selectedMode = 'classic';
  let runTimer = 0;
  let upgradeLock = false;
  let blastDepth = 0;
  let zenSpawnTimer = 0;
  let zenPulseTimer = 0;
  let rewardType = 'upgrade';

  const keys = new Set();
  const pointer = { x: 0, y: 0, down: false, active: false };
  const mobileMove = { x: 0, y: 0, active: false, id: null };

  const state = {
    score: 0,
    combo: 1,
    comboTimer: 0,
    wave: 1,
    killsInWave: 0,
    spawnedInWave: 0,
    requiredKills: 12,
    bestCombo: 1,
    time: 0,
    overdrive: 0,
    overdriveTime: 0,
    feverTime: 0,
    modifier: null,
    bossAlive: false,
    bossType: null,
    bossIndex: 0,
    waveClosing: false,
    challenge: null,
    challengeDone: false,
    challengeBonusPending: false,
    noDamageTimer: 0,
    pickupsCollected: 0,
    chainBest: 0,
    dashKills: 0,
    mode: 'classic',
    upgradesTaken: [],
    relics: [],
    relicKills: 0,
    pendingRelic: false
  };

  const player = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    r: 16,
    hp: 100,
    maxHp: 100,
    speed: 780,
    drag: 0.9,
    dashCooldown: 0,
    dashMax: 0.82,
    dashTime: 0,
    dashAttackTime: 0,
    dashVectorX: 1,
    dashVectorY: 0,
    laserCooldown: 0,
    laserMax: 3.0,
    invuln: 0,
    bossBumpLock: 0,
    trail: [],
    magnet: 160,
    novaRadius: 120,
    chainChance: 0.0,
    pickupHeal: 1.8,
    visual: { dash: 0, shield: 0, magnet: 0, chain: 0, core: 0, coolant: 0 }
  };

  const enemies = [];
  const particles = [];
  const shockwaves = [];
  const pickups = [];
  const hazards = [];
  const zones = [];
  const playerBeams = [];
  const floaters = [];
  const stars = [];
  const zenWisps = [];

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, DPR_LIMIT);
    W = Math.floor(window.innerWidth);
    H = Math.floor(window.innerHeight);
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    buildStars();
    if (!pointer.active) { pointer.x = W / 2; pointer.y = H / 2; }
    if (!running) {
      player.x = W / 2;
      player.y = H / 2;
    }
  }

  function buildStars() {
    stars.length = 0;
    const count = Math.floor((W * H) / 22000);
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        z: Math.random() * 1 + 0.2,
        a: Math.random() * 0.6 + 0.18,
        s: Math.random() * 1.8 + 0.3
      });
    }
  }

  function setMenuScreen(screen = 'home') {
    if (ui.menuHomeScreen) ui.menuHomeScreen.classList.toggle('is-active', screen === 'home');
    if (ui.menuPlayScreen) ui.menuPlayScreen.classList.toggle('is-active', screen === 'play');
  }

  function syncPauseButton() {
    const overlayOpen = [ui.overlay, ui.upgradeOverlay, ui.credits, ui.settingsOverlay, ui.customizeOverlay, ui.controlsOverlay, ui.pauseOverlay].some(el => el && el.classList.contains('show'));
    document.body.classList.toggle('menu-open', !!overlayOpen || !running || gameOver);
    if (!ui.pauseBtn) return;
    ui.pauseBtn.style.display = (running && !gameOver && !overlayOpen) ? '' : 'none';
  }

  function hideMenus() {
    if (ui.overlay) ui.overlay.classList.remove('show');
    if (ui.upgradeOverlay) ui.upgradeOverlay.classList.remove('show');
    if (ui.credits) ui.credits.classList.remove('show');
    if (ui.settingsOverlay) ui.settingsOverlay.classList.remove('show');
      syncPauseButton();
    if (ui.controlsOverlay) ui.controlsOverlay.classList.remove('show');
      syncPauseButton();
    if (ui.pauseOverlay) ui.pauseOverlay.classList.remove('show');
  }

  function openCustomizePanel(fromPause = false) {
    if (ui.credits) ui.credits.classList.remove('show');
    if (ui.upgradeOverlay) ui.upgradeOverlay.classList.remove('show');
    if (ui.customizeOverlay) ui.customizeOverlay.classList.remove('show');
    if (ui.settingsOverlay) ui.settingsOverlay.classList.remove('show');
    if (ui.controlsOverlay) ui.controlsOverlay.classList.remove('show');
    renderSettingsUI();
    if (fromPause && ui.pauseOverlay) ui.pauseOverlay.classList.add('show');
    if (ui.customizeOverlay) ui.customizeOverlay.classList.add('show');
    syncPauseButton();
  }

  function openSettingsPanel(fromPause = false) {
    if (ui.credits) ui.credits.classList.remove('show');
    if (ui.upgradeOverlay) ui.upgradeOverlay.classList.remove('show');
    if (ui.customizeOverlay) ui.customizeOverlay.classList.remove('show');
    if (ui.controlsOverlay) ui.controlsOverlay.classList.remove('show');
      syncPauseButton();
    renderSettingsUI();
    if (fromPause && ui.pauseOverlay) ui.pauseOverlay.classList.add('show');
    if (ui.settingsOverlay) ui.settingsOverlay.classList.add('show');
    syncPauseButton();
  }

  function openControlsPanel(fromPause = false) {
    if (ui.credits) ui.credits.classList.remove('show');
    if (ui.upgradeOverlay) ui.upgradeOverlay.classList.remove('show');
    if (ui.customizeOverlay) ui.customizeOverlay.classList.remove('show');
    if (ui.settingsOverlay) ui.settingsOverlay.classList.remove('show');
      syncPauseButton();
    if (fromPause && ui.pauseOverlay) ui.pauseOverlay.classList.add('show');
    if (ui.controlsOverlay) ui.controlsOverlay.classList.add('show');
    syncPauseButton();
  }

  function openPause() {
    if (!running || gameOver || choosingUpgrade) return;
    paused = true;
    if (ui.pauseOverlay) ui.pauseOverlay.classList.add('show');
    syncPauseButton();
  }

  function closePause() {
    paused = false;
    if (ui.pauseOverlay) ui.pauseOverlay.classList.remove('show');
    syncPauseButton();
    last = performance.now();
  }

  function togglePause() {
    if (paused) closePause();
    else openPause();
  }

  function showMainMenu() {
    paused = false;
    running = false;
    gameOver = false;
    choosingUpgrade = false;
    upgradeLock = false;
    if (ui.pauseOverlay) ui.pauseOverlay.classList.remove('show');
    if (ui.upgradeOverlay) ui.upgradeOverlay.classList.remove('show');
    if (ui.credits) ui.credits.classList.remove('show');
    if (ui.settingsOverlay) ui.settingsOverlay.classList.remove('show');
      syncPauseButton();
    if (ui.controlsOverlay) ui.controlsOverlay.classList.remove('show');
      syncPauseButton();
    renderRecords();
    if (ui.overlay) {
      ui.overlay.classList.add('show');
    }
    if (ui.start) ui.start.textContent = 'Начать';
    setMenuScreen('home');
    updateModeDescription();
    syncPauseButton();
  }

  function reset() {
    // Сначала гарантированно убираем стартовое меню.
    // Раньше оно снималось в конце reset(), и если стартовая инициализация
    // где-то падала/останавливалась, игра уже начиналась под оставшимся overlay.
    hideMenus();
    ambientStarted = true;
    startAmbient();
    running = true;
    paused = false;
    syncPauseButton();
    gameOver = false;
    enemies.length = 0;
    particles.length = 0;
    shockwaves.length = 0;
    pickups.length = 0;
    hazards.length = 0;
    zones.length = 0;
    playerBeams.length = 0;
    floaters.length = 0;
    zenWisps.length = 0;
    zenSpawnTimer = 0;
    zenPulseTimer = 0;
    choosingUpgrade = false;
    upgradeLock = false;
    ui.upgradeOverlay.classList.remove('show');

    Object.assign(state, {
      score: 0,
      combo: 1,
      comboTimer: 0,
      wave: 1,
      killsInWave: 0,
      spawnedInWave: 0,
      requiredKills: 12,
      bestCombo: 1,
      time: 0,
      overdrive: 0,
      overdriveTime: 0,
      feverTime: 0,
      modifier: null,
      bossAlive: false,
      bossType: null,
      bossIndex: 0,
      waveClosing: false,
      challenge: null,
      challengeDone: false,
      challengeBonusPending: false,
      noDamageTimer: 0,
      pickupsCollected: 0,
      chainBest: 0,
      dashKills: 0,
      mode: selectedMode,
      upgradesTaken: [],
      relics: [],
      relicKills: 0,
      pendingRelic: false,
      survivalBossCount: 0,
      nextSurvivalBossAt: 75,
      riftsClosed: 0,
      riftTarget: 3,
      riftSpawnCooldown: 0,
      riftBossCountdown: 3,
      riftActive: false,
      lastRiftBossType: null
    });

    Object.assign(player, {
      x: W / 2,
      y: H / 2,
      vx: 0,
      vy: 0,
      r: 16,
      hp: 100,
      maxHp: 100,
      dashCooldown: 0,
      dashTime: 0,
      dashAttackTime: 0,
      laserCooldown: 0,
      invuln: 1.2,
      trail: [],
      speed: 830,
      magnet: 160,
      novaRadius: 120,
      chainChance: 0.0,
      pickupHeal: 1.8,
      visual: { dash: 0, shield: 0, magnet: 0, chain: 0, core: 0, coolant: 0 }
    });

    applyModeStart();

    // Общий визуальный слой из Zen теперь работает во всех режимах.
    // В боевых режимах он легче, но дает те же красивые wisps/кольца/мягкую ауру.
    if (state.mode !== 'zen') seedZenField();

    if (state.mode === 'rush') spawnBurst(10, false);
    else if (state.mode === 'zen') spawnZenTargets(10);
    else if (state.mode !== 'boss') spawnBurst(8, true);
    ui.overlay.classList.remove('show');
  }

  function applyModeStart() {
    runTimer = 0;
    if (state.mode === 'rush') {
      // Survival: бесконечное выживание на рекорд времени.
      // Сложность растет по таймеру, боссы приходят по расписанию, волн и трехминутного финиша больше нет.
      state.wave = 1;
      state.requiredKills = 0;
      state.spawnedInWave = 0;
      state.killsInWave = 0;
      state.survivalBossCount = 0;
      state.nextSurvivalBossAt = 75;
      state.modifier = { id: 'survival', name: 'SURVIVAL' };
      player.maxHp = 125;
      player.hp = 125;
      player.dashMax *= 0.88;
      player.speed *= 1.04;
      player.magnet += 45;
      player.novaRadius += 18;
      player.visual.dash += 1;
      player.visual.core += 1;
      clearCenterFloaters();
    }
    if (state.mode === 'onehp') {
      player.maxHp = 1; player.hp = 1; player.speed *= 1.12; player.dashMax *= 0.9;
      clearCenterFloaters();
    }
    if (state.mode === 'zen') {
      // Zen — отдельный свободный режим, бессмертие-режим: без урона, волн и апгрейд-пауз.
      state.wave = 0;
      state.requiredKills = 0;
      state.spawnedInWave = 0;
      state.killsInWave = 0;
      state.bossAlive = false;
      state.modifier = { id: 'zen', name: 'ZEN MODE' };
      state.overdrive = 100;
      player.maxHp = 999;
      player.hp = 999;
      player.speed *= 1.18;
      player.dashMax = 0.42;
      player.magnet = 420;
      player.novaRadius = 265;
      player.chainChance = 0.56;
      player.pickupHeal = 0;
      player.visual = { dash: 5, shield: 5, magnet: 5, chain: 5, core: 5, coolant: 3 };
      clearCenterFloaters();
      seedZenField();
    }
    if (state.mode === 'boss') {
      // Rift Mode: вместо Boss Run игрок закрывает разломы dash’ем.
      // Разломы выпускают врагов и пульсации. После серии закрытий приходит босс.
      state.wave = 1;
      state.bossAlive = false;
      state.bossIndex = 0;
      state.bossOrder = shuffleBossOrder();
      state.requiredKills = 0;
      state.spawnedInWave = 0;
      state.killsInWave = 0;
      state.riftsClosed = 0;
      state.riftTarget = 3;
      state.riftBossCountdown = 3;
      state.riftSpawnCooldown = 0;
      state.riftActive = false;
      state.modifier = { id: 'riftmode', name: 'RIFT' };
      player.maxHp = 125;
      player.hp = 125;
      player.dashMax *= 0.92;
      player.visual.shield += 1;
      player.visual.core += 1;
      setTimeout(() => { if (running && !gameOver && state.mode === 'boss') spawnRiftCore(true); }, 80);
    }
    if (state.mode === 'zen') { state.challenge = null; state.challengeDone = false; }
    else assignChallenge(state.mode === 'rush' || state.mode === 'boss');
    addWaveStartFloaters();
  }

  function spawnBurst(count, countForWave = true) {
    for (let i = 0; i < count; i++) spawnEnemy(true, countForWave);
  }

  function spawnEnemy(initial = false, countForWave = true) {
    const margin = 80;
    const side = Math.floor(Math.random() * 4);
    let x, y;
    if (side === 0) { x = -margin; y = Math.random() * H; }
    if (side === 1) { x = W + margin; y = Math.random() * H; }
    if (side === 2) { x = Math.random() * W; y = -margin; }
    if (side === 3) { x = Math.random() * W; y = H + margin; }

    const type = chooseEnemyType();

    const base = {
      x, y,
      vx: 0,
      vy: 0,
      r: 15,
      hp: 1,
      type,
      age: initial ? Math.random() * 2 : 0,
      pulse: Math.random() * TAU,
      dead: false,
      color: '#ff2df7',
      value: 100,
      speed: 120 + state.wave * 8,
      damage: 10,
      waveCounted: false
    };

    if (type === 'splitter') {
      Object.assign(base, { r: 20, color: '#ffe35a', speed: 92 + state.wave * 5, value: 160, damage: 12 });
    }
    if (type === 'charger') {
      Object.assign(base, { r: 13, color: '#ff345c', speed: 132 + state.wave * 6.2, value: 230, damage: 14, charge: Math.random() * 1.8 });
    }
    if (type === 'mine') {
      Object.assign(base, { r: 17, color: '#37f8ff', speed: 24, value: 180, damage: 22, fuse: rand(1.8, 3.4) });
      if (!initial) playSfx('mineDeploy', 0.65);
    }
    if (type === 'orbiter') {
      Object.assign(base, { r: 18, color: '#52ff8f', speed: 100 + state.wave * 5, value: 260, damage: 15, orbit: Math.random() > .5 ? 1 : -1 });
    }
    if (type === 'shooter') {
      Object.assign(base, { r: 16, color: '#a86bff', speed: 66 + state.wave * 3.0, value: 320, damage: 9, shotTimer: rand(1.15, 1.85), shotMax: 1.85 });
    }
    if (type === 'shield') {
      Object.assign(base, { r: 21, color: '#5affd7', speed: 66 + state.wave * 2.2, value: 390, damage: 13, shieldAngle: Math.random() * TAU, shieldTurnSpeed: 0.82 });
    }
    if (type === 'leech') {
      Object.assign(base, { r: 12, color: '#ff7a2d', speed: 175 + state.wave * 6, value: 280, damage: 7, attached: false, attachTime: 0 });
    }
    if (type === 'siren') {
      Object.assign(base, { r: 24, color: '#fffb8a', speed: 58 + state.wave * 3, value: 520, damage: 9, aura: 165 });
    }
    if (type === 'needle') {
      Object.assign(base, { r: 9, color: '#ffffff', speed: 280 + state.wave * 4.2, value: 560, damage: 13, streak: rand(0.4, 1.2), maxSpeed: 520 + state.wave * 6 });
    }

    if (state.modifier?.id === 'fast' && type !== 'mine') {
      base.speed *= 1.16;
      base.value = Math.floor(base.value * 1.12);
    }

    enemies.push(base);
    // Статичные мины остаются опасностью арены, но больше не входят в бюджет волны.
    // Игроку не нужно добивать бомбочки, чтобы раунд закончился.
    if (countForWave && !state.bossAlive && base.type !== 'mine' && state.spawnedInWave < state.requiredKills) {
      base.waveCounted = true;
      state.spawnedInWave++;
    }
    return base;
  }

  function isWaveCombatant(e) {
    // Счетчик волны считает только врагов, которые были частью бюджета этой волны.
    // Мины, сплит-дети, босс-адды и прочие статичные/служебные объекты не держат волну открытой.
    return e && !e.dead && e.waveCounted === true;
  }

  function getWaveRemaining() {
    if (state.bossAlive || state.mode === 'rush' || state.mode === 'boss') return 0;
    const active = enemies.filter(isWaveCombatant).length;
    const notSpawned = Math.max(0, state.requiredKills - state.spawnedInWave);
    return Math.max(0, notSpawned + active);
  }


  function chooseEnemyType() {
    const w = state.wave;
    const pool = [
      ['chaser', Math.max(28, 70 - w * 4)]
    ];

    // Баланс v9: разнообразие остается ранним, но опасные типы больше не давят игрока уже к 5-й волне.
    // Красный треугольник/charger и стрелок/shooter появляются реже и набирают вес медленнее.
    if (w >= 2) pool.push(['splitter', 18 + Math.min(w, 8) * 0.9]);
    if (w >= 3) pool.push(['charger', 6 + Math.min(w, 7) * 0.55]);
    if (w >= 4) pool.push(['shooter', 5 + Math.min(w, 8) * 0.45]);
    if (w >= 4) pool.push(['mine', 9 + Math.min(w, 8) * 0.75]);
    if (w >= 4) pool.push(['shield', 7 + Math.min(w, 10) * 0.8]);
    if (w >= 5) pool.push(['orbiter', 8 + Math.min(w, 8) * 0.75]);
    if (w >= 5) pool.push(['leech', 6 + Math.min(w, 10) * 0.65]);
    if (w >= 6) pool.push(['siren', 4 + Math.min(w, 10) * 0.45]);
    // Быстрый враг появляется редко и только один одновременно, чтобы это был отдельный момент реакции, а не спам.
    if (w >= 6 && !enemies.some(e => e.type === 'needle')) pool.push(['needle', 3.2 + Math.min(w, 8) * 0.35]);

    if (state.modifier?.id === 'swarm') {
      pool.push(['chaser', 42]);
      if (w >= 4) pool.push(['charger', 4]);
    }

    let total = 0;
    for (const [, weight] of pool) total += weight;
    let roll = Math.random() * total;
    for (const [type, weight] of pool) {
      roll -= weight;
      if (roll <= 0) return type;
    }
    return 'chaser';
  }

  function spawnPickup(x, y) {
    if (Math.random() > 0.58) return;
    pickups.push({
      x, y,
      vx: rand(-90, 90),
      vy: rand(-90, 90),
      r: 6,
      life: 8,
      color: Math.random() > 0.5 ? '#37f8ff' : '#ffe35a'
    });
  }

  function update(dtRaw) {
    if (choosingUpgrade) {
      updateUpgradeBackdrop(dtRaw);
      return;
    }
    if (!running) return;
    const dt = Math.min(dtRaw * slowMo, 0.033);
    slowMo += (1 - slowMo) * Math.min(1, dtRaw * 3.2);
    state.time += dt;
    updateModeTimer(dt);
    hueShift += dt * 16;
    arenaPulse += dt;
    if (state.overdriveTime > 0) {
      state.overdriveTime = Math.max(0, state.overdriveTime - dt);
      hueShift += dt * 80;
      player.dashCooldown = Math.min(player.dashCooldown, 0.08);
    }
    if (state.feverTime > 0) {
      state.feverTime = Math.max(0, state.feverTime - dt);
      hueShift += dt * 55;
      player.dashCooldown = Math.min(player.dashCooldown, 0.14);
    }
    if (state.modifier?.id === 'rift' && Math.random() < dt * 0.42) spawnRiftHazard();
    if (state.modifier?.id === 'gravity' && Math.random() < dt * 0.09) spawnGravityZone();
    if (state.modifier?.id === 'pulse' && Math.random() < dt * 0.11) spawnPulseRing();
    if (state.modifier?.id === 'deadzone' && Math.random() < dt * 0.08) spawnDeadZone();
    flash = Math.max(0, flash - dtRaw * 2.5);
    shake = Math.max(0, shake - dtRaw * 30);

    updatePlayer(dt);
    updateEnemies(dt);
    updatePickups(dt);
    updateHazards(dt);
    updateZones(dt);
    updatePlayerBeams(dt);
    if (state.mode !== 'zen') updateChallenge(dt);
    updateZenEffects(dt);
    updateParticles(dt);
    updateShockwaves(dt);
    updateFloaters(dt);
    updateSpawning(dt);
    updateCombo(dt);
    updateUI();
  }

  function updateUpgradeBackdrop(dtRaw) {
    const dt = Math.min(dtRaw, 0.033);
    slowMo += (1 - slowMo) * Math.min(1, dtRaw * 2.5);
    state.time += dt * 0.7;
    hueShift += dt * 9;
    arenaPulse += dt * 0.55;
    flash = Math.max(0, flash - dtRaw * 3.5);
    shake = Math.max(0, shake - dtRaw * 42);
    // Пока открыт выбор улучшения, фон не должен быть мертвым кадром:
    // оставляем только легкое движение частиц, колец и wisps без геймплейного спавна/урона.
    updateZenEffects(dt * 0.72);
    updatePlayerBeams(dt);
    updateParticles(dt);
    updateShockwaves(dt);
    updateFloaters(dt);
  }


  function updatePlayer(dt) {
    let ax = 0, ay = 0;

    const leechSlow = enemies.some(e => e.type === 'leech' && e.attached) ? 0.72 : 1;

    if (mobileMove.active) {
      ax = mobileMove.x;
      ay = mobileMove.y;
    } else {
      const dx = pointer.x - player.x;
      const dy = pointer.y - player.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 18) {
        const pull = Math.min(1, (dist - 18) / 220);
        ax = (dx / dist) * pull;
        ay = (dy / dist) * pull;
      }
    }

    const len = Math.hypot(ax, ay);
    if (len > 0.001) {
      ax /= len; ay /= len;
      player.dashVectorX = ax;
      player.dashVectorY = ay;
      const distBoost = mobileMove.active ? 1 : Math.min(1, Math.hypot(pointer.x - player.x, pointer.y - player.y) / 260);
      const redBoost = 1 + redDwarfPower() * 0.24;
      player.vx += ax * player.speed * (0.62 + distBoost * 0.55) * leechSlow * redBoost * dt;
      player.vy += ay * player.speed * (0.62 + distBoost * 0.55) * leechSlow * redBoost * dt;
    }

    if (player.dashAttackTime > 0) player.dashAttackTime = Math.max(0, player.dashAttackTime - dt);

    if (player.dashTime > 0) {
      player.dashTime -= dt;
      player.vx += player.dashVectorX * 2600 * dt;
      player.vy += player.dashVectorY * 2600 * dt;
      if (Math.random() < 0.32) emitTrailParticle();
    }

    player.vx *= Math.pow(player.drag, dt * 60);
    player.vy *= Math.pow(player.drag, dt * 60);
    const redMaxBoost = 1 + redDwarfPower() * 0.18;
    const maxSpeed = (player.dashTime > 0 ? 1260 : 555) * redMaxBoost;
    const spd = Math.hypot(player.vx, player.vy);
    if (spd > maxSpeed) {
      player.vx = player.vx / spd * maxSpeed;
      player.vy = player.vy / spd * maxSpeed;
    }

    // Store previous position so collision systems can safely roll the core back
    // instead of leaving it inside a large boss hitbox.
    player.prevX = player.x;
    player.prevY = player.y;
    player.x += player.vx * dt;
    player.y += player.vy * dt;

    const pad = player.r + 8;
    if (player.x < pad) { player.x = pad; player.vx *= -0.35; }
    if (player.x > W - pad) { player.x = W - pad; player.vx *= -0.35; }
    if (player.y < pad) { player.y = pad; player.vy *= -0.35; }
    if (player.y > H - pad) { player.y = H - pad; player.vy *= -0.35; }

    player.dashCooldown = Math.max(0, player.dashCooldown - dt);
    player.laserCooldown = Math.max(0, player.laserCooldown - dt);
    player.invuln = Math.max(0, player.invuln - dt);
    player.bossBumpLock = Math.max(0, (player.bossBumpLock || 0) - dt);

    player.trail.unshift({ x: player.x, y: player.y, r: player.r, a: 1 });
    if (player.trail.length > 10) player.trail.pop();
    for (const t of player.trail) t.a *= 0.83;
  }

  function updateEnemies(dt) {
    for (const e of enemies) {
      e.age += dt;
      e.pulse += dt * 5;
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const d = Math.hypot(dx, dy) || 1;
      let nx = dx / d;
      let ny = dy / d;

      if (e.type === 'bossAnchor') {
        e.vx *= Math.pow(0.9, dt * 60);
        e.vy *= Math.pow(0.9, dt * 60);
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        if (d < e.r + player.r) {
          if (player.dashTime > 0 || player.invuln > 0.01) {
            e.hp -= 1;
            player.vx -= nx * 380;
            player.vy -= ny * 380;
            burst(e.x, e.y, 9, e.color, 220, 0.36);
            // UI cleanup: no floating HP numbers.
            if (e.hp <= 0) killEnemy(e, true);
          } else {
            damagePlayer(7, e.x, e.y);
            player.vx += nx * 420;
            player.vy += ny * 420;
          }
        }
        continue;
      }

      if (e.type === 'riftCore') {
        e.hitFlash = Math.max(0, (e.hitFlash || 0) - dt);
        e.spawnTimer = Math.max(0, (e.spawnTimer || 0) - dt);
        e.burstTimer = Math.max(0, (e.burstTimer || 0) - dt);
        e.vx *= Math.pow(0.82, dt * 60);
        e.vy *= Math.pow(0.82, dt * 60);
        e.x = clamp(e.x + e.vx * dt, 70, W - 70);
        e.y = clamp(e.y + e.vy * dt, 80, H - 80);

        e.spawnRestTimer = Math.max(0, (e.spawnRestTimer || 0) - dt);
        if (e.spawnRestTimer <= 0 && e.spawnTimer <= 0) {
          const closed = state.riftsClosed || 0;
          const batchSize = Math.min(4, 2 + Math.floor(closed / 5));
          e.spawnBurstLeft = Number.isFinite(e.spawnBurstLeft) && e.spawnBurstLeft > 0 ? e.spawnBurstLeft : batchSize;

          spawnRiftEnemyNear(e);
          e.spawnBurstLeft -= 1;
          addShockwave(e.x, e.y, e.r * 1.25, 150, '#37f8ff', 0.16);

          if (e.spawnBurstLeft <= 0) {
            e.spawnBurstLeft = batchSize;
            e.spawnRestTimer = Math.max(4.6, 5.4 - Math.min(1.0, closed * 0.03));
            e.spawnTimer = e.spawnRestTimer;
            addShockwave(e.x, e.y, e.r * 1.55, 95, '#ff2df7', 0.10);
          } else {
            e.spawnTimer = 0.38 + Math.random() * 0.32;
          }
        }
        if (e.burstTimer <= 0) {
          e.burstTimer = Math.max(1.75, 3.1 - (state.riftsClosed || 0) * 0.06);
          spawnPulseRing({ x: e.x, y: e.y, r: e.r, color: '#37f8ff' });
          playSfx('rift', 0.52);
        }

        const hitDist = e.r + player.r + 5;
        if (d < hitDist) {
          const attacking = (player.dashAttackTime || player.dashTime) > 0;
          if (attacking || player.invuln > 0.01) {
            e.hp -= 1;
            e.hitFlash = 0.18;
            player.dashTime = 0;
            player.invuln = Math.max(player.invuln, 0.16);
            player.dashCooldown = Math.max(player.dashCooldown, 0.10);
            player.vx += nx * 740;
            player.vy += ny * 740;
            e.vx -= nx * 110;
            e.vy -= ny * 110;
            shake = Math.max(shake, 8);
            slowMo = Math.min(slowMo, 0.66);
            playSfx('bossHitRico', 0.72);
            addShockwave(e.x, e.y, e.r, 340, '#ffe35a', 0.34);
            burst(e.x, e.y, 12, '#ffe35a', 310, 0.42);
            if (e.hp <= 0) closeRift(e);
          } else {
            damagePlayer(e.damage || 12, e.x, e.y);
            player.vx += nx * 560;
            player.vy += ny * 560;
          }
        }
        continue;
      }

      if (e.type === 'orbiter') {
        const ox = -ny * e.orbit;
        const oy = nx * e.orbit;
        nx = nx * 0.62 + ox * 0.78;
        ny = ny * 0.62 + oy * 0.78;
      }

      if (e.type === 'siren') {
        const sway = Math.sin(e.age * 2.2) * 0.55;
        nx = nx * 0.45 + Math.cos(e.age) * sway;
        ny = ny * 0.45 + Math.sin(e.age * 1.3) * sway;
        for (const ally of enemies) {
          if (ally !== e && ally.type !== 'siren' && Math.hypot(ally.x - e.x, ally.y - e.y) < e.aura) {
            ally.vx += (ally.x - e.x) * 0.05 * dt;
            ally.vy += (ally.y - e.y) * 0.05 * dt;
          }
        }
      }

      if (e.type === 'shooter') {
        if (d < 360) { nx *= -0.45; ny *= -0.45; }
        e.shotTimer -= dt;
        if (e.shotTimer <= 0) {
          e.shotTimer = rand(1.0, 1.8);
          e.shotMax = e.shotTimer;
          spawnEnemyBullet(e.x, e.y, dx / d, dy / d, '#a86bff', 11);
          addShockwave(e.x, e.y, e.r, 220, '#a86bff', 0.25);
        }
      }

      if (e.type === 'shield') {
        // Щитовик теперь не разворачивает щит мгновенно.
        // Игрок может обмануть его: уйти в сторону, дождаться лага щита и ударить сбоку/сзади.
        const targetAngle = Math.atan2(dy, dx);
        const turn = (e.shieldTurnSpeed || 1.05) * dt;
        e.shieldAngle = rotateTowardsAngle(e.shieldAngle || 0, targetAngle, turn);
      }

      if (e.type === 'leech' && e.attached) {
        e.attachTime -= dt;
        e.x = player.x - player.dashVectorX * 34 + Math.sin(state.time * 12) * 6;
        e.y = player.y - player.dashVectorY * 34 + Math.cos(state.time * 11) * 6;
        if (player.dashTime > 0 || e.attachTime <= 0) {
          e.attached = false; e.vx = -player.dashVectorX * 420; e.vy = -player.dashVectorY * 420;
        } else {
          continue;
        }
      }

      if (e.type === 'boss') {
        updateBossMechanics(e, dt, dx, dy, d);

        // Боссы больше не давят количеством аддов. Их сложность — в отдельной читаемой механике.
        if (e.bossType === 'mirror' && e.mirrorDelay) {
          e.mirrorDelay.push({x: player.x, y: player.y, t: 0.48});
          for (const m of e.mirrorDelay) m.t -= dt;
          const m = e.mirrorDelay.find(v => v.t <= 0);
          if (m) {
            const md = Math.hypot(m.x - e.x, m.y - e.y) || 1;
            nx = (m.x - e.x) / md;
            ny = (m.y - e.y) / md;
            e.mirrorDelay.shift();
          }
        } else {
          nx *= 0.72;
          ny *= 0.72;
        }
      }

      if (e.type === 'mine') {
        e.fuse -= dt;
        nx *= 0.28;
        ny *= 0.28;
        if (e.fuse <= 0 && d < 230) {
          explodeMine(e);
          continue;
        }
      }

      if (e.type === 'charger') {
        e.charge -= dt;
        if (e.charge <= 0) {
          e.vx += nx * 700;
          e.vy += ny * 700;
          e.charge = rand(1.1, 2.2);
          addShockwave(e.x, e.y, 20, 80, e.color, 0.26);
          playSfx('enemyCharge', 0.7);
        }
      }

      if (e.type === 'needle') {
        // Сверхбыстрый "игольник": редкий одиночный враг с резкими рывками.
        // Его задача — заставить игрока реагировать, но не давить количеством.
        e.streak -= dt;
        if (e.streak <= 0) {
          e.vx += nx * 520;
          e.vy += ny * 520;
          e.streak = rand(0.75, 1.35);
          addShockwave(e.x, e.y, 14, 100, e.color, 0.22);
          playSfx('needle', 0.62);
        }
      }

      let relicSlow = 1;
      if (hasRelic('coldstar') && e.type !== 'boss') {
        const cd = Math.hypot(e.x - player.x, e.y - player.y);
        if (cd < 210) relicSlow = 0.58 + Math.max(0, cd / 210) * 0.30;
      }
      e.vx += nx * e.speed * relicSlow * dt;
      e.vy += ny * e.speed * relicSlow * dt;
      e.vx *= Math.pow(e.type === 'needle' ? 0.935 : 0.96, dt * 60);
      e.vy *= Math.pow(e.type === 'needle' ? 0.935 : 0.96, dt * 60);
      if (e.type === 'needle') {
        const sp = Math.hypot(e.vx, e.vy) || 1;
        const cap = e.maxSpeed || 560;
        if (sp > cap) { e.vx = e.vx / sp * cap; e.vy = e.vy / sp * cap; }
      }
      e.x += e.vx * dt;
      e.y += e.vy * dt;

      if (e.type === 'boss') {
        // Босс не должен улетать за экран после контактов/отталкиваний.
        const padBoss = Math.max(70, e.r + 24);
        if (e.x < padBoss) { e.x = padBoss; e.vx = Math.abs(e.vx) * 0.35; }
        if (e.x > W - padBoss) { e.x = W - padBoss; e.vx = -Math.abs(e.vx) * 0.35; }
        if (e.y < padBoss) { e.y = padBoss; e.vy = Math.abs(e.vy) * 0.35; }
        if (e.y > H - padBoss) { e.y = H - padBoss; e.vy = -Math.abs(e.vy) * 0.35; }
      }

      const bodyR = e.type === 'boss' ? bossCollisionRadius(e) : e.r;
      const hitDist = bodyR + player.r;
      if (d < hitDist) {
        // Босс теперь работает как твердый объект: dash ударяется в корпус, наносит урон и отскакивает,
        // а не пролетает сквозь большую модель с неочевидной регистрацией урона.
        if (e.type === 'boss') {
          bossBodyImpact(e, nx, ny, (player.dashAttackTime || player.dashTime) > 0, player.invuln > 0.01);
          continue;
        }

        // Щитовик: щит физически отталкивает ядро, атаковать нужно сбоку/сзади.
        if (e.type === 'shield' && shieldBlocks(e)) {
          repelFromShield(e, nx, ny, player.dashTime > 0);
          continue;
        }

        if (player.dashTime > 0 || player.invuln > 0.01) {
          killEnemy(e, true);
        } else if (e.type === 'leech') {
          e.attached = true; e.attachTime = 2.7; damagePlayer(2, e.x, e.y);
        } else {
          damagePlayer(e.damage, e.x, e.y);
          const push = 540;
          player.vx += nx * push;
          player.vy += ny * push;
          e.vx -= nx * push;
          e.vy -= ny * push;
        }
      }
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
      if (enemies[i].dead) enemies.splice(i, 1);
    }
  }

  function updatePickups(dt) {
    for (const p of pickups) {
      p.life -= dt;
      const dx = player.x - p.x;
      const dy = player.y - p.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < player.magnet) {
        p.vx += (dx / d) * 700 * dt;
        p.vy += (dy / d) * 700 * dt;
      }
      p.vx *= Math.pow(0.95, dt * 60);
      p.vy *= Math.pow(0.95, dt * 60);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (d < player.r + p.r + 5) {
        p.life = -1;
        player.dashCooldown = Math.max(0, player.dashCooldown - 0.18);
        player.hp = Math.min(player.maxHp, player.hp + player.pickupHeal);
        state.score += 25 * state.combo;
        state.pickupsCollected++;
        burst(p.x, p.y, 5, p.color, 120, 0.35);
        playSfx('pickup', 0.65);
      }
    }
    removeDead(pickups, p => p.life <= 0);
  }

  function updateParticles(dt) {
    for (const p of particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.pow(p.drag, dt * 60);
      p.vy *= Math.pow(p.drag, dt * 60);
      p.r *= Math.pow(0.985, dt * 60);
    }
    removeDead(particles, p => p.life <= 0 || p.r < 0.3);
  }

  function updateShockwaves(dt) {
    for (const s of shockwaves) {
      s.life -= dt;
      s.r += s.speed * dt;
      s.alpha = Math.max(0, s.life / s.maxLife) * s.startAlpha;
    }
    removeDead(shockwaves, s => s.life <= 0);
  }

  function updateFloaters(dt) {
    for (const f of floaters) {
      f.life -= dt;
      if (f.kind === 'system' || f.kind === 'bossName') {
        f.y -= 8 * dt;
        f.scale += dt * 0.08;
      } else {
        f.y -= 48 * dt;
        f.scale += dt * 0.3;
      }
    }
    removeDead(floaters, f => f.life <= 0);
  }


  function spawnZenTargets(count = 1) {
    for (let i = 0; i < count; i++) {
      const margin = 90;
      const side = Math.floor(Math.random() * 4);
      let x, y;
      if (side === 0) { x = -margin; y = Math.random() * H; }
      if (side === 1) { x = W + margin; y = Math.random() * H; }
      if (side === 2) { x = Math.random() * W; y = -margin; }
      if (side === 3) { x = Math.random() * W; y = H + margin; }
      const palette = ['#37f8ff', '#ff2df7', '#52ff8f', '#ffe35a', '#a86bff'];
      enemies.push({
        x, y, vx: rand(-70, 70), vy: rand(-70, 70), r: rand(10, 18), hp: 1,
        type: Math.random() < 0.32 ? 'zenBloom' : 'zenTarget', age: Math.random() * 4, pulse: Math.random() * TAU,
        dead: false, color: palette[Math.floor(Math.random() * palette.length)], value: 90,
        speed: rand(22, 58), damage: 0, waveCounted: false, zen: true
      });
    }
  }

  function seedZenField() {
    zenWisps.length = 0;
    const density = state.mode === 'zen' ? 11500 : 18500;
    const modeCap = state.mode === 'zen' ? FX.maxZenWisps : Math.floor(FX.maxZenWisps * 0.58);
    const count = Math.min(modeCap, Math.floor((W * H) / density));
    for (let i = 0; i < count; i++) spawnZenWisp(Math.random() * W, Math.random() * H, true);
  }

  function spawnZenWisp(x = Math.random() * W, y = Math.random() * H, quiet = false) {
    const cap = state.mode === 'zen' ? FX.maxZenWisps : Math.floor(FX.maxZenWisps * 0.62);
    if (zenWisps.length >= cap) zenWisps.shift();
    const palette = ['#37f8ff', '#ff2df7', '#52ff8f', '#ffe35a', '#a86bff'];
    zenWisps.push({
      x, y,
      vx: rand(-18, 18),
      vy: rand(-18, 18),
      r: rand(1.5, 4.5),
      a: quiet ? rand(0.15, 0.42) : rand(0.35, 0.75),
      color: palette[Math.floor(Math.random() * palette.length)],
      phase: Math.random() * TAU,
      life: rand(4, 10),
      maxLife: 10
    });
  }

  function updateZenEffects(dt) {
    const isZen = state.mode === 'zen';
    // В Zen ядро свободный режим, бессмертиеовое и бессмертное. В остальных режимах оставляем только визуальный слой.
    if (isZen) {
      if (state.overdriveTime <= 0) state.overdrive = 100;
      player.hp = player.maxHp;
      state.combo = Math.max(state.combo, 12);
      state.comboTimer = Math.max(state.comboTimer, 1.2);
    }

    if (zenWisps.length === 0) seedZenField();

    zenSpawnTimer -= dt;
    zenPulseTimer -= dt;
    if (zenSpawnTimer <= 0) {
      spawnZenWisp(player.x + rand(-260, 260), player.y + rand(-260, 260));
      zenSpawnTimer = isZen ? rand(0.045, 0.12) / Math.max(0.55, FX.particleScale) : rand(0.16, 0.34) / Math.max(0.7, FX.particleScale);
    }
    if (zenPulseTimer <= 0) {
      const alpha = (isZen ? 0.08 : 0.038) * FX.shockwaveScale;
      const radiusMul = isZen ? rand(2.4, 4.4) : rand(2.0, 3.4);
      addShockwave(player.x, player.y, player.r * radiusMul, rand(70, 150), Math.random() > 0.5 ? '#37f8ff' : '#ff2df7', alpha);
      zenPulseTimer = isZen ? rand(0.65, 1.05) / Math.max(0.75, FX.shockwaveScale) : rand(1.35, 2.2) / Math.max(0.85, FX.shockwaveScale);
    }

    for (const w of zenWisps) {
      w.life -= dt;
      w.phase += dt * 1.6;
      const dx = player.x - w.x;
      const dy = player.y - w.y;
      const d = Math.hypot(dx, dy) || 1;
      const orbit = Math.sin(w.phase) * 22;
      w.vx += (dx / d) * 7 * dt + (-dy / d) * orbit * dt;
      w.vy += (dy / d) * 7 * dt + (dx / d) * orbit * dt;
      w.vx *= Math.pow(0.985, dt * 60);
      w.vy *= Math.pow(0.985, dt * 60);
      w.x += w.vx * dt;
      w.y += w.vy * dt;
      if (w.x < -80) w.x = W + 80;
      if (w.x > W + 80) w.x = -80;
      if (w.y < -80) w.y = H + 80;
      if (w.y > H + 80) w.y = -80;
    }
    removeDead(zenWisps, w => w.life <= 0);

    // В Zen обычные цели ведут себя как световые мотыльки, а не как агрессивные враги.
    for (const e of enemies) {
      if (e.zen) {
        e.damage = 0;
        e.speed = Math.min(e.speed || 40, 70);
        if (e.type === 'zenBloom') {
          e.vx += Math.sin(state.time * 1.7 + e.age) * 22 * dt;
          e.vy += Math.cos(state.time * 1.2 + e.age) * 22 * dt;
        }
      }
    }
  }


  function activeRifts() {
    return enemies.filter(e => !e.dead && e.type === 'riftCore').length;
  }

  function spawnRiftEnemyNear(rift) {
    if (!rift || rift.dead) return;
    const before = enemies.length;
    spawnEnemy(false, false);
    const e = enemies[enemies.length - 1];
    if (!e || enemies.length === before) return;
    const a = Math.random() * TAU;
    const dist = rand(28, 68);
    e.x = clamp(rift.x + Math.cos(a) * dist, 42, W - 42);
    e.y = clamp(rift.y + Math.sin(a) * dist, 54, H - 54);
    e.vx += Math.cos(a) * rand(90, 190);
    e.vy += Math.sin(a) * rand(90, 190);
    e.age = 0;
    e.waveCounted = false;
  }

  function spawnRiftCore(force = false) {
    if (state.mode !== 'boss' || state.bossAlive || gameOver) return;
    if (!force && activeRifts() > 0) return;
    const margin = 120;
    let x = rand(margin, W - margin);
    let y = rand(margin, H - margin);
    for (let i = 0; i < 18; i++) {
      x = rand(margin, W - margin);
      y = rand(margin, H - margin);
      if (Math.hypot(x - player.x, y - player.y) > 220) break;
    }
    const closed = state.riftsClosed || 0;
    const hp = Math.min(6, 3 + Math.floor(closed / 3));
    const rift = {
      x, y, vx: 0, vy: 0, r: 33, hp, maxHp: hp, type: 'riftCore',
      age: 0, pulse: Math.random() * TAU, dead: false, color: '#37f8ff',
      value: 900 + closed * 120, speed: 0, damage: 13, spawnTimer: 0.35,
      burstTimer: 2.8, hitFlash: 0, waveCounted: false,
      spawnBurstLeft: Math.min(4, 2 + Math.floor(closed / 5)),
      spawnRestTimer: 0,
      spawnBatchSize: Math.min(4, 2 + Math.floor(closed / 5))
    };
    enemies.push(rift);
    state.riftActive = true;
    playSfx('rift', 0.92);
    addShockwave(x, y, 40, 430, '#37f8ff', 0.34);
    burst(x, y, 22, '#37f8ff', 360, 0.72);
  }

  function closeRift(rift) {
    if (!rift || rift.dead) return;
    state.riftsClosed = (state.riftsClosed || 0) + 1;
    state.riftBossCountdown = Math.max(0, (state.riftBossCountdown || 3) - 1);
    state.score += (rift.value || 900) * Math.max(1, state.combo || 1);
    state.overdrive = state.overdriveTime > 0 ? state.overdrive : Math.min(100, state.overdrive + 18);
    playSfx('rift', 1.05);
    playSfx('explode', 0.62);
    addShockwave(rift.x, rift.y, 80, 620, '#ff2df7', 0.44);
    addShockwave(rift.x, rift.y, 22, 380, '#37f8ff', 0.54);
    burst(rift.x, rift.y, 38, '#37f8ff', 520, 0.86);
    burst(rift.x, rift.y, 18, '#ff2df7', 420, 0.7);
    radialBlast(rift.x, rift.y, 190, true);
    spawnPickup(rift.x, rift.y);
    rift.dead = true;
    state.riftActive = false;
    state.riftSpawnCooldown = 1.45;

    if (state.riftBossCountdown <= 0) {
      state.bossAlive = true;
      state.wave = 5 + Math.floor((state.riftsClosed || 0) / 3) * 5;
      setTimeout(() => { if (running && !gameOver && state.mode === 'boss') spawnBoss(); }, 650);
      state.riftBossCountdown = 3;
    }
  }

  function updateRiftMode(dt) {
    if (state.mode !== 'boss') return;
    runTimer += dt;
    const closed = state.riftsClosed || 0;
    state.wave = 1 + Math.floor(closed / 3);
    state.modifier = { id: 'riftmode', name: state.bossAlive ? 'RIFT BOSS' : `RIFT ${closed}/${Math.max(1, closed + (state.riftBossCountdown || 3))}` };

    if (state.bossAlive) return;

    state.riftSpawnCooldown = Math.max(0, (state.riftSpawnCooldown || 0) - dt);
    const maxRifts = closed >= 8 ? 2 : 1;
    if (activeRifts() < maxRifts && state.riftSpawnCooldown <= 0) {
      spawnRiftCore(false);
      state.riftSpawnCooldown = Math.max(2.2, 5.2 - closed * 0.18);
    }

    const openRift = enemies.find(e => !e.dead && e.type === 'riftCore');
    const maxEnemies = Math.min(10 + Math.floor(closed * 1.15), 26);
    const activeEnemies = enemies.filter(e => !e.dead && e.type !== 'riftCore' && e.type !== 'boss').length;

    // Важно: разлом сам спавнит врагов пачками и потом отдыхает.
    // Фоновый поток не должен превращать режим в непрерывный спавн-ад,
    // иначе у игрока нет честного окна пройти к разлому и атаковать.
    if (spawnTimer <= 0 && activeEnemies < maxEnemies) {
      if (!openRift || Math.random() < 0.22) spawnEnemy(false, false);
      spawnTimer = openRift ? Math.max(1.15, 1.95 - closed * 0.025) : Math.max(0.42, 0.78 - closed * 0.022);
    }
  }


  function updateSpawning(dt) {
    spawnTimer -= dt;
    waveTimer += dt;

    if (state.mode === 'zen') {
      // Zen: никакой логики волн — только мягкий бесконечный поток красивых целей.
      const targetCap = 16;
      if (spawnTimer <= 0 && enemies.filter(e => !e.dead && e.type !== 'boss').length < targetCap) {
        spawnZenTargets(1);
        spawnTimer = rand(0.24, 0.55);
      }
      return;
    }

    if (state.mode === 'boss') {
      updateRiftMode(dt);
      return;
    }

    // Survival — бесконечный поток с прогрессией по времени.
    if (state.mode === 'rush') {
      const elapsed = Math.max(0, runTimer);
      const tier = Math.floor(elapsed / 30);
      state.wave = 1 + tier;
      state.modifier = { id: 'survival', name: state.bossAlive ? 'SURVIVAL BOSS' : `SURVIVAL ${tier + 1}` };

      const activeBoss = enemies.some(e => !e.dead && e.type === 'boss');
      if (!activeBoss && elapsed >= (state.nextSurvivalBossAt || 75)) {
        state.bossAlive = true;
        state.survivalBossCount = (state.survivalBossCount || 0) + 1;
        state.wave = 5 + state.survivalBossCount * 5 + Math.floor(elapsed / 45);
        state.nextSurvivalBossAt = elapsed + Math.max(62, 92 - state.survivalBossCount * 4);
        spawnBoss();
      }

      const pressure = activeBoss ? 0.72 : 1;
      const maxEnemies = Math.min(12 + Math.floor(elapsed / 16) + Math.floor((state.survivalBossCount || 0) * 1.5), activeBoss ? 24 : 34);
      const spawnBase = Math.max(0.20, (0.82 - elapsed * 0.0019 - (state.survivalBossCount || 0) * 0.025) / pressure);
      if (spawnTimer <= 0 && enemies.filter(e => !e.dead && e.type !== 'boss').length < maxEnemies) {
        spawnEnemy(false, false);
        if (elapsed > 120 && Math.random() < Math.min(0.22, elapsed / 1400)) spawnEnemy(false, false);
        spawnTimer = spawnBase;
      }
      return;
    }

    let maxEnemies = Math.min(12 + Math.floor(state.wave * 1.65), 25);
    let spawnBase = Math.max(0.24, 1.02 - state.wave * 0.035);
    if (state.modifier?.id === 'swarm') { maxEnemies += 5; spawnBase *= 0.78; }

    const activeEnemies = enemies.filter(isWaveCombatant).length;
    const canSpawnWaveEnemy = state.spawnedInWave < state.requiredKills;

    if (state.bossAlive) {
      // В Classic босс может иногда вызвать давление, но Boss Run остается именно режимом боссов.
      maxEnemies = Math.max(maxEnemies, 18);
      spawnBase *= 1.2;
    }

    if (spawnTimer <= 0 && enemies.length < maxEnemies) {
      if (state.bossAlive) {
        if (state.mode !== 'boss') spawnEnemy(false, false);
      } else if (canSpawnWaveEnemy) {
        spawnEnemy(false, true);
      }
      spawnTimer = spawnBase;
    }

    // Волна заканчивается строго по бюджету врагов.
    // Служебные объекты, мины, дети сплиттера и босс-адды не держат волну открытой.
    // Дополнительная страховка: если весь бюджет выпущен и активных бюджетных врагов уже нет,
    // волна закрывается даже если какой-то редкий способ убийства не успел поднять killsInWave.
    const budgetCleared = getWaveRemaining() <= 0;
    if (!state.bossAlive && !state.waveClosing && budgetCleared) {
      state.killsInWave = state.requiredKills;
      state.waveClosing = true;
      nextWave();
    }
  }

  function updateCombo(dt) {
    if (state.comboTimer > 0) {
      state.comboTimer -= dt;
    } else if (state.combo > 1) {
      state.combo = Math.max(1, Math.floor(state.combo * 0.65));
      state.comboTimer = state.combo > 1 ? 0.65 : 0;
    }
  }

  function nextWave() {
    if (choosingUpgrade || gameOver) return;
    state.waveClosing = true;
    choosingUpgrade = true;
    running = false;
    player.hp = Math.min(player.maxHp, player.hp + 12);
    hazards.length = 0;
    zones.length = 0;
    player.dashCooldown = 0;
    enemies.length = Math.min(enemies.length, 8);
    clearCenterFloaters();
    // Переход к апгрейду теперь спокойный: без тряски и сильного флэша.
    addShockwave(W / 2, H / 2, 70, 170, '#88f7ff', 0.12);
    shake = 0;
    flash = Math.min(flash, 0.04);
    upgradeLock = false;
    if (state.pendingRelic && state.mode !== 'zen' && relicPool.some(r => !hasRelic(r.id))) {
      showRelicChoices();
    } else {
      showUpgradeChoices();
    }
  }


  function segmentHitsCircle(x1, y1, x2, y2, cx, cy, r) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy || 1;
    let t = ((cx - x1) * dx + (cy - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const px = x1 + dx * t;
    const py = y1 + dy * t;
    const dist = Math.hypot(cx - px, cy - py);
    return { hit: dist <= r, t, px, py, dist };
  }

  function registerLaserBeam(x1, y1, x2, y2, hitPoints = []) {
    playerBeams.push({
      x1, y1, x2, y2,
      life: 0.18,
      maxLife: 0.18,
      hitPoints: hitPoints.slice(0, 8),
      colorA: '#8cf8ff',
      colorB: '#b36cff'
    });
  }

  function hitBossWithLaser(e) {
    if (!e || e.dead) return false;
    if (e.hitCooldown > 0) return false;

    if (bossIsShielded(e)) {
      playSfx('bossShield', 0.64);
      e.hitCooldown = Math.max(e.hitCooldown || 0, 0.38);
      addShockwave(e.x, e.y, e.r, 260, '#5affd7', 0.22);
      burst(e.x, e.y, 6, '#5affd7', 200, 0.28);
      shake = Math.max(shake, 4);
      return false;
    }

    e.hitCooldown = Math.max(e.hitCooldown || 0, 0.42);
    const dmg = state.overdriveTime > 0 ? 2 : 1;
    e.hp -= dmg;
    state.combo = Math.min(99, state.combo + 1);
    state.comboTimer = 1.6;
    state.score += 280 * state.combo;
    if (state.overdriveTime <= 0) state.overdrive = Math.min(100, state.overdrive + 2.8);
    playBossHitSfx(0.95);
    playSfx('bossHitRico', 0.68);
    burst(e.x, e.y, 12, '#8cf8ff', 280, 0.42);
    addShockwave(e.x, e.y, e.r + 10, 360, '#8cf8ff', 0.34);
    shake = Math.max(shake, 6);
    slowMo = Math.min(slowMo, 0.72);

    if (e.hp <= 0) {
      e.dead = true;
      const remainingBosses = enemies.some(other => other !== e && !other.dead && other.type === 'boss');
      state.bossAlive = remainingBosses;
      if (!remainingBosses) {
        state.killsInWave = state.requiredKills;
        state.spawnedInWave = state.requiredKills;
      }
      state.score += 3300 * Math.max(1, state.combo);
      if (state.overdriveTime <= 0) state.overdrive = Math.min(100, state.overdrive + 45);
      playSfx('bossDown', 1.15);
      radialBlast(e.x, e.y, 260, true);
      burst(e.x, e.y, 46, e.color || '#ffffff', 520, 0.9);
      flash = 0.3;
      if (!remainingBosses) {
        if (state.mode === 'boss') {
          state.bossIndex = (state.bossIndex || 0) + 1;
          if (state.bossOrder && state.bossIndex > 0 && state.bossIndex % state.bossOrder.length === 0) {
            state.bossOrder = shuffleBossOrder();
          }
        }
        state.pendingRelic = state.mode !== 'zen';
        setTimeout(() => { if (running && !choosingUpgrade && !gameOver) nextWave(); }, 500);
      }
    }
    return true;
  }

  function fireLaser() {
    if (!running || paused || choosingUpgrade || gameOver) return;
    if (player.laserCooldown > 0) return;

    let dx = pointer.active ? pointer.x - player.x : player.dashVectorX;
    let dy = pointer.active ? pointer.y - player.y : player.dashVectorY;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len; dy /= len;
    player.dashVectorX = dx;
    player.dashVectorY = dy;

    player.laserCooldown = player.laserMax;
    const startX = player.x + dx * (player.r + 8);
    const startY = player.y + dy * (player.r + 8);
    const range = Math.hypot(W, H) * 1.2;
    const endX = startX + dx * range;
    const endY = startY + dy * range;
    const hitPoints = [];

    playSfx('laserTiny', 1.0);
    playSfx('mirrorEcho', 0.28);
    addShockwave(startX, startY, 14, 220, '#8cf8ff', 0.32);
    burst(startX, startY, 12, '#8cf8ff', 260, 0.34);
    shake = Math.max(shake, 4);

    const sorted = [];
    for (const e of enemies) {
      if (!e || e.dead) continue;
      const rr = e.type === 'boss' ? bossCollisionRadius(e) : ((e.type === 'riftCore') ? (e.r + 10) : (e.r + 6));
      const test = segmentHitsCircle(startX, startY, endX, endY, e.x, e.y, rr);
      if (test.hit) sorted.push({ e, t: test.t, px: test.px, py: test.py });
    }
    sorted.sort((a, b) => a.t - b.t);

    for (const item of sorted) {
      const e = item.e;
      hitPoints.push({ x: item.px, y: item.py, color: e.color || '#8cf8ff' });

      if (e.type === 'boss') {
        hitBossWithLaser(e);
        continue;
      }
      if (e.type === 'riftCore') {
        e.hp -= (state.overdriveTime > 0 ? 2 : 1);
        e.hitFlash = 0.22;
        e.vx -= dx * 120;
        e.vy -= dy * 120;
        playSfx('bossHitRico', 0.7);
        addShockwave(item.px, item.py, e.r, 280, '#8cf8ff', 0.28);
        burst(item.px, item.py, 8, '#8cf8ff', 220, 0.28);
        if (e.hp <= 0) closeRift(e);
        continue;
      }
      killEnemy(e, true, false);
    }

    if (hitPoints.length) {
      const lastHit = hitPoints[Math.min(hitPoints.length - 1, 7)];
      addShockwave(lastHit.x, lastHit.y, 18, 260, '#b36cff', 0.22);
      burst(lastHit.x, lastHit.y, 10, '#b36cff', 240, 0.3);
    }

    registerLaserBeam(startX, startY, endX, endY, hitPoints);
  }

  function updatePlayerBeams(dt) {
    for (let i = playerBeams.length - 1; i >= 0; i--) {
      const b = playerBeams[i];
      b.life -= dt;
      if (b.life <= 0) playerBeams.splice(i, 1);
    }
  }

  function dash() {
    if (!running || gameOver) return;
    if (player.dashCooldown > 0) return;

    let dx = player.dashVectorX;
    let dy = player.dashVectorY;

    const moving = Math.hypot(dx, dy) > 0.1;
    if (!moving && pointer.down) {
      dx = pointer.x - player.x;
      dy = pointer.y - player.y;
    }
    const d = Math.hypot(dx, dy) || 1;
    dx /= d; dy /= d;

    player.dashVectorX = dx;
    player.dashVectorY = dy;
    player.dashTime = 0.18;
    player.dashAttackTime = 0.24;
    const redPower = redDwarfPower();
    player.dashCooldown = state.overdriveTime > 0 ? 0.05 : player.dashMax * (1 - redPower * 0.16);
    player.invuln = 0.22;
    const redDashBoost = 1 + redPower * 0.18;
    player.vx = dx * 980 * redDashBoost;
    player.vy = dy * 980 * redDashBoost;

    addShockwave(player.x, player.y, 20, 400, '#37f8ff', 0.44);
    burst(player.x - dx * 20, player.y - dy * 20, 12, '#37f8ff', 240, 0.38);
    playSfx('dash', 0.9);
    if (hasRelic('mirrorpulse')) mirrorDashEcho(dx, dy);
    shake = Math.max(shake, 6);
    slowMo = 0.72;
  }

  function killEnemy(e, byDash, fromBlast = false) {
    if (e.dead) return;
    if (e.type === 'riftCore') {
      closeRift(e);
      return;
    }
    // Важно: счетчик волны надо читать ДО того, как враг помечен dead.
    // В прошлой версии isWaveCombatant(e) возвращал false после e.dead=true, поэтому "ОСТАЛО" не уменьшалось.
    const wasWaveCombatant = e.waveCounted === true;
    e.dead = true;
    const comboGain = byDash ? 1 : 0;
    state.combo = Math.min(99, state.combo + comboGain);
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    state.comboTimer = 1.45;
    if (wasWaveCombatant) state.killsInWave++;
    if (byDash && wasWaveCombatant) state.dashKills++;
    state.score += e.value * state.combo * (state.feverTime > 0 ? 1.35 : 1);
    let odGain = (byDash ? 2.7 : 1.35) + Math.min(2.4, state.combo * 0.07);
    if (state.modifier?.id === 'overdrive') odGain *= 1.25;
    if (state.overdriveTime <= 0) state.overdrive = Math.min(100, state.overdrive + odGain);

    const color = e.color;
    if (state.mode === 'zen') {
      spawnZenWisp(e.x, e.y);
      spawnZenWisp(e.x + rand(-22,22), e.y + rand(-22,22));
      addShockwave(e.x, e.y, e.r * 1.2, 260, color, 0.20);
    }
    if (e.type === 'gravityNode') {
      addShockwave(e.x, e.y, e.r, 240, '#55ff9a', 0.32);
      playSfx('nodeDown', 0.8);
    }
    if (e.type === 'bossAnchor') {
      playSfx('nodeDown', 0.7);
    }
    burst(e.x, e.y, e.type === 'splitter' ? 20 : 14, color, e.type === 'charger' ? 420 : 320, 0.62);
    addShockwave(e.x, e.y, e.r, e.type === 'splitter' ? 420 : 330, color, 0.52);
    spawnPickup(e.x, e.y);

    playSfx((e.type === 'mine' || e.type === 'splitter' || fromBlast) ? 'explode' : 'enemy', e.type === 'mine' ? 1.0 : 0.75);
    if (e.type !== 'mine' && e.type !== 'bossAnchor' && e.type !== 'gravityNode') supernovaRelicCheck(e.x, e.y);

    if (e.type === 'mine') {
      radialBlast(e.x, e.y, player.novaRadius + 70, true);
    } else if (!fromBlast && blastDepth < 2 && Math.random() < player.chainChance) {
      radialBlast(e.x, e.y, player.novaRadius, true);
      state.chainBest = Math.max(state.chainBest, state.combo);
      // UI cleanup: floating gameplay labels hidden.
    }

    if (state.combo >= 20 && state.feverTime <= 0) activateFever();

    if (state.combo % 5 === 0) {
      // UI cleanup: no combo floating label.
      shake = Math.max(shake, 10 + state.combo * 0.15);
      flash = Math.max(flash, 0.12);
      slowMo = 0.5;
    } else {
      shake = Math.max(shake, 5);
    }

    if (e.type === 'splitter') {
      for (let i = 0; i < 2; i++) {
        const child = {
          x: e.x + rand(-18, 18), y: e.y + rand(-18, 18),
          vx: rand(-220, 220), vy: rand(-220, 220), r: 11, hp: 1, type: 'chaser', age: 0,
          pulse: Math.random() * TAU, dead: false, color: '#ff9d2d', value: 90, speed: 150 + state.wave * 8, damage: 8
        };
        enemies.push(child);
      }
    }
  }


  function bossCollisionRadius(e) {
    if (!e || e.type !== 'boss') return e?.r || 0;
    // Единый внешний круглый хитбокс для всех боссов.
    // Визуальная форма может быть сложной, но gameplay-столкновение всегда простое и честное.
    if (Number.isFinite(e.hitRadius)) return e.hitRadius;
    return Math.max(46, (e.r || 40) * 1.15);
  }

  function bossBodyImpact(e, nx, ny, isDashHit, isProtected = false) {
    const now = state.time || 0;
    const bodyR = bossCollisionRadius(e);
    const hitDist = bodyR + player.r;

    let ox = player.x - e.x;
    let oy = player.y - e.y;
    let d = Math.hypot(ox, oy);

    // Если ядро оказалось почти в центре босса, берем обратное направление dash,
    // чтобы не получить NaN и не оставить игрока внутри.
    if (!Number.isFinite(d) || d < 0.001) {
      ox = -(player.dashVectorX || 1);
      oy = -(player.dashVectorY || 0);
      d = Math.hypot(ox, oy) || 1;
    }

    ox /= d;
    oy /= d;

    // Ставим ядро строго снаружи невидимого круглого хитбокса.
    const pad = player.r + 8;
    const safeDist = hitDist + 10;
    player.x = clamp(e.x + ox * safeDist, pad, W - pad);
    player.y = clamp(e.y + oy * safeDist, pad, H - pad);

    const dashLocked =
      (player.bossBumpLock || 0) > 0 ||
      now < (e.contactCooldownUntil || 0) ||
      now < (e.bossHitUntil || 0);

    const contactLocked =
      isProtected ||
      (player.bossBumpLock || 0) > 0 ||
      now < (e.contactCooldownUntil || 0);

    if (isDashHit) {
      // Один dash = один удар и один отскок. Без пролета насквозь.
      player.dashTime = 0;
      player.dashAttackTime = 0;
      player.dashCooldown = Math.max(player.dashCooldown || 0, 0.16);

      player.vx = ox * 820;
      player.vy = oy * 820;
      e.vx -= ox * 32;
      e.vy -= oy * 32;
      player.invuln = Math.max(player.invuln || 0, 0.34);
      player.bossBumpLock = Math.max(player.bossBumpLock || 0, 0.34);
      e.contactCooldownUntil = now + 0.42;
      e.bossHitUntil = now + 0.34;

      if (!dashLocked) {
        hitBoss(e, true);
        addShockwave(player.x, player.y, 20, 300, '#ffffff', 0.26);
        burst(player.x, player.y, 8, '#ffffff', 230, 0.32);
        slowMo = 0.66;
        shake = Math.max(shake, 7);
      }
      return;
    }

    // Обычный контакт с боссом: это твердая стенка, но не мясорубка.
    player.vx = ox * 520;
    player.vy = oy * 520;
    player.bossBumpLock = Math.max(player.bossBumpLock || 0, 0.22);

    if (!contactLocked && (player.invuln || 0) <= 0.01) {
      e.contactCooldownUntil = now + 0.55;
      player.invuln = Math.max(player.invuln || 0, 0.35);
      damagePlayer(e.damage || 10, e.x, e.y);
    }
  }

  function hitBoss(e, fromDash = false) {
    if (e.hitCooldown > 0 && !fromDash) return;

    if (bossIsShielded(e)) {
      playSfx('bossShield', 0.7);
      e.hitCooldown = Math.max(e.hitCooldown || 0, 0.38);
      player.vx -= player.dashVectorX * 420;
      player.vy -= player.dashVectorY * 420;
      addShockwave(e.x, e.y, e.r, 260, '#5affd7', 0.25);
      shake = Math.max(shake, 5);
      return;
    }

    e.hitCooldown = fromDash ? Math.max(e.hitCooldown || 0, 0.42) : 0.18;
    const dmg = state.overdriveTime > 0 ? 2 : 1;
    e.hp -= dmg;
    state.combo = Math.min(99, state.combo + 1);
    state.comboTimer = 1.6;
    state.score += 280 * state.combo;
    if (state.overdriveTime <= 0) state.overdrive = Math.min(100, state.overdrive + 2.8);
    playBossHitSfx(0.95);
    burst(player.x, player.y, 10, '#ffffff', 260, 0.42);
    addShockwave(e.x, e.y, e.r, 360, '#ffffff', 0.32);
    shake = Math.max(shake, 8);
    slowMo = 0.58;

    if (e.hp <= 0) {
      e.dead = true;
      const remainingBosses = enemies.some(other => other !== e && !other.dead && other.type === 'boss');
      state.bossAlive = remainingBosses;
      if (!remainingBosses) {
        state.killsInWave = state.requiredKills;
        state.spawnedInWave = state.requiredKills;
      }
      state.score += 3300 * Math.max(1, state.combo);
      if (state.overdriveTime <= 0) state.overdrive = Math.min(100, state.overdrive + 45);
      playSfx('bossDown', 1.15);
      radialBlast(e.x, e.y, 260, true);
      burst(e.x, e.y, 46, e.color || '#ffffff', 520, 0.9);
      // UI cleanup: no boss-down floating label.
      flash = 0.3;
      if (!remainingBosses) {
        if (state.mode === 'boss') {
          state.bossIndex = (state.bossIndex || 0) + 1;
          if (state.bossOrder && state.bossIndex > 0 && state.bossIndex % state.bossOrder.length === 0) {
            state.bossOrder = shuffleBossOrder();
          }
        }
        state.pendingRelic = state.mode !== 'zen';
        setTimeout(() => { if (running && !choosingUpgrade && !gameOver) nextWave(); }, 500);
      }
    }
  }

  function bossIsShielded(e) {
    if (e.bossType === 'warden') return enemies.some(a => !a.dead && a.type === 'bossAnchor' && a.owner === e.id);
    if (e.bossType === 'maw') return enemies.some(a => !a.dead && a.type === 'gravityNode' && a.owner === e.id);
    if (e.invulnerableTime && e.invulnerableTime > 0) return true;
    return false;
  }



  function shuffleBossOrder() {
    const arr = ['warden', 'laser', 'maw', 'split', 'mirror'];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function spawnBoss() {
    const bossOrder = ['warden', 'laser', 'maw', 'split', 'mirror'];
    if (state.mode === 'boss' && (!state.bossOrder || !state.bossOrder.length)) state.bossOrder = shuffleBossOrder();
    const runOrder = state.bossOrder && state.bossOrder.length ? state.bossOrder : bossOrder;
    const type = state.mode === 'boss'
      ? runOrder[(state.bossIndex || 0) % runOrder.length]
      : bossOrder[Math.floor(Math.random() * bossOrder.length)];
    let chosenType = type;
    if (state.mode === 'boss' && state.lastRiftBossType === chosenType && runOrder.length > 1) {
      chosenType = runOrder[((state.bossIndex || 0) + 1) % runOrder.length];
      state.bossIndex = (state.bossIndex || 0) + 1;
    }
    state.bossType = chosenType;
    state.lastRiftBossType = state.mode === 'boss' ? chosenType : state.lastRiftBossType;
    const names = {
      warden:'NOVA WARDEN',
      laser:'LASER ORACLE',
      maw:'GRAVITY MAW',
      split:'SPLIT CORE',
      mirror:'MIRROR NOVA'
    };
    const colors = { warden:'#f8fbff', laser:'#ff2df7', maw:'#55ff9a', split:'#ffe35a', mirror:'#37f8ff' };
    // Боссы стали менее "толстыми": сложность теперь в механиках, а не в огромном HP.
    const hpBase = { warden: 7, laser: 7, maw: 7, split: 7, mirror: 7 };
    const bossHp = hpBase[chosenType] + Math.floor(Math.max(0, state.wave - 5) / 8);
    const spawn = randomBossSpawn();
    const spawnAngle = Math.random() * TAU;
    const id = Math.random().toString(36).slice(2);
    const boss = {
      id, x: spawn.x, y: spawn.y, vx: Math.cos(spawnAngle) * 45, vy: Math.sin(spawnAngle) * 45,
      r: chosenType === 'maw' ? 46 : 40, hitRadius: chosenType === 'maw' ? 58 : chosenType === 'laser' ? 54 : chosenType === 'split' ? 52 : chosenType === 'mirror' ? 52 : 56, hp: bossHp, maxHp: bossHp,
      type: 'boss', bossType: chosenType, age: 0, pulse: 0, dead: false, color: colors[chosenType], value: 5000,
      speed: chosenType === 'maw' ? 58 : chosenType === 'laser' ? 70 : chosenType === 'mirror' ? 88 : chosenType === 'split' ? 86 : 72, damage: 16,
      spawnTimer: 99, ringTimer: 3.8, laserTimer: 2.8, gravityTimer: 3.6, hitCooldown: 0,
      mechanicTimer: 0.7, vulnerableTime: 0, invulnerableTime: 0, mirrorDelay: [], didSplit: false, splitHalf: false, rearming: false
    };
    enemies.push(boss);
    addBossNameFloater(names[chosenType], colors[chosenType]);
    addShockwave(spawn.x, spawn.y, 80, 650, colors[chosenType], 0.32);
    playSfx('bossSpawn', 0.9);
    if (chosenType === 'warden') setTimeout(() => spawnBossAnchors(boss), 250);
    if (chosenType === 'maw') setTimeout(() => spawnGravityNodes(boss), 250);
  }



  function updateBossMechanics(boss, dt, dx, dy, d) {
    boss.mechanicTimer = Math.max(0, (boss.mechanicTimer || 0) - dt);
    boss.vulnerableTime = Math.max(0, (boss.vulnerableTime || 0) - dt);
    boss.invulnerableTime = Math.max(0, (boss.invulnerableTime || 0) - dt);
    boss.ringTimer = Math.max(0, (boss.ringTimer || 0) - dt);
    boss.laserTimer = Math.max(0, (boss.laserTimer || 0) - dt);
    boss.gravityTimer = Math.max(0, (boss.gravityTimer || 0) - dt);

    if (boss.bossType === 'warden') {
      const anchors = enemies.filter(a => !a.dead && a.type === 'bossAnchor' && a.owner === boss.id).length;
      if (anchors === 0 && boss.vulnerableTime <= 0 && !boss.rearming) {
        boss.vulnerableTime = 5.0;
        boss.mechanicTimer = 5.0;
        boss.rearming = true;
        addShockwave(boss.x, boss.y, boss.r, 420, '#ffe35a', 0.28);
      }
      if (boss.rearming && boss.mechanicTimer <= 0 && boss.vulnerableTime <= 0 && !boss.dead) {
        boss.rearming = false;
        spawnBossAnchors(boss);
      }
      if (boss.ringTimer <= 0) { boss.ringTimer = 4.8; bossPulse(boss, 6, 220, 8); }
    }

    if (boss.bossType === 'laser') {
      if (boss.laserTimer <= 0) {
        boss.laserTimer = 3.6;
        spawnLaserSweep(boss);
        boss.vulnerableTime = 2.2;
      }
      if (boss.ringTimer <= 0) { boss.ringTimer = 5.0; bossPulse(boss, 5, 210, 8); }
    }

    if (boss.bossType === 'maw') {
      // Gravity Maw: пока живы грави-сферы, босс сам неуязвим и выпускает самонаводящиеся снаряды.
      // Игрок ломает сферы, уворачиваясь от ракет, затем получает короткое окно мощной атаки.
      const nodes = enemies.filter(a => !a.dead && a.type === 'gravityNode' && a.owner === boss.id).length;
      if (nodes > 0) {
        if (boss.gravityTimer <= 0) {
          boss.gravityTimer = 2.15;
          spawnHomingOrb(boss);
        }
      } else if (boss.vulnerableTime <= 0 && !boss.rearming) {
        boss.vulnerableTime = 5.8;
        boss.mechanicTimer = 5.8;
        boss.rearming = true;
        addShockwave(boss.x, boss.y, boss.r, 520, '#55ff9a', 0.30);
      }
      if (boss.rearming && boss.mechanicTimer <= 0 && boss.vulnerableTime <= 0 && !boss.dead) {
        boss.rearming = false;
        spawnGravityNodes(boss);
      }
    }

    if (boss.bossType === 'split') {
      if (!boss.didSplit && boss.hp <= 4 && !boss.splitHalf) {
        boss.didSplit = true;
        boss.dead = true;
        spawnSplitBosses(boss.x, boss.y);
        addShockwave(boss.x, boss.y, boss.r, 520, '#ffe35a', 0.34);
      }
      if (boss.ringTimer <= 0) { boss.ringTimer = 4.2; bossPulse(boss, 5, 220, 8); }
    }

    if (boss.bossType === 'mirror') {
      if (boss.mechanicTimer <= 0) {
        boss.mechanicTimer = 2.7;
        spawnMirrorEcho(boss);
      }
    }
  }

  function spawnBossAnchors(boss) {
    if (!boss || boss.dead) return;
    playSfx('bossShield', 0.78);
    const count = 3;
    for (let i = 0; i < count; i++) {
      const a = i / count * TAU + Math.random() * 0.45;
      const dist = Math.min(W, H) * 0.26 + rand(-20, 35);
      const x = Math.max(80, Math.min(W - 80, boss.x + Math.cos(a) * dist));
      const y = Math.max(90, Math.min(H - 90, boss.y + Math.sin(a) * dist));
      enemies.push({ x, y, vx:0, vy:0, r:18, hp:2, type:'bossAnchor', owner:boss.id, age:0, pulse:Math.random()*TAU, dead:false, color:'#5affd7', value:260, speed:0, damage:8 });
    }
    boss.mechanicTimer = 0;
  }

  function spawnGravityNodes(boss) {
    if (!boss || boss.dead) return;
    playSfx('bossShield', 0.68);
    const count = 3;
    for (let i = 0; i < count; i++) {
      let x = rand(110, W - 110), y = rand(120, H - 110);
      for (let k = 0; k < 12; k++) {
        x = rand(110, W - 110); y = rand(120, H - 110);
        if (Math.hypot(x - player.x, y - player.y) > 155 && Math.hypot(x - boss.x, y - boss.y) > 145) break;
      }
      enemies.push({
        x, y, vx:0, vy:0, r:18, hp:2, type:'gravityNode', owner:boss.id, age:0, pulse:Math.random()*TAU,
        dead:false, color:'#55ff9a', value:320, speed:0, damage:8, aura:150
      });
    }
    boss.mechanicTimer = 0;
    boss.gravityTimer = 0.9;
  }

  function spawnHomingOrb(boss) {
    playSfx('bossSeeker', 0.9);
    const dx = player.x - boss.x, dy = player.y - boss.y;
    const d = Math.hypot(dx, dy) || 1;
    hazards.push({
      x: boss.x, y: boss.y,
      vx: dx / d * 155, vy: dy / d * 155,
      r: 9, life: 4.2, color: '#55ff9a', damage: 10, kind: 'homing', turn: 420, speed: 235
    });
  }


  function spawnMirrorEcho(boss) {
    playSfx('mirrorEcho', 0.75);
    const dx = player.x - boss.x, dy = player.y - boss.y;
    const d = Math.hypot(dx, dy) || 1;
    hazards.push({ x: boss.x, y: boss.y, vx: dx / d * 420, vy: dy / d * 420, r: 10, life: 1.25, color: '#37f8ff', damage: 10, kind: 'echo' });
  }

  function randomBossSpawn() {
    const pad = 120;
    let x = rand(pad, W - pad);
    let y = rand(pad, H - pad);
    // Не роняем босса прямо на игрока: выбираем позицию хотя бы примерно на расстоянии.
    for (let i = 0; i < 12; i++) {
      x = rand(pad, W - pad);
      y = rand(pad, H - pad);
      if (Math.hypot(x - player.x, y - player.y) > 260) break;
    }
    return { x, y };
  }

  function spawnBossAdds(boss) {
    const n = Math.min(3 + Math.floor(state.wave / 5), 6);
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU + Math.random() * 0.4;
      const e = {
        x: boss.x + Math.cos(a) * 70, y: boss.y + Math.sin(a) * 70,
        vx: Math.cos(a) * 180, vy: Math.sin(a) * 180, r: 12, hp: 1, type: 'chaser', age: 0,
        pulse: Math.random() * TAU, dead: false, color: '#ff2df7', value: 120, speed: 150 + state.wave * 8, damage: 9
      };
      enemies.push(e);
    }
    addShockwave(boss.x, boss.y, boss.r, 360, '#ff2df7', 0.28);
  }

  function bossPulse(boss, count = 8, speed = 260, damage = 10) {
    playSfx('bossPulse', 0.78);
    addShockwave(boss.x, boss.y, boss.r + 10, 540, '#ffffff', 0.34);
    for (let i = 0; i < count; i++) {
      const a = i / count * TAU + state.time * 0.32;
      hazards.push({ x: boss.x, y: boss.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r: 7, life: 2.2, color: '#ffffff', damage });
    }
    shake = Math.max(shake, 6);
  }


  function activateFever() {
    state.feverTime = 5.0;
    // UI cleanup: floating gameplay labels hidden.
    addShockwave(player.x, player.y, 28, 640, '#ffe35a', 0.45);
    flash = Math.max(flash, 0.18);
  }

  const waveModifiers = [
    { id: 'none', name: 'ЧИСТАЯ ВОЛНА' },
    { id: 'swarm', name: 'РОЙ' },
    { id: 'fast', name: 'УСКОРЕНИЕ' },
    { id: 'rift', name: 'РАЗЛОМЫ' },
    { id: 'overdrive', name: 'ПЕРЕЗАРЯД' },
    { id: 'gravity', name: 'ГРАВИТАЦИЯ' },
    { id: 'pulse', name: 'ПУЛЬС' },
    { id: 'deadzone', name: 'МЕРТВАЯ ЗОНА' }
  ];

  function pickWaveModifier() {
    if (state.wave < 3 || state.bossAlive) return waveModifiers[0];
    return waveModifiers[Math.floor(Math.random() * waveModifiers.length)];
  }

  function announceModifier() {
    if (!state.modifier) return;
    // UI cleanup: no wave modifier floating label.
  }

  function addWaveStartFloaters() {
    clearCenterFloaters();
    if (state.mode === 'rush') {
      addSystemFloaters([
        { text: 'ВЫЖИВИ 3:00', color: '#ff2df7', size: 40 },
        { text: 'БЕЗ ВОЛН', color: '#37f8ff', size: 24 }
      ]);
      return;
    }
    if (state.mode === 'boss') {
      // В Rift Mode стартовая цель видна самой аномалией на арене.
      return;
    }
    if (state.mode === 'zen') {
      addSystemFloaters([
        { text: 'ZEN MODE', color: '#52ff8f', size: 40 },
        { text: 'БЕССМЕРТИЕ · БЕЗ ВОЛН', color: '#37f8ff', size: 22 }
      ]);
      return;
    }
    const lines = [
      { text: `ВОЛНА ${state.wave}`, color: '#ffe35a', size: 42 }
    ];
    if (state.modifier) {
      const color = state.modifier.id === 'none' ? '#37f8ff' : '#ff2df7';
      lines.push({ text: state.bossAlive ? 'БОСС' : state.modifier.name, color, size: 30 });
    }
    addSystemFloaters(lines);
  }

  function spawnRiftHazard() {
    if (hazards.length > 18) return;
    playSfx('rift', 0.45);
    const edge = Math.floor(Math.random() * 4);
    let x = edge === 0 ? -20 : edge === 1 ? W + 20 : Math.random() * W;
    let y = edge === 2 ? -20 : edge === 3 ? H + 20 : Math.random() * H;
    const dx = player.x - x, dy = player.y - y;
    const d = Math.hypot(dx, dy) || 1;
    hazards.push({ x, y, vx: dx / d * 240, vy: dy / d * 240, r: 7, life: 3.0, color: '#ff2df7', damage: 10 });
  }

  function spawnEnemyBullet(x, y, nx, ny, color, damage) {
    playSfx('laserTiny', 0.45);
    hazards.push({ x, y, vx: nx * 330, vy: ny * 330, r: 7, life: 3.0, color, damage, kind: 'bullet' });
  }

  function spawnLaserSweep(boss) {
    playSfx('bossLaser', 0.85);
    const a = Math.atan2(player.y - boss.y, player.x - boss.x);
    const len = Math.max(W, H) * 1.45;
    hazards.push({
      x: boss.x, y: boss.y, angle: a, width: 18, life: 1.25, maxLife: 1.25,
      color: '#ff2df7', damage: 13, kind: 'laser', len,
      sx: Math.cos(a), sy: Math.sin(a),
      phase: Math.random() * TAU
    });
    addShockwave(boss.x, boss.y, boss.r * 0.8, 240, '#ff2df7', 0.20);
  }

  function spawnGravityZone(x = rand(120, W - 120), y = rand(120, H - 120), life = 5.5) {
    if (zones.length > 6) return;
    zones.push({ x, y, r: rand(95, 145), life, maxLife: life, kind: 'gravity', color: '#52ff8f' });
  }

  function spawnPulseRing() {
    if (zones.length > 7) return;
    zones.push({ x: rand(100, W - 100), y: rand(100, H - 100), r: 10, maxR: rand(180, 300), life: 2.2, maxLife: 2.2, kind: 'pulse', color: '#ffe35a', damage: 12 });
  }

  function spawnDeadZone() {
    if (zones.length > 5) return;
    zones.push({ x: rand(120, W - 120), y: rand(120, H - 120), r: rand(90, 130), life: 5.0, maxLife: 5.0, kind: 'deadzone', color: '#ff345c' });
  }

  function updateHazards(dt) {
    for (const h of hazards) {
      h.life -= dt;
      if (h.kind === 'laser') {
        const alpha = h.life / h.maxLife;
        const px = player.x - h.x, py = player.y - h.y;
        const distLine = Math.abs(Math.sin(h.angle) * px - Math.cos(h.angle) * py);
        const forward = Math.cos(h.angle) * px + Math.sin(h.angle) * py;
        if (alpha < 0.72 && forward > 0 && distLine < h.width + player.r && player.invuln <= 0) {
          damagePlayer(h.damage, player.x, player.y);
        }
        continue;
      }
      if (h.kind === 'homing') {
        const dx = player.x - h.x, dy = player.y - h.y;
        const d = Math.hypot(dx, dy) || 1;
        h.vx += dx / d * (h.turn || 360) * dt;
        h.vy += dy / d * (h.turn || 360) * dt;
        const sp = Math.hypot(h.vx, h.vy) || 1;
        const cap = h.speed || 230;
        if (sp > cap) { h.vx = h.vx / sp * cap; h.vy = h.vy / sp * cap; }
      }
      h.x += h.vx * dt;
      h.y += h.vy * dt;
      if (Math.hypot(player.x - h.x, player.y - h.y) < player.r + h.r && player.invuln <= 0) {
        h.life = -1;
        damagePlayer(h.damage, h.x, h.y);
      }
    }
    removeDead(hazards, h => h.life <= 0 || (h.kind !== 'laser' && (h.x < -80 || h.x > W + 80 || h.y < -80 || h.y > H + 80)));
  }

  function updateZones(dt) {
    for (const z of zones) {
      z.life -= dt;
      if (z.kind === 'pulse') z.r += (z.maxR / z.maxLife) * dt;
      const dx = z.x - player.x, dy = z.y - player.y;
      const d = Math.hypot(dx, dy) || 1;
      if (z.kind === 'gravity' && d < z.r) {
        player.vx += dx / d * 360 * dt;
        player.vy += dy / d * 360 * dt;
      }
      if (z.kind === 'pulse' && Math.abs(d - z.r) < player.r + 8 && player.invuln <= 0) damagePlayer(z.damage, z.x, z.y);
      if (z.kind === 'deadzone' && d < z.r) player.dashCooldown = Math.max(player.dashCooldown, 0.12);
      for (const e of enemies) {
        if (z.kind === 'gravity') {
          const ex = z.x - e.x, ey = z.y - e.y; const ed = Math.hypot(ex, ey) || 1;
          if (ed < z.r) { e.vx += ex / ed * 180 * dt; e.vy += ey / ed * 180 * dt; }
        }
      }
    }
    removeDead(zones, z => z.life <= 0 || (z.kind === 'pulse' && z.r > z.maxR));
  }

  function radialBlast(x, y, radius, safe) {
    // Защита от редкого зависания: цепные взрывы не должны уходить в бесконечную рекурсию.
    if (blastDepth > 2) return;
    blastDepth++;

    addShockwave(x, y, 18, 460, '#ffe35a', 0.38);
    burst(x, y, 12, '#ffe35a', 290, 0.48);

    if (hasRelic('graviring')) {
      for (const pullTarget of enemies) {
        if (!pullTarget || pullTarget.dead || pullTarget.type === 'boss') continue;
        const px = x - pullTarget.x, py = y - pullTarget.y;
        const pd = Math.hypot(px, py) || 1;
        if (pd < radius + 120) {
          const power = (1 - Math.min(1, pd / (radius + 120))) * 760;
          pullTarget.vx += px / pd * power;
          pullTarget.vy += py / pd * power;
        }
      }
      addShockwave(x, y, 36, 330, '#55ff9a', 0.20);
    }

    const targets = enemies.slice();
    for (const other of targets) {
      if (!other || other.dead) continue;
      const d = Math.hypot(other.x - x, other.y - y);
      if (d < radius) {
        if (other.type === 'boss') hitBoss(other);
        else killEnemy(other, true, true);
      }
    }

    if (!safe) {
      const pd = Math.hypot(player.x - x, player.y - y);
      if (pd < radius * 0.62) damagePlayer(state.modifier?.id === 'rift' ? 14 : 18, x, y);
    }

    blastDepth--;
  }

  function explodeMine(e) {
    if (e.dead) return;
    e.dead = true;
    // UI cleanup: no BOOM floating label.
    radialBlast(e.x, e.y, player.novaRadius + 80, e.playerMine === true);
    shake = Math.max(shake, 13);
    flash = Math.max(flash, 0.16);
  }

  function activateOverdrive() {
    if (!running || gameOver || choosingUpgrade) return;
    if (state.overdrive < 100 || state.overdriveTime > 0) return;
    if (state.challenge) state.challenge.usedOverdrive = true;
    state.overdrive = 0;
    state.overdriveTime = 4.2;
    player.invuln = Math.max(player.invuln, 0.7);
    slowMo = 0.62;
    shake = Math.max(shake, 12);
    flash = Math.max(flash, 0.22);
    // UI cleanup: no OVERDRIVE floating label.
    playSfx('overdrive', 1.0);
    addShockwave(player.x, player.y, 30, 620, '#ff2df7', 0.5);
  }

  function boostCoreVisual(type) {
    if (!player.visual) player.visual = { dash: 0, shield: 0, magnet: 0, chain: 0, core: 0, coolant: 0 };
    player.visual[type] = Math.min(6, (player.visual[type] || 0) + 1);
    player.r = Math.min(21, 16 + Math.floor(totalCoreVisualPower() / 3));
    flash = Math.max(flash, 0.13);
    shake = Math.max(shake, 4);
    addShockwave(player.x, player.y, 24, 360, coreAccentColor(), 0.34);
    burst(player.x, player.y, 14, coreAccentColor(), 220, 0.42);
  }

  function totalCoreVisualPower() {
    const v = player.visual || {};
    return (v.dash || 0) + (v.shield || 0) + (v.magnet || 0) + (v.chain || 0) + (v.core || 0) + (v.coolant || 0);
  }

  function coreAccentColor() {
    const v = player.visual || {};
    const entries = [
      ['dash', '#37f8ff'], ['shield', '#5affd7'], ['magnet', '#52ff8f'],
      ['chain', '#ff2df7'], ['core', '#ffe35a'], ['coolant', '#8ab4ff']
    ];
    entries.sort((a, b) => (v[b[0]] || 0) - (v[a[0]] || 0));
    return entries[0] && (v[entries[0][0]] || 0) > 0 ? entries[0][1] : '#37f8ff';
  }


  function redDwarfPower() {
    if (!hasRelic('reddwarf')) return 0;
    const hpRatio = Math.max(0, Math.min(1, player.hp / Math.max(1, player.maxHp)));
    return 1 - hpRatio;
  }

  function hasRelic(id) {
    return Array.isArray(state.relics) && state.relics.includes(id);
  }

  function relicTitle(id) {
    const r = relicPool.find(x => x.id === id);
    return r ? r.title : id;
  }

  function spawnRelicMine(x, y, dx, dy) {
    const mine = {
      x: Math.max(40, Math.min(W - 40, x - dx * 34)),
      y: Math.max(50, Math.min(H - 50, y - dy * 34)),
      vx: -dx * 55,
      vy: -dy * 55,
      r: 15,
      hp: 1,
      type: 'mine',
      playerMine: true,
      age: 0,
      pulse: Math.random() * TAU,
      dead: false,
      color: '#ffe35a',
      value: 0,
      speed: 0,
      damage: 0,
      fuse: 0.86,
      waveCounted: false
    };
    enemies.push(mine);
    addShockwave(mine.x, mine.y, 12, 90, '#ffe35a', 0.18);
    playSfx('mineDeploy', 0.42);
  }

  function mirrorDashEcho(dx, dy) {
    const ox = -dx, oy = -dy;
    const sx = player.x + ox * 20;
    const sy = player.y + oy * 20;
    const reach = 230;
    addShockwave(sx + ox * 65, sy + oy * 65, 16, 260, '#37f8ff', 0.24);
    burst(sx + ox * 35, sy + oy * 35, 9, '#37f8ff', 210, 0.34);
    for (const e of enemies.slice()) {
      if (!e || e.dead) continue;
      const ex = e.x - sx, ey = e.y - sy;
      const along = ex * ox + ey * oy;
      if (along < 0 || along > reach) continue;
      const side = Math.abs(ex * oy - ey * ox);
      if (side < (e.r || 12) + 22) {
        if (e.type === 'boss') hitBoss(e, false);
        else killEnemy(e, true, true);
      }
    }
  }

  function supernovaRelicCheck(x, y) {
    if (!hasRelic('supernova')) return;
    state.relicKills = (state.relicKills || 0) + 1;
    if (state.relicKills >= 10) {
      state.relicKills = 0;
      addShockwave(x, y, 28, 720, '#ffe35a', 0.5);
      burst(x, y, 26, '#ffe35a', 520, 0.75);
      playSfx('explode', 0.95);
      radialBlast(x, y, Math.max(190, player.novaRadius + 80), true);
      shake = Math.max(shake, 15);
      flash = Math.max(flash, 0.22);
    }
  }

  const relicPool = [
    { id: 'reddwarf', icon: '◆', title: 'Красный карлик', desc: 'Чем меньше щита у ядра, тем быстрее движение и чуть короче перезарядка DASH.', tag: 'риск / скорость', apply: () => boostCoreVisual('dash') },
    { id: 'coldstar', icon: '❄', title: 'Холодная звезда', desc: 'Враги рядом с ядром двигаются медленнее. Очень помогает, когда арена сжимается.', tag: 'аура контроля', apply: () => boostCoreVisual('shield') },
    { id: 'graviring', icon: '◎', title: 'Грави-кольцо', desc: 'Взрывы дополнительно стягивают врагов к центру, собирая цепные убийства.', tag: 'притяжение', apply: () => boostCoreVisual('magnet') },
    { id: 'supernova', icon: '✦', title: 'Осколок сверхновой', desc: 'Каждые 10 убийств вызывают большой безопасный nova-взрыв.', tag: 'каждое 10 убийство', apply: () => boostCoreVisual('chain') },
    { id: 'mirrorpulse', icon: '◈', title: 'Зеркальный импульс', desc: 'После DASH назад уходит слабая эхо-волна, задевающая преследователей.', tag: 'удар назад', apply: () => boostCoreVisual('dash') }
  ];

  const upgradePool = [
    { id: 'dash', icon: '↯', title: 'Турбо-рывок', desc: 'Dash перезаряжается быстрее: чаще можно врываться и выходить из опасности.', tag: 'меньше cooldown', apply: () => { player.dashMax = Math.max(0.42, player.dashMax * 0.82); boostCoreVisual('dash'); } },
    { id: 'hp', icon: '◌', title: 'Плазменный щит', desc: 'Увеличивает запас щита и сразу восстанавливает его до максимума.', tag: '+защита', apply: () => { player.maxHp += 25; player.hp = player.maxHp; boostCoreVisual('shield'); } },
    { id: 'magnet', icon: '◎', title: 'Грави-магнит', desc: 'Энергия и бонусы притягиваются с большей дистанции, лечат немного сильнее.', tag: '+сбор', apply: () => { player.magnet += 60; player.pickupHeal += 0.6; boostCoreVisual('magnet'); } },
    { id: 'chain', icon: '✦', title: 'Цепная нова', desc: 'Убитые враги чаще запускают цепные взрывы и помогают чистить толпу.', tag: '+цепи', apply: () => { player.chainChance = Math.min(0.56, player.chainChance + 0.14); boostCoreVisual('chain'); } },
    { id: 'core', icon: '⬡', title: 'Импульс ядра', desc: 'Увеличивает радиус взрыва от dash-ударов и делает зачистку плотнее.', tag: '+радиус', apply: () => { player.novaRadius += 35; boostCoreVisual('core'); } },
    { id: 'coolant', icon: '◈', title: 'Перегрузка', desc: 'Мгновенно добавляет заряд Overdrive, если он сейчас не активен.', tag: '+заряд', apply: () => { if (state.overdriveTime <= 0) state.overdrive = Math.min(100, state.overdrive + 14); boostCoreVisual('coolant'); } }
  ];


  function showRelicChoices() {
    rewardType = 'relic';
    ui.upgradeChoices.innerHTML = '';
    const panel = ui.upgradeOverlay ? ui.upgradeOverlay.querySelector('.upgrade-panel') : null;
    const small = panel ? panel.querySelector('.panel-small') : null;
    const title = panel ? panel.querySelector('h1') : null;
    if (small) small.textContent = 'BOSS RELIC';
    if (title) title.textContent = 'ВЫБОР РЕЛИКВИИ';
    const available = relicPool.filter(r => !hasRelic(r.id));
    const options = shuffle([...available]).slice(0, 3);
    for (const relic of options) {
      const btn = document.createElement('button');
      btn.className = 'upgrade-card relic-card';
      btn.innerHTML = `<div class="upgrade-icon">${relic.icon || '✦'}</div><strong>${relic.title}</strong><span>${relic.desc}</span><em>${relic.tag}</em>`;
      btn.addEventListener('click', () => chooseRelic(relic));
      ui.upgradeChoices.appendChild(btn);
    }
    ui.upgradeOverlay.classList.add('show');
  }

  function chooseRelic(relic) {
    if (upgradeLock || !choosingUpgrade) return;
    upgradeLock = true;
    try {
      if (relic && !hasRelic(relic.id)) {
        state.relics.push(relic.id);
        if (typeof relic.apply === 'function') relic.apply();
      }
      state.pendingRelic = false;
      playSfx('upgrade', 1.0);
      addShockwave(W / 2, H / 2, 85, 360, '#ffe35a', 0.22);
    } catch (err) {
      console.error('Relic apply failed:', err);
    }
    continueAfterReward();
  }

  function showUpgradeChoices() {
    rewardType = 'upgrade';
    state.pendingRelic = false;
    const panel = ui.upgradeOverlay ? ui.upgradeOverlay.querySelector('.upgrade-panel') : null;
    const small = panel ? panel.querySelector('.panel-small') : null;
    const title = panel ? panel.querySelector('h1') : null;
    if (small) small.textContent = 'CORE MODULE';
    if (title) title.textContent = 'ВЫБОР МОДУЛЯ';
    ui.upgradeChoices.innerHTML = '';
    const options = shuffle([...upgradePool]).slice(0, 3);
    for (const up of options) {
      const btn = document.createElement('button');
      btn.className = 'upgrade-card';
      btn.innerHTML = `<div class="upgrade-icon">${up.icon || '✦'}</div><strong>${up.title}</strong><span>${up.desc}</span><em>${up.tag}</em>`;
      btn.addEventListener('click', () => chooseUpgrade(up));
      ui.upgradeChoices.appendChild(btn);
    }
    ui.upgradeOverlay.classList.add('show');
  }

  function chooseUpgrade(up) {
    // Защита от двойного клика и редких ошибок в apply(), из-за которых игра могла застывать на экране выбора.
    if (upgradeLock || !choosingUpgrade) return;
    upgradeLock = true;

    try {
      if (up && typeof up.apply === 'function') up.apply();
      if (up?.title) state.upgradesTaken.push(up.title);
      playSfx('upgrade', 0.9);
    } catch (err) {
      console.error('Upgrade apply failed:', err);
      // UI cleanup: no skipped-upgrade floating label.
    }

    state.pendingRelic = false;
    continueAfterReward();
  }

  function continueAfterReward() {
    sanitizeRunState();
    ui.upgradeOverlay.classList.remove('show');
    clearCenterFloaters();
    choosingUpgrade = false;
    running = true;

    if (state.mode === 'boss') {
      state.killsInWave = 0;
      state.spawnedInWave = 0;
      state.waveClosing = false;
      state.bossAlive = false;
      state.requiredKills = 0;
      state.pendingRelic = false;
      state.modifier = { id: 'riftmode', name: 'RIFT' };
      hazards.length = 0;
      zones.length = 0;
      particles.length = Math.min(particles.length, 100);
      shockwaves.length = Math.min(shockwaves.length, 10);
      enemies.splice(0, enemies.length, ...enemies.filter(e => e.type !== 'boss').slice(0, 8));
      floaters.length = 0;
      assignChallenge(true);
      state.riftSpawnCooldown = 0.8;
      addShockwave(W / 2, H / 2, 70, 190, rewardType === 'relic' ? '#ffe35a' : '#88f7ff', rewardType === 'relic' ? 0.18 : 0.12);
      setTimeout(() => { if (running && !gameOver && state.mode === 'boss') spawnRiftCore(false); }, 450);
      setTimeout(() => { upgradeLock = false; }, 250);
      return;
    }

    if (state.mode === 'rush') {
      // В Survival награда после босса не переводит игру в обычные волны.
      // Возвращаемся в поток, а таймер рекорда продолжает считаться только во время активной игры.
      state.wave = 1 + Math.floor(Math.max(0, runTimer) / 30);
      state.killsInWave = 0;
      state.spawnedInWave = 0;
      state.waveClosing = false;
      state.bossAlive = false;
      state.requiredKills = 0;
      state.pendingRelic = false;
      state.modifier = { id: 'survival', name: 'SURVIVAL' };
      hazards.length = 0;
      zones.length = 0;
      particles.length = Math.min(particles.length, 90);
      shockwaves.length = Math.min(shockwaves.length, 8);
      enemies.splice(0, enemies.length, ...enemies.filter(e => e.type !== 'boss').slice(0, 8));
      floaters.length = 0;
      assignChallenge(true);
      addShockwave(W / 2, H / 2, 70, 190, rewardType === 'relic' ? '#ffe35a' : '#88f7ff', rewardType === 'relic' ? 0.18 : 0.12);
      return;
    }

    state.wave += 1;
    if (state.mode === 'boss') state.bossIndex = (state.bossIndex || 0) + 1;
    state.killsInWave = 0;
    state.spawnedInWave = 0;
    state.waveClosing = false;
    state.modifier = state.mode === 'boss' ? { id: 'bossrun', name: 'BOSS RUN' } : pickWaveModifier();
    state.bossAlive = state.mode === 'boss' || state.wave % 5 === 0;
    state.requiredKills = state.bossAlive ? 999 : 10 + state.wave * 4;

    // Перед новой волной чистим самые тяжелые временные объекты, чтобы не копить пиковую нагрузку после меню.
    hazards.length = 0;
    zones.length = 0;
    particles.length = Math.min(particles.length, 90);
    shockwaves.length = Math.min(shockwaves.length, 8);
    if (state.mode === 'boss') enemies.length = 0;
    else enemies.length = Math.min(enemies.length, 6);

    floaters.length = 0;
    if (state.mode === 'zen') { state.challenge = null; state.challengeDone = false; }
    else assignChallenge(true);
    clearCenterFloaters();
    addShockwave(W / 2, H / 2, 70, 190, rewardType === 'relic' ? '#ffe35a' : '#88f7ff', rewardType === 'relic' ? 0.18 : 0.12);

    if (state.bossAlive) spawnBoss();
    else spawnBurst(Math.min(3 + state.wave, 8), true);

    setTimeout(() => { upgradeLock = false; }, 250);
  }

  function sanitizeRunState() {
    const num = (v, fallback) => Number.isFinite(v) ? v : fallback;
    player.maxHp = Math.max(1, num(player.maxHp, 100));
    player.hp = Math.max(1, Math.min(player.maxHp, num(player.hp, player.maxHp)));
    player.dashMax = Math.max(0.25, Math.min(1.4, num(player.dashMax, 0.82)));
    player.speed = Math.max(200, Math.min(1500, num(player.speed, 830)));
    player.magnet = Math.max(40, Math.min(520, num(player.magnet, 160)));
    player.novaRadius = Math.max(60, Math.min(360, num(player.novaRadius, 120)));
    player.chainChance = Math.max(0, Math.min(0.62, num(player.chainChance, 0)));
    player.pickupHeal = Math.max(0, Math.min(8, num(player.pickupHeal, 1.8)));
    if (!Array.isArray(state.relics)) state.relics = [];
    state.relicKills = Math.max(0, Math.floor(num(state.relicKills, 0)));
    if (!player.visual || typeof player.visual !== 'object') player.visual = { dash:0, shield:0, magnet:0, chain:0, core:0, coolant:0 };
    for (const k of ['dash','shield','magnet','chain','core','coolant']) player.visual[k] = Math.max(0, Math.min(6, Math.floor(num(player.visual[k], 0))));
    state.overdrive = Math.max(0, Math.min(100, num(state.overdrive, 0)));
    state.overdriveTime = Math.max(0, Math.min(10, num(state.overdriveTime, 0)));
    state.combo = Math.max(1, Math.min(99, Math.floor(num(state.combo, 1))));
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Challenges removed for cleaner UI and simpler gameplay.
  const challengePool = [];

  function assignChallenge(silent = false) {
    state.challenge = null;
    state.challengeDone = false;
    state.challengeBonusPending = false;
    state.dashKills = 0;
    state.pickupsCollected = 0;
    state.noDamageTimer = 0;
  }

  function updateChallenge(dt) {
    // Challenges are disabled.
  }

  function updateModeTimer(dt) {
    if (state.mode === 'rush' && running && !choosingUpgrade) {
      runTimer += dt;
    }
  }

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

  function rotateTowardsAngle(current, target, maxStep) {
    const diff = ((target - current + Math.PI * 3) % TAU) - Math.PI;
    if (Math.abs(diff) <= maxStep) return target;
    return current + Math.sign(diff) * maxStep;
  }

  function shieldBlocks(e) {
    const a = Math.atan2(player.y - e.y, player.x - e.x);
    let diff = Math.abs(((a - e.shieldAngle + Math.PI * 3) % TAU) - Math.PI);
    return diff < 0.76;
  }

  function repelFromShield(e, nx, ny, dashed) {
    const push = dashed ? 860 : 560;
    player.vx += nx * push;
    player.vy += ny * push;
    e.vx -= nx * 90;
    e.vy -= ny * 90;
    if (dashed) {
      player.dashTime = 0;
      player.invuln = Math.max(player.invuln, 0.16);
      player.dashCooldown = Math.max(player.dashCooldown, 0.14);
      slowMo = 0.62;
      shake = Math.max(shake, 9);
    } else {
      player.invuln = Math.max(player.invuln, 0.08);
      shake = Math.max(shake, 4);
    }
    // UI cleanup: no REPEL floating label.
    playSfx('shield', dashed ? 0.9 : 0.6);
    addShockwave(e.x, e.y, e.r, dashed ? 360 : 240, '#5affd7', dashed ? 0.42 : 0.28);
    burst(e.x + Math.cos(e.shieldAngle) * e.r, e.y + Math.sin(e.shieldAngle) * e.r, dashed ? 10 : 5, '#5affd7', 220, 0.34);
  }

  function spawnSplitBosses(x, y) {
    for (let i = 0; i < 2; i++) {
      enemies.push({
        id: Math.random().toString(36).slice(2), x: x + (i ? 62 : -62), y, vx: (i ? 120 : -120), vy: -80,
        r: 28, hp: 4, maxHp: 4, type:'boss', bossType:'split', age:0, pulse:0, dead:false, color:'#ffe35a',
        value:2600, speed:86, damage:14, spawnTimer:99, ringTimer:3.8, laserTimer:9, gravityTimer:9,
        hitCooldown:0, mechanicTimer:2.0, vulnerableTime:0, invulnerableTime:0, didSplit:true, splitHalf:true, mirrorDelay:[]
      });
    }
  }


  function damagePlayer(amount, x, y) {
    if (state.mode === 'zen') {
      // Антистресс: столкновения дают только мягкий импульс и визуальный отклик, без урона и сброса комбо.
      player.invuln = Math.max(player.invuln || 0, 0.08);
      addShockwave(x || player.x, y || player.y, 16, 260, '#52ff8f', 0.18);
      return;
    }
    if (player.invuln > 0) return;
    state.noDamageTimer = 0;
    player.hp -= amount;
    player.invuln = 0.55;
    state.combo = 1;
    state.comboTimer = 0;
    flash = 0.45;
    shake = 22;
    slowMo = 0.48;
    playSfx('hurt', 1.0);
    burst(player.x, player.y, 18, '#ff345c', 360, 0.55);
    addShockwave(x, y, 18, 360, '#ff345c', 0.55);
    // UI cleanup: no player damage floating label.

    if (player.hp <= 0) {
      player.hp = 0;
      endGame();
    }
  }

  function endGame(reason = 'ЯДРО ПЕРЕГОРЕЛО') {
    paused = false;
    running = false;
    gameOver = true;
    if (ui.pauseOverlay) ui.pauseOverlay.classList.remove('show');
    if (ui.settingsOverlay) ui.settingsOverlay.classList.remove('show');
      syncPauseButton();
    updateRecords(reason);
    if (!ui.overlay) return;
    const panel = ui.overlay.querySelector('.panel');
    let small = ui.overlay.querySelector('.panel-small');
    const title = ui.overlay.querySelector('h1');
    let summary = ui.overlay.querySelector('.result-summary');
    if (!small && panel) {
      small = document.createElement('div');
      small.className = 'panel-small';
      if (title && title.parentNode === panel) panel.insertBefore(small, title);
      else panel.prepend(small);
    }
    if (!summary && panel) {
      summary = document.createElement('div');
      summary.className = 'result-summary';
      const actions = panel.querySelector('.menu-actions');
      if (actions && actions.parentNode === panel) panel.insertBefore(summary, actions);
      else panel.appendChild(summary);
    }
    ui.overlay.classList.add('show');
    const victory = false;
    if (small) small.textContent = modeName(state.mode);
    if (title) title.textContent = 'РЕЗУЛЬТАТ';
    const elapsed = state.mode === 'rush' ? formatTime(runTimer || 0) : formatTime(state.time || 0);
    const waveValue = state.mode === 'zen' ? '∞' : state.wave;
    if (summary) summary.innerHTML = `
      <span><small>Счет</small><b>${Math.floor(state.score).toLocaleString('ru-RU')}</b></span>
      <span><small>Режим</small><b>${modeName(state.mode)}</b></span>
      ${state.mode === 'rush' ? '' : `<span><small>Волна</small><b>${waveValue}</b></span>`}
      <span><small>Комбо</small><b>x${state.bestCombo}</b></span>
      <span><small>Апгрейды</small><b>${state.upgradesTaken.length}</b></span>
      <span><small>Реликвии</small><b>${(state.relics || []).length}</b></span>
      <span><small>${state.mode === 'rush' ? 'Выживание' : 'Длительность'}</small><b>${elapsed}</b></span>`;
    if (ui.start) ui.start.textContent = 'Начать';
  }

  function formatTime(seconds) {
    const t = Math.max(0, Math.floor(seconds || 0));
    return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
  }

  function burst(x, y, count, color, power, life = 0.7) {
    if (particles.length > FX.maxParticles) return;
    count = Math.max(1, Math.floor(count * FX.particleScale));
    power *= Math.max(0.75, Math.min(1.12, FX.particleScale));
    count = Math.min(count, FX.maxParticles - particles.length);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * TAU;
      const s = rand(power * 0.25, power);
      particles.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        r: rand(1.5, 5.5),
        life: rand(life * 0.45, life),
        maxLife: life,
        color,
        drag: rand(0.88, 0.96),
        glow: rand(8, 20)
      });
    }
  }

  function emitTrailParticle() {
    if (particles.length >= FX.maxParticles || Math.random() > FX.trailChance) return;
    particles.push({
      x: player.x + rand(-8, 8),
      y: player.y + rand(-8, 8),
      vx: -player.dashVectorX * rand(80, 240) + rand(-60, 60),
      vy: -player.dashVectorY * rand(80, 240) + rand(-60, 60),
      r: rand(2, 6),
      life: rand(0.18, 0.38),
      maxLife: 0.38,
      color: Math.random() > 0.45 ? '#37f8ff' : '#ff2df7',
      drag: 0.9,
      glow: 18
    });
  }

  function addShockwave(x, y, r, speed, color, alpha) {
    if (FX.quality === 'low' && shockwaves.length > 3 && Math.random() < 0.45) return;
    if (shockwaves.length >= FX.maxShockwaves) shockwaves.shift();
    alpha *= FX.shockwaveScale;
    speed *= Math.max(0.72, Math.min(1.12, FX.shockwaveScale));
    shockwaves.push({ x, y, r, speed, color, alpha, startAlpha: alpha, life: 0.45, maxLife: 0.45 });
  }

  function clearCenterFloaters() {
    // Clean old central labels.
    for (let i = floaters.length - 1; i >= 0; i--) {
      const f = floaters[i];
      if (f.kind === 'system' || f.kind === 'bossName') floaters.splice(i, 1);
    }
  }

  function addSystemFloaters(lines) {
    // UI cleanup: system messages are intentionally hidden.
    systemFloaters.length = 0;
  }


  function addSystemFloater(text, yOffset, color, size) {
    // UI cleanup: centered gameplay messages are intentionally hidden.
  }

  function addBossNameFloater(text, color) {
    // UI cleanup: boss name floaters are intentionally hidden.
  }

  function addFloater(text, x, y, color, size, kind = 'combat', life = 1.0) {
    if (floaters.length >= FX.maxFloaters) floaters.shift();
    floaters.push({ text, x, y, color, size, life, maxLife: life, scale: 1, kind });
  }

  function render() {
    ctx.save();
    const renderShake = settings.shake ? shake : 0;
    const sx = rand(-renderShake, renderShake);
    const sy = rand(-renderShake, renderShake);
    ctx.translate(sx, sy);

    drawBackground();
    drawZenBackdrop();
    drawGrid();
    drawPickups();
    drawZones();
    drawZenWisps();
    drawHazards();
    drawEnemies();
    drawAimGuide();
    drawPlayerBeams();
    drawPlayer();
    drawParticles();
    drawShockwaves();
    drawFloaters();
    drawVignette();

    if (flash > 0) {
      ctx.globalAlpha = flash * 0.32;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-50, -50, W + 100, H + 100);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function drawBackground() {
    ctx.fillStyle = '#03040b';
    ctx.fillRect(-60, -60, W + 120, H + 120);

    const g = ctx.createRadialGradient(W * 0.5, H * 0.52, 50, W * 0.5, H * 0.52, Math.max(W, H) * 0.75);
    g.addColorStop(0, `hsla(${(hueShift + 210) % 360}, 100%, 56%, 0.20)`);
    g.addColorStop(0.45, 'rgba(50, 10, 85, 0.22)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0.05)');
    ctx.fillStyle = g;
    ctx.fillRect(-60, -60, W + 120, H + 120);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let si = 0; si < stars.length; si += FX.starStep) {
      const s = stars[si];
      const drift = state.time * 12 * s.z;
      const x = (s.x + drift) % (W + 40) - 20;
      const y = (s.y + Math.sin(state.time * 0.7 + s.x) * 8 * s.z);
      ctx.globalAlpha = s.a;
      ctx.fillStyle = s.z > 0.8 ? '#37f8ff' : '#ffffff';
      ctx.fillRect(x, y, s.s, s.s);
    }
    ctx.restore();
  }

  function drawGrid() {
    const spacing = 64;
    const offset = (state.time * 38) % spacing;
    ctx.save();
    ctx.globalAlpha = 0.26 * FX.gridAlpha;
    ctx.strokeStyle = 'rgba(55,248,255,.24)';
    ctx.lineWidth = 1;
    for (let x = -spacing + offset; x < W + spacing; x += spacing) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + Math.sin(state.time) * 18, H); ctx.stroke();
    }
    for (let y = -spacing + offset; y < H + spacing; y += spacing) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = (0.18 + Math.sin(arenaPulse * 2) * 0.04) * FX.gridAlpha;
    ctx.strokeStyle = 'rgba(255,45,247,.35)';
    ctx.lineWidth = 2;
    const r = Math.min(W, H) * 0.38 + Math.sin(arenaPulse * 3) * 8;
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, r, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }


  function drawZenBackdrop() {
    const isZen = state.mode === 'zen';
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const cx = W / 2 + Math.sin(state.time * 0.18) * W * 0.08;
    const cy = H / 2 + Math.cos(state.time * 0.15) * H * 0.08;
    for (let i = 0; i < FX.backdropRings; i++) {
      const hue = (hueShift + i * 72) % 360;
      ctx.globalAlpha = (isZen ? 0.045 : 0.022) * FX.backdropAlpha;
      ctx.strokeStyle = `hsla(${hue}, 100%, 62%, .75)`;
      ctx.lineWidth = 2;
      const base = Math.min(W, H) * (0.18 + i * 0.10) + Math.sin(state.time * (0.45 + i * .07)) * 16;
      ctx.beginPath();
      ctx.arc(cx, cy, base, state.time * 0.08 * (i + 1), state.time * 0.08 * (i + 1) + Math.PI * 1.55);
      ctx.stroke();
    }
    ctx.globalAlpha = (isZen ? 0.05 : 0.026) * FX.backdropAlpha;
    ctx.fillStyle = `hsla(${(hueShift + 140) % 360}, 100%, 58%, .5)`;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.magnet * 0.95 + Math.sin(state.time * 2) * 12, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawZenWisps() {
    const isZen = state.mode === 'zen';
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const w of zenWisps) {
      const a = Math.max(0, Math.min(1, w.life / w.maxLife)) * w.a;
      ctx.globalAlpha = a * (isZen ? 0.72 : 0.42) * FX.wispAlpha;
      ctx.fillStyle = w.color;
      const rr = w.r * (1 + Math.sin(w.phase) * 0.25);
      ctx.beginPath();
      ctx.arc(w.x, w.y, rr, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = a * (isZen ? 0.12 : 0.065) * FX.wispAlpha;
      ctx.beginPath();
      ctx.arc(w.x, w.y, rr * 5.5, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawAimGuide() {
    if (!running || gameOver || choosingUpgrade || mobileMove.active) return;
    const dx = pointer.x - player.x;
    const dy = pointer.y - player.y;
    const d = Math.hypot(dx, dy);
    if (d < 26) return;
    const nx = dx / d;
    const ny = dy / d;
    const start = player.r * 2.35;
    // Пунктир направления теперь тянется пропорционально расстоянию до курсора,
    // а не обрывается коротким фиксированным отрезком.
    const end = Math.max(start + 44, Math.min(d - 18, d * 0.86));

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.max(0.18, Math.min(0.34, 0.16 + d / 1800));
    ctx.strokeStyle = '#37f8ff';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([14, 13]);
    ctx.beginPath();
    ctx.moveTo(player.x + nx * start, player.y + ny * start);
    ctx.lineTo(player.x + nx * end, player.y + ny * end);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.35 + Math.sin(state.time * 8) * 0.08;
    ctx.strokeStyle = '#ff2df7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pointer.x, pointer.y, 12 + Math.sin(state.time * 10) * 2, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  function polygonPath(x, y, r, sides, rot = 0) {
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const a = rot + i * TAU / sides;
      const px = x + Math.cos(a) * r;
      const py = y + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  function drawSkinOverlay(skin, pulse, accent, power) {
    const t = state.time;
    if (!skin || skin.id === 'nova') return;
    if (skin.id === 'prism') {
      ctx.globalAlpha = 0.22;
      ctx.strokeStyle = skin.secondary;
      ctx.lineWidth = 2;
      polygonPath(player.x, player.y, player.r * (2.15 + power * 0.015), 6, t * 0.6);
      ctx.stroke();
      for (let i = 0; i < 3; i++) {
        const a = -t * 1.6 + i * TAU / 3;
        ctx.globalAlpha = 0.34;
        ctx.fillStyle = i % 2 ? skin.primary : skin.secondary;
        polygonPath(player.x + Math.cos(a) * player.r * 2.25, player.y + Math.sin(a) * player.r * 2.25, 4.4, 4, a);
        ctx.fill();
      }
    }
    if (skin.id === 'eclipse') {
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = skin.secondary;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.r * 2.6, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 0.18;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.ellipse(player.x, player.y, player.r * 2.45, player.r * 1.18, t * 0.9, 0, TAU);
      ctx.stroke();
    }
    if (skin.id === 'aegis') {
      ctx.globalAlpha = 0.32;
      ctx.strokeStyle = skin.secondary;
      ctx.lineWidth = 2.2;
      for (let i = 0; i < 4; i++) {
        const a = t * 0.9 + i * TAU / 4;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.r * 2.15, a, a + 0.58);
        ctx.stroke();
      }
      ctx.globalAlpha = 0.24;
      polygonPath(player.x, player.y, player.r * 2.35, 8, Math.PI / 8 + t * 0.25);
      ctx.stroke();
    }
    if (skin.id === 'phantom') {
      for (let i = 0; i < 2; i++) {
        const off = (i === 0 ? -1 : 1) * (2.8 + Math.sin(t * 3 + i) * 1.2);
        ctx.globalAlpha = 0.12;
        ctx.fillStyle = i === 0 ? skin.primary : skin.secondary;
        ctx.beginPath();
        ctx.arc(player.x + off, player.y, player.r * 1.12, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 0.22;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.r * 2.18, 0, TAU);
      ctx.stroke();
    }
    if (skin.id === 'monolith') {
      ctx.globalAlpha = 0.18;
      ctx.strokeStyle = skin.secondary;
      ctx.lineWidth = 2;
      ctx.strokeRect(player.x - player.r * 1.7, player.y - player.r * 1.7, player.r * 3.4, player.r * 3.4);
      ctx.globalAlpha = 0.24;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(player.x + i * 5, player.y - player.r * 1.65);
        ctx.lineTo(player.x + i * 5, player.y + player.r * 1.65);
        ctx.stroke();
      }
    }
  }

  function drawSkinCore(skin, pulse, accent) {
    ctx.globalAlpha = player.invuln > 0 ? 0.78 + Math.sin(state.time * 34) * 0.18 : 1;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    const t = state.time;
    if (!skin || skin.id === 'nova') {
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.r * pulse, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.r * 1.55 * pulse, t * 5, t * 5 + Math.PI * 1.45);
      ctx.stroke();
      return;
    }
    if (skin.id === 'prism') {
      polygonPath(player.x, player.y, player.r * 0.98 * pulse, 6, t * 0.9);
      ctx.fill();
      ctx.strokeStyle = skin.secondary;
      polygonPath(player.x, player.y, player.r * 1.45 * pulse, 6, -t * 0.8);
      ctx.stroke();
      return;
    }
    if (skin.id === 'eclipse') {
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.r * pulse, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 0.84;
      ctx.fillStyle = '#090513';
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.r * 0.42 * pulse, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 0.95;
      ctx.strokeStyle = skin.secondary;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.r * 1.55 * pulse, t * 4.3, t * 4.3 + Math.PI * 1.35);
      ctx.stroke();
      return;
    }
    if (skin.id === 'aegis') {
      polygonPath(player.x, player.y, player.r * pulse, 8, Math.PI / 8);
      ctx.fill();
      ctx.strokeStyle = skin.secondary;
      polygonPath(player.x, player.y, player.r * 1.55 * pulse, 8, Math.PI / 8 + t * 0.4);
      ctx.stroke();
      return;
    }
    if (skin.id === 'phantom') {
      polygonPath(player.x, player.y, player.r * 1.02 * pulse, 4, Math.PI / 4);
      ctx.fill();
      ctx.strokeStyle = skin.secondary;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.r * 1.5 * pulse, t * 4.5, t * 4.5 + Math.PI * 1.2);
      ctx.stroke();
      return;
    }
    if (skin.id === 'monolith') {
      ctx.fillRect(player.x - player.r * 0.86 * pulse, player.y - player.r * 0.86 * pulse, player.r * 1.72 * pulse, player.r * 1.72 * pulse);
      ctx.strokeStyle = skin.secondary;
      ctx.strokeRect(player.x - player.r * 1.26 * pulse, player.y - player.r * 1.26 * pulse, player.r * 2.52 * pulse, player.r * 2.52 * pulse);
      return;
    }
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r * pulse, 0, TAU);
    ctx.fill();
  }

  function drawPlayerBeams() {
    for (const b of playerBeams) {
      const a = Math.max(0, b.life / b.maxLife);
      const dx = b.x2 - b.x1;
      const dy = b.y2 - b.y1;
      const ang = Math.atan2(dy, dx);

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const grad = ctx.createLinearGradient(b.x1, b.y1, b.x2, b.y2);
      grad.addColorStop(0, hexToRgba('#dffcff', 0.10 + a * 0.55));
      grad.addColorStop(0.25, hexToRgba('#8cf8ff', 0.18 + a * 0.70));
      grad.addColorStop(0.68, hexToRgba('#59a8ff', 0.16 + a * 0.62));
      grad.addColorStop(1, hexToRgba('#b36cff', 0.08 + a * 0.52));

      ctx.strokeStyle = grad;
      ctx.lineCap = 'round';
      ctx.lineWidth = 16 * a;
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();

      ctx.strokeStyle = hexToRgba('#f7ffff', 0.18 + a * 0.95);
      ctx.lineWidth = 4.6 * a + 1.4;
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();

      // боковые энергетические жилы
      ctx.strokeStyle = hexToRgba('#8cf8ff', 0.10 + a * 0.34);
      ctx.lineWidth = 1.4;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(b.x1 + Math.cos(ang + side * Math.PI / 2) * 4, b.y1 + Math.sin(ang + side * Math.PI / 2) * 4);
        ctx.lineTo(b.x2 + Math.cos(ang + side * Math.PI / 2) * 4, b.y2 + Math.sin(ang + side * Math.PI / 2) * 4);
        ctx.stroke();
      }

      for (const p of (b.hitPoints || [])) {
        ctx.fillStyle = hexToRgba('#f5ffff', 0.22 + a * 0.72);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8 * a + 2, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = hexToRgba(p.color || '#8cf8ff', 0.24 + a * 0.62);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 14 * a + 3, 0, TAU);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  function drawPlayer() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    const skin = getSelectedSkin();
    const accent = skin.aura || coreAccentColor();
    const v = player.visual || {};
    const power = totalCoreVisualPower();

    for (let i = player.trail.length - 1; i >= 0; i--) {
      const t = player.trail[i];
      ctx.globalAlpha = t.a * (0.16 + Math.min(0.1, power * 0.008));
      ctx.fillStyle = i % 2 ? accent : (skin.secondary || '#ff2df7');
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.r * (1.7 + i * 0.04 + power * 0.015), 0, TAU);
      ctx.fill();
    }

    const pulse = 1 + Math.sin(state.time * 10) * 0.06 + (player.dashTime > 0 ? 0.25 : 0);

    {
      ctx.globalAlpha = (state.mode === 'zen' ? 0.16 : 0.07) + Math.sin(state.time * 2.2) * 0.025;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 5; i++) {
        const a = state.time * (0.45 + i * 0.08) + i * TAU / 5;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.r * (2.7 + i * 0.55), a, a + Math.PI * 0.85);
        ctx.stroke();
      }
    }

    // Общая эволюция ядра: чем больше улучшений, тем мощнее внешняя аура.
    ctx.globalAlpha = 0.12 + Math.min(0.14, power * 0.012);
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r * (3.2 + power * 0.08) * pulse, 0, TAU);
    ctx.fill();

    // Грави-магнит: мягкое зеленое магнитное кольцо.
    if ((v.magnet || 0) > 0) {
      ctx.globalAlpha = 0.13;
      ctx.strokeStyle = '#52ff8f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.r * (2.2 + v.magnet * 0.32 + Math.sin(state.time * 3) * 0.08), 0, TAU);
      ctx.stroke();
    }

    // Щит: бирюзовые защитные скобы вокруг ядра.
    if ((v.shield || 0) > 0) {
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = '#5affd7';
      ctx.lineWidth = 2 + Math.min(3, v.shield);
      for (let i = 0; i < 2 + Math.min(2, v.shield); i++) {
        const a = state.time * (1.2 + v.shield * 0.12) + i * TAU / (2 + Math.min(2, v.shield));
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.r * (1.85 + v.shield * 0.06), a, a + 0.72);
        ctx.stroke();
      }
    }

    // Цепная нова: фиолетовые искры-спутники.
    if ((v.chain || 0) > 0) {
      const n = Math.min(5, 1 + v.chain);
      ctx.fillStyle = '#ff2df7';
      for (let i = 0; i < n; i++) {
        const a = -state.time * 2.2 + i * TAU / n;
        const rr = player.r * (2.25 + Math.sin(state.time * 4 + i) * 0.08);
        ctx.globalAlpha = 0.45;
        ctx.beginPath();
        ctx.arc(player.x + Math.cos(a) * rr, player.y + Math.sin(a) * rr, 2.8 + v.chain * 0.35, 0, TAU);
        ctx.fill();
      }
    }

    // Широкий импульс: золотой внешний реакторный обод.
    if ((v.core || 0) > 0) {
      ctx.globalAlpha = 0.28;
      ctx.strokeStyle = '#ffe35a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.r * (2.55 + v.core * 0.11), state.time * 1.8, state.time * 1.8 + Math.PI * 1.55);
      ctx.stroke();
    }

    // Dash-прокачка: острые голубые лезвия по направлению движения.
    if ((v.dash || 0) > 0) {
      const a = Math.atan2(player.dashVectorY, player.dashVectorX);
      ctx.globalAlpha = 0.42;
      ctx.strokeStyle = '#37f8ff';
      ctx.lineWidth = 2 + Math.min(3, v.dash);
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(player.x - Math.cos(a) * player.r * 0.35, player.y - Math.sin(a) * player.r * 0.35);
        ctx.lineTo(player.x + Math.cos(a + side * 0.42) * player.r * (1.7 + v.dash * 0.12), player.y + Math.sin(a + side * 0.42) * player.r * (1.7 + v.dash * 0.12));
        ctx.stroke();
      }
    }

    drawSkinOverlay(skin, pulse, accent, power);
    drawSkinCore(skin, pulse, accent);

    ctx.restore();
  }

  function drawEnemies() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const e of enemies) {
      const p = 1 + Math.sin(e.pulse) * 0.11;
      const r = e.r * p;

      ctx.globalAlpha = 0.14;
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.arc(e.x, e.y, r * 2.6, 0, TAU);
      ctx.fill();

      ctx.globalAlpha = 1;
      ctx.strokeStyle = e.color;
      ctx.lineWidth = 3;

      // Enemy readability layer: small, non-text telegraphs before the body.
      // These are cheap strokes/arcs and keep each enemy role visually obvious.
      if (e.type === 'shooter') {
        const dx = player.x - e.x, dy = player.y - e.y;
        const d = Math.hypot(dx, dy) || 1;
        const charge = 1 - Math.max(0, Math.min(1, (e.shotTimer || 0) / (e.shotMax || 1.6)));
        ctx.save();
        // Линия прицеливания стрелка теперь читается полностью: от стрелка до игрока.
        ctx.globalAlpha = 0.13 + charge * 0.34;
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 1.4 + charge * 2.0;
        ctx.setLineDash([10, 9]);
        ctx.beginPath();
        ctx.moveTo(e.x + dx / d * (r * 1.4), e.y + dy / d * (r * 1.4));
        ctx.lineTo(player.x - dx / d * (player.r * 1.45), player.y - dy / d * (player.r * 1.45));
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 0.25 + charge * 0.25;
        ctx.beginPath();
        ctx.arc(e.x, e.y, r * (1.8 + charge * 0.7), 0, TAU);
        ctx.stroke();
        ctx.restore();
      } else if (e.type === 'charger') {
        const charge = Math.max(0, Math.min(1, 1 - (e.charge || 0) / 2.2));
        const a = Math.atan2(e.vy || player.y - e.y, e.vx || player.x - e.x);
        ctx.save();
        ctx.globalAlpha = 0.16 + charge * 0.34;
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 2 + charge * 2;
        ctx.beginPath();
        ctx.moveTo(e.x + Math.cos(a) * r * 1.6, e.y + Math.sin(a) * r * 1.6);
        ctx.lineTo(e.x + Math.cos(a) * r * (3.4 + charge * 1.8), e.y + Math.sin(a) * r * (3.4 + charge * 1.8));
        ctx.stroke();
        ctx.restore();
      } else if (e.type === 'needle') {
        const a = Math.atan2(e.vy || player.y - e.y, e.vx || player.x - e.x);
        ctx.save();
        ctx.globalAlpha = 0.26;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(e.x - Math.cos(a) * r * 2.0, e.y - Math.sin(a) * r * 2.0);
        ctx.lineTo(e.x - Math.cos(a) * r * 7.0, e.y - Math.sin(a) * r * 7.0);
        ctx.stroke();
        ctx.restore();
      } else if (e.type === 'siren') {
        ctx.save();
        ctx.globalAlpha = 0.055 + Math.sin(e.pulse) * 0.012;
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.aura, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 0.22;
        ctx.setLineDash([8, 10]);
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.aura, 0, TAU);
        ctx.stroke();
        ctx.restore();
      } else if (e.type === 'mine') {
        const blink = 0.45 + Math.sin(e.pulse * 2.2) * 0.35;
        ctx.save();
        ctx.globalAlpha = 0.12 + blink * 0.22;
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(e.x, e.y, r * (2.2 + blink * 0.9), 0, TAU);
        ctx.stroke();
        ctx.restore();
      } else if (e.type === 'riftCore') {
        const hpPct = Math.max(0, Math.min(1, (e.hp || 0) / Math.max(1, e.maxHp || 1)));
        const resting = (e.spawnRestTimer || 0) > 0;
        ctx.save();
        ctx.globalAlpha = resting ? 0.10 + Math.sin(e.pulse * 1.1) * 0.03 : 0.16 + Math.sin(e.pulse * 1.4) * 0.05;
        ctx.strokeStyle = resting ? '#52ff8f' : '#37f8ff';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 12]);
        ctx.beginPath();
        ctx.arc(e.x, e.y, r * 2.8, 0, TAU);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 0.22;
        ctx.strokeStyle = '#ff2df7';
        ctx.beginPath();
        ctx.arc(e.x, e.y, r * (1.55 + (1 - hpPct) * 0.45), -Math.PI / 2, -Math.PI / 2 + TAU * hpPct);
        ctx.stroke();
        ctx.restore();
      }

      ctx.beginPath();
      // В drawEnemies только рисуем врагов.
      // Логика движения/стрельбы/аур выполняется в updateEnemies().

      if (e.type === 'boss') {
        drawBossVisual(e, r);
        ctx.beginPath();
      }
      else if (e.type === 'bossAnchor') { drawPoly(e.x, e.y, r * 1.25, 6, e.pulse * 0.5); ctx.stroke(); ctx.beginPath(); ctx.globalAlpha = 0.28; ctx.arc(e.x, e.y, r * 2.2, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; ctx.beginPath(); }
      else if (e.type === 'gravityNode') { ctx.lineWidth = 4; drawPoly(e.x, e.y, r * 1.22, 5, -e.pulse * 0.7); ctx.stroke(); ctx.beginPath(); ctx.globalAlpha = 0.20; ctx.arc(e.x, e.y, r * 3.1, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(e.x, e.y, r * 0.55, 0, TAU); ctx.stroke(); ctx.beginPath(); }
      else if (e.type === 'riftCore') {
        const flashA = Math.max(0, e.hitFlash || 0) * 2.8;
        ctx.save();
        ctx.lineWidth = 5;
        ctx.strokeStyle = flashA > 0 ? '#ffe35a' : '#37f8ff';
        ctx.fillStyle = hexToRgba('#37f8ff', 0.10 + flashA * 0.12);
        drawPoly(e.x, e.y, r * 1.45, 8, e.pulse * 0.18);
        ctx.stroke();
        ctx.fill();
        ctx.rotate(0);
        ctx.beginPath();
        ctx.arc(e.x, e.y, r * 0.62, 0, TAU);
        ctx.strokeStyle = '#ff2df7';
        ctx.stroke();
        ctx.beginPath();
        const a = e.pulse * 0.7;
        for (let k = 0; k < 4; k++) {
          const aa = a + k * Math.PI / 2;
          ctx.moveTo(e.x + Math.cos(aa) * r * 0.85, e.y + Math.sin(aa) * r * 0.85);
          ctx.lineTo(e.x + Math.cos(aa) * r * 1.8, e.y + Math.sin(aa) * r * 1.8);
        }
        ctx.strokeStyle = '#37f8ff';
        ctx.stroke();
        ctx.restore();
        ctx.beginPath();
      }
      else if (e.type === 'charger') drawPoly(e.x, e.y, r * 1.25, 3, e.pulse);
      else if (e.type === 'mine') {
        drawPoly(e.x, e.y, r * 1.28, 8, -e.pulse * 0.2);
        ctx.moveTo(e.x + Math.cos(e.pulse) * r * 1.7, e.y + Math.sin(e.pulse) * r * 1.7);
        ctx.arc(e.x, e.y, r * 1.7, e.pulse, e.pulse + Math.PI * 1.2);
      }
      else if (e.type === 'splitter') drawPoly(e.x, e.y, r * 1.18, 6, e.pulse * 0.45);
      else if (e.type === 'orbiter') drawPoly(e.x, e.y, r * 1.08, 5, -e.pulse * 0.4);
      else if (e.type === 'shooter') drawPoly(e.x, e.y, r * 1.08, 3, -e.pulse * 0.9);
      else if (e.type === 'needle') {
        const a = Math.atan2(e.vy, e.vx);
        drawPoly(e.x, e.y, r * 1.45, 3, a);
        ctx.moveTo(e.x - Math.cos(a) * r * 1.2, e.y - Math.sin(a) * r * 1.2);
        ctx.lineTo(e.x - Math.cos(a) * r * 3.0, e.y - Math.sin(a) * r * 3.0);
      }
      else if (e.type === 'shield') {
        drawPoly(e.x, e.y, r * 1.1, 6, e.pulse * 0.2);
        ctx.stroke();
        ctx.beginPath();
        ctx.save();
        ctx.lineWidth = 8;
        ctx.globalAlpha = 0.95;
        ctx.arc(e.x, e.y, r * 1.68, e.shieldAngle - 0.64, e.shieldAngle + 0.64);
        ctx.stroke();
        ctx.globalAlpha = 0.30;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(e.x, e.y);
        ctx.lineTo(e.x + Math.cos(e.shieldAngle) * r * 2.25, e.y + Math.sin(e.shieldAngle) * r * 2.25);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(e.x + Math.cos(e.shieldAngle) * r * 1.12, e.y + Math.sin(e.shieldAngle) * r * 1.12, r * 0.62, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
      else if (e.type === 'leech') { ctx.save(); ctx.globalAlpha = 0.32; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(player.x, player.y); ctx.stroke(); ctx.restore(); drawPoly(e.x, e.y, r * 1.1, 5, e.pulse * 1.3); }
      else if (e.type === 'siren') { drawPoly(e.x, e.y, r * 1.1, 8, e.pulse * 0.25); ctx.stroke(); ctx.globalAlpha = 0.08; ctx.beginPath(); ctx.arc(e.x, e.y, e.aura, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
      else drawPoly(e.x, e.y, r, 4, e.pulse * 0.55);
      ctx.stroke();

      ctx.fillStyle = hexToRgba(e.color, 0.24);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBossVisual(e, r) {
    const t = state.time;
    const shielded = bossIsShielded(e);
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.lineWidth = 5;
    ctx.strokeStyle = e.color;
    ctx.fillStyle = hexToRgba(e.color, 0.16);

    function ring(rad, alpha = 0.22) {
      ctx.save(); ctx.globalAlpha = alpha; ctx.beginPath(); ctx.arc(0, 0, rad, 0, TAU); ctx.stroke(); ctx.restore();
    }
    function spoke(count, inner, outer, rot, alpha = 0.9) {
      ctx.save(); ctx.globalAlpha = alpha;
      for (let i = 0; i < count; i++) {
        const a = i / count * TAU + rot;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
        ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (e.bossType === 'warden') {
      // Симметричная крепость: крестовая броня, четыре бастиона, центральный реактор.
      ctx.save(); ctx.rotate(Math.PI / 4); ctx.strokeRect(-r * 0.82, -r * 0.82, r * 1.64, r * 1.64); ctx.fillRect(-r * 0.55, -r * 0.55, r * 1.1, r * 1.1); ctx.restore();
      for (let i = 0; i < FX.backdropRings; i++) {
        const a = i / 4 * TAU;
        ctx.save(); ctx.translate(Math.cos(a) * r * 1.12, Math.sin(a) * r * 1.12); ctx.rotate(a + Math.PI / 4);
        ctx.strokeRect(-r * 0.25, -r * 0.25, r * 0.5, r * 0.5);
        ctx.restore();
      }
      ring(r * 1.38, 0.32); ring(r * 0.58, 0.8);
      spoke(4, r * 0.22, r * 1.25, Math.PI / 4, 0.65);
    } else if (e.bossType === 'laser') {
      // Симметричный кристалл-линза: две пирамиды и горизонтальная оптика.
      ctx.save(); ctx.rotate(Math.sin(t * 0.8) * 0.05);
      ctx.beginPath(); ctx.moveTo(0, -r * 1.45); ctx.lineTo(r * 0.82, 0); ctx.lineTo(0, r * 1.45); ctx.lineTo(-r * 0.82, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-r * 1.45, 0); ctx.lineTo(-r * 0.55, -r * 0.28); ctx.lineTo(r * 0.55, -r * 0.28); ctx.lineTo(r * 1.45, 0); ctx.lineTo(r * 0.55, r * 0.28); ctx.lineTo(-r * 0.55, r * 0.28); ctx.closePath(); ctx.stroke();
      ctx.restore();
      ring(r * 0.46, 0.9); spoke(8, r * 0.6, r * 1.12, t * 0.25, 0.35);
    } else if (e.bossType === 'maw') {
      // Гравитационная пасть: двойное кольцо, вращающиеся лепестки, темная симметричная сердцевина.
      ring(r * 1.32, 0.78); ring(r * 0.88, 0.5);
      ctx.save(); ctx.rotate(-e.pulse * 0.23);
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * TAU;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.86, Math.sin(a) * r * 0.86);
        ctx.lineTo(Math.cos(a + 0.13) * r * 1.32, Math.sin(a + 0.13) * r * 1.32);
        ctx.lineTo(Math.cos(a - 0.13) * r * 1.32, Math.sin(a - 0.13) * r * 1.32);
        ctx.closePath(); ctx.stroke(); ctx.fill();
      }
      ctx.restore();
      ctx.save(); ctx.globalAlpha = 0.78; ctx.fillStyle = '#02030a'; ctx.beginPath(); ctx.arc(0, 0, r * 0.48 + Math.sin(t * 5) * 2, 0, TAU); ctx.fill(); ctx.restore();
      spoke(6, r * 0.55, r * 1.15, e.pulse * 0.18, 0.38);
    } else if (e.bossType === 'split') {
      // Двойное ядро: два синхронных симметричных реактора.
      ctx.save(); ctx.rotate(Math.sin(t * 1.3) * 0.08);
      drawPoly(-r * 0.43, 0, r * 0.72, 6, Math.PI / 6); ctx.fill(); ctx.stroke();
      drawPoly(r * 0.43, 0, r * 0.72, 6, Math.PI / 6); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -r * 1.15); ctx.lineTo(0, r * 1.15); ctx.stroke();
      ctx.beginPath(); ctx.arc(-r * 0.43, 0, r * 0.28, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.arc(r * 0.43, 0, r * 0.28, 0, TAU); ctx.stroke();
      ctx.restore();
    } else if (e.bossType === 'mirror') {
      // Зеркальная нова: идеальный ромб, две отражающие дуги и центральная призма.
      ctx.save(); ctx.rotate(Math.PI / 4);
      ctx.strokeRect(-r * 0.82, -r * 0.82, r * 1.64, r * 1.64); ctx.fillRect(-r * 0.52, -r * 0.52, r * 1.04, r * 1.04);
      ctx.restore();
      ctx.beginPath(); ctx.arc(0, 0, r * 0.88, -0.95, 0.95); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, r * 0.88, Math.PI - 0.95, Math.PI + 0.95); ctx.stroke();
      ring(r * 1.18, 0.24); spoke(4, r * 0.28, r * 1.0, Math.PI / 4, 0.55);
    } else {
      drawPoly(0, 0, r * 1.15, 8, -e.pulse * 0.22); ctx.stroke(); ctx.fill();
    }

    // Показываем реальный корпус столкновения, но очень тонко: это помогает считывать, куда бить dash'ем.
    ctx.save(); ctx.globalAlpha = 0.18; ctx.setLineDash([6, 8]); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, bossCollisionRadius(e), 0, TAU); ctx.stroke(); ctx.restore();

    if (shielded) {
      ctx.save(); ctx.globalAlpha = 0.28; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(0, 0, r * 1.55, 0, TAU); ctx.stroke(); ctx.restore();
    }

    ctx.restore();
  }

  function drawPickups() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of pickups) {
      ctx.globalAlpha = Math.min(1, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      drawPoly(p.x, p.y, p.r + Math.sin(state.time * 8) * 1.2, 4, state.time * 3);
      ctx.fill();
      ctx.globalAlpha *= 0.2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 2.6, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawZones() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const z of zones) {
      ctx.globalAlpha = Math.max(0, z.life / z.maxLife) * 0.25;
      ctx.strokeStyle = z.color;
      ctx.fillStyle = z.color;
      ctx.lineWidth = z.kind === 'pulse' ? 5 : 3;
      ctx.beginPath();
      ctx.arc(z.x, z.y, z.r, 0, TAU);
      if (z.kind === 'gravity') ctx.fill(); else ctx.stroke();
      if (z.kind === 'deadzone') {
        ctx.globalAlpha *= 0.45;
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawHazards() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const h of hazards) {
      ctx.globalAlpha = Math.min(1, h.life);
      ctx.fillStyle = h.color;
      ctx.strokeStyle = h.color;
      if (h.kind === 'laser') {
        const t = Math.max(0, Math.min(1, h.life / h.maxLife));
        const active = t < 0.72;
        const beamLen = h.len || Math.max(W, H) * 1.4;
        const sx = h.sx || Math.cos(h.angle);
        const sy = h.sy || Math.sin(h.angle);
        const ex = h.x + sx * beamLen;
        const ey = h.y + sy * beamLen;
        const nx = -sy;
        const ny = sx;

        // muzzle glow
        const muzzleGlow = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, active ? 54 : 34);
        muzzleGlow.addColorStop(0, hexToRgba('#ffffff', active ? 0.30 : 0.18));
        muzzleGlow.addColorStop(0.35, hexToRgba('#ff74f5', active ? 0.25 : 0.14));
        muzzleGlow.addColorStop(1, hexToRgba('#ff2df7', 0));
        ctx.fillStyle = muzzleGlow;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(h.x, h.y, active ? 54 : 34, 0, TAU);
        ctx.fill();

        if (!active) {
          // warning telegraph before firing
          ctx.globalAlpha = 0.32 + (1 - t) * 0.28;
          ctx.strokeStyle = '#ff7af8';
          ctx.lineWidth = Math.max(3, h.width * 0.30);
          ctx.setLineDash([16, 12]);
          ctx.beginPath();
          ctx.moveTo(h.x, h.y);
          ctx.lineTo(ex, ey);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.globalAlpha = 0.10 + (1 - t) * 0.08;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = h.width * 1.65;
          ctx.beginPath();
          ctx.moveTo(h.x, h.y);
          ctx.lineTo(ex, ey);
          ctx.stroke();
        } else {
          const pulse = 0.92 + Math.sin((state.time || 0) * 40 + (h.phase || 0)) * 0.08;
          const outerGrad = ctx.createLinearGradient(h.x, h.y, ex, ey);
          outerGrad.addColorStop(0, hexToRgba('#ffd2ff', 0.18));
          outerGrad.addColorStop(0.15, hexToRgba('#ff77f7', 0.46));
          outerGrad.addColorStop(0.65, hexToRgba('#b34cff', 0.32));
          outerGrad.addColorStop(1, hexToRgba('#72e7ff', 0.16));

          // outer bloom
          ctx.globalAlpha = 0.90;
          ctx.strokeStyle = outerGrad;
          ctx.lineCap = 'round';
          ctx.lineWidth = h.width * (1.9 * pulse);
          ctx.beginPath();
          ctx.moveTo(h.x, h.y);
          ctx.lineTo(ex, ey);
          ctx.stroke();

          // side rails
          ctx.globalAlpha = 0.44;
          ctx.strokeStyle = '#ff8cf8';
          ctx.lineWidth = 2.2;
          for (const side of [-1, 1]) {
            ctx.beginPath();
            ctx.moveTo(h.x + nx * side * 5, h.y + ny * side * 5);
            ctx.lineTo(ex + nx * side * 5, ey + ny * side * 5);
            ctx.stroke();
          }

          // core beam
          const coreGrad = ctx.createLinearGradient(h.x, h.y, ex, ey);
          coreGrad.addColorStop(0, hexToRgba('#ffffff', 0.95));
          coreGrad.addColorStop(0.20, hexToRgba('#ffe8ff', 0.98));
          coreGrad.addColorStop(0.65, hexToRgba('#baf8ff', 0.90));
          coreGrad.addColorStop(1, hexToRgba('#ffffff', 0.88));
          ctx.globalAlpha = 0.98;
          ctx.strokeStyle = coreGrad;
          ctx.lineWidth = Math.max(3, h.width * 0.34 * pulse);
          ctx.beginPath();
          ctx.moveTo(h.x, h.y);
          ctx.lineTo(ex, ey);
          ctx.stroke();

          // impact flare
          const impactGlow = ctx.createRadialGradient(ex, ey, 0, ex, ey, 28);
          impactGlow.addColorStop(0, hexToRgba('#ffffff', 0.46));
          impactGlow.addColorStop(0.3, hexToRgba('#aef5ff', 0.28));
          impactGlow.addColorStop(1, hexToRgba('#72e7ff', 0));
          ctx.fillStyle = impactGlow;
          ctx.beginPath();
          ctx.arc(ex, ey, 28, 0, TAU);
          ctx.fill();
        }
        continue;
      }
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.r, 0, TAU);
      ctx.fill();
      ctx.globalAlpha *= 0.25;
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.r * 3.2, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawParticles() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of particles) {
      const a = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = a * (FX.quality === 'low' ? 0.55 : FX.quality === 'high' ? 0.95 : 0.78);
      ctx.fillStyle = p.color;
      const pr = FX.quality === 'high' ? p.r * 1.18 : FX.quality === 'low' ? p.r * 0.82 : p.r;
      ctx.fillRect(p.x - pr * 0.5, p.y - pr * 0.5, pr, pr);
    }
    ctx.restore();
  }

  function drawShockwaves() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const s of shockwaves) {
      ctx.globalAlpha = s.alpha;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = FX.quality === 'high' ? 5 : FX.quality === 'low' ? 2 : 3;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.stroke();
    }
    ctx.restore();
  }

  function drawFloaters() {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const f of floaters) {
      const a = Math.max(0, f.life / f.maxLife);
      ctx.globalAlpha = a;
      ctx.font = `900 ${f.size * f.scale}px Orbitron, sans-serif`;
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.restore();
  }

  function drawVignette() {
    ctx.save();

    // v87: soft vignette instead of hard rectangular edge overlays.
    // The old version used fillRect() strips at top/bottom/left/right,
    // which created a visible dark rectangle at the bottom of the playfield.
    const vignette = ctx.createRadialGradient(
      W * 0.5, H * 0.48, Math.min(W, H) * 0.18,
      W * 0.5, H * 0.52, Math.max(W, H) * 0.74
    );
    vignette.addColorStop(0.00, 'rgba(0,0,0,0)');
    vignette.addColorStop(0.62, 'rgba(0,0,0,0.02)');
    vignette.addColorStop(0.86, 'rgba(0,0,0,0.12)');
    vignette.addColorStop(1.00, 'rgba(0,0,0,0.28)');

    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    // Keep the subtle scanline texture, but no edge rectangles.
    ctx.globalAlpha = 0.035;
    ctx.fillStyle = '#ffffff';
    for (let y = 0; y < H; y += 6) ctx.fillRect(0, y, W, 1);

    ctx.restore();
  }

  function drawPoly(x, y, r, sides, rot = 0) {
    ctx.moveTo(x + Math.cos(rot) * r, y + Math.sin(rot) * r);
    for (let i = 1; i <= sides; i++) {
      const a = rot + i / sides * TAU;
      ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
  }

  function updateUI() {
    ui.score.textContent = Math.floor(state.score).toLocaleString('ru-RU');
    if (ui.combo) ui.combo.textContent = `x${state.combo}`;
    if (ui.hud) ui.hud.classList.toggle('hide-wave', state.mode === 'rush');
    if (ui.waveCard) ui.waveCard.style.display = state.mode === 'rush' ? 'none' : '';
    ui.wave.textContent = state.mode === 'rush' ? formatTime(runTimer) : state.mode === 'zen' ? '∞' : state.wave;
    if (ui.waveCount) {
      if (state.mode === 'zen') {
        if (ui.waveCountLabel) ui.waveCountLabel.textContent = 'ZEN';
        ui.waveCount.textContent = 'FLOW';
        ui.waveCount.title = 'Свободный режим: без урона, волн и апгрейд-пауз.';
      } else if (state.mode === 'rush') {
        if (ui.waveCountLabel) ui.waveCountLabel.textContent = 'ВЫЖИВАНИЕ';
        ui.waveCount.textContent = formatTime(runTimer);
        ui.waveCount.title = 'Рекорд считается по времени. Давление растет, боссы приходят всё чаще.';
      } else if (state.mode === 'boss') {
        if (ui.waveCountLabel) ui.waveCountLabel.textContent = state.bossAlive ? 'БОСС' : 'РАЗЛОМЫ';
        ui.waveCount.textContent = state.bossAlive ? 'ФАЗА' : `${state.riftsClosed || 0}`;
        ui.waveCount.title = 'Rift: закрывай разломы dash’ем. После нескольких разломов появляется босс.';
      } else if (state.bossAlive) {
        if (ui.waveCountLabel) ui.waveCountLabel.textContent = 'БОСС';
        ui.waveCount.textContent = 'ФАЗА';
        ui.waveCount.title = 'Босс-волна: уничтожь босса, затем выбери улучшение.';
      } else {
        const killed = Math.max(0, Math.min(state.killsInWave, state.requiredKills));
        const left = getWaveRemaining();
        const spawned = Math.max(0, Math.min(state.spawnedInWave, state.requiredKills));
        if (ui.waveCountLabel) ui.waveCountLabel.textContent = 'ВРАГИ';
        ui.waveCount.textContent = `ЕЩЁ ${left}`;
        ui.waveCount.title = `Уничтожено: ${killed}/${state.requiredKills}. Выпущено: ${spawned}/${state.requiredKills}. На арене: ${enemies.filter(isWaveCombatant).length}.`;
      }
    }
    const hpPct = Math.max(0, player.hp / player.maxHp * 100);
    ui.hp.textContent = `${Math.round(hpPct)}%`;
    ui.hpBar.style.width = `${hpPct}%`;
    const dashPct = 100 * (1 - player.dashCooldown / player.dashMax);
    ui.dashBar.style.width = `${Math.max(0, Math.min(100, dashPct))}%`;
    ui.dash.textContent = player.dashCooldown <= 0 ? 'READY' : `${Math.ceil(player.dashCooldown * 10) / 10}s`;
    const odPct = state.overdriveTime > 0 ? 100 : state.overdrive;
    ui.overdriveBar.style.width = `${Math.max(0, Math.min(100, odPct))}%`;
    ui.overdrive.textContent = state.overdriveTime > 0 ? `${state.overdriveTime.toFixed(1)}s` : `${Math.floor(state.overdrive)}%`;
    if (ui.laser && ui.laserBar) {
      const laserPct = 100 * (1 - player.laserCooldown / player.laserMax);
      ui.laserBar.style.width = `${Math.max(0, Math.min(100, laserPct))}%`;
      ui.laser.textContent = player.laserCooldown <= 0 ? 'READY' : `${Math.ceil(player.laserCooldown * 10) / 10}s`;
    }
    if (ui.mod) {
      const relicCount = (state.relics || []).length;
      const baseMod = state.mode === 'zen' ? 'ZEN MODE' : state.mode === 'rush' ? 'SURVIVE' : state.mode === 'boss' ? (state.bossAlive ? 'RIFT BOSS' : 'RIFT') : state.bossAlive ? 'BOSS' : (state.modifier?.name || '—');
      ui.mod.textContent = relicCount ? `${baseMod} · R${relicCount}` : baseMod;
    }

    if (ui.bossHud && ui.bossHpBar) {
      const activeBosses = enemies.filter(e => e.type === 'boss' && !e.dead);
      if (activeBosses.length) {
        const hp = activeBosses.reduce((sum, e) => sum + Math.max(0, e.hp || 0), 0);
        const maxHp = activeBosses.reduce((sum, e) => sum + Math.max(1, e.maxHp || e.hp || 1), 0);
        const pct = Math.max(0, Math.min(100, hp / maxHp * 100));
        const names = { warden:'NOVA WARDEN', laser:'LASER ORACLE', maw:'GRAVITY MAW', split:'SPLIT CORE', mirror:'MIRROR NOVA' };
        const main = activeBosses[0];
        ui.bossHud.classList.add('show');
        if (ui.bossName) ui.bossName.textContent = activeBosses.length > 1 ? 'SPLIT CORE' : (names[main.bossType] || 'BOSS');
        if (ui.bossPhase) ui.bossPhase.textContent = state.mode === 'boss' ? 'RIFT BOSS' : 'CORE INTEGRITY';
        ui.bossHpBar.style.width = `${pct}%`;
      } else {
        ui.bossHud.classList.remove('show');
        ui.bossHpBar.style.width = '0%';
      }
    }
  }

  function loop(now) {
    const dt = (now - last) / 1000;
    last = now;
    if (!paused) update(dt);
    render();
    requestAnimationFrame(loop);
  }

  function removeDead(arr, predicate) {
    for (let i = arr.length - 1; i >= 0; i--) if (predicate(arr[i])) arr.splice(i, 1);
  }

  function rand(min, max) { return min + Math.random() * (max - min); }

  function hexToRgba(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return `rgba(${r},${g},${b},${a})`;
  }

  window.addEventListener('resize', resize);
  window.addEventListener('keydown', (e) => {
    unlockAudio();
    keys.add(e.code);
    if (e.code === 'Escape' || e.code === 'KeyP') { e.preventDefault(); togglePause(); return; }
    if (paused) return;
    if (e.code === 'Space') { e.preventDefault(); fireLaser(); }
    if (e.code === 'KeyR') reset();
    if (e.code === 'KeyE') activateOverdrive();
    if (e.code === 'KeyQ') toggleQuality();
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));

  canvas.addEventListener('pointermove', (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.active = true;
  });
  canvas.addEventListener('pointerdown', (e) => {
    unlockAudio();
    pointer.down = true;
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.active = true;
    if (!paused) dash();
  });
  window.addEventListener('pointerup', () => { pointer.down = false; });

    if (ui.modeSelect) {
    ui.modeSelect.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedMode = btn.dataset.mode;
        ui.modeSelect.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateModeDescription();
      });
    });
  }

  const modeDescriptions = {
    classic: '<b>Classic</b> — основной забег: зачищай волны, выбирай модули, переживай боссов.',
    rush: '<b>Survival</b> — бесконечное выживание на рекорд времени.',
    boss: '<b>Rift</b> — закрывай разломы dash’ем, сдерживай поток врагов и переживи босса.',
    onehp: '<b>One HP</b> — режим точности: один пропущенный удар завершает забег.',
    zen: '<b>Zen</b> — свободный свободный режим, бессмертие: нет урона, волн и пауз, только движение и эффекты.'
  };

  function updateModeDescription() {
    if (ui.modeDescription) ui.modeDescription.innerHTML = modeDescriptions[selectedMode] || '';
  }

  function modeName(id) {
    return ({ classic:'Classic', rush:'Survival', boss:'Rift', onehp:'One HP', zen:'Zen' })[id] || id;
  }

  let lastUiHoverButton = null;

  function uiSoundForButton(btn) {
    if (!btn || btn.disabled || btn.closest('.mobile-controls')) return null;
    if (btn.classList.contains('upgrade-card')) return null;
    if (btn.classList.contains('mode-btn')) return 'uiSelect';
    if (btn.id === 'startBtn' || btn.id === 'playMenuBtn') return 'uiConfirm';
    if (btn.id === 'backToMainBtn') return 'uiBack';
    if (btn.id === 'settingsBtn' || btn.id === 'customizeBtn' || btn.id === 'creditsBtn' || btn.id === 'pauseBtn' || btn.id === 'pauseSettingsBtn' || btn.id === 'pauseControlsBtn') return 'uiOpen';
    if (btn.id === 'settingsCloseBtn' || btn.id === 'customizeCloseBtn' || btn.id === 'controlsCloseBtn' || btn.id === 'creditsCloseBtn' || btn.id === 'menuBtn') return 'uiBack';
    if (btn.id === 'resumeBtn') return 'uiClose';
    if (btn.closest('#effectsSelect') || btn.id === 'shakeToggle' || btn.id === 'soundToggle' || btn.id === 'fullscreenToggle') return 'uiToggle';
    return 'uiClick';
  }

  function installUiAudio() {
    document.addEventListener('pointerover', (e) => {
      const btn = e.target.closest && e.target.closest('button');
      if (!btn || btn === lastUiHoverButton || btn.closest('.mobile-controls')) return;
      lastUiHoverButton = btn;
      playSfx('uiHover', 0.55);
    }, true);

    document.addEventListener('pointerout', (e) => {
      const btn = e.target.closest && e.target.closest('button');
      if (btn && btn === lastUiHoverButton) lastUiHoverButton = null;
    }, true);

    document.addEventListener('pointerdown', (e) => {
      const btn = e.target.closest && e.target.closest('button');
      const key = uiSoundForButton(btn);
      if (key) playSfx(key, key === 'uiUpgrade' ? 0.82 : 0.72);
    }, true);
  }

  installUiAudio();

  if (ui.playMenuBtn) ui.playMenuBtn.addEventListener('click', (e) => {
    e.preventDefault();
    setMenuScreen('play');
    updateModeDescription();
    syncPauseButton();
  });
  if (ui.backToMainBtn) ui.backToMainBtn.addEventListener('click', (e) => {
    e.preventDefault();
    setMenuScreen('home');
    syncPauseButton();
  });

  ui.start.addEventListener('click', (e) => {
    e.preventDefault();
    unlockAudio();
    ambientStarted = true;
    startAmbient();
    hideMenus();
    reset();
  });
  if (ui.creditsBtn && ui.credits) ui.creditsBtn.addEventListener('click', () => { if (ui.settingsOverlay) ui.settingsOverlay.classList.remove('show');
      syncPauseButton(); if (ui.controlsOverlay) ui.controlsOverlay.classList.remove('show');
      syncPauseButton(); ui.credits.classList.remove('show'); void ui.credits.offsetWidth; ui.credits.classList.add('show'); syncPauseButton(); });
  if (ui.creditsClose && ui.credits) ui.creditsClose.addEventListener('click', () => { ui.credits.classList.remove('show'); syncPauseButton(); });
  if (ui.credits) ui.credits.addEventListener('click', (e) => { if (e.target === ui.credits) { ui.credits.classList.remove('show'); syncPauseButton(); } });

  if (ui.customizeBtn && ui.customizeOverlay) {
    ui.customizeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openCustomizePanel(false);
    });
  }
  if (ui.customizeClose && ui.customizeOverlay) {
    ui.customizeClose.addEventListener('click', (e) => {
      e.preventDefault();
      ui.customizeOverlay.classList.remove('show');
      syncPauseButton();
    });
  }
  if (ui.customizeOverlay) {
    ui.customizeOverlay.addEventListener('click', (e) => {
      if (e.target === ui.customizeOverlay) { ui.customizeOverlay.classList.remove('show'); syncPauseButton(); }
    });
  }

  if (ui.settingsBtn && ui.settingsOverlay) {
    ui.settingsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openSettingsPanel(false);
    });
  }
  if (ui.settingsClose && ui.settingsOverlay) {
    ui.settingsClose.addEventListener('click', (e) => {
      e.preventDefault();
      ui.settingsOverlay.classList.remove('show');
      syncPauseButton();
    });
  }
  if (ui.settingsOverlay) {
    ui.settingsOverlay.addEventListener('click', (e) => {
      if (e.target === ui.settingsOverlay) { ui.settingsOverlay.classList.remove('show'); syncPauseButton(); }
      syncPauseButton();
    });
  }
  if (ui.controlsBtn && ui.controlsOverlay) {
    ui.controlsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openControlsPanel(false);
    });
  }
  if (ui.controlsClose && ui.controlsOverlay) {
    ui.controlsClose.addEventListener('click', (e) => {
      e.preventDefault();
      ui.controlsOverlay.classList.remove('show');
      syncPauseButton();
    });
  }
  if (ui.controlsOverlay) {
    ui.controlsOverlay.addEventListener('click', (e) => {
      if (e.target === ui.controlsOverlay) { ui.controlsOverlay.classList.remove('show'); syncPauseButton(); }
      syncPauseButton();
    });
  }
  if (ui.effectsSelect) {
    ui.effectsSelect.querySelectorAll('button[data-quality]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        settings.quality = btn.dataset.quality || 'medium';
        saveSettings();
        applySettings();
      });
    });
  }
  if (ui.shakeToggle) {
    ui.shakeToggle.addEventListener('click', (e) => {
      e.preventDefault();
      settings.shake = !settings.shake;
      saveSettings();
      renderSettingsUI();
    });
  }
  if (ui.soundToggle) {
    ui.soundToggle.addEventListener('click', (e) => {
      e.preventDefault();
      settings.sound = !settings.sound;
      saveSettings();
      if (settings.sound) { unlockAudio(); ambientStarted = true; startAmbient(); }
      else stopAmbient();
      renderSettingsUI();
    });
  }
  if (ui.fullscreenToggle) {
    ui.fullscreenToggle.addEventListener('click', async (e) => {
      e.preventDefault();
      await toggleFullscreen();
    });
  }
  if (ui.skinSelect) {
    ui.skinSelect.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-skin]');
      if (!btn) return;
      const id = btn.dataset.skin;
      const defs = skinDefs();
      const skin = defs[id] || defs.nova;
      if (!isSkinUnlocked(id)) {
        if (ui.skinHint) ui.skinHint.textContent = skin.hint;
        playSfx('uiDenied', 0.85);
        return;
      }
      settings.skin = id;
      saveSettings();
      renderSettingsUI();
      const selected = ui.skinSelect && ui.skinSelect.querySelector(`[data-skin="${id}"]`);
      if (selected) {
        selected.classList.remove('skin-just-selected');
        void selected.offsetWidth;
        selected.classList.add('skin-just-selected');
      }
      playSfx('uiSelect', 0.9);
    });
  }
  document.addEventListener('fullscreenchange', renderSettingsUI);
  document.addEventListener('webkitfullscreenchange', renderSettingsUI);
  if (ui.pauseBtn) ui.pauseBtn.addEventListener('click', (e) => { e.preventDefault(); togglePause(); });
  if (ui.resumeBtn) ui.resumeBtn.addEventListener('click', (e) => { e.preventDefault(); closePause(); });
  if (ui.pauseSettingsBtn) ui.pauseSettingsBtn.addEventListener('click', (e) => { e.preventDefault(); openSettingsPanel(true); });
  if (ui.pauseControlsBtn) ui.pauseControlsBtn.addEventListener('click', (e) => { e.preventDefault(); openControlsPanel(true); });
  if (ui.menuBtn) ui.menuBtn.addEventListener('click', (e) => { e.preventDefault(); showMainMenu(); });
  if (ui.pauseOverlay) ui.pauseOverlay.addEventListener('click', (e) => { if (e.target === ui.pauseOverlay) closePause(); });
  if (ui.dashMobile) ui.dashMobile.addEventListener('pointerdown', (e) => { e.preventDefault(); if (!paused) dash(); });
  if (ui.laserMobile) ui.laserMobile.addEventListener('pointerdown', (e) => { e.preventDefault(); if (!paused) fireLaser(); });
  if (ui.overdriveMobile) ui.overdriveMobile.addEventListener('pointerdown', (e) => { e.preventDefault(); if (!paused) activateOverdrive(); });

  if (ui.stickZone) {
    ui.stickZone.addEventListener('pointerdown', stickStart);
    ui.stickZone.addEventListener('pointermove', stickMove);
    ui.stickZone.addEventListener('pointerup', stickEnd);
    ui.stickZone.addEventListener('pointercancel', stickEnd);
  }

  function stickStart(e) {
    e.preventDefault();
    if (paused) return;
    mobileMove.active = true;
    mobileMove.id = e.pointerId;
    ui.stickZone.setPointerCapture(e.pointerId);
    stickMove(e);
  }
  function stickMove(e) {
    if (!mobileMove.active || e.pointerId !== mobileMove.id) return;
    const rect = ui.stickZone.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let x = e.clientX - cx;
    let y = e.clientY - cy;
    const d = Math.hypot(x, y);
    const max = Math.min(rect.width, rect.height) * 0.34;
    if (d > max) { x = x / d * max; y = y / d * max; }
    mobileMove.x = x / max;
    mobileMove.y = y / max;
    ui.stickKnob.style.transform = `translate(${x}px, ${y}px)`;
  }
  function stickEnd(e) {
    if (e.pointerId !== mobileMove.id) return;
    mobileMove.active = false;
    mobileMove.id = null;
    mobileMove.x = 0;
    mobileMove.y = 0;
    ui.stickKnob.style.transform = 'translate(0, 0)';
  }

  function toggleQuality() {
    const order = ['low', 'medium', 'high'];
    const i = order.indexOf(settings.quality || 'medium');
    settings.quality = order[(i + 1 + order.length) % order.length];
    saveSettings();
    applySettings();
  }

  applySettings();
  resize();
  updateModeDescription();
  renderRecords();
  updateUI();
  requestAnimationFrame(loop);
})();
