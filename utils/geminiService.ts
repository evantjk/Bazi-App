import { BaziChart } from "./baziLogic";
import { QimenResult, QimenType } from "./qimenLogic";

export interface HistoricalFigure { name: string; similarity: string; reason: string; }

export interface AIAnalysisResult {
  archetype: string; summary: string; appearanceAnalysis: string; annualLuckAnalysis: string;
  historicalFigures: HistoricalFigure[]; strengthAnalysis: string; bookAdvice: string;
  bookAdviceTranslation: string; careerAdvice: string; healthAdvice: string; numerologyAnalysis: string;
}

export interface QimenAIResult {
  mainTendency: string; reasoning: string[]; actionAdvice: string; riskAlert: string;
}

export async function analyzeBaziWithAI(chart: BaziChart, currentYear: number = 2026): Promise<AIAnalysisResult> {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chart, currentYear }), 
    });
    
    // ✅ 修复：解析真实错误原因
    if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = "Server Error";
        try {
            const errorObj = JSON.parse(errorText);
            if (errorObj.error) errorMsg = errorObj.error;
        } catch (e) {
            errorMsg = errorText || response.statusText;
        }
        throw new Error(errorMsg); 
    }
    
    return await response.json();
  } catch (error: any) {
    throw error; 
  }
}

export async function analyzeQimenWithAI(type: QimenType, context: string, result: QimenResult): Promise<QimenAIResult> {
  try {
    const response = await fetch('/api/qimen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, context, result }), 
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = "Server Error";
        try {
            const errorObj = JSON.parse(errorText);
            if (errorObj.error) errorMsg = errorObj.error;
        } catch (e) {
            errorMsg = errorText || response.statusText;
        }
        throw new Error(errorMsg);
    }
    return await response.json();
  } catch (error: any) {
    console.error("奇门 AI 错误:", error.message);
    return {
      mainTendency: "AI 服务暂时不可用",
      reasoning: ["请检查 API Key", error.message],
      actionAdvice: "请直接参考上方的红绿灯信号。",
      riskAlert: "数据仅供参考"
    };
  }
}