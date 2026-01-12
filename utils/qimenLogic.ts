import { Solar, Lunar } from 'lunar-typescript';

// --- Types ---
export type QimenType = 'career' | 'wealth' | 'relationship' | 'travel' | 'study';
export type SignalType = 'green' | 'yellow' | 'red';

export interface QimenResult {
  signal: SignalType; // 🟢 🟡 🔴
  score: number;      // 内部评分
  summary: string;    // 规则引擎生成的硬结论 (如：时干克日干)
  factors: string[];  // 关键因子 (如：生门、天乙贵人)
  validUntil: string; // 有效期
  chartInfo: {        // 盘面信息 (仅供调试或展示)
    dayStem: string;  // 日干 (代表我)
    hourStem: string; // 时干 (代表事)
    dayPalace: string; // 我所在的宫位
    hourPalace: string; // 事所在的宫位
    door: string;     // 事情的门
  }
}

// 映射表：问题类型显示名
export const QUESTION_TYPES: Record<QimenType, string> = {
  career: '事业/工作 (合作、面试、推进)',
  wealth: '金钱/投资 (入场、止损、决策)',
  relationship: '感情/人际 (表白、复合、联系)',
  travel: '出行/行动 (签约、出发、发布)',
  study: '学业/考试 (冲刺、策略、方向)',
};

// 五行生克关系: key生value
const GENERATION: Record<string, string> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
// 五行克制关系: key克value
const CONTROL: Record<string, string> = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };

// 宫位五行属性
const PALACE_ELEMENT: Record<string, string> = {
  '坎': '水', '艮': '土', '震': '木', '巽': '木',
  '离': '火', '坤': '土', '兑': '金', '乾': '金', '中': '土' 
};

// 八门吉凶 (简易版权重)
const DOOR_SCORE: Record<string, number> = {
  '开': 20, '休': 15, '生': 20, // 三吉门
  '景': 5,  '杜': -5,           // 平门
  '伤': -10, '死': -20, '惊': -15 // 凶门
};

// --- 核心计算逻辑 ---
export function calculateQimen(type: QimenType, date: Date): QimenResult {
  const solar = Solar.fromDate(date);
  const lunar = solar.getLunar();
  
  // 1. 简单的时家奇门排盘逻辑 (利用 lunar-typescript)
  // 注意：这里简化处理，主要取日干和时干落宫的五行关系
  const eightChar = lunar.getEightChar();
  const dayStem = eightChar.getDayGan();   // 日干 = 我
  const hourStem = eightChar.getTimeGan(); // 时干 = 事
  
  // 模拟起局 (lunar-typescript 的 QiMen 需要较新版本，这里用模拟逻辑确保稳定性)
  // 在真实高阶版本中，这里应调用 lunar.getQiMen() 获取真实落宫
  // 为了演示 MVP 逻辑，我们用一种基于时间的哈希算法模拟“落宫”和“八门”
  // ⚠️ 生产环境建议替换为真实的奇门排盘库算法
  
  // 模拟：根据小时数决定宫位 (0-11 -> 9宫)
  const palaces = ['坎', '艮', '震', '巽', '离', '坤', '兑', '乾', '中'];
  const doors = ['开', '休', '生', '伤', '杜', '景', '死', '惊'];
  
  const hIndex = date.getHours() % 12; // 简化
  const dayPalace = palaces[hIndex % 9];
  const hourPalace = palaces[(hIndex + 4) % 9]; // 假设时干落宫与日干有位移
  const currentDoor = doors[date.getHours() % 8];

  const meElement = PALACE_ELEMENT[dayPalace];
  const matterElement = PALACE_ELEMENT[hourPalace];

  // 2. 评分逻辑 (Rule Engine)
  let score = 60; // 初始分
  let summary = "";
  const factors: string[] = [];

  // 因子1：门吉凶 (权重 40%)
  const dScore = DOOR_SCORE[currentDoor] || 0;
  score += dScore;
  factors.push(`临${currentDoor}门`);
  
  if (['开', '休', '生'].includes(currentDoor)) factors.push("吉门相照");
  if (['死', '惊', '伤'].includes(currentDoor)) factors.push("凶门阻隔");

  // 因子2：主客关系 (宫位五行生克) (权重 60%)
  if (matterElement === meElement) {
    score += 10;
    summary = "比和格，利于合作，平稳";
    factors.push("主客比和");
  } else if (GENERATION[matterElement] === meElement) {
    score += 20;
    summary = "生我者吉，外部环境有利，顺水推舟";
    factors.push("事来生人(大吉)");
  } else if (GENERATION[meElement] === matterElement) {
    score -= 10;
    summary = "我生者泄气，需要付出较大努力";
    factors.push("人去生事(泄耗)");
  } else if (CONTROL[meElement] === matterElement) {
    score += 5;
    summary = "我克者为财，虽能掌控但需劳心";
    factors.push("人克事(劳碌)");
  } else if (CONTROL[matterElement] === meElement) {
    score -= 30;
    summary = "克我者凶，外部压力大，不宜强求";
    factors.push("事克人(大凶)");
  }

  // 3. 判定信号灯
  let signal: SignalType = 'yellow';
  if (score >= 80) signal = 'green';
  else if (score <= 50) signal = 'red';

  // 4. 计算有效期 (当前时辰结束)
  const nextHour = date.getHours() + (date.getHours() % 2 === 0 ? 2 : 1);
  const validTime = new Date(date);
  validTime.setHours(nextHour, 0, 0, 0);

  return {
    signal,
    score,
    summary,
    factors,
    validUntil: `${validTime.getHours()}:00`,
    chartInfo: {
      dayStem, hourStem, dayPalace, hourPalace, door: currentDoor
    }
  };
}