import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// 读取 Google Key
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("❌ 致命错误：未找到 GEMINI_API_KEY。请检查 .env 文件。");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

// 👇 自动重试机制 (解决 Google 503 服务器繁忙问题)
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
    const { chart, currentYear } = req.body; 
    
    // 保护性获取大运
    const daYunStr = chart.daYun ? chart.daYun.map(d => d.ganZhi).join(',') : "暂无";

    // 使用 Gemini 2.5 Flash (如果觉得慢或报错多，可改为 "gemini-1.5-flash")
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", 
      generationConfig: {
        temperature: 0.1, 
        topP: 0.8,
        topK: 40,
      }
    });

    // ⚡️ 极简 Prompt (省 Token)
    const prompt = `
      角色:资深命理师. 任务:八字及${currentYear}流年分析.
      
      [信息]
      八字:${chart.year.stem}${chart.year.branch} ${chart.month.stem}${chart.month.branch} ${chart.day.stem}${chart.day.branch} ${chart.hour.stem}${chart.hour.branch}
      日主:${chart.dayMaster}(${chart.dayMasterElement}) 格局:${chart.strength}
      大运:${daYunStr}
      流年:${currentYear}

      [要求]
      输出纯JSON,无Markdown. 字段如下:
      {
        "archetype": "命格赐名(4字,如金水相涵)",
        "score": 评分(0-100),
        "summary": "30字精评",
        "appearanceAnalysis": "容貌气质描述(基于五行/麻衣神相,100字)",
        "annualLuckAnalysis": "${currentYear}年事业财运感情吉凶(结合大运流年,150字)",
        "historicalFigures": [{"name":"名人名","similarity":"相似度","reason":"理由"}](5个),
        "strengthAnalysis": "格局成败分析",
        "bookAdvice": "穷通宝鉴建议(古文)",
        "bookAdviceTranslation": "白话翻译",
        "careerAdvice": "事业建议",
        "healthAdvice": "健康建议"
      }
    `;

    console.log(`正在请求 AI (Google Gemini) 分析 [流年: ${currentYear}]...`);
    
    // 带重试的调用
    const result = await generateWithRetry(model, prompt);
    const response = await result.response;
    const text = response.text();
    
    // 强制提取 JSON
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
  console.log(`✅ Google Gemini 后端已启动: http://localhost:${port}`);
});