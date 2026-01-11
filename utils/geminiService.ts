import { BaziChart } from "./baziLogic";

// 前端不再需要 API Key，也不需要 Google SDK
// const API_KEY = "xxxxxxxx"; <--- 已移除，安全！

export interface AIAnalysisResult {
  archetype: string;
  summary: string;
  strengthAnalysis: string;
  bookAdvice: string;
  careerAdvice: string;
  healthAdvice: string;
}

export async function analyzeBaziWithAI(chart: BaziChart): Promise<AIAnalysisResult> {
  try {
    console.log("正在请求本地后端服务器...");
    
    // 向我们刚才创建的 server.js 发起请求
    const response = await fetch('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chart }), // 发送八字数据
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || "后端请求失败");
    }

    const data = await response.json();
    return data as AIAnalysisResult;

  } catch (error: any) {
    console.error("❌ AI 分析失败:", error);
    return mockAIResponse(chart, error.message || "连接服务器失败");
  }
}

// 兜底模拟数据
function mockAIResponse(chart: BaziChart, errorMsg: string): AIAnalysisResult {
  return {
    archetype: "⚠️ 连接失败",
    summary: `【错误详情】：${errorMsg}`,
    strengthAnalysis: "请确保你已经运行了 'node server.js' 并且后端服务器正常工作。",
    bookAdvice: "无法连接后端。",
    careerAdvice: "暂无数据。",
    healthAdvice: "暂无数据。"
  };
}