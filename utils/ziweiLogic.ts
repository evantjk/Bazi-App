import { Lunar } from 'lunar-typescript';

// --- Types ---
export interface Star {
  name: string;
  type: 'major' | 'minor' | 'bad' | 'good'; 
  brightness?: string; 
}

export interface Palace {
  index: number;      
  earthlyBranch: string; 
  heavenlyStem: string;  
  name: string;       
  majorStars: Star[]; 
  minorStars: Star[]; 
  isBodyPalace: boolean; 
  decades: string;    
}

export interface ZiweiChart {
  palaces: Palace[];  
  element: string;    
  lifePalaceIndex: number;
  bodyPalaceIndex: number;
}

const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const PALACE_NAMES = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '交友', '官禄', '田宅', '福德', '父母'];
const ELEMENT_MAP: Record<number, string> = { 2: '水二局', 3: '木三局', 4: '金四局', 5: '土五局', 6: '火六局' };

// --- Core Calculation ---

function getMingShenIndex(month: number, hourIndex: number) {
  let ming = (2 + (month - 1) - hourIndex) % 12;
  if (ming < 0) ming += 12;
  let shen = (2 + (month - 1) + hourIndex) % 12; 
  return { ming, shen };
}

function getFiveElementBureau(stem: string, branch: string): number {
  const stemIdx = Math.floor(STEMS.indexOf(stem) / 2); 
  const branchIdx = Math.floor(BRANCHES.indexOf(branch) / 2) % 3; 
  const matrix = [
    [4, 2, 6], [2, 6, 5], [6, 5, 3], [5, 3, 4], [3, 4, 2]  
  ];
  return matrix[stemIdx][branchIdx];
}

function getZiweiIndex(bureau: number, day: number): number {
  const basicOffset = 2; 
  return (basicOffset + day) % 12; 
}

function getMajorStars(ziweiIdx: number, tianfuIdx: number) {
  const zSeries = [
    { name: '紫微', offset: 0 }, { name: '天机', offset: -1 }, 
    { name: '太阳', offset: -3 }, { name: '武曲', offset: -4 }, 
    { name: '天同', offset: -5 }, { name: '廉贞', offset: -8 }
  ];
  const tSeries = [
    { name: '天府', offset: 0 }, { name: '太阴', offset: 1 }, 
    { name: '贪狼', offset: 2 }, { name: '巨门', offset: 3 }, 
    { name: '天相', offset: 4 }, { name: '天梁', offset: 5 }, 
    { name: '七杀', offset: 6 }, { name: '破军', offset: 10 }
  ];

  const stars: Record<number, Star[]> = {};
  
  zSeries.forEach(s => {
    let idx = (ziweiIdx + s.offset) % 12;
    if (idx < 0) idx += 12;
    if (!stars[idx]) stars[idx] = [];
    stars[idx].push({ name: s.name, type: 'major' });
  });

  tSeries.forEach(s => {
    let idx = (tianfuIdx + s.offset) % 12;
    if (idx < 0) idx += 12;
    if (!stars[idx]) stars[idx] = [];
    stars[idx].push({ name: s.name, type: 'major' });
  });

  return stars;
}

export function calculateZiwei(date: Date): ZiweiChart {
  const lunar = Lunar.fromDate(date);
  const month = lunar.getMonth();
  const day = lunar.getDay();
  const hourIndex = Math.floor((date.getHours() + 1) / 2) % 12; 
  
  const { ming, shen } = getMingShenIndex(month, hourIndex);
  
  const yearGan = lunar.getYearGan();
  const startStemMap: Record<string, number> = { '甲': 2, '己': 2, '乙': 4, '庚': 4, '丙': 6, '辛': 6, '丁': 8, '壬': 8, '戊': 0, '癸': 0 };
  const startStemIdx = startStemMap[yearGan]; 

  const palaces: Palace[] = [];
  for (let i = 0; i < 12; i++) {
    const branch = BRANCHES[i];
    let stemOffset = i - 2;
    if (stemOffset < 0) stemOffset += 12;
    const stemIdx = (startStemIdx + stemOffset) % 10;
    
    let nameIdx = (ming - i) % 12;
    if (nameIdx < 0) nameIdx += 12;
    const name = PALACE_NAMES[nameIdx];

    palaces.push({
      index: i,
      earthlyBranch: branch,
      heavenlyStem: STEMS[stemIdx],
      name: name,
      majorStars: [],
      minorStars: [],
      isBodyPalace: i === shen,
      decades: '' 
    });
  }

  const mingPalace = palaces[ming];
  const bureauNum = getFiveElementBureau(mingPalace.heavenlyStem, mingPalace.earthlyBranch);
  
  const ziweiIdx = getZiweiIndex(bureauNum, day);
  let tianfuIdx = (4 - ziweiIdx) % 12;
  if (tianfuIdx < 0) tianfuIdx += 12;

  const starsMap = getMajorStars(ziweiIdx, tianfuIdx);
  palaces.forEach(p => {
    if (starsMap[p.index]) {
      p.majorStars = starsMap[p.index];
    }
  });

  const isYangGender = true; // Defaulting for MVP
  const isYangStem = ['甲','丙','戊','庚','壬'].includes(yearGan);
  const isClockwise = (isYangStem && isYangGender) || (!isYangStem && !isYangGender);
  
  let startAge = bureauNum;
  for (let k = 0; k < 12; k++) {
      let offset = isClockwise ? k : -k;
      let pIdx = (ming + offset) % 12;
      if (pIdx < 0) pIdx += 12;
      
      const endAge = startAge + 9;
      palaces[pIdx].decades = `${startAge}-${endAge}`;
      startAge += 10;
  }

  return {
    palaces,
    element: ELEMENT_MAP[bureauNum],
    lifePalaceIndex: ming,
    bodyPalaceIndex: shen
  };
}