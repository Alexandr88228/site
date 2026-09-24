/* ============================================
   Love site — settings & logic
   ============================================
   Персонализация: меняй значения ниже.
   ============================================ */

// Видео после «да» — локальный путь или URL
const SUCCESS_VIDEO = "assets/video.mp4";

// Фоновая музыка — включается вместе с видео
const BACKGROUND_MUSIC = "assets/music.mp3";

const CONFIG = {
  name: "Ангелина",
  nickname: "Геля",
  successVideo: SUCCESS_VIDEO,
  backgroundMusic: BACKGROUND_MUSIC,

  // Сообщения при нажатии «нет» (по порядку)
  noMessages: [
    "ты уверена? 🥺",
    "Геля, подумай ещё раз...",
    "а если очень хорошо подумать? 👉👈",
    "не верю.",
    "попробуй ещё раз ❤️",
    "ну пожалуйста 🥺",
    "эта кнопка явно ошибается",
    "Геля, ты точно уверена? 😭",
    "последний шанс... ❤️",
    "ладно... но я всё равно жду «да» 💗",
    "кнопка «нет» устала убегать 😅",
    "Геляааа... 🥺❤️",
  ],

  // После скольких «нет» кнопка начинает убегать
  runawayAfter: 2,

  // После скольких «нет» кнопка убегает уже при приближении
  dodgeAfter: 3,
};

/* ---------- DOM ---------- */

const screenIntro = document.getElementById("screenIntro");
const screenQuestion = document.getElementById("screenQuestion");
const screenSuccess = document.getElementById("screenSuccess");
const openBtn = document.getElementById("openBtn");
const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");
const buttonsStage = document.getElementById("buttonsStage");
const persuadeMsg = document.getElementById("persuadeMsg");
const questionTitle = document.getElementById("questionTitle");
const overlay = document.getElementById("overlay");
const successVideo = document.getElementById("successVideo");
const photoPlaceholder = document.getElementById("photoPlaceholder");
const loveLine = document.getElementById("loveLine");
const floatingHearts = document.getElementById("floatingHearts");
const burstLayer = document.getElementById("burstLayer");
const musicBtn = document.getElementById("musicBtn");
const musicIcon = document.getElementById("musicIcon");
const bgMusic = document.getElementById("bgMusic");

/* ---------- State ---------- */

let noClicks = 0;
let isRunaway = false;
let isTransitioning = false;
let hasSaidYes = false;
let musicPlaying = false;
let floatTimer = null;
let dodgeCooldown = false;

const HEARTS = ["💗", "💕", "❤️", "💖", "🩷"];

/* ---------- Init ---------- */

function init() {
  applyConfigText();
  setupMusic();
  setupSuccessVideo();
  bindEvents();
  startFloatingHearts();
}

function applyConfigText() {
  const nameEl = document.querySelector(".hero-name");
  if (nameEl) {
    nameEl.innerHTML = `${CONFIG.name} <span class="heart-mark" aria-hidden="true">❤️</span>`;
  }
  if (questionTitle) {
    questionTitle.textContent = `${CONFIG.nickname}, ты любишь меня?`;
  }
  if (loveLine) {
    loveLine.textContent = "Обожаю тебя, Гель";
  }
  document.title = `Для ${CONFIG.nickname === "Геля" ? "Гели" : CONFIG.nickname}`;
}

function setupSuccessVideo() {
  const src = (SUCCESS_VIDEO || CONFIG.successVideo || "").trim();
  if (!src) {
    successVideo.hidden = true;
    photoPlaceholder.hidden = false;
    return;
  }

  successVideo.src = src;
  successVideo.muted = true;
  successVideo.playsInline = true;
  successVideo.hidden = false;
  photoPlaceholder.hidden = true;
  successVideo.onerror = () => {
    successVideo.hidden = true;
    photoPlaceholder.hidden = false;
  };
  successVideo.addEventListener("click", () => {
    startSuccessMedia();
  });
}

function setupMusic() {
  const src = (BACKGROUND_MUSIC || CONFIG.backgroundMusic || "").trim();
  if (!src) {
    musicBtn.hidden = true;
    return;
  }
  bgMusic.src = src;
  bgMusic.volume = 0.45;
  musicBtn.hidden = false;
  musicBtn.addEventListener("click", toggleMusic);
}

async function playMusic() {
  if (!bgMusic.src) return;
  try {
    bgMusic.volume = 0.45;
    await bgMusic.play();
    musicPlaying = true;
    musicBtn.classList.add("is-playing");
    musicIcon.textContent = "♫";
  } catch {
    // Browser may block autoplay — кнопка ♪ всё равно останется
  }
}

