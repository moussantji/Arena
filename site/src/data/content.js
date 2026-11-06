// Données publiques de l'Institut Privé de Formation Sanitaire Bernard Kouchner (IPFS-BK)
// Source : https://institut-bernard-kouchner.com/ (pages d'accueil, formations, blog, à propos, contact)

export const school = {
  shortName: 'IPFS-BK',
  name: 'Institut Privé de Formation Sanitaire Bernard Kouchner',
  tagline: 'La santé commence par une formation sérieuse.',
  claim:
    'Nous formons des apprenants compétents, responsables et prêts à relever les défis du terrain.',
  city: 'Bamako',
  quartier: 'Hippodrome 1',
  address: 'Hippodrome 1, 1 derrière le siège d’Orange Mali, RN27, Bamako — Mali',
  phones: ['+223 76 74 74 07', '+223 83 01 02 02'],
  whatsapp: '+223 63 64 30 30',
  whatsappUrl:
    'https://wa.me/22363643030?text=Bonjour%20Institut%20Bernard%20Kouchner%2C%20je%20souhaite%20obtenir%20des%20informations%20sur%20vos%20formations%20et%20les%20inscriptions.',
  bank: { nom: 'BNDA', compte: '490001201401' },
  agrement: {
    creation: 'Décision n°2023-000211/MESRS-SG du 07 février 2023',
    ouverture: 'Arrêté n°2026-0401/MESRS-SG du 11 mars 2026',
  },
  rating: { score: 4.6, reviews: 39 },
  mapsUrl:
    'https://www.google.com/maps/dir//Institut+Priv%C3%A9+de+Formation+Sanitaire+Bernard+Kouchner,+Hippodrome+1,+Bamako',
};

export const stats = [
  { value: '4', suffix: 'e', label: 'Promotion diplômée', detail: 'Cérémonie du 9 mai 2026' },
  { value: '14', suffix: '', label: 'Formations', detail: 'Du DEF au niveau master' },
  { value: '95,65', suffix: '%', label: 'Réussite BT-Santé 2026', detail: '22 admis sur 23' },
  { value: '4,6', suffix: '/5', label: 'Note Google', detail: '39 avis vérifiés' },
];

