import { Solar, Lunar } from 'lunar-typescript';

export type ElementType = 'wood' | 'fire' | 'earth' | 'gold' | 'water';

export const ELEMENTS: ElementType[] = ['wood', 'fire', 'earth', 'gold', 'water'];

export const ELEMENT_CN_MAP: Record<ElementType, string> = {
  wood: '木',
  fire: '火',
  earth: '土',
  gold: '金',
  water: '水'
};

// Mapping Characters to Elements
const CHAR_ELEMENT_MAP: Record<string, ElementType> = {
  '甲': 'wood', '乙': 'wood', '寅': 'wood', '卯': 'wood',
  '丙': 'fire', '丁': 'fire', '巳': 'fire', '午': 'fire',
  '戊': 'earth', '己': 'earth', '辰': 'earth', '戌': 'earth', '丑': 'earth', '未': 'earth',
  '庚': 'gold', '辛': 'gold', '申': 'gold', '酉': 'gold',
  '壬': 'water', '癸': 'water', '亥': 'water', '子': 'water'
};

// Zodiac Mapping
const ZODIAC_MAP: Record<string, string> = {
  '子': '鼠', '丑': '牛', '寅': '虎', '卯': '兔', '辰': '龙', '巳': '蛇',
  '午': '马', '未': '羊', '申': '猴', '酉': '鸡', '戌': '狗', '亥': '猪'
};

// Hidden Stems (Zhi Cang Gan) for Scoring
// Structure: [Main Qi (5pts), Middle Qi (3pts), Residual Qi (2pts)]
// Note: Some branches only have 1 or 2 hidden stems.
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

export interface Pillar {
  stem: string;
  branch: string;
  zodiac: string;
  elementStem: ElementType;
  elementBranch: ElementType;
}

export interface FiveElementScore {
  wood: number;
  fire: number;
  earth: number;
  gold: number;
  water: number;
}

export interface BaziChart {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar;
  fiveElementScore: FiveElementScore;
  destinyScore: number; // 0-100 Balance Score
  archetype: string;    // Title
  dayMaster: string;    // Day Stem Character
  dayMasterElement: ElementType;
  strength: string;     // 'Weak' | 'Strong'
  strongestElement: ElementType;
  favorable: string;    // Simple advice on favorable elements
}

/**
 * Main Calculation Function
 */
