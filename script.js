const PLAYLIST_ID = "PLP8gZUHFGFVYLM5qkPlMivAiQ9LHvgI1M";
let player, ready=false, lastVolume=70;

const $ = id => document.getElementById(id);
$("year").textContent = new Date().getFullYear();

function setStatus(t){ $("playerStatus").textContent=t; }

function updateInfo(){
  if(!ready) return;
  const d=player.getVideoData()||{};
  const list=player.getPlaylist()||[];
  const i=player.getPlaylistIndex();
  if(d.title) $("trackTitle").textContent=d.title;
  $("trackArtist").textContent=`${d.author||"YouTube"}${list.length&&i>=0?` • Track ${i+1} of ${list.length}`:""}`;
}

function onYouTubeIframeAPIReady(){
  player = new YT.Player("player",{
    width:200,
    height:200,
    playerVars:{
      listType:"playlist",
      list:PLAYLIST_ID,
      autoplay:0,
      controls:0,
      playsinline:1,
      enablejsapi:1,
      origin:window.location.origin,
      loop:1
    },
    events:{
      onReady:()=>{
        ready=true;
        player.setVolume(70);
        player.cuePlaylist({listType:"playlist",list:PLAYLIST_ID,index:0,startSeconds:0});
        player.setLoop(true);
        setStatus("Ready — press Play");
      },
      onStateChange:e=>{
        if(e.data===YT.PlayerState.PLAYING){
          $("playBtn").textContent="❚❚";
          setStatus("LIVE");
          updateInfo();
        } else if(e.data===YT.PlayerState.PAUSED){
          $("playBtn").textContent="▶";
          setStatus("Paused");
        } else if(e.data===YT.PlayerState.BUFFERING){
          setStatus("Buffering…");
        } else if(e.data===YT.PlayerState.CUED){
          player.setLoop(true);
          updateInfo();
          setStatus("Ready — press Play");
        }
      },
      onError:e=>{
        setStatus(`YouTube error ${e.data} — skipping`);
        setTimeout(()=>{ if(ready) player.nextVideo(); },1000);
      }
    }
  });
}

$("playBtn").onclick=()=>{
  if(!ready){setStatus("Loading…");return;}
  player.getPlayerState()===YT.PlayerState.PLAYING?player.pauseVideo():player.playVideo();
};
$("nextBtn").onclick=()=>ready&&player.nextVideo();
$("prevBtn").onclick=()=>ready&&player.previousVideo();
$("volume").oninput=e=>{
  lastVolume=+e.target.value;
  if(ready){player.unMute();player.setVolume(lastVolume);}
};

const v=$("visualizer");
for(let i=0;i<24;i++){const b=document.createElement("i");b.style.height="20px";v.appendChild(b);}
setInterval(()=>{
  [...v.children].forEach(b=>b.style.height=(10+Math.random()*50)+"px");
  if(ready&&player.getPlayerState()===YT.PlayerState.PLAYING){
    updateInfo();
    const d=player.getDuration(),c=player.getCurrentTime();
    $("progressFill").style.width=d?Math.min(100,c/d*100)+"%":"0";
  }
},1000);
