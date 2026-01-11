import { Solar, Lunar } from 'lunar-typescript';

// --- Types ---

export type ElementType = 'wood' | 'fire' | 'earth' | 'gold' | 'water';
export type Polarity = '+' | '-'; // Yang | Yin

export interface FiveElementScore {
  wood: number;
  fire: number;
  earth: number;
  gold: number;
  water: number;
}

export interface TenGods {
  main: string; // 本气十神
  hidden: string[]; // 藏干十神
}

export interface Pillar {
  stem: string;
  branch: string;
  zodiac: string;
  elementStem: ElementType;
  elementBranch: ElementType;
  tenGodStem: string;   // 天干对应的十神 (相对于日主)
  tenGodBranch: TenGods; // 地支藏干对应的十神
  hiddenStems: string[]; // 藏干
}

export interface BaziChart {
  year: Pillar;
  month: Pillar;
  day: Pillar; // Day Stem is the Day Master
  hour: Pillar;
  fiveElementScore: FiveElementScore;
  destinyScore: number; 
  archetype: string;
  dayMaster: string;
  dayMasterElement: ElementType;
  strength: string; // '身强' | '身弱' | '从格' (简化)
  strongestElement: ElementType;
  favorable: string;
  bookAdvice: string; // 《穷通宝鉴》调候建议
}

// --- Constants & Maps ---

export const ELEMENT_CN_MAP: Record<ElementType, string> = {
  wood: '木', fire: '火', earth: '土', gold: '金', water: '水',
};

export const TEN_GOD_MAP: Record<string, string> = {
  Friend: '比肩', RobWealth: '劫财',
  EatingGod: '食神', HurtingOfficer: '伤官',
  DirectWealth: '正财', IndirectWealth: '偏财',
  DirectOfficer: '正官', SevenKillings: '七杀',
  DirectResource: '正印', IndirectResource: '偏印',
};

const STEM_DETAILS: Record<string, { element: ElementType; polarity: Polarity }> = {
  '甲': { element: 'wood', polarity: '+' }, '乙': { element: 'wood', polarity: '-' },
  '丙': { element: 'fire', polarity: '+' }, '丁': { element: 'fire', polarity: '-' },
  '戊': { element: 'earth', polarity: '+' }, '己': { element: 'earth', polarity: '-' },
  '庚': { element: 'gold', polarity: '+' }, '辛': { element: 'gold', polarity: '-' },
  '壬': { element: 'water', polarity: '+' }, '癸': { element: 'water', polarity: '-' },
};

const BRANCH_DETAILS: Record<string, { element: ElementType; zodiac: string; hidden: string[] }> = {
  '子': { element: 'water', zodiac: '鼠', hidden: ['癸'] },
  '丑': { element: 'earth', zodiac: '牛', hidden: ['己', '癸', '辛'] },
  '寅': { element: 'wood', zodiac: '虎', hidden: ['甲', '丙', '戊'] },
  '卯': { element: 'wood', zodiac: '兔', hidden: ['乙'] },
  '辰': { element: 'earth', zodiac: '龙', hidden: ['戊', '乙', '癸'] },
  '巳': { element: 'fire', zodiac: '蛇', hidden: ['丙', '庚', '戊'] },
  '午': { element: 'fire', zodiac: '马', hidden: ['丁', '己'] },
  '未': { element: 'earth', zodiac: '羊', hidden: ['己', '丁', '乙'] },
  '申': { element: 'gold', zodiac: '猴', hidden: ['庚', '壬', '戊'] },
  '酉': { element: 'gold', zodiac: '鸡', hidden: ['辛'] },
  '戌': { element: 'earth', zodiac: '狗', hidden: ['戊', '辛', '丁'] },
  '亥': { element: 'water', zodiac: '猪', hidden: ['壬', '甲'] },
};

