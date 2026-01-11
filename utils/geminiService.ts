import { BaziChart } from "./baziLogic";

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
    console.log("正在请求后端 API (/api/analyze)...");
    
    // 👇 修复点：直接用相对路径，Vite 代理会自动转发给 server.js
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chart }), 
    });

    if (!response.ok) {
      // 尝试读取后端返回的错误信息
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
    summary: `【错误详情】：${errorMsg}`,
    strengthAnalysis: "请检查：1. 后端终端是否运行着 'node server.js'？ 2. 前端终端是否重启了 'npm run dev'？",
    bookAdvice: "无法连接。",
    careerAdvice: "暂无。",
    healthAdvice: "暂无。"
  };
}