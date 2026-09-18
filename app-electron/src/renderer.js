import { clinicData } from './data.js';

// État local de l'application
let currentActivePatientId = "Q1";
let agendaItems = [...clinicData.agenda];
let queueItems = [...clinicData.queue];

// Eléments DOM
const agendaContainer = document.getElementById('agenda-container');
const queueContainer = document.getElementById('queue-container');
const toastNotice = document.getElementById('toast-notice');
const toastMsg = document.getElementById('toast-msg');
const billingModal = document.getElementById('billing-modal');

// Afficher un Toast UI
function showToast(message) {
  toastMsg.textContent = message;
  toastNotice.classList.add('show');
  setTimeout(() => {
    toastNotice.classList.remove('show');
  }, 2200);
}

// 1. Contrôles de fenêtre frameless
document.getElementById('btn-close')?.addEventListener('click', () => {
  if (window.electronAPI) window.electronAPI.close();
  else showToast("Fermeture de l'application");
});

document.getElementById('btn-min')?.addEventListener('click', () => {
  if (window.electronAPI) window.electronAPI.minimize();
  else showToast("Fenêtre réduite");
});

document.getElementById('btn-max')?.addEventListener('click', () => {
  if (window.electronAPI) window.electronAPI.maximize();
  else showToast("Basculement plein écran");
});

// 2. Rendu dynamique de l'Agenda
function renderAgenda() {
  agendaContainer.innerHTML = '';
  agendaItems.forEach(item => {
    const itemEl = document.createElement('div');
    itemEl.className = 'agenda-item';
    itemEl.innerHTML = `
      <div class="agenda-marker ${item.status}"></div>
      <div class="agenda-content">
        <div class="agenda-top">
          <span class="agenda-time">${item.time}</span>
          ${item.alert ? `<span class="agenda-alert">${item.alert}</span>` : ''}
        </div>
        <span class="agenda-patient">${item.patient}</span>
        <span class="agenda-desc">${item.desc}</span>
      </div>
    `;
    agendaContainer.appendChild(itemEl);
  });
}

// 3. Rendu dynamique de la File d'attente
function renderQueue() {
  queueContainer.innerHTML = '';
  queueItems.forEach(item => {
    const isCurActive = item.id === currentActivePatientId;
    const itemEl = document.createElement('div');
    itemEl.className = `queue-item ${isCurActive ? 'active' : ''}`;
    itemEl.dataset.id = item.id;
    itemEl.innerHTML = `
      <div class="queue-left">
        <span class="queue-time-badge">${item.time}</span>
        <div class="queue-info">
          <span class="queue-patient">${item.patient}</span>
          <span class="queue-desc">${item.desc}</span>
        </div>
      </div>
      <span class="queue-status-chip ${item.status === 'in-progress' ? 'active' : 'waiting'}">
        ${item.statusLabel}
      </span>
    `;

    itemEl.addEventListener('click', () => {
      selectPatient(item.id);
    });

    queueContainer.appendChild(itemEl);
  });
}

// 4. Sélection d'un patient actif et mise à jour de la fiche
function selectPatient(patientId) {
  currentActivePatientId = patientId;
  const p = queueItems.find(x => x.id === patientId);
  if (!p) return;

  // Mettre à jour l'état de la liste
  queueItems.forEach(item => {
    if (item.id === patientId) {
      item.status = 'in-progress';
      item.statusLabel = 'En cours';
    } else if (item.status === 'in-progress') {
      item.status = 'waiting';
      item.statusLabel = 'En attente';
    }
  });

  // Mettre à jour la colonne 3
  document.getElementById('patient-ticket').textContent = p.ticket;
  
  // Initials
  const names = p.patient.split(' ');
  const initials = names.map(n => n[0]).join('').slice(0, 2);
  document.getElementById('patient-avatar-box').textContent = initials;
  
  document.getElementById('patient-name').textContent = p.patient;
  document.getElementById('patient-meta').textContent = `${p.age} ans · ${p.insurance}`;
  
  document.getElementById('vital-od').textContent = p.vitals.od;
  document.getElementById('vital-og').textContent = p.vitals.og;
  document.getElementById('vital-ta').textContent = p.vitals.tension;
  document.getElementById('vital-oct').textContent = p.vitals.oct;
  
  document.getElementById('billing-total').innerHTML = `${p.billing.formattedTotal} <span class="billing-cpam" id="billing-coverage">· ${p.billing.coverage}</span>`;
  document.getElementById('billing-patient-share').textContent = `Reste à charge patient : ${p.billing.patientShare}`;
  document.getElementById('btn-encaissement-text').textContent = `Encaisser ${p.billing.formattedTotal}`;

  renderQueue();
  showToast(`Dossier actif : ${p.patient} (${p.ticket})`);
}

