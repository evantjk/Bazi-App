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
  console.error("❌ 致命错误：未找到 API Key。请确保 .env 文件配置正确。");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

// 👇 新增：自动重试函数
// 如果遇到 503 (过载) 错误，会自动等待并重试，最多 3 次
async function generateWithRetry(model, prompt, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await model.generateContent(prompt);
    } catch (error) {
      const isOverloaded = error.message.includes('503') || error.message.includes('overloaded');
      
      if (isOverloaded && i < retries - 1) {
        console.warn(`⚠️ Google 服务器繁忙 (503)，正在进行第 ${i + 1} 次重试... (等待 ${delay}ms)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // 指数退避：每次等待时间翻倍 (2s -> 4s -> 8s)
      } else {
        throw error; // 如果重试多次还是不行，或者遇到其他错误，则抛出
      }
    }
  }
}

app.post('/api/analyze', async (req, res) => {
  try {
    const { chart, currentYear } = req.body; 
    
    const daYunStr = chart.daYun ? chart.daYun.map(d => d.ganZhi).join(',') : "暂无";

    // 💡 建议：如果 2.5 版本实在太堵，您可以随时改回 "gemini-1.5-flash"
    // 1.5-flash 是目前的生产环境主力，非常稳定，几乎不会 503
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", 
      generationConfig: {
        temperature: 0.1, 
        topP: 0.8,
        topK: 40,
      }
    });

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

    console.log(`正在请求 AI (gemini-2.5-flash) [含重试机制]...`);
    
    // 👇 使用重试函数调用
    const result = await generateWithRetry(model, prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
        throw new Error("AI 返回格式异常");
    }

    const jsonString = jsonMatch[0];
    const data = JSON.parse(jsonString);

    res.json(data);

  } catch (error) {
    console.error("服务端报错:", error.message);
    
    // 给前端返回更友好的错误提示
    if (error.message.includes('503') || error.message.includes('overloaded')) {
        res.status(503).json({ error: "AI 大脑正在燃烧（服务器繁忙），请过几秒钟再试一次！" });
    } else {
        res.status(500).json({ error: error.message || "服务器内部错误" });
    }
  }
});

app.listen(port, () => {
  console.log(`✅ 后端服务器已启动: http://localhost:${port}`);
});