<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <title>Politique de confidentialité — Kalanso</title>
    <style>
        :root {
            --bg: #0b1030;
            --surface: #121737;
            --surface-alt: #181e42;
            --line: rgba(167, 182, 255, 0.16);
            --ink: #eef0ff;
            --faint: #9aa1cd;
            --accent: #8fa6ff;
        }
        * { box-sizing: border-box; margin: 0; }
        body {
            background: radial-gradient(1200px 500px at 50% -10%, rgba(91, 124, 250, 0.22), transparent), var(--bg);
            color: var(--ink);
            font: 15px/1.65 -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            padding: 40px 18px 64px;
        }
        .page { max-width: 780px; margin: 0 auto; }
        header { display: flex; align-items: center; gap: 14px; margin-bottom: 28px; }
        .badge {
            width: 46px; height: 46px; border-radius: 12px;
            background: linear-gradient(140deg, #5b7cfa, #3344aa);
            display: grid; place-items: center;
            font-weight: 800; font-size: 22px; color: #fff;
        }
        h1 { font-size: 22px; letter-spacing: 0.2px; }
        .updated { color: var(--faint); font-size: 12px; margin-top: 2px; }
        section {
            background: var(--surface);
            border: 1px solid var(--line);
            border-radius: 14px;
            padding: 18px 20px;
            margin-bottom: 14px;
        }
        h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 1.3px; color: var(--accent); margin-bottom: 8px; }
        p, li { color: var(--ink); font-size: 14px; }
        ul { padding-left: 20px; display: grid; gap: 4px; }
        strong { color: #fff; }
        footer { color: var(--faint); font-size: 12px; margin-top: 22px; text-align: center; }
        a { color: var(--accent); }
    </style>
</head>
<body>
<div class="page">
    <header>
        <div class="badge">K</div>
        <div>
            <h1>Politique de confidentialité — Kalanso</h1>
            <div class="updated">Dernière mise à jour : 5 novembre 2026 · Application Kalanso (mobile et poste de l'établissement)</div>
        </div>
    </header>

    <section>
        <h2>Responsable de traitement</h2>
        <p>L'application Kalanso est éditée pour le compte de l'<strong>établissement scolaire</strong> qui l'utilise (« l'Établissement »), responsable des données traitées. Kalanso est l'outil de gestion scolaire de l'Établissement : scolarité, notes, absences, finances et communication avec les familles.</p>
    </section>

    <section>
        <h2>Données traitées</h2>
        <ul>
            <li><strong>Comptes</strong> : nom, prénom, adresse e-mail, rôle (direction, secrétariat, comptabilité, enseignant, parent) et mot de passe <strong>haché</strong> (jamais conservé en clair).</li>
            <li><strong>Élèves</strong> (sur instruction de l'Établissement) : identité scolaire, classe, notes et bulletins, absences et justifications, factures et paiements.</li>
            <li><strong>Techniques</strong> : journaux de sécurité (connexions réussies et échouées, modifications sensibles) conservés à des fins d'audit interne.</li>
        </ul>
        <p style="margin-top:8px;">Aucun cookie publicitaire, aucun outil de mesure d'audience, aucune vente de données.</p>
    </section>

    <section>
        <h2>Finalités et base légale</h2>
        <p>Les données sont traitées exclusivement pour la <strong>gestion de la scolarité</strong> (inscription, pédagogie, assiduité, facturation, communication école–familles). Base légale : exécution des missions éducatives et administratives de l'Établissement et intérêt légitime à sécuriser ses accès (RGPD, art. 6(1)(e) et (f)).</p>
    </section>

    <section>
        <h2>Destinataires et hébergement</h2>
        <p>Les données ne sont accessibles que par le personnel habilité de l'Établissement, selon les droits attachés à chaque rôle. Un parent ne peut consulter que les données de <strong>ses propres enfants</strong> (liaison vérifiée côté serveur ; les élèves non liés sont invisibles). L'hébergement est assuré par <strong>LWS (France)</strong>, sous-traitant technique de l'Établissement ; aucune donnée n'est transmise à d'autres tiers.</p>
    </section>

    <section>
        <h2>Sécurité</h2>
        <ul>
            <li>Chiffrement en transit (HTTPS) pour l'application et le site.</li>
            <li>Jetons d'accès révocables (changer un mot de passe ferme toutes les autres sessions) ; le jeton du mobile est stocké dans le <strong>trousseau sécurisé</strong> de l'appareil.</li>
            <li>Mots de passe : 10 caractères minimum, hachage bcrypt.</li>
            <li>Journaux d'audit des connexions et actions sensibles.</li>
        </ul>
    </section>

    <section>
        <h2>Durées de conservation</h2>
        <p>Les données scolaires sont conservées pendant la durée de scolarité de l'élève, puis selon les durées d'archivage légales applicables à l'Établissement (notamment comptables). Les journaux de sécurité sont conservés 24 mois maximum.</p>
    </section>

    <section>
        <h2>Vos droits</h2>
        <p>Vous pouvez demander l'accès, la rectification, l'effacement ou la limitation du traitement de vos données, ainsi qu'opposition pour motif légitime, en vous adressant à la <strong>direction de l'Établissement</strong> (coordonnées affichées dans votre espace). Vous pouvez saisir l'autorité de protection des données de votre pays en cas de contestation.</p>
    </section>

    <section>
        <h2>Application mobile</h2>
        <p>L'application Kalanso (Android) communique avec le serveur de l'Établissement via HTTPS. Elle n'accède ni à vos contacts, ni à votre appareil photo/caméra, ni à votre position. La désinstallation retire le jeton local ; les données restent sur le serveur de l'Établissement jusqu'à leur effacement par ce dernier.</p>
    </section>

    <footer>Kalanso — gestion scolaire de l'Établissement · Page publique, aucune donnée personnelle collectée ici.</footer>
</div>
</body>
</html>
