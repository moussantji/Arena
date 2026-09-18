import { clinicData } from './data.js';

// État local de l'application
let currentActivePatientId = "P001";
let currentView = "Réception"; // "Réception" ou "Patients"
let agendaItems = [...clinicData.agenda];
let patientsList = [...clinicData.patients];

// Eléments DOM
const agendaContainer = document.getElementById('agenda-container');
const queueContainer = document.getElementById('queue-container');
const patientsTableBody = document.getElementById('patients-table-body');
const toastNotice = document.getElementById('toast-notice');
const toastMsg = document.getElementById('toast-msg');
const billingModal = document.getElementById('billing-modal');
const dossierModal = document.getElementById('patient-dossier-modal');
const createModal = document.getElementById('create-patient-modal');

// Vues
const viewReception = document.getElementById('view-reception');
const viewPatients = document.getElementById('view-patients');
const viewTitle = document.getElementById('view-title');
const viewDate = document.getElementById('view-date');

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

// 2. Basculement des Vues (Réception vs Patients)
function switchView(tabName) {
  currentView = tabName;

  // Mise à jour de la sidebar
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    const dot = item.querySelector('.nav-accent-dot');
    if (dot) dot.remove();

    if (item.dataset.tab === tabName) {
      item.classList.add('active');
      const d = document.createElement('div');
      d.className = 'nav-accent-dot';
      item.appendChild(d);
    }
  });

  if (tabName === 'Patients') {
    viewReception.style.display = 'none';
    viewPatients.style.display = 'flex';
    viewTitle.textContent = "Gestion des Patients";
    viewDate.textContent = `Répertoire clinique — ${patientsList.length} patients enregistrés`;
    renderPatientsTable();
    showToast("Répertoire des patients ouvert");
  } else if (tabName === 'Réception') {
    viewPatients.style.display = 'none';
    viewReception.style.display = 'block';
    viewTitle.textContent = "Pilotage";
    viewDate.textContent = "Réception · Vendredi 18 septembre 2026";
    renderQueue();
    renderAgenda();
    showToast("Tableau de bord Réception ouvert");
  } else {
    showToast(`Section : ${tabName}`);
  }
}

