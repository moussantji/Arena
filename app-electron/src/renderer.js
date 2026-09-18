// Récupérer les données depuis window.clinicData
const clinicData = window.clinicData;

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
  if (!toastNotice || !toastMsg) return;
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
window.switchView = function switchView(tabName) {
  currentView = tabName;

  // Mise à jour visuelle des onglets de la sidebar
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    const dot = item.querySelector('.nav-accent-dot');
    if (dot) dot.remove();

    if (item.getAttribute('data-tab') === tabName) {
      item.classList.add('active');
      const d = document.createElement('div');
      d.className = 'nav-accent-dot';
      item.appendChild(d);
    }
  });

  if (tabName === 'Patients') {
    if (viewReception) viewReception.style.display = 'none';
    if (viewPatients) viewPatients.style.display = 'flex';
    if (viewTitle) viewTitle.textContent = "Gestion des Patients";
    if (viewDate) viewDate.textContent = `Répertoire clinique — ${patientsList.length} patients enregistrés`;
    renderPatientsTable();
    showToast("Répertoire des patients ouvert ✓");
  } else if (tabName === 'Réception') {
    if (viewPatients) viewPatients.style.display = 'none';
    if (viewReception) viewReception.style.display = 'block';
    if (viewTitle) viewTitle.textContent = "Pilotage";
    if (viewDate) viewDate.textContent = "Réception · Vendredi 18 septembre 2026";
    renderQueue();
    renderAgenda();
    showToast("Tableau de bord Réception ouvert ✓");
  } else {
    showToast(`Section : ${tabName}`);
  }
};

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

