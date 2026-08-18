const PLAYLIST_ID = "PLP8gZUHFGFVYLM5qkPlMivAiQ9LHvgI1M";

let player;
let ready = false;
let playlistLoaded = false;
let advancing = false;
let lastKnownIndex = 0;
let totalTracks = 0;
let lastVolume = 70;

const playBtn = document.getElementById("playBtn");
const titleEl = document.getElementById("trackTitle");
const artistEl = document.getElementById("trackArtist");
const statusEl = document.getElementById("playerStatus");
const volumeEl = document.getElementById("volume");
const progressFill = document.getElementById("progressFill");

document.getElementById("year").textContent = new Date().getFullYear();

function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

function updateTrackInfo() {
  if (!ready) return;

  const data = player.getVideoData();
  const index = player.getPlaylistIndex();
  const list = player.getPlaylist() || [];

  if (list.length > 0) totalTracks = list.length;
  if (index >= 0) lastKnownIndex = index;

  if (data && data.title) titleEl.textContent = data.title;
  artistEl.textContent =
    `${data?.author || "YouTube"}${totalTracks ? ` • Track ${lastKnownIndex + 1} of ${totalTracks}` : ""}`;
}

function loadFullPlaylist(startIndex = 0, autoplay = false) {
  if (!ready) return;

  advancing = false;
  playlistLoaded = true;

  if (autoplay) {
    player.loadPlaylist({
      listType: "playlist",
      list: PLAYLIST_ID,
      index: startIndex,
      startSeconds: 0
    });
    setStatus("Loading playlist…");
  } else {
    player.cuePlaylist({
      listType: "playlist",
      list: PLAYLIST_ID,
      index: startIndex,
      startSeconds: 0
    });
    setStatus("Ready — press Play");
  }
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
      modestbranding: 1,
      playsinline: 1,
      rel: 0
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
      onError: onPlayerError
    }
  });
}

function onPlayerReady() {
  ready = true;
  player.setVolume(70);
  loadFullPlaylist(0, false);
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.PLAYING) {
    advancing = false;
    playBtn.textContent = "❚❚";
    setStatus("LIVE — playing from YouTube");
    updateTrackInfo();
  }

  if (event.data === YT.PlayerState.PAUSED) {
    playBtn.textContent = "▶";
    setStatus("Paused");
  }

  if (event.data === YT.PlayerState.CUED) {
    playlistLoaded = true;
    const list = player.getPlaylist() || [];
    totalTracks = list.length;
    setStatus(totalTracks ? `Ready — ${totalTracks} playable tracks loaded` : "Ready — press Play");
    updateTrackInfo();
  }

  if (event.data === YT.PlayerState.BUFFERING) {
    setStatus("Buffering…");
  }

  if (event.data === YT.PlayerState.ENDED) {
    // Do not manually jump back to track 1.
    // The YouTube playlist advances automatically. This fallback only
    // moves forward if the player remains stopped after a short delay.
    if (advancing) return;
    advancing = true;
    setStatus("Loading next track…");

    setTimeout(() => {
      if (!ready) return;

      const state = player.getPlayerState();
      const index = player.getPlaylistIndex();
      const list = player.getPlaylist() || [];

      if (list.length > 0) totalTracks = list.length;

      // If YouTube did not automatically advance, move to the next index.
      if (state === YT.PlayerState.ENDED && totalTracks > 0) {
        if (index < totalTracks - 1) {
          player.playVideoAt(index + 1);
        } else {
          // Only return to the first track after the actual last track.
          player.playVideoAt(0);
        }
      }
      advancing = false;
    }, 1500);
  }
}

function onPlayerError(event) {
  const errorMessages = {
    2: "Invalid video request — skipping…",
    5: "This video cannot play in the embedded player — skipping…",
    100: "This video is unavailable — skipping…",
    101: "This video cannot be embedded — skipping…",
    150: "This video cannot be embedded — skipping…"
  };

  setStatus(errorMessages[event.data] || "Playback error — skipping…");

  // Skip unavailable/restricted videos instead of restarting the playlist.
  setTimeout(() => {
    if (ready) player.nextVideo();
  }, 1000);
}

playBtn.addEventListener("click", () => {
  if (!ready) {
    setStatus("Player is still loading. Please wait a moment.");
    return;
  }

  const state = player.getPlayerState();

  if (state === YT.PlayerState.PLAYING) {
    player.pauseVideo();
    return;
  }

  if (!playlistLoaded || state === -1 || state === YT.PlayerState.UNSTARTED) {
    loadFullPlaylist(lastKnownIndex || 0, true);
  } else {
    player.playVideo();
  }
});

document.getElementById("nextBtn").addEventListener("click", () => {
  if (ready) {
    setStatus("Loading next track…");
    player.nextVideo();
  }
});

document.getElementById("prevBtn").addEventListener("click", () => {
  if (ready) {
    setStatus("Loading previous track…");
    player.previousVideo();
  }
});

document.getElementById("liveBtn").addEventListener("click", () => {
  if (ready) {
    setStatus("Playing current playlist…");
    player.playVideo();
  }
});

volumeEl.addEventListener("input", e => {
  if (!ready) return;
  const value = Number(e.target.value);
  lastVolume = value;
  player.setVolume(value);
  if (value > 0) player.unMute();
});

document.getElementById("muteBtn").addEventListener("click", () => {
  if (!ready) return;
  if (player.isMuted()) {
    player.unMute();
    player.setVolume(lastVolume || 70);
  } else {
    lastVolume = player.getVolume();
    player.mute();
  }
});

document.getElementById("heartBtn").addEventListener("click", function () {
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

    if (duration > 0) {
      progressFill.style.width =
        Math.min(100, (current / duration) * 100) + "%";
    }

    updateTrackInfo();
  }
}, 1000);
