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
  console.error("❌ 致命错误：未找到 API Key。");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

async function generateWithRetry(model, prompt, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await model.generateContent(prompt);
    } catch (error) {
      if ((error.message.includes('503') || error.message.includes('overloaded')) && i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; 
      } else {
        throw error;
      }
    }
  }
}

// 八字分析接口
app.post('/api/analyze', async (req, res) => {
  try {
    const { chart, currentYear } = req.body; 
    
    // 保护性获取数据
    const daYunStr = chart.daYun ? chart.daYun.map(d => d.ganZhi).join(',') : "暂无";
    const balanceStr = chart.balanceNote ? chart.balanceNote.join(', ') : "五行平衡";
    const lingShu = chart.lingShu || { lifePathNumber: 0 };

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      角色:资深命理师. 任务:八字及${currentYear}分析.
      [客观事实]
      八字:${chart.year.stem}${chart.year.branch} ${chart.month.stem}${chart.month.branch} ${chart.day.stem}${chart.day.branch} ${chart.hour.stem}${chart.hour.branch}
      日主:${chart.dayMaster} 格局:${chart.strength}
      大运:${daYunStr}
      评分:${chart.destinyScore} (这是硬指标)
      五行诊断:${balanceStr}
      灵数命数:${lingShu.lifePathNumber}

      [输出JSON]
      {
        "archetype": "命格赐名",
        "summary": "精评",
        "appearanceAnalysis": "容貌",
        "annualLuckAnalysis": "流年运势",
        "historicalFigures": [{"name":"名人","similarity":"90%","reason":"理由"}](5个),
        "strengthAnalysis": "格局",
        "bookAdvice": "古文",
        "bookAdviceTranslation": "白话",
        "careerAdvice": "事业",
        "healthAdvice": "健康",
        "numerologyAnalysis": "灵数解读"
      }
    `;

    const result = await generateWithRetry(model, prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Format Error");
    res.json(JSON.parse(jsonMatch[0]));

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ 新增：奇门决策接口
app.post('/api/qimen', async (req, res) => {
  try {
    const { type, context, result } = req.body; 
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const signalMap = { 'green': '🟢 可行动 (大吉)', 'yellow': '🟡 需观察 (平)', 'red': '🔴 不建议 (凶)' };
    const signalText = signalMap[result.signal];

    const prompt = `
      角色：奇门遁甲决策顾问。
      任务：根据盘面信号给出直截了当的建议。
      
      问题类型：${type}
      背景：${context || "无"}
      
      【盘面结果】
      信号：${signalText}
      评分：${result.score}
      判词：${result.summary}
      因子：${result.factors.join(', ')}

      请输出JSON：
      {
        "mainTendency": "核心判断 (1句话)",
        "reasoning": ["原因1", "原因2"], 
        "actionAdvice": "行动建议 (基于${signalText}，请给出具体策略)",
        "riskAlert": "风险提示"
      }
    `;
    
    const aiRes = await generateWithRetry(model, prompt);
    const text = aiRes.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI Error");
    res.json(JSON.parse(jsonMatch[0]));

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`✅ 后端服务器已启动: http://localhost:${port}`);
});