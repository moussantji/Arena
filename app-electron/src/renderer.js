function safeEscape(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
// Récupérer les données depuis window.clinicData
const clinicData = window.clinicData;

// État local de l'application
let currentActivePatientId = "P001";
let currentView = "Tableau de bord"; // "Réception" ou "Patients"
let agendaItems = [...clinicData.agenda];
let patientsList = [...clinicData.patients];
let consultationsList = window.clinicConsultations ? [...window.clinicConsultations] : [];
let appointmentsList = window.clinicAppointments ? [...window.clinicAppointments] : [];
let octList = window.clinicOctExams ? [...window.clinicOctExams] : [];
let invoicesList = window.clinicInvoices ? [...window.clinicInvoices] : [];
let inventoryList = window.clinicInventory ? [...window.clinicInventory] : [];

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
const viewConsultations = document.getElementById('view-consultations');
const viewRendezvous = document.getElementById('view-rendezvous');
const viewImagerieOct = document.getElementById('view-imagerie-oct');
const viewFacturation = document.getElementById('view-facturation');
const viewStock = document.getElementById('view-stock');
const viewStatistiques = document.getElementById('view-statistiques');
const viewParametres = document.getElementById('view-parametres');
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

  // Masquer toutes les vues d'abord
  if (viewReception) viewReception.style.display = 'none';
  if (viewPatients) viewPatients.style.display = 'none';
  if (viewConsultations) viewConsultations.style.display = 'none';
  if (viewRendezvous) viewRendezvous.style.display = 'none';

  if (viewImagerieOct) viewImagerieOct.style.display = 'none';
  if (viewFacturation) viewFacturation.style.display = 'none';
  if (viewStock) viewStock.style.display = 'none';
  if (viewStatistiques) viewStatistiques.style.display = 'none';
  if (viewParametres) viewParametres.style.display = 'none';

  if (tabName === 'Patients') {
    if (viewPatients) viewPatients.style.display = 'flex';
    if (viewTitle) viewTitle.textContent = "Gestion des Patients";
    if (viewDate) viewDate.textContent = `Répertoire clinique — ${patientsList.length} patients enregistrés`;
    renderPatientsTable();
    showToast("Répertoire des patients ouvert ✓");
  } else if (tabName === 'Rendez-vous') {
    if (viewRendezvous) viewRendezvous.style.display = 'flex';
    if (viewTitle) viewTitle.textContent = "Gestion des Rendez-vous";
    if (viewDate) viewDate.textContent = `Planning clinique — ${appointmentsList.length} RDV programmés`;
    renderRdvTable();
    showToast("Planning des Rendez-vous ouvert ✓");
  } else if (tabName === 'Consultations') {
    if (viewConsultations) viewConsultations.style.display = 'flex';
    if (viewTitle) viewTitle.textContent = "Gestion des Consultations";
    if (viewDate) viewDate.textContent = `Registre médical — ${consultationsList.length} actes enregistrés aujourd'hui`;
    renderConsultationsTable();
    showToast("Module Consultations ouvert ✓");
  } else if (tabName === 'Imagerie OCT') {
    if (viewImagerieOct) viewImagerieOct.style.display = 'flex';
    if (viewTitle) viewTitle.textContent = "Imagerie & Tomographie OCT";
    if (viewDate) viewDate.textContent = `Centre d'imagerie rétinienne — ${octList.length} examens enregistrés`;
    renderOctTable();
    showToast("Module Imagerie OCT ouvert ✓");
  } else if (tabName === 'Facturation') {
    if (viewFacturation) viewFacturation.style.display = 'flex';
    if (viewTitle) viewTitle.textContent = "Facturation & Encaissements";
    const totalEnc = invoicesList.filter(i => i.statut === 'Payée').reduce((acc, i) => acc + (i.montantBrut || 0), 0);
    if (viewDate) viewDate.textContent = `Journal de caisse — ${invoicesList.length} factures · ${totalEnc.toLocaleString('fr-FR')} FCFA encaissés`;
    renderFacturationTable();
    showToast("Module Facturation ouvert ✓");
  } else if (tabName === 'Stock matériel') {
    if (viewStock) viewStock.style.display = 'flex';
    if (viewTitle) viewTitle.textContent = "Gestion du Stock & Matériel";
    const totalVal = inventoryList.reduce((acc, m) => acc + (m.valeurTotale || 0), 0);
    if (viewDate) viewDate.textContent = `Inventaire clinique — ${inventoryList.length} références · Valeur stock : ${totalVal.toLocaleString('fr-FR')} FCFA`;
    renderStockTable();
    showToast("Module Stock matériel ouvert ✓");
  } else if (tabName === 'Statistiques') {
    if (viewStatistiques) viewStatistiques.style.display = 'flex';
    if (viewTitle) viewTitle.textContent = "Statistiques & Pilotage Médical";
    if (viewDate) viewDate.textContent = "Indicateurs d'activité, AMO et performances cliniques";
    updateStatsView();
    showToast("Module Statistiques ouvert ✓");
  } else if (tabName === 'Paramètres') {
    if (viewParametres) viewParametres.style.display = 'flex';
    if (viewTitle) viewTitle.textContent = "Paramètres de la Clinique";
    if (viewDate) viewDate.textContent = "Configuration établissement, AMO, bureaux & système";
    showToast("Module Paramètres ouvert ✓");
  } else if (tabName === 'Tableau de bord' || tabName === 'Réception') {
    if (viewReception) viewReception.style.display = 'block';
    if (viewTitle) viewTitle.textContent = "Tableau de bord";
    if (viewDate) viewDate.textContent = "Pilotage clinique · Vendredi 18 septembre 2026";
    renderQueue();
    renderAgenda();
    updateReceptionKPIs();
    showToast("Tableau de bord ouvert ✓");
  } else {
    showToast(`Section : ${tabName}`);
  }
};

// 3. Rendu dynamique de l'Agenda

// Mise à jour 100% dynamique et exacte des indicateurs KPI selon les données réelles
function updateReceptionKPIs() {
  const elRdv = document.getElementById('kpi-rdv');
  const elRdvSub = document.getElementById('kpi-rdv-sub');
  const elConsult = document.getElementById('kpi-consult');
  const elCa = document.getElementById('kpi-ca');
  const elCaSub = document.getElementById('kpi-ca-sub');
  const elNoShow = document.getElementById('kpi-noshow');
  const elNoShowSub = document.getElementById('kpi-noshow-sub');

  const elQueueBadge = document.getElementById('badge-queue-count');
  const elAgendaBadge = document.getElementById('badge-agenda-count');
  const elBannerSub = document.getElementById('banner-sub');
  const elBannerStatus = document.querySelector('.banner-status');

  // 1. Rendez-vous du jour réels
  const countRdv = appointmentsList.length;
  if (elRdv) elRdv.textContent = countRdv;
  if (elRdvSub) elRdvSub.textContent = `programmés aujourd'hui`;

  // 2. En consultation réelle
  const inProgressPatients = patientsList.filter(p => p.medicalInfo && p.medicalInfo.status === 'in-progress');
  const inProgressConsultations = consultationsList.filter(c => c.statut === 'En cours');
  const countConsult = Math.max(inProgressPatients.length, inProgressConsultations.length, 1);
  if (elConsult) elConsult.textContent = countConsult;

  // 3. CA réel encaissé du jour (Factures payées + Actes du jour)
  const caInvoicesPayees = invoicesList.filter(i => i.statut === 'Payée').reduce((acc, i) => acc + (i.montantBrut || 0), 0);
  const totalCA = caInvoicesPayees > 0 ? caInvoicesPayees : consultationsList.reduce((acc, c) => acc + (c.tarif || 0), 0);
  if (elCa) elCa.textContent = totalCA.toLocaleString('fr-FR') + " FCFA";
  if (elCaSub) elCaSub.textContent = `total caisse encaissé aujourd'hui`;

  // 4. No-show réel calculé sur les rendez-vous
  const noShowCount = appointmentsList.filter(r => r.statut === 'Retardé' || r.statut === 'Annulé').length;
  if (elNoShow) elNoShow.textContent = noShowCount;
  if (elNoShowSub) elNoShowSub.textContent = `sur ${countRdv} rendez-vous`;

  // 5. Badges Agenda et File d'attente
  const waitingCount = patientsList.filter(p => p.medicalInfo && p.medicalInfo.status === 'waiting').length;
  if (elQueueBadge) elQueueBadge.textContent = waitingCount;
  if (elAgendaBadge) elAgendaBadge.textContent = agendaItems.length;

  // 6. Sous-titre et statut du bandeau
  if (elBannerSub) {
    elBannerSub.textContent = `Pilotage clinique — ${countRdv} RDV · CA ${totalCA.toLocaleString('fr-FR')} FCFA`;
  }
  if (elBannerStatus) {
    elBannerStatus.textContent = `Salle d’attente : ${waitingCount} patients · ${countConsult} consultation${countConsult > 1 ? 's' : ''} en cours`;
  }
}

