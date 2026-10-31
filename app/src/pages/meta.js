/* Métadonnées de navigation : libellés, fils d’Ariane et actions d’en-tête.
   Les sous-titres sont recalculés par chaque page à partir des données API. */

export const META = {
  dashboard: {
    label: 'Tableau de bord', group: 'Pilotage', crumb: ['Pilotage', 'Vue d’ensemble'],
    title: 'Tableau de bord', sub: 'Vue d’ensemble de l’établissement',
    primary: 'Nouvel élève', secondary: 'Exporter',
  },
  eleves: {
    label: 'Élèves', group: 'Pilotage', crumb: ['Pilotage', 'Élèves'],
    title: 'Élèves', sub: 'Dossiers des élèves inscrits',
    primary: 'Nouvel élève', secondary: 'Exporter',
  },
  classes: {
    label: 'Classes', group: 'Pilotage', crumb: ['Pilotage', 'Classes'],
    title: 'Classes', sub: 'Organisation pédagogique',
    primary: 'Créer une classe', secondary: 'Exporter',
  },
  'emploi-du-temps': {
    label: 'Emploi du temps', group: 'Pilotage', crumb: ['Pilotage', 'Emploi du temps'],
    title: 'Emploi du temps', sub: 'Planning hebdomadaire',
    primary: 'Ajouter un cours', secondary: 'Exporter',
  },
  finances: {
    label: 'Finances', group: 'Gestion', crumb: ['Gestion', 'Finances'],
    title: 'Finances', sub: 'Facturation et recouvrement',
    primary: 'Enregistrer un paiement', secondary: 'Exporter',
  },
  personnel: {
    label: 'Personnel', group: 'Gestion', crumb: ['Gestion', 'Personnel'],
    title: 'Personnel', sub: 'Équipe de l’établissement',
    primary: 'Ajouter un membre', secondary: 'Exporter',
  },
  messagerie: {
    label: 'Messagerie', group: 'Gestion', crumb: ['Gestion', 'Messagerie'],
    title: 'Messagerie', sub: 'Échanges avec les familles et l’équipe',
    primary: 'Nouveau message', secondary: 'Tout marquer lu',
  },
  matieres: {
    label: 'Matières', group: 'Pédagogie', crumb: ['Pédagogie', 'Matières'],
    title: 'Matières', sub: 'Catalogue et volumes horaires',
    primary: 'Nouvelle matière', secondary: 'Exporter',
  },
  notes: {
    label: 'Notes', group: 'Pédagogie', crumb: ['Pédagogie', 'Notes'],
    title: 'Notes', sub: 'Évaluations du trimestre',
    primary: 'Saisir une note', secondary: 'Exporter',
  },
  absences: {
    label: 'Absences', group: 'Pédagogie', crumb: ['Pédagogie', 'Absences'],
    title: 'Absences', sub: 'Suivi de l’assiduité',
    primary: 'Enregistrer une absence', secondary: 'Exporter',
  },
  fiche: {
    label: 'Fiche élève', group: 'Pédagogie', crumb: ['Pédagogie', 'Fiche élève'],
    title: 'Fiche élève', sub: 'Dossier scolaire complet', secondary: 'Message',
  },
  admissions: {
    label: 'Admissions', group: 'Pédagogie', crumb: ['Pédagogie', 'Admissions'],
    title: 'Admissions', sub: 'Pipeline des candidatures',
    primary: 'Nouveau dossier', secondary: 'Exporter',
  },
  modales: {
    label: 'Modales', group: 'Système', crumb: ['Système', 'Modales'],
    title: 'Modales', sub: 'Formulaires et confirmations en situation réelle',
  },
  parametres: {
    label: 'Paramètres', group: 'Système', crumb: ['Système', 'Paramètres'],
    title: 'Paramètres', sub: 'Établissement, calendrier et préférences',
    primary: 'Enregistrer', secondary: 'Exporter',
  },
};