function pauseMusic() {
  bgMusic.pause();
  musicPlaying = false;
  musicBtn.classList.remove("is-playing");
  musicIcon.textContent = "♪";
}

async function toggleMusic() {
  if (musicPlaying) {
    pauseMusic();
  } else {
    await playMusic();
  }
}

async function startSuccessMedia() {
  if (successVideo && successVideo.src) {
    try {
      if (successVideo.paused) {
        successVideo.currentTime = 0;
      }
      await successVideo.play();
    } catch {
      // если автозапуск не прошёл — видео можно запустить тапом
    }
  }
  if (!musicPlaying) {
    await playMusic();
  }
}

/* ---------- Screen transitions ---------- */

function switchScreen(fromEl, toEl) {
  if (isTransitioning) return;
  isTransitioning = true;

  fromEl.classList.add("is-leaving");

  setTimeout(() => {
    fromEl.hidden = true;
    fromEl.classList.remove("is-active", "is-leaving");

    toEl.hidden = false;
    toEl.classList.add("is-active", "is-entering");

    setTimeout(() => {
      toEl.classList.remove("is-entering");
      isTransitioning = false;
    }, 650);
  }, 480);
}

/* ---------- Events ---------- */

function bindEvents() {
  openBtn.addEventListener("click", onOpen);

  yesBtn.addEventListener("click", onYes);

  noBtn.addEventListener("click", onNo);

  // Dodge on hover / touch approach
  noBtn.addEventListener("pointerenter", onNoApproach);
  noBtn.addEventListener("pointerdown", onNoApproach, { passive: false });

  // Keep runaway button inside stage on resize
  window.addEventListener("resize", () => {
    if (isRunaway) clampNoButton();
  });
}

function onOpen() {
  if (isTransitioning) return;
  switchScreen(screenIntro, screenQuestion);
}

function onYes(e) {
  e.stopPropagation();
  if (hasSaidYes || isTransitioning) return;
  hasSaidYes = true;

  // Disable no button
  noBtn.style.pointerEvents = "none";
  noBtn.style.opacity = "0.4";

  startSuccessMedia();
  celebrate();
}

function onNo(e) {
  e.preventDefault();
  e.stopPropagation();
  if (hasSaidYes || isTransitioning) return;

  noClicks += 1;
  showPersuadeMessage();
  growYesButton();

  if (noClicks > CONFIG.runawayAfter) {
    enableRunaway();
    moveNoButton(e);
  }
}

function onNoApproach(e) {
  if (hasSaidYes || !isRunaway || noClicks < CONFIG.dodgeAfter) return;
  if (dodgeCooldown) return;

  // On touch: prevent default click so it doesn't instantly register as press
  if (e.type === "pointerdown" && e.pointerType === "touch") {
    e.preventDefault();
  }

  dodgeCooldown = true;
  moveNoButton(e);

  setTimeout(() => {
    dodgeCooldown = false;
  }, 320);
}

/* ---------- Persuade messages ---------- */

function showPersuadeMessage() {
  const msgs = CONFIG.noMessages;
  const idx = Math.min(noClicks - 1, msgs.length - 1);
  const text = msgs[idx];

  persuadeMsg.classList.remove("is-visible");

  requestAnimationFrame(() => {
    setTimeout(() => {
      persuadeMsg.textContent = text;
      persuadeMsg.classList.add("is-visible");
    }, 80);
  });
}

/* ---------- Yes button growth ---------- */

function growYesButton() {
  yesBtn.classList.remove("scale-1", "scale-2", "scale-3", "scale-4");
  if (noClicks >= 7) yesBtn.classList.add("scale-4");
  else if (noClicks >= 5) yesBtn.classList.add("scale-3");
  else if (noClicks >= 3) yesBtn.classList.add("scale-2");
  else if (noClicks >= 1) yesBtn.classList.add("scale-1");
}

/* ---------- Runaway «нет» ---------- */

function enableRunaway() {
  if (isRunaway) return;
  isRunaway = true;
  noBtn.classList.add("is-runaway");
  buttonsStage.classList.add("is-runaway-mode");

  // Place relative to stage using current visual position
  const stageRect = buttonsStage.getBoundingClientRect();
  const btnRect = noBtn.getBoundingClientRect();
  noBtn.style.left = `${btnRect.left - stageRect.left}px`;
  noBtn.style.top = `${btnRect.top - stageRect.top}px`;
}