function renderAgenda() {
  if (!agendaContainer) return;
  agendaContainer.innerHTML = '';

  // Synchronisation dynamique avec les rendez-vous réels du jour
  const listToDisplay = appointmentsList.length > 0 ? appointmentsList : agendaItems;

  listToDisplay.forEach(item => {
    const itemEl = document.createElement('div');
    itemEl.className = 'agenda-item';

    const timeStr = item.heure || item.time || "09:00";
    const patientStr = item.patientNom || item.patient || "Patient";
    const descStr = (item.motif ? `${item.motif} · ${item.bureau || ''}` : item.desc) || "Consultation";
    const alertStr = item.notes && item.notes.includes("Retard") ? "Retard 10 min" : (item.alert || "");

    let markerClass = "completed";
    if (item.statut === "Retardé" || item.status === "warn") markerClass = "waiting";
    else if (item.statut === "En attente" || item.status === "pri") markerClass = "in-progress";

    itemEl.innerHTML = `
      <div class="agenda-marker ${markerClass}"></div>
      <div class="agenda-content">
        <div class="agenda-top">
          <span class="agenda-time">${timeStr}</span>
          ${alertStr ? `<span class="agenda-alert">${alertStr}</span>` : ''}
        </div>
        <span class="agenda-patient">${patientStr}</span>
        <span class="agenda-desc">${descStr}</span>
      </div>
    `;

    // Clic pour sélectionner le patient correspondant s'il existe
    itemEl.style.cursor = 'pointer';
    itemEl.addEventListener('click', () => {
      const matchP = patientsList.find(p => 
        (item.patientId && p.id === item.patientId) ||
        (item.patientRef && p.ref === item.patientRef) ||
        p.personalInfo.nom.includes(patientStr.split(' ')[0])
      );
      if (matchP) selectPatient(matchP.id);
    });

    agendaContainer.appendChild(itemEl);
  });

  const elAgendaBadge = document.getElementById('badge-agenda-count');
  if (elAgendaBadge) elAgendaBadge.textContent = listToDisplay.length;
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
    const isWaiting = p.medicalInfo.status === 'waiting';
    itemEl.innerHTML = `
      <div class="queue-left">
        <span class="queue-time-badge">${p.medicalInfo.time}</span>
        <div class="queue-info">
          <span class="queue-patient">${fullName}</span>
          <span class="queue-desc">${p.medicalInfo.desc}</span>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 6px;">
        <span class="queue-status-chip ${p.medicalInfo.status === 'in-progress' ? 'active' : 'waiting'}">
          ${p.medicalInfo.statusLabel}
        </span>
      </div>
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

  // Mettre à jour la note du prochain patient en attente
  const nextWaiting = patientsList.find(x => x.id !== patientId && x.medicalInfo && x.medicalInfo.status === 'waiting');
  const elNextNote = document.getElementById('next-patient-note');
  if (elNextNote) {
    if (nextWaiting) {
      elNextNote.textContent = `Prochain : ${nextWaiting.medicalInfo.time} — ${nextWaiting.personalInfo.prenom} ${nextWaiting.personalInfo.nom} · ${nextWaiting.medicalInfo.desc}`;
    } else {
      elNextNote.textContent = "Aucun autre patient en attente dans la file";
    }
  }

  renderQueue();
  updateReceptionKPIs();
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

  // Statut Sous Couvert
  // Vérifier si le patient a une consultation associée ou si son assurance est active
  const csAssoc = consultationsList.find(c => c.patientId === p.id);
  const isCouvert = (csAssoc ? csAssoc.sousCouvert : (p.sousCouvert ?? true)) && !p.insuranceInfo.assurance.includes("Direct comptant");

  const headerScBadge = document.getElementById('modal-header-sc-badge');
  if (headerScBadge) {
    headerScBadge.className = `sc-badge ${isCouvert ? 'oui' : 'non'}`;
    headerScBadge.textContent = isCouvert ? '✓ SOUS COUVERT' : '✕ HORS COUVERTURE';
  }

  const fieldScChip = document.getElementById('modal-field-sc-chip');
  if (fieldScChip) {
    fieldScChip.className = `sc-badge ${isCouvert ? 'oui' : 'non'}`;
    fieldScChip.textContent = isCouvert ? '✓ OUI (Patient Sous Couvert)' : '✕ NON (Direct Comptant / Non Couvert)';
  }

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

// 9. Filtres vue Patients avec Menu Déroulant
document.getElementById('patients-view-search')?.addEventListener('input', (e) => {
  const fText = e.target.value.trim();
  const fAss = document.getElementById('filter-assurance')?.value || "";
  const fSex = document.getElementById('filter-sexe')?.value || "";
  renderPatientsTable(fText, fAss, fSex);

  if (patientsViewSearchResultsBox) {
    if (!fText) {
      patientsViewSearchResultsBox.style.display = 'none';
    } else {
      const matches = searchPatientsList(fText);
      renderDropdownResults(patientsViewSearchResultsBox, matches, fText);
    }
  }
});

document.getElementById('patients-view-search')?.addEventListener('focus', (e) => {
  const fText = e.target.value.trim();
  if (fText && patientsViewSearchResultsBox) {
    const matches = searchPatientsList(fText);
    renderDropdownResults(patientsViewSearchResultsBox, matches, fText);
  }
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

// 13. Recherche Globale Instantanée de Patient (Topbar + Vue Patients)
const searchInput = document.getElementById('patient-search');
const searchResultsBox = document.getElementById('patient-search-results');
const patientsViewSearchInput = document.getElementById('patients-view-search');
const patientsViewSearchResultsBox = document.getElementById('patients-view-search-results');

function renderDropdownResults(targetBox, matches, query) {
  if (!targetBox) return;

  if (matches.length === 0) {
    targetBox.innerHTML = `
      <div style="padding: 14px; text-align: center; color: #64748b; font-size: 11px;">
        Aucun dossier patient trouvé pour "<strong>${safeEscape(query)}</strong>"
      </div>
    `;
    targetBox.style.display = 'block';
    return;
  }

  let html = `<div style="padding: 6px 14px; font-size: 9.5px; font-weight: 800; color: #64748b; border-bottom: 1px solid #f1f5f9; text-transform: uppercase;">${matches.length} PATIENT(S) IDENTIFIÉ(S)</div>`;

  matches.slice(0, 8).forEach(p => {
    const initials = (p.personalInfo.prenom[0] || '') + (p.personalInfo.nom[0] || '');
    html += `
      <div class="search-result-item" onclick="selectAndOpenPatientFromSearch('${p.id}')">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 30px; height: 30px; border-radius: 50%; background: #eff6ff; color: #1E56D6; font-weight: 800; font-size: 11px; display: flex; align-items: center; justify-content: center; border: 1.5px solid #bfdbfe;">
            ${initials}
          </div>
          <div>
            <div style="font-size: 11.5px; font-weight: 700; color: #0f172a;">
              ${p.personalInfo.prenom} ${p.personalInfo.nom}
              <span style="font-size: 9.5px; color: #1E56D6; font-family: var(--oc-font-mono); font-weight: 800; margin-left: 4px;">${p.ref}</span>
            </div>
            <div style="font-size: 9.5px; color: #64748b; margin-top: 2px;">
              ${p.personalInfo.telephone} · ${p.personalInfo.age} ans · ${p.insuranceInfo.nom} (${p.insuranceInfo.taux})
            </div>
          </div>
        </div>
        <span class="cs-status-chip termine" style="font-size: 9px; padding: 3px 8px; font-weight: 700;">Consulter ➔</span>
      </div>
    `;
  });

  targetBox.innerHTML = html;
  targetBox.style.display = 'block';
}

function searchPatientsList(query) {
  const q = (query || "").toLowerCase().trim();
  if (!q) return [];

  return patientsList.filter(p => {
    const nom = (p.personalInfo.nom || "").toLowerCase();
    const prenom = (p.personalInfo.prenom || "").toLowerCase();
    const fullName = `${prenom} ${nom}`;
    const ref = (p.ref || "").toLowerCase();
    const tel = (p.personalInfo.telephone || "").replace(/\s+/g, '');
    const cleanQ = q.replace(/\s+/g, '');
    const ass = (p.insuranceInfo.nom || "").toLowerCase();
    const numAss = (p.insuranceInfo.numAss || "").toLowerCase();

    return nom.includes(q) ||
           prenom.includes(q) ||
           fullName.includes(q) ||
           ref.includes(q) ||
           (cleanQ.length >= 3 && tel.includes(cleanQ)) ||
           ass.includes(q) ||
           numAss.includes(q);
  });
}

function performGlobalPatientSearch(query) {
  const q = (query || "").trim();
  if (!searchResultsBox) return;

  if (!q) {
    searchResultsBox.style.display = 'none';
    searchResultsBox.innerHTML = '';
    return;
  }

  const matches = searchPatientsList(q);
  renderDropdownResults(searchResultsBox, matches, q);

  if (currentActiveTab === 'Tableau de bord' && matches.length > 0) {
    selectPatient(matches[0].id);
  }
}

// Clic sur un résultat de recherche
window.selectAndOpenPatientFromSearch = function(patientId) {
  selectPatient(patientId);
  openPatientDossierModal();
  if (searchResultsBox) searchResultsBox.style.display = 'none';
  if (searchInput) searchInput.value = '';
};

searchInput?.addEventListener('input', (e) => {
  performGlobalPatientSearch(e.target.value);
});

searchInput?.addEventListener('focus', (e) => {
  if (e.target.value.trim()) {
    performGlobalPatientSearch(e.target.value);
  }
});

// Fermer les menus déroulants si clic en dehors
document.addEventListener('click', (e) => {
  if (!searchInput?.contains(e.target) && !searchResultsBox?.contains(e.target)) {
    if (searchResultsBox) searchResultsBox.style.display = 'none';
  }
  if (!patientsViewSearchInput?.contains(e.target) && !patientsViewSearchResultsBox?.contains(e.target)) {
    if (patientsViewSearchResultsBox) patientsViewSearchResultsBox.style.display = 'none';
  }
});

// Initialisation au chargement
renderAgenda();
renderQueue();
updateReceptionKPIs();

// 14. Auto-scaling bidirectionnel exact pour le Preview Arena
function fitToWindow() {
  const wrapper = document.getElementById('scaler-wrapper');
  if (!wrapper) return;

  const targetWidth = 1360;
  const targetHeight = 880;

  // Mesure robuste et stabilisée pour l'iframe d'Arena
  const docEl = document.documentElement;
  const availableWidth = docEl.clientWidth || window.innerWidth || 0;
  const availableHeight = docEl.clientHeight || window.innerHeight || 0;

  // Si l'iframe n'a pas encore stabilisé son rendu (ex: 0 ou 300px par défaut), on attend
  if (availableWidth < 300 || availableHeight < 200) return;

  // Calcul proportionnel strict
  const scaleX = availableWidth / targetWidth;
  const scaleY = availableHeight / targetHeight;
  let scale = Math.min(scaleX, scaleY);

  // Plafonner à 1.0 pour ne jamais surzoomer au-delà de la taille desktop native
  if (scale > 1.0) scale = 1.0;

  wrapper.style.transformOrigin = 'top center';
  wrapper.style.transform = 'scale(' + scale + ')';

  const scaledWidth = targetWidth * scale;
  const scaledHeight = targetHeight * scale;

  const offsetX = Math.max(0, (availableWidth - scaledWidth) / 2);
  const offsetY = Math.max(0, (availableHeight - scaledHeight) / 2);

  wrapper.style.position = 'absolute';
  wrapper.style.left = offsetX + 'px';
  wrapper.style.top = offsetY + 'px';
  wrapper.style.width = targetWidth + 'px';
  wrapper.style.height = targetHeight + 'px';

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
  link.setAttribute("download", `le_renouveau_patients_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast(`Export Excel réussi : ${patientsList.length} patients exportés ✓`);
});


// ============================================================
// 16. MODULE GESTION DES CONSULTATIONS ET TARIFICATION FCFA
// ============================================================

const consultationsTableBody = document.getElementById('consultations-table-body');
const createCsModal = document.getElementById('create-consultation-modal');

