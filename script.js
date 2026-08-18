const PLAYLIST_ID = "PLP8gZUHFGFVYLM5qkPlMivAiQ9LHvgI1M";

let player, ready = false, lastVolume = 70, endingIndex = -1;
const playBtn = document.getElementById("playBtn");
const titleEl = document.getElementById("trackTitle");
const artistEl = document.getElementById("trackArtist");
const statusEl = document.getElementById("playerStatus");
const volumeEl = document.getElementById("volume");
const progressFill = document.getElementById("progressFill");

document.getElementById("year").textContent = new Date().getFullYear();

function status(t) { if (statusEl) statusEl.textContent = t; }

function updateInfo() {
  if (!ready) return;
  const data = player.getVideoData();
  const index = player.getPlaylistIndex();
  const list = player.getPlaylist() || [];
  if (data && data.title) titleEl.textContent = data.title;
  if (artistEl) {
    artistEl.textContent =
      `${(data && data.author) || "YouTube"}${list.length ? ` • Track ${index + 1} of ${list.length}` : ""}`;
  }
}

function skipToNext(reason) {
  if (!ready) return;
  const list = player.getPlaylist() || [];
  const index = player.getPlaylistIndex();

  if (!list.length) {
    status("Playlist not loaded");
    return;
  }

  if (index < list.length - 1) {
    status(reason || "Loading next track…");
    player.nextVideo();
  } else {
    // Only loop after the REAL last track, never after track 5.
    status("Playlist finished — restarting from Track 1");
    player.playVideoAt(0);
  }
}

function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    height: "1",
    width: "1",
    playerVars: {
      listType: "playlist",
      list: PLAYLIST_ID,
      autoplay: 0,
      controls: 0,
      playsinline: 1,
      rel: 0,
      modestbranding: 1
    },
    events: {
      onReady: () => {
        ready = true;
        player.setVolume(lastVolume);
        player.cuePlaylist({
          listType: "playlist",
          list: PLAYLIST_ID,
          index: 0
        });
        status("Ready — press Play");
      },

      onStateChange: e => {
        if (e.data === YT.PlayerState.PLAYING) {
          endingIndex = -1;
          playBtn.textContent = "❚❚";
          status("LIVE — playing from YouTube");
          updateInfo();
          return;
        }

        if (e.data === YT.PlayerState.PAUSED) {
          playBtn.textContent = "▶";
          status("Paused");
          return;
        }

        if (e.data === YT.PlayerState.BUFFERING) {
          status("Buffering…");
          return;
        }

        if (e.data === YT.PlayerState.CUED) {
          updateInfo();
          status("Ready — press Play");
          return;
        }

        if (e.data === YT.PlayerState.ENDED) {
          // Some embedded playlist sessions stop instead of advancing.
          // Move forward one item, but NEVER reset unless this is the last item.
          const index = player.getPlaylistIndex();
          if (endingIndex === index) return;
          endingIndex = index;
          setTimeout(() => skipToNext("Loading next track…"), 700);
        }
      },

      onError: e => {
        const codes = {
          2: "Invalid video",
          5: "HTML5 player error",
          100: "Video unavailable",
          101: "Embedding not allowed",
          150: "Embedding not allowed"
        };
        status(`${codes[e.data] || "Video error"} — skipping…`);
        setTimeout(() => skipToNext("Skipping unavailable track…"), 800);
      }
    }
  });
}

playBtn.addEventListener("click", () => {
  if (!ready) {
    status("Loading player…");
    return;
  }
  if (player.getPlayerState() === YT.PlayerState.PLAYING) player.pauseVideo();
  else player.playVideo();
});

document.getElementById("nextBtn").addEventListener("click", () => {
  if (ready) skipToNext("Loading next track…");
});

document.getElementById("prevBtn").addEventListener("click", () => {
  if (ready) player.previousVideo();
});

document.getElementById("liveBtn").addEventListener("click", () => {
  if (ready) player.playVideo();
});

volumeEl.addEventListener("input", e => {
  if (!ready) return;
  lastVolume = +e.target.value;
  player.setVolume(lastVolume);
  if (lastVolume > 0) player.unMute();
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

document.getElementById("heartBtn").addEventListener("click", function() {
  this.classList.toggle("active");
});

const visualizer = document.getElementById("visualizer");
if (visualizer) {
  for (let i = 0; i < 24; i++) {
    const bar = document.createElement("i");
    bar.style.height = (12 + Math.random() * 58) + "px";
    visualizer.appendChild(bar);
  }
}

setInterval(() => {
  if (visualizer) {
    [...visualizer.children].forEach(
      b => b.style.height = (10 + Math.random() * 60) + "px"
    );
  }

  if (ready && player.getPlayerState() === YT.PlayerState.PLAYING) {
    const duration = player.getDuration();
    const current = player.getCurrentTime();
    if (duration && progressFill) {
      progressFill.style.width = Math.min(100, current / duration * 100) + "%";
    }
    updateInfo();
  }
}, 1000);
