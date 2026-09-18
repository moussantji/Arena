// Données métier complètes de la clinique Oculis (Ophtalmologie)

export const clinicData = {
  name: "Clinique Oculis",
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
    title: "Clinique Oculis",
    subtitle: "Réception & pilotage — 24 RDV · CA 1 850 000 FCFA",
    status: "Salle d’attente : 6 patients · 2 consultations en cours"
  },
  patients: [
    {
      // Patient malien complet
      id: "P001",
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
      id: "P002",
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
      id: "P003",
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
      id: "P004",
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
