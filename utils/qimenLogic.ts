import { Solar, Lunar } from 'lunar-typescript';

// --- Types ---
export type QimenType = 'career' | 'wealth' | 'relationship' | 'travel' | 'study';
export type SignalType = 'green' | 'yellow' | 'red';

export interface QimenResult {
  signal: SignalType; 
  score: number;      
  summary: string;    
  factors: string[];  
  validUntil: string; 
  chartInfo: {        
    dayStem: string;  
    hourStem: string; 
    dayPalace: string; 
    hourPalace: string; 
    door: string;     
  }
}

export const QUESTION_TYPES: Record<QimenType, string> = {
  career: '事业/工作',
  wealth: '金钱/投资',
  relationship: '感情/人际',
  travel: '出行/行动',
  study: '学业/考试',
};

const GENERATION: Record<string, string> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
const CONTROL: Record<string, string> = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };

const PALACE_ELEMENT: Record<string, string> = {
  '坎': '水', '艮': '土', '震': '木', '巽': '木',
  '离': '火', '坤': '土', '兑': '金', '乾': '金', '中': '土' 
};

const DOOR_SCORE: Record<string, number> = {
  '开': 20, '休': 15, '生': 20, 
  '景': 5,  '杜': -5,           
  '伤': -10, '死': -20, '惊': -15 
};

// --- 核心计算逻辑 ---
export function calculateQimen(type: QimenType, date: Date): QimenResult {
  const solar = Solar.fromDate(date);
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();
  const dayStem = eightChar.getDayGan();   
  const hourStem = eightChar.getTimeGan(); 
  
  // 模拟排盘 (MVP版)
  const palaces = ['坎', '艮', '震', '巽', '离', '坤', '兑', '乾', '中'];
  const doors = ['开', '休', '生', '伤', '杜', '景', '死', '惊'];
  
  const hIndex = date.getHours() % 12; 
  const dayPalace = palaces[hIndex % 9];
  const hourPalace = palaces[(hIndex + 4) % 9]; 
  const currentDoor = doors[date.getHours() % 8];

  const meElement = PALACE_ELEMENT[dayPalace];
  const matterElement = PALACE_ELEMENT[hourPalace];

  let score = 60; 
  let summary = "";
  const factors: string[] = [];

  const dScore = DOOR_SCORE[currentDoor] || 0;
  score += dScore;
  factors.push(`临${currentDoor}门`);
  
  if (['开', '休', '生'].includes(currentDoor)) factors.push("吉门相照");
  if (['死', '惊', '伤'].includes(currentDoor)) factors.push("凶门阻隔");

  if (matterElement === meElement) {
    score += 10; summary = "比和格，平稳"; factors.push("主客比和");
  } else if (GENERATION[matterElement] === meElement) {
    score += 20; summary = "生我者吉，顺势"; factors.push("事来生人(大吉)");
  } else if (GENERATION[meElement] === matterElement) {
    score -= 10; summary = "我生者泄气"; factors.push("人去生事(泄耗)");
  } else if (CONTROL[meElement] === matterElement) {
    score += 5; summary = "我克者为财"; factors.push("人克事(掌控)");
  } else if (CONTROL[matterElement] === meElement) {
    score -= 30; summary = "克我者凶，压力大"; factors.push("事克人(大凶)");
  }

  let signal: SignalType = 'yellow';
  if (score >= 80) signal = 'green';
  else if (score <= 50) signal = 'red';

  const nextHour = date.getHours() + (date.getHours() % 2 === 0 ? 2 : 1);
  const validTime = new Date(date);
  validTime.setHours(nextHour, 0, 0, 0);

  return {
    signal, score, summary, factors,
    validUntil: `${validTime.getHours()}:00`,
    chartInfo: { dayStem, hourStem, dayPalace, hourPalace, door: currentDoor }
  };
}