// 5. Actions d'encaissement (FCFA)
const btnEncaissement = document.getElementById('btn-encaissement');
btnEncaissement?.addEventListener('click', () => {
  const p = queueItems.find(x => x.id === currentActivePatientId);
  if (!p) return;

  document.getElementById('modal-patient-subtitle').textContent = `${p.patient} · ${p.ticket}`;
  document.getElementById('modal-amount-gross').textContent = p.billing.formattedTotal;
  document.getElementById('modal-amount-net').textContent = p.billing.patientShare;
  billingModal.classList.add('open');
});

document.getElementById('btn-modal-cancel')?.addEventListener('click', () => {
  billingModal.classList.remove('open');
});

document.getElementById('btn-modal-confirm')?.addEventListener('click', () => {
  billingModal.classList.remove('open');
  const p = queueItems.find(x => x.id === currentActivePatientId);
  showToast(`Encaissement validé : ${p.billing.formattedTotal} reçu (FCFA) ✓`);
});

// 6. Prendre l'attente / Appeler le prochain
function callNextPatient() {
  const nextWaiting = queueItems.find(x => x.status === 'waiting');
  if (nextWaiting) {
    selectPatient(nextWaiting.id);
    showToast(`Prise en charge de : ${nextWaiting.patient}`);
  } else {
    showToast("Tous les patients de la file sont déjà pris en charge !");
  }
}

document.getElementById('btn-call-next')?.addEventListener('click', callNextPatient);
document.getElementById('btn-banner-attente')?.addEventListener('click', callNextPatient);

// 7. Vérifier le dossier
document.getElementById('btn-check-dossier')?.addEventListener('click', () => {
  const p = queueItems.find(x => x.id === currentActivePatientId);
  showToast(`Vérification dossier ${p.ticket} : documents & antécédents complets ✓`);
});

// 8. Navigation de la Sidebar
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
    
    const tabName = item.dataset.tab;
    showToast(`Section ouverte : ${tabName}`);
  });
});

// 9. Recherche de patient
const searchInput = document.getElementById('patient-search');
searchInput?.addEventListener('input', (e) => {
  const val = e.target.value.toLowerCase().trim();
  if (!val) {
    renderQueue();
    return;
  }
  
  const found = queueItems.find(p => p.patient.toLowerCase().includes(val));
  if (found) {
    selectPatient(found.id);
  }
});

// Initialisation
renderAgenda();
renderQueue();

// Auto-scaling dynamique pour adapter exactement l'affichage PC à la taille du Preview
function fitToWindow() {
  const wrapper = document.getElementById('scaler-wrapper');
  if (!wrapper) return;

  const targetWidth = 1360;
  const targetHeight = 880;

  const availableWidth = window.innerWidth;
  const availableHeight = window.innerHeight;

  // Calcul du facteur d'échelle exact pour afficher 100% de la vue PC
  const scaleX = availableWidth / targetWidth;
  const scaleY = availableHeight / targetHeight;
  const scale = Math.min(scaleX, scaleY);

  wrapper.style.transform = `scale(${scale})`;

  // Centrer dans la fenêtre si le ratio diffère
  const scaledWidth = targetWidth * scale;
  const scaledHeight = targetHeight * scale;
  const offsetX = Math.max(0, (availableWidth - scaledWidth) / 2);
  const offsetY = Math.max(0, (availableHeight - scaledHeight) / 2);

  wrapper.style.left = `${offsetX}px`;
  wrapper.style.top = `${offsetY}px`;
}

window.addEventListener('resize', fitToWindow);
window.addEventListener('DOMContentLoaded', fitToWindow);
setTimeout(fitToWindow, 100);
