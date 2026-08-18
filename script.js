const PLAYLIST_ID = "PLP8gZUHFGFVYLM5qkPlMivAiQ9LHvgI1M";

let player;
let ready = false;
let totalTracks = 0;
let lastVolume = 70;
let errorSkipTimer = null;

const playBtn = document.getElementById("playBtn");
const titleEl = document.getElementById("trackTitle");
const artistEl = document.getElementById("trackArtist");
const statusEl = document.getElementById("playerStatus");
const volumeEl = document.getElementById("volume");
const progressFill = document.getElementById("progressFill");

document.getElementById("year").textContent = new Date().getFullYear();

function status(text) {
  if (statusEl) statusEl.textContent = text;
}

function updateInfo() {
  if (!ready) return;

  const data = player.getVideoData() || {};
  const index = player.getPlaylistIndex();
  const playlist = player.getPlaylist();

  if (Array.isArray(playlist) && playlist.length > 0) {
    totalTracks = playlist.length;
  }

  if (data.title) titleEl.textContent = data.title;

  if (artistEl) {
    const track = (index >= 0 && totalTracks > 0)
      ? ` • Track ${index + 1} of ${totalTracks}`
      : "";
    artistEl.textContent = `${data.author || "YouTube"}${track}`;
  }
}

function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    // Keep a valid YouTube player viewport. It can be hidden with CSS.
    height: "200",
    width: "200",
    playerVars: {
      listType: "playlist",
      list: PLAYLIST_ID,
      autoplay: 0,
      controls: 0,
      playsinline: 1,
      rel: 0,
      enablejsapi: 1,
      origin: window.location.origin
    },
    events: {
      onReady: function () {
        ready = true;
        player.setVolume(lastVolume);

        // Let YouTube itself control the complete playlist.
        player.cuePlaylist({
          listType: "playlist",
          list: PLAYLIST_ID,
          index: 0
        });

        // Loop only after the actual last track.
        player.setLoop(true);

        status("Ready — press Play");

        setTimeout(updateInfo, 1500);
        setTimeout(updateInfo, 3000);
      },

      onStateChange: function (event) {
        if (event.data === YT.PlayerState.PLAYING) {
          clearTimeout(errorSkipTimer);
          playBtn.textContent = "❚❚";
          status("LIVE — playing from YouTube");
          updateInfo();
        } else if (event.data === YT.PlayerState.PAUSED) {
          playBtn.textContent = "▶";
          status("Paused");
        } else if (event.data === YT.PlayerState.BUFFERING) {
          status("Buffering…");
        } else if (event.data === YT.PlayerState.CUED) {
          // Reapply loop after the playlist has actually been loaded.
          player.setLoop(true);
          updateInfo();
          status("Ready — press Play");
        }

        // IMPORTANT:
        // No ENDED handler and no manual nextVideo().
        // YouTube advances Track 1 -> 2 -> 3 ... -> 200 itself.
      },

      onError: function () {
        // Only skip when YouTube explicitly reports a bad/unembeddable item.
        clearTimeout(errorSkipTimer);
        status("Unavailable track — skipping…");
        errorSkipTimer = setTimeout(function () {
          if (ready) player.nextVideo();
        }, 1000);
      }
    }
  });
}

playBtn.addEventListener("click", function () {
  if (!ready) {
    status("Loading player…");
    return;
  }

  if (player.getPlayerState() === YT.PlayerState.PLAYING) {
    player.pauseVideo();
  } else {
    player.playVideo();
  }
});

document.getElementById("nextBtn").addEventListener("click", function () {
  if (ready) player.nextVideo();
});

document.getElementById("prevBtn").addEventListener("click", function () {
  if (ready) player.previousVideo();
});

document.getElementById("liveBtn").addEventListener("click", function () {
  if (ready) player.playVideo();
});

volumeEl.addEventListener("input", function (event) {
  if (!ready) return;
  lastVolume = Number(event.target.value);
  player.setVolume(lastVolume);
  if (lastVolume > 0) player.unMute();
});

document.getElementById("muteBtn").addEventListener("click", function () {
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

if (visualizer) {
  for (let i = 0; i < 24; i++) {
    const bar = document.createElement("i");
    bar.style.height = (12 + Math.random() * 58) + "px";
    visualizer.appendChild(bar);
  }
}

setInterval(function () {
  if (visualizer) {
    [...visualizer.children].forEach(function (bar) {
      bar.style.height = (10 + Math.random() * 60) + "px";
    });
  }

  if (ready) {
    updateInfo();

    if (player.getPlayerState() === YT.PlayerState.PLAYING) {
      const duration = player.getDuration();
      const current = player.getCurrentTime();

      if (duration && progressFill) {
        progressFill.style.width =
          Math.min(100, (current / duration) * 100) + "%";
      }
    }
  }
}, 1000);