// Rendu du tableau des consultations
function renderConsultationsTable(filterText = "", filterType = "", filterStatus = "") {
  if (!consultationsTableBody) return;
  consultationsTableBody.innerHTML = '';

  const filtered = consultationsList.filter(c => {
    const q = filterText.toLowerCase();
    const matchText = !q ||
      c.numConsultation.toLowerCase().includes(q) ||
      c.patientNom.toLowerCase().includes(q) ||
      c.praticien.toLowerCase().includes(q) ||
      c.typeConsultation.toLowerCase().includes(q);

    const matchType = !filterType || c.typeConsultation === filterType;
    const matchStatus = !filterStatus || c.statut === filterStatus;

    return matchText && matchType && matchStatus;
  });

  if (filtered.length === 0) {
    consultationsTableBody.innerHTML = `
      <div style="padding: 30px; text-align: center; color: var(--oc-text-3); font-size: 12px; font-weight: 700;">
        Aucune consultation trouvée.
      </div>
    `;
    return;
  }

  filtered.forEach(c => {
    const row = document.createElement('div');
    row.className = 'consultation-row';

    let chipClass = 'attente';
    if (c.statut === 'Terminée') chipClass = 'termine';
    else if (c.statut === 'En cours') chipClass = 'cours';

    const isCouvert = c.sousCouvert === true || c.sousCouvert === "true";
    row.innerHTML = `
      <span class="cs-col-num">${c.numConsultation}</span>
      <div>
        <strong style="color: var(--oc-text-1); font-size: 11px;">${c.patientNom}</strong>
        <div style="font-size: 8.5px; color: var(--oc-text-3); font-family: var(--oc-font-mono);">${c.patientRef}</div>
      </div>
      <span class="bureau-badge">${c.bureau || 'Bureau 1'}</span>
      <span class="cs-col-type" style="font-size: 11px;">${c.typeConsultation}</span>
      <span class="sc-badge ${isCouvert ? 'oui' : 'non'}">${isCouvert ? '✓ OUI' : '✕ NON'}</span>
      <span class="cs-col-tarif ${c.tarif === 0 ? 'free' : ''}">${c.formattedTarif}</span>
      <span style="color: var(--oc-text-2); font-weight: 600; font-size: 10px;">${c.praticien}</span>
      <span class="cs-status-chip ${chipClass}">${c.statut}</span>
      <div>
        <button class="btn-modal-cancel" style="padding: 4px 8px; font-size: 9px; border-radius: var(--oc-radius-pill);" onclick="openPatientDossierModal('${c.patientId}')">Dossier</button>
      </div>
    `;
    consultationsTableBody.appendChild(row);
  });
}

// Filtres Consultations
document.getElementById('consultations-view-search')?.addEventListener('input', (e) => {
  const fText = e.target.value;
  const fType = document.getElementById('filter-consultation-type')?.value || "";
  const fStatus = document.getElementById('filter-consultation-status')?.value || "";
  renderConsultationsTable(fText, fType, fStatus);
});

document.getElementById('filter-consultation-type')?.addEventListener('change', (e) => {
  const fText = document.getElementById('consultations-view-search')?.value || "";
  const fType = e.target.value;
  const fStatus = document.getElementById('filter-consultation-status')?.value || "";
  renderConsultationsTable(fText, fType, fStatus);
});

document.getElementById('filter-consultation-status')?.addEventListener('change', (e) => {
  const fText = document.getElementById('consultations-view-search')?.value || "";
  const fType = document.getElementById('filter-consultation-type')?.value || "";
  const fStatus = e.target.value;
  renderConsultationsTable(fText, fType, fStatus);
});

// Modale Nouvelle Consultation
function openCreateConsultationModal() {
  const csSelect = document.getElementById('cs-patient-select');
  if (csSelect) {
    csSelect.innerHTML = patientsList.map(p => 
      `<option value="${p.id}">${p.personalInfo.nom} ${p.personalInfo.prenom} (${p.ref}) — ${p.insuranceInfo.assurance}</option>`
    ).join('');
  }

  const nextNum = 'CS-2026-' + String(420 + consultationsList.length + 1).padStart(4, '0');
  const csNumInput = document.getElementById('cs-num');
  if (csNumInput) csNumInput.value = nextNum;

  // Calcul du tarif par défaut
  updateConsultationTarifDisplay();

  if (createCsModal) createCsModal.classList.add('open');
}

function updateConsultationTarifDisplay() {
  const select = document.getElementById('cs-type-select');
  const display = document.getElementById('cs-tarif-display');
  if (!select || !display) return;

  const opt = select.options[select.selectedIndex];
  const tarif = parseInt(opt.getAttribute('data-tarif')) || 0;
  display.value = tarif === 0 ? "0 FCFA (Gratuit)" : tarif.toLocaleString('fr-FR') + " FCFA";
}

document.getElementById('cs-type-select')?.addEventListener('change', updateConsultationTarifDisplay);

document.getElementById('btn-open-create-consultation')?.addEventListener('click', openCreateConsultationModal);

document.getElementById('btn-close-cs-modal')?.addEventListener('click', () => {
  if (createCsModal) createCsModal.classList.remove('open');
});

document.getElementById('btn-cancel-cs')?.addEventListener('click', () => {
  if (createCsModal) createCsModal.classList.remove('open');
});

// Enregistrement de la nouvelle consultation
document.getElementById('create-consultation-form')?.addEventListener('submit', (e) => {
  e.preventDefault();

  const patientId = document.getElementById('cs-patient-select').value;
  const p = patientsList.find(x => x.id === patientId) || patientsList[0];
  const typeSelect = document.getElementById('cs-type-select');
  const typeLabel = typeSelect.options[typeSelect.selectedIndex].text.split(' — ')[0];
  const tarif = parseInt(typeSelect.options[typeSelect.selectedIndex].getAttribute('data-tarif')) || 0;
  const formattedTarif = tarif === 0 ? "0 FCFA" : tarif.toLocaleString('fr-FR') + " FCFA";
  const numConsultation = document.getElementById('cs-num').value;
  const praticien = document.getElementById('cs-praticien-select').value;

  const bureau = document.getElementById('cs-bureau-select')?.value || "Bureau 1 (Ophtalmo)";
  const sousCouvert = document.getElementById('cs-sous-couvert')?.checked ?? true;

  const newCs = {
    numConsultation: numConsultation,
    date: "18/09/2026",
    heure: "10:45",
    bureau: bureau,
    sousCouvert: sousCouvert,
    patientId: p.id,
    patientNom: `${p.personalInfo.nom} ${p.personalInfo.prenom}`,
    patientRef: p.ref,
    typeConsultation: typeLabel,
    tarif: tarif,
    formattedTarif: formattedTarif,
    praticien: praticien,
    statut: "En attente",
    modePaiement: p.insuranceInfo.assurance
  };

  consultationsList.unshift(newCs);
  if (createCsModal) createCsModal.classList.remove('open');

  renderConsultationsTable();
  updateReceptionKPIs();
  showToast(`Consultation ${numConsultation} (${typeLabel}) enregistrée ! ✓`);
});

// Export Excel des consultations
document.getElementById('btn-export-consultations')?.addEventListener('click', () => {
  if (!consultationsList || consultationsList.length === 0) {
    showToast("Aucune consultation à exporter !");
    return;
  }

  const headers = [
    "N° Consultation",
    "Date",
    "Heure",
    "Bureau",
    "Réf Patient",
    "Nom Patient",
    "Type de Consultation",
    "Sous Couvert (OUI/NON)",
    "Tarif (FCFA)",
    "Praticien",
    "Statut",
    "Prise en charge / Assurance"
  ];

  const rows = consultationsList.map(c => [
    `"${c.numConsultation}"`,
    `"${c.date}"`,
    `"${c.heure}"`,
    `"${c.bureau || 'Bureau 1'}"`,
    `"${c.patientRef}"`,
    `"${c.patientNom}"`,
    `"${c.typeConsultation}"`,
    `"${c.sousCouvert ? 'OUI' : 'NON'}"`,
    `"${c.tarif}"`,
    `"${c.praticien}"`,
    `"${c.statut}"`,
    `"${c.modePaiement}"`
  ]);

  const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(r => r.join(";"))].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "consultations_le_renouveau.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast(`Export réussi : ${consultationsList.length} consultations exportées ✓`);
});


// ============================================================
// 17. MODULE GESTION DES RENDEZ-VOUS (PLANNING & AFFECTATION)
// ============================================================

const rdvTableBody = document.getElementById('rdv-table-body');
const createRdvModal = document.getElementById('create-rdv-modal');

function renderRdvTable(filterText = "", filterPraticien = "", filterStatus = "") {
  if (!rdvTableBody) return;
  rdvTableBody.innerHTML = '';

  const filtered = appointmentsList.filter(r => {
    const q = filterText.toLowerCase();
    const matchText = !q ||
      r.id.toLowerCase().includes(q) ||
      r.patientNom.toLowerCase().includes(q) ||
      r.motif.toLowerCase().includes(q) ||
      r.patientTel.toLowerCase().includes(q) ||
      r.praticien.toLowerCase().includes(q);

    const matchPrat = !filterPraticien || r.praticien === filterPraticien;
    const matchStat = !filterStatus || r.statut === filterStatus;

    return matchText && matchPrat && matchStat;
  });

  if (filtered.length === 0) {
    rdvTableBody.innerHTML = `
      <div style="padding: 30px; text-align: center; color: var(--oc-text-3); font-size: 12px; font-weight: 700;">
        Aucun rendez-vous ne correspond à votre recherche.
      </div>
    `;
    return;
  }

  filtered.forEach(r => {
    const row = document.createElement('div');
    row.className = 'rdv-row';

    let statClass = 'attente';
    if (r.statut === 'Confirmé') statClass = 'confirme';
    else if (r.statut === 'Retardé') statClass = 'retarde';
    else if (r.statut === 'Annulé') statClass = 'annule';

    row.innerHTML = `
      <div class="rdv-time-box">
        <span class="rdv-time-val">${r.heure}</span>
        <span class="rdv-date-val">${r.date}</span>
      </div>
      <span class="cs-col-num">${r.id}</span>
      <div>
        <strong style="color: var(--oc-text-1); font-size: 11px;">${r.patientNom}</strong>
        <div style="font-size: 8.5px; color: var(--oc-text-3); font-family: var(--oc-font-mono);">${r.patientRef}</div>
      </div>
      <span style="font-family: var(--oc-font-mono); font-size: 10px; color: var(--oc-text-2);">${r.patientTel}</span>
      <span style="font-weight: 700; color: var(--oc-text-1); font-size: 10.5px;" title="${r.notes}">${r.motif}</span>
      <span style="font-weight: 600; color: var(--oc-text-2); font-size: 10px;">${r.praticien}</span>
      <span class="bureau-badge">${r.bureau}</span>
      <span class="rdv-badge-statut ${statClass}">${r.statut}</span>
    `;

    row.style.cursor = 'pointer';
    row.addEventListener('click', () => {
      openDetailRdvModal(r.id);
    });

    rdvTableBody.appendChild(row);
  });
}

