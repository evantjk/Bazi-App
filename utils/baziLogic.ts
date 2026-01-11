import { Solar, Lunar } from 'lunar-typescript';

// --- 1. Type Definitions ---

export interface FiveElementScore {
  name: string;  // e.g., 'wood'
  label: string; // e.g., '木'
  score: number; // The count or percentage
  color: string; // Hex code for UI
}

export interface BaziResult {
  pillars: {
    year: string;
    month: string;
    day: string;
    hour: string;
  };
  scores: FiveElementScore[];
}

// --- 2. Constants & Maps ---

// Maps internal English keys to Chinese display characters (This was missing previously)
export const ELEMENT_CN_MAP: Record<string, string> = {
  wood: '木',
  fire: '火',
  earth: '土',
  gold: '金',
  water: '水',
};

// Maps specific Chinese Stems/Branches to their Element
// Note: 'gold' is used here instead of 'metal' to match your existing code conventions
export const ELEMENT_MAP: Record<string, 'gold' | 'wood' | 'water' | 'fire' | 'earth'> = {
  // Heavenly Stems (天干)
  甲: 'wood', 乙: 'wood',
  丙: 'fire', 丁: 'fire',
  戊: 'earth', 己: 'earth',
  庚: 'gold', 辛: 'gold',
  壬: 'water', 癸: 'water',

  // Earthly Branches (地支) - Based on main Qi
  寅: 'wood', 卯: 'wood',
  巳: 'fire', 午: 'fire',
  辰: 'earth', 戌: 'earth', 丑: 'earth', 未: 'earth',
  申: 'gold', 酉: 'gold',
  亥: 'water', 子: 'water',
};

export const ELEMENT_COLORS: Record<string, string> = {
  wood: '#4ade80', // Green
  fire: '#f87171', // Red
  earth: '#fbbf24', // Yellow/Brown
  gold: '#9ca3af', // Grey/Silver
  water: '#60a5fa', // Blue
};

// --- 3. Main Calculation Logic ---

export const calculateBazi = (dateStr: string, timeStr: string): BaziResult => {
  // Parse input (assumes YYYY-MM-DD and HH:mm)
  const dateParts = dateStr.split('-').map(Number);
  const timeParts = timeStr.split(':').map(Number);

  // Create Solar object from input
  const solar = Solar.fromYmdHms(
    dateParts[0],
    dateParts[1],
    dateParts[2],
    timeParts[0],
    timeParts[1],
    0
  );

  // Convert to Lunar to get BaZi characters
  const lunar = solar.getLunar();

  // Get the Four Pillars (GanZhi)
  const yearPillar = lunar.getYearInGanZhi();
  const monthPillar = lunar.getMonthInGanZhi();
  const dayPillar = lunar.getDayInGanZhi();
  const hourPillar = lunar.getTimeInGanZhi();

  // Aggregate all 8 characters
  const allChars = [
    ...yearPillar.split(''),
    ...monthPillar.split(''),
    ...dayPillar.split(''),
    ...hourPillar.split('')
  ];

  // Calculate Element Counts
  const counts = { wood: 0, fire: 0, earth: 0, gold: 0, water: 0 };
  
  allChars.forEach((char) => {
    const element = ELEMENT_MAP[char];
    if (element) {
      counts[element]++;
    }
  });

  // Format the scores for the frontend
  const scores: FiveElementScore[] = Object.keys(counts).map((key) => {
    const k = key as keyof typeof counts;
    return {
      name: k,
      label: ELEMENT_CN_MAP[k],
      score: counts[k],
      color: ELEMENT_COLORS[k],
    };
  });

  return {
    pillars: {
      year: yearPillar,
      month: monthPillar,
      day: dayPillar,
      hour: hourPillar,
    },
    scores,
  };
};