export function calculateBazi(date: Date): BaziChart {
  // 1. Convert to Solar -> Lunar -> EightChar
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
  
  // Set Sect to 2 (Year starts at Li Chun - Traditional Bazi Standard)
  eightChar.setSect(2);

  // 2. Extract Pillars
  const yearPillar = createPillar(eightChar.getYearGan(), eightChar.getYearZhi());
  const monthPillar = createPillar(eightChar.getMonthGan(), eightChar.getMonthZhi());
  const dayPillar = createPillar(eightChar.getDayGan(), eightChar.getDayZhi());
  const hourPillar = createPillar(eightChar.getTimeGan(), eightChar.getTimeZhi());

  const dayMaster = dayPillar.stem;
  const dayMasterElement = dayPillar.elementStem;

  // 3. Evaluate Five Elements Score
  const scores = evaluateFiveElements(yearPillar, monthPillar, dayPillar, hourPillar);

  // 4. Calculate Balance Score (Destiny Score)
  const scoreValues = Object.values(scores);
  const avg = scoreValues.reduce((a, b) => a + b, 0) / 5;
  const variance = scoreValues.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / 5;
  const stdDev = Math.sqrt(variance);
  // A lower standard deviation means more balanced. 
  // Map stdDev roughly 0-40 to a score of 100-60.
  let destinyScore = Math.max(60, Math.round(100 - stdDev));
  if (destinyScore > 98) destinyScore = 98; // Cap purely for realistic feel

  // 5. Determine Strength (Simplified Concept)
  // Compare Day Master Element + Support (Resource) vs Drain (Output, Wealth, Officer)
  // Resource Generates Self.
  const resourceElement = getGeneratingElement(dayMasterElement);
  const selfScore = scores[dayMasterElement];
  const resourceScore = scores[resourceElement];
  const totalSystemScore = Object.values(scores).reduce((a, b) => a + b, 0);
  
  const selfStrengthVal = selfScore + resourceScore;
  const isStrong = selfStrengthVal > (totalSystemScore * 0.45); // Threshold approximation
  const strength = isStrong ? '身强' : '身弱';

  // 6. Determine Archetype
  const strongestElement = (Object.keys(scores) as ElementType[]).reduce((a, b) => scores[a] > scores[b] ? a : b);
  const archetype = getArchetype(dayMasterElement, strongestElement, isStrong);

  // 7. Favorable Advice
  // Simple Logic: Weak likes Resource/Self. Strong likes Output/Wealth/Officer.
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

/**
 * Helper: Create Pillar Object
 */
function createPillar(stem: string, branch: string): Pillar {
  return {
    stem,
    branch,
    zodiac: ZODIAC_MAP[branch] || '',
    elementStem: CHAR_ELEMENT_MAP[stem] || 'earth',
    elementBranch: CHAR_ELEMENT_MAP[branch] || 'earth'
  };
}

/**
 * Core Algorithm: Evaluate Five Elements
 */
function evaluateFiveElements(y: Pillar, m: Pillar, d: Pillar, h: Pillar): FiveElementScore {
  const scores: FiveElementScore = { wood: 0, fire: 0, earth: 0, gold: 0, water: 0 };
  const pillars = [y, m, d, h];

  // 1. Iterate Pillars
  pillars.forEach((p, index) => {
    const isMonthPillar = index === 1; // Month pillar index
    const multiplier = isMonthPillar ? 1.5 : 1.0; // Month Branch has 1.5x weight

    // A. Heavenly Stem Score (+5)
    scores[p.elementStem] += 5; // Standard weight for stem

    // B. Earthly Branch Hidden Stems Score
    const hidden = HIDDEN_STEMS[p.branch] || [];
    
    // Logic: Main Qi = 5, Middle Qi = 3, Residual Qi = 2
    // If array has 1 item: Main
    // If array has 2 items: Main, Middle (Treat 2nd as Middle approx)
    // If array has 3 items: Main, Middle, Residual
    
    if (hidden.length > 0) {
      const mainElement = CHAR_ELEMENT_MAP[hidden[0]];
      scores[mainElement] += (5 * multiplier);
    }
    if (hidden.length > 1) {
      const midElement = CHAR_ELEMENT_MAP[hidden[1]];
      scores[midElement] += (3 * multiplier);
    }
    if (hidden.length > 2) {
      const resElement = CHAR_ELEMENT_MAP[hidden[2]];
      scores[resElement] += (2 * multiplier);
    }
  });

  return scores;
}

/**
 * Archetype Logic based on 10 Gods (Ten Deities)
 */
function getArchetype(dm: ElementType, strongest: ElementType, isStrong: boolean): string {
  // If Strongest is Self (Bi Jian / Jie Cai)
  if (dm === strongest) {
     return isStrong ? "🦁 独行侠 (The Maverick)" : "🤝 社交家 (The Connector)";
  }
  
  // If Strongest is Resource (Generates Self)
  if (getGeneratingElement(strongest) === dm) {
      // Actually: Resource generates DM. So if Strongest generates DM.
  }
  if (getGeneratingElement(dm) === strongest) {
      return "🦉 智者 (The Sage)";
  }

  // If Strongest is Output (DM Generates)
  if (getGeneratingElement(strongest) === dm) { // DM generates Strongest
      return "🎨 创作者 (The Creator)";
  }

  // If Strongest is Wealth (DM Controls)
  if (getControlledElement(dm) === strongest) {
      return "🏰 建造者 (The Builder)";
  }

  // If Strongest is Officer/Killing (Controls DM)
  if (getControllingElement(strongest) === dm) { // Strongest controls DM
      return "⚔️ 守护者 (The Guardian)";
  }

  return "🌟 探索者 (The Seeker)";
}


/**
 * Helpers for Element Relationships
 */
// Wood -> Fire -> Earth -> Gold -> Water -> Wood
const GENERATION_CYCLE: ElementType[] = ['wood', 'fire', 'earth', 'gold', 'water'];

function getGeneratingElement(target: ElementType): ElementType {
  const idx = GENERATION_CYCLE.indexOf(target);
  return GENERATION_CYCLE[(idx - 1 + 5) % 5]; // The one that generates target
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
    const map = { wood: '绿色', fire: '红色', earth: '黄色', gold: '白色', water: '黑色' };
    return map[e];
}