export const formations = [
  {
    slug: 'kinesitherapie',
    titre: 'Kinésithérapie',
    categorie: 'Santé',
    niveau: 'BAC',
    duree: 'Nous consulter',
    mode: 'En présentiel',
    tarif: '450 000 FCFA',
    resume:
      'Étudiez la prévention, la rééducation fonctionnelle et l’accompagnement de la mobilité des patients.',
    image: '/img/formations/kine.jpg',
    populaire: true,
    programme:
      'La formation en kinésithérapie développe des connaissances en anatomie, physiologie, biomécanique, évaluation fonctionnelle et techniques de rééducation.',
    debouches: ['Centres de rééducation fonctionnelle', 'Hôpitaux et cliniques', 'Cabinets de kinésithérapie', 'Structures sportives et médico-sociales'],
  },
  {
    slug: 'infirmier-sante-publique',
    titre: 'Infirmier en santé publique',
    categorie: 'Soins infirmiers',
    niveau: 'DEF',
    duree: '3 ans',
    mode: 'En présentiel',
    tarif: '290 000 FCFA',
    resume:
      'Formez-vous aux soins, à la prévention et aux actions de santé menées au bénéfice des communautés.',
    image: '/img/formations/infirmier.jpg',
    programme:
      'Un parcours orienté soins de proximité, prévention, éducation à la santé et travail en équipe au sein des CSCom et structures communautaires.',
    debouches: ['CSCom et CS réf.', 'Hôpitaux de district', 'Programmes de santé communautaire', 'ONG et organisations humanitaires'],
  },
  {
    slug: 'sante-maternelle-infantile',
    titre: 'Santé maternelle et infantile',
    sousTitre: 'Infirmier(ère) obstétricien(ne)',
    categorie: 'Santé',
    niveau: 'DEF',
    duree: '3 ans',
    mode: 'En présentiel',
    tarif: '290 000 FCFA',
    resume:
      'Développez les compétences nécessaires à l’accompagnement de la mère, du nouveau-né et de l’enfant.',
    image: '/img/care.jpg',
    populaire: true,
    programme:
      'Suivi de grossesse, accouchement, soins essentiels au nouveau-né, planification familiale et accompagnement de la famille.',
    debouches: ['Maternités et CSCom', 'Hôpitaux et cliniques', 'Programmes de santé maternelle', 'Centres de PMI'],
  },
  {
    slug: 'technicien-laboratoire-pharmacie-tlp',
    titre: 'Technicien de laboratoire et de pharmacie',
    sousTitre: 'TLP',
    categorie: 'Santé',
    niveau: 'DEF',
    duree: '3 ans',
    mode: 'En présentiel',
    tarif: '290 000 FCFA',
    resume:
      'Préparez-vous aux activités techniques de laboratoire, de pharmacie et de contrôle sanitaire.',
    image: '/img/lab.jpg',
    populaire: true,
    programme:
      'Prélèvements, analyses de routine, hygiène et sécurité au laboratoire, gestion des médicaments et contrôle sanitaire.',
    debouches: ['Laboratoires d’analyses', 'Pharmacies et dépôts', 'Hôpitaux et CSCom', 'Structures de contrôle qualité'],
  },
  {
    slug: 'aide-soignant',
    titre: 'Aide-soignant',
    categorie: 'Santé',
    niveau: 'DEF',
    duree: '12 mois',
    mode: 'En présentiel',
    tarif: '100 000 FCFA',
    resume:
      'Acquérez les compétences essentielles pour accompagner les patients et assister l’équipe soignante.',
    image: '/img/hero.jpg',
    populaire: true,
    programme:
      'Hygiène et confort du patient, surveillance des constantes, aide aux soins, accueil et relation de soin.',
    debouches: ['Hôpitaux et cliniques', 'Maternités', 'Cabinets médicaux', 'Services de soins à domicile'],
  },
  {
    slug: 'infirmier-detat',
    titre: 'Infirmier d’État',
    categorie: 'Santé',
    niveau: 'BAC',
    duree: '3 ans',
    mode: 'En présentiel',
    tarif: '410 000 FCFA',
    resume:
      'Formez-vous au métier d’Infirmier d’État et assurez des soins de qualité aux patients, aux familles et aux communautés.',
    image: '/img/formations/infirmier.jpg',
    programme:
      'Soins infirmiers médicaux et chirurgicaux, urgences, santé publique, encadrement et démarche qualité.',
    debouches: ['CHU et hôpitaux', 'Cliniques privées', 'Urgences et réanimation', 'Santé scolaire et du travail'],
  },
  {
    slug: 'sage-femme-detat',
    titre: 'Sage-femme d’État',
    categorie: 'Santé',
    niveau: 'BAC',
    duree: '3 ans',
    mode: 'En présentiel',
    tarif: '410 000 FCFA',
    resume:
      'Participez à la santé de la mère, du nouveau-né et de la famille à travers une formation complète et orientée vers la pratique.',
    image: '/img/care.jpg',
    programme:
      'Obstétrique, suivi de grossesse à risque, réanimation néonatale, planification familiale et pratique hospitalière.',
    debouches: ['Maternités hospitalières', 'CSCom et CS réf.', 'Programmes SR/PF', 'Cabinets de sages-femmes'],
  },
  {
    slug: 'biologie-medicale',
    titre: 'Biologie Médicale',
    categorie: 'Santé',
    niveau: 'BAC',
    duree: '3 ans',
    mode: 'En présentiel',
    tarif: '410 000 FCFA',
    resume:
      'Préparez-vous aux techniques d’analyses biologiques indispensables au diagnostic et au suivi médical.',
    image: '/img/lab.jpg',
    programme:
      'Hématologie, biochimie, microbiologie, immunologie et assurance qualité au laboratoire d’analyses.',
    debouches: ['Laboratoires hospitaliers', 'Laboratoires privés', 'Recherche biomédicale', 'Programmes de veille sanitaire'],
  },
  {
    slug: 'nutrition-dietetique',
    titre: 'Nutrition Diététique',
    categorie: 'Santé et Nutrition',
    niveau: 'BAC',
    duree: '6 semestres',
    mode: 'En présentiel',
    tarif: '450 000 FCFA',
    resume:
      'Licence professionnelle pour la prise en charge nutritionnelle et la prévention des maladies liées à l’alimentation.',
    image: '/img/campus.jpg',
    populaire: true,
    programme:
      'Prise en charge nutritionnelle, prévention des maladies liées à l’alimentation et promotion d’une hygiène alimentaire adaptée aux réalités sanitaires.',
    debouches: ['Hôpitaux et centres de santé', 'Programmes nutrition et sécurité alimentaire', 'Agro-alimentaire et qualité', 'Conseil et éducation nutritionnelle'],
  },
  {
    slug: 'delegue-medical',
    titre: 'Délégué Médical',
    sousTitre: 'Licence Professionnelle en Promotion Médicale',
    categorie: 'Marketing médical',
    niveau: 'BAC',
    duree: '6 mois',
    mode: 'En présentiel',
    tarif: '450 000 FCFA',
    resume:
      'Une formation complète alliant compétences scientifiques, techniques de vente et expérience terrain pour intégrer le secteur pharmaceutique.',
    image: '/img/team-3.jpg',
    populaire: true,
    programme:
      'Pharmacologie appliquée, promotion des produits pharmaceutiques, communication avec les professionnels de santé, techniques de vente et éthique professionnelle.',
    debouches: ['Laboratoires pharmaceutiques', 'Réseaux de distribution', 'Marketing médical', 'Visite médicale et formation'],
  },
  {
    slug: 'superviseur-promotion-medicale',
    titre: 'Superviseur en promotion médicale',
    categorie: 'Promotion médicale',
    niveau: 'Formation continue',
    duree: '90 jours',
    mode: 'Hybride',
    tarif: '250 000 FCFA',
    resume:
      'Passez du terrain au pilotage d’équipe et apprenez à accompagner la performance des délégués médicaux.',
    image: '/img/graduation.jpg',
    programme:
      'Management d’équipe de délégués, planification des tournées, indicateurs de performance et coaching terrain.',
    debouches: ['Supervision d’équipes de vente', 'Direction régionale', 'Formation interne', 'Consultance commerciale santé'],
  },
  {
    slug: 'art-oratoire-sirius-rhetorique',
    titre: 'Art oratoire',
    sousTitre: 'Sirius Rhétorique Club',
    categorie: 'Langues et communication',
    niveau: 'Tous niveaux',
    duree: 'Nous consulter',
    mode: 'En présentiel',
    tarif: 'Sur demande',
    resume:
      'Maîtrisez votre voix, votre posture et votre message pour prendre la parole avec confiance et convaincre votre public.',
    image: '/img/graduation.jpg',
    populaire: true,
    programme:
      'Prise de parole en public, structuration du discours, gestion du trac, argumentation et posture professionnelle.',
    debouches: ['Concours et oraux', 'Soutenance et présentations', 'Leadership étudiant', 'Communication professionnelle'],
  },
  {
    slug: 'club-anglais',
    titre: 'Club d’anglais',
    categorie: 'Langues et communication',
    niveau: 'Tous niveaux',
    duree: 'Nous consulter',
    mode: 'Hybride',
    tarif: 'Sur demande',
    resume:
      'Progressez en anglais dans un cadre vivant, pratique et convivial, quel que soit votre niveau de départ.',
    image: '/img/campus.jpg',
    programme:
      'Anglais médical, conversation, compréhension orale et écrite, préparation aux échanges et publications scientifiques.',
    debouches: ['Anglais médical', 'Études à l’étranger', 'ONG internationales', 'Publications scientifiques'],
  },
  {
    slug: 'vendeur-pharmacie-secretaire-medicale',
    titre: 'Vendeur en pharmacie et secrétaire médical(e)',
    categorie: 'Pharmacie et administration sanitaire',
    niveau: 'DEF',
    duree: '12 mois',
    mode: 'En présentiel',
    tarif: '125 000 FCFA',
    resume:
      'Une formation polyvalente pour accueillir, informer et assurer le suivi administratif dans une structure de santé.',
    image: '/img/formations/infirmier.jpg',
    programme:
      'Accueil et orientation des patients, gestion du dossier médical, tenue de caisse, stock pharmaceutique et communication.',
    debouches: ['Pharmacies et dépôts', 'Cabinets et cliniques', 'Secrétariat médical', 'Accueil hospitalier'],
  },
];

