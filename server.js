import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("❌ 致命错误：未找到 GEMINI_API_KEY。请检查 .env 文件。");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

// 自动重试机制 (Google Gemini 专用)
async function generateWithRetry(model, prompt, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await model.generateContent(prompt);
    } catch (error) {
      const isOverloaded = error.message.includes('503') || error.message.includes('overloaded');
      if (isOverloaded && i < retries - 1) {
        console.warn(`⚠️ Google 服务器繁忙 (503)，正在第 ${i + 1} 次重试...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; 
      } else {
        throw error;
      }
    }
  }
}

app.post('/api/analyze', async (req, res) => {
  try {
    const { chart, currentYear, relations } = req.body; 
    
    // 数据准备
    const daYunStr = chart.daYun ? chart.daYun.map(d => d.ganZhi).join(',') : "暂无";
    const relationsStr = relations && relations.length > 0 ? relations.join(', ') : "本年无明显冲合";
    const balanceStr = chart.balanceNote ? chart.balanceNote.join(', ') : "五行平衡"; // ✅ 核心：把诊断结果喂给 AI

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", 
      generationConfig: {
        temperature: 0.2, // 保持低创造性，确保严谨
        topP: 0.8,
        topK: 40,
      }
    });

    // ⚡️ 价值观与边界控制 Prompt (Value-Aligned Prompt)
    const prompt = `
      【角色设定】
      你是一位理性、温和且有边界感的资深命理咨询师。你的职责是“解读”命盘信息，帮助用户认知自我、规避风险。
      ❌ 你不是算命先生，不搞迷信恐吓，不给绝对判决。
      
      【绝对禁忌 (Red Lines)】
      1. 严禁使用：“注定”、“必死”、“一定会”、“无法改变”、“大灾难”、“贫贱”等绝对化、宿命论词汇。
      2. 严禁预测死亡时间、具体疾病名称（如“你会得癌症”）。
      3. 严禁诱导付费或恐吓用户。

      【语言风格】
      - 建议式：用“建议关注”、“可能倾向于”、“适合考虑”代替“必须”、“一定”。
      - 建设性：指出问题后，必须给出改善方向（如性格调整、五行互补）。
      - 现代化：用现代职场、心理学术语解释古籍概念（如“伤官”解释为“创新能力/叛逆”）。

      【客观事实 (由系统计算提供)】
      八字: ${chart.year.stem}${chart.year.branch} ${chart.month.stem}${chart.month.branch} ${chart.day.stem}${chart.day.branch} ${chart.hour.stem}${chart.hour.branch}
      日主: ${chart.dayMaster} (${chart.dayMasterElement}) 
      格局强弱: ${chart.strength}
      大运: ${daYunStr}
      **命局评分: ${chart.destinyScore}** (这是参考分，请解释为何得此分，但强调后天努力可改变)
      **流年冲合: ${relationsStr}** (请重点分析这些客观存在的能量波动)
      **五行诊断: ${balanceStr}** (这是代码计算的硬指标，请针对这些过旺或过弱的元素给出调节建议)

      【输出任务 (纯JSON)】
      请返回如下 JSON，内容需符合上述原则：
      {
        "archetype": "命格赐名(4字,如金水相涵,富有画面感)",
        "summary": "30字精评(温暖、点题)",
        "appearanceAnalysis": "容貌气质描述(基于五行/麻衣神相,100字,优美)",
        "annualLuckAnalysis": "${currentYear}年流年运势(结合冲合关系${relationsStr},给出事业/财运/感情的趋势与建议,150字)",
        "historicalFigures": [{"name":"名人","similarity":"90%","reason":"相似点简述"}](5个),
        "strengthAnalysis": "格局深度分析(解释身强/身弱的利弊，而非好坏)",
        "bookAdvice": "穷通宝鉴建议(保留古文风韵)",
        "bookAdviceTranslation": "白话翻译(通俗易懂)",
        "careerAdvice": "事业发展建议(基于十神性格优势)",
        "healthAdvice": "健康管理建议(基于五行诊断${balanceStr},重点提醒薄弱环节的保养,不可诊断疾病)"
      }
    `;

    console.log(`正在请求 AI (顾问模式) 分析 [流年: ${currentYear}]...`);
    
    const result = await generateWithRetry(model, prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI 返回格式异常");

    const data = JSON.parse(jsonMatch[0]);
    res.json(data);

  } catch (error) {
    console.error("服务端报错:", error.message);
    res.status(500).json({ error: error.message || "服务器内部错误" });
  }
});

app.listen(port, () => {
  console.log(`✅ AI 命理顾问服务已启动: http://localhost:${port}`);
});