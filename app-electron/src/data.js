// Données métier complètes de la clinique Le Renouveau (Ophtalmologie)

window.clinicData = {
  name: "Clinique Le Renouveau",
  tagline: "CLINIQUE OPHTALMO",
  dateString: "Vendredi 18 septembre 2026",
  user: {
    id: "CL01",
    name: "Claire Laurent",
    initials: "CL",
    role: "Accueil & gestion",
    avatarColor: "var(--oc-primary)"
  },
  kpis: {
    appointments: { count: 24, diff: "+2 vs hier", status: "ok" },
    inConsultation: { count: 2, doctors: "Dr Martin · Dr Petit", status: "pri" },
    dailyRevenue: { amount: 1850000, formatted: "1 850 000 FCFA", subtext: "reçu ce matin", status: "ok" },
    noShow: { count: 1, subtext: "sur 24 patients", status: "warn" }
  },
  banner: {
    title: "Clinique Le Renouveau",
    subtitle: "Réception & pilotage — 24 RDV · CA 1 850 000 FCFA",
    status: "Salle d’attente : 6 patients · 2 consultations en cours"
  },
  patients: [
    {
      id: "P001", sousCouvert: true,
      ref: "CLI-ML-2026-0841",
      ticket: "N° 0841",
      personalInfo: {
        nom: "TRAORÉ",
        prenom: "Mamadou",
        adresse: "Badalabougou Rue 105, Porte 24, Bamako",
        sexe: "Masculin",
        age: 48,
        telephone: "+223 76 45 89 12",
        email: "mamadou.traore@orangemali.com",
        nationalite: "Malienne",
        profession: "Ingénieur Télécoms"
      },
      insuranceInfo: {
        assurance: "CANAM (AMO)",
        societe: "Orange Mali SA",
        dateValiAss: "31/12/2026",
        numAss: "AMO-ML-78459201-B"
      },
      medicalInfo: {
        time: "09:12",
        desc: "OCT Macula + Réfraction",
        status: "in-progress",
        statusLabel: "En cours",
        vitals: { od: "10/10", og: "8/10", tension: "14/15 mmHg", oct: "02/03" }
      },
      billing: {
        total: 120000,
        formattedTotal: "120 000 FCFA",
        coverage: "AMO 80%",
        patientShare: "25 000 FCFA",
        insuranceShare: "95 000 FCFA"
      }
    },
    {
      id: "P002", sousCouvert: true,
      ref: "CLI-ML-2026-0842",
      ticket: "N° 0842",
      personalInfo: {
        nom: "COULIBALY",
        prenom: "Fatoumata",
        adresse: "ACI 2000, Près du Monument Bougie, Bamako",
        sexe: "Féminin",
        age: 36,
        telephone: "+223 66 12 34 56",
        email: "f.coulibaly@bceao.int",
        nationalite: "Malienne",
        profession: "Analyste financière"
      },
      insuranceInfo: {
        assurance: "SUNU Assurances",
        societe: "BCEAO Siège Bamako",
        dateValiAss: "30/06/2027",
        numAss: "SUNU-ML-2024-998"
      },
      medicalInfo: {
        time: "09:30",
        desc: "Tonométrie + Fond d’œil",
        status: "waiting",
        statusLabel: "En attente",
        vitals: { od: "9/10", og: "9/10", tension: "16/16 mmHg", oct: "Normal" }
      },
      billing: {
        total: 45000,
        formattedTotal: "45 000 FCFA",
        coverage: "Prise en charge 100%",
        patientShare: "0 FCFA",
        insuranceShare: "45 000 FCFA"
      }
    },
    {
      id: "P003", sousCouvert: true,
      ref: "CLI-ML-2026-0843",
      ticket: "N° 0843",
      personalInfo: {
        nom: "DIARRA",
        prenom: "Oumar",
        adresse: "Hippodrome II, Bamako",
        sexe: "Masculin",
        age: 62,
        telephone: "+223 78 90 23 45",
        email: "oumar.diarra@malitel.ml",
        nationalite: "Malienne",
        profession: "Enseignant retraité"
      },
      insuranceInfo: {
        assurance: "INPS / AMO",
        societe: "Ministère de l'Éducation Nationale",
        dateValiAss: "31/12/2026",
        numAss: "AMO-ML-55231904-C"
      },
      medicalInfo: {
        time: "09:45",
        desc: "Suivi chirurgie cataracte",
        status: "waiting",
        statusLabel: "En attente",
        vitals: { od: "8/10", og: "10/10", tension: "13/14 mmHg", oct: "Post-op OK" }
      },
      billing: {
        total: 60000,
        formattedTotal: "60 000 FCFA",
        coverage: "AMO 80%",
        patientShare: "12 000 FCFA",
        insuranceShare: "48 000 FCFA"
      }
    },
    {
      id: "P004", sousCouvert: true,
      ref: "CLI-ML-2026-0844",
      ticket: "N° 0844",
      personalInfo: {
        nom: "KÉÏTA",
        prenom: "Aminata",
        adresse: "Hamdallaye ACI, Bamako",
        sexe: "Féminin",
        age: 29,
        telephone: "+223 70 33 22 11",
        email: "aminata.keita@avocat.ml",
        nationalite: "Malienne",
        profession: "Juriste d'affaires"
      },
      insuranceInfo: {
        assurance: "NSIA Assurances",
        societe: "Cabinet Keita & Associés",
        dateValiAss: "15/05/2027",
        numAss: "NSIA-ML-881203"
      },
      medicalInfo: {
        time: "10:15",
        desc: "Bilan complet réfraction",
        status: "waiting",
        statusLabel: "En attente",
        vitals: { od: "7/10", og: "6/10", tension: "15/15 mmHg", oct: "Non requis" }
      },
      billing: {
        total: 50000,
        formattedTotal: "50 000 FCFA",
        coverage: "NSIA 85%",
        patientShare: "7 500 FCFA",
        insuranceShare: "42 500 FCFA"
      }
    }
  ],
  agenda: [
    { id: "A1", time: "09:00", patient: "Mamadou Traoré", desc: "Consultation + OCT · cab. 1", status: "pri" },
    { id: "A2", time: "09:30", patient: "Fatoumata Coulibaly", desc: "Tonométrie · cab. 2", status: "pri" },
    { id: "A3", time: "10:00", patient: "Oumar Diarra", desc: "Suivi cataracte · cab. 1", alert: "retard 10 min", status: "warn" },
    { id: "A4", time: "10:30", patient: "Aminata Kéïta", desc: "Bilan réfraction · cab. 2", status: "pri" },
    { id: "A5", time: "11:15", patient: "Bakary Sanogo", desc: "Fond d'œil diabétique · cab. 1", status: "ok" }
  ]
};

