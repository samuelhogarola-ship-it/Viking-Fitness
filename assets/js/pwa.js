(function () {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js?v=11').catch(() => {});
    });
  }

  const installButton = document.getElementById('installAppBtn');
  if (!installButton) return;

  let installPrompt = null;
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    installButton.hidden = false;
  });

  installButton.addEventListener('click', async () => {
    if (!installPrompt) return;
    installButton.hidden = true;
    installPrompt.prompt();
    await installPrompt.userChoice.catch(() => {});
    installPrompt = null;
  });

  window.addEventListener('appinstalled', () => {
    installButton.hidden = true;
    installPrompt = null;
  });
})();
