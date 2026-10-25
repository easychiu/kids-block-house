// 阿奇小隊歡樂遊樂園 - 5歲小朋友單指互動遊戲 + Mureka 兒歌音樂盒
(() => {
  const SONGS = [
    {
      title: "陽光小火車與披薩派對",
      src: "audio/bgm1.mp3",
      cover: "audio/cover1.jpg",
      lyrics: [
        "🚂 嘟嘟～陽光小火車出發囉！",
        "🐼 載著熊貓跟小狗狗去野餐～",
        "🍕 揉揉麵團撒上起司跟番茄！",
        "🎉 阿奇小隊陪你一起笑哈哈！"
      ]
    },
    {
      title: "阿奇小隊歡樂號",
      src: "audio/bgm2.mp3",
      cover: "audio/cover2.jpg",
      lyrics: [
        "🎺 阿奇小隊歡樂號～準備出發！",
        "🧩 森林迷宮救出可愛小動物！",
        "🎵 敲敲彩虹木琴叮叮噹噹～",
        "🏆 收集四個徽章你最棒！"
      ]
    }
  ];

  let currentSongIdx = 0;
  let lyricIdx = 0;
  let isPlaying = false;
  const bgmAudio = document.getElementById("bgmAudio");
  const murekaCover = document.getElementById("murekaCover");
  const songTitleEl = document.getElementById("songTitle");
  const songLyricEl = document.getElementById("songLyric");
  const playPauseBtn = document.getElementById("playPauseBtn");
  const nextSongBtn = document.getElementById("nextSongBtn");

  // Web Audio Synth for cute SFX, Train Whistle & Xylophone
  let audioCtx = null;
  function getAudioCtx() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playTone(freq = 523.25, duration = 0.22, type = "sine", vol = 0.25) {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  // Warm two-blast wooden toy train whistle ("Choo-Choo! 嘟—嘟—！")
  function playTrainWhistle() {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const blasts = [
      { start: 0, dur: 0.24, f1: 587.33, f2: 739.99, bend: 1.03 },
      { start: 0.29, dur: 0.36, f1: 587.33, f2: 739.99, bend: 1.06 }
    ];
    blasts.forEach(b => {
      [b.f1, b.f2, b.f1 * 0.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t0 = ctx.currentTime + b.start;
        osc.type = idx === 2 ? "sine" : "triangle";
        osc.frequency.setValueAtTime(freq, t0);
        osc.frequency.linearRampToValueAtTime(freq * b.bend, t0 + b.dur * 0.65);
        const peak = idx === 2 ? 0.1 : 0.18;
        gain.gain.setValueAtTime(0.001, t0);
        gain.gain.linearRampToValueAtTime(peak, t0 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + b.dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + b.dur);
      });
    });
  }

  function playCheerSfx() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      setTimeout(() => playTone(f, 0.24, "triangle", 0.3), i * 95);
    });
  }

  function playGrandFanfare() {
    const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
    const delays = [0, 110, 220, 340, 500, 640];
    notes.forEach((f, i) => {
      setTimeout(() => playTone(f, i === 5 ? 0.5 : 0.24, "triangle", 0.34), delays[i]);
    });
  }

  // BGM Audio Ducking for clear Mandarin Voice & Xylophone Auto-Melody
  const BASE_BGM_VOL = 0.55;
  let isSpeaking = false;
  let autoMelodyPlaying = false;
  let speechResetTimer = null;

  function syncBgmVolume() {
    bgmAudio.volume = (isSpeaking || autoMelodyPlaying) ? 0.15 : BASE_BGM_VOL;
  }

  function clearVoiceHighlight() {
    isSpeaking = false;
    syncBgmVolume();
    document.querySelectorAll(".voice-guide-btn.speaking").forEach(b => b.classList.remove("speaking"));
  }

  function cleanTextForSpeech(text) {
    return text
      .replace(/[^\u4e00-\u9fff\u3000-\u303f\uff00-\uffefa-zA-Z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function speakTW(text, activeBtn = null) {
    if (!("speechSynthesis" in window)) return;
    const spoken = cleanTextForSpeech(text);
    if (!spoken) return;
    try {
      window.speechSynthesis.cancel();
      clearTimeout(speechResetTimer);
      clearVoiceHighlight();
      isSpeaking = true;
      syncBgmVolume();
      if (activeBtn) activeBtn.classList.add("speaking");

      const u = new SpeechSynthesisUtterance(spoken);
      u.lang = "zh-TW";
      u.rate = 0.98;
      u.pitch = 1.18;
      u.onend = clearVoiceHighlight;
      u.onerror = clearVoiceHighlight;
      speechResetTimer = setTimeout(clearVoiceHighlight, 6500);
      window.speechSynthesis.speak(u);
    } catch (e) {
      clearVoiceHighlight();
    }
  }

  function spawnParticles(emojis = ["⭐", "🎉", "💖", "✨"], count = 10) {
    for (let i = 0; i < count; i++) {
      const el = document.createElement("div");
      el.className = "floating-fx";
      el.textContent = emojis[i % emojis.length];
      el.style.left = `${12 + Math.random() * 76}vw`;
      el.style.top = `${30 + Math.random() * 48}vh`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1250);
    }
  }

  function spawnAtElement(targetEl, emojis = ["✨", "🎵"], count = 3, cls = "steam-puff") {
    if (!targetEl) return;
    const rect = targetEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    for (let i = 0; i < count; i++) {
      const el = document.createElement("div");
      el.className = cls;
      el.textContent = emojis[i % emojis.length];
      el.style.left = `${cx + (Math.random() - 0.5) * 20}px`;
      el.style.top = `${cy - 6}px`;
      el.style.setProperty("--sx", `${(Math.random() - 0.5) * 38}px`);
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 980);
    }
  }

  // 1-Finger Tap Sparkle Feedback anywhere in the park
  document.addEventListener("pointerdown", e => {
    const sparks = ["✨", "⭐", "💛"];
    for (let i = 0; i < 3; i++) {
      const s = document.createElement("div");
      s.className = "tap-sparkle";
      s.textContent = sparks[i];
      s.style.left = `${e.clientX}px`;
      s.style.top = `${e.clientY}px`;
      const angle = (Math.PI * 2 * i) / 3 + Math.random() * 0.5;
      const dist = 22 + Math.random() * 16;
      s.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
      s.style.setProperty("--dy", `${Math.sin(angle) * dist - 12}px`);
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 560);
    }
  }, { passive: true });

  // Mureka Music Player Logic
  function loadSong(idx, autoPlay = false) {
    currentSongIdx = idx % SONGS.length;
    const s = SONGS[currentSongIdx];
    bgmAudio.src = s.src;
    syncBgmVolume();
    murekaCover.src = s.cover;
    songTitleEl.textContent = s.title;
    lyricIdx = 0;
    songLyricEl.textContent = s.lyrics[0];
    if (autoPlay) {
      bgmAudio.play().then(() => {
        isPlaying = true;
        updateMusicUI();
      }).catch(() => {});
    }
  }

  function updateMusicUI() {
    if (isPlaying) {
      playPauseBtn.textContent = "⏸️ 暫停";
      murekaCover.classList.add("playing");
    } else {
      playPauseBtn.textContent = "▶️ 音樂";
      murekaCover.classList.remove("playing");
    }
  }

  playPauseBtn.addEventListener("click", () => {
    if (bgmAudio.paused) {
      bgmAudio.play().then(() => {
        isPlaying = true;
        updateMusicUI();
      }).catch(() => {});
    } else {
      bgmAudio.pause();
      isPlaying = false;
      updateMusicUI();
    }
  });

  nextSongBtn.addEventListener("click", () => {
    loadSong(currentSongIdx + 1, true);
    spawnParticles(["🎵", "🎶", "🌟"], 6);
  });

  setInterval(() => {
    if (!isPlaying) return;
    const s = SONGS[currentSongIdx];
    lyricIdx = (lyricIdx + 1) % s.lyrics.length;
    songLyricEl.textContent = s.lyrics[lyricIdx];
  }, 4200);

  loadSong(0, false);

  // Welcome Modal
  const welcomeModal = document.getElementById("welcomeModal");
  document.getElementById("startPlayBtn").addEventListener("click", () => {
    welcomeModal.style.display = "none";
    getAudioCtx();
    loadSong(0, true);
    playCheerSfx();
    speakTW("歡迎來到阿奇小隊歡樂遊樂園！點右上角的語音導覽，隨時聽玩法喔！");
    spawnParticles(["🎈", "🐶", "🚂", "🌟"], 12);
  });

  // Super Duggee Grand Trophy Banner & Celebration Modal
  const grandTrophyBanner = document.getElementById("grandTrophyBanner");
  const trophyModal = document.getElementById("trophyModal");
  const trophyFireworkBtn = document.getElementById("trophyFireworkBtn");
  const closeTrophyBtn = document.getElementById("closeTrophyBtn");

  function openTrophyModal() {
    trophyModal.hidden = false;
    playGrandFanfare();
    spawnParticles(["🏆", "👑", "🎆", "🌟", "🎉", "🐶"], 20);
    speakTW("太神啦！四個閃亮徽章全部收集完成！恭喜你獲得超級阿奇總隊長大獎盃！");
  }

  grandTrophyBanner.addEventListener("click", openTrophyModal);

  trophyFireworkBtn.addEventListener("click", () => {
    playGrandFanfare();
    spawnParticles(["🎆", "🎇", "🌈", "⭐", "🎉", "💖", "🏆"], 24);
    speakTW("哇！好漂亮的彩虹煙火！超級小隊長最棒了！");
  });

  closeTrophyBtn.addEventListener("click", () => {
    trophyModal.hidden = true;
    playTone(659.25, 0.14, "triangle", 0.25);
  });

  trophyModal.addEventListener("click", e => {
    if (e.target === trophyModal) trophyModal.hidden = true;
  });

  // Badges System
  const badges = { train: false, chef: false, maze: false, music: false };
  function awardBadge(key, label) {
    const slot = document.getElementById(`badge-${key}`);
    if (slot) slot.classList.add("earned");
    playCheerSfx();
    spawnParticles(["🏆", "🌟", "🎉", "💖", "✨"], 14);
    if (!badges[key]) {
      badges[key] = true;
      const allDone = Object.values(badges).every(Boolean);
      if (allDone) {
        grandTrophyBanner.hidden = false;
        setTimeout(openTrophyModal, 650);
      } else {
        speakTW(`好棒喔！恭喜你獲得${label}！`);
      }
    } else {
      speakTW("耶！再一次成功！你真的超厲害！");
    }
  }

  // Stop helper forward-declared for tab switching
  let stopAutoMelody = () => {};

  // Tab Switching
  const tabBtns = document.querySelectorAll(".tab-btn");
  const panels = {
    train: document.getElementById("panel-train"),
    chef: document.getElementById("panel-chef"),
    maze: document.getElementById("panel-maze"),
    music: document.getElementById("panel-music")
  };

  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const t = btn.dataset.tab;
      if (t !== "music") stopAutoMelody(false);
      tabBtns.forEach(b => b.classList.toggle("active", b === btn));
      Object.keys(panels).forEach(k => panels[k].classList.toggle("active", k === t));
      playTone(659.25, 0.12, "sine", 0.2);
    });
  });

  // ==========================================
  // GAME 1: 🚂 嘟嘟小火車 (Train Track Builder)
  // ==========================================
  const trainGridEl = document.getElementById("trainGrid");
  const trainCoach = document.getElementById("trainCoach");
  const runTrainBtn = document.getElementById("runTrainBtn");
  const whistleToast = document.getElementById("whistleToast");
  const GOLDEN_PATH = [0, 1, 2, 7, 12, 13, 14, 19, 24];
  const GOLDEN_SET = new Set(GOLDEN_PATH);
  const TRAIN_SPECIALS = {
    0: { emoji: "🏠", type: "station" },
    2: { emoji: "🐼", type: "animal", name: "熊貓" },
    12: { emoji: "🐶", type: "animal", name: "阿奇小狗" },
    14: { emoji: "🦒", type: "animal", name: "長頸鹿" },
    24: { emoji: "🎪", type: "station" }
  };
  let trackSet = new Set([0, 1, 2, 12, 14, 24]);
  let trainRunning = false;
  let whistleTimer = null;

  function isTrackReady() {
    return GOLDEN_PATH.every(idx => trackSet.has(idx));
  }

  function triggerWhistleFx(anchorEl, msg = "🚂💨 嘟—嘟～！火車鳴笛囉！") {
    playTrainWhistle();
    whistleToast.textContent = msg;
    whistleToast.hidden = false;
    clearTimeout(whistleTimer);
    whistleTimer = setTimeout(() => {
      whistleToast.hidden = true;
    }, 1800);
    if (anchorEl) spawnAtElement(anchorEl, ["💨", "☁️", "🎶"], 3, "steam-puff");
  }

  function renderTrainGrid(activeCell = -1) {
    trainGridEl.innerHTML = "";
    const ready = isTrackReady();
    runTrainBtn.classList.toggle("pulse-cta", ready && !trainRunning);

    for (let i = 0; i < 25; i++) {
      const cell = document.createElement("div");
      const spec = TRAIN_SPECIALS[i];
      const hasTrack = trackSet.has(i);
      const isGuideGap = !hasTrack && GOLDEN_SET.has(i);
      cell.className =
        "grid-cell" +
        (hasTrack ? " track" : "") +
        (isGuideGap ? " guide-gap" : "") +
        (spec?.type === "station" ? " station" : "");
      if (i === activeCell) cell.classList.add("active-train");

      const span = document.createElement("span");
      span.className = "cell-emoji";
      if (i === activeCell) {
        span.textContent = "🚂";
      } else if (spec) {
        span.textContent = spec.emoji;
      } else if (!hasTrack && (i === 5 || i === 9 || i === 20 || i === 22)) {
        span.textContent = "🌲";
      }
      cell.appendChild(span);

      cell.addEventListener("click", () => {
        if (trainRunning) {
          if (i === activeCell) triggerWhistleFx(cell, "🚂💨 嘟嘟～！小火車向你揮揮手！");
          return;
        }
        if (spec?.type === "station") {
          triggerWhistleFx(cell, "🚂💨 嘟—嘟～！車站準備發車囉！");
          return;
        }
        const wasReady = isTrackReady();
        if (trackSet.has(i) && !spec) {
          trackSet.delete(i);
          playTone(392, 0.12, "triangle", 0.2);
        } else {
          trackSet.add(i);
          playTone(587.33, 0.15, "triangle", 0.25);
        }
        renderTrainGrid();
        if (!wasReady && isTrackReady()) {
          playCheerSfx();
          trainCoach.textContent = "✨ 哇！你自己接通鐵軌了！快按「🚂 嘟嘟發車！」";
          speakTW("哇！你自己接通鐵軌了！快按嘟嘟發車！");
        }
      });
      trainGridEl.appendChild(cell);
    }
  }

  document.getElementById("autoTrackBtn").addEventListener("click", () => {
    if (trainRunning) return;
    GOLDEN_PATH.forEach(idx => trackSet.add(idx));
    renderTrainGrid();
    playCheerSfx();
    trainCoach.textContent = "✨ 鐵軌接好囉！快按綠色「🚂 嘟嘟發車！」按鈕！";
    speakTW("鐵軌鋪好囉！快按綠色的嘟嘟發車！");
  });

  runTrainBtn.addEventListener("click", () => {
    if (trainRunning) return;
    GOLDEN_PATH.forEach(idx => trackSet.add(idx));
    trainRunning = true;
    trainCoach.textContent = "🚂 嘟嘟～小火車鳴笛開動囉！正在接小動物上車！";
    renderTrainGrid(GOLDEN_PATH[0]);
    triggerWhistleFx(trainGridEl.children[GOLDEN_PATH[0]], "🚂💨 嘟—嘟～！陽光小火車出發！");

    let step = 0;
    const timer = setInterval(() => {
      const pos = GOLDEN_PATH[step];
      renderTrainGrid(pos);
      const activeEl = trainGridEl.children[pos];
      playTone(440 + step * 45, 0.16, "triangle", 0.2);
      spawnAtElement(activeEl, ["💨", "✨"], 2, "steam-puff");

      if (TRAIN_SPECIALS[pos]?.type === "animal") {
        spawnParticles([TRAIN_SPECIALS[pos].emoji, "💨", "⭐"], 5);
      }
      step++;
      if (step >= GOLDEN_PATH.length) {
        clearInterval(timer);
        trainRunning = false;
        triggerWhistleFx(trainGridEl.children[24], "🎪💨 嘟—嘟～！平安抵達遊樂園！");
        trainCoach.textContent = "🎉 小火車順利載到所有動物抵達遊樂園！";
        renderTrainGrid(24);
        awardBadge("train", "火車長徽章");
      }
    }, 340);
  });

  renderTrainGrid();

  // ==========================================
  // GAME 2: 🍕 開心披薩與冰淇淋店 (Chef)
  // ==========================================
  const TOPPINGS = [
    { id: "cheese", emoji: "🧀", name: "起司" },
    { id: "tomato", emoji: "🍅", name: "番茄" },
    { id: "mush", emoji: "🍄", name: "蘑菇" },
    { id: "berry", emoji: "🍓", name: "草莓" },
    { id: "choco", emoji: "🍫", name: "巧克力" },
    { id: "rainbow", emoji: "🌈", name: "彩虹糖" }
  ];
  const CUSTOMERS = [
    { face: "🦁", name: "小獅子" },
    { face: "🐰", name: "小兔兔" },
    { face: "🐻", name: "小熊熊" },
    { face: "🐼", name: "小熊貓" }
  ];
  let isIceCream = false;
  let currentCustomer = CUSTOMERS[0];
  let currentOrder = [];
  let addedToppings = [];
  let orderReadyChimed = false;

  const pizzaBase = document.getElementById("pizzaBase");
  const toppingGrid = document.getElementById("toppingGrid");
  const orderTargets = document.getElementById("orderTargets");
  const customerFace = document.getElementById("customerFace");
  const chefAvatar = document.getElementById("chefAvatar");
  const orderTitle = document.getElementById("orderTitle");
  const chefCoach = document.getElementById("chefCoach");
  const switchDishBtn = document.getElementById("switchDishBtn");
  const serveDishBtn = document.getElementById("serveDishBtn");

  function newChefOrder() {
    addedToppings = [];
    orderReadyChimed = false;
    pizzaBase.innerHTML = "";
    pizzaBase.classList.toggle("icecream-mode", isIceCream);
    serveDishBtn.classList.remove("pulse-cta");
    currentCustomer = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
    customerFace.textContent = currentCustomer.face;
    chefAvatar.textContent = currentCustomer.face;
    orderTitle.textContent = isIceCream
      ? `${currentCustomer.name}想吃：聖代冰淇淋`
      : `${currentCustomer.name}想吃：陽光披薩`;
    switchDishBtn.textContent = isIceCream ? "🍕 換做大披薩" : "🍨 換做冰淇淋";
    serveDishBtn.textContent = isIceCream ? "🍨 做好端上桌！" : "🔥 烤好端上桌！";
    chefCoach.textContent = `${currentCustomer.name}肚子餓了！點下面的配料放到盤子裡吧！`;

    const pool = [...TOPPINGS].sort(() => Math.random() - 0.5);
    currentOrder = pool.slice(0, 3);
    renderOrderPills();
  }

  function renderOrderPills() {
    orderTargets.innerHTML = "";
    currentOrder.forEach(item => {
      const done = addedToppings.includes(item.id);
      const pill = document.createElement("div");
      pill.className = "target-pill" + (done ? " done" : "");
      pill.textContent = `${item.emoji}${done ? "✅" : ""}`;
      orderTargets.appendChild(pill);
    });
    const allMatched = currentOrder.length > 0 && currentOrder.every(item => addedToppings.includes(item.id));
    serveDishBtn.classList.toggle("pulse-cta", allMatched);
    if (allMatched && !orderReadyChimed) {
      orderReadyChimed = true;
      playCheerSfx();
      chefCoach.textContent = "✨ 配料都放齊囉！快按粉紅色按鈕端給客人吧！";
    }
  }

  TOPPINGS.forEach(t => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "topping-btn";
    btn.innerHTML = `<span class="t-emo">${t.emoji}</span><span>${t.name}</span>`;
    btn.addEventListener("click", () => {
      addedToppings.push(t.id);
      if (pizzaBase.children.length >= 18) {
        pizzaBase.firstElementChild.remove();
      }
      const drop = document.createElement("span");
      drop.className = "dropped-topping";
      drop.textContent = t.emoji;
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 52;
      drop.style.left = `${74 + Math.cos(angle) * radius}px`;
      drop.style.top = `${74 + Math.sin(angle) * radius}px`;
      pizzaBase.appendChild(drop);
      playTone(523.25 + (addedToppings.length % 8) * 40, 0.15, "sine", 0.25);
      renderOrderPills();
    });
    toppingGrid.appendChild(btn);
  });

  switchDishBtn.addEventListener("click", () => {
    isIceCream = !isIceCream;
    newChefOrder();
    playTone(659.25, 0.16, "triangle", 0.25);
  });

  serveDishBtn.addEventListener("click", () => {
    if (addedToppings.length === 0) {
      chefCoach.textContent = "先點上面的配料放到盤子裡，再端給客人喔！";
      speakTW("先點配料放到盤子裡，再端給客人喔！");
      return;
    }
    chefCoach.textContent = "😋 哇！香噴噴的料理上桌囉！客人超級開心！";
    awardBadge("chef", "小廚師徽章");
    setTimeout(newChefOrder, 1400);
  });

  newChefOrder();

  // ==========================================
  // GAME 3: 🧩 森林救援小迷宮 (Rescue Maze)
  // ==========================================
  const mazeGridEl = document.getElementById("mazeGrid");
  const mazeCoach = document.getElementById("mazeCoach");
  const MAZE_PETS = [
    { emoji: "🐱", name: "小貓咪" },
    { emoji: "🐰", name: "小兔兔" },
    { emoji: "🐨", name: "無尾熊" },
    { emoji: "🦊", name: "小狐狸" }
  ];
  let dogPos = 0;
  let petPos = 12;
  let flagPos = 24;
  let petRescued = false;
  let rocks = new Set();
  let currentPet = MAZE_PETS[0];

  function initMaze() {
    dogPos = 0;
    petRescued = false;
    currentPet = MAZE_PETS[Math.floor(Math.random() * MAZE_PETS.length)];
    const mids = [6, 7, 8, 11, 12, 13, 16, 17, 18];
    petPos = mids[Math.floor(Math.random() * mids.length)];
    flagPos = 24;
    rocks = new Set();
    [3, 5, 9, 15, 19, 21].forEach(r => {
      if (r !== petPos && Math.random() > 0.35) rocks.add(r);
    });
    mazeCoach.textContent = `點發光格子或方向鍵，幫阿奇救出 ${currentPet.emoji} 再走到 🚩 紅旗！`;
    renderMaze();
  }

  function renderMaze() {
    mazeGridEl.innerHTML = "";
    const goalIdx = petRescued ? flagPos : petPos;
    for (let i = 0; i < 25; i++) {
      const cell = document.createElement("div");
      cell.className = "grid-cell";
      if (i === dogPos) cell.classList.add("active-train");
      else if (i === goalIdx) cell.classList.add("objective-glow");

      const span = document.createElement("span");
      span.className = "cell-emoji";
      if (i === dogPos) {
        span.textContent = petRescued ? `🐶${currentPet.emoji}` : "🐶";
      } else if (i === petPos && !petRescued) {
        span.textContent = currentPet.emoji;
      } else if (i === flagPos) {
        span.textContent = "🚩";
      } else if (rocks.has(i)) {
        span.textContent = "🪨";
      }
      cell.appendChild(span);

      cell.addEventListener("click", () => {
        if (rocks.has(i)) {
          rocks.delete(i);
          playTone(320, 0.15, "sawtooth", 0.25);
          spawnParticles(["💥", "✨"], 4);
          renderMaze();
          return;
        }
        moveDogTo(i);
      });
      mazeGridEl.appendChild(cell);
    }
  }

  function moveDogTo(targetIdx) {
    if (rocks.has(targetIdx)) {
      rocks.delete(targetIdx);
      playTone(320, 0.15, "sawtooth", 0.25);
      spawnParticles(["💥", "✨"], 4);
    }
    dogPos = targetIdx;
    playTone(523.25, 0.1, "sine", 0.2);

    if (dogPos === petPos && !petRescued) {
      petRescued = true;
      playCheerSfx();
      mazeCoach.textContent = `💖 成功救出 ${currentPet.emoji}！現在點發光 🚩 終點紅旗吧！`;
      speakTW(`救到${currentPet.name}囉！現在一起去終點紅旗吧！`);
      spawnParticles([currentPet.emoji, "💖", "🌟"], 8);
    }

    if (dogPos === flagPos) {
      if (!petRescued) {
        petRescued = true;
      }
      mazeCoach.textContent = "🎉 耶！阿奇成功帶著好朋友抵達終點！";
      awardBadge("maze", "救援王徽章");
      setTimeout(initMaze, 1500);
    }
    renderMaze();
  }

  document.querySelectorAll(".dpad-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const dir = btn.dataset.dir;
      let r = Math.floor(dogPos / 5);
      let c = dogPos % 5;
      if (dir === "up" && r > 0) r--;
      if (dir === "down" && r < 4) r++;
      if (dir === "left" && c > 0) c--;
      if (dir === "right" && c < 4) c++;
      moveDogTo(r * 5 + c);
    });
  });

  document.getElementById("newMazeBtn").addEventListener("click", () => {
    initMaze();
    playTone(587.33, 0.14, "triangle", 0.2);
  });

  initMaze();

  // ==========================================
  // GAME 4: 🎵 音樂玩具箱 (Mureka Music Party)
  // ==========================================
  const NOTES = [
    { label: "Do", freq: 523.25, color: "#ff595e", h: "100%" },
    { label: "Re", freq: 587.33, color: "#ff924c", h: "94%" },
    { label: "Mi", freq: 659.25, color: "#ffca3a", h: "88%" },
    { label: "Fa", freq: 698.46, color: "#8ac926", h: "82%" },
    { label: "Sol", freq: 783.99, color: "#52b788", h: "76%" },
    { label: "La", freq: 880.0, color: "#1982c4", h: "70%" },
    { label: "Si", freq: 987.77, color: "#6a4c93", h: "64%" },
    { label: "Do+", freq: 1046.5, color: "#ff70a6", h: "58%" }
  ];
  const CHOIR = [
    { emoji: "🐸", name: "青蛙呱呱", freqs: [392, 523.25] },
    { emoji: "🐤", name: "小雞啾啾", freqs: [783.99, 987.77] },
    { emoji: "🐷", name: "小豬哼哼", freqs: [329.63, 440] },
    { emoji: "🐶", name: "阿奇汪汪", freqs: [523.25, 659.25] }
  ];
  const DRUMS = [
    { emoji: "🥁", name: "大鼓咚咚", freq: 150, type: "triangle" },
    { emoji: "🔔", name: "金鈴噹噹", freq: 1200, type: "sine" },
    { emoji: "👏", name: "拍拍手", freq: 420, type: "square" },
    { emoji: "🎺", name: "小喇叭", freq: 659.25, type: "sawtooth" }
  ];
  // Classic nursery rhymes mapped to NOTES indices (-1 = musical rest)
  const MELODIES = [
    {
      title: "一閃一閃亮晶晶",
      seq: [0, 0, 4, 4, 5, 5, 4, -1, 3, 3, 2, 2, 1, 1, 0]
    },
    {
      title: "嗡嗡小蜜蜂",
      seq: [4, 2, 2, -1, 3, 1, 1, -1, 0, 1, 2, 3, 4, 4, 4]
    },
    {
      title: "兩隻老虎",
      seq: [0, 1, 2, 0, 0, 1, 2, 0, 2, 3, 4, -1, 2, 3, 4]
    }
  ];

  let musicTapCount = 0;
  let melodyIdx = 0;
  let melodyTimer = null;
  const xyloRow = document.getElementById("xyloRow");
  const animalChoir = document.getElementById("animalChoir");
  const drumRow = document.getElementById("drumRow");
  const musicCoach = document.getElementById("musicCoach");
  const autoMelodyBtn = document.getElementById("autoMelodyBtn");
  const xyloKeyEls = [];
  const choirBtnEls = [];

  function registerMusicTap(emoji = "🎵") {
    musicTapCount++;
    spawnParticles([emoji, "🎶", "⭐"], 3);
    if (musicTapCount === 8) {
      musicCoach.textContent = "🎉 太好聽了！你是小小 Mureka 音樂家！";
      awardBadge("music", "音樂家徽章");
    } else if (musicTapCount < 8) {
      musicCoach.textContent = `🎵 再彈 ${8 - musicTapCount} 下就能拿到「音樂家徽章」喔！`;
    }
  }

  NOTES.forEach(n => {
    const key = document.createElement("button");
    key.type = "button";
    key.className = "xylo-key";
    key.style.background = n.color;
    key.style.height = n.h;
    key.innerHTML = `<span>✨</span><span>${n.label}</span>`;
    key.addEventListener("click", () => {
      key.classList.add("auto-glow");
      setTimeout(() => key.classList.remove("auto-glow"), 200);
      playTone(n.freq, 0.35, "triangle", 0.32);
      spawnAtElement(key, ["🎵", "✨"], 2, "steam-puff");
      registerMusicTap("🎵");
    });
    xyloKeyEls.push(key);
    xyloRow.appendChild(key);
  });

  CHOIR.forEach(c => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "choir-btn";
    btn.innerHTML = `<span class="c-emo">${c.emoji}</span><span>${c.name}</span>`;
    btn.addEventListener("click", () => {
      btn.classList.add("singing");
      setTimeout(() => btn.classList.remove("singing"), 400);
      playTone(c.freqs[0], 0.16, "sine", 0.28);
      setTimeout(() => playTone(c.freqs[1], 0.22, "triangle", 0.3), 120);
      registerMusicTap(c.emoji);
    });
    choirBtnEls.push(btn);
    animalChoir.appendChild(btn);
  });

  DRUMS.forEach(d => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "drum-btn";
    btn.innerHTML = `<span>${d.emoji}</span>${d.name}`;
    btn.addEventListener("click", () => {
      playTone(d.freq, 0.2, d.type, 0.3);
      registerMusicTap(d.emoji);
    });
    drumRow.appendChild(btn);
  });

  // Auto-Play Nursery Rhyme Sequence on Rainbow Xylophone
  stopAutoMelody = function (completed = false, songName = "") {
    clearInterval(melodyTimer);
    melodyTimer = null;
    autoMelodyPlaying = false;
    syncBgmVolume();
    xyloKeyEls.forEach(k => k.classList.remove("auto-glow"));
    choirBtnEls.forEach(b => b.classList.remove("singing"));
    autoMelodyBtn.classList.remove("playing-melody");
    autoMelodyBtn.textContent = "🎵 自動演奏兒歌";
    if (completed) {
      musicCoach.textContent = `👏 《${songName}》演奏完畢！再按一次聽下一首兒歌！`;
      if (musicTapCount < 8) {
        musicTapCount = 8;
        awardBadge("music", "音樂家徽章");
      } else {
        playCheerSfx();
      }
    }
  };

  autoMelodyBtn.addEventListener("click", () => {
    if (autoMelodyPlaying) {
      stopAutoMelody(false);
      musicCoach.textContent = "🎵 已暫停自動演奏，快用小手指自由彈木琴吧！";
      return;
    }
    const song = MELODIES[melodyIdx % MELODIES.length];
    melodyIdx++;
    autoMelodyPlaying = true;
    syncBgmVolume();
    autoMelodyBtn.classList.add("playing-melody");
    autoMelodyBtn.textContent = `⏹️ 停止演奏（${song.title}）`;
    musicCoach.textContent = `🎵 正在自動演奏：《${song.title}》✨ 看彩虹木琴跳舞！`;

    let step = 0;
    const playStep = () => {
      xyloKeyEls.forEach(k => k.classList.remove("auto-glow"));
      choirBtnEls.forEach(b => b.classList.remove("singing"));
      if (step >= song.seq.length) {
        stopAutoMelody(true, song.title);
        return;
      }
      const noteIdx = song.seq[step];
      if (noteIdx >= 0 && xyloKeyEls[noteIdx]) {
        const keyEl = xyloKeyEls[noteIdx];
        keyEl.classList.add("auto-glow");
        playTone(NOTES[noteIdx].freq, 0.3, "triangle", 0.34);
        spawnAtElement(keyEl, ["🎵", "✨", "⭐"], 2, "steam-puff");
        const singer = choirBtnEls[step % choirBtnEls.length];
        if (singer) singer.classList.add("singing");
      }
      step++;
    };

    playStep();
    melodyTimer = setInterval(playStep, 340);
  });

  // ==========================================
  // ONE-TAP 🔊 語音導覽 (Mandarin Voice Guide)
  // ==========================================
  function getVoiceInstruction(gameKey) {
    if (gameKey === "train") {
      if (trainRunning) return "嘟嘟！陽光小火車正在載小動物去遊樂園喔！";
      if (isTrackReady()) return "鐵軌已經接好囉！快按右下角綠色的嘟嘟發車按鈕，聽火車鳴笛出發！";
      return "小火車玩法：請用一根手指點閃亮的草地鋪鐵軌，或是按藍色自動鋪軌，再按綠色嘟嘟發車載小動物喔！";
    }
    if (gameKey === "chef") {
      const dish = isIceCream ? "聖代冰淇淋" : "陽光披薩";
      const wantNames = currentOrder.map(o => o.name).join("、");
      return `${currentCustomer.name}肚子餓了，想吃${dish}！請點下面的${wantNames}放到盤子裡，再按粉紅色按鈕端上桌！`;
    }
    if (gameKey === "maze") {
      if (petRescued) {
        return `太棒了，已經救出${currentPet.name}！現在點右下角的紅旗格子，一起走到終點吧！`;
      }
      return `森林迷宮玩法：點石頭可以敲碎它，先點發光格子救出${currentPet.name}，再一起走到右下角的紅旗喔！`;
    }
    if (gameKey === "music") {
      return "音樂盒玩法：用手指彈彩虹木琴、點小動物唱歌和打鼓，也可以按最下面的自動演奏兒歌按鈕，看木琴自己跳舞喔！";
    }
    return "歡迎來到阿奇小隊歡樂遊樂園！";
  }

  document.querySelectorAll("[data-voice]").forEach(el => {
    el.addEventListener("click", () => {
      const key = el.dataset.voice;
      const bannerBtn = el.closest(".coach-banner")?.querySelector(".voice-guide-btn") || el;
      playTone(783.99, 0.1, "sine", 0.18);
      spawnAtElement(bannerBtn, ["🔊", "💬", "✨"], 2, "steam-puff");
      speakTW(getVoiceInstruction(key), bannerBtn);
    });
  });
})();
