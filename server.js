import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// ✅ 您的 API Key
const API_KEY = "AIzaSyCbumuVlE4jvsOD2PewUL5NcXW4IUIe1_M";

const genAI = new GoogleGenerativeAI(API_KEY);

app.post('/api/analyze', async (req, res) => {
  try {
    const { chart } = req.body;
    
    // 使用 Gemini 2.5 Flash
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.1, // 保持稳定
        topP: 0.8,
        topK: 40,
      }
    });

    const prompt = `
      (角色：精通《穷通宝鉴》与《三命通会》的资深命理大师)
      (任务：进行深度命理分析、评分及历史人物对标)
      
      【八字信息】
      八字：${chart.year.stem}${chart.year.branch} ${chart.month.stem}${chart.month.branch} ${chart.day.stem}${chart.day.branch} ${chart.hour.stem}${chart.hour.branch}
      日主：${chart.dayMaster} (${chart.dayMasterElement})
      月令：${chart.month.branch} (季节状态：${chart.seasonStatus})
      强弱初步判定：${chart.strength}
      五行分数：木${chart.fiveElementScore.wood}, 火${chart.fiveElementScore.fire}, 土${chart.fiveElementScore.earth}, 金${chart.fiveElementScore.gold}, 水${chart.fiveElementScore.water}

      【分析要求】
      请返回一个纯 JSON 对象，必须包含以下字段：

      1. "archetype": 命格赐名。请根据格局赋予一个霸气、古雅且富有画面感的四字名称（如“飞龙在天格”、“金白水清象”）。
      
      2. "score": 命局评分（0-100分）。
         - 评分标准：基于五行流通、调候是否得宜、格局清纯度进行公平打分。
         - 重要：对于同一个八字，评分必须保持严格一致，不要随意波动。

      3. "summary": 30字以内的精辟断语，直击要害。

      4. "historicalFigures": 一个包含5个对象的数组，列出与此八字格局相似的历史人物（古代或近代名人）。从相似度最高开始排列。每个对象包含：
         - "name": 人物名字
         - "similarity": 相似度（例如 95%）
         - "reason": 简短理由（例如“同为伤官配印格，才华横溢”）

      5. "strengthAnalysis": 深度分析身强身弱及格局成败（100字左右）。
      
      6. "bookAdvice": 模仿《穷通宝鉴》的文言文口吻，指出此八字的调候用神是什么，是否具备。（请用古文风格）
      
      7. "bookAdviceTranslation": 将上面的 "bookAdvice" 翻译成现代通俗易懂的白话文，解释其中的含义，方便现代人理解。
      
      8. "careerAdvice": 事业建议。
      
      9. "healthAdvice": 健康建议。
    `;

    console.log("正在请求 AI (gemini-2.5-flash) [含白话翻译]...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 清理 Markdown 标记
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