/**
 * NOTE: In a production environment, use 'lunar-typescript' for astronomical precision.
 * This is a simplified logic for the UI prototype to ensure immediate runnability 
 * without handling complex external dependency installation for the user.
 */

const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const ZODIAC = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];

// Five Elements mapping for styling
export const ELEMENT_MAP: Record<string, 'gold' | 'wood' | 'water' | 'fire' | 'earth'> = {
  '甲': 'wood', '乙': 'wood',
  '丙': 'fire', '丁': 'fire',
  '戊': 'earth', '己': 'earth',
  '庚': 'gold', '辛': 'gold',
  '壬': 'water', '癸': 'water',
  '寅': 'wood', '卯': 'wood',
  '巳': 'fire', '午': 'fire',
  '申': 'gold', '酉': 'gold',
  '亥': 'water', '子': 'water',
  '辰': 'earth', '戌': 'earth', '丑': 'earth', '未': 'earth'
};

export interface Pillar {
  stem: string;
  branch: string;
  zodiac: string;
  elementStem: string;
  elementBranch: string;
}

export interface BaziChart {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar;
}

function getElement(char: string) {
  return ELEMENT_MAP[char] || 'earth';
}

export function calculateBazi(date: Date): BaziChart {
  // A simplified offset algorithm for the prototype. 
  // Real Bazi requires Solar Terms (Jie Qi) calculation.
  
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const hours = date.getHours();

  // 1. Year Pillar (Mock calculation based on 1984 start of cycle)
  const baseYear = 1984; // Jia Zi year
  const offset = year - baseYear;
  const stemIndex = (offset % 10 + 10) % 10;
  const branchIndex = (offset % 12 + 12) % 12;

  const yearPillar = {
    stem: HEAVENLY_STEMS[stemIndex],
    branch: EARTHLY_BRANCHES[branchIndex],
    zodiac: ZODIAC[branchIndex],
    elementStem: getElement(HEAVENLY_STEMS[stemIndex]),
    elementBranch: getElement(EARTHLY_BRANCHES[branchIndex]),
  };

  // 2. Month Pillar (Simplified logic)
  // Month stem depends on Year stem. Branch is roughly fixed to month index.
  // Lunar month usually starts ~Feb 4th. This is an approximation.
  const monthBranchIndex = (month + 2) % 12; // Feb is Yin (Tiger, index 2)
  const monthStemIndex = (stemIndex * 2 + monthBranchIndex) % 10;
  
  const monthPillar = {
    stem: HEAVENLY_STEMS[monthStemIndex],
    branch: EARTHLY_BRANCHES[monthBranchIndex],
    zodiac: ZODIAC[monthBranchIndex],
    elementStem: getElement(HEAVENLY_STEMS[monthStemIndex]),
    elementBranch: getElement(EARTHLY_BRANCHES[monthBranchIndex]),
  };

  // 3. Day Pillar (Simplified epoch calculation)
  // Accurate day pillar needs a reference date.
  const dayOffset = Math.floor((date.getTime() - new Date(1900, 0, 31).getTime()) / (86400000));
  const dayStemIndex = (dayOffset % 10 + 10) % 10;
  const dayBranchIndex = (dayOffset % 12 + 12) % 12;

  const dayPillar = {
    stem: HEAVENLY_STEMS[dayStemIndex],
    branch: EARTHLY_BRANCHES[dayBranchIndex],
    zodiac: ZODIAC[dayBranchIndex],
    elementStem: getElement(HEAVENLY_STEMS[dayStemIndex]),
    elementBranch: getElement(EARTHLY_BRANCHES[dayBranchIndex]),
  };

  // 4. Hour Pillar
  // Hour branch is fixed by time. Stem depends on Day stem.
  let hourBranchIndex = 0;
  if (hours >= 23 || hours < 1) hourBranchIndex = 0; // Zi
  else if (hours < 3) hourBranchIndex = 1; // Chou
  else hourBranchIndex = Math.floor((hours + 1) / 2);

  const hourStemIndex = (dayStemIndex * 2 + hourBranchIndex) % 10;

  const hourPillar = {
    stem: HEAVENLY_STEMS[hourStemIndex],
    branch: EARTHLY_BRANCHES[hourBranchIndex],
    zodiac: ZODIAC[hourBranchIndex],
    elementStem: getElement(HEAVENLY_STEMS[hourStemIndex]),
    elementBranch: getElement(EARTHLY_BRANCHES[hourBranchIndex]),
  };

  return {
    year: yearPillar,
    month: monthPillar,
    day: dayPillar,
    hour: hourPillar
  };
}