// 文件名: server.js
import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// 你的 API Key
const API_KEY = "AIzaSyCbumuVlE4jvsOD2PewUL5NcXW4IUIe1_M";

const genAI = new GoogleGenerativeAI(API_KEY);

app.post('/api/analyze', async (req, res) => {
  try {
    const { chart } = req.body;
    
    // 👇 关键修复：使用 2026 年的主流稳定版 "gemini-2.5-flash"
    // 之前的 1.5 系列已经下线，所以才报 404
    // 如果你想尝鲜最新版，也可以改成 "gemini-3-pro-preview"
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      (角色：精通《穷通宝鉴》的命理大师)
      (任务：返回JSON格式的八字深度分析)
      
      八字：${chart.year.stem}${chart.year.branch} ${chart.month.stem}${chart.month.branch} ${chart.day.stem}${chart.day.branch} ${chart.hour.stem}${chart.hour.branch}
      日主：${chart.dayMaster} (${chart.dayMasterElement})
      月令：${chart.month.branch} (季节状态：${chart.seasonStatus})
      强弱初步判定：${chart.strength}
      五行分数：木${chart.fiveElementScore.wood}, 火${chart.fiveElementScore.fire}, 土${chart.fiveElementScore.earth}, 金${chart.fiveElementScore.gold}, 水${chart.fiveElementScore.water}

      请返回JSON对象（不要Markdown格式，纯JSON），包含以下字段：
      1. "archetype": 4个字以内充满诗意和画面感的命格称呼。
      2. "summary": 30字以内的精辟断语。
      3. "strengthAnalysis": 结合月令和通根情况，深度分析身强身弱及格局成败。
      4. "bookAdvice": 模仿《穷通宝鉴》的口吻，指出此八字的调候用神是什么，是否具备。
      5. "careerAdvice": 基于十神组合的事业建议。
      6. "healthAdvice": 基于五行过旺或过弱的健康预警。
    `;

    console.log("正在向 Google Gemini (2.5-flash) 请求分析...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
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