// Export ESM pour compatibilité si nécessaire



// Grille officielle des Types de Consultation de la Clinique Le Renouveau (FCFA)
window.consultationTypes = [
  { id: "ophtalmologie", label: "Consultation ophtalmologie", tarif: 15000, formattedTarif: "15 000 FCFA", code: "CS-OPH" },
  { id: "optometrie", label: "Consultation optométrie", tarif: 5000, formattedTarif: "5 000 FCFA", code: "CS-OPT" },
  { id: "orthopsie", label: "Consultation orthopsie", tarif: 7500, formattedTarif: "7 500 FCFA", code: "CS-ORT" },
  { id: "urgence", label: "Consultation en urgence", tarif: 25000, formattedTarif: "25 000 FCFA", code: "CS-URG" },
  { id: "auto_spe", label: "Consultation auto spécialiste", tarif: 15000, formattedTarif: "15 000 FCFA", code: "CS-SPE" },
  { id: "amo", label: "Consultation AMO", tarif: 5000, formattedTarif: "5 000 FCFA", code: "CS-AMO" },
  { id: "pre_anesthesie", label: "Consultation pré-anesthésie", tarif: 10000, formattedTarif: "10 000 FCFA", code: "CS-ANE" },
  { id: "medecin_generaliste", label: "Consultation médecin généraliste", tarif: 10000, formattedTarif: "10 000 FCFA", code: "CS-GEN" },
  { id: "rapport_medical", label: "Rapport médical", tarif: 20000, formattedTarif: "20 000 FCFA", code: "DOC-RAP" },
  { id: "ex_externe", label: "EX Externe", tarif: 0, formattedTarif: "0 FCFA", code: "EX-EXT" },
  { id: "ex_interne", label: "EX Interne", tarif: 0, formattedTarif: "0 FCFA", code: "EX-INT" }
];

