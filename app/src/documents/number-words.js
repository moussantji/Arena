/* ============================================================
   Kalanso — nombre en lettres (français)
   Utilisé pour les montants en toutes lettres sur les reçus.
   Gère : quatre-vingt(s), soixante-dix, cent(s), mille,
   million(s), milliard(s).
   ============================================================ */

const ONES = [
  'zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept',
  'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze',
  'quinze', 'seize',
];

function belowHundred(n, terminal = true) {
  if (n < 17) return ONES[n];
  if (n < 20) return `dix-${ONES[n - 10]}`;

  const tens = Math.floor(n / 10);
  const rest = n % 10;

  if (tens < 7) {
    const prefix = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante'][tens];
    if (rest === 0) return prefix;
    return `${prefix}${rest === 1 ? ' et ' : '-'}${ONES[rest]}`;
  }

  if (tens === 7) {
    if (rest === 0) return 'soixante-dix';
    if (rest === 1) return 'soixante et onze';
    return `soixante-${belowHundred(10 + rest)}`;
  }

  if (tens === 8) {
    if (rest === 0) return terminal ? 'quatre-vingts' : 'quatre-vingt';
    return `quatre-vingt-${ONES[rest]}`;
  }

  // tens === 9
  if (rest === 0) return 'quatre-vingt-dix';
  return `quatre-vingt-${belowHundred(10 + rest)}`;
}

function belowThousand(n, terminal = true) {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const parts = [];

  if (hundreds) {
    if (hundreds === 1) parts.push('cent');
    else {
      // « deux cents » seulement quand rien ne suit (jamais devant « mille »).
      parts.push(terminal && rest === 0 ? `${ONES[hundreds]} cents` : `${ONES[hundreds]} cent`);
    }
  }
  if (rest) parts.push(belowHundred(rest, terminal));
  return parts.join(' ');
}

const GROUPS = [
  { size: 1e9, singular: 'milliard', plural: 'milliards' },
  { size: 1e6, singular: 'million', plural: 'millions' },
  { size: 1e3, singular: 'mille', plural: 'mille' }, // « mille » est invariable
];

export function numberToWordsFr(value) {
  const n = Math.floor(Math.abs(Number(value) || 0));
  if (n === 0) return 'zéro';

  let remaining = n;
  const parts = [];
  for (const group of GROUPS) {
    const count = Math.floor(remaining / group.size);
    remaining %= group.size;
    if (!count) continue;
    if (group.size === 1e3) {
      // « mille » suit toujours : pas de pluriel sur cent/vingt au sein du groupe.
      parts.push(count === 1 ? 'mille' : `${belowThousand(count, false)} mille`);
    } else {
      const words = count === 1 ? 'un' : belowThousand(count);
      parts.push(`${words} ${count > 1 ? group.plural : group.singular}`);
    }
  }
  if (remaining) parts.push(belowThousand(remaining, true));
  return parts.join(' ');
}

/**
 * Montant en lettres, prêt à imprimer sur un reçu (FCFA entiers).
 * Exemple : 12500 → « Douze mille cinq cents francs CFA ».
 */
export function montantEnLettresFr(amount) {
  const n = Math.round(Math.abs(Number(amount) || 0));
  const words = numberToWordsFr(n);
  return `${words.charAt(0).toUpperCase()}${words.slice(1)} francs CFA`;
}
