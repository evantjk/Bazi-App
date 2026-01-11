import { BaziChart } from "./baziLogic";

export interface HistoricalFigure {
  name: string;
  similarity: string; // 例如 "95%"
  reason: string;
}

export interface AIAnalysisResult {
  archetype: string;       // 命格赐名
  score: number;           // AI 评分 (0-100)
  summary: string;
  historicalFigures: HistoricalFigure[]; // 历史人物列表
  strengthAnalysis: string;
  bookAdvice: string;
  careerAdvice: string;
  healthAdvice: string;
}

export async function analyzeBaziWithAI(chart: BaziChart): Promise<AIAnalysisResult> {
  try {
    console.log("正在请求后端 API (/api/analyze)...");
    
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chart }), 
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
    historicalFigures: [],
    strengthAnalysis: "请检查后端服务是否启动。",
    bookAdvice: "无法连接。",
    careerAdvice: "暂无。",
    healthAdvice: "暂无。"
  };
}