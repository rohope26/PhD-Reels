const templates = [
  {
    title: "Minecraft Obby",
    description: "Fast jumps and clean contrast",
    videoId: "u7kdVe8q5zs",
    params: "si=hupChMPSgELPU0zj&mute=1"
  },
  {
    title: "Subway Surfers",
    description: "Classic endless-run pacing",
    videoId: "vTfD20dbxho",
    params: "si=toqjWDQ8z60gVynz&mute=1"
  },
  {
    title: "Survival Chance",
    description: "High tension and sharp motion",
    videoId: "F3dKWgNu1FY",
    params: "si=I9yfs-C9C4jZWiou&mute=1"
  },
  {
    title: "Steel Coil vs Bus",
    description: "Heavy impact visual payoff",
    videoId: "2N_R5f5jEeQ",
    params: "si=OMhKFvyzSHU0iNMl&mute=1"
  }
];

let utterance = null;
let narrationRunId = 0;
let player = null;
let playerReady = false;
let reelIsPlaying = false;
let speechPausedByVideo = false;

const overlayInput = document.getElementById("overlayInput");
const textEl = document.getElementById("text");
const videoSelect = document.getElementById("videoSelect");
const videoFrame = document.getElementById("videoFrame");
const speedRange = document.getElementById("speedRange");
const speedValue = document.getElementById("speedValue");
const lengthGuidance = document.getElementById("lengthGuidance");
const lengthCount = document.getElementById("lengthCount");
const thumbnailTrack = document.getElementById("thumbnailTrack");
const generateButton = document.getElementById("generateButton");

function buildEmbedUrl(template, autoplay = false, loop = false) {
  const autoplayParam = autoplay ? "&autoplay=1" : "";
  const loopParam = loop ? `&loop=1&playlist=${template.videoId}` : "";
  return `https://www.youtube.com/embed/${template.videoId}?${template.params}&enablejsapi=1&playsinline=1${autoplayParam}${loopParam}`;
}

function setVideo(template, autoplay = false) {
  if (!playerReady || !player) {
    videoFrame.src = buildEmbedUrl(template, autoplay, autoplay);
    return;
  }

  if (autoplay) {
    player.loadVideoById(template.videoId);
    return;
  }

  player.cueVideoById(template.videoId);
}

function syncSpeechWithVideoState(playerState) {
  if (!reelIsPlaying) return;

  if (playerState === window.YT.PlayerState.PAUSED && window.speechSynthesis.speaking) {
    window.speechSynthesis.pause();
    speechPausedByVideo = true;
    return;
  }

  if (playerState === window.YT.PlayerState.PLAYING && speechPausedByVideo) {
    window.speechSynthesis.resume();
    speechPausedByVideo = false;
    return;
  }

  if (playerState === window.YT.PlayerState.ENDED && window.speechSynthesis.speaking) {
    player.seekTo(0, true);
    player.playVideo();
  }
}

function initializeYouTubePlayer() {
  player = new window.YT.Player("videoFrame", {
    events: {
      onReady: () => {
        playerReady = true;
      },
      onStateChange: (event) => syncSpeechWithVideoState(event.data)
    }
  });
}

function loadYouTubeApi() {
  if (window.YT?.Player) {
    initializeYouTubePlayer();
    return;
  }

  window.onYouTubeIframeAPIReady = initializeYouTubePlayer;

  const script = document.createElement("script");
  script.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(script);
}

function populateTemplateSelect() {
  templates.forEach((template, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = template.title;
    videoSelect.appendChild(option);
  });
}

function createThumbnailCard(template, index) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "thumb-card";
  button.dataset.index = String(index);
  button.setAttribute("aria-label", `Select ${template.title}`);

  button.innerHTML = `
    <div class="thumb-media" style="background-image: url('https://img.youtube.com/vi/${template.videoId}/hqdefault.jpg');"></div>
    <div class="thumb-meta">
      <p class="thumb-title">${template.title}</p>
      <p class="thumb-copy">${template.description}</p>
    </div>
  `;

  button.addEventListener("click", () => {
    videoSelect.value = String(index);
    syncSelectedTemplate();
  });

  return button;
}