// Registre initial des Consultations du jour
window.clinicConsultations = [
  {
    numConsultation: "CS-2026-0418",
    date: "18/09/2026",
    heure: "08:30",
    bureau: "Bureau 1 (Ophtalmo)",
    sousCouvert: true,
    patientId: "P001",
    patientNom: "TRAORÉ Mamadou",
    patientRef: "CLI-ML-2026-0841",
    typeConsultation: "Consultation ophtalmologie",
    tarif: 15000,
    formattedTarif: "15 000 FCFA",
    praticien: "Dr Martin (Ophtalmologue)",
    statut: "Terminée",
    modePaiement: "CANAM (AMO)"
  },
  {
    numConsultation: "CS-2026-0419",
    date: "18/09/2026",
    heure: "09:15",
    bureau: "Bureau 2 (Réfraction)",
    sousCouvert: true,
    patientId: "P002",
    patientNom: "COULIBALY Fatoumata",
    patientRef: "CLI-ML-2026-0842",
    typeConsultation: "Consultation optométrie",
    tarif: 5000,
    formattedTarif: "5 000 FCFA",
    praticien: "Dr Petit (Optométriste)",
    statut: "En cours",
    modePaiement: "SUNU Assurances"
  },
  {
    numConsultation: "CS-2026-0420",
    date: "18/09/2026",
    heure: "09:45",
    bureau: "Bureau Urgences",
    sousCouvert: false,
    patientId: "P003",
    patientNom: "DIARRA Oumar",
    patientRef: "CLI-ML-2026-0843",
    typeConsultation: "Consultation en urgence",
    tarif: 25000,
    formattedTarif: "25 000 FCFA",
    praticien: "Dr Martin (Ophtalmologue)",
    statut: "En attente",
    modePaiement: "INPS / AMO"
  },
  {
    numConsultation: "CS-2026-0421",
    date: "18/09/2026",
    heure: "10:15",
    bureau: "Bureau 3 (Orthopsie)",
    sousCouvert: true,
    patientId: "P004",
    patientNom: "KÉÏTA Aminata",
    patientRef: "CLI-ML-2026-0844",
    typeConsultation: "Consultation orthopsie",
    tarif: 7500,
    formattedTarif: "7 500 FCFA",
    praticien: "Dr Petit (Orthoptiste)",
    statut: "En attente",
    modePaiement: "NSIA Assurances"
  }
];