// --- Qiong Tong Bao Jian Logic (Mock Data / Partial) ---
// Key format: "DayMasterStem-MonthBranch"
const QIONG_TONG_DATA: Record<string, string> = {
  '甲-寅': '【甲木生于寅月】：调候用丙火暖局，佐以癸水滋润。春木初生，乍暖还寒。',
  '甲-卯': '【甲木生于卯月】：阳刃驾杀，专用庚金劈甲，无庚用丙丁泄秀。',
  '甲-辰': '【甲木生于辰月】：木气将竭，用庚金劈甲引丁。',
  '甲-巳': '【甲木生于巳月】：木性枯焦，调候专用癸水，次用庚金。',
  '甲-午': '【甲木生于午月】：五月甲木，木性虚焦，癸水为上，庚金次之。',
  '甲-未': '【甲木生于未月】：上半月同五月用癸，下半月用庚丁。',
  '甲-申': '【甲木生于申月】：七杀当令，专用丁火制杀，兼庚金劈甲。',
  '甲-酉': '【甲木生于酉月】：正官当令，用丁制杀，或用丙火调候。',
  '甲-戌': '【甲木生于戌月】：木性枯槁，用癸水滋润，次用丁火。',
  '甲-亥': '【甲木生于亥月】：长生之地，用庚金劈甲，次用丙火温暖。',
  '甲-子': '【甲木生于子月】：天寒地冻，专用丙火暖局，忌水多漂木。',
  '甲-丑': '【甲木生于丑月】：丁火温暖，庚金劈甲，不可缺丙。',
  // ... 其他日主的数据可以在此处扩展，或者通过 API 加载
};

// --- Main Calculation Logic ---

export function calculateBazi(date: Date): BaziChart {
  const solar = Solar.fromYmdHms(date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), 0);
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();
  eightChar.setSect(2); // Traditional

  const yearGan = eightChar.getYearGan(); const yearZhi = eightChar.getYearZhi();
  const monthGan = eightChar.getMonthGan(); const monthZhi = eightChar.getMonthZhi();
  const dayGan = eightChar.getDayGan(); const dayZhi = eightChar.getDayZhi();
  const timeGan = eightChar.getTimeGan(); const timeZhi = eightChar.getTimeZhi();

  const dayMaster = dayGan;
  const dayMasterDetail = STEM_DETAILS[dayMaster];

  // Create Pillars with Ten Gods
  const yearPillar = createPillar(yearGan, yearZhi, dayMasterDetail);
  const monthPillar = createPillar(monthGan, monthZhi, dayMasterDetail);
  const dayPillar = createPillar(dayGan, dayZhi, dayMasterDetail);
  const hourPillar = createPillar(timeGan, timeZhi, dayMasterDetail);

  // Scores
  const scores = calculateScores(yearPillar, monthPillar, dayPillar, hourPillar);
  
  // Advanced Strength Logic (De Ling / De Di)
  // Is Month Branch element same or generating Day Master?
  const monthBranchEl = BRANCH_DETAILS[monthZhi].element;
  const isDeLing = monthBranchEl === dayMasterDetail.element || getGeneratingElement(monthBranchEl) === dayMasterDetail.element;
  
  // Simple check for De Di (Roots) - simplistic version
  const rootCount = [yearZhi, monthZhi, dayZhi, timeZhi].filter(z => BRANCH_DETAILS[z].element === dayMasterDetail.element).length;
  
  let strength = '身弱';
  if (isDeLing && rootCount >= 1) strength = '身强';
  if (!isDeLing && rootCount >= 2) strength = '身强'; // Not born in season but rooted
  // (Full algorithms are much more complex, this is Level 2 accuracy)

  // Archetype
  const strongestEl = (Object.keys(scores) as ElementType[]).reduce((a, b) => scores[a] > scores[b] ? a : b);
  const archetype = getArchetype(dayMasterDetail.element, strongestEl, strength === '身强');

  // Destiny Score (Variance)
  const scoreValues = Object.values(scores);
  const avg = scoreValues.reduce((a, b) => a + b, 0) / 5;
  const variance = scoreValues.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / 5;
  const destinyScore = Math.max(60, Math.min(98, Math.round(100 - Math.sqrt(variance))));

  // Book Advice
  const bookKey = `${dayMaster}-${monthZhi}`;
  const bookAdvice = QIONG_TONG_DATA[bookKey] || `日主【${dayMaster}】生于【${monthZhi}】月。古籍数据暂未录入此组合，建议参考通用喜忌。`;

  return {
    year: yearPillar, month: monthPillar, day: dayPillar, hour: hourPillar,
    fiveElementScore: scores, destinyScore, archetype,
    dayMaster, dayMasterElement: dayMasterDetail.element,
    strength, strongestElement: strongestEl,
    favorable: strength === '身强' ? "喜 克/泄/耗 (官杀/食伤/财星)" : "喜 生/扶 (印枭/比劫)",
    bookAdvice
  };
}