// 5. Rendu du Tableau Gestion des Patients (clic direct sur la ligne pour ouvrir la fiche)
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
    `;

    // Clic n'importe où sur le patient pour ouvrir sa fiche détaillée
    row.addEventListener('click', () => {
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

  const elTicket = document.getElementById('patient-ticket');
  const elAvatar = document.getElementById('patient-avatar-box');
  const elName = document.getElementById('patient-name');
  const elMeta = document.getElementById('patient-meta');

  if (elTicket) elTicket.textContent = p.ticket;
  if (elAvatar) elAvatar.textContent = initials;
  if (elName) elName.textContent = fullName;
  if (elMeta) elMeta.textContent = `${p.personalInfo.age} ans · ${p.personalInfo.nationalite} · ${p.insuranceInfo.assurance}`;
  
  const elOd = document.getElementById('vital-od');
  const elOg = document.getElementById('vital-og');
  const elTa = document.getElementById('vital-ta');
  const elOct = document.getElementById('vital-oct');

  if (elOd) elOd.textContent = p.medicalInfo.vitals.od;
  if (elOg) elOg.textContent = p.medicalInfo.vitals.og;
  if (elTa) elTa.textContent = p.medicalInfo.vitals.tension;
  if (elOct) elOct.textContent = p.medicalInfo.vitals.oct;
  
  const elTotal = document.getElementById('billing-total');
  const elShare = document.getElementById('billing-patient-share');
  const elBtnText = document.getElementById('btn-encaissement-text');

  if (elTotal) elTotal.innerHTML = `${p.billing.formattedTotal} <span class="billing-cpam" id="billing-coverage">· ${p.billing.coverage}</span>`;
  if (elShare) elShare.textContent = `Reste à charge patient : ${p.billing.patientShare}`;
  if (elBtnText) elBtnText.textContent = `Encaisser ${p.billing.formattedTotal}`;

  renderQueue();
  showToast(`Dossier actif : ${fullName} (${p.ref})`);
}

// 7. Modal Fiche Patient Complète (Sortie via la croix ✕ uniquement)
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

  // Bouton Modifier ce dossier
  const btnEditFromDossier = document.getElementById('btn-edit-from-dossier');
  if (btnEditFromDossier) {
    btnEditFromDossier.onclick = () => {
      closePatientDossierModal();
      openEditPatientModal(p.id);
    };
  }

  if (dossierModal) dossierModal.classList.add('open');
}

function closePatientDossierModal() {
  if (dossierModal) dossierModal.classList.remove('open');
}

// Clics pour ouvrir la fiche
document.getElementById('btn-check-dossier')?.addEventListener('click', () => openPatientDossierModal());
document.getElementById('patient-avatar-box')?.addEventListener('click', () => openPatientDossierModal());

// Sortie via la croix ✕
document.getElementById('btn-close-dossier-modal')?.addEventListener('click', closePatientDossierModal);

// Bouton Imprimer
document.getElementById('btn-imprimer-fiche')?.addEventListener('click', () => {
  showToast("Impression de la fiche patient envoyée à l'imprimante ✓");
  closePatientDossierModal();
});

// 8. Modal Nouveau Patient & Modification
document.getElementById('btn-open-create-patient')?.addEventListener('click', () => {
  openCreatePatientModal();
});

function openCreatePatientModal() {
  document.getElementById('f-edit-id').value = '';
  document.getElementById('modal-form-title').textContent = "Nouveau Dossier Patient";
  document.getElementById('btn-submit-patient-form').textContent = "Enregistrer le Patient";
  document.getElementById('create-patient-form').reset();
  document.getElementById('f-nationalite').value = "Malienne";
  if (createModal) createModal.classList.add('open');
}

function openEditPatientModal(patientId) {
  const p = patientsList.find(x => x.id === patientId);
  if (!p) return;

  document.getElementById('f-edit-id').value = p.id;
  document.getElementById('modal-form-title').textContent = `Modifier : ${p.personalInfo.prenom} ${p.personalInfo.nom}`;
  document.getElementById('btn-submit-patient-form').textContent = "Mettre à jour le dossier";

  document.getElementById('f-nom').value = p.personalInfo.nom;
  document.getElementById('f-prenom').value = p.personalInfo.prenom;
  document.getElementById('f-sexe').value = p.personalInfo.sexe;
  document.getElementById('f-age').value = p.personalInfo.age;
  document.getElementById('f-tel').value = p.personalInfo.telephone;
  document.getElementById('f-email').value = p.personalInfo.email;
  document.getElementById('f-nationalite').value = p.personalInfo.nationalite;
  document.getElementById('f-profession').value = p.personalInfo.profession;
  document.getElementById('f-adresse').value = p.personalInfo.adresse;

  document.getElementById('f-assurance').value = p.insuranceInfo.assurance;
  document.getElementById('f-societe').value = p.insuranceInfo.societe;
  document.getElementById('f-numass').value = p.insuranceInfo.numAss;
  document.getElementById('f-valiass').value = p.insuranceInfo.dateValiAss;

  if (createModal) createModal.classList.add('open');
}

document.getElementById('btn-close-create-modal')?.addEventListener('click', () => {
  if (createModal) createModal.classList.remove('open');
});

document.getElementById('btn-cancel-create')?.addEventListener('click', () => {
  if (createModal) createModal.classList.remove('open');
});

// Soumission du Formulaire (Création OU Modification)
document.getElementById('create-patient-form')?.addEventListener('submit', (e) => {
  e.preventDefault();

  const editId = document.getElementById('f-edit-id').value;

  if (editId) {
    // Mode MODIFICATION
    const p = patientsList.find(x => x.id === editId);
    if (p) {
      p.personalInfo.nom = document.getElementById('f-nom').value.trim().toUpperCase();
      p.personalInfo.prenom = document.getElementById('f-prenom').value.trim();
      p.personalInfo.sexe = document.getElementById('f-sexe').value;
      p.personalInfo.age = parseInt(document.getElementById('f-age').value) || p.personalInfo.age;
      p.personalInfo.telephone = document.getElementById('f-tel').value.trim();
      p.personalInfo.email = document.getElementById('f-email').value.trim() || "Non renseigné";
      p.personalInfo.nationalite = document.getElementById('f-nationalite').value.trim() || "Malienne";
      p.personalInfo.profession = document.getElementById('f-profession').value.trim() || "Particulier";
      p.personalInfo.adresse = document.getElementById('f-adresse').value.trim();

      p.insuranceInfo.assurance = document.getElementById('f-assurance').value.trim() || "Direct comptant";
      p.insuranceInfo.societe = document.getElementById('f-societe').value.trim() || "N/A";
      p.insuranceInfo.dateValiAss = document.getElementById('f-valiass').value.trim() || "31/12/2026";
      p.insuranceInfo.numAss = document.getElementById('f-numass').value.trim() || "N/A";

      if (createModal) createModal.classList.remove('open');
      renderPatientsTable();
      renderQueue();
      if (currentActivePatientId === p.id) selectPatient(p.id);
      showToast(`Dossier de ${p.personalInfo.prenom} ${p.personalInfo.nom} mis à jour avec succès ! ✓`);
    }
  } else {
    // Mode CRÉATION
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
    if (createModal) createModal.classList.remove('open');
    e.target.reset();

    renderPatientsTable();
    renderQueue();
    selectPatient(newPatient.id);
    showToast(`Patient ${newPatient.personalInfo.prenom} ${newPatient.personalInfo.nom} créé avec succès ! ✓`);
  }
});

// 9. Filtres vue Patients
document.getElementById('patients-view-search')?.addEventListener('input', (e) => {
  const fText = e.target.value;
  const fAss = document.getElementById('filter-assurance')?.value || "";
  const fSex = document.getElementById('filter-sexe')?.value || "";
  renderPatientsTable(fText, fAss, fSex);
});

document.getElementById('filter-assurance')?.addEventListener('change', (e) => {
  const fText = document.getElementById('patients-view-search')?.value || "";
  const fAss = e.target.value;
  const fSex = document.getElementById('filter-sexe')?.value || "";
  renderPatientsTable(fText, fAss, fSex);
});

document.getElementById('filter-sexe')?.addEventListener('change', (e) => {
  const fText = document.getElementById('patients-view-search')?.value || "";
  const fAss = document.getElementById('filter-assurance')?.value || "";
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
  if (billingModal) billingModal.classList.add('open');
});

document.getElementById('btn-modal-cancel')?.addEventListener('click', () => {
  if (billingModal) billingModal.classList.remove('open');
});

document.getElementById('btn-modal-confirm')?.addEventListener('click', () => {
  if (billingModal) billingModal.classList.remove('open');
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

// 12. Écouteurs de clics directs et délégués sur la sidebar
document.querySelectorAll('.nav-item').forEach(item => {
  item.onclick = function(e) {
    e.preventDefault();
    const tab = this.getAttribute('data-tab');
    if (tab) window.switchView(tab);
  };
});

document.addEventListener('click', (e) => {
  const item = e.target.closest('.nav-item');
  if (item) {
    e.preventDefault();
    const tab = item.getAttribute('data-tab');
    if (tab) window.switchView(tab);
  }
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

// 14. Auto-scaling bidirectionnel exact pour le Preview Arena
function fitToWindow() {
  const wrapper = document.getElementById('scaler-wrapper');
  if (!wrapper) return;

  const targetWidth = 1360;
  const targetHeight = 880;

  const availableWidth = window.innerWidth || document.documentElement.clientWidth;
  const availableHeight = window.innerHeight || document.documentElement.clientHeight;

  if (!availableWidth || !availableHeight) return;

  // Si l'écran est plus grand que 1360x880, ne pas grossir excessivement (max 1.05)
  // Si l'écran est plus petit (ex: iframe preview ~800-1100px), réduire proportionnellement pour que TOUT tienne sans coupure
  const scaleX = availableWidth / targetWidth;
  const scaleY = availableHeight / targetHeight;
  const scale = Math.min(scaleX, scaleY);

  wrapper.style.transformOrigin = 'top center';
  wrapper.style.transform = `scale(${scale})`;

  const scaledWidth = targetWidth * scale;
  const scaledHeight = targetHeight * scale;

  const offsetX = Math.max(0, (availableWidth - scaledWidth) / 2);
  const offsetY = Math.max(0, (availableHeight - scaledHeight) / 2);

  wrapper.style.position = 'absolute';
  wrapper.style.left = `${offsetX}px`;
  wrapper.style.top = `${offsetY}px`;

  document.body.style.margin = '0';
  document.body.style.padding = '0';
  document.body.style.overflow = 'hidden';
  document.body.style.backgroundColor = '#0A0E17';
}

window.addEventListener('resize', fitToWindow);
window.addEventListener('DOMContentLoaded', fitToWindow);
window.addEventListener('load', fitToWindow);
fitToWindow();
setInterval(fitToWindow, 1000);

// 15. Exportation en Excel (Format CSV UTF-8 avec BOM compatible Excel / Calc)
document.getElementById('btn-export-excel')?.addEventListener('click', () => {
  if (!patientsList || patientsList.length === 0) {
    showToast("Aucun patient à exporter !");
    return;
  }

  // En-têtes du tableau Excel
  const headers = [
    "Référence",
    "Nom",
    "Prénom",
    "Sexe",
    "Âge",
    "Téléphone",
    "Email",
    "Nationalité",
    "Profession",
    "Adresse",
    "Assurance",
    "Société",
    "N° Assuré",
    "Validité Assurance",
    "Constantes OD",
    "Constantes OG",
    "Tension Oculaire",
    "OCT",
    "Total Actes (FCFA)",
    "Part Assurance (FCFA)",
    "Reste à charge Patient (FCFA)"
  ];

  // Construction des lignes
  const rows = patientsList.map(p => [
    `"${p.ref}"`,
    `"${p.personalInfo.nom}"`,
    `"${p.personalInfo.prenom}"`,
    `"${p.personalInfo.sexe}"`,
    `"${p.personalInfo.age}"`,
    `"${p.personalInfo.telephone}"`,
    `"${p.personalInfo.email}"`,
    `"${p.personalInfo.nationalite}"`,
    `"${p.personalInfo.profession}"`,
    `"${p.personalInfo.adresse}"`,
    `"${p.insuranceInfo.assurance}"`,
    `"${p.insuranceInfo.societe}"`,
    `"${p.insuranceInfo.numAss}"`,
    `"${p.insuranceInfo.dateValiAss}"`,
    `"${p.medicalInfo.vitals.od}"`,
    `"${p.medicalInfo.vitals.og}"`,
    `"${p.medicalInfo.vitals.tension}"`,
    `"${p.medicalInfo.vitals.oct}"`,
    `"${p.billing.total}"`,
    `"${p.billing.insuranceShare}"`,
    `"${p.billing.patientShare}"`
  ]);

  // Assemblage avec point-virgule (séparateur standard Excel francophone) et BOM UTF-8
  const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(r => r.join(";"))].join("\r\n");

  // Déclenchement du téléchargement
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  link.setAttribute("href", url);
  link.setAttribute("download", `oculis_patients_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast(`Export Excel réussi : ${patientsList.length} patients exportés ✓`);
});
