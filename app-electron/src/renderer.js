// Contrôles de fenêtre frameless
document.getElementById('btn-close')?.addEventListener('click', () => {
  if (window.electronAPI) window.electronAPI.close();
});

document.getElementById('btn-min')?.addEventListener('click', () => {
  if (window.electronAPI) window.electronAPI.minimize();
});

document.getElementById('btn-max')?.addEventListener('click', () => {
  if (window.electronAPI) window.electronAPI.maximize();
});

// Navigation interactive
const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(item => {
  item.addEventListener('click', () => {
    navItems.forEach(n => {
      n.classList.remove('active');
      const dot = n.querySelector('.nav-accent-dot');
      if (dot) dot.remove();
    });
    item.classList.add('active');
    const dot = document.createElement('div');
    dot.className = 'nav-accent-dot';
    item.appendChild(dot);
  });
});

// File d'attente sélectionnable
const queueItems = document.querySelectorAll('.queue-item');
queueItems.forEach(item => {
  item.addEventListener('click', () => {
    queueItems.forEach(q => {
      q.classList.remove('active');
      const chip = q.querySelector('.queue-status-chip');
      if (chip) {
        chip.className = 'queue-status-chip waiting';
        chip.textContent = 'En attente';
      }
    });
    item.classList.add('active');
    const chip = item.querySelector('.queue-status-chip');
    if (chip) {
      chip.className = 'queue-status-chip active';
      chip.textContent = 'En cours';
    }
  });
});
