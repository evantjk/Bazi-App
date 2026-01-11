import { Solar, Lunar } from 'lunar-typescript';

// --- Types ---

export type ElementType = 'wood' | 'fire' | 'earth' | 'gold' | 'water';
export type Polarity = '+' | '-';

export interface FiveElementScore {
  wood: number; fire: number; earth: number; gold: number; water: number;
}

export interface TenGods {
  main: string;
  hidden: string[];
}

export interface Pillar {
  stem: string;
  branch: string;
  zodiac: string;
  elementStem: ElementType;
  elementBranch: ElementType;
  tenGodStem: string;
  tenGodBranch: TenGods;
  hiddenStems: string[];
  naYin: string;
  shenSha: string[]; // 神煞
  kongWang: boolean; // 空亡
}

export interface BaziChart {
  meta: {
    solarDate: string;
    trueSolarTime: string;
    location: string;
  };
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar;
  fiveElementScore: FiveElementScore;
  destinyScore: number;
  dayMaster: string;
  dayMasterElement: ElementType;
  strength: string;
  seasonStatus: string;
  strongestElement: ElementType;
  // 移除旧的 favorable/bookAdvice/archetype，完全交给 AI
}

// --- Constants ---

export const ELEMENT_CN_MAP: Record<ElementType, string> = {
  wood: '木', fire: '火', earth: '土', gold: '金', water: '水',
};