export const categories = [
  'Toutes',
  'Santé',
  'Soins infirmiers',
  'Santé et Nutrition',
  'Pharmacie et administration sanitaire',
  'Marketing médical',
  'Promotion médicale',
  'Langues et communication',
];

export const niveaux = ['Tous', 'DEF', 'BAC', 'Formation continue', 'Tous niveaux'];
export const modes = ['Tous', 'En présentiel', 'En ligne', 'Hybride'];

export const articles = [
  {
    slug: 'licence-professionnelle-kinesitherapie-rentree-novembre-2026',
    titre: 'Licence professionnelle en kinésithérapie : rentrée le 23 novembre 2026',
    categorie: 'Formations',
    auteur: 'Institut Bernard Kouchner',
    date: '2026-11-05',
    image: '/img/formations/kine.jpg',
    aLaUne: true,
    chapo:
      'L’Institut Privé de Formation Sanitaire Bernard Kouchner lance à Bamako une licence professionnelle en kinésithérapie. Les inscriptions sont ouvertes pour la rentrée du 23 novembre 2026.',
    corps: [
      'Apprendre à évaluer un mouvement, accompagner une rééducation et aider un patient à retrouver son autonomie : c’est le métier auquel prépare la nouvelle licence professionnelle en kinésithérapie de l’IFS-BK.',
      'La formation dure trois ans, répartis sur six semestres. Elle associe cours, travaux pratiques et stages cliniques. Le programme aborde notamment l’anatomie et la physiologie, la biomécanique, la rééducation en traumatologie et en orthopédie, la neurologie et la kinésithérapie respiratoire.',
      'Les enseignements se déroulent au sein de l’Institut Privé de Formation Sanitaire Bernard Kouchner, établissement agréé, et préparent à une licence professionnelle reconnue.',
      'Les cours débutent le 23 novembre 2026. Les inscriptions se poursuivent : contactez l’équipe de l’Institut pour connaître les conditions d’admission et les pièces à fournir.',
    ],
    tempsLecture: 4,
  },
  {
    slug: 'resultats-admission-bt-sante-2026',
    titre: 'Résultats d’admission au BT-Santé 2026',
    categorie: 'Vie académique',
    auteur: 'La Direction des Études',
    date: '2026-09-25',
    image: '/img/graduation.jpg',
    aLaUne: true,
    chapo:
      '22 candidats admis sur 23 au BT-Santé 2026, soit 95,65 % de réussite. Santé Publique et TLP affichent 100 % de réussite.',
    corps: [
      'Une belle performance pour l’IFS-BK : 22 candidats admis sur 23 au BT-Santé 2026, soit 95,65 % de réussite. Santé Publique et TLP affichent 100 % de réussite.',
      'Félicitations à toute la promotion, aux formateurs et aux équipes d’encadrement qui accompagnent les apprenants au quotidien.',
    ],
    tempsLecture: 3,
  },
  {
    slug: 'vacances-academiques-2026-formations-gratuites-bamako',
    titre: 'Vacances Académiques 2026 : formez-vous gratuitement pendant les vacances',
    categorie: 'Vie académique',
    auteur: 'Institut Bernard Kouchner',
    date: '2026-08-15',
    image: '/img/campus.jpg',
    chapo:
      'Du 10 août au 22 septembre 2026, rejoignez gratuitement les Vacances Académiques de l’IPFS-BK à Bamako. Places limitées.',
    corps: [
      'Du 10 août au 22 septembre 2026, l’Institut ouvre gratuitement ses Vacances Académiques : ateliers pratiques, initiation aux gestes de premiers secours, communication professionnelle et découverte des métiers de la santé.',
      'Les places sont limitées. L’inscription se fait auprès de l’équipe d’accompagnement candidat.',
    ],
    tempsLecture: 3,
  },
  {
    slug: 'inscriptions-rentree-2026-2027-ecole-sante-bamako',
    titre: 'Rentrée 2026-2027 : les inscriptions sont ouvertes à l’IPFS-BK',
    categorie: 'Vie académique',
    auteur: 'Institut Bernard Kouchner',
    date: '2026-08-15',
    image: '/img/hero.jpg',
    chapo:
      'Inscrivez-vous à l’IPFS-BK à Bamako : infirmier, sage-femme, kinésithérapie, biologie, nutrition et promotion médicale.',
    corps: [
      'Les inscriptions pour la rentrée académique 2026-2027 sont ouvertes. L’Institut accueille les candidats de niveau DEF, BAC et professionnels en formation continue.',
      'Le dossier comprend quatre photos d’identité récentes, une demande timbrée adressée au Directeur de l’Institut, une copie de l’acte de naissance et une copie légalisée du diplôme requis.',
      'Les frais peuvent être réglés par versement ou virement bancaire sur le compte BNDA 490001201401.',
    ],
    tempsLecture: 4,
  },
  {
    slug: 'sous-legide-de-la-bravoure-la-promotion-feu-general-sadio-camara',
    titre: 'Sous l’égide de la bravoure : la Promotion « Feu Général Sadio Camara » prend son envol',
    categorie: 'Vie étudiante',
    auteur: 'Institut Privé de Formation Bernard Kouchner',
    date: '2026-05-14',
    image: '/img/graduation.jpg',
    chapo:
      'Bamako, le 9 mai 2026 — l’IPFS-BK a célébré la sortie de sa 4ème promotion, qui porte désormais le nom de feu le Général de Corps d’Armée Sadio Camara.',
    corps: [
      'Bamako, le 9 Mai 2026 – Le ciel de Bamako semblait porter samedi dernier le poids de la solennité et de l’espérance. Dans une émotion palpable, l’Institut Privé de Formation Sanitaire Bernard Kouchner (IPFS-BK) a célébré la sortie de sa 4ème promotion.',
      'Une promotion qui porte désormais un nom synonyme de rigueur et de don de soi : celui de feu le Général de Corps d’Armée Sadio Camara.',
      'La cérémonie a réuni familles, formateurs, partenaires hospitaliers et autorités, autour des diplômés désormais engagés sur le terrain.',
    ],
    tempsLecture: 5,
  },
  {
    slug: 'ligue-universitaire-de-bamako',
    titre: 'L’Institut Bernard Kouchner remporte la première Ligue Universitaire de Bamako',
    categorie: 'Vie étudiante',
    auteur: 'Institut Bernard Kouchner',
    date: '2025-08-26',
    image: '/img/campus.jpg',
    chapo:
      'Une première édition mémorable : les étudiants de l’Institut Bernard Kouchner décrochent la coupe de la Ligue Universitaire de Bamako.',
    corps: [
      'Une première édition mémorable : les étudiants de l’Institut Bernard Kouchner décrochent la coupe de la Ligue Universitaire de Bamako.',
      'Une victoire qui illustre l’esprit d’équipe et l’engagement des apprenants au-delà des salles de cours.',
    ],
    tempsLecture: 2,
  },
  {
    slug: 'club-toastmasters-communication-leadership',
    titre: 'Lancement du Club Toastmasters de l’Institut Bernard Kouchner',
    categorie: 'Formations',
    auteur: 'Institut Bernard Kouchner',
    date: '2023-08-21',
    image: '/img/team-3.jpg',
    chapo:
      'Un espace d’apprentissage consacré à l’éloquence, à la confiance en soi, au leadership et à la communication professionnelle.',
    corps: [
      'Le Club Toastmasters ouvre un espace d’apprentissage consacré à l’éloquence, à la confiance en soi, au leadership et à la communication professionnelle.',
      'Les séances sont ouvertes aux étudiants de tous niveaux et aux professionnels de santé souhaitant renforcer leur aisance à l’oral.',
    ],
    tempsLecture: 3,
  },
  {
    slug: 'programme-vacances-academiques',
    titre: 'Programme de vacances académiques : apprendre autrement',
    categorie: 'Communiqués',
    auteur: 'Institut Bernard Kouchner',
    date: '2023-07-24',
    image: '/img/hero.jpg',
    chapo:
      'Un programme associant apprentissage, activités éducatives et moments de découverte pendant les vacances académiques.',
    corps: [
      'Un programme associant apprentissage, activités éducatives et moments de découverte pendant les vacances académiques.',
      'Objectif : maintenir la curiosité, consolider les acquis et faire découvrir les métiers de la santé autrement.',
    ],
    tempsLecture: 2,
  },
  {
    slug: 'delegue-medical-metier-formation',
    titre: 'Délégué médical : un métier au carrefour de la santé et de la communication',
    categorie: 'Métiers de la santé',
    auteur: 'Institut Bernard Kouchner',
    date: '2022-10-14',
    image: '/img/formations/infirmier.jpg',
    chapo:
      'Découvrez le rôle du délégué médical et les compétences développées par la formation de l’Institut Bernard Kouchner.',
    corps: [
      'Le délégué médical fait le lien entre les laboratoires pharmaceutiques et les professionnels de santé : information scientifique, promotion éthique et écoute du terrain.',
      'La formation de l’Institut développe les compétences en pharmacologie, communication, techniques de vente et éthique professionnelle.',
    ],
    tempsLecture: 4,
  },
  {
    slug: 'resultats-academiques-2021-2022',
    titre: 'Résultats académiques 2021–2022 de l’Institut Bernard Kouchner',
    categorie: 'Vie académique',
    auteur: 'Institut Bernard Kouchner',
    date: '2022-07-30',
    image: '/img/lab.jpg',
    chapo:
      'Archive de l’annonce consacrée aux résultats des différentes filières pour l’année académique 2021–2022.',
    corps: [
      'Archive de l’annonce consacrée aux résultats des différentes filières pour l’année académique 2021–2022.',
      'Les résultats par filière sont consultables auprès de la Direction des études.',
    ],
    tempsLecture: 1,
  },
  {
    slug: 'certification-premiere-promotion-delegues-medicaux-pharmaceutiques',
    titre: 'Certification de la première promotion de délégués médicaux et pharmaceutiques',
    categorie: 'Vie académique',
    auteur: 'Institut Bernard Kouchner',
    date: '2022-07-25',
    image: '/img/graduation.jpg',
    chapo:
      'Retour sur la certification de la première promotion de délégués médicaux et pharmaceutiques de l’Institut Bernard Kouchner.',
    corps: [
      'Retour sur la certification de la première promotion de délégués médicaux et pharmaceutiques de l’Institut Bernard Kouchner.',
      'Une étape fondatrice pour la filière promotion médicale, aujourd’hui l’un des parcours phares de l’Institut.',
    ],
    tempsLecture: 3,
  },
];

