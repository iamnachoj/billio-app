import { ExpenseCategory } from '@/lib/models/expense';

// Keyword lists are ES/EN, lowercase, accent-free (input is normalized before matching).
const CATEGORY_KEYWORDS: Array<{
  category: ExpenseCategory;
  keywords: string[];
}> = [
  {
    category: 'eating_out',
    keywords: [
      'restaurante',
      'restaurant',
      'cena',
      'dinner',
      'almuerzo',
      'comida',
      'brunch',
      'comida fuera',
      'menu del dia',
      'cafeteria',
      'tapas',
      'tapeo',
      'sushi',
      'pizza',
      'hamburguesa',
      'burger',
      'kebab',
      'lunch',
    ],
  },
  {
    category: 'groceries',
    keywords: [
      'supermercado',
      'super',
      'mercadona',
      'carrefour',
      'grocery',
      'groceries',
      'compra semanal',
      'alimentacion',
    ],
  },
  {
    category: 'drinks',
    keywords: [
      'cerveza',
      'cervecita',
      'cerve',
      'birra',
      'copas',
      'vino',
      'wine',
      'beer',
      'bar',
      'pub',
      'cocktail',
      'coctel',
      'alcohol',
      'ron',
      'whisky',
      'whiskey',
      'vodka',
      'tequila',
      'mezcal',
    ],
  },
  {
    category: 'home',
    keywords: [
      'alquiler',
      'rent',
      'luz',
      'agua',
      'gas',
      'electricidad',
      'wifi',
      'mueble',
      'furniture',
      'ikea',
      'reforma',
      'tijeras',
      'herramientas',
      'tools',
    ],
  },
  {
    category: 'transport',
    keywords: [
      'gasolina',
      'fuel',
      'metro',
      'autobus',
      'bus',
      'taxi',
      'uber',
      'cabify',
      'parking',
      'peaje',
      'tren',
      'train',
      'coche',
      'car rental',
    ],
  },
  {
    category: 'travel',
    keywords: [
      'vuelo',
      'flight',
      'hotel',
      'viaje',
      'trip',
      'avion',
      'airbnb',
      'excursion',
      'apartment',
    ],
  },
  {
    category: 'entertainment',
    keywords: [
      'cine',
      'cinema',
      'movie',
      'concierto',
      'concert',
      'teatro',
      'theatre',
      'videojuego',
      'videogame',
      'juego',
      'ocio',
      'tennis',
      'escalada',
      'climbing',
      'rocodromo',
      'climbing gym',
      'boulder',
      'paddle',
      'surf',
      'skate',
      'snowboard',
      'ski',
    ],
  },
  {
    category: 'shopping',
    keywords: [
      'ropa',
      'clothes',
      'zapatillas',
      'shoes',
      'amazon',
      'zara',
      'tienda',
      'shopping',
    ],
  },
  {
    category: 'health',
    keywords: [
      'farmacia',
      'pharmacy',
      'medico',
      'doctor',
      'dentista',
      'dentist',
      'hospital',
    ],
  },
  {
    category: 'personal_care',
    keywords: [
      'peluqueria',
      'gimnasio',
      'shampoo',
      'conditioner',
      'soap',
      'toothpaste',
      'toothbrush',
      'gym',
      'spa',
      'manicura',
      'cosmetica',
    ],
  },
  {
    category: 'services',
    keywords: [
      'suscripcion',
      'subscription',
      'seguro',
      'insurance',
      'netflix',
      'spotify',
      'youtube',
      'pago',
      'payment',
      'invoice',
      'gestoria',
    ],
  },
  {
    category: 'gifts',
    keywords: ['regalo', 'gift', 'cumpleanos', 'birthday', 'present'],
  },
];

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .toLowerCase();
}

function levenshteinDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp: number[][] = Array.from({ length: rows }, () =>
    new Array(cols).fill(0)
  );

  for (let i = 0; i < rows; i += 1) {
    dp[i][0] = i;
  }
  for (let j = 0; j < cols; j += 1) {
    dp[0][j] = j;
  }

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[a.length][b.length];
}

// Below 5 letters fuzzy matching gets noisy (e.g. "gas" ~ "das"); tolerance scales with keyword length otherwise.
function maxFuzzyDistance(keywordLength: number): number {
  if (keywordLength < 5) {
    return 0;
  }

  return keywordLength <= 7 ? 1 : 2;
}

function isFuzzyMatch(word: string, keyword: string): boolean {
  const maxDistance = maxFuzzyDistance(keyword.length);
  if (
    maxDistance === 0 ||
    Math.abs(word.length - keyword.length) > maxDistance
  ) {
    return false;
  }

  // Require a shared prefix so we don't match unrelated words that merely share overall letter composition.
  if (word.slice(0, 3) !== keyword.slice(0, 3)) {
    return false;
  }

  return levenshteinDistance(word, keyword) <= maxDistance;
}

export function suggestExpenseCategory(text: string): ExpenseCategory {
  const normalizedText = normalize(text);

  if (!normalizedText.trim()) {
    return 'miscellaneous';
  }

  const words = normalizedText.split(/[^a-z0-9]+/).filter(Boolean);

  for (const { category, keywords } of CATEGORY_KEYWORDS) {
    const matchesKeyword = keywords.some((keyword) => {
      const normalizedKeyword = normalize(keyword);

      if (normalizedText.includes(normalizedKeyword)) {
        return true;
      }

      // Multi-word keywords (e.g. "car rental") skip fuzzy matching; typos there are rarer and harder to bound safely.
      if (normalizedKeyword.includes(' ')) {
        return false;
      }

      return words.some((word) => isFuzzyMatch(word, normalizedKeyword));
    });

    if (matchesKeyword) {
      return category;
    }
  }

  return 'miscellaneous';
}
