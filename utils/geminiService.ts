// 文件名: utils/geminiService.ts
import { BaziChart } from "./baziLogic";

// ⚠️ 注意：这里不需要 API Key 了，也不需要 GoogleGenerativeAI 库
// 所有的 AI 逻辑都移到了 server.js 里

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
    console.log("正在请求本地后端服务器 (localhost:3000)...");
    
    // 👇 这里是向你自己的 server.js 发送请求
    const response = await fetch('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chart }), 
    });

    if (!response.ok) {
      throw new Error(`服务器连接失败: ${response.statusText}`);
    }

    const data = await response.json();
    return data as AIAnalysisResult;

  } catch (error: any) {
    console.error("前端请求失败:", error);
    return mockAIResponse(chart, error.message || "无法连接到后端服务器");
  }
}

function mockAIResponse(chart: BaziChart, errorMsg: string): AIAnalysisResult {
  return {
    archetype: "连接失败",
    summary: `【错误详情】：${errorMsg}`,
    strengthAnalysis: "请确保你已经打开了第二个终端并运行了 'node server.js'。",
    bookAdvice: "无法连接后端。",
    careerAdvice: "暂无数据。",
    healthAdvice: "暂无数据。"
  };
}