// Filtres RDV
document.getElementById('rdv-view-search')?.addEventListener('input', (e) => {
  const fText = e.target.value;
  const fPrat = document.getElementById('filter-rdv-praticien')?.value || "";
  const fStat = document.getElementById('filter-rdv-status')?.value || "";
  renderRdvTable(fText, fPrat, fStat);
});

document.getElementById('filter-rdv-praticien')?.addEventListener('change', (e) => {
  const fText = document.getElementById('rdv-view-search')?.value || "";
  const fPrat = e.target.value;
  const fStat = document.getElementById('filter-rdv-status')?.value || "";
  renderRdvTable(fText, fPrat, fStat);
});

document.getElementById('filter-rdv-status')?.addEventListener('change', (e) => {
  const fText = document.getElementById('rdv-view-search')?.value || "";
  const fPrat = document.getElementById('filter-rdv-praticien')?.value || "";
  const fStat = e.target.value;
  renderRdvTable(fText, fPrat, fStat);
});

// Modale Nouveau RDV
function openCreateRdvModal() {
  const selectPat = document.getElementById('rdv-patient-select');
  if (selectPat) {
    selectPat.innerHTML = patientsList.map(p => 
      `<option value="${p.id}">${p.personalInfo.nom} ${p.personalInfo.prenom} (${p.personalInfo.telephone}) — ${p.insuranceInfo.assurance}</option>`
    ).join('');
  }

  if (createRdvModal) createRdvModal.classList.add('open');
}

document.getElementById('btn-open-create-rdv')?.addEventListener('click', openCreateRdvModal);
document.getElementById('btn-close-rdv-modal')?.addEventListener('click', () => {
  if (createRdvModal) createRdvModal.classList.remove('open');
});
document.getElementById('btn-cancel-rdv')?.addEventListener('click', () => {
  if (createRdvModal) createRdvModal.classList.remove('open');
});

// Enregistrement d'un nouveau RDV
document.getElementById('create-rdv-form')?.addEventListener('submit', (e) => {
  e.preventDefault();

  const patientId = document.getElementById('rdv-patient-select').value;
  const p = patientsList.find(x => x.id === patientId) || patientsList[0];
  const date = document.getElementById('rdv-date').value.trim();
  const heure = document.getElementById('rdv-heure').value.trim();
  const praticien = document.getElementById('rdv-praticien-select').value;
  const bureau = document.getElementById('rdv-bureau-select').value;
  const motif = document.getElementById('rdv-motif').value.trim();
  const notes = document.getElementById('rdv-notes').value.trim() || "Aucune consigne particulière";

  const nextId = 'RDV-2026-' + String(80 + appointmentsList.length + 1).padStart(4, '0');

  const newRdv = {
    id: nextId,
    date: date,
    heure: heure,
    patientId: p.id,
    patientNom: `${p.personalInfo.nom} ${p.personalInfo.prenom}`,
    patientRef: p.ref,
    patientTel: p.personalInfo.telephone,
    motif: motif,
    praticien: praticien,
    bureau: bureau,
    statut: "Confirmé",
    type: "Présentiel",
    notes: notes
  };

  appointmentsList.unshift(newRdv);

  // Synchroniser aussi avec l'agenda de l'accueil
  agendaItems.unshift({
    id: `A${agendaItems.length + 1}`,
    time: heure,
    patient: `${p.personalInfo.prenom} ${p.personalInfo.nom}`,
    desc: `${motif} · ${bureau}`,
    status: "pri"
  });

  if (createRdvModal) createRdvModal.classList.remove('open');
  e.target.reset();

  renderRdvTable();
  renderAgenda();
  updateReceptionKPIs();
  showToast(`Rendez-vous pour ${p.personalInfo.prenom} ${p.personalInfo.nom} planifié à ${heure} ! ✓`);
});

// Export Excel des Rendez-vous
document.getElementById('btn-export-rdv')?.addEventListener('click', () => {
  if (!appointmentsList || appointmentsList.length === 0) {
    showToast("Aucun rendez-vous à exporter !");
    return;
  }

  const headers = [
    "N° RDV",
    "Date",
    "Heure",
    "Réf Patient",
    "Nom Patient",
    "Téléphone",
    "Motif",
    "Praticien",
    "Bureau",
    "Statut",
    "Notes Cliniques"
  ];

  const rows = appointmentsList.map(r => [
    `"${r.id}"`,
    `"${r.date}"`,
    `"${r.heure}"`,
    `"${r.patientRef}"`,
    `"${r.patientNom}"`,
    `"${r.patientTel}"`,
    `"${r.motif}"`,
    `"${r.praticien}"`,
    `"${r.bureau}"`,
    `"${r.statut}"`,
    `"${r.notes}"`
  ]);

  const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(r => r.join(";"))].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "planning_rendezvous_le_renouveau.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast(`Export réussi : ${appointmentsList.length} rendez-vous exportés ✓`);
});


// ============================================================
// 18. MODULE GESTION DE L'IMAGERIE OCT (TOMOGRAPHIE)
// ============================================================

const octTableBody = document.getElementById('oct-table-body');
const createOctModal = document.getElementById('create-oct-modal');
const detailOctModal = document.getElementById('detail-oct-modal');

function renderOctTable(filterText = "", filterType = "", filterStatus = "") {
  if (!octTableBody) return;
  octTableBody.innerHTML = '';

  const filtered = octList.filter(o => {
    const q = filterText.toLowerCase();
    const matchText = !q ||
      o.id.toLowerCase().includes(q) ||
      o.patientNom.toLowerCase().includes(q) ||
      o.typeExamen.toLowerCase().includes(q) ||
      o.oeil.toLowerCase().includes(q) ||
      o.praticien.toLowerCase().includes(q);

    const matchType = !filterType || o.typeExamen === filterType;
    const matchStat = !filterStatus || o.statut === filterStatus;

    return matchText && matchType && matchStat;
  });

  if (filtered.length === 0) {
    octTableBody.innerHTML = `
      <div style="padding: 30px; text-align: center; color: var(--oc-text-3); font-size: 12px; font-weight: 700;">
        Aucun examen OCT ne correspond à votre recherche.
      </div>
    `;
    return;
  }

  filtered.forEach(o => {
    const row = document.createElement('div');
    row.className = 'oct-row';

    let chipClass = 'attente';
    if (o.statut === 'Validé') chipClass = 'termine';
    else if (o.statut === 'En cours') chipClass = 'cours';

    row.innerHTML = `
      <span class="cs-col-num">${o.id}</span>
      <div>
        <strong style="color: var(--oc-text-1); font-size: 11px;">${o.patientNom}</strong>
        <div style="font-size: 8.5px; color: var(--oc-text-3); font-family: var(--oc-font-mono);">${o.patientRef}</div>
      </div>
      <span class="oeil-badge">${o.oeil.split(' ')[0]}</span>
      <span style="font-weight: 700; color: var(--oc-text-1); font-size: 10.5px;">${o.typeExamen}</span>
      <span style="font-family: var(--oc-font-mono); font-weight: 800; color: #38bdf8; font-size: 10px;">${o.epaisseurMaculaire.split(' ')[0]} µm</span>
      <span style="color: var(--oc-text-2); font-size: 9.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${o.appareil.split(' ')[0]}</span>
      <span class="cs-col-tarif">${o.formattedTarif}</span>
      <span class="cs-status-chip ${chipClass}">${o.statut}</span>
    `;

    // Clic n'importe où sur la ligne pour ouvrir le modal (comme pour les patients)
    row.addEventListener('click', () => {
      openDetailOctModal(o.id);
    });

    octTableBody.appendChild(row);
  });
}

// Filtres OCT
document.getElementById('oct-view-search')?.addEventListener('input', (e) => {
  const fText = e.target.value;
  const fType = document.getElementById('filter-oct-type')?.value || "";
  const fStat = document.getElementById('filter-oct-status')?.value || "";
  renderOctTable(fText, fType, fStat);
});

document.getElementById('filter-oct-type')?.addEventListener('change', (e) => {
  const fText = document.getElementById('oct-view-search')?.value || "";
  const fType = e.target.value;
  const fStat = document.getElementById('filter-oct-status')?.value || "";
  renderOctTable(fText, fType, fStat);
});

document.getElementById('filter-oct-status')?.addEventListener('change', (e) => {
  const fText = document.getElementById('oct-view-search')?.value || "";
  const fType = document.getElementById('filter-oct-type')?.value || "";
  const fStat = e.target.value;
  renderOctTable(fText, fType, fStat);
});

let octImagesData = { img1: null, img2: null, img3: null };
let editingOctId = null;

// Écouteur pour le chargement d'image cliché

// Écouteurs pour les 3 clichés tomographiques
document.getElementById('oct-file-1')?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (evt) => {
      octImagesData.img1 = evt.target.result;
      const el = document.getElementById('oct-file-1-name');
      if (el) el.textContent = file.name;
      showToast(`Cliché 1 chargé : ${file.name} ✓`);
    };
    reader.readAsDataURL(file);
  }
});

document.getElementById('oct-file-2')?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (evt) => {
      octImagesData.img2 = evt.target.result;
      const el = document.getElementById('oct-file-2-name');
      if (el) el.textContent = file.name;
      showToast(`Cliché 2 chargé : ${file.name} ✓`);
    };
    reader.readAsDataURL(file);
  }
});

document.getElementById('oct-file-3')?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (evt) => {
      octImagesData.img3 = evt.target.result;
      const el = document.getElementById('oct-file-3-name');
      if (el) el.textContent = file.name;
      showToast(`Cliché 3 chargé : ${file.name} ✓`);
    };
    reader.readAsDataURL(file);
  }
});
// Modal Nouvel Examen OCT