// 纳音表 (简化版引用，保持之前逻辑)
const NA_YIN_MAP: Record<string, string> = {
  '甲子': '海中金', '乙丑': '海中金', '丙寅': '炉中火', '丁卯': '炉中火',
  '戊辰': '大林木', '己巳': '大林木', '庚午': '路旁土', '辛未': '路旁土',
  '壬申': '剑锋金', '癸酉': '剑锋金', '甲戌': '山头火', '乙亥': '山头火',
  '丙子': '涧下水', '丁丑': '涧下水', '戊寅': '城头土', '己卯': '城头土',
  '庚辰': '白蜡金', '辛巳': '白蜡金', '壬午': '杨柳木', '癸未': '杨柳木',
  '甲申': '泉中水', '乙酉': '泉中水', '丙戌': '屋上土', '丁亥': '屋上土',
  '戊子': '霹雳火', '己丑': '霹雳火', '庚寅': '松柏木', '辛卯': '松柏木',
  '壬辰': '长流水', '癸巳': '长流水', '甲午': '沙中金', '乙未': '沙中金',
  '丙申': '山下火', '丁酉': '山下火', '戊戌': '平地木', '己亥': '平地木',
  '庚子': '壁上土', '辛丑': '壁上土', '壬寅': '金箔金', '癸卯': '金箔金',
  '甲辰': '覆灯火', '乙巳': '覆灯火', '丙午': '天河水', '丁未': '天河水',
  '戊申': '大驿土', '己酉': '大驿土', '庚戌': '钗钏金', '辛亥': '钗钏金',
  '壬子': '桑柘木', '癸丑': '桑柘木', '甲寅': '大溪水', '乙卯': '大溪水',
  '丙辰': '沙中土', '丁巳': '沙中土', '戊午': '天上火', '己未': '天上火',
  '庚申': '石榴木', '辛酉': '石榴木', '壬戌': '大海水', '癸亥': '大海水'
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

// --- Helper: Parse DMS Longitude ---
// 支持输入: 103.5 或 103°45'34" 或 103 45 34
export function parseLongitude(input: string): number {
  const cleanInput = input.trim();
  
  // 1. 如果是纯数字 (Decimal)
  if (!isNaN(Number(cleanInput))) {
    return Number(cleanInput);
  }

  // 2. 解析 DMS (Degrees, Minutes, Seconds)
  // Regex 匹配度分秒，支持 ° ' " 或 空格分隔
  const dmsRegex = /^(\d+)[°\s]+(\d+)['\s]+(\d+(?:\.\d+)?)["\s]*$/;
  const match = cleanInput.match(dmsRegex);

  if (match) {
    const deg = parseFloat(match[1]);
    const min = parseFloat(match[2]);
    const sec = parseFloat(match[3]);
    // 转换公式: 度 + 分/60 + 秒/3600
    return deg + (min / 60) + (sec / 3600);
  }

  // 3. 尝试解析度分 (无秒)
  const dmRegex = /^(\d+)[°\s]+(\d+(?:\.\d+)?)['\s]*$/;
  const matchDM = cleanInput.match(dmRegex);
  if (matchDM) {
    const deg = parseFloat(matchDM[1]);
    const min = parseFloat(matchDM[2]);
    return deg + (min / 60);
  }

  return 120; // 默认返回北京时间经度
}

// --- Main Calculation Logic ---

export function calculateBazi(inputDate: Date, longitudeStr: string): BaziChart {
  
  const longitude = parseLongitude(longitudeStr);

  // 真太阳时计算
  const offsetMinutes = (longitude - 120) * 4;
  const trueSolarDate = new Date(inputDate.getTime() + offsetMinutes * 60000);

  const solar = Solar.fromYmdHms(
    trueSolarDate.getFullYear(),
    trueSolarDate.getMonth() + 1,
    trueSolarDate.getDate(),
    trueSolarDate.getHours(),
    trueSolarDate.getMinutes(),
    0
  );

  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();
  eightChar.setSect(2); 

  const yearGan = eightChar.getYearGan(); const yearZhi = eightChar.getYearZhi();
  const monthGan = eightChar.getMonthGan(); const monthZhi = eightChar.getMonthZhi();
  const dayGan = eightChar.getDayGan(); const dayZhi = eightChar.getDayZhi();
  const timeGan = eightChar.getTimeGan(); const timeZhi = eightChar.getTimeZhi();

  const dayMaster = dayGan;
  const dayMasterDetail = STEM_DETAILS[dayMaster];
  const monthBranchDetail = BRANCH_DETAILS[monthZhi];

  const seasonStatus = getSeasonStatus(dayMasterDetail.element, monthBranchDetail.element);
  const kongWangSet = getKongWang(dayGan, dayZhi);

  const yearPillar = createPillar(yearGan, yearZhi, dayMaster, kongWangSet, yearZhi, dayZhi, monthZhi);
  const monthPillar = createPillar(monthGan, monthZhi, dayMaster, kongWangSet, yearZhi, dayZhi, monthZhi);
  const dayPillar = createPillar(dayGan, dayZhi, dayMaster, kongWangSet, yearZhi, dayZhi, monthZhi);
  const hourPillar = createPillar(timeGan, timeZhi, dayMaster, kongWangSet, yearZhi, dayZhi, monthZhi);

  const scores = calculateScores(yearPillar, monthPillar, dayPillar, hourPillar);
  const strengthResult = calculateStrengthAdvanced(scores, dayMasterDetail.element, seasonStatus, monthBranchDetail.element);
  const strongestEl = (Object.keys(scores) as ElementType[]).reduce((a, b) => scores[a] > scores[b] ? a : b);

  // 平衡分 (简化方差)
  const scoreValues = Object.values(scores);
  const avg = scoreValues.reduce((a, b) => a + b, 0) / 5;
  const variance = scoreValues.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / 5;
  const destinyScore = Math.max(60, Math.min(99, Math.round(100 - Math.sqrt(variance))));

  const tstStr = `${trueSolarDate.getHours().toString().padStart(2, '0')}:${trueSolarDate.getMinutes().toString().padStart(2, '0')}`;

  return {
    meta: {
        solarDate: inputDate.toISOString().split('T')[0],
        trueSolarTime: tstStr,
        location: longitudeStr
    },
    year: yearPillar, month: monthPillar, day: dayPillar, hour: hourPillar,
    fiveElementScore: scores, destinyScore,
    dayMaster, dayMasterElement: dayMasterDetail.element,
    strength: strengthResult.desc,
    seasonStatus: seasonStatus,
    strongestElement: strongestEl
  };
}

// --- Helper Functions ---

function createPillar(stem: string, branch: string, dayMaster: string, kw: string[], yZhi: string, dZhi: string, mZhi: string): Pillar {
  const sDetail = STEM_DETAILS[stem];
  const bDetail = BRANCH_DETAILS[branch];
  const naYin = NA_YIN_MAP[stem + branch] || '';
  const dmDetail = STEM_DETAILS[dayMaster];

  // 计算神煞 (传入必要参数：日干、日支、年支、月支)
  const shenShaList = getShenSha(stem, branch, dayMaster, dZhi, yZhi, mZhi);

  return {
    stem, branch, zodiac: bDetail.zodiac,
    elementStem: sDetail.element,
    elementBranch: bDetail.element,
    tenGodStem: calculateTenGod(dmDetail, sDetail),
    hiddenStems: bDetail.hidden,
    tenGodBranch: {
      main: calculateTenGod(dmDetail, STEM_DETAILS[bDetail.hidden[0]]),
      hidden: bDetail.hidden.slice(1).map(h => calculateTenGod(dmDetail, STEM_DETAILS[h]))
    },
    naYin,
    shenSha: shenShaList,
    kongWang: kw.includes(branch)
  };
}

// --- 完整神煞系统 (Comprehensive Shen Sha) ---
function getShenSha(stem: string, branch: string, dayStem: string, dayBranch: string, yearBranch: string, monthBranch: string): string[] {
    const list: string[] = [];

    // 1. 天乙贵人 (Tian Yi Nobleman) - 最吉之神
    // 甲戊并牛羊, 乙己鼠猴乡...
    const tianYiMap: Record<string, string[]> = {
        '甲': ['丑', '未'], '戊': ['丑', '未'], '庚': ['丑', '未'],
        '乙': ['子', '申'], '己': ['子', '申'],
        '丙': ['亥', '酉'], '丁': ['亥', '酉'],
        '壬': ['巳', '卯'], '癸': ['巳', '卯'],
        '辛': ['午', '寅']
    };
    if (tianYiMap[dayStem]?.includes(branch)) list.push('天乙贵人');

    // 2. 文昌贵人 (Wen Chang) - 学业文章
    // 甲乙巳午报君知...
    const wenChangMap: Record<string, string> = {
        '甲': '巳', '乙': '午', '丙': '申', '戊': '申',
        '丁': '酉', '己': '酉', '庚': '亥', '辛': '子',
        '壬': '寅', '癸': '卯'
    };
    if (wenChangMap[dayStem] === branch) list.push('文昌贵人');

    // 3. 羊刃 (Yang Ren) - 凶暴之气，身弱反喜
    // 甲卯乙辰丙午丁未... (简化五阳干见旺支)
    const yangRenMap: Record<string, string> = {
        '甲': '卯', '丙': '午', '戊': '午', '庚': '酉', '壬': '子'
        // 阴干通常论禄，此处取五阳干羊刃
    };
    if (yangRenMap[dayStem] === branch) list.push('羊刃');

    // 4. 禄神 (Lu Shen) - 爵禄衣食
    // 甲禄在寅...
    const luMap: Record<string, string> = {
        '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午', '戊': '巳', '己': '午',
        '庚': '申', '辛': '酉', '壬': '亥', '癸': '子'
    };
    if (luMap[dayStem] === branch) list.push('禄神');

    // 5. 驿马 (Traveling Horse) - 变动
    const isYiMa = (z: string) => {
        if ('申子辰'.includes(z) && branch === '寅') return true;
        if ('寅午戌'.includes(z) && branch === '申') return true;
        if ('巳酉丑'.includes(z) && branch === '亥') return true;
        if ('亥卯未'.includes(z) && branch === '巳') return true;
        return false;
    };
    // 查年支或日支
    if (isYiMa(yearBranch) || isYiMa(dayBranch)) list.push('驿马');

    // 6. 桃花 (Peach Blossom) - 咸池
    const isTaoHua = (z: string) => {
        if ('申子辰'.includes(z) && branch === '酉') return true;
        if ('寅午戌'.includes(z) && branch === '卯') return true;
        if ('巳酉丑'.includes(z) && branch === '午') return true;
        if ('亥卯未'.includes(z) && branch === '子') return true;
        return false;
    };
    if (isTaoHua(yearBranch) || isTaoHua(dayBranch)) list.push('桃花');

    // 7. 华盖 (Hua Gai) - 艺术宗教孤傲
    const isHuaGai = (z: string) => {
        if ('申子辰'.includes(z) && branch === '辰') return true;
        if ('寅午戌'.includes(z) && branch === '戌') return true;
        if ('巳酉丑'.includes(z) && branch === '丑') return true;
        if ('亥卯未'.includes(z) && branch === '未') return true;
        return false;
    };
    if (isHuaGai(yearBranch) || isHuaGai(dayBranch)) list.push('华盖');

    // 8. 魁罡 (Kui Gang) - 只有日柱算
    if (stem && branch) {
        if (['戊戌', '庚辰', '庚戌', '壬辰'].includes(stem + branch)) list.push('魁罡');
    }

    // 9. 将星 (Jiang Xing) - 掌权
    const isJiangXing = (z: string) => {
        if ('申子辰'.includes(z) && branch === '子') return true;
        if ('寅午戌'.includes(z) && branch === '午') return true;
        if ('巳酉丑'.includes(z) && branch === '酉') return true;
        if ('亥卯未'.includes(z) && branch === '卯') return true;
        return false;
    };
    if (isJiangXing(yearBranch) || isJiangXing(dayBranch)) list.push('将星');
    
    // 10. 金舆 (Gold Carriage) - 财富车马
    const jinYuMap: Record<string, string> = {
        '甲': '辰', '乙': '巳', '丙': '未', '丁': '申', '戊': '未', 
        '己': '申', '庚': '戌', '辛': '亥', '壬': '丑', '癸': '寅'
    };
    if (jinYuMap[dayStem] === branch) list.push('金舆');

    return list;
}

// 旬空
function getKongWang(dStem: string, dBranch: string): string[] {
    const stems = '甲乙丙丁戊己庚辛壬癸';
    const branches = '子丑寅卯辰巳午未申酉戌亥';
    const sIdx = stems.indexOf(dStem);
    const bIdx = branches.indexOf(dBranch);
    const diff = bIdx - sIdx;
    
    // 简算：差值决定旬首，进而定空亡
    if (diff === 2 || diff === -10) return ['戌', '亥']; 
    if (diff === 4 || diff === -8) return ['申', '酉']; 
    if (diff === 6 || diff === -6) return ['午', '未']; 
    if (diff === 8 || diff === -4) return ['辰', '巳']; 
    if (diff === 10 || diff === -2) return ['寅', '卯']; 
    if (diff === 0) return ['子', '丑']; 
    return [];
}

function calculateTenGod(dm: { element: ElementType, polarity: Polarity }, target: { element: ElementType, polarity: Polarity }): string {
  if (!target) return '';
  const isSamePol = dm.polarity === target.polarity;
  if (dm.element === target.element) return isSamePol ? '比肩' : '劫财';
  if (getGeneratingElement(target.element) === dm.element) return isSamePol ? '食神' : '伤官';
  if (getGeneratingElement(dm.element) === target.element) return isSamePol ? '偏印' : '正印';
  if (getControlledElement(dm.element) === target.element) return isSamePol ? '偏财' : '正财';
  if (getControlledElement(target.element) === dm.element) return isSamePol ? '七杀' : '正官';
  return '';
}

function calculateScores(y: Pillar, m: Pillar, d: Pillar, h: Pillar): FiveElementScore {
  const scores = { wood: 0, fire: 0, earth: 0, gold: 0, water: 0 };
  [y, m, d, h].forEach((p, idx) => {
    const mult = idx === 1 ? 1.2 : 1.0; 
    scores[p.elementStem] += 5;
    const hidden = p.hiddenStems;
    if (hidden[0]) scores[STEM_DETAILS[hidden[0]].element] += (5 * mult);
    if (hidden[1]) scores[STEM_DETAILS[hidden[1]].element] += (3 * mult);
    if (hidden[2]) scores[STEM_DETAILS[hidden[2]].element] += (2 * mult);
  });
  return scores;
}

function calculateStrengthAdvanced(scores: FiveElementScore, dmEl: ElementType, seasonStatus: string, monthEl: ElementType): { isStrong: boolean, desc: string } {
    const isDeLing = seasonStatus === '旺' || seasonStatus === '相';
    const resourceEl = getGeneratingElement(dmEl);
    const selfEnergy = scores[dmEl] + scores[resourceEl];
    const totalEnergy = Object.values(scores).reduce((a,b) => a+b, 0);
    const percentage = selfEnergy / totalEnergy;

    let strength = '身弱';
    if (isDeLing && percentage > 0.4) strength = '身强'; 
    else if (!isDeLing && percentage > 0.55) strength = '身强'; 
    else if (isDeLing && percentage < 0.3) strength = '身弱'; 
    return { isStrong: strength === '身强', desc: strength };
}

function getSeasonStatus(dm: ElementType, month: ElementType): string {
    if (dm === month) return '旺';
    if (getGeneratingElement(dm) === month) return '相'; 
    if (getGeneratingElement(month) === dm) return '休'; 
    if (getControlledElement(dm) === month) return '囚'; 
    return '死'; 
}

const GENERATION_CYCLE: ElementType[] = ['wood', 'fire', 'earth', 'gold', 'water'];
function getGeneratingElement(target: ElementType) { return GENERATION_CYCLE[(GENERATION_CYCLE.indexOf(target) - 1 + 5) % 5]; }
function getControlledElement(source: ElementType) { return GENERATION_CYCLE[(GENERATION_CYCLE.indexOf(source) + 2) % 5]; }