export const testimonials = [
  {
    nom: 'Étudiant IPFS-BK',
    formation: 'Formation continue',
    note: 5,
    texte: 'Formation à l’ère 4.0 👍',
  },
  {
    nom: 'Diplômé en délégation médicale',
    formation: 'Délégué médical',
    note: 5,
    texte:
      'La formation de délégué médical à l’institut Bernard Kouchner m’a non seulement été bénéfique mais m’a aussi permis une insertion professionnelle rapide et garantie grâce à la qualité de la formation et à l’étendue de son réseau.',
  },
  {
    nom: 'Étudiant en promotion médicale',
    formation: 'Promotion médicale',
    note: 5,
    texte:
      'Je suis très satisfait de la formation en délégation médicale suivie à l’Institut Bernard Kouchner de Bamako. Les modules étaient bien organisés, pratiques et en adéquation avec les exigences du métier. Les formateurs étaient compétents, disponibles et toujours prêts à partager leur expérience. Cette formation m’a permis de développer mes compétences en promotion des produits pharmaceutiques, communication avec les professionnels de santé et éthique professionnelle.',
  },
];

export const valeurs = [
  { icon: 'ShieldCheck', titre: 'Souveraineté', texte: 'Renforcer la formation et l’expertise locales pour répondre durablement aux besoins sanitaires.' },
  { icon: 'HandHeart', titre: 'Solidarité', texte: 'Favoriser le partage d’expériences, l’entraide et la coopération entre les acteurs du Sahel.' },
  { icon: 'Lightbulb', titre: 'Innovation', texte: 'Encourager la créativité, la recherche et l’entrepreneuriat au service de la santé.' },
  { icon: 'Globe2', titre: 'Éthique et humanisme', texte: 'Agir avec intégrité, respect, responsabilité et compassion envers chaque personne.' },
];

