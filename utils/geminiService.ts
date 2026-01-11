import { GoogleGenerativeAI } from "@google/generative-ai";
import { BaziChart } from "./baziLogic";

// 👇👇👇 请直接把你的 API KEY 粘贴在下面这个引号里 👇👇👇
const API_KEY = "AIzaSyB52Mg25XPxHfjZ1Q-PSN0VHJVz9ASrEvE"; 

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
  // ✅ 修复：只检查是否为空或包含默认提示语，不再拦截你的真实 Key
  if (!API_KEY || API_KEY === "AIzaSyB52Mg25XPxHfjZ1Q-PSN0VHJVz9ASrEvE" || API_KEY.includes("YOUR_GEMINI")) {
    console.warn("⚠️ API Key 未配置或无效，正在使用模拟数据");
    return mockAIResponse(chart);
  }

  try {
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

    console.log("正在请求 Gemini API...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // 清理 Markdown 标记
    const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonString);

  } catch (error) {
    console.error("❌ AI 分析失败:", error);
    return mockAIResponse(chart);
  }
}

// 兜底模拟数据
function mockAIResponse(chart: BaziChart): AIAnalysisResult {
  return {
    archetype: "等待配置 API Key",
    summary: "请检查代码 utils/geminiService.ts 中的 API_KEY 是否正确填写。",
    strengthAnalysis: `系统判定为${chart.strength}。请填写有效的 Gemini API Key 以获取 AI 深度分析。`,
    bookAdvice: "API 连接未成功，无法检索古籍。",
    careerAdvice: "暂无数据。",
    healthAdvice: "暂无数据。"
  };
}