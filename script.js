const PLAYLIST_ID = "PLP8gZUHFGFVYLM5qkPlMivAiQ9LHvgI1M";
let player, ready = false, muted = false, lastVolume = 70;

const playBtn = document.getElementById("playBtn");
const titleEl = document.getElementById("trackTitle");
const artistEl = document.getElementById("trackArtist");
const statusEl = document.getElementById("playerStatus");
const volumeEl = document.getElementById("volume");
const progressFill = document.getElementById("progressFill");

document.getElementById("year").textContent = new Date().getFullYear();

function setStatus(text) {
  statusEl.textContent = text;
}

function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    height: "1",
    width: "1",
    playerVars: {
      autoplay: 0,
      controls: 0,
      disablekb: 1,
      fs: 0,
      iv_load_policy: 3,
      listType: "playlist",
      list: PLAYLIST_ID,
      modestbranding: 1,
      playsinline: 1,
      rel: 0
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: updateState,
      onError: onPlayerError
    }
  });
}

function onPlayerReady() {
  ready = true;
  player.setVolume(70);

  // Explicitly load the playlist. This is more reliable than relying only
  // on the initial iframe parameters.
  try {
    player.cuePlaylist({
      listType: "playlist",
      list: PLAYLIST_ID,
      index: 0,
      startSeconds: 0
    });
    setStatus("Ready — press Play");
    artistEl.textContent = "Press Play to start the music";
  } catch (e) {
    setStatus("Player ready — press Play");
  }
}

function onPlayerError(event) {
  const errors = {
    2: "Invalid YouTube playlist/video request.",
    5: "This content cannot be played in the embedded player.",
    100: "A video in the playlist is unavailable. Trying the next one…",
    101: "This video cannot be embedded. Trying the next one…",
    150: "This video cannot be embedded. Trying the next one…"
  };
  setStatus(errors[event.data] || "YouTube playback error. Trying next track…");

  // Skip unavailable/unembeddable videos automatically.
  if (ready && (event.data === 100 || event.data === 101 || event.data === 150)) {
    setTimeout(() => player.nextVideo(), 800);
  }
}

function updateState(event) {
  if (event.data === YT.PlayerState.PLAYING) {
    playBtn.textContent = "❚❚";
    setStatus("LIVE — playing from YouTube");
    updateVideoInfo();
  } else if (event.data === YT.PlayerState.PAUSED) {
    playBtn.textContent = "▶";
    setStatus("Paused");
  } else if (event.data === YT.PlayerState.CUED) {
    setStatus("Ready — press Play");
  } else if (event.data === YT.PlayerState.BUFFERING) {
    setStatus("Buffering…");
  } else if (event.data === YT.PlayerState.ENDED) {
    setStatus("Loading next track…");
  }
}

function updateVideoInfo() {
  if (!ready) return;
  const data = player.getVideoData();
  if (data && data.title) {
    titleEl.textContent = data.title;
    artistEl.textContent = data.author || "YouTube";
  }
}

playBtn.addEventListener("click", () => {
  if (!ready) {
    setStatus("Player is still loading. Please wait a moment and try again.");
    return;
  }

  const state = player.getPlayerState();
  if (state === YT.PlayerState.PLAYING) {
    player.pauseVideo();
  } else {
    setStatus("Starting music…");
    // Explicit playlist load on the first click makes the setup work
    // even when cueing a YouTube Music playlist is delayed.
    if (state === -1 || state === YT.PlayerState.UNSTARTED) {
      player.loadPlaylist({
        listType: "playlist",
        list: PLAYLIST_ID,
        index: 0,
        startSeconds: 0
      });
    } else {
      player.playVideo();
    }
  }
});

document.getElementById("nextBtn").addEventListener("click", () => {
  if (ready) { setStatus("Loading next track…"); player.nextVideo(); }
});

document.getElementById("prevBtn").addEventListener("click", () => {
  if (ready) { setStatus("Loading previous track…"); player.previousVideo(); }
});

document.getElementById("liveBtn").addEventListener("click", () => {
  if (!ready) return;
  setStatus("Returning to live playlist…");
  player.playVideo();
});

volumeEl.addEventListener("input", e => {
  if (!ready) return;
  const value = Number(e.target.value);
  player.setVolume(value);
  lastVolume = value;
  if (value > 0) {
    player.unMute();
    muted = false;
  }
});

document.getElementById("muteBtn").addEventListener("click", () => {
  if (!ready) return;
  muted = !muted;
  if (muted) {
    lastVolume = player.getVolume();
    player.mute();
  } else {
    player.unMute();
    player.setVolume(lastVolume || 70);
  }
});

document.getElementById("heartBtn").addEventListener("click", function() {
  this.classList.toggle("active");
});

const visualizer = document.getElementById("visualizer");
for (let i = 0; i < 24; i++) {
  const bar = document.createElement("i");
  bar.style.height = (12 + Math.random() * 58) + "px";
  visualizer.appendChild(bar);
}

setInterval(() => {
  [...visualizer.children].forEach(
    bar => bar.style.height = (10 + Math.random() * 60) + "px"
  );

  if (ready && player.getPlayerState() === YT.PlayerState.PLAYING) {
    const duration = player.getDuration();
    const current = player.getCurrentTime();
    if (duration) {
      progressFill.style.width = Math.min(100, (current / duration) * 100) + "%";
    }
    updateVideoInfo();
  }
}, 1000);