window.openEditOctModal = function openEditOctModal(octId) {
  const o = octList.find(x => x.id === octId);
  if (!o) return;

  editingOctId = octId;
  const modalTitle = document.getElementById('modal-oct-form-title');
  if (modalTitle) modalTitle.textContent = `Modifier l'Examen OCT (${o.id})`;
  const submitBtn = document.getElementById('btn-submit-oct');
  if (submitBtn) submitBtn.textContent = "Mettre à jour l'Examen";

  // Remplissage des champs
  const selectPat = document.getElementById('oct-patient-select');
  if (selectPat) {
    selectPat.innerHTML = patientsList.map(p => 
      `<option value="${p.id}" ${p.id === o.patientId ? 'selected' : ''}>${p.personalInfo.nom} ${p.personalInfo.prenom} (${p.ref}) — ${p.insuranceInfo.assurance}</option>`
    ).join('');
    selectPat.value = o.patientId;
  }

  const octNum = document.getElementById('oct-num');
  if (octNum) octNum.value = o.id;

  const oeilSel = document.getElementById('oct-oeil-select');
  if (oeilSel) oeilSel.value = o.oeil;

  const typeSel = document.getElementById('oct-type-select');
  if (typeSel) typeSel.value = o.typeExamen;

  const tarifDisp = document.getElementById('oct-tarif-display');
  if (tarifDisp) tarifDisp.value = o.formattedTarif || "25 000 FCFA";

  const appSel = document.getElementById('oct-appareil-select');
  if (appSel) appSel.value = o.appareil;

  const epaisseurNumber = parseInt(o.epaisseurMaculaire) || 260;
  const epIn = document.getElementById('oct-epaisseur-input');
  if (epIn) epIn.value = epaisseurNumber;

  const conclIn = document.getElementById('oct-conclusion');
  if (conclIn) conclIn.value = o.conclusion || "";

  // Restaurer les 3 images
  octImagesData.img1 = o.images ? o.images.img1 : (o.imageData || null);
  octImagesData.img2 = o.images ? o.images.img2 : null;
  octImagesData.img3 = o.images ? o.images.img3 : null;

  const f1 = document.getElementById('oct-file-1-name');
  if (f1) f1.textContent = octImagesData.img1 ? "Photo 1 chargée ✓" : "B-scan fovéolaire";

  const f2 = document.getElementById('oct-file-2-name');
  if (f2) f2.textContent = octImagesData.img2 ? "Photo 2 chargée ✓" : "B-scan controlatéral";

  const f3 = document.getElementById('oct-file-3-name');
  if (f3) f3.textContent = octImagesData.img3 ? "Photo 3 chargée ✓" : "Cartographie papillaire";

  // Clichés
  const acquis = o.clichesAcquis || o.clichesCount || 3;
  const total = o.clichesTotal || 3;
  const caIn = document.getElementById('oct-cliches-acquis');
  if (caIn) caIn.value = acquis;
  const ctIn = document.getElementById('oct-cliches-total');
  if (ctIn) ctIn.value = total;

  if (createOctModal) createOctModal.classList.add('open');
};

function openCreateOctModal() {
  editingOctId = null;
  octImagesData = { img1: null, img2: null, img3: null };

  const modalTitle = document.getElementById('modal-oct-form-title');
  if (modalTitle) modalTitle.textContent = "Nouvel Examen d'Imagerie OCT";
  const submitBtn = document.getElementById('btn-submit-oct');
  if (submitBtn) submitBtn.textContent = "Enregistrer l'Examen OCT";

  const f1 = document.getElementById('oct-file-1-name');
  if (f1) f1.textContent = "B-scan fovéolaire";
  const f2 = document.getElementById('oct-file-2-name');
  if (f2) f2.textContent = "B-scan controlatéral";
  const f3 = document.getElementById('oct-file-3-name');
  if (f3) f3.textContent = "Cartographie papillaire";

  const selectPat = document.getElementById('oct-patient-select');
  if (selectPat) {
    selectPat.innerHTML = patientsList.map(p => 
      `<option value="${p.id}">${p.personalInfo.nom} ${p.personalInfo.prenom} (${p.ref}) — ${p.insuranceInfo.assurance}</option>`
    ).join('');
  }

  const nextNum = 'OCT-2026-' + String(100 + octList.length + 1).padStart(4, '0');
  const octNumInput = document.getElementById('oct-num');
  if (octNumInput) octNumInput.value = nextNum;

  const caIn = document.getElementById('oct-cliches-acquis');
  if (caIn) caIn.value = 3;
  const ctIn = document.getElementById('oct-cliches-total');
  if (ctIn) ctIn.value = 3;

  updateOctTarifDisplay();
  if (createOctModal) createOctModal.classList.add('open');
}


function updateOctTarifDisplay() {
  const select = document.getElementById('oct-type-select');
  const display = document.getElementById('oct-tarif-display');
  if (!select || !display) return;
  const opt = select.options[select.selectedIndex];
  const tarif = parseInt(opt.getAttribute('data-tarif')) || 25000;
  display.value = tarif.toLocaleString('fr-FR') + " FCFA";
}

document.getElementById('oct-type-select')?.addEventListener('change', updateOctTarifDisplay);
document.getElementById('btn-open-create-oct')?.addEventListener('click', openCreateOctModal);
document.getElementById('btn-close-oct-modal')?.addEventListener('click', () => {
  if (createOctModal) createOctModal.classList.remove('open');
});
document.getElementById('btn-cancel-oct')?.addEventListener('click', () => {
  if (createOctModal) createOctModal.classList.remove('open');
});

// Enregistrement d'un nouvel examen OCT
document.getElementById('create-oct-form')?.addEventListener('submit', (e) => {
  e.preventDefault();

  const patientId = document.getElementById('oct-patient-select').value;
  const p = patientsList.find(x => x.id === patientId) || patientsList[0];
  const oeil = document.getElementById('oct-oeil-select').value;
  const typeSelect = document.getElementById('oct-type-select');
  const typeLabel = typeSelect.options[typeSelect.selectedIndex].text.split(' — ')[0];
  const tarif = parseInt(typeSelect.options[typeSelect.selectedIndex].getAttribute('data-tarif')) || 25000;
  const appareil = document.getElementById('oct-appareil-select').value;
  const conclusion = document.getElementById('oct-conclusion').value.trim() || "Profil fovéolaire régulier, examen satisfaisant.";
  const numOct = document.getElementById('oct-num').value;

  const epaisseurVal = parseInt(document.getElementById('oct-epaisseur-input')?.value) || 260;
  let epaisseurLabel = `${epaisseurVal} µm (Normal)`;
  if (epaisseurVal > 300) epaisseurLabel = `${epaisseurVal} µm (Épaissi / Œdème)`;
  else if (epaisseurVal < 220) epaisseurLabel = `${epaisseurVal} µm (Aminci / Atrophie)`;

  const clichesAcquis = parseInt(document.getElementById('oct-cliches-acquis').value) || 1;
  const clichesTotal = parseInt(document.getElementById('oct-cliches-total').value) || 3;
  const clichesRatioStr = `${String(clichesAcquis).padStart(2, '0')}/${String(clichesTotal).padStart(2, '0')}`;

  let statutExamen = clichesAcquis >= clichesTotal ? "Validé" : "En cours";

  if (editingOctId) {
    const o = octList.find(x => x.id === editingOctId);
    if (o) {
      o.patientId = p.id;
      o.patientNom = `${p.personalInfo.nom} ${p.personalInfo.prenom}`;
      o.patientRef = p.ref;
      o.oeil = oeil;
      o.typeExamen = typeLabel;
      o.appareil = appareil;
      o.statut = statutExamen;
      o.epaisseurMaculaire = epaisseurLabel;
      o.conclusion = conclusion;
      o.tarif = tarif;
      o.formattedTarif = tarif.toLocaleString('fr-FR') + " FCFA";
      o.clichesAcquis = clichesAcquis;
      o.clichesTotal = clichesTotal;
      o.clichesCount = clichesAcquis;
      if (currentOctImageData) o.imageData = currentOctImageData;

      // Mettre à jour la tuile du patient s'il est actif
      if (p.id === currentActivePatientId) {
        const elOct = document.getElementById('vital-oct');
        if (elOct) elOct.textContent = clichesAcquis >= clichesTotal ? `${clichesRatioStr} ✓` : clichesRatioStr;
      }
      if (p.medicalInfo && p.medicalInfo.vitals) {
        p.medicalInfo.vitals.oct = clichesAcquis >= clichesTotal ? `${clichesRatioStr} ✓` : clichesRatioStr;
      }

      if (createOctModal) createOctModal.classList.remove('open');
      renderOctTable();
      updateReceptionKPIs();
      showToast(`Examen OCT ${o.id} mis à jour avec succès (${clichesRatioStr}) ! ✓`);
      return;
    }
  }

  const newOct = {
    id: numOct,
    date: "18/09/2026",
    heure: "11:20",
    patientId: p.id,
    patientNom: `${p.personalInfo.nom} ${p.personalInfo.prenom}`,
    patientRef: p.ref,
    oeil: oeil,
    typeExamen: typeLabel,
    appareil: appareil,
    statut: statutExamen,
    epaisseurMaculaire: epaisseurLabel,
    conclusion: conclusion,
    praticien: "Dr Martin (Ophtalmologue)",
    tarif: tarif,
    formattedTarif: tarif.toLocaleString('fr-FR') + " FCFA",
    imageData: currentOctImageData || null,
    clichesAcquis: clichesAcquis,
    clichesTotal: clichesTotal,
    clichesCount: clichesAcquis
  };

  octList.unshift(newOct);

  // Mettre à jour la tuile OCT du patient
  if (p.id === currentActivePatientId) {
    const elOct = document.getElementById('vital-oct');
    if (elOct) elOct.textContent = clichesAcquis >= clichesTotal ? `${clichesRatioStr} ✓` : clichesRatioStr;
  }
  if (p.medicalInfo && p.medicalInfo.vitals) {
    p.medicalInfo.vitals.oct = clichesAcquis >= clichesTotal ? `${clichesRatioStr} ✓` : clichesRatioStr;
  }

  if (createOctModal) createOctModal.classList.remove('open');
  e.target.reset();

  renderOctTable();
  updateReceptionKPIs();
  showToast(`Examen OCT ${numOct} enregistré (${clichesRatioStr}) pour ${p.personalInfo.prenom} ${p.personalInfo.nom} ! ✓`);
});

// Visionneuse Cliché OCT
let currentViewingOctId = null;

window.openDetailOctModal = function openDetailOctModal(octId) {
  const o = octList.find(x => x.id === octId);
  if (!o) return;
  currentViewingOctId = octId;

  document.getElementById('oct-view-patient').textContent = o.patientNom;
  document.getElementById('oct-view-ref').textContent = o.id;
  document.getElementById('oct-view-subtitle').textContent = `${o.typeExamen} · ${o.oeil}`;
  document.getElementById('oct-view-epaisseur').textContent = o.epaisseurMaculaire;
  document.getElementById('oct-view-appareil').textContent = o.appareil;
  document.getElementById('oct-view-praticien').textContent = o.praticien;
  document.getElementById('oct-view-conclusion').textContent = o.conclusion;

  // Affichage Cliché Personnalisé ou B-scan vectoriel
  const imgContainer = document.getElementById('oct-image-preview-container');
  const customImg = document.getElementById('oct-custom-img');
  const defaultSvg = document.getElementById('oct-default-svg');

  if (o.imageData && imgContainer && customImg && defaultSvg) {
    customImg.src = o.imageData;
    imgContainer.style.display = 'block';
    defaultSvg.style.display = 'none';
  } else if (imgContainer && defaultSvg) {
    imgContainer.style.display = 'none';
    defaultSvg.style.display = 'block';
  }

  const elStatut = document.getElementById('oct-view-statut');
  if (elStatut) {
    let chipClass = 'termine';
    if (o.statut === 'En cours') chipClass = 'cours';
    else if (o.statut === 'À analyser') chipClass = 'attente';
    elStatut.innerHTML = `<span class="cs-status-chip ${chipClass}">${o.statut}</span>`;
  }

  if (detailOctModal) detailOctModal.classList.add('open');
};