// --- Helper Functions ---

function createPillar(stem: string, branch: string, dm: { element: ElementType, polarity: Polarity }): Pillar {
  const sDetail = STEM_DETAILS[stem];
  const bDetail = BRANCH_DETAILS[branch];

  return {
    stem, branch, zodiac: bDetail.zodiac,
    elementStem: sDetail.element,
    elementBranch: bDetail.element,
    tenGodStem: calculateTenGod(dm, sDetail),
    hiddenStems: bDetail.hidden,
    tenGodBranch: {
      main: calculateTenGod(dm, STEM_DETAILS[bDetail.hidden[0]]),
      hidden: bDetail.hidden.slice(1).map(h => calculateTenGod(dm, STEM_DETAILS[h]))
    }
  };
}

function calculateTenGod(dm: { element: ElementType, polarity: Polarity }, target: { element: ElementType, polarity: Polarity }): string {
  if (!target) return '';
  const isSamePol = dm.polarity === target.polarity;
  
  if (dm.element === target.element) return isSamePol ? '比肩' : '劫财';
  if (getGeneratingElement(target.element) === dm.element) return isSamePol ? '食神' : '伤官'; // I generate target
  if (getGeneratingElement(dm.element) === target.element) return isSamePol ? '偏印' : '正印'; // Target generates me
  if (getControlledElement(dm.element) === target.element) return isSamePol ? '偏财' : '正财'; // I control target
  if (getControlledElement(target.element) === dm.element) return isSamePol ? '七杀' : '正官'; // Target controls me
  
  return '';
}

function calculateScores(y: Pillar, m: Pillar, d: Pillar, h: Pillar): FiveElementScore {
  const scores = { wood: 0, fire: 0, earth: 0, gold: 0, water: 0 };
  [y, m, d, h].forEach((p, idx) => {
    const mult = idx === 1 ? 1.2 : 1.0; // Month branch weighted higher
    scores[p.elementStem] += 5;
    const hidden = p.hiddenStems;
    if (hidden[0]) scores[STEM_DETAILS[hidden[0]].element] += (5 * mult);
    if (hidden[1]) scores[STEM_DETAILS[hidden[1]].element] += (3 * mult);
    if (hidden[2]) scores[STEM_DETAILS[hidden[2]].element] += (2 * mult);
  });
  return scores;
}

// Cycles
const GENERATION_CYCLE: ElementType[] = ['wood', 'fire', 'earth', 'gold', 'water'];
function getGeneratingElement(target: ElementType) { return GENERATION_CYCLE[(GENERATION_CYCLE.indexOf(target) - 1 + 5) % 5]; }
function getControlledElement(source: ElementType) { return GENERATION_CYCLE[(GENERATION_CYCLE.indexOf(source) + 2) % 5]; }

function getArchetype(dmEl: ElementType, strongEl: ElementType, isStrong: boolean): string {
  // Simplified Logic for Demo
  if (dmEl === strongEl) return isStrong ? "🦁 独行侠 (建禄/羊刃)" : "🤝 社交家 (比劫)";
  if (getGeneratingElement(strongEl) === dmEl) return "🎨 创作者 (食伤)"; // I generate strong
  if (getControlledElement(dmEl) === strongEl) return "🏰 建造者 (财星)"; // I control strong
  if (getControlledElement(strongEl) === dmEl) return "⚔️ 守护者 (官杀)"; // Strong controls me
  if (getGeneratingElement(dmEl) === strongEl) return "🦉 智者 (印枭)"; // Strong generates me
  return "🌟 探索者";
}