// Registre complet des Rendez-vous de la Clinique Le Renouveau
window.clinicAppointments = [
  {
    id: "RDV-2026-0081",
    date: "18/09/2026",
    heure: "09:00",
    patientId: "P001",
    patientNom: "TRAORÉ Mamadou",
    patientRef: "CLI-ML-2026-0841",
    patientTel: "+223 76 45 89 12",
    motif: "Consultation ophtalmologie + Bilan OCT",
    praticien: "Dr Martin (Ophtalmologue)",
    bureau: "Bureau 1 (Ophtalmo)",
    statut: "Confirmé",
    type: "Présentiel",
    notes: "Patient sous couvert CANAM AMO - Suivi tensionnel"
  },
  {
    id: "RDV-2026-0082",
    date: "18/09/2026",
    heure: "09:30",
    patientId: "P002",
    patientNom: "COULIBALY Fatoumata",
    patientRef: "CLI-ML-2026-0842",
    patientTel: "+223 66 12 34 56",
    motif: "Consultation optométrie · Tonométrie",
    praticien: "Dr Petit (Optométriste)",
    bureau: "Bureau 2 (Réfraction)",
    statut: "En attente",
    type: "Présentiel",
    notes: "Assurée SUNU - Réfraction et acuité visuelle"
  },
  {
    id: "RDV-2026-0083",
    date: "18/09/2026",
    heure: "10:00",
    patientId: "P003",
    patientNom: "DIARRA Oumar",
    patientRef: "CLI-ML-2026-0843",
    patientTel: "+223 79 88 11 22",
    motif: "Suivi post-opératoire cataracte",
    praticien: "Dr Martin (Ophtalmologue)",
    bureau: "Bureau 1 (Ophtalmo)",
    statut: "Retardé",
    type: "Présentiel",
    notes: "Retard signalé de 10 min - Contrôle œil gauche"
  },
  {
    id: "RDV-2026-0084",
    date: "18/09/2026",
    heure: "10:30",
    patientId: "P004",
    patientNom: "KÉÏTA Aminata",
    patientRef: "CLI-ML-2026-0844",
    patientTel: "+223 70 55 44 33",
    motif: "Consultation orthopsie & Bilan strabisme",
    praticien: "Dr Petit (Orthoptiste)",
    bureau: "Bureau 3 (Orthopsie)",
    statut: "Confirmé",
    type: "Présentiel",
    notes: "Séance bilan visuel binoculaire"
  },
  {
    id: "RDV-2026-0085",
    date: "18/09/2026",
    heure: "11:15",
    patientId: "P001",
    patientNom: "SANOGO Bakary",
    patientRef: "CLI-ML-2026-0845",
    patientTel: "+223 74 22 99 00",
    motif: "Fond d'œil diabétique & Angiographie",
    praticien: "Dr Martin (Ophtalmologue)",
    bureau: "Bureau 1 (Ophtalmo)",
    statut: "Confirmé",
    type: "Présentiel",
    notes: "Dilatation pupillaire requise à l'accueil"
  },
  {
    id: "RDV-2026-0086",
    date: "18/09/2026",
    heure: "14:00",
    patientId: "P002",
    patientNom: "BAGAYOKO Adama",
    patientRef: "CLI-ML-2026-0846",
    patientTel: "+223 65 33 22 11",
    motif: "Consultation pré-anesthésie chirurgie",
    praticien: "Dr Traoré (Anesthésiste)",
    bureau: "Bureau 4 (Généraliste)",
    statut: "Confirmé",
    type: "Présentiel",
    notes: "Bilan sanguin pré-opératoire complet"
  }
];


// Types et tarifs des examens d'Imagerie OCT (FCFA)
window.octTypes = [
  { id: "oct_macula", label: "OCT Maculaire Haute Définition", tarif: 25000, formattedTarif: "25 000 FCFA", code: "OCT-MAC" },
  { id: "oct_nerf", label: "OCT Papille & Fibres RNFL (Glaucome)", tarif: 25000, formattedTarif: "25 000 FCFA", code: "OCT-GLA" },
  { id: "oct_angio", label: "Angio-OCT (OCT-A) Rétinien sans injection", tarif: 40000, formattedTarif: "40 000 FCFA", code: "OCT-ANG" },
  { id: "oct_segment", label: "OCT Segment Antérieur & Cornée", tarif: 20000, formattedTarif: "20 000 FCFA", code: "OCT-ANT" },
  { id: "oct_bilan_complet", label: "Bilan OCT Combiné Macula + Nerf Optique", tarif: 45000, formattedTarif: "45 000 FCFA", code: "OCT-DUO" }
];