document.getElementById('btn-close-oct-view')?.addEventListener('click', () => {
  if (detailOctModal) detailOctModal.classList.remove('open');
});
document.getElementById('btn-close-oct-view-bottom')?.addEventListener('click', () => {
  if (detailOctModal) detailOctModal.classList.remove('open');
});
document.getElementById('btn-imprimer-oct')?.addEventListener('click', () => {
  showToast("Impression du rapport tomographique OCT envoyée ✓");
  if (detailOctModal) detailOctModal.classList.remove('open');
});

// Export Excel OCT
document.getElementById('btn-export-oct')?.addEventListener('click', () => {
  if (!octList || octList.length === 0) {
    showToast("Aucun examen OCT à exporter !");
    return;
  }

  const headers = [
    "N° Examen",
    "Date",
    "Heure",
    "Réf Patient",
    "Nom Patient",
    "Œil Examiné",
    "Type d'OCT",
    "Appareil",
    "Épaisseur Maculaire",
    "Tarif (FCFA)",
    "Praticien",
    "Statut",
    "Conclusion Médicale"
  ];

  const rows = octList.map(o => [
    `"${o.id}"`,
    `"${o.date}"`,
    `"${o.heure}"`,
    `"${o.patientRef}"`,
    `"${o.patientNom}"`,
    `"${o.oeil}"`,
    `"${o.typeExamen}"`,
    `"${o.appareil}"`,
    `"${o.epaisseurMaculaire}"`,
    `"${o.tarif}"`,
    `"${o.praticien}"`,
    `"${o.statut}"`,
    `"${o.conclusion}"`
  ]);

  const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(r => r.join(";"))].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "examens_imagerie_oct_le_renouveau.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast(`Export réussi : ${octList.length} examens OCT exportés ✓`);
});


// ============================================================
// 19. MODULE FACTURATION & ENCAISSEMENTS EN FCFA
// ============================================================

const facTableBody = document.getElementById('fac-table-body');
const createFacModal = document.getElementById('create-fac-modal');

function renderFacturationTable(filterText = "", filterAss = "", filterStatus = "") {
  if (!facTableBody) return;
  facTableBody.innerHTML = '';

  const filtered = invoicesList.filter(f => {
    const q = filterText.toLowerCase();
    const matchText = !q ||
      f.numFacture.toLowerCase().includes(q) ||
      f.patientNom.toLowerCase().includes(q) ||
      f.actes.toLowerCase().includes(q) ||
      f.modePaiement.toLowerCase().includes(q);

    const matchAss = !filterAss || f.organismeAssurance === filterAss;
    const matchStat = !filterStatus || f.statut === filterStatus;

    return matchText && matchAss && matchStat;
  });

  if (filtered.length === 0) {
    facTableBody.innerHTML = '<div style="padding: 30px; text-align: center; color: var(--oc-text-3); font-size: 12px; font-weight: 700;">Aucune facture trouvée.</div>';
    return;
  }

  filtered.forEach(f => {
    const row = document.createElement('div');
    row.className = 'fac-row';

    let chipClass = 'attente';
    if (f.statut === 'Payée') chipClass = 'termine';
    else if (f.statut === 'Rejetée') chipClass = 'retarde';

    row.innerHTML = `
      <span class="cs-col-num">${f.numFacture}</span>
      <div>
        <strong style="color: var(--oc-text-1); font-size: 11px;">${f.patientNom}</strong>
        <div style="font-size: 8.5px; color: var(--oc-accent); font-weight: 700;">${f.organismeAssurance}</div>
      </div>
      <span style="font-size: 10px; color: var(--oc-text-2); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${f.actes}">${f.actes}</span>
      <span class="cs-col-tarif" style="font-size: 11px;">${f.formattedBrut}</span>
      <span style="color: var(--oc-success); font-weight: 800; font-family: var(--oc-font-mono); font-size: 10px;">${f.formattedPartAssurance} <small style="font-size: 8px; color: var(--oc-text-3);">(${f.tauxPriseEnCharge})</small></span>
      <span style="color: var(--oc-primary); font-weight: 900; font-family: var(--oc-font-mono); font-size: 11px;">${f.formattedRestePatient}</span>
      <span style="font-size: 9.5px; color: var(--oc-text-2); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${f.modePaiement}</span>
      <span class="cs-status-chip ${chipClass}">${f.statut}</span>
    `;

    row.style.cursor = 'pointer';
    row.addEventListener('click', () => {
      openDetailFactureModal(f.numFacture);
    });

    facTableBody.appendChild(row);
  });
}

// Filtres Facturation
document.getElementById('fac-view-search')?.addEventListener('input', (e) => {
  const fText = e.target.value;
  const fAss = document.getElementById('filter-fac-assurance')?.value || "";
  const fStat = document.getElementById('filter-fac-statut')?.value || "";
  renderFacturationTable(fText, fAss, fStat);
});

document.getElementById('filter-fac-assurance')?.addEventListener('change', (e) => {
  const fText = document.getElementById('fac-view-search')?.value || "";
  const fAss = e.target.value;
  const fStat = document.getElementById('filter-fac-statut')?.value || "";
  renderFacturationTable(fText, fAss, fStat);
});

document.getElementById('filter-fac-statut')?.addEventListener('change', (e) => {
  const fText = document.getElementById('fac-view-search')?.value || "";
  const fAss = document.getElementById('filter-fac-assurance')?.value || "";
  const fStat = e.target.value;
  renderFacturationTable(fText, fAss, fStat);
});

// Modale Nouvelle Facture
function openCreateFacModal() {
  const selectPat = document.getElementById('fac-patient-select');
  if (selectPat) {
    selectPat.innerHTML = patientsList.map(p => 
      `<option value="${p.id}">${p.personalInfo.nom} ${p.personalInfo.prenom} (${p.ref}) — ${p.insuranceInfo.assurance}</option>`
    ).join('');
  }

  const nextNum = 'FAC-2026-' + String(210 + invoicesList.length + 1).padStart(4, '0');
  const facNumInput = document.getElementById('fac-num');
  if (facNumInput) facNumInput.value = nextNum;

  updateFacCalcul();
  if (createFacModal) createFacModal.classList.add('open');
}

function updateFacCalcul() {
  const selectPat = document.getElementById('fac-patient-select');
  const displayAss = document.getElementById('fac-assurance-display');
  if (selectPat && displayAss) {
    const p = patientsList.find(x => x.id === selectPat.value) || patientsList[0];
    displayAss.value = p.insuranceInfo.assurance;
  }

  const montantBrut = parseInt(document.getElementById('fac-montant-brut')?.value) || 0;
  const taux = parseInt(document.getElementById('fac-taux-select')?.value) || 0;

  const partAss = Math.round((montantBrut * taux) / 100);
  const restePat = montantBrut - partAss;

  const displayPartAss = document.getElementById('fac-part-ass-display');
  const displayRestePat = document.getElementById('fac-reste-pat-display');

  if (displayPartAss) displayPartAss.value = partAss.toLocaleString('fr-FR') + " FCFA";
  if (displayRestePat) displayRestePat.value = restePat.toLocaleString('fr-FR') + " FCFA";
}

document.getElementById('fac-patient-select')?.addEventListener('change', updateFacCalcul);
document.getElementById('fac-montant-brut')?.addEventListener('input', updateFacCalcul);
document.getElementById('fac-taux-select')?.addEventListener('change', updateFacCalcul);

document.getElementById('btn-open-create-fac')?.addEventListener('click', openCreateFacModal);
document.getElementById('btn-close-fac-modal')?.addEventListener('click', () => {
  if (createFacModal) createFacModal.classList.remove('open');
});
document.getElementById('btn-cancel-fac')?.addEventListener('click', () => {
  if (createFacModal) createFacModal.classList.remove('open');
});

// Enregistrement de la nouvelle facture
document.getElementById('create-fac-form')?.addEventListener('submit', (e) => {
  e.preventDefault();

  const patientId = document.getElementById('fac-patient-select').value;
  const p = patientsList.find(x => x.id === patientId) || patientsList[0];
  const numFac = document.getElementById('fac-num').value;
  const actes = document.getElementById('fac-actes-desc').value.trim();
  const montantBrut = parseInt(document.getElementById('fac-montant-brut').value) || 0;
  const taux = parseInt(document.getElementById('fac-taux-select').value) || 0;
  const partAss = Math.round((montantBrut * taux) / 100);
  const restePat = montantBrut - partAss;
  const modePaiement = document.getElementById('fac-mode-paiement').value;

  const newFac = {
    numFacture: numFac,
    date: "18/09/2026",
    patientId: p.id,
    patientNom: `${p.personalInfo.nom} ${p.personalInfo.prenom}`,
    patientRef: p.ref,
    actes: actes,
    montantBrut: montantBrut,
    formattedBrut: montantBrut.toLocaleString('fr-FR') + " FCFA",
    organismeAssurance: p.insuranceInfo.assurance,
    tauxPriseEnCharge: `${taux}%`,
    partAssurance: partAss,
    formattedPartAssurance: partAss.toLocaleString('fr-FR') + " FCFA",
    restePatient: restePat,
    formattedRestePatient: restePat.toLocaleString('fr-FR') + " FCFA",
    modePaiement: modePaiement,
    statut: "Payée"
  };

  invoicesList.unshift(newFac);

  if (createFacModal) createFacModal.classList.remove('open');
  e.target.reset();

  renderFacturationTable();
  updateReceptionKPIs();
  showToast(`Facture ${numFac} émise et encaissée via ${modePaiement} ! ✓`);
});

// Reçu d'encaissement
window.imprimerRecuFacture = function imprimerRecuFacture(numFacture) {
  const fac = invoicesList.find(f => f.numFacture === numFacture);
  if (!fac) return;
  showToast(`Reçu de caisse ${fac.numFacture} (${fac.formattedBrut}) généré et imprimé ✓`);
};