function moveNoButton(event) {
  if (!isRunaway) return;

  const stage = buttonsStage;
  const stageRect = stage.getBoundingClientRect();
  const btnW = noBtn.offsetWidth;
  const btnH = noBtn.offsetHeight;
  const pad = 6;

  const maxX = Math.max(pad, stageRect.width - btnW - pad);
  const maxY = Math.max(pad, stageRect.height - btnH - pad);

  // Prefer positions near the Yes button sometimes (~35%)
  let x;
  let y;
  const nearYes = Math.random() < 0.35;

  if (nearYes) {
    const yesRect = yesBtn.getBoundingClientRect();
    const yesLocalX = yesRect.left - stageRect.left;
    const yesLocalY = yesRect.top - stageRect.top;
    const offsetX = (Math.random() - 0.5) * (btnW + 40);
    const offsetY = yesRect.height + 8 + Math.random() * 24;
    x = clamp(yesLocalX + offsetX, pad, maxX);
    y = clamp(yesLocalY + offsetY, pad, maxY);
  } else {
    // Avoid current pointer / current button position
    let tries = 0;
    do {
      x = pad + Math.random() * (maxX - pad);
      y = pad + Math.random() * (maxY - pad);
      tries += 1;
    } while (tries < 8 && isTooClose(x, y, btnW, btnH, event, stageRect));
  }

  noBtn.style.left = `${x}px`;
  noBtn.style.top = `${y}px`;
}

function isTooClose(x, y, btnW, btnH, event, stageRect) {
  const cx = x + btnW / 2;
  const cy = y + btnH / 2;

  // Distance from current button center
  const curLeft = parseFloat(noBtn.style.left) || 0;
  const curTop = parseFloat(noBtn.style.top) || 0;
  const dx = cx - (curLeft + btnW / 2);
  const dy = cy - (curTop + btnH / 2);
  if (Math.hypot(dx, dy) < 60) return true;

  if (event && typeof event.clientX === "number") {
    const px = event.clientX - stageRect.left;
    const py = event.clientY - stageRect.top;
    if (Math.hypot(cx - px, cy - py) < 50) return true;
  }
  return false;
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function clampNoButton() {
  const stageRect = buttonsStage.getBoundingClientRect();
  const btnW = noBtn.offsetWidth;
  const btnH = noBtn.offsetHeight;
  const pad = 6;
  const maxX = Math.max(pad, stageRect.width - btnW - pad);
  const maxY = Math.max(pad, stageRect.height - btnH - pad);
  const x = clamp(parseFloat(noBtn.style.left) || 0, pad, maxX);
  const y = clamp(parseFloat(noBtn.style.top) || 0, pad, maxY);
  noBtn.style.left = `${x}px`;
  noBtn.style.top = `${y}px`;
}

/* ---------- Celebrate / success ---------- */

function celebrate() {
  overlay.classList.add("is-active");
  spawnBurst(28);

  setTimeout(() => {
    screenQuestion.classList.add("is-leaving");

    setTimeout(() => {
      screenQuestion.hidden = true;
      screenQuestion.classList.remove("is-active", "is-leaving");
      overlay.classList.remove("is-active");

      screenSuccess.hidden = false;
      screenSuccess.classList.add("is-active", "is-entering");
      startSuccessMedia();
      spawnBurst(16);

      setTimeout(() => {
        screenSuccess.classList.remove("is-entering");
      }, 700);
    }, 450);
  }, 700);
}

function spawnBurst(count) {
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;

  for (let i = 0; i < count; i++) {
    const el = document.createElement("span");
    el.className = "burst-heart";
    el.textContent = HEARTS[Math.floor(Math.random() * HEARTS.length)];
    el.style.left = `${cx}px`;
    el.style.top = `${cy}px`;

    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const dist = 80 + Math.random() * 160;
    el.style.setProperty("--tx", `${Math.cos(angle) * dist}px`);
    el.style.setProperty("--ty", `${Math.sin(angle) * dist - 40}px`);
    el.style.fontSize = `${14 + Math.random() * 14}px`;

    burstLayer.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  }
}

/* ---------- Ambient floating hearts ---------- */

function startFloatingHearts() {
  spawnFloatHeart();
  floatTimer = setInterval(spawnFloatHeart, 2800);
}

function spawnFloatHeart() {
  if (document.hidden) return;

  const el = document.createElement("span");
  el.className = "float-heart";
  el.textContent = HEARTS[Math.floor(Math.random() * HEARTS.length)];
  el.style.left = `${8 + Math.random() * 84}%`;
  el.style.fontSize = `${10 + Math.random() * 12}px`;
  el.style.animationDuration = `${9 + Math.random() * 7}s`;

  floatingHearts.appendChild(el);
  setTimeout(() => el.remove(), 17000);
}

/* ---------- Boot ---------- */

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
