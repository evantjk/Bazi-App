import { Solar, Lunar } from 'lunar-typescript';

// --- Types ---

export type ElementType = 'wood' | 'fire' | 'earth' | 'gold' | 'water';

export interface FiveElementScore {
  wood: number;
  fire: number;
  earth: number;
  gold: number;
  water: number;
}

export interface Pillar {
  stem: string;
  branch: string;
  zodiac: string;
  elementStem: ElementType;
  elementBranch: ElementType;
}

export interface BaziChart {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar;
  fiveElementScore: FiveElementScore;
  destinyScore: number; 
  archetype: string;
  dayMaster: string;
  dayMasterElement: ElementType;
  strength: string;
  strongestElement: ElementType;
  favorable: string;
}

// --- Constants & Maps ---

export const ELEMENT_CN_MAP: Record<ElementType, string> = {
  wood: '木',
  fire: '火',
  earth: '土',
  gold: '金',
  water: '水',
};

export const ELEMENT_COLORS: Record<string, string> = {
  wood: '#4ade80',
  fire: '#f87171',
  earth: '#fbbf24',
  gold: '#9ca3af',
  water: '#60a5fa',
};

const CHAR_ELEMENT_MAP: Record<string, ElementType> = {
  '甲': 'wood', '乙': 'wood', '寅': 'wood', '卯': 'wood',
  '丙': 'fire', '丁': 'fire', '巳': 'fire', '午': 'fire',
  '戊': 'earth', '己': 'earth', '辰': 'earth', '戌': 'earth', '丑': 'earth', '未': 'earth',
  '庚': 'gold', '辛': 'gold', '申': 'gold', '酉': 'gold',
  '壬': 'water', '癸': 'water', '亥': 'water', '子': 'water'
};

const ZODIAC_MAP: Record<string, string> = {
  '子': '鼠', '丑': '牛', '寅': '虎', '卯': '兔', '辰': '龙', '巳': '蛇',
  '午': '马', '未': '羊', '申': '猴', '酉': '鸡', '戌': '狗', '亥': '猪'
};

// Hidden Stems (Main Qi 5, Middle 3, Residual 2)
const HIDDEN_STEMS: Record<string, string[]> = {
  '子': ['癸'],
  '丑': ['己', '癸', '辛'],
  '寅': ['甲', '丙', '戊'],
  '卯': ['乙'],
  '辰': ['戊', '乙', '癸'],
  '巳': ['丙', '庚', '戊'],
  '午': ['丁', '己'],
  '未': ['己', '丁', '乙'],
  '申': ['庚', '壬', '戊'],
  '酉': ['辛'],
  '戌': ['戊', '辛', '丁'],
  '亥': ['壬', '甲']
};

// --- Main Logic ---

export function calculateBazi(date: Date): BaziChart {
  // 1. Convert to Lunar/EightChar
  const solar = Solar.fromYmdHms(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    0
  );
  
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();
  eightChar.setSect(2); // Traditional Bazi start at Li Chun

  // 2. Extract Pillars
  const yearPillar = createPillar(eightChar.getYearGan(), eightChar.getYearZhi());
  const monthPillar = createPillar(eightChar.getMonthGan(), eightChar.getMonthZhi());
  const dayPillar = createPillar(eightChar.getDayGan(), eightChar.getDayZhi());
  const hourPillar = createPillar(eightChar.getTimeGan(), eightChar.getTimeZhi());

  const dayMaster = dayPillar.stem;
  const dayMasterElement = dayPillar.elementStem;

  // 3. Calculate Scores
  const scores = evaluateFiveElements(yearPillar, monthPillar, dayPillar, hourPillar);

  // 4. Calculate Destiny Score (Balance)
  const scoreValues = Object.values(scores);
  const avg = scoreValues.reduce((a, b) => a + b, 0) / 5;
  const variance = scoreValues.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / 5;
  const stdDev = Math.sqrt(variance);
  let destinyScore = Math.max(60, Math.round(100 - stdDev));
  if (destinyScore > 98) destinyScore = 98;

  // 5. Determine Strength
  const resourceElement = getGeneratingElement(dayMasterElement);
  const selfScore = scores[dayMasterElement];
  const resourceScore = scores[resourceElement]; // <--- Fixed line here
  const totalSystemScore = Object.values(scores).reduce((a, b) => a + b, 0);
  
  const selfStrengthVal = selfScore + resourceScore;
  const isStrong = selfStrengthVal > (totalSystemScore * 0.45);
  const strength = isStrong ? '身强' : '身弱';

  // 6. Determine Archetype
  const strongestElement = (Object.keys(scores) as ElementType[]).reduce((a, b) => scores[a] > scores[b] ? a : b);
  const archetype = getArchetype(dayMasterElement, strongestElement, isStrong);

  // 7. Advice
  let favorable = "";
  if (isStrong) {
      favorable = `喜用神为【食伤、财星、官杀】，即 ${getElementColorName(getOutputElement(dayMasterElement))}、${getElementColorName(getControlledElement(dayMasterElement))}、${getElementColorName(getControllingElement(dayMasterElement))}。建议多去户外，或者从事具有挑战性的工作。`;
  } else {
      favorable = `喜用神为【印枭、比劫】，即 ${getElementColorName(resourceElement)}、${getElementColorName(dayMasterElement)}。建议多穿戴对应颜色的饰品，寻求长辈或朋友的帮助。`;
  }

  return {
    year: yearPillar,
    month: monthPillar,
    day: dayPillar,
    hour: hourPillar,
    fiveElementScore: scores,
    destinyScore,
    archetype,
    dayMaster,
    dayMasterElement,
    strength,
    strongestElement,
    favorable
  };
}