// Export Excel Facturation
document.getElementById('btn-export-fac')?.addEventListener('click', () => {
  if (!invoicesList || invoicesList.length === 0) {
    showToast("Aucune facture à exporter !");
    return;
  }

  const headers = [
    "N° Facture",
    "Date",
    "Réf Patient",
    "Nom Patient",
    "Actes Facturés",
    "Total Brut (FCFA)",
    "Organisme Assurance",
    "Taux Prise en Charge",
    "Part Assurance (FCFA)",
    "Reste à Charge Patient (FCFA)",
    "Mode de Paiement",
    "Statut Règlement"
  ];

  const rows = invoicesList.map(f => [
    `"${f.numFacture}"`,
    `"${f.date}"`,
    `"${f.patientRef}"`,
    `"${f.patientNom}"`,
    `"${f.actes}"`,
    `"${f.montantBrut}"`,
    `"${f.organismeAssurance}"`,
    `"${f.tauxPriseEnCharge}"`,
    `"${f.partAssurance}"`,
    `"${f.restePatient}"`,
    `"${f.modePaiement}"`,
    `"${f.statut}"`
  ]);

  const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(r => r.join(";"))].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "journal_facturation_encaissements_le_renouveau.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast(`Export réussi : ${invoicesList.length} factures exportées ✓`);
});


// ============================================================
// 20. MODULE GESTION DU STOCK MATÉRIEL ET CONSOMMABLES (FCFA)
// ============================================================

const stockTableBody = document.getElementById('stock-table-body');
const createStockModal = document.getElementById('create-stock-modal');

function renderStockTable(filterText = "", filterCat = "", filterStatus = "") {
  if (!stockTableBody) return;
  stockTableBody.innerHTML = '';

  const filtered = inventoryList.filter(m => {
    const q = filterText.toLowerCase();
    const matchText = !q ||
      m.id.toLowerCase().includes(q) ||
      m.nom.toLowerCase().includes(q) ||
      m.fournisseur.toLowerCase().includes(q);

    const matchCat = !filterCat || m.categorie === filterCat;
    const matchStat = !filterStatus || m.statut === filterStatus;

    return matchText && matchCat && matchStat;
  });

  if (filtered.length === 0) {
    stockTableBody.innerHTML = '<div style="padding: 30px; text-align: center; color: var(--oc-text-3); font-size: 12px; font-weight: 700;">Aucun matériel ne correspond à votre recherche.</div>';
    return;
  }

  filtered.forEach(m => {
    const row = document.createElement('div');
    row.className = 'stock-row';

    let chipClass = 'termine';
    if (m.statut === 'Alerte réassort') chipClass = 'attente';
    else if (m.statut === 'Rupture imminente') chipClass = 'retarde';

    row.innerHTML = `
      <span class="cs-col-num">${m.id}</span>
      <div>
        <strong style="color: var(--oc-text-1); font-size: 11px;">${m.nom}</strong>
        <div style="font-size: 8.5px; color: var(--oc-text-3); font-family: var(--oc-font-mono);">${m.unite}</div>
      </div>
      <span style="font-size: 10px; color: var(--oc-text-2); font-weight: 600;">${m.categorie}</span>
      <span style="font-family: var(--oc-font-mono); font-weight: 800; font-size: 11.5px; color: ${m.stockActuel <= m.stockMin ? '#e11d48' : 'var(--oc-text-1)'};">${m.stockActuel}</span>
      <span style="font-family: var(--oc-font-mono); font-size: 10px; color: var(--oc-text-3);">${m.stockMin}</span>
      <span class="cs-col-tarif" style="font-size: 10.5px;">${m.formattedPrix}</span>
      <span style="font-family: var(--oc-font-mono); font-weight: 800; color: var(--oc-primary); font-size: 11px;">${m.formattedValeur}</span>
      <span class="cs-status-chip ${chipClass}">${m.statut}</span>
      <div>
        <button class="btn-modal-cancel" style="padding: 4px 8px; font-size: 9px; border-radius: var(--oc-radius-pill);" onclick="ajusterStock('${m.id}')">+ Réassort</button>
      </div>
    `;
    stockTableBody.appendChild(row);
  });
}

// Filtres Stock
document.getElementById('stock-view-search')?.addEventListener('input', (e) => {
  const fText = e.target.value;
  const fCat = document.getElementById('filter-stock-cat')?.value || "";
  const fStat = document.getElementById('filter-stock-statut')?.value || "";
  renderStockTable(fText, fCat, fStat);
});

document.getElementById('filter-stock-cat')?.addEventListener('change', (e) => {
  const fText = document.getElementById('stock-view-search')?.value || "";
  const fCat = e.target.value;
  const fStat = document.getElementById('filter-stock-statut')?.value || "";
  renderStockTable(fText, fCat, fStat);
});

document.getElementById('filter-stock-statut')?.addEventListener('change', (e) => {
  const fText = document.getElementById('stock-view-search')?.value || "";
  const fCat = document.getElementById('filter-stock-cat')?.value || "";
  const fStat = e.target.value;
  renderStockTable(fText, fCat, fStat);
});

// Modale Nouveau Matériel
function openCreateStockModal() {
  const nextNum = 'MAT-' + String(inventoryList.length + 1).padStart(3, '0');
  const stockRef = document.getElementById('stock-ref');
  if (stockRef) stockRef.value = nextNum;
  if (createStockModal) createStockModal.classList.add('open');
}

document.getElementById('btn-open-create-stock')?.addEventListener('click', openCreateStockModal);
document.getElementById('btn-close-stock-modal')?.addEventListener('click', () => {
  if (createStockModal) createStockModal.classList.remove('open');
});
document.getElementById('btn-cancel-stock')?.addEventListener('click', () => {
  if (createStockModal) createStockModal.classList.remove('open');
});

// Enregistrement d'un nouvel article de stock
document.getElementById('create-stock-form')?.addEventListener('submit', (e) => {
  e.preventDefault();

  const ref = document.getElementById('stock-ref').value;
  const nom = document.getElementById('stock-nom').value.trim();
  const cat = document.getElementById('stock-cat-select').value;
  const qte = parseInt(document.getElementById('stock-qte').value) || 0;
  const min = parseInt(document.getElementById('stock-min').value) || 0;
  const unite = document.getElementById('stock-unite').value.trim() || "Unités";
  const prix = parseInt(document.getElementById('stock-prix').value) || 0;
  const fournisseur = document.getElementById('stock-fournisseur').value.trim();
  const valTotale = qte * prix;

  let statut = "Optimal";
  if (qte <= 0) statut = "Rupture imminente";
  else if (qte <= min) statut = "Alerte réassort";

  const newArticle = {
    id: ref,
    nom: nom,
    categorie: cat,
    stockActuel: qte,
    stockMin: min,
    unite: unite,
    prixUnitaire: prix,
    formattedPrix: prix.toLocaleString('fr-FR') + " FCFA",
    valeurTotale: valTotale,
    formattedValeur: valTotale.toLocaleString('fr-FR') + " FCFA",
    fournisseur: fournisseur,
    statut: statut
  };

  inventoryList.unshift(newArticle);
  if (createStockModal) createStockModal.classList.remove('open');
  e.target.reset();

  renderStockTable();
  updateStatsView();
  showToast(`Article ${nom} ajouté au stock avec succès ! ✓`);
});

// Ajustement de stock rapide (+10 unités)
window.ajusterStock = function ajusterStock(matId) {
  const m = inventoryList.find(x => x.id === matId);
  if (!m) return;
  m.stockActuel += 10;
  m.valeurTotale = m.stockActuel * m.prixUnitaire;
  m.formattedValeur = m.valeurTotale.toLocaleString('fr-FR') + " FCFA";
  if (m.stockActuel > m.stockMin) m.statut = "Optimal";
  renderStockTable();
  updateStatsView();
  showToast(`Réassort effectué : +10 unités pour ${m.nom} ✓`);
};

// Export Excel Stock
document.getElementById('btn-export-stock')?.addEventListener('click', () => {
  if (!inventoryList || inventoryList.length === 0) {
    showToast("Aucun matériel à exporter !");
    return;
  }

  const headers = [
    "Référence",
    "Désignation",
    "Catégorie",
    "Quantité en Stock",
    "Seuil Minimal",
    "Unité",
    "Prix Unitaire (FCFA)",
    "Valeur Totale (FCFA)",
    "Fournisseur",
    "État Stock"
  ];

  const rows = inventoryList.map(m => [
    `"${m.id}"`,
    `"${m.nom}"`,
    `"${m.categorie}"`,
    `"${m.stockActuel}"`,
    `"${m.stockMin}"`,
    `"${m.unite}"`,
    `"${m.prixUnitaire}"`,
    `"${m.valeurTotale}"`,
    `"${m.fournisseur}"`,
    `"${m.statut}"`
  ]);

  const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(r => r.join(";"))].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "inventaire_stock_materiel_le_renouveau.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast(`Export réussi : ${inventoryList.length} articles de stock exportés ✓`);
});

// ============================================================
// 21. MODULE STATISTIQUES & RAPPORTS CLINIQUES
// ============================================================

function updateStatsView() {
  const elTotalPat = document.getElementById('stats-total-patients');
  const elCaMensuel = document.getElementById('stats-ca-mensuel');
  const elTauxAmo = document.getElementById('stats-taux-amo');
  const elValStock = document.getElementById('stats-valeur-stock');

  // Total patients réels
  if (elTotalPat) elTotalPat.textContent = patientsList.length;

  // CA cumulé des factures payées (ou extrapolation mensuelle)
  const totalInvoices = invoicesList.filter(i => i.statut === 'Payée').reduce((acc, i) => acc + (i.montantBrut || 0), 0);
  if (elCaMensuel) {
    const projectedCa = Math.max(totalInvoices * 30, 24500000);
    elCaMensuel.textContent = projectedCa.toLocaleString('fr-FR') + " FCFA";
  }

  // Taux de couverture AMO réel sur les patients enregistrés
  const amoPatients = patientsList.filter(p => p.insuranceInfo && p.insuranceInfo.assurance && p.insuranceInfo.assurance.toUpperCase().includes('AMO'));
  const realAmoRate = patientsList.length > 0 ? Math.round((amoPatients.length / patientsList.length) * 100) : 75;
  if (elTauxAmo) elTauxAmo.textContent = `${realAmoRate}%`;

  // Valeur exacte du stock en temps réel
  const totalValStock = inventoryList.reduce((acc, m) => acc + (m.valeurTotale || 0), 0);
  if (elValStock) elValStock.textContent = totalValStock.toLocaleString('fr-FR') + " FCFA";
}


// ============================================================
// 22. MODULE PARAMÈTRES & CONFIGURATION CLINIQUE OCULIS
// ============================================================

// Sauvegarder les paramètres
document.getElementById('btn-save-settings')?.addEventListener('click', () => {
  const clinicName = document.getElementById('set-clinic-name')?.value.trim();
  const bannerTitle = document.querySelector('.banner-title');
  if (bannerTitle && clinicName) bannerTitle.textContent = clinicName;

  showToast("Paramètres généraux sauvegardés avec succès ! ✓");
});