export const piliers = [
  { num: '01', titre: 'Formation initiale et continue', texte: 'Des parcours diplômants et professionnalisants dans les métiers de la santé.' },
  { num: '02', titre: 'Recherche et innovation', texte: 'Santé publique, prévention et innovation pédagogique au service du terrain.' },
  { num: '03', titre: 'Incubation & capacités', texte: 'Renforcement des compétences des professionnels et des organisations.' },
  { num: '04', titre: 'Coopération scientifique', texte: 'Mali et espace sahélien : partager, publier et former ensemble.' },
];

export const equipe = [
  {
    nom: 'Chaka Ousmane TRAORE',
    role: 'Directeur Général (CEO)',
    email: 'mediphare5@gmail.com',
    image: '/img/team-1.jpg',
  },
  {
    nom: 'Binta Rose DEMBELE',
    role: 'Directrice Administrative et Financière',
    email: 'bintarosed@gmail.com',
    image: '/img/team-2.jpg',
  },
  {
    nom: 'Bakary Samake',
    role: 'Directeur des Études',
    email: 'samdigital838@gmail.com',
    image: '/img/team-3.jpg',
  },
];

export const terrains = ['CHU Gabriel Touré', 'Hôpital de Kati', 'INSP', 'CNTS', 'CS Réf & CSCom'];