// Registre des Examens d'Imagerie OCT enregistrés
window.clinicOctExams = [
  {
    id: "OCT-2026-0101",
    date: "18/09/2026",
    heure: "08:45",
    patientId: "P001",
    patientNom: "TRAORÉ Mamadou",
    patientRef: "CLI-ML-2026-0841",
    oeil: "OD + OG (Bilatéral)",
    typeExamen: "OCT Maculaire Haute Définition",
    appareil: "Spectralis OCT Heidelberg (Salle Imagerie)",
    statut: "Validé",
    epaisseurMaculaire: "264 µm (Normal)",
    conclusion: "Profil fovéolaire préservé, absence d'œdème maculaire ni de décollement séreux.",
    praticien: "Dr Martin (Ophtalmologue)",
    tarif: 25000,
    formattedTarif: "25 000 FCFA",
    clichesCount: 3
  },
  {
    id: "OCT-2026-0102",
    date: "18/09/2026",
    heure: "09:50",
    patientId: "P003",
    patientNom: "DIARRA Oumar",
    patientRef: "CLI-ML-2026-0843",
    oeil: "OG (Œil Gauche)",
    typeExamen: "OCT Papille & Fibres RNFL (Glaucome)",
    appareil: "Cirrus HD-OCT Zeiss (Salle Imagerie)",
    statut: "À analyser",
    epaisseurMaculaire: "92 µm (Zone limite)",
    conclusion: "Légère encoche inféro-temporale des fibres nerveuses, contrôle à 3 mois conseillé.",
    praticien: "Dr Martin (Ophtalmologue)",
    tarif: 25000,
    formattedTarif: "25 000 FCFA",
    clichesCount: 2
  },
  {
    id: "OCT-2026-0103",
    date: "18/09/2026",
    heure: "10:30",
    patientId: "P002",
    patientNom: "COULIBALY Fatoumata",
    patientRef: "CLI-ML-2026-0842",
    oeil: "OD + OG (Bilatéral)",
    typeExamen: "Bilan OCT Combiné Macula + Nerf Optique",
    appareil: "Spectralis OCT Heidelberg (Salle Imagerie)",
    statut: "En cours",
    epaisseurMaculaire: "278 µm (Normal)",
    conclusion: "Acquisition en cours de traitement par l'ophtalmologue.",
    praticien: "Dr Petit (Optométriste)",
    tarif: 45000,
    formattedTarif: "45 000 FCFA",
    clichesCount: 4
  }
];


// Registre officiel des Factures et Encaissements de la Clinique Le Renouveau (en FCFA)
window.clinicInvoices = [
  {
    numFacture: "FAC-2026-0210",
    date: "18/09/2026",
    patientId: "P001",
    patientNom: "TRAORÉ Mamadou",
    patientRef: "CLI-ML-2026-0841",
    actes: "Consultation ophtalmo (15 000) + OCT Maculaire (25 000)",
    montantBrut: 40000,
    formattedBrut: "40 000 FCFA",
    organismeAssurance: "CANAM (AMO)",
    tauxPriseEnCharge: "80%",
    partAssurance: 32000,
    formattedPartAssurance: "32 000 FCFA",
    restePatient: 8000,
    formattedRestePatient: "8 000 FCFA",
    modePaiement: "Orange Money Mali",
    statut: "Payée"
  },
  {
    numFacture: "FAC-2026-0211",
    date: "18/09/2026",
    patientId: "P002",
    patientNom: "COULIBALY Fatoumata",
    patientRef: "CLI-ML-2026-0842",
    actes: "Consultation optométrie (5 000) + Bilan OCT Duo (45 000)",
    montantBrut: 50000,
    formattedBrut: "50 000 FCFA",
    organismeAssurance: "SUNU Assurances",
    tauxPriseEnCharge: "80%",
    partAssurance: 40000,
    formattedPartAssurance: "40 000 FCFA",
    restePatient: 10000,
    formattedRestePatient: "10 000 FCFA",
    modePaiement: "Espèces (Comptant)",
    statut: "Payée"
  },
  {
    numFacture: "FAC-2026-0212",
    date: "18/09/2026",
    patientId: "P003",
    patientNom: "DIARRA Oumar",
    patientRef: "CLI-ML-2026-0843",
    actes: "Consultation en urgence (25 000) + OCT Papille (25 000)",
    montantBrut: 50000,
    formattedBrut: "50 000 FCFA",
    organismeAssurance: "INPS / AMO",
    tauxPriseEnCharge: "70%",
    partAssurance: 35000,
    formattedPartAssurance: "35 000 FCFA",
    restePatient: 15000,
    formattedRestePatient: "15 000 FCFA",
    modePaiement: "Moov Money",
    statut: "En attente"
  },
  {
    numFacture: "FAC-2026-0213",
    date: "18/09/2026",
    patientId: "P004",
    patientNom: "KÉÏTA Aminata",
    patientRef: "CLI-ML-2026-0844",
    actes: "Consultation orthopsie (7 500) + Bilan strabisme",
    montantBrut: 7500,
    formattedBrut: "7 500 FCFA",
    organismeAssurance: "NSIA Assurances",
    tauxPriseEnCharge: "80%",
    partAssurance: 6000,
    formattedPartAssurance: "6 000 FCFA",
    restePatient: 1500,
    formattedRestePatient: "1 500 FCFA",
    modePaiement: "Chèque BDM-SA",
    statut: "Payée"
  }
];


