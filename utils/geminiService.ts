import { BaziChart } from "./baziLogic";

export interface HistoricalFigure {
  name: string;
  similarity: string;
  reason: string;
}

export interface AIAnalysisResult {
  archetype: string;
  score: number;
  summary: string;
  appearanceAnalysis: string; // ✅ 新增：容貌分析
  annualLuckAnalysis: string; // ✅ 新增：流年运势
  historicalFigures: HistoricalFigure[];
  strengthAnalysis: string;
  bookAdvice: string;
  bookAdviceTranslation: string;
  careerAdvice: string;
  healthAdvice: string;
}

export async function analyzeBaziWithAI(chart: BaziChart, currentYear: number = 2026): Promise<AIAnalysisResult> {
  try {
    console.log("正在请求后端 API (/api/analyze)...");
    
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // ✅ 传递 currentYear 参数
      body: JSON.stringify({ chart, currentYear }), 
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMsg = response.statusText;
      try {
         const jsonError = JSON.parse(errorText);
         if(jsonError.error) errorMsg = jsonError.error;
      } catch(e) {}
      
      throw new Error(`请求失败 (${response.status}): ${errorMsg}`);
    }

    const data = await response.json();
    return data as AIAnalysisResult;

  } catch (error: any) {
    console.error("❌ 前端请求失败:", error);
    return mockAIResponse(chart, error.message || "无法连接到后端服务器");
  }
}

function mockAIResponse(chart: BaziChart, errorMsg: string): AIAnalysisResult {
  return {
    archetype: "连接中断",
    score: 0,
    summary: `【错误详情】：${errorMsg}`,
    appearanceAnalysis: "无法连接服务器。",
    annualLuckAnalysis: "无法连接服务器。",
    historicalFigures: [],
    strengthAnalysis: "请检查后端服务是否启动。",
    bookAdvice: "无法连接。",
    bookAdviceTranslation: "无法连接。",
    careerAdvice: "暂无。",
    healthAdvice: "暂无。"
  };
}