function populateThumbnailRail() {
  const duplicatedTemplates = [...templates, ...templates];
  duplicatedTemplates.forEach((template, duplicateIndex) => {
    const actualIndex = duplicateIndex % templates.length;
    thumbnailTrack.appendChild(createThumbnailCard(template, actualIndex));
  });
}

function syncSelectedTemplate() {
  const selectedIndex = Number(videoSelect.value || 0);
  const selectedTemplate = templates[selectedIndex];

  setVideo(selectedTemplate, false);

  document.querySelectorAll(".thumb-card").forEach((card) => {
    card.classList.toggle("is-active", Number(card.dataset.index) === selectedIndex);
  });
}

function updateLengthGuidance() {
  const text = overlayInput.value.trim();
  const words = text ? text.split(/\s+/).length : 0;
  const chars = text.length;

  lengthCount.textContent = `${words} words / ${chars} characters`;
  lengthGuidance.classList.remove("is-good", "is-warn", "is-bad");

  if (!text) {
    lengthGuidance.textContent = "Add a short voiceover script to preview word-by-word captions.";
    return;
  }

  if (words < 8 || chars < 40) {
    lengthGuidance.textContent = "A little short. Add more context so the reel feels complete.";
    lengthGuidance.classList.add("is-warn");
    return;
  }

  if (words <= 40) {
    lengthGuidance.textContent = "Looks good for a short reel voiceover.";
    lengthGuidance.classList.add("is-good");
    return;
  }

  if (words <= 80) {
    lengthGuidance.textContent = "Longer, but usable. The video will stay active until the narration ends.";
    lengthGuidance.classList.add("is-warn");
    return;
  }

  lengthGuidance.textContent = "Long script detected. The reel will run for the full narration.";
  lengthGuidance.classList.add("is-warn");
}

function updateSpeedDisplay() {
  const value = Number(speedRange.value);
  const min = Number(speedRange.min);
  const max = Number(speedRange.max);
  const percent = ((value - min) / (max - min)) * 100;

  speedRange.style.setProperty("--fill-percent", `${percent}%`);
  speedValue.textContent = `${value.toFixed(1)}x`;
}

function startWords() {
  const input = overlayInput.value.trim();

  if (!input) {
    textEl.textContent = "Overlay Text";
    overlayInput.focus();
    return;
  }

  const selectedTemplate = templates[Number(videoSelect.value || 0)];
  narrationRunId += 1;
  const currentRunId = narrationRunId;
  reelIsPlaying = true;
  speechPausedByVideo = false;
  window.speechSynthesis.cancel();
  setVideo(selectedTemplate, true);

  const words = input.split(/\s+/);
  const wordPositions = [];
  let searchStart = 0;

  for (const word of words) {
    const start = input.indexOf(word, searchStart);
    const end = start + word.length;
    wordPositions.push({ word, start, end });
    searchStart = end;
  }

  textEl.textContent = words[0];

  utterance = new SpeechSynthesisUtterance(input);
  utterance.rate = Number(speedRange.value);

  utterance.onboundary = (event) => {
    if (event.name !== "word") return;

    const charIndex = event.charIndex;
    const current = wordPositions.find(
      (item) => charIndex >= item.start && charIndex < item.end
    );

    if (current) {
      textEl.textContent = current.word;
    }
  };

  utterance.onend = () => {
    if (currentRunId !== narrationRunId) return;

    reelIsPlaying = false;
    speechPausedByVideo = false;
    setVideo(selectedTemplate, false);
    textEl.textContent = words[words.length - 1];
  };

  utterance.onerror = () => {
    if (currentRunId !== narrationRunId) return;

    reelIsPlaying = false;
    speechPausedByVideo = false;
    setVideo(selectedTemplate, false);
  };

  window.speechSynthesis.speak(utterance);
}

populateTemplateSelect();
populateThumbnailRail();
loadYouTubeApi();
videoSelect.value = "0";
syncSelectedTemplate();
updateLengthGuidance();
updateSpeedDisplay();

overlayInput.addEventListener("input", updateLengthGuidance);
videoSelect.addEventListener("change", syncSelectedTemplate);
speedRange.addEventListener("input", updateSpeedDisplay);
generateButton.addEventListener("click", startWords);
