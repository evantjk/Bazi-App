import { BaziChart } from "./baziLogic";
import { QimenResult, QimenType } from "./qimenLogic";
import { ZiweiChart } from "./ziweiLogic";

// --- 接口定义 ---
export interface HistoricalFigure { 
  name: string; 
  similarity: string; 
  reason: string; 
}

export interface AIAnalysisResult {
  archetype: string; 
  summary: string; 
  appearanceAnalysis: string; 
  annualLuckAnalysis: string;
  historicalFigures: HistoricalFigure[]; 
  strengthAnalysis: string; 
  bookAdvice: string;
  bookAdviceTranslation: string; 
  careerAdvice: string; 
  healthAdvice: string; 
  numerologyAnalysis: string;
}

export interface QimenAIResult {
  mainTendency: string; 
  reasoning: string[]; 
  actionAdvice: string; 
  riskAlert: string;
}

export interface ZiweiAIResult {
  pattern: string;
  lifeAnalysis: string;
  wealthAnalysis: string;
  careerAnalysis: string;
  loveAnalysis: string;
}

// --- 通用 Fetch 函数 (增加了 useProModel 参数) ---
async function fetchAPI<T>(endpoint: string, body: any): Promise<T> {
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        
        if (!response.ok) {
            const text = await response.text();
            let errorMsg = "Server Error";
            try {
                const errorObj = JSON.parse(text);
                if (errorObj.error) errorMsg = errorObj.error;
            } catch (e) {
                errorMsg = text || response.statusText;
            }
            throw new Error(errorMsg);
        }
        return await response.json();
    } catch (error: any) {
        throw error;
    }
}

// --- 业务函数 (透传 useProModel) ---

export async function analyzeBaziWithAI(chart: BaziChart, currentYear: number = 2026, useProModel: boolean = false): Promise<AIAnalysisResult> {
    return fetchAPI<AIAnalysisResult>('/api/analyze', { chart, currentYear, useProModel });
}

export async function analyzeQimenWithAI(type: QimenType, context: string, result: QimenResult, useProModel: boolean = false): Promise<QimenAIResult> {
    try {
        return await fetchAPI<QimenAIResult>('/api/qimen', { type, context, result, useProModel });
    } catch(e: any) {
        // 奇门如果 AI 挂了，返回保底数据
        return { 
            mainTendency: "AI 服务暂时繁忙", 
            reasoning: ["网络拥堵", "请稍后再试"], 
            actionAdvice: "请直接参考上方的红绿灯信号进行决策。", 
            riskAlert: e.message 
        };
    }
}

export async function analyzeZiweiWithAI(chart: ZiweiChart, useProModel: boolean = false): Promise<ZiweiAIResult> {
    try {
        return await fetchAPI<ZiweiAIResult>('/api/ziwei', { chart, useProModel });
    } catch(e: any) {
        return { 
            pattern: "连接中断", 
            lifeAnalysis: "无法获取分析数据", 
            wealthAnalysis: "...", 
            careerAnalysis: "...", 
            loveAnalysis: "..." 
        };
    }
}