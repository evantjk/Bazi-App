import { GoogleGenerativeAI } from "@google/generative-ai";
import { BaziChart } from "./baziLogic";

// ⚠️ 注意：在实际生产环境中，API Key 应该由后端代理调用，不要直接暴露在前端代码中。
// 为了演示方便，请在这里填入你的 API KEY，或者在 .env 文件中设置 VITE_GEMINI_API_KEY
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyB52Mg25XPxHfjZ1Q-PSN0VHJVz9ASrEvE";

const genAI = new GoogleGenerativeAI(API_KEY);

export interface AIAnalysisResult {
  archetype: string;    // AI 决定的命格称呼 (e.g., "潜龙勿用之格")
  summary: string;      // 一句话总结
  strengthAnalysis: string; // 强弱与格局深度分析
  bookAdvice: string;   // 模拟《穷通宝鉴》/《滴天髓》的调候建议
  careerAdvice: string; // 事业建议
  healthAdvice: string; // 健康建议
}

export async function analyzeBaziWithAI(chart: BaziChart): Promise<AIAnalysisResult> {
  if (API_KEY === "AIzaSyB52Mg25XPxHfjZ1Q-PSN0VHJVz9ASrEvE") {
    console.warn("缺少 Gemini API Key，返回模拟数据");
    return mockAIResponse(chart);
  }

  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `
    你是一位精通《穷通宝鉴》、《三命通会》、《滴天髓》的资深命理大师。
    请根据以下八字排盘数据进行深度分析。

    【八字信息】
    日主：${chart.dayMaster} (${chart.dayMasterElement})
    月令：${chart.month.branch} (季节状态：${chart.seasonStatus})
    四柱：
    - 年：${chart.year.stem}${chart.year.branch}
    - 月：${chart.month.stem}${chart.month.branch}
    - 日：${chart.day.stem}${chart.day.branch}
    - 时：${chart.hour.stem}${chart.hour.branch}
    
    五行分数：木${chart.fiveElementScore.wood}, 火${chart.fiveElementScore.fire}, 土${chart.fiveElementScore.earth}, 金${chart.fiveElementScore.gold}, 水${chart.fiveElementScore.water}
    系统初步判定：${chart.strength}

    【任务要求】
    请返回一个 JSON 对象（不要Markdown格式，纯JSON），包含以下字段：
    1. "archetype": 根据格局极其富有诗意和画面感的命格称呼（例如“金水相涵格”、“木火通明之象”），不要用普通的词汇。
    2. "summary": 30字以内的精辟断语。
    3. "strengthAnalysis": 结合月令和通根情况，深度分析身强身弱及格局成败。
    4. "bookAdvice": 模仿《穷通宝鉴》的口吻，指出此八字的调候用神是什么，是否具备。
    5. "careerAdvice": 基于十神组合的事业建议。
    6. "healthAdvice": 基于五行过旺或过弱的健康预警。

    语言风格：专业、古雅但通俗易懂。
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // 清理可能存在的 Markdown 代码块标记
    const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("AI Analysis Failed:", error);
    return mockAIResponse(chart);
  }
}

// 模拟数据（当没有 API Key 时兜底显示）
function mockAIResponse(chart: BaziChart): AIAnalysisResult {
  return {
    archetype: "等待 AI 觉醒...",
    summary: "请在代码中配置 Gemini API Key 以解锁真实 AI 算命。",
    strengthAnalysis: `系统判定为${chart.strength}。需结合API分析更能详尽。`,
    bookAdvice: "《穷通宝鉴》数据需要 AI 实时检索。",
    careerAdvice: "配置 AI 后可获取。",
    healthAdvice: "配置 AI 后可获取。"
  };
}