// 3. Rendu dynamique de l'Agenda
function renderAgenda() {
  if (!agendaContainer) return;
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

// 4. Rendu dynamique de la File d'attente
function renderQueue() {
  if (!queueContainer) return;
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

// 5. Rendu du Tableau Gestion des Patients
function renderPatientsTable(filterText = "", filterAss = "", filterSex = "") {
  if (!patientsTableBody) return;
  patientsTableBody.innerHTML = '';

  const filtered = patientsList.filter(p => {
    const q = filterText.toLowerCase();
    const matchText = !q || 
      p.ref.toLowerCase().includes(q) || 
      p.personalInfo.nom.toLowerCase().includes(q) || 
      p.personalInfo.prenom.toLowerCase().includes(q) || 
      p.personalInfo.telephone.toLowerCase().includes(q) ||
      p.personalInfo.adresse.toLowerCase().includes(q);

    const matchAss = !filterAss || p.insuranceInfo.assurance === filterAss;
    const matchSex = !filterSex || p.personalInfo.sexe === filterSex;

    return matchText && matchAss && matchSex;
  });

  if (filtered.length === 0) {
    patientsTableBody.innerHTML = `
      <div style="padding: 30px; text-align: center; color: var(--oc-text-3); font-size: 12px; font-weight: 700;">
        Aucun patient ne correspond à votre recherche.
      </div>
    `;
    return;
  }

  filtered.forEach(p => {
    const row = document.createElement('div');
    row.className = 'patient-row';
    const fullName = `${p.personalInfo.prenom} ${p.personalInfo.nom}`;
    const initials = `${p.personalInfo.prenom[0]}${p.personalInfo.nom[0]}`;

    row.innerHTML = `
      <span class="p-col-ref">${p.ref}</span>
      <div class="p-col-name">
        <div class="p-avatar-sm">${initials}</div>
        <div class="p-name-block">
          <span class="p-name-main">${fullName}</span>
          <span class="p-name-sub">${p.personalInfo.profession}</span>
        </div>
      </div>
      <span class="p-col-sexe">${p.personalInfo.sexe.slice(0, 1)} · ${p.personalInfo.age} ans</span>
      <span class="p-col-tel">${p.personalInfo.telephone}</span>
      <span class="p-col-addr" title="${p.personalInfo.adresse}">${p.personalInfo.adresse}</span>
      <div class="p-col-ass">
        <span class="p-ass-badge">${p.insuranceInfo.assurance}</span>
        <span class="p-ass-num">${p.insuranceInfo.numAss}</span>
      </div>
      <span class="p-col-nat">🇲🇱 ${p.personalInfo.nationalite}</span>
      <div class="p-col-actions">
        <button class="p-btn-action" data-action="view" data-id="${p.id}">Dossier</button>
      </div>
    `;

    row.addEventListener('click', (e) => {
      openPatientDossierModal(p.id);
    });

    patientsTableBody.appendChild(row);
  });
}

// 6. Sélection d'un patient actif (Accueil / Réception)
function selectPatient(patientId) {
  currentActivePatientId = patientId;
  const p = patientsList.find(x => x.id === patientId);
  if (!p) return;

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

// 7. Modal Fiche Patient Complète
function openPatientDossierModal(patientId = null) {
  const p = patientsList.find(x => x.id === (patientId || currentActivePatientId));
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

document.getElementById('btn-check-dossier')?.addEventListener('click', () => openPatientDossierModal());
document.getElementById('patient-avatar-box')?.addEventListener('click', () => openPatientDossierModal());
document.getElementById('btn-close-dossier-modal')?.addEventListener('click', closePatientDossierModal);
document.getElementById('btn-close-dossier-bottom')?.addEventListener('click', closePatientDossierModal);
document.getElementById('btn-imprimer-fiche')?.addEventListener('click', () => {
  showToast("Impression fiche patient envoyée à l'imprimante ✓");
  closePatientDossierModal();
});

// 8. Modal Nouveau Patient
document.getElementById('btn-open-create-patient')?.addEventListener('click', () => {
  createModal.classList.add('open');
});

document.getElementById('btn-close-create-modal')?.addEventListener('click', () => {
  createModal.classList.remove('open');
});

document.getElementById('btn-cancel-create')?.addEventListener('click', () => {
  createModal.classList.remove('open');
});

document.getElementById('create-patient-form')?.addEventListener('submit', (e) => {
  e.preventDefault();

  const count = patientsList.length + 1;
  const newRef = `CLI-ML-2026-${String(840 + count).padStart(4, '0')}`;
  const newTicket = `N° ${String(840 + count).padStart(4, '0')}`;

  const newPatient = {
    id: `P${String(count).padStart(3, '0')}`,
    ref: newRef,
    ticket: newTicket,
    personalInfo: {
      nom: document.getElementById('f-nom').value.trim().toUpperCase(),
      prenom: document.getElementById('f-prenom').value.trim(),
      sexe: document.getElementById('f-sexe').value,
      age: parseInt(document.getElementById('f-age').value) || 30,
      telephone: document.getElementById('f-tel').value.trim(),
      email: document.getElementById('f-email').value.trim() || "Non renseigné",
      nationalite: document.getElementById('f-nationalite').value.trim() || "Malienne",
      profession: document.getElementById('f-profession').value.trim() || "Particulier",
      adresse: document.getElementById('f-adresse').value.trim()
    },
    insuranceInfo: {
      assurance: document.getElementById('f-assurance').value.trim() || "Direct comptant",
      societe: document.getElementById('f-societe').value.trim() || "N/A",
      dateValiAss: document.getElementById('f-valiass').value.trim() || "31/12/2026",
      numAss: document.getElementById('f-numass').value.trim() || "N/A"
    },
    medicalInfo: {
      time: "10:30",
      desc: "Première consultation",
      status: "waiting",
      statusLabel: "En attente",
      vitals: { od: "10/10", og: "10/10", tension: "14/14 mmHg", oct: "À planifier" }
    },
    billing: {
      total: 35000,
      formattedTotal: "35 000 FCFA",
      coverage: "Direct patient",
      patientShare: "35 000 FCFA",
      insuranceShare: "0 FCFA"
    }
  };

  patientsList.unshift(newPatient);
  createModal.classList.remove('open');
  e.target.reset();

  renderPatientsTable();
  renderQueue();
  selectPatient(newPatient.id);
  showToast(`Patient ${newPatient.personalInfo.prenom} ${newPatient.personalInfo.nom} créé avec succès ! ✓`);
});

// 9. Filtres vue Patients
document.getElementById('patients-view-search')?.addEventListener('input', (e) => {
  const fText = e.target.value;
  const fAss = document.getElementById('filter-assurance').value;
  const fSex = document.getElementById('filter-sexe').value;
  renderPatientsTable(fText, fAss, fSex);
});

document.getElementById('filter-assurance')?.addEventListener('change', (e) => {
  const fText = document.getElementById('patients-view-search').value;
  const fAss = e.target.value;
  const fSex = document.getElementById('filter-sexe').value;
  renderPatientsTable(fText, fAss, fSex);
});

document.getElementById('filter-sexe')?.addEventListener('change', (e) => {
  const fText = document.getElementById('patients-view-search').value;
  const fAss = document.getElementById('filter-assurance').value;
  const fSex = e.target.value;
  renderPatientsTable(fText, fAss, fSex);
});

// 10. Actions d'encaissement (FCFA)
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

// 11. Prendre l'attente / Appeler le prochain
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

// 12. Navigation de la Sidebar (Changement d'onglets)
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    const tabName = item.dataset.tab;
    switchView(tabName);
  });
});

// 13. Recherche de patient en Topbar
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

// Initialisation au chargement
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
