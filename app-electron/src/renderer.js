import { clinicData } from './data.js';

// État local de l'application
let currentActivePatientId = "P001";
let agendaItems = [...clinicData.agenda];
let patientsList = [...clinicData.patients];

// Eléments DOM
const agendaContainer = document.getElementById('agenda-container');
const queueContainer = document.getElementById('queue-container');
const toastNotice = document.getElementById('toast-notice');
const toastMsg = document.getElementById('toast-msg');
const billingModal = document.getElementById('billing-modal');
const dossierModal = document.getElementById('patient-dossier-modal');

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
  patientsList.forEach(p => {
    const isCurActive = p.id === currentActivePatientId;
    const itemEl = document.createElement('div');
    itemEl.className = `queue-item ${isCurActive ? 'active' : ''}`;
    itemEl.dataset.id = p.id;
    const fullName = `${p.personalInfo.prenom} ${p.personalInfo.nom}`;
    itemEl.innerHTML = `
      <div class="queue-left">
        <span class="queue-time-badge">${p.medicalInfo.time}</span>
        <div class="queue-info">
          <span class="queue-patient">${fullName}</span>
          <span class="queue-desc">${p.medicalInfo.desc}</span>
        </div>
      </div>
      <span class="queue-status-chip ${p.medicalInfo.status === 'in-progress' ? 'active' : 'waiting'}">
        ${p.medicalInfo.statusLabel}
      </span>
    `;

    itemEl.addEventListener('click', () => {
      selectPatient(p.id);
    });

    queueContainer.appendChild(itemEl);
  });
}

// 4. Sélection d'un patient actif et mise à jour de la colonne 3
function selectPatient(patientId) {
  currentActivePatientId = patientId;
  const p = patientsList.find(x => x.id === patientId);
  if (!p) return;

  // Mettre à jour l'état de la liste
  patientsList.forEach(item => {
    if (item.id === patientId) {
      item.medicalInfo.status = 'in-progress';
      item.medicalInfo.statusLabel = 'En cours';
    } else if (item.medicalInfo.status === 'in-progress') {
      item.medicalInfo.status = 'waiting';
      item.medicalInfo.statusLabel = 'En attente';
    }
  });

  const fullName = `${p.personalInfo.prenom} ${p.personalInfo.nom}`;
  const initials = `${p.personalInfo.prenom[0]}${p.personalInfo.nom[0]}`;

  // Mettre à jour la colonne 3
  document.getElementById('patient-ticket').textContent = p.ticket;
  document.getElementById('patient-avatar-box').textContent = initials;
  document.getElementById('patient-name').textContent = fullName;
  document.getElementById('patient-meta').textContent = `${p.personalInfo.age} ans · ${p.personalInfo.nationalite} · ${p.insuranceInfo.assurance}`;
  
  document.getElementById('vital-od').textContent = p.medicalInfo.vitals.od;
  document.getElementById('vital-og').textContent = p.medicalInfo.vitals.og;
  document.getElementById('vital-ta').textContent = p.medicalInfo.vitals.tension;
  document.getElementById('vital-oct').textContent = p.medicalInfo.vitals.oct;
  
  document.getElementById('billing-total').innerHTML = `${p.billing.formattedTotal} <span class="billing-cpam" id="billing-coverage">· ${p.billing.coverage}</span>`;
  document.getElementById('billing-patient-share').textContent = `Reste à charge patient : ${p.billing.patientShare}`;
  document.getElementById('btn-encaissement-text').textContent = `Encaisser ${p.billing.formattedTotal}`;

  renderQueue();
  showToast(`Dossier actif : ${fullName} (${p.ref})`);
}