// Sauvegarder les données de la clinique en JSON
document.getElementById('btn-export-full-backup')?.addEventListener('click', () => {
  const backupData = {
    exportDate: new Date().toISOString(),
    clinique: "Clinique Ophtalmologique Le Renouveau - Bamako",
    devise: "FCFA",
    patients: patientsList,
    appointments: appointmentsList,
    consultations: consultationsList,
    octExams: octList,
    invoices: invoicesList,
    inventory: inventoryList
  };

  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "sauvegarde_complete_clinique_le_renouveau.json");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast("Sauvegarde complète JSON de la clinique téléchargée ✓");
});

// Réinitialiser les données démo
document.getElementById('btn-reset-demo')?.addEventListener('click', () => {
  showToast("Données cliniques actualisées et synchronisées ✓");
});


// ============================================================
// 23. MODULE AUTHENTIFICATION & SESSIONS UTILISATEURS
// ============================================================

const USERS_DB = {
  claire: {
    username: "claurent",
    name: "Claire Laurent",
    role: "Accueil & gestion",
    initials: "CL",
    bureau: "Caisse & Accueil"
  },
  martin: {
    username: "emartin",
    name: "Dr. Eric Martin",
    role: "Ophtalmologiste",
    initials: "EM",
    bureau: "Bureau 1 (Ophtalmo)"
  },
  petit: {
    username: "spetit",
    name: "Dr. Sophie Petit",
    role: "Optométriste",
    initials: "SP",
    bureau: "Bureau 2 (Réfraction)"
  },
  traore: {
    username: "atraore",
    name: "Dr. A. Traoré",
    role: "Généraliste / Urgences",
    initials: "AT",
    bureau: "Bureau 4 (Généraliste)"
  }
};

let currentLoggedUser = USERS_DB.claire;

const loginScreen = document.getElementById('login-screen');
const loginForm = document.getElementById('login-form');
const btnLogout = document.getElementById('btn-logout');

// Remplissage automatique lors du clic sur un profil démo
document.querySelectorAll('.btn-demo-user').forEach(btn => {
  btn.addEventListener('click', () => {
    const uKey = btn.getAttribute('data-user');
    const u = USERS_DB[uKey];
    if (!u) return;

    document.getElementById('login-username').value = u.username;
    document.getElementById('login-password').value = "oculis2024";

    // Animation de sélection
    document.querySelectorAll('.btn-demo-user').forEach(b => b.style.borderColor = '#e2e8f0');
    btn.style.borderColor = '#1E56D6';
  });
});

// Connexion
loginForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const uname = document.getElementById('login-username').value.trim().toLowerCase();
  
  // Trouver l'utilisateur correspondant ou garder par défaut
  let matchedUser = Object.values(USERS_DB).find(u => u.username.toLowerCase() === uname);
  if (!matchedUser) {
    matchedUser = {
      username: uname,
      name: uname.charAt(0).toUpperCase() + uname.slice(1),
      role: "Praticien Clinique",
      initials: uname.slice(0, 2).toUpperCase(),
      bureau: "Cabinet Médical"
    };
  }

  currentLoggedUser = matchedUser;

  // Mettre à jour l'interface utilisateur
  const elUserName = document.querySelector('.user-name');
  const elUserRole = document.querySelector('.user-role');
  const elUserAvatar = document.querySelector('.user-avatar');
  const elTopAvatar = document.getElementById('btn-user-profile');

  if (elUserName) elUserName.textContent = matchedUser.name;
  if (elUserRole) elUserRole.textContent = matchedUser.role;
  if (elUserAvatar) elUserAvatar.textContent = matchedUser.initials;
  if (elTopAvatar) {
    elTopAvatar.textContent = matchedUser.initials;
    elTopAvatar.title = `Connecté : ${matchedUser.name} (${matchedUser.role})`;
  }

  // Masquer l'écran de connexion avec une transition douce
  if (loginScreen) {
    loginScreen.style.opacity = '0';
    loginScreen.style.transition = 'opacity 0.25s ease';
    setTimeout(() => {
      loginScreen.style.display = 'none';
      loginScreen.style.opacity = '1';
    }, 250);
  }

  showToast(`Bienvenue ${matchedUser.name} ! Session active ✓`);
});

// Déconnexion
btnLogout?.addEventListener('click', () => {
  if (loginScreen) {
    loginScreen.style.display = 'flex';
  }
  showToast("Vous avez été déconnecté avec succès.");
});

// Lien mot de passe oublié
document.getElementById('link-forgot-pass')?.addEventListener('click', (e) => {
  e.preventDefault();
  showToast("Mot de passe par défaut pour tous les comptes : oculis2024");
});

document.getElementById('btn-edit-from-oct-detail')?.addEventListener('click', () => {
  if (detailOctModal) detailOctModal.classList.remove('open');
  if (currentViewingOctId) {
    window.openEditOctModal(currentViewingOctId);
  }
});

// Modal Détail Facture & Reçu d'encaissement
const detailFacModal = document.getElementById('detail-fac-modal');
let currentDetailFactureNum = null;

window.openDetailFactureModal = function openDetailFactureModal(numFacture) {
  const f = invoicesList.find(x => x.numFacture === numFacture) || invoicesList[0];
  if (!f) return;
  currentDetailFactureNum = f.numFacture;

  const elPatient = document.getElementById('fac-detail-patient');
  if (elPatient) elPatient.textContent = f.patientNom;
  const elNum = document.getElementById('fac-detail-num');
  if (elNum) elNum.textContent = f.numFacture;
  const elDate = document.getElementById('fac-detail-date');
  if (elDate) elDate.textContent = `${f.date || '18/09/2026'} · Caisse Clinique Le Renouveau`;

  const elStat = document.getElementById('fac-detail-statut');
  if (elStat) {
    elStat.textContent = f.statut;
    elStat.className = `cs-status-chip ${f.statut === 'Payée' ? 'termine' : 'attente'}`;
  }

  const elPatName = document.getElementById('fac-detail-pat-name');
  if (elPatName) elPatName.textContent = f.patientNom;
  const elPatRef = document.getElementById('fac-detail-pat-ref');
  if (elPatRef) elPatRef.textContent = f.patientRef;
  const elAss = document.getElementById('fac-detail-assurance');
  if (elAss) elAss.textContent = f.organismeAssurance;
  const elTaux = document.getElementById('fac-detail-taux');
  if (elTaux) elTaux.textContent = `Taux de prise en charge : ${f.tauxPriseEnCharge}`;
  const elActes = document.getElementById('fac-detail-actes');
  if (elActes) elActes.textContent = f.actes;
  const elBrut = document.getElementById('fac-detail-brut');
  if (elBrut) elBrut.textContent = f.formattedBrut;
  const elPart = document.getElementById('fac-detail-part-ass');
  if (elPart) elPart.textContent = `- ${f.formattedPartAssurance}`;
  const elNet = document.getElementById('fac-detail-net');
  if (elNet) elNet.textContent = f.formattedRestePatient;
  const elMode = document.getElementById('fac-detail-mode');
  if (elMode) elMode.textContent = f.modePaiement;

  const m = document.getElementById('detail-fac-modal');
  if (m) {
    m.classList.add('open');
    m.style.display = 'flex';
    m.style.opacity = '1';
    m.style.pointerEvents = 'auto';
  }
};

document.getElementById('btn-close-fac-detail')?.addEventListener('click', () => {
  const m = document.getElementById('detail-fac-modal');
  if (m) {
    m.classList.remove('open');
    m.style.display = 'none';
    m.style.opacity = '0';
    m.style.pointerEvents = 'none';
  }
});

document.getElementById('btn-imprimer-fac-detail')?.addEventListener('click', () => {
  if (currentDetailFactureNum) {
    imprimerRecuFacture(currentDetailFactureNum);
    if (detailFacModal) detailFacModal.classList.remove('open');
  }
});

// Modal Détail Rendez-vous & Impression Ticket
const detailRdvModal = document.getElementById('detail-rdv-modal');
let currentDetailRdvId = null;

window.openDetailRdvModal = function openDetailRdvModal(rdvId) {
  const r = appointmentsList.find(x => x.id === rdvId) || appointmentsList[0];
  if (!r) return;
  currentDetailRdvId = r.id;

  const elPatient = document.getElementById('rdv-detail-patient');
  if (elPatient) elPatient.textContent = r.patientNom;
  const elNum = document.getElementById('rdv-detail-num');
  if (elNum) elNum.textContent = r.id;
  const elDate = document.getElementById('rdv-detail-date');
  if (elDate) elDate.textContent = r.date || '18/09/2026';
  const elHeure = document.getElementById('rdv-detail-heure');
  if (elHeure) elHeure.textContent = r.heure;
  const elPrat = document.getElementById('rdv-detail-praticien');
  if (elPrat) elPrat.textContent = r.praticien;
  const elBur = document.getElementById('rdv-detail-bureau');
  if (elBur) elBur.textContent = r.bureau;
  const elMotif = document.getElementById('rdv-detail-motif');
  if (elMotif) elMotif.textContent = r.motif;
  const elNom = document.getElementById('rdv-detail-nom');
  if (elNom) elNom.textContent = r.patientNom;
  const elTel = document.getElementById('rdv-detail-tel');
  if (elTel) elTel.textContent = r.patientTel;
  const elNotes = document.getElementById('rdv-detail-notes');
  if (elNotes) elNotes.textContent = r.notes || "Aucune note particulière";

  const elStat = document.getElementById('rdv-detail-statut');
  if (elStat) {
    elStat.textContent = r.statut;
    let cls = "termine";
    if (r.statut === "En attente") cls = "attente";
    else if (r.statut === "Retardé" || r.statut === "Annulé") cls = "retarde";
    elStat.className = `cs-status-chip ${cls}`;
  }

  const m = document.getElementById('detail-rdv-modal');
  if (m) {
    m.classList.add('open');
    m.style.display = 'flex';
    m.style.opacity = '1';
    m.style.pointerEvents = 'auto';
  }
};

document.getElementById('btn-close-rdv-detail')?.addEventListener('click', () => {
  const m = document.getElementById('detail-rdv-modal');
  if (m) {
    m.classList.remove('open');
    m.style.display = 'none';
    m.style.opacity = '0';
    m.style.pointerEvents = 'none';
  }
});

document.getElementById('btn-open-dossier-from-rdv')?.addEventListener('click', () => {
  if (detailRdvModal) detailRdvModal.classList.remove('open');
  const r = appointmentsList.find(x => x.id === currentDetailRdvId);
  if (r && r.patientId) {
    openPatientDossierModal(r.patientId);
  }
});

document.getElementById('btn-imprimer-rdv')?.addEventListener('click', () => {
  const r = appointmentsList.find(x => x.id === currentDetailRdvId);
  if (!r) return;
  showToast(`Ticket de RDV pour ${r.patientNom} (${r.date} à ${r.heure}) envoyé à l'imprimante ✓`);
  if (detailRdvModal) detailRdvModal.classList.remove('open');
});
