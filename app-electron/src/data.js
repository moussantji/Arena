// Données métier complètes de la clinique Oculis (Ophtalmologie)

export const clinicData = {
  name: "Clinique Oculis",
  tagline: "CLINIQUE OPHTALMO",
  dateString: "Mardi 17 septembre 2026",
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
  agenda: [
    { id: "A1", time: "09:00", patient: "Amélie Rousseau", desc: "Consultation + OCT · cab. 1", status: "pri" },
    { id: "A2", time: "09:30", patient: "Jean-Marc Petit", desc: "Tonométrie · cab. 2", status: "pri" },
    { id: "A3", time: "10:00", patient: "Sofia Benali", desc: "Suivi cataracte · cab. 1", alert: "retard 10 min", status: "warn" },
    { id: "A4", time: "10:30", patient: "Karim Haddad", desc: "Contrôle post-op · cab. 2", status: "pri" },
    { id: "A5", time: "11:15", patient: "Claire Dubois", desc: "Bilan complet · cab. 1", status: "ok" },
    { id: "A6", time: "14:00", patient: "Ibrahim Traoré", desc: "Fond d'œil diabétique · cab. 1", status: "pri" },
    { id: "A7", time: "14:45", patient: "Aminata Koné", desc: "Réfraction pédiatrique · cab. 2", status: "pri" },
    { id: "A8", time: "15:30", patient: "Moussa Coulibaly", desc: "Laser YAG · cab. 3", status: "pri" }
  ],
  queue: [
    {
      id: "Q1",
      ticket: "N° 0841",
      time: "09:12",
      patient: "Amélie Rousseau",
      desc: "OCT Macula",
      status: "in-progress",
      statusLabel: "En cours",
      age: 34,
      insurance: "Assurance AMO / Privée",
      vitals: { od: "10/10", og: "9/10", tension: "14/15 mmHg", oct: "02/03" },
      billing: {
        total: 120000,
        formattedTotal: "120 000 FCFA",
        coverage: "Prise en charge 80%",
        patientShare: "25 000 FCFA"
      }
    },
    {
      id: "Q2",
      ticket: "N° 0842",
      time: "09:30",
      patient: "Jean-Marc Petit",
      desc: "Tonométrie à aplanation",
      status: "waiting",
      statusLabel: "En attente",
      age: 58,
      insurance: "Assurance NSIA 100%",
      vitals: { od: "8/10", og: "7/10", tension: "18/19 mmHg", oct: "En attente" },
      billing: {
        total: 35000,
        formattedTotal: "35 000 FCFA",
        coverage: "Prise en charge 100%",
        patientShare: "0 FCFA"
      }
    },
    {
      id: "Q3",
      ticket: "N° 0843",
      time: "09:45",
      patient: "Sofia Benali",
      desc: "Suivi post-op cataracte",
      status: "waiting",
      statusLabel: "En attente",
      age: 67,
      insurance: "Assurance Gras Savoye",
      vitals: { od: "9/10", og: "10/10", tension: "13/14 mmHg", oct: "Normal" },
      billing: {
        total: 50000,
        formattedTotal: "50 000 FCFA",
        coverage: "Prise en charge 70%",
        patientShare: "15 000 FCFA"
      }
    },
    {
      id: "Q4",
      ticket: "N° 0844",
      time: "10:15",
      patient: "Claire Dubois",
      desc: "Bilan complet de la vue",
      status: "waiting",
      statusLabel: "En attente",
      age: 42,
      insurance: "Direct comptant",
      vitals: { od: "6/10", og: "5/10", tension: "15/15 mmHg", oct: "Non requis" },
      billing: {
        total: 45000,
        formattedTotal: "45 000 FCFA",
        coverage: "Comptant patient",
        patientShare: "45 000 FCFA"
      }
    }
  ]
};
