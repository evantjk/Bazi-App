import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 加载 .env 中的环境变量
dotenv.config();

const app = express();
const port = 3000;

// 允许跨域请求（允许你的前端访问这个服务器）
app.use(cors());
// 允许解析 JSON 格式的请求体
app.use(express.json());

const API_KEY = process.env.GEMINI_API_KEY;

// 初始化 Gemini
const genAI = new GoogleGenerativeAI(API_KEY);

app.post('/api/analyze', async (req, res) => {
  try {
    const { chart } = req.body;

    if (!API_KEY) {
      return res.status(500).json({ error: "服务器端未配置 API Key" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // 这里复用之前的 Prompt 逻辑
    const prompt = `
      (角色：精通《穷通宝鉴》、《三命通会》、《滴天髓》的资深命理大师)
      (任务：返回JSON格式的八字深度分析)
      
      八字：${chart.year.stem}${chart.year.branch} ${chart.month.stem}${chart.month.branch} ${chart.day.stem}${chart.day.branch} ${chart.hour.stem}${chart.hour.branch}
      日主：${chart.dayMaster} (${chart.dayMasterElement})
      月令：${chart.month.branch} (季节状态：${chart.seasonStatus})
      强弱初步判定：${chart.strength}
      五行分数：木${chart.fiveElementScore.wood}, 火${chart.fiveElementScore.fire}, 土${chart.fiveElementScore.earth}, 金${chart.fiveElementScore.gold}, 水${chart.fiveElementScore.water}

      请返回JSON对象（不要Markdown格式，纯JSON），包含以下字段：
      1. "archetype": 4个字以内充满诗意和画面感的命格称呼（例如“金水相涵格”、“木火通明之象”）。
      2. "summary": 30字以内的精辟断语。
      3. "strengthAnalysis": 结合月令和通根情况，深度分析身强身弱及格局成败。
      4. "bookAdvice": 模仿《穷通宝鉴》的口吻，指出此八字的调候用神是什么，是否具备。
      5. "careerAdvice": 基于十神组合的事业建议。
      6. "healthAdvice": 基于五行过旺或过弱的健康预警。
    `;

    console.log("正在向 Google Gemini 请求分析...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 清理 Markdown 标记
    const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(jsonString);

    // 将结果返回给前端
    res.json(data);

  } catch (error) {
    console.error("服务端 AI 报错:", error);
    res.status(500).json({ 
      error: "AI 分析失败", 
      details: error.message 
    });
  }
});

app.listen(port, () => {
  console.log(`Backend Server running at http://localhost:${port}`);
});