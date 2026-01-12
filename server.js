import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config'; // 👈 必须引用这个库

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// ✅ 正确做法：从 .env 文件读取
// ❌ 绝对不要在这里写 "AIzaSy..." 字符串！
const API_KEY = process.env.GEMINI_API_KEY;

// 检查是否成功读取
if (!API_KEY) {
  console.error("❌ 致命错误：未找到 API Key！");
  console.error("请检查：1. 根目录下是否有 .env 文件");
  console.error("       2. .env 文件里是否写了 GEMINI_API_KEY=你的Key");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

app.post('/api/analyze', async (req, res) => {
  try {
    const { chart, currentYear } = req.body; 
    
    const daYunStr = chart.daYun ? chart.daYun.map(d => d.ganZhi).join(', ') : "暂无大运数据";

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.1, 
        topP: 0.8,
        topK: 40,
      }
    });

    const prompt = `
      (角色：精通《穷通宝鉴》、《三命通会》与《麻衣神相》的资深命理大师)
      (任务：八字全盘分析 + 容貌画像 + ${currentYear}流年运势)
      
      【基本信息】
      八字：${chart.year.stem}${chart.year.branch} ${chart.month.stem}${chart.month.branch} ${chart.day.stem}${chart.day.branch} ${chart.hour.stem}${chart.hour.branch}
      日主：${chart.dayMaster} (${chart.dayMasterElement})
      格局：${chart.strength}
      大运：${daYunStr} (AI请自行推算当前大运)
      当前流年：${currentYear}年 (丙午年)

      【分析要求 (必须返回纯JSON)】
      请返回一个纯 JSON 对象，不要包含任何Markdown标记或额外的文字，必须严格包含以下字段：

      1. "archetype": 命格赐名 (如“金水相涵格”)。
      2. "score": 命局评分 (0-100)。
      3. "summary": 30字短评。
      
      4. "appearanceAnalysis": 【容貌分析】
         - 基于八字五行描述长相特征 (例如：金多皮肤白、木多修长、土多敦实、火多面红)。
         - 描述气质 (如：清秀、威严、儒雅)。
         - 用词优美，带有《麻衣神相》的风格，100字左右。

      5. "annualLuckAnalysis": 【${currentYear} 流年运势】
         - 结合原局、当前大运与 ${currentYear} 丙午流年进行推断。
         - 重点分析：事业、财运、感情的变化。
         - 给出具体的吉凶预警 (150字左右)。

      6. "historicalFigures": 5个相似历史人物 (包含 name, similarity, reason)。
      7. "strengthAnalysis": 格局成败分析。
      8. "bookAdvice": 穷通宝鉴古文建议。
      9. "bookAdviceTranslation": 穷通宝鉴白话翻译。
      10. "careerAdvice": 事业建议。
      11. "healthAdvice": 健康建议。
    `;

    console.log(`正在请求 AI (gemini-2.5-flash) 分析 [流年: ${currentYear}]...`);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
        throw new Error("AI 返回的内容不包含有效的 JSON 数据");
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