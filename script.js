const PLAYLIST_ID = "PLP8gZUHFGFVYLM5qkPlMivAiQ9LHvgI1M";

let player, ready = false, lastVolume = 70;
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
  if (data?.title) titleEl.textContent = data.title;
  artistEl.textContent = `${data?.author || "YouTube"}${list.length ? ` • Track ${index + 1} of ${list.length}` : ""}`;
}

function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    height: "1", width: "1",
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
        player.setVolume(70);
        player.cuePlaylist({ listType: "playlist", list: PLAYLIST_ID, index: 0 });
        status("Ready — press Play");
      },
      onStateChange: e => {
        if (e.data === YT.PlayerState.PLAYING) {
          playBtn.textContent = "❚❚";
          status("LIVE — playing from YouTube");
          updateInfo();
        } else if (e.data === YT.PlayerState.PAUSED) {
          playBtn.textContent = "▶";
          status("Paused");
        } else if (e.data === YT.PlayerState.BUFFERING) {
          status("Buffering…");
        } else if (e.data === YT.PlayerState.CUED) {
          updateInfo();
          status("Ready — press Play");
        }
        // No ENDED handler: YouTube handles playlist progression itself.
      },
      onError: () => {
        status("Unavailable video — skipping…");
        setTimeout(() => { if (ready) player.nextVideo(); }, 800);
      }
    }
  });
}

playBtn.addEventListener("click", () => {
  if (!ready) return status("Loading player…");
  if (player.getPlayerState() === YT.PlayerState.PLAYING) player.pauseVideo();
  else player.playVideo();
});

document.getElementById("nextBtn").addEventListener("click", () => ready && player.nextVideo());
document.getElementById("prevBtn").addEventListener("click", () => ready && player.previousVideo());
document.getElementById("liveBtn").addEventListener("click", () => ready && player.playVideo());

volumeEl.addEventListener("input", e => {
  if (!ready) return;
  lastVolume = +e.target.value;
  player.setVolume(lastVolume);
  if (lastVolume > 0) player.unMute();
});

document.getElementById("muteBtn").addEventListener("click", () => {
  if (!ready) return;
  if (player.isMuted()) { player.unMute(); player.setVolume(lastVolume || 70); }
  else { lastVolume = player.getVolume(); player.mute(); }
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
  [...visualizer.children].forEach(b => b.style.height = (10 + Math.random() * 60) + "px");
  if (ready && player.getPlayerState() === YT.PlayerState.PLAYING) {
    const d = player.getDuration(), c = player.getCurrentTime();
    if (d) progressFill.style.width = Math.min(100, c / d * 100) + "%";
    updateInfo();
  }
}, 1000);