// 5. Modal Dossier Patient Complet (Infos perso + Assurance)
function openPatientDossierModal() {
  const p = patientsList.find(x => x.id === currentActivePatientId);
  if (!p) return;

  const initials = `${p.personalInfo.prenom[0]}${p.personalInfo.nom[0]}`;
  const fullName = `${p.personalInfo.nom} ${p.personalInfo.prenom}`;

  document.getElementById('modal-full-avatar').textContent = initials;
  document.getElementById('modal-full-name').textContent = fullName;
  document.getElementById('modal-full-ref').textContent = p.ref;
  document.getElementById('modal-full-sub').textContent = `Patient ${p.personalInfo.nationalite} · ${p.personalInfo.profession} · Dossier Ophtalmo`;

  // Section 1 : Infos Personnelles
  document.getElementById('modal-field-ref').textContent = p.ref;
  document.getElementById('modal-field-fullname').textContent = fullName;
  document.getElementById('modal-field-sexe-age').textContent = `${p.personalInfo.sexe} · ${p.personalInfo.age} ans`;
  document.getElementById('modal-field-nationalite').textContent = `🇲🇱 ${p.personalInfo.nationalite}`;
  document.getElementById('modal-field-profession').textContent = p.personalInfo.profession;
  document.getElementById('modal-field-tel').textContent = p.personalInfo.telephone;
  document.getElementById('modal-field-email').textContent = p.personalInfo.email;
  document.getElementById('modal-field-adresse').textContent = p.personalInfo.adresse;

  // Section 2 : Assurance
  document.getElementById('modal-field-assurance').textContent = p.insuranceInfo.assurance;
  document.getElementById('modal-field-societe').textContent = p.insuranceInfo.societe;
  document.getElementById('modal-field-numass').textContent = p.insuranceInfo.numAss;
  document.getElementById('modal-field-valiass').textContent = `${p.insuranceInfo.dateValiAss} (En cours de validité)`;

  dossierModal.classList.add('open');
}

function closePatientDossierModal() {
  dossierModal.classList.remove('open');
}

document.getElementById('btn-check-dossier')?.addEventListener('click', openPatientDossierModal);
document.getElementById('patient-avatar-box')?.addEventListener('click', openPatientDossierModal);
document.getElementById('btn-close-dossier-modal')?.addEventListener('click', closePatientDossierModal);
document.getElementById('btn-close-dossier-bottom')?.addEventListener('click', closePatientDossierModal);
document.getElementById('btn-imprimer-fiche')?.addEventListener('click', () => {
  showToast("Impression de la fiche patient envoyée à l'imprimante clinique ✓");
  closePatientDossierModal();
});

// 6. Actions d'encaissement (FCFA)
const btnEncaissement = document.getElementById('btn-encaissement');
btnEncaissement?.addEventListener('click', () => {
  const p = patientsList.find(x => x.id === currentActivePatientId);
  if (!p) return;

  const fullName = `${p.personalInfo.prenom} ${p.personalInfo.nom}`;
  document.getElementById('modal-patient-subtitle').textContent = `${fullName} · ${p.ticket} (${p.insuranceInfo.assurance})`;
  document.getElementById('modal-amount-gross').textContent = p.billing.formattedTotal;
  document.getElementById('modal-amount-ins').textContent = `- ${p.billing.insuranceShare}`;
  document.getElementById('modal-amount-net').textContent = p.billing.patientShare;
  billingModal.classList.add('open');
});

document.getElementById('btn-modal-cancel')?.addEventListener('click', () => {
  billingModal.classList.remove('open');
});

document.getElementById('btn-modal-confirm')?.addEventListener('click', () => {
  billingModal.classList.remove('open');
  const p = patientsList.find(x => x.id === currentActivePatientId);
  showToast(`Encaissement validé : ${p.billing.formattedTotal} reçu pour ${p.personalInfo.nom} ✓`);
});

// 7. Prendre l'attente / Appeler le prochain
function callNextPatient() {
  const nextWaiting = patientsList.find(x => x.medicalInfo.status === 'waiting');
  if (nextWaiting) {
    selectPatient(nextWaiting.id);
    showToast(`Prise en charge de : ${nextWaiting.personalInfo.prenom} ${nextWaiting.personalInfo.nom}`);
  } else {
    showToast("Tous les patients de la file sont déjà pris en charge !");
  }
}

document.getElementById('btn-call-next')?.addEventListener('click', callNextPatient);
document.getElementById('btn-banner-attente')?.addEventListener('click', callNextPatient);

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
    if (tabName === 'Patients') {
      openPatientDossierModal();
    } else {
      showToast(`Section ouverte : ${tabName}`);
    }
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
  
  const found = patientsList.find(p => 
    p.personalInfo.nom.toLowerCase().includes(val) || 
    p.personalInfo.prenom.toLowerCase().includes(val) ||
    p.ref.toLowerCase().includes(val)
  );
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

  const scaleX = availableWidth / targetWidth;
  const scaleY = availableHeight / targetHeight;
  const scale = Math.min(scaleX, scaleY);

  wrapper.style.transform = `scale(${scale})`;

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
