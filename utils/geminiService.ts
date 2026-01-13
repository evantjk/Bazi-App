import { BaziChart } from "./baziLogic";
import { QimenResult, QimenType } from "./qimenLogic";
import { ZiweiChart } from "./ziweiLogic";

export interface HistoricalFigure { name: string; similarity: string; reason: string; }

export interface AIAnalysisResult {
  archetype: string; summary: string; appearanceAnalysis: string; annualLuckAnalysis: string;
  historicalFigures: HistoricalFigure[]; strengthAnalysis: string; bookAdvice: string;
  bookAdviceTranslation: string; careerAdvice: string; healthAdvice: string; numerologyAnalysis: string;
}

export interface QimenAIResult {
  mainTendency: string; reasoning: string[]; actionAdvice: string; riskAlert: string;
}

export interface ZiweiAIResult {
  pattern: string;
  lifeAnalysis: string;
  wealthAnalysis: string;
  careerAnalysis: string;
  loveAnalysis: string;
}

// Helper to handle fetch errors
async function fetchAPI<T>(endpoint: string, body: any): Promise<T> {
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
}

export async function analyzeBaziWithAI(chart: BaziChart, currentYear: number = 2026): Promise<AIAnalysisResult> {
    return fetchAPI<AIAnalysisResult>('/api/analyze', { chart, currentYear });
}

export async function analyzeQimenWithAI(type: QimenType, context: string, result: QimenResult): Promise<QimenAIResult> {
    try {
        return await fetchAPI<QimenAIResult>('/api/qimen', { type, context, result });
    } catch(e: any) {
        return { mainTendency: "AI服务暂不可用", reasoning: [], actionAdvice: "请参考红绿灯信号", riskAlert: e.message };
    }
}

export async function analyzeZiweiWithAI(chart: ZiweiChart): Promise<ZiweiAIResult> {
    try {
        return await fetchAPI<ZiweiAIResult>('/api/ziwei', { chart });
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