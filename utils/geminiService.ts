import { BaziChart } from "./baziLogic";
import { QimenResult, QimenType } from "./qimenLogic"; // 引入类型

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

// 奇门 AI 结果接口
export interface QimenAIResult {
  mainTendency: string;
  reasoning: string[];
  actionAdvice: string;
  riskAlert: string;
}

// 原有的八字分析
export async function analyzeBaziWithAI(chart: BaziChart, currentYear: number = 2026, relations: string[] = []): Promise<AIAnalysisResult> {
  // ... (保持原有的 fetch 代码，为了节省篇幅，这里复用您之前的代码)
  // 请确保这里包含 fetch('/api/analyze') 的逻辑
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chart, currentYear, relations }), 
    });
    if (!response.ok) throw new Error("Server Error");
    return await response.json();
  } catch (error: any) {
    console.error("Fetch Error:", error);
    return mockAIResponse(chart, error.message);
  }
}

// ✅ 新增：奇门分析
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
      reasoning: ["网络连接失败", "无法获取AI建议"],
      actionAdvice: "请参考信号灯指示行动",
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