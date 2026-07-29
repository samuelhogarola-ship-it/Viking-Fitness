/* ============================================================
   VIKING FITNESS — Audio: YouTube background music
   Uses YouTube IFrame API for ambient Viking music.
   ============================================================ */
window.VFAudio = (function () {
  let player = null;
  let running = false;
  let apiReady = false;
  let pendingStart = null;

  function loadAPI() {
    if (document.getElementById('yt-api')) return;
    const tag = document.createElement('script');
    tag.id = 'yt-api';
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  }

  window.onYouTubeIframeAPIReady = function () {
    apiReady = true;
    if (pendingStart) {
      pendingStart();
      pendingStart = null;
    }
  };

  function createPlayer(withFanfare) {
    const div = document.createElement('div');
    div.id = 'yt-player';
    div.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;bottom:0;left:0;';
    document.body.appendChild(div);

    player = new YT.Player('yt-player', {
      videoId: 'tG7fk_DUz5g',
      playerVars: {
        autoplay: 1,
        loop: 1,
        playlist: 'tG7fk_DUz5g',
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0
      },
      events: {
        onReady: function (e) {
          e.target.setVolume(50);
          e.target.playVideo();
          running = true;
        },
        onStateChange: function (e) {
          if (e.data === YT.PlayerState.ENDED) {
            e.target.playVideo();
          }
        }
      }
    });
  }

  function start(withFanfare) {
    loadAPI();
    if (apiReady) {
      if (!player) createPlayer(withFanfare);
      else { player.playVideo(); running = true; }
    } else {
      pendingStart = function () { createPlayer(withFanfare); };
    }
  }

  function mute() {
    if (player && player.pauseVideo) player.pauseVideo();
  }

  function unmute() {
    if (!player) { start(false); return; }
    if (player.unMute) player.unMute();
    if (player.playVideo) player.playVideo();
    running = true;
  }

  function strike() {}

  return {
    start: start,
    mute: mute,
    unmute: unmute,
    strike: strike,
    get running() { return running; }
  };
})();