// Registre des Consommables & Matériel Médical Ophtalmologique de la Clinique Le Renouveau
window.clinicInventory = [
  {
    id: "MAT-001",
    nom: "Collyre Mydriatique (Tropicamide 0.5%)",
    categorie: "Consommables & Collyres",
    stockActuel: 48,
    stockMin: 15,
    unite: "Flacons 5ml",
    prixUnitaire: 3500,
    formattedPrix: "3 500 FCFA",
    valeurTotale: 168000,
    formattedValeur: "168 000 FCFA",
    fournisseur: "Pharmacie Centrale de Bamako",
    statut: "Optimal"
  },
  {
    id: "MAT-002",
    nom: "Bandelettes Fluorescéine stérile",
    categorie: "Diagnostic & Réfraction",
    stockActuel: 120,
    stockMin: 40,
    unite: "Boîtes 100u",
    prixUnitaire: 8500,
    formattedPrix: "8 500 FCFA",
    valeurTotale: 1020000,
    formattedValeur: "1 020 000 FCFA",
    fournisseur: "Labo Ophta Sahel",
    statut: "Optimal"
  },
  {
    id: "MAT-003",
    nom: "Embouts de Tonomètre à aplanation",
    categorie: "Consommables & Stérilisation",
    stockActuel: 14,
    stockMin: 20,
    unite: "Pochettes stériles",
    prixUnitaire: 6000,
    formattedPrix: "6 000 FCFA",
    valeurTotale: 84000,
    formattedValeur: "84 000 FCFA",
    fournisseur: "Médical Équipement Mali",
    statut: "Alerte réassort"
  },
  {
    id: "MAT-004",
    nom: "Papier d'impression Thermique OCT B-Scan",
    categorie: "Imagerie & Informatique",
    stockActuel: 8,
    stockMin: 10,
    unite: "Rouleaux HD",
    prixUnitaire: 12500,
    formattedPrix: "12 500 FCFA",
    valeurTotale: 100000,
    formattedValeur: "100 000 FCFA",
    fournisseur: "Bureau Pro Bamako",
    statut: "Alerte réassort"
  },
  {
    id: "MAT-005",
    nom: "Couteaux biseautés micro-chirurgie cataracte 2.2mm",
    categorie: "Chirurgie & Blocs",
    stockActuel: 35,
    stockMin: 10,
    unite: "Lames stériles",
    prixUnitaire: 18000,
    formattedPrix: "18 000 FCFA",
    valeurTotale: 630000,
    formattedValeur: "630 000 FCFA",
    fournisseur: "SurgiCare Afrique",
    statut: "Optimal"
  },
  {
    id: "MAT-006",
    nom: "Larmes artificielles unidose (Hyaluronate 0.2%)",
    categorie: "Consommables & Collyres",
    stockActuel: 6,
    stockMin: 25,
    unite: "Boîtes de 30",
    prixUnitaire: 7500,
    formattedPrix: "7 500 FCFA",
    valeurTotale: 45000,
    formattedValeur: "45 000 FCFA",
    fournisseur: "Labo Ophta Sahel",
    statut: "Rupture imminente"
  }
];
