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
    if (!response.ok) throw new Error("Server Error");
    return await response.json();
  } catch (error: any) {
    return mockAIResponse(chart, error.message);
  }
}

// ✅ 新增奇门接口
export async function analyzeQimenWithAI(type: QimenType, context: string, result: QimenResult): Promise<QimenAIResult> {
  try {
    const response = await fetch('/api/qimen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, context, result }), 
    });
    if (!response.ok) throw new Error("Server Error");
    return await response.json();
  } catch (error: any) {
    return {
      mainTendency: "连接中断，仅显示盘面数据",
      reasoning: ["网络连接失败", "请检查网络"],
      actionAdvice: "请直接参考信号灯行动",
      riskAlert: "数据仅供参考"
    };
  }
}

function mockAIResponse(chart: BaziChart, errorMsg: string): AIAnalysisResult {
  return {
    archetype: "连接中断", summary: errorMsg, appearanceAnalysis: "...", annualLuckAnalysis: "...",
    historicalFigures: [], strengthAnalysis: "...", bookAdvice: "...", bookAdviceTranslation: "...",
    careerAdvice: "...", healthAdvice: "...", numerologyAnalysis: "..."
  };
}