export const events = [
  {
    titre: 'Journée portes ouvertes — Hippodrome 1',
    date: '2026-11-23',
    heure: '09:00 — 17:00',
    lieu: 'Campus IPFS-BK, Hippodrome 1',
    type: 'Orientation',
    texte: 'Rencontrez les formateurs, visitez les laboratoires et déposez votre dossier sur place.',
  },
  {
    titre: 'Rentrée de la licence en kinésithérapie',
    date: '2026-11-23',
    heure: '08:00',
    lieu: 'Amphi principal',
    type: 'Rentrée',
    texte: 'Ouverture officielle de la première promotion de la licence professionnelle en kinésithérapie.',
  },
  {
    titre: 'Certification de la promotion 2026',
    date: '2027-05-08',
    heure: '16:00',
    lieu: 'Palais de la Culture, Bamako',
    type: 'Cérémonie',
    texte: 'Remise des diplômes à la 5ème promotion de l’IPFS-BK, entourée des familles et partenaires.',
  },
];

export const bourses = [
  {
    titre: 'Bourse d’excellence IPFS-BK',
    montant: 'Jusqu’à 40 % des frais de scolarité',
    criteres: 'Moyenne générale ≥ 14/20 et assiduité exemplaire sur le semestre.',
    places: '5 par promotion',
    badge: 'Mérite',
  },
  {
    titre: 'Bourse Talents Santé Publique',
    montant: 'Jusqu’à 30 % des frais',
    criteres: 'Candidats DEF/BAC engagés dans un projet communautaire de santé.',
    places: '8 par rentrée',
    badge: 'Engagement',
  },
  {
    titre: 'Facilités de paiement BNDA',
    montant: 'Paiement en 3 échéances',
    criteres: 'Versement ou virement sur le compte BNDA 490001201401, sur demande motivée.',
    places: 'Toutes filières',
    badge: 'Accessibilité',
  },
];

