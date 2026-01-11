import { GoogleGenerativeAI } from "@google/generative-ai";
import { BaziChart } from "./baziLogic";

// 👇 请确认您的 Key 依然在这里
const API_KEY = "AIzaSyD2C5REWdqnlMAKBLasVlqcCkLN4Bey760"; 

const genAI = new GoogleGenerativeAI(API_KEY);

export interface AIAnalysisResult {
  archetype: string;
  summary: string;
  strengthAnalysis: string;
  bookAdvice: string;
  careerAdvice: string;
  healthAdvice: string;
}

export async function analyzeBaziWithAI(chart: BaziChart): Promise<AIAnalysisResult> {
  // 1. 基础检查
  if (!API_KEY || API_KEY.includes("YOUR_GEMINI") || API_KEY.includes("粘贴你的")) {
    return mockAIResponse(chart, "API Key 未正确填写，请检查代码。");
  }

  try {
    // 尝试使用更轻量快速的模型，成功率通常更高
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      (角色：精通《穷通宝鉴》的命理大师)
      (任务：返回JSON格式的八字深度分析)
      
      八字：${chart.year.stem}${chart.year.branch} ${chart.month.stem}${chart.month.branch} ${chart.day.stem}${chart.day.branch} ${chart.hour.stem}${chart.hour.branch}
      日主：${chart.dayMaster}，月令：${chart.month.branch}
      强弱初步判定：${chart.strength}

      请返回JSON对象，包含字段：
      archetype (4个字以内充满诗意的命格名),
      summary (30字精辟断语),
      strengthAnalysis (强弱格局深度分析),
      bookAdvice (穷通宝鉴调候建议),
      careerAdvice (事业建议),
      healthAdvice (健康建议)。
    `;

    console.log("正在请求 Gemini API...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // 清理 Markdown
    const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonString);

  } catch (error: any) {
    console.error("❌ AI 报错详情:", error);
    
    // 提取具体的错误信息
    let errorMsg = "未知错误";
    if (error instanceof Error) {
        errorMsg = error.message;
    } else if (typeof error === 'string') {
        errorMsg = error;
    }

    // 常见错误翻译
    if (errorMsg.includes("fetch")) errorMsg += " (网络请求失败，请检查VPN或网络连接)";
    if (errorMsg.includes("400")) errorMsg += " (请求无效，可能是API Key格式不对)";
    if (errorMsg.includes("403")) errorMsg += " (权限被拒绝，可能是Key无效或地区不支持)";
    if (errorMsg.includes("429")) errorMsg += " (请求过于频繁，触发限制)";

    return mockAIResponse(chart, errorMsg);
  }
}

// 兜底数据显示（带错误报告）
function mockAIResponse(chart: BaziChart, errorMsg: string): AIAnalysisResult {
  return {
    archetype: "⚠️ 连接报错",
    summary: `【错误详情】：${errorMsg}`, // 👈 这里会显示具体原因
    strengthAnalysis: "AI 服务暂时不可用，无法进行深度分析。",
    bookAdvice: "无法连接古籍数据库。",
    careerAdvice: "暂无数据。",
    healthAdvice: "暂无数据。"
  };
}