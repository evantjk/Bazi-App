import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
// 👇 1. 引入 dotenv 库，这是隐藏 Key 的关键
import 'dotenv/config'; 

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// 👇 2. 安全读取 Key
// 代码里没有 Key，它会去 .env 文件里找 GEMINI_API_KEY
const API_KEY = process.env.GEMINI_API_KEY;

// 安全检查：如果没找到 Key，报错并停止
if (!API_KEY) {
  console.error("❌ 致命错误：未找到 API Key。");
  console.error("请检查项目根目录下是否有 .env 文件，且包含 GEMINI_API_KEY=...");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

app.post('/api/analyze', async (req, res) => {
  try {
    const { chart, currentYear } = req.body; 
    
    // 保护性获取大运数据
    const daYunStr = chart.daYun ? chart.daYun.map(d => d.ganZhi).join(',') : "暂无";

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.1, 
        topP: 0.8,
        topK: 40,
      }
    });

    // 👇 3. Token 节省优化版 Prompt
    // 删除了所有废话，只保留核心结构，既省钱又准确
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

    console.log(`正在请求 AI (gemini-2.5-flash) [安全模式+Token优化]...`);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // 正则提取 JSON，防止 AI 说废话导致报错
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
        throw new Error("AI 返回格式异常");
    }

    const jsonString = jsonMatch[0];
    const data = JSON.parse(jsonString);

    res.json(data);

  } catch (error) {
    console.error("服务端报错:", error);
    res.status(500).json({ error: error.message || "服务器内部错误" });
  }
});

app.listen(port, () => {
  console.log(`✅ 后端服务器已启动: http://localhost:${port}`);
});