export const galerie = [
  { src: '/img/hero.jpg', legende: 'Travaux pratiques en simulation' },
  { src: '/img/campus.jpg', legende: 'Campus — Hippodrome 1' },
  { src: '/img/care.jpg', legende: 'Santé maternelle et infantile' },
  { src: '/img/lab.jpg', legende: 'Laboratoire de biologie médicale' },
  { src: '/img/graduation.jpg', legende: 'Cérémonie de la 4e promotion' },
  { src: '/img/formations/kine.jpg', legende: 'Rééducation fonctionnelle' },
];

export const faq = [
  {
    q: 'Quelles pièces fournir pour un dossier d’inscription ?',
    r: 'Quatre photos d’identité récentes, une demande timbrée adressée au Directeur de l’Institut, une copie de l’acte de naissance et une copie légalisée du diplôme requis.',
  },
  {
    q: 'Comment régler les frais de formation ?',
    r: 'Par versement ou virement bancaire sur le compte BNDA de l’Institut : 490001201401. Des échéanciers peuvent être étudiés par la Direction administrative et financière.',
  },
  {
    q: 'L’Institut est-il officiellement autorisé ?',
    r: 'Oui. Création par Décision n°2023-000211/MESRS-SG du 07 février 2023 et ouverture par Arrêté n°2026-0401/MESRS-SG du 11 mars 2026.',
  },
  {
    q: 'Les stages sont-ils prévus au programme ?',
    r: 'Les stages commencent dès la fin du premier semestre de la première année, selon la filière : CHU Gabriel Touré, Hôpital de Kati, INSP, CNTS, CS Réf et CSCom.',
  },
  {
    q: 'Peut-on suivre une formation en ligne ?',
    r: 'Plusieurs parcours sont proposés en présentiel, en hybride (art oratoire, superviseur en promotion médicale, club d’anglais) ou en ligne, selon la filière.',
  },
];

