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
      'fast food',
      'takeaway',
      'takeout',
      'food delivery',
      'desayuno',
      'breakfast',
      'merienda',
      'cafeteria',
      'bocadillo',
      'sandwich',
      'food truck',
      'helado',
      'ice cream',
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
      'lidl',
      'aldi',
      'eroski',
      'consum',
      'walmart',
      'tesco',
      'supermarket',
      'grocery',
      'groceries',
      'grocery store',
      'compra semanal',
      'alimentacion',
      'compras',
      'panaderia',
      'carniceria',
      'fruteria',
      'verduleria',
      'bakery',
      'butcher',
      'greengrocer',
      'ametller',
      'asian shop',
      'tienda asiatica',
      'tienda de comestibles',
      'grocery store',
      'frutas',
      'verduras',
      'boulangerie',
      'fromagerie',
      'charcuterie',
      'épicerie',
      'queso',
      'grantja',
      'carniceria',
      'pescaderia',
    ],
  },
  {
    category: 'drinks',
    keywords: [
      'cerveza',
      'cervezas',
      'cervecita',
      'cervecitas',
      'cerve',
      'birra',
      'birras',
      'copas',
      'vino',
      'wine',
      'beer',
      'beers',
      'bar',
      'pub',
      'cocktail',
      'coctel',
      'caña',
      'cañas',
      'refresco',
      'refrescos',
      'soft drink',
      'gin',
      'gintonic',
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
      'factura de luz',
      'utility bill',
      'utilities',
      'wifi',
      'mueble',
      'muebles',
      'furniture',
      'ikea',
      'reforma',
      'reparacion',
      'limpieza',
      'household',
      'cleaning supplies',
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
      'bolt',
      'lyft',
      'parking',
      'aparcamiento',
      'peaje',
      'toll',
      'tren',
      'train',
      'cercanias',
      'coche',
      'car rental',
      'alquiler de coche',
      'bicicleta',
      'bike',
      'scooter',
      'patinete',
      'transporte publico',
    ],
  },
  {
    category: 'travel',
    keywords: [
      'vuelo',
      'flight',
      'hotel',
      'hostel',
      'hostal',
      'alojamiento',
      'viaje',
      'trip',
      'avion',
      'airport',
      'airbnb',
      'excursion',
      'crucero',
      'cruise',
      'vacaciones',
      'holiday',
      'luggage',
      'equipaje',
      'apartment',
    ],
  },
  {
    category: 'entertainment',
    keywords: [
      'cine',
      'cinema',
      'movie',
      'pelicula',
      'film',
      'concierto',
      'concert',
      'festival',
      'teatro',
      'theatre',
      'museum',
      'museo',
      'bowling',
      'escape room',
      'karaoke',
      'videojuego',
      'videogame',
      'juego',
      'ocio',
      'amusement park',
      'parque de atracciones',
      'zoo',
      'aquarium',
      'acuario',
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
      'clothing',
      'camiseta',
      'pantalon',
      'vestido',
      'abrigo',
      'bolso',
      'bag',
      'electronics',
      'electronica',
      'tienda de ropa',
      'centro comercial',
      'mall',
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
      'clinica',
      'clinic',
      'medicina',
      'medicine',
      'medicamento',
      'medication',
      'terapia',
      'therapy',
      'optica',
      'optician',
      'analisis',
      'doctor visit',
    ],
  },
  {
    category: 'personal_care',
    keywords: [
      'peluqueria',
      'barberia',
      'barber',
      'haircut',
      'gimnasio',
      'shampoo',
      'champu',
      'conditioner',
      'soap',
      'jabon',
      'toothpaste',
      'toothbrush',
      'gym',
      'spa',
      'manicura',
      'pedicura',
      'cosmetica',
      'cosmetics',
      'skincare',
      'cuidado personal',
      'personal hygiene',
      'desodorante',
      'deodorant',
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
      'prime video',
      'disney plus',
      'icloud',
      'microsoft 365',
      'internet',
      'telefono',
      'phone bill',
      'mobile plan',
      'pago',
      'payment',
      'invoice',
      'factura',
      'membership',
      'membresia',
      'gestoria',
    ],
  },
  {
    category: 'gifts',
    keywords: [
      'regalo',
      'gift',
      'cumpleanos',
      'birthday',
      'present',
      'aniversario',
      'anniversary',
      'wedding gift',
      'regalo de boda',
    ],
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
  const scores = new Map<ExpenseCategory, number>();

  for (const { category, keywords } of CATEGORY_KEYWORDS) {
    let score = 0;
    const matchedKeywords = new Set<string>();

    for (const keyword of keywords) {
      const normalizedKeyword = normalize(keyword);
      const keywordWords = normalizedKeyword.split(' ');
      const matchesPhrase = words.some((_, index) =>
        keywordWords.every(
          (keywordWord, offset) => words[index + offset] === keywordWord
        )
      );

      if (matchesPhrase) {
        matchedKeywords.add(normalizedKeyword);
        score +=
          10 +
          Math.min(normalizedKeyword.length, 20) +
          (keywordWords.length - 1) * 3;
        continue;
      }

      if (
        keywordWords.length === 1 &&
        words.some((word) => isFuzzyMatch(word, normalizedKeyword))
      ) {
        matchedKeywords.add(normalizedKeyword);
        score += 5 + Math.min(normalizedKeyword.length, 10);
      }
    }

    if (matchedKeywords.size > 0) {
      scores.set(category, score);
    }
  }

  let bestCategory: ExpenseCategory = 'miscellaneous';
  let bestScore = 0;

  for (const [category, score] of scores) {
    if (score > bestScore) {
      bestCategory = category;
      bestScore = score;
    }
  }

  return bestCategory;
}
