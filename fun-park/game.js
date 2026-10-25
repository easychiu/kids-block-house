/* ==========================================================================
   🎪 阿奇小隊歡樂遊樂園 — 5歲兒童益智互動世界 (純音樂配樂 + 睡前晚安哄睡版)
   ========================================================================== */

(() => {
  'use strict';

  // -------------------- Global State --------------------
  let stars = Number(localStorage.getItem('archie_funpark_stars') || 0);
  let voiceEnabled = true;
  let bgmPlaying = false;
  let currentTrackIdx = 0; // Default 0 = Pure Instrumental Daytime BGM
  let isBedtimeMode = false;
  let audioCtx = null;

  // 4 Mureka Tracks: 0 & 1 are Pure Instrumental (no lyrics!), 2 & 3 are Optional Vocal Songs
  const MUREKA_TRACKS = [
    {
      id: 'inst_day',
      shortName: '純音樂1',
      title: '阿奇遊樂園純音樂 (木琴遊戲日)',
      src: './audio/bgm_inst_day.mp3',
      cover: './audio/cover_inst_day.jpg',
      isInstrumental: true,
      cardId: 'songCardInst1',
      desc: '正在播放 Mureka 純音樂配樂：阿奇遊樂園木琴遊戲日，沒有歌詞干擾，聽阿奇說話最清楚喔！'
    },
    {
      id: 'inst_night',
      shortName: '晚安純音樂',
      title: '星空晚安水晶音樂盒 (純音樂)',
      src: './audio/bgm_inst_night.mp3',
      cover: './audio/cover_inst_night.jpg',
      isInstrumental: true,
      cardId: 'songCardInst2',
      desc: '正在播放 Mureka 睡前純音樂：星空晚安水晶音樂盒，柔柔的音樂陪寶貝放鬆心情～'
    },
    {
      id: 'vocal_train',
      shortName: '兒歌1',
      title: '快樂小火車出發囉 (兒歌演唱)',
      src: './audio/bgm1.mp3',
      cover: './audio/cover1.jpg',
      isInstrumental: false,
      cardId: 'songCardVocal1',
      desc: '正在播放兒歌演唱：快樂小火車出發囉！一起拍拍手唱歌吧！'
    },
    {
      id: 'vocal_pizza',
      shortName: '兒歌2',
      title: '阿奇搖擺披薩歌 (兒歌演唱)',
      src: './audio/bgm2.mp3',
      cover: './audio/cover2.jpg',
      isInstrumental: false,
      cardId: 'songCardVocal2',
      desc: '正在播放兒歌演唱：阿奇搖擺披薩歌！一起扭一扭！'
    }
  ];

  // DOM Elements
  const starCountNum = document.getElementById('starCountNum');
  const coachSpeech = document.getElementById('coachSpeech');
  const coachBtn = document.getElementById('coachBtn');
  const coachAvatarEmoji = document.getElementById('coachAvatarEmoji');
  const voiceToggleBtn = document.getElementById('voiceToggleBtn');
  const bgmAudio = document.getElementById('bgmAudio');
  const bgmToggleBtn = document.getElementById('bgmToggleBtn');
  const bgmSwitchBtn = document.getElementById('bgmSwitchBtn');
  const bgmIcon = document.getElementById('bgmIcon');
  const bgmLabel = document.getElementById('bgmLabel');
  const bgmTrackName = document.getElementById('bgmTrackName');
  const bedtimeToggleBtn = document.getElementById('bedtimeToggleBtn');
  const bedtimeToggleIcon = document.getElementById('bedtimeToggleIcon');
  const bedtimeToggleText = document.getElementById('bedtimeToggleText');
  const confettiLayer = document.getElementById('confettiLayer');

  starCountNum.textContent = stars;

  // -------------------- Audio & Speech Helpers --------------------
  function getAudioCtx() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function playTone(freq = 523.25, duration = 0.22, type = 'sine', vol = 0.16) {
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isBedtimeMode ? 'sine' : type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      const effectiveVol = isBedtimeMode ? Math.min(vol, 0.09) : vol;
      gain.gain.setValueAtTime(effectiveVol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (_) {}
  }

  function playSuccessFanfare() {
    if (isBedtimeMode) {
      // Soft bedtime lullaby chime instead of loud fanfare
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((f, idx) => {
        setTimeout(() => playTone(f, 0.45, 'sine', 0.08), idx * 180);
      });
      return;
    }
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, idx) => {
      setTimeout(() => playTone(f, 0.22, 'triangle', 0.2), idx * 110);
    });
  }

  function speakCoach(text, interrupt = true) {
    coachSpeech.textContent = text;
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    try {
      if (interrupt) window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'zh-TW';
      // Softer, slower, calmer voice in Bedtime Mode
      utter.rate = isBedtimeMode ? 0.82 : 0.96;
      utter.pitch = isBedtimeMode ? 0.95 : 1.12;
      utter.volume = isBedtimeMode ? 0.8 : 1.0;
      window.speechSynthesis.speak(utter);
    } catch (_) {}
  }

  function rewardStars(amount = 1, message = '') {
    stars += amount;
    localStorage.setItem('archie_funpark_stars', String(stars));
    starCountNum.textContent = stars;
    playSuccessFanfare();
    spawnConfetti(isBedtimeMode ? 10 : 22);
    if (message) speakCoach(message, true);
  }

  function spawnConfetti(count = 20) {
    const emojis = isBedtimeMode
      ? ['✨', '🌙', '💤', '⭐', '🤍']
      : ['⭐', '🎉', '🎈', '✨', '🍬', '🌟'];
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = 'confetti-piece';
      el.textContent = emojis[i % emojis.length];
      el.style.left = `${8 + Math.random() * 84}%`;
      el.style.top = `${-10 - Math.random() * 20}px`;
      el.style.animationDuration = `${(isBedtimeMode ? 2.2 : 1.2) + Math.random() * 0.9}s`;
      confettiLayer.appendChild(el);
      setTimeout(() => el.remove(), 3200);
    }
  }

  // -------------------- Mureka BGM Controller (Pure Instrumental Default) --------------------
  function loadTrack(idx, autoPlay = false) {
    currentTrackIdx = ((idx % MUREKA_TRACKS.length) + MUREKA_TRACKS.length) % MUREKA_TRACKS.length;
    const t = MUREKA_TRACKS[currentTrackIdx];
    bgmAudio.src = t.src;
    // Gentle background volume so TTS voice is always crystal clear
    bgmAudio.volume = isBedtimeMode ? 0.22 : (t.isInstrumental ? 0.36 : 0.28);
    bgmTrackName.textContent = t.shortName;

    // Highlight active song card in Music tab
    MUREKA_TRACKS.forEach((track, i) => {
      const card = document.getElementById(track.cardId);
      if (!card) return;
      card.classList.toggle('active', i === currentTrackIdx);
      const btn = card.querySelector('.song-play-btn');
      if (btn) {
        if (i === currentTrackIdx && bgmPlaying) {
          btn.textContent = '⏸️ 暫停音樂';
        } else {
          btn.textContent = track.isInstrumental ? '▶️ 播放純音樂' : '▶️ 播放兒歌演唱';
        }
      }
    });

    if (autoPlay) {
      bgmAudio.play().then(() => {
        bgmPlaying = true;
        updateBgmUI();
      }).catch(() => {
        bgmPlaying = false;
        updateBgmUI();
      });
    } else {
      updateBgmUI();
    }
  }

  function updateBgmUI() {
    const t = MUREKA_TRACKS[currentTrackIdx];
    bgmToggleBtn.classList.toggle('playing', bgmPlaying);
    bgmIcon.textContent = bgmPlaying ? '🔊' : (t.isInstrumental ? '🎹' : '🎵');
    bgmLabel.textContent = bgmPlaying
      ? (t.isInstrumental ? '純音樂播放中' : '兒歌播放中')
      : '播放純音樂';

    MUREKA_TRACKS.forEach((track, i) => {
      const card = document.getElementById(track.cardId);
      if (!card) return;
      card.classList.toggle('active', i === currentTrackIdx);
      const btn = card.querySelector('.song-play-btn');
      if (btn) {
        btn.textContent = (i === currentTrackIdx && bgmPlaying)
          ? '⏸️ 暫停音樂'
          : (track.isInstrumental ? '▶️ 播放純音樂' : '▶️ 播放兒歌演唱');
      }
    });
  }

  function toggleBgm() {
    if (bgmPlaying) {
      bgmAudio.pause();
      bgmPlaying = false;
      updateBgmUI();
    } else {
      const t = MUREKA_TRACKS[currentTrackIdx];
      bgmAudio.volume = isBedtimeMode ? 0.22 : (t.isInstrumental ? 0.36 : 0.28);
      bgmAudio.play().then(() => {
        bgmPlaying = true;
        updateBgmUI();
        speakCoach(t.desc);
      }).catch(() => {
        speakCoach('點一下畫面開啟音樂喔！');
      });
    }
  }

  bgmToggleBtn.addEventListener('click', toggleBgm);
  bgmSwitchBtn.addEventListener('click', () => {
    const nextIdx = (currentTrackIdx + 1) % MUREKA_TRACKS.length;
    loadTrack(nextIdx, true);
    speakCoach(MUREKA_TRACKS[nextIdx].desc);
  });

  document.querySelectorAll('.song-play-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.track || 0);
      if (currentTrackIdx === idx && bgmPlaying) {
        toggleBgm();
      } else {
        loadTrack(idx, true);
        speakCoach(MUREKA_TRACKS[idx].desc);
      }
    });
  });

  voiceToggleBtn.addEventListener('click', () => {
    voiceEnabled = !voiceEnabled;
    voiceToggleBtn.classList.toggle('active', voiceEnabled);
    voiceToggleBtn.textContent = voiceEnabled ? '🔊 語音' : '🔇 靜音';
    if (voiceEnabled) speakCoach('阿奇語音打開囉！');
  });

  coachBtn.addEventListener('click', () => {
    playTone(659.25, 0.16, 'triangle');
    speakCoach(coachSpeech.textContent, true);
  });

  // -------------------- Day / Bedtime Mode Switch --------------------
  function setBedtimeMode(enable, switchTab = true) {
    isBedtimeMode = Boolean(enable);
    document.body.classList.toggle('bedtime-mode', isBedtimeMode);

    if (isBedtimeMode) {
      bedtimeToggleIcon.textContent = '☀️';
      bedtimeToggleText.textContent = '回白天遊樂園';
      coachAvatarEmoji.textContent = '🌙';
      // Automatically switch BGM to Track 1 (Starry Night Lullaby Pure Instrumental)
      loadTrack(1, bgmPlaying);
      if (switchTab) {
        activateTab('bedtime', false);
      }
      speakCoach('進入睡前晚安模式囉～燈光變柔柔的，搭配水晶音樂盒純音樂，我們一起陪小動物睡覺吧～');
    } else {
      bedtimeToggleIcon.textContent = '🌙';
      bedtimeToggleText.textContent = '睡前晚安模式';
      coachAvatarEmoji.textContent = '🐶';
      stopAutoSheep();
      // Switch back to Track 0 (Daytime Playful Pure Instrumental)
      loadTrack(0, bgmPlaying);
      if (switchTab) {
        activateTab('train', false);
      }
      speakCoach('早安！回到陽光滿滿的阿奇遊樂園囉！');
    }
  }

  bedtimeToggleBtn.addEventListener('click', () => {
    setBedtimeMode(!isBedtimeMode, true);
  });

  // -------------------- Bottom Tab Navigation --------------------
  const tabBtns = document.querySelectorAll('.tab-btn');
  const panels = {
    train: document.getElementById('panel-train'),
    chef: document.getElementById('panel-chef'),
    maze: document.getElementById('panel-maze'),
    music: document.getElementById('panel-music'),
    bedtime: document.getElementById('panel-bedtime')
  };

  const TAB_ANNOUNCEMENTS = {
    train: '魔法小火車！點閃亮星星格子鋪上鐵軌，再按發動火車出發！',
    chef: '阿奇披薩店！看看客人想吃什麼，點右邊食材放到披薩上吧！',
    maze: '阿奇救援迷宮！先帶阿奇去救小動物，再去終點旗子喔！',
    music: 'Mureka 純音樂盒！預設播放無歌詞純音樂，也可以彈彩虹木琴喔！',
    bedtime: '睡前晚安哄睡屋！幫小動物蓋被子關燈、慢速數綿羊、點亮星空小夜燈～'
  };

  function activateTab(tabKey, speak = true) {
    tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === tabKey));
    Object.entries(panels).forEach(([k, panel]) => {
      if (panel) panel.classList.toggle('active', k === tabKey);
    });

    if (tabKey === 'bedtime' && !isBedtimeMode) {
      setBedtimeMode(true, false);
      return;
    } else if (tabKey !== 'bedtime' && isBedtimeMode && tabKey !== 'music') {
      // Keep daytime games bright unless user stays in music/bedtime
      setBedtimeMode(false, false);
      tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === tabKey));
      Object.entries(panels).forEach(([k, panel]) => {
        if (panel) panel.classList.toggle('active', k === tabKey);
      });
    }

    playTone(587.33, 0.14, 'triangle');
    if (speak && TAB_ANNOUNCEMENTS[tabKey]) {
      speakCoach(TAB_ANNOUNCEMENTS[tabKey]);
    }
  }

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      activateTab(btn.dataset.tab, true);
    });
  });

  // ====================================================================
  // GAME 1: 🚂 魔法火車接軌道 (5x5 Grid, 3 Fun Routes, Clean Animation)
  // ====================================================================
  const trainGrid = document.getElementById('trainGrid');
  const autoTrackBtn = document.getElementById('autoTrackBtn');
  const resetTrainBtn = document.getElementById('resetTrainBtn');
  const runTrainBtn = document.getElementById('runTrainBtn');
  const trainLevelTitle = document.getElementById('trainLevelTitle');
  const trainMissionText = document.getElementById('trainMissionText');

  const TRAIN_ROUTES = [
    {
      name: '第 1 關：閃電彎彎軌道',
      path: [0, 1, 2, 7, 12, 13, 14, 19, 24],
      decor: { 4: '🌲', 5: '🐄', 9: '🌻', 15: '🐑', 20: '🏡', 22: '🌳' }
    },
    {
      name: '第 2 關：陽光海岸軌道',
      path: [0, 5, 10, 11, 12, 17, 22, 23, 24],
      decor: { 2: '⛵', 4: '🌴', 8: '🐬', 14: '🦀', 15: '🌺', 20: '🐢' }
    },
    {
      name: '第 3 關：山谷大迴旋軌道',
      path: [0, 1, 2, 3, 8, 13, 18, 23, 24],
      decor: { 5: '🍄', 6: '🦌', 10: '🌲', 12: '⛺', 16: '🐰', 20: '🌻' }
    }
  ];

  let currentRouteIdx = 0;
  let trackSet = new Set();
  let trainPosIdx = 0;
  let trainRunning = false;
  let trainTimer = null;

  function getGoldenPath() {
    return TRAIN_ROUTES[currentRouteIdx].path;
  }

  function initTrainRoute(routeIdx = 0, announce = false) {
    if (trainTimer) {
      clearInterval(trainTimer);
      trainTimer = null;
    }
    trainRunning = false;
    currentRouteIdx = ((routeIdx % TRAIN_ROUTES.length) + TRAIN_ROUTES.length) % TRAIN_ROUTES.length;
    const route = TRAIN_ROUTES[currentRouteIdx];
    const path = route.path;

    // Pre-fill first 2 intermediate segments so 5yo immediately sees how it works
    trackSet = new Set([path[0], path[1], path[2], path[path.length - 1]]);
    trainPosIdx = 0;

    if (trainLevelTitle) {
      trainLevelTitle.textContent = `🚂 ${route.name}`;
    }
    if (trainMissionText) {
      trainMissionText.textContent = '點一點閃亮的「⭐星星格子」鋪上鐵軌，把小火車連到終點車站 🚉！';
    }
    renderTrainBoard();
    if (announce) {
      speakCoach(`換新路線囉！這是${route.name}，點閃亮星星格子把鐵軌連起來吧！`);
    }
  }

  function isPathComplete() {
    const path = getGoldenPath();
    return path.every(idx => trackSet.has(idx));
  }

  function renderTrainBoard() {
    const route = TRAIN_ROUTES[currentRouteIdx];
    const path = route.path;
    const decor = route.decor;
    trainGrid.innerHTML = '';

    for (let i = 0; i < 25; i++) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'track-cell';
      cell.dataset.idx = i;

      const isStart = i === path[0];
      const isEnd = i === path[path.length - 1];
      const isOnGolden = path.includes(i);
      const hasTrack = trackSet.has(i);

      if (isStart) cell.classList.add('start-cell');
      if (isEnd) cell.classList.add('end-cell');
      if (isOnGolden && !hasTrack) cell.classList.add('path-hint');
      if (hasTrack && !isStart && !isEnd) cell.classList.add('has-track');

      let content = '';
      if (i === path[trainPosIdx]) {
        content = `<span class="train-actor">🚂</span>`;
      } else if (isEnd) {
        content = '🚉';
      } else if (isStart) {
        content = '🛤️';
      } else if (hasTrack) {
        content = '🛤️';
      } else if (isOnGolden) {
        content = '⭐';
      } else if (decor[i]) {
        content = decor[i];
      }

      cell.innerHTML = content;

      cell.addEventListener('click', () => {
        if (trainRunning) return;

        // If user clicks the train or station when path is complete, launch the train!
        if ((isStart || isEnd) && isPathComplete()) {
          launchTrain();
          return;
        }
        if (isStart || isEnd) {
          speakCoach('把中間閃亮的星星格子都點成鐵軌，火車就能開往車站囉！');
          return;
        }

        if (isOnGolden) {
          if (!trackSet.has(i)) {
            trackSet.add(i);
            playTone(523.25 + (i * 14), 0.14, 'triangle');
          } else {
            // Keep track placed and encourage child
            playTone(659.25, 0.12, 'triangle');
          }
          renderTrainBoard();
          if (isPathComplete()) {
            trainMissionText.textContent = '🎉 鐵軌全部連通囉！快按「🚦 發動火車出發！」或點火車出發！';
            speakCoach('太棒了！鐵軌全部連起來了！快按綠色按鈕發動火車出發！');
          }
        } else {
          playTone(392.0, 0.12, 'sine');
          speakCoach('點閃亮亮的黃色星星格子，幫小火車鋪鐵軌喔！');
        }
      });

      trainGrid.appendChild(cell);
    }
  }

  autoTrackBtn.addEventListener('click', () => {
    if (trainRunning) return;
    const path = getGoldenPath();
    const missing = path.find(idx => !trackSet.has(idx));
    if (missing !== undefined) {
      trackSet.add(missing);
      playTone(659.25, 0.18, 'triangle');
      renderTrainBoard();
      if (isPathComplete()) {
        trainMissionText.textContent = '🎉 鐵軌全部連通囉！快按「🚦 發動火車出發！」';
        speakCoach('魔法幫你鋪好最後一格了！現在按發動火車出發吧！');
      } else {
        speakCoach('魔法幫你鋪了一格鐵軌！繼續點星星格子吧！');
      }
    } else {
      speakCoach('鐵軌已經全部鋪好囉！我們直接發動小火車！');
      launchTrain();
    }
  });

  resetTrainBtn.addEventListener('click', () => {
    initTrainRoute(currentRouteIdx + 1, true);
  });

  function launchTrain() {
    if (trainRunning) return;
    const path = getGoldenPath();

    // Auto-complete any remaining gaps so 5yo never gets frustrated
    if (!isPathComplete()) {
      path.forEach(idx => trackSet.add(idx));
      renderTrainBoard();
    }

    trainRunning = true;
    trainPosIdx = 0;
    renderTrainBoard();
    speakCoach('嘟嘟——！慶嗆慶嗆！小火車出發囉！');

    let step = 1;
    trainTimer = setInterval(() => {
      if (step < path.length) {
        trainPosIdx = step;
        playTone(440 + step * 48, 0.14, 'square', 0.12);
        renderTrainBoard();
        step++;
      } else {
        clearInterval(trainTimer);
        trainTimer = null;
        trainRunning = false;
        rewardStars(2, '耶！小火車平安抵達終點車站！獲得兩顆快樂星星！');
        trainMissionText.textContent = '🎉 抵達終點車站！點「🔄 換新路線」或再按一次「🚦 發動火車」再玩一趟！';
      }
    }, 320);
  }

  runTrainBtn.addEventListener('click', launchTrain);

  // ====================================================================
  // GAME 2: 🍕 阿奇披薩大廚 (Centered Toppings + Click to Remove + Guard)
  // ====================================================================
  const INGREDIENTS = [
    { id: 'cheese',  name: '香濃起司', emoji: '🧀', pitch: 523.25 },
    { id: 'tomato',  name: '紅紅番茄', emoji: '🍅', pitch: 587.33 },
    { id: 'shrimp',  name: '鮮甜蝦仁', emoji: '🍤', pitch: 659.25 },
    { id: 'corn',    name: '黃金玉米', emoji: '🌽', pitch: 698.46 },
    { id: 'mush',    name: '可愛蘑菇', emoji: '🍄', pitch: 783.99 },
    { id: 'berry',   name: '甜甜草莓', emoji: '🍓', pitch: 880.00 }
  ];

  const CUSTOMERS = [
    { name: '小熊貝貝', avatar: '🐻' },
    { name: '兔兔朵朵', avatar: '🐰' },
    { name: '小獅子雷恩', avatar: '🦁' },
    { name: '小象波波', avatar: '🐘' },
    { name: '企鵝皮皮', avatar: '🐧' }
  ];

  const customerAvatar = document.getElementById('customerAvatar');
  const customerTitle = document.getElementById('customerTitle');
  const orderRecipeBadges = document.getElementById('orderRecipeBadges');
  const pizzaBase = document.getElementById('pizzaBase');
  const pizzaToppingsLayer = document.getElementById('pizzaToppingsLayer');
  const plateProgressText = document.getElementById('plateProgressText');
  const ingredientsTray = document.getElementById('ingredientsTray');
  const clearPizzaBtn = document.getElementById('clearPizzaBtn');
  const newOrderBtn = document.getElementById('newOrderBtn');
  const serveDishBtn = document.getElementById('serveDishBtn');

  let currentOrder = {};
  let addedCounts = {};
  let currentCustomer = CUSTOMERS[0];
  let isBaking = false;

  function renderIngredientsTray() {
    ingredientsTray.innerHTML = '';
    INGREDIENTS.forEach(ing => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ing-btn';
      btn.innerHTML = `<span class="ing-emoji">${ing.emoji}</span><span>${ing.name}</span>`;
      btn.addEventListener('click', () => addTopping(ing));
      ingredientsTray.appendChild(btn);
    });
  }

  function newChefOrder(speak = true) {
    isBaking = false;
    pizzaBase.classList.remove('baking-glow');
    currentCustomer = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
    customerAvatar.textContent = currentCustomer.avatar;

    const shuffled = [...INGREDIENTS].sort(() => Math.random() - 0.5);
    const pick1 = shuffled[0];
    const pick2 = shuffled[1];
    const c1 = 1 + Math.floor(Math.random() * 2); // 1 or 2
    const c2 = 1 + Math.floor(Math.random() * 2); // 1 or 2

    currentOrder = {
      [pick1.id]: { ...pick1, target: c1 },
      [pick2.id]: { ...pick2, target: c2 }
    };
    addedCounts = {};
    pizzaToppingsLayer.innerHTML = '';

    customerTitle.textContent = `${currentCustomer.name}想吃美味披薩：`;
    updateOrderUI();

    if (speak) {
      speakCoach(`${currentCustomer.name}點餐囉！請放 ${c1} 個${pick1.name}，還有 ${c2} 個${pick2.name}！`);
    }
  }

  function updateOrderUI() {
    orderRecipeBadges.innerHTML = '';
    let allDone = true;

    Object.values(currentOrder).forEach(item => {
      const nowCount = addedCounts[item.id] || 0;
      const done = nowCount >= item.target;
      if (!done) allDone = false;

      const badge = document.createElement('div');
      badge.className = `recipe-pill ${done ? 'done' : ''}`;
      badge.innerHTML = `${item.emoji} ${item.name} <span>${nowCount} / ${item.target}</span> ${done ? '✅' : ''}`;
      orderRecipeBadges.appendChild(badge);
    });

    if (allDone) {
      plateProgressText.textContent = '✨ 食材放齊囉！快按右上角「🔔 叮！送出披薩！」';
    } else {
      plateProgressText.textContent = '👆 點右邊的食材放到披薩上（點披薩上的食材可以拿掉喔）！';
    }
  }

  function addTopping(ing) {
    if (isBaking) return;
    addedCounts[ing.id] = (addedCounts[ing.id] || 0) + 1;
    playTone(ing.pitch, 0.16, 'triangle');

    // Place topping in a well-centered circular distribution using percentage coordinates
    const el = document.createElement('span');
    el.className = 'dropped-topping';
    el.textContent = ing.emoji;
    el.title = `點一下拿掉這個${ing.name}`;

    const totalNow = pizzaToppingsLayer.children.length;
    const angle = (totalNow * 137.5 * Math.PI) / 180; // Golden angle spiral so toppings never overlap!
    const radiusPct = totalNow === 0 ? 0 : Math.min(31, 12 + Math.sqrt(totalNow) * 7.5);
    const xPct = 50 + Math.cos(angle) * radiusPct;
    const yPct = 50 + Math.sin(angle) * radiusPct;

    el.style.left = `${xPct}%`;
    el.style.top = `${yPct}%`;

    // Allow clicking a dropped topping to remove it
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isBaking) return;
      el.remove();
      addedCounts[ing.id] = Math.max(0, (addedCounts[ing.id] || 1) - 1);
      playTone(392.0, 0.12, 'sine');
      updateOrderUI();
    });

    pizzaToppingsLayer.appendChild(el);
    updateOrderUI();

    const targetItem = currentOrder[ing.id];
    if (targetItem) {
      const now = addedCounts[ing.id];
      if (now === targetItem.target) {
        speakCoach(`好棒！${ing.name}放滿 ${now} 個囉！`);
      } else {
        speakCoach(`${ing.name} ${now} 個！`);
      }
    } else {
      speakCoach(`哇！多加了美味的${ing.name}！`);
    }
  }

  clearPizzaBtn.addEventListener('click', () => {
    if (isBaking) return;
    addedCounts = {};
    pizzaToppingsLayer.innerHTML = '';
    playTone(440, 0.15, 'triangle');
    updateOrderUI();
    speakCoach('披薩盤清空囉！我們重新放食材吧！');
  });

  newOrderBtn.addEventListener('click', () => newChefOrder(true));

  serveDishBtn.addEventListener('click', () => {
    if (isBaking) return;
    const totalAdded = Object.values(addedCounts).reduce((a, b) => a + b, 0);
    if (totalAdded === 0) {
      speakCoach('披薩上面還空空的喔！先點右邊的食材放上去吧！');
      return;
    }

    const orderMet = Object.values(currentOrder).every(
      item => (addedCounts[item.id] || 0) >= item.target
    );

    if (orderMet) {
      isBaking = true;
      pizzaBase.classList.add('baking-glow');
      plateProgressText.textContent = `🔥 香噴噴烘烤完成！${currentCustomer.name}超級喜歡！`;
      rewardStars(2, `叮咚！香噴噴的披薩做好囉！${currentCustomer.name}吃得好開心，送你兩顆星星！`);
      setTimeout(() => newChefOrder(false), 1600);
    } else {
      const missing = Object.values(currentOrder).find(
        item => (addedCounts[item.id] || 0) < item.target
      );
      if (missing) {
        const need = missing.target - (addedCounts[missing.id] || 0);
        speakCoach(`還差 ${need} 個${missing.name}喔！再點一點右邊的${missing.name}吧！`);
      }
    }
  });

  // ====================================================================
  // GAME 3: 🐶 阿奇救援迷宮 (BFS Shortest Path Walk + Pet Rescue Check)
  // ====================================================================
  const MAZE_LEVELS = [
    {
      dog: 0,
      pet: 12,
      petEmoji: '🐱',
      petName: '小貓咪',
      flag: 24,
      stars: [2, 18],
      rocks: [6, 8, 16]
    },
    {
      dog: 4,
      pet: 11,
      petEmoji: '🐰',
      petName: '小兔兔',
      flag: 20,
      stars: [1, 13, 22],
      rocks: [3, 7, 17, 19]
    },
    {
      dog: 20,
      pet: 7,
      petEmoji: '🐤',
      petName: '小鴨子',
      flag: 4,
      stars: [10, 14, 2],
      rocks: [6, 11, 13, 17]
    }
  ];

  const mazeGrid = document.getElementById('mazeGrid');
  const mazeTitle = document.getElementById('mazeTitle');
  const mazeSubText = document.getElementById('mazeSubText');
  const newMazeBtn = document.getElementById('newMazeBtn');
  const barkBtn = document.getElementById('barkBtn');

  let mazeLevelIdx = 0;
  let dogPos = 0;
  let petPos = 12;
  let petRescued = false;
  let flagPos = 24;
  let mazeStars = new Set();
  let mazeRocks = new Set();
  let currentPetEmoji = '🐱';
  let currentPetName = '小貓咪';
  let mazeWalking = false;
  let mazeWalkTimer = null;

  function loadMazeLevel(idx, speak = true) {
    if (mazeWalkTimer) {
      clearInterval(mazeWalkTimer);
      mazeWalkTimer = null;
    }
    mazeWalking = false;
    mazeLevelIdx = ((idx % MAZE_LEVELS.length) + MAZE_LEVELS.length) % MAZE_LEVELS.length;
    const lvl = MAZE_LEVELS[mazeLevelIdx];
    dogPos = lvl.dog;
    petPos = lvl.pet;
    petRescued = false;
    flagPos = lvl.flag;
    mazeStars = new Set(lvl.stars);
    mazeRocks = new Set(lvl.rocks);
    currentPetEmoji = lvl.petEmoji;
    currentPetName = lvl.petName;

    mazeTitle.textContent = `阿奇出動：去救${currentPetName} ${currentPetEmoji}！`;
    mazeSubText.textContent = `先點格子帶阿奇 🐶 找到${currentPetName} ${currentPetEmoji}，再去終點旗子 🏁！`;
    renderMaze();

    if (speak) {
      speakCoach(`阿奇救援任務開始！先去救出${currentPetName}，再去終點紅旗子喔！`);
    }
  }

  function renderMaze() {
    mazeGrid.innerHTML = '';
    for (let i = 0; i < 25; i++) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'maze-cell';
      if (mazeRocks.has(i)) cell.classList.add('obstacle');
      if (i === dogPos) cell.classList.add('dog-here');

      let icon = '';
      if (i === dogPos) {
        icon = petRescued ? `🐶${currentPetEmoji}` : '🐶';
      } else if (i === petPos && !petRescued) {
        icon = currentPetEmoji;
      } else if (i === flagPos) {
        icon = '🏁';
      } else if (mazeStars.has(i)) {
        icon = '⭐';
      } else if (mazeRocks.has(i)) {
        icon = '🪨';
      }

      cell.textContent = icon;
      cell.addEventListener('click', () => moveDogTo(i));
      mazeGrid.appendChild(cell);
    }
  }

  // BFS Shortest Path avoiding rocks
  function findShortestPath(startIdx, goalIdx) {
    if (startIdx === goalIdx) return [];
    const queue = [[startIdx]];
    const visited = new Set([startIdx]);

    while (queue.length > 0) {
      const path = queue.shift();
      const curr = path[path.length - 1];
      if (curr === goalIdx) return path.slice(1);

      const r = Math.floor(curr / 5);
      const c = curr % 5;
      const neighbors = [];
      if (r > 0) neighbors.push((r - 1) * 5 + c);
      if (r < 4) neighbors.push((r + 1) * 5 + c);
      if (c > 0) neighbors.push(r * 5 + (c - 1));
      if (c < 4) neighbors.push(r * 5 + (c + 1));

      for (const next of neighbors) {
        if (!visited.has(next) && !mazeRocks.has(next)) {
          visited.add(next);
          queue.push([...path, next]);
        }
      }
    }
    return null;
  }

  function stepDogIntoCell(cellIdx) {
    dogPos = cellIdx;
    playTone(480 + (cellIdx * 10), 0.1, 'triangle', 0.12);

    if (mazeStars.has(dogPos)) {
      mazeStars.delete(dogPos);
      rewardStars(1, '');
    }

    if (dogPos === petPos && !petRescued) {
      petRescued = true;
      playSuccessFanfare();
      mazeSubText.textContent = `🎉 成功救出${currentPetName} ${currentPetEmoji}！現在點終點旗子 🏁 完成任務！`;
      speakCoach(`太棒了！救出${currentPetName}囉！現在帶牠一起去終點紅旗子吧！`);
    }

    renderMaze();

    if (dogPos === flagPos) {
      if (petRescued) {
        if (mazeWalkTimer) {
          clearInterval(mazeWalkTimer);
          mazeWalkTimer = null;
        }
        mazeWalking = true;
        rewardStars(2, `救援任務大成功！阿奇和${currentPetName}安全抵達終點！獲得兩顆星星！`);
        setTimeout(() => loadMazeLevel(mazeLevelIdx + 1, false), 1500);
        return true;
      } else {
        speakCoach(`汪汪！要先去救出受困的${currentPetName} ${currentPetEmoji}，才能過關喔！`);
      }
    }
    return false;
  }

  function moveDogTo(targetIdx) {
    if (mazeWalking) return;
    if (mazeRocks.has(targetIdx)) {
      playTone(220, 0.16, 'sawtooth', 0.1);
      speakCoach('哎呀！那裡有大石頭擋住了，我們換一條路走喔！');
      return;
    }
    if (targetIdx === dogPos) {
      playTone(659.25, 0.12, 'triangle');
      speakCoach('汪汪！點旁邊的格子或遠方的目標，我就會走過去喔！');
      return;
    }

    // If child clicks the flag before rescuing the pet, guide them or walk to the pet first!
    if (targetIdx === flagPos && !petRescued) {
      speakCoach(`汪汪！我們先去救出${currentPetName} ${currentPetEmoji}，再去終點紅旗子喔！`);
      return;
    }

    const path = findShortestPath(dogPos, targetIdx);
    if (!path || path.length === 0) {
      speakCoach('這條路被石頭擋住囉，換個格子試試看！');
      return;
    }

    if (path.length === 1) {
      stepDogIntoCell(path[0]);
      return;
    }

    // Multi-step animated walk along shortest path
    mazeWalking = true;
    let i = 0;
    mazeWalkTimer = setInterval(() => {
      if (i < path.length) {
        const finishedLevel = stepDogIntoCell(path[i]);
        i++;
        if (finishedLevel) return;
      } else {
        clearInterval(mazeWalkTimer);
        mazeWalkTimer = null;
        mazeWalking = false;
      }
    }, 150);
  }

  function moveByDir(dir) {
    if (mazeWalking) return;
    const r = Math.floor(dogPos / 5);
    const c = dogPos % 5;
    let nr = r;
    let nc = c;
    if (dir === 'up') nr = Math.max(0, r - 1);
    if (dir === 'down') nr = Math.min(4, r + 1);
    if (dir === 'left') nc = Math.max(0, c - 1);
    if (dir === 'right') nc = Math.min(4, c + 1);
    const nextIdx = nr * 5 + nc;
    if (nextIdx !== dogPos) moveDogTo(nextIdx);
  }

  document.querySelectorAll('.dpad-btn[data-dir]').forEach(btn => {
    btn.addEventListener('click', () => moveByDir(btn.dataset.dir));
  });

  window.addEventListener('keydown', e => {
    if (!panels.maze.classList.contains('active')) return;
    if (e.key === 'ArrowUp') moveByDir('up');
    if (e.key === 'ArrowDown') moveByDir('down');
    if (e.key === 'ArrowLeft') moveByDir('left');
    if (e.key === 'ArrowRight') moveByDir('right');
  });

  barkBtn.addEventListener('click', () => {
    playTone(587.33, 0.12, 'triangle');
    setTimeout(() => playTone(783.99, 0.16, 'triangle'), 110);
    speakCoach('汪汪！我是勇敢的小狗阿奇！');
  });

  newMazeBtn.addEventListener('click', () => loadMazeLevel(mazeLevelIdx + 1, true));

  // ====================================================================
  // GAME 4: 🎹 Mureka 彩虹音樂盒 & 動物合唱團
  // ====================================================================
  const NOTE_FREQS = {
    C4: 261.63,
    D4: 293.66,
    E4: 329.63,
    F4: 349.23,
    G4: 392.00,
    A4: 440.00,
    B4: 493.88,
    C5: 523.25
  };

  const xyloKeys = document.querySelectorAll('.xylo-key');
  const autoMelodyBtn = document.getElementById('autoMelodyBtn');
  let melodyTimer = null;

  function triggerXyloKey(keyEl) {
    const note = keyEl.dataset.note;
    const freq = NOTE_FREQS[note] || 440;
    playTone(freq, 0.34, 'triangle', 0.22);
    keyEl.classList.add('pop');
    setTimeout(() => keyEl.classList.remove('pop'), 160);
  }

  xyloKeys.forEach(keyEl => {
    keyEl.addEventListener('click', () => triggerXyloKey(keyEl));
  });

  const ANIMAL_SOUNDS = {
    dog:   { text: '汪汪！小狗唱歌汪汪汪！', pitches: [523.25, 659.25] },
    cat:   { text: '喵嗚～小貓咪溫柔喵喵叫！', pitches: [659.25, 783.99] },
    duck:  { text: '呱呱呱！小鴨子游水囉！', pitches: [440, 440, 523.25] },
    frog:  { text: '嘓嘓嘓！小青蛙跳高高！', pitches: [349.23, 493.88] },
    sheep: { text: '咩～～軟綿綿的小綿羊！', pitches: [587.33, 523.25] }
  };

  document.querySelectorAll('.choir-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const info = ANIMAL_SOUNDS[btn.dataset.animal];
      if (!info) return;
      info.pitches.forEach((p, idx) => {
        setTimeout(() => playTone(p, 0.18, 'sine', 0.18), idx * 120);
      });
      speakCoach(info.text);
    });
  });

  // Auto-play Twinkle Twinkle Little Star
  const TWINKLE_NOTES = ['C4','C4','G4','G4','A4','A4','G4','F4','F4','E4','E4','D4','D4','C4'];
  autoMelodyBtn.addEventListener('click', () => {
    if (melodyTimer) {
      clearInterval(melodyTimer);
      melodyTimer = null;
      autoMelodyBtn.textContent = '🎶 自動彈小星星';
      return;
    }
    speakCoach('一起聽彩虹木琴彈小星星亮晶晶！');
    autoMelodyBtn.textContent = '⏹️ 停止自動彈奏';
    let idx = 0;
    melodyTimer = setInterval(() => {
      if (idx >= TWINKLE_NOTES.length) {
        clearInterval(melodyTimer);
        melodyTimer = null;
        autoMelodyBtn.textContent = '🎶 自動彈小星星';
        rewardStars(1, '哇！小星星彈完囉！送你一顆閃亮星星！');
        return;
      }
      const noteName = TWINKLE_NOTES[idx];
      const keyEl = document.querySelector(`.xylo-key[data-note="${noteName}"]`);
      if (keyEl) triggerXyloKey(keyEl);
      idx++;
    }, 360);
  });

  // ====================================================================
  // GAME 5: 🌙 睡前放鬆・晚安哄睡模式 (3 Soothing Bedtime Activities)
  // ====================================================================
  const bedtimeSubtabs = document.querySelectorAll('.bedtime-subtab');
  const bedtimeActs = {
    tuck: document.getElementById('bedtime-act-tuck'),
    sheep: document.getElementById('bedtime-act-sheep'),
    stars: document.getElementById('bedtime-act-stars')
  };

  bedtimeSubtabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const sub = btn.dataset.subtab;
      bedtimeSubtabs.forEach(b => b.classList.toggle('active', b.dataset.subtab === sub));
      Object.entries(bedtimeActs).forEach(([k, el]) => {
        if (el) el.classList.toggle('active', k === sub);
      });
      playTone(523.25, 0.25, 'sine', 0.08);
      if (sub === 'tuck') {
        speakCoach('幫小動物蓋上暖暖的被子、輕輕拍拍背、再關掉小夜燈吧～');
      } else if (sub === 'sheep') {
        speakCoach('輕輕點夜空，我們一起慢速數小綿羊跳過月亮雲朵～');
      } else if (sub === 'stars') {
        speakCoach('點一點夜空中的晚安星星，連成月亮星座，再讓螢火蟲飛進小夜燈吧～');
      }
    });
  });

  // ---- Activity 5A: 🛌 幫小動物蓋被子關燈 ----
  const TUCK_ANIMALS = [
    { id: 'bear',   name: '小熊貝貝', awakeEmoji: '🐻', sleepEmoji: '🐻', lullabyNote: 523.25 },
    { id: 'rabbit', name: '兔兔朵朵', awakeEmoji: '🐰', sleepEmoji: '🐰', lullabyNote: 587.33 },
    { id: 'dog',    name: '小狗阿奇', awakeEmoji: '🐶', sleepEmoji: '🐶', lullabyNote: 659.25 },
    { id: 'cat',    name: '小貓咪咪', awakeEmoji: '🐱', sleepEmoji: '🐱', lullabyNote: 698.46 }
  ];

  const tuckAnimalsGrid = document.getElementById('tuckAnimalsGrid');
  const tuckProgressText = document.getElementById('tuckProgressText');
  const resetTuckBtn = document.getElementById('resetTuckBtn');
  // step 0 = awake, 1 = tucked blanket, 2 = patted, 3 = lamp off & sleeping
  let tuckStates = {};

  function initTuckActivity(announce = false) {
    tuckStates = {};
    TUCK_ANIMALS.forEach(a => { tuckStates[a.id] = 0; });
    renderTuckGrid();
    if (announce) {
      speakCoach('小動物們洗好澡躺在小床上了，幫牠們蓋被子、拍拍背、關小夜燈吧～');
    }
  }

  function renderTuckGrid() {
    if (!tuckAnimalsGrid) return;
    tuckAnimalsGrid.innerHTML = '';
    let asleepCount = 0;

    TUCK_ANIMALS.forEach(animal => {
      const st = tuckStates[animal.id] || 0;
      if (st >= 3) asleepCount++;

      const card = document.createElement('div');
      card.className = 'tuck-card';
      if (st >= 1) card.classList.add('tucked');
      if (st >= 2) card.classList.add('patted');
      if (st >= 3) card.classList.add('lamp-off');

      let lampText = st >= 3 ? '🌙 夜燈已關' : '💡 小夜燈亮著';
      let blanketLabel = st === 0 ? '✨ 小被子' : (st >= 3 ? '🌙 甜甜睡著囉' : '🌟 暖暖星空被');
      let btnLabel = '';
      if (st === 0) btnLabel = `1️⃣ 幫${animal.name}蓋被子`;
      else if (st === 1) btnLabel = `2️⃣ 輕輕拍拍${animal.name}`;
      else if (st === 2) btnLabel = `3️⃣ 幫${animal.name}關小夜燈`;
      else btnLabel = `😴 ${animal.name}睡著囉～晚安`;

      card.innerHTML = `
        <div class="tuck-lamp-badge">${lampText}</div>
        <div class="tuck-zzz">Zzz... 💤</div>
        <div class="tuck-bed-frame">
          <div class="tuck-pillow"></div>
          <div class="tuck-animal-emoji">${st >= 3 ? '😴' : animal.awakeEmoji}</div>
          <div class="tuck-blanket">${blanketLabel}</div>
        </div>
        <button type="button" class="tuck-step-btn">${btnLabel}</button>
      `;

      card.addEventListener('click', () => advanceTuckStep(animal));
      tuckAnimalsGrid.appendChild(card);
    });

    if (tuckProgressText) {
      tuckProgressText.textContent = `🌙 已經哄睡 ${asleepCount} / ${TUCK_ANIMALS.length} 隻小動物`;
    }
  }

  function advanceTuckStep(animal) {
    const st = tuckStates[animal.id] || 0;
    if (st === 0) {
      tuckStates[animal.id] = 1;
      playTone(animal.lullabyNote, 0.35, 'sine', 0.08);
      renderTuckGrid();
      speakCoach(`幫${animal.name}蓋上暖暖的星空被子囉，再點一下輕輕拍拍背～`);
    } else if (st === 1) {
      tuckStates[animal.id] = 2;
      playTone(animal.lullabyNote * 1.25, 0.4, 'sine', 0.08);
      renderTuckGrid();
      speakCoach(`乖乖睡～輕輕拍拍${animal.name}，現在幫牠關掉小夜燈吧～`);
    } else if (st === 2) {
      tuckStates[animal.id] = 3;
      playTone(animal.lullabyNote * 0.75, 0.55, 'sine', 0.07);
      renderTuckGrid();

      const allAsleep = TUCK_ANIMALS.every(a => (tuckStates[a.id] || 0) >= 3);
      if (allAsleep) {
        rewardStars(2, '小動物們全部都蓋好被子、關燈甜甜睡著囉～寶貝也準備閉上眼睛睡覺囉，晚安～');
      } else {
        speakCoach(`啪嗒～小夜燈關好囉，${animal.name}閉上眼睛睡著了，晚安～`);
      }
    } else {
      playTone(523.25, 0.3, 'sine', 0.05);
      speakCoach(`噓～${animal.name}正在做甜甜的夢喔～`);
    }
  }

  if (resetTuckBtn) {
    resetTuckBtn.addEventListener('click', () => initTuckActivity(true));
  }

  // ---- Activity 5B: 🐑 慢速數綿羊跳雲朵 ----
  const sheepSkyStage = document.getElementById('sheepSkyStage');
  const sheepActorLayer = document.getElementById('sheepActorLayer');
  const sheepCountNum = document.getElementById('sheepCountNum');
  const spawnSheepBtn = document.getElementById('spawnSheepBtn');
  const autoSheepBtn = document.getElementById('autoSheepBtn');

  let sheepCount = 0;
  let autoSheepTimer = null;
  const SHEEP_CHIME_NOTES = [523.25, 659.25, 783.99, 659.25, 587.33, 523.25];

  function spawnOneSleepySheep() {
    sheepCount++;
    if (sheepCountNum) sheepCountNum.textContent = sheepCount;

    const note = SHEEP_CHIME_NOTES[(sheepCount - 1) % SHEEP_CHIME_NOTES.length];
    playTone(note, 0.5, 'sine', 0.07);
    setTimeout(() => playTone(note * 1.25, 0.55, 'sine', 0.05), 240);

    if (sheepActorLayer) {
      const sheepEl = document.createElement('div');
      sheepEl.className = 'floating-sheep';
      sheepEl.textContent = '🐑';
      sheepActorLayer.appendChild(sheepEl);
      setTimeout(() => sheepEl.remove(), 3900);
    }

    if (sheepCount <= 10 || sheepCount % 2 === 0) {
      speakCoach(`第 ${sheepCount} 隻小綿羊，慢慢飄過雲朵～好舒服喔～`);
    }
  }

  function stopAutoSheep() {
    if (autoSheepTimer) {
      clearInterval(autoSheepTimer);
      autoSheepTimer = null;
    }
    if (autoSheepBtn) {
      autoSheepBtn.textContent = '✨ 自動慢速飄過：關';
      autoSheepBtn.classList.remove('primary');
    }
  }

  if (sheepSkyStage) {
    sheepSkyStage.addEventListener('click', () => spawnOneSleepySheep());
  }
  if (spawnSheepBtn) {
    spawnSheepBtn.addEventListener('click', () => spawnOneSleepySheep());
  }
  if (autoSheepBtn) {
    autoSheepBtn.addEventListener('click', () => {
      if (autoSheepTimer) {
        stopAutoSheep();
        speakCoach('自動數綿羊暫停囉～');
      } else {
        autoSheepBtn.textContent = '✨ 自動慢速飄過：開';
        autoSheepBtn.classList.add('primary');
        spawnOneSleepySheep();
        autoSheepTimer = setInterval(() => {
          if (!isBedtimeMode) {
            stopAutoSheep();
            return;
          }
          spawnOneSleepySheep();
        }, 4400);
      }
    });
  }

  // ---- Activity 5C: ✨ 點亮星空小夜燈 & 螢火蟲 ----
  const CONSTELLATION_STARS = [
    { x: 16, y: 62, note: 523.25 },
    { x: 28, y: 42, note: 587.33 },
    { x: 42, y: 30, note: 659.25 },
    { x: 56, y: 32, note: 698.46 },
    { x: 70, y: 45, note: 783.99 },
    { x: 82, y: 60, note: 880.00 },
    { x: 50, y: 72, note: 1046.50 }
  ];

  const bedtimeStarsLayer = document.getElementById('bedtimeStarsLayer');
  const bedtimeFirefliesLayer = document.getElementById('bedtimeFirefliesLayer');
  const constellationSvg = document.getElementById('constellationSvg');
  const starLightProgressText = document.getElementById('starLightProgressText');
  const lanternCountText = document.getElementById('lanternCountText');
  const resetStarsBtn = document.getElementById('resetStarsBtn');

  let litStarSet = new Set();
  let firefliesInJar = 0;

  function initBedtimeStars(announce = false) {
    litStarSet = new Set();
    firefliesInJar = 0;
    renderBedtimeStars();
    spawnBedtimeFireflies();
    if (announce) {
      speakCoach('夜空暗暗的，輕輕點每一顆晚安星星，把溫暖的星座小夜燈點亮吧～');
    }
  }

  function renderBedtimeStars() {
    if (!bedtimeStarsLayer || !constellationSvg) return;
    bedtimeStarsLayer.innerHTML = '';
    constellationSvg.innerHTML = '';

    // Draw constellation lines between consecutive lit stars
    const litIndices = [...litStarSet].sort((a, b) => a - b);
    for (let i = 0; i < litIndices.length - 1; i++) {
      const s1 = CONSTELLATION_STARS[litIndices[i]];
      const s2 = CONSTELLATION_STARS[litIndices[i + 1]];
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', String(s1.x));
      line.setAttribute('y1', String(s1.y));
      line.setAttribute('x2', String(s2.x));
      line.setAttribute('y2', String(s2.y));
      line.setAttribute('stroke', 'rgba(253, 224, 71, 0.65)');
      line.setAttribute('stroke-width', '0.9');
      line.setAttribute('stroke-dasharray', '2,1.5');
      constellationSvg.appendChild(line);
    }

    CONSTELLATION_STARS.forEach((star, idx) => {
      const isLit = litStarSet.has(idx);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `bedtime-star-btn ${isLit ? 'lit' : ''}`;
      btn.style.left = `${star.x}%`;
      btn.style.top = `${star.y}%`;
      btn.textContent = isLit ? '🌟' : '⭐';
      btn.title = `第 ${idx + 1} 顆晚安星`;

      btn.addEventListener('click', () => {
        if (!litStarSet.has(idx)) {
          litStarSet.add(idx);
          playTone(star.note, 0.45, 'sine', 0.08);
          renderBedtimeStars();
          if (litStarSet.size === CONSTELLATION_STARS.length) {
            rewardStars(2, '哇～七顆晚安星星全部點亮，連成溫暖的月亮小船星座囉！祝寶貝有個甜甜的好夢～');
          } else {
            speakCoach(`點亮第 ${litStarSet.size} 顆晚安星星，好溫暖喔～`);
          }
        } else {
          playTone(star.note, 0.35, 'sine', 0.06);
        }
      });

      bedtimeStarsLayer.appendChild(btn);
    });

    if (starLightProgressText) {
      starLightProgressText.textContent = `🌟 已點亮 ${litStarSet.size} / ${CONSTELLATION_STARS.length} 顆晚安星星`;
    }
    if (lanternCountText) {
      lanternCountText.textContent = `小夜燈 ${firefliesInJar} 隻螢火蟲`;
    }
  }

  function spawnBedtimeFireflies() {
    if (!bedtimeFirefliesLayer) return;
    bedtimeFirefliesLayer.innerHTML = '';
    const positions = [
      { left: 22, top: 22 },
      { left: 66, top: 20 },
      { left: 34, top: 74 },
      { left: 76, top: 32 },
      { left: 18, top: 80 }
    ];
    positions.forEach((pos, idx) => {
      const ff = document.createElement('div');
      ff.className = 'firefly-dot';
      ff.style.left = `${pos.left}%`;
      ff.style.top = `${pos.top}%`;
      ff.textContent = '✨';
      ff.title = '點一下讓螢火蟲飛進小夜燈';

      ff.addEventListener('click', () => {
        firefliesInJar++;
        playTone(659.25 + idx * 60, 0.35, 'sine', 0.07);
        ff.style.left = '88%';
        ff.style.top = '82%';
        ff.style.opacity = '0';
        setTimeout(() => ff.remove(), 800);
        if (lanternCountText) {
          lanternCountText.textContent = `小夜燈 ${firefliesInJar} 隻螢火蟲`;
        }
        speakCoach(`第 ${firefliesInJar} 隻小螢火蟲飛進溫暖的小夜燈裡睡覺囉～`);
      });

      bedtimeFirefliesLayer.appendChild(ff);
    });
  }

  if (resetStarsBtn) {
    resetStarsBtn.addEventListener('click', () => initBedtimeStars(true));
  }

  // -------------------- Initialize Everything --------------------
  loadTrack(0, false); // Default to Pure Instrumental Track 0 (bgm_inst_day.mp3)
  initTrainRoute(0, false);
  renderIngredientsTray();
  newChefOrder(false);
  loadMazeLevel(0, false);
  initTuckActivity(false);
  initBedtimeStars(false);
})();