export const staffAccounts = [
  {
    email: 'direction@ipfs-bk.ml',
    password: 'direction2026',
    nom: 'Bakary Samake',
    role: 'Direction des Études',
    initiales: 'BS',
  },
  {
    email: 'staff@ipfs-bk.ml',
    password: 'staff2026',
    nom: 'Aminata Traoré',
    role: 'Personnel — Scolarité',
    initiales: 'AT',
  },
];

export const mobileFeatures = [
  { icon: 'CalendarCheck', titre: 'Emploi du temps', texte: 'La semaine en un coup d’œil, avec rappels avant chaque cours.' },
  { icon: 'ClipboardList', titre: 'Notes & bulletins', texte: 'Consultation des évaluations et bulletins téléchargeables.' },
  { icon: 'Wallet', titre: 'Scolarité & paiements', texte: 'Suivi des échéances, reçus et versements BNDA.' },
  { icon: 'MessageSquare', titre: 'Messagerie', texte: 'Échanges directs avec la scolarité et les formateurs.' },
  { icon: 'BellRing', titre: 'Notifications', texte: 'Absences, convocations et annonces en temps réel.' },
  { icon: 'Fingerprint', titre: 'Accès sécurisé', texte: 'Espace personnel protégé, parents et personnel inclus.' },
];

export const mobileScreens = [
  { titre: 'Accueil personnel', detail: 'Vue du jour' },
  { titre: 'Notes', detail: 'Moyennes & bulletins' },
  { titre: 'Scolarité', detail: 'Échéances BNDA' },
  { titre: 'Messagerie', detail: 'Scolarité & formateurs' },
];
