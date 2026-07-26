try {
  var stored = localStorage.getItem('ttask-theme');
  if (stored) {
    var parsed = JSON.parse(stored);
    var theme = parsed && parsed.state && parsed.state.theme;
    if (theme === 'light' || theme === 'dark') {
      document.documentElement.dataset.theme = theme;
    }
  }
} catch {}