// --- Helpers ---

function createPillar(stem: string, branch: string): Pillar {
  return {
    stem,
    branch,
    zodiac: ZODIAC_MAP[branch] || '',
    elementStem: CHAR_ELEMENT_MAP[stem] || 'earth',
    elementBranch: CHAR_ELEMENT_MAP[branch] || 'earth'
  };
}

function evaluateFiveElements(y: Pillar, m: Pillar, d: Pillar, h: Pillar): FiveElementScore {
  const scores: FiveElementScore = { wood: 0, fire: 0, earth: 0, gold: 0, water: 0 };
  const pillars = [y, m, d, h];

  pillars.forEach((p, index) => {
    const isMonthPillar = index === 1; 
    const multiplier = isMonthPillar ? 1.5 : 1.0; 

    // Stem (+5)
    scores[p.elementStem] += 5; 

    // Hidden Stems
    const hidden = HIDDEN_STEMS[p.branch] || [];
    if (hidden.length > 0) scores[CHAR_ELEMENT_MAP[hidden[0]]] += (5 * multiplier);
    if (hidden.length > 1) scores[CHAR_ELEMENT_MAP[hidden[1]]] += (3 * multiplier);
    if (hidden.length > 2) scores[CHAR_ELEMENT_MAP[hidden[2]]] += (2 * multiplier);
  });

  return scores;
}

function getArchetype(dm: ElementType, strongest: ElementType, isStrong: boolean): string {
  if (dm === strongest) return isStrong ? "🦁 独行侠 (The Maverick)" : "🤝 社交家 (The Connector)";
  if (getGeneratingElement(dm) === strongest) return "🦉 智者 (The Sage)";
  if (getGeneratingElement(strongest) === dm) return "🎨 创作者 (The Creator)";
  if (getControlledElement(dm) === strongest) return "🏰 建造者 (The Builder)";
  if (getControllingElement(strongest) === dm) return "⚔️ 守护者 (The Guardian)";
  return "🌟 探索者 (The Seeker)";
}

const GENERATION_CYCLE: ElementType[] = ['wood', 'fire', 'earth', 'gold', 'water'];

function getGeneratingElement(target: ElementType): ElementType {
  const idx = GENERATION_CYCLE.indexOf(target);
  return GENERATION_CYCLE[(idx - 1 + 5) % 5];
}

function getOutputElement(source: ElementType): ElementType {
  const idx = GENERATION_CYCLE.indexOf(source);
  return GENERATION_CYCLE[(idx + 1) % 5];
}

function getControlledElement(source: ElementType): ElementType {
    const idx = GENERATION_CYCLE.indexOf(source);
    return GENERATION_CYCLE[(idx + 2) % 5];
}

function getControllingElement(target: ElementType): ElementType {
    const idx = GENERATION_CYCLE.indexOf(target);
    return GENERATION_CYCLE[(idx - 2 + 5) % 5];
}

function getElementColorName(e: ElementType): string {
    return ELEMENT_CN_MAP[e];
}