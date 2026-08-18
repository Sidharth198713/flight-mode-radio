const PLAYLIST_ID = "PLP8gZUHFGFVYLM5qkPlMivAiQ9LHvgI1M";

let player;
let ready = false;
let lastVolume = 70;
let totalTracks = 0;
let lastIndex = 0;
let skipTimer = null;

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

  if (index >= 0) lastIndex = index;

  // Save the playlist length whenever YouTube provides it.
  // Do NOT reset it to zero if YouTube temporarily returns [].
  const playlist = player.getPlaylist();
  if (Array.isArray(playlist) && playlist.length > 0) {
    totalTracks = playlist.length;
  }

  if (data.title) titleEl.textContent = data.title;

  const trackText = totalTracks
    ? ` • Track ${lastIndex + 1} of ${totalTracks}`
    : "";

  if (artistEl) {
    artistEl.textContent = `${data.author || "YouTube"}${trackText}`;
  }
}

function advanceToNext() {
  if (!ready) return;

  clearTimeout(skipTimer);
  updateInfo();

  // If we know we are on the last track, restart the playlist.
  if (totalTracks > 0 && lastIndex >= totalTracks - 1) {
    status("Restarting playlist…");
    player.playVideoAt(0);
    return;
  }

  // IMPORTANT: Do not check getPlaylist() here.
  // YouTube may temporarily return an empty array when a song ends,
  // even though its internal playlist is still loaded.
  status("Loading next track…");
  player.nextVideo();
}

function scheduleNext() {
  clearTimeout(skipTimer);
  skipTimer = setTimeout(advanceToNext, 600);
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
      onReady: function () {
        ready = true;
        player.setVolume(lastVolume);

        player.cuePlaylist({
          listType: "playlist",
          list: PLAYLIST_ID,
          index: 0
        });

        status("Ready — press Play");

        // Give YouTube time to populate playlist metadata.
        setTimeout(updateInfo, 1500);
        setTimeout(updateInfo, 3000);
      },

      onStateChange: function (event) {
        if (event.data === YT.PlayerState.PLAYING) {
          clearTimeout(skipTimer);
          playBtn.textContent = "❚❚";
          status("LIVE — playing from YouTube");
          updateInfo();
        }

        if (event.data === YT.PlayerState.PAUSED) {
          clearTimeout(skipTimer);
          playBtn.textContent = "▶";
          status("Paused");
        }

        if (event.data === YT.PlayerState.BUFFERING) {
          status("Buffering…");
        }

        if (event.data === YT.PlayerState.CUED) {
          updateInfo();
          status("Ready — press Play");
        }

        if (event.data === YT.PlayerState.ENDED) {
          updateInfo();
          scheduleNext();
        }
      },

      onError: function () {
        status("Unavailable track — skipping…");
        scheduleNext();
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
  if (ready) advanceToNext();
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
