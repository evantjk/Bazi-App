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
    
    // 数据准备
    const daYunStr = chart.daYun ? chart.daYun.map(d => d.ganZhi).join(',') : "暂无";
    const balanceStr = chart.balanceNote ? chart.balanceNote.join(', ') : "五行平衡";
    const lingShu = chart.lingShu || { lifePathNumber: 0 };

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      【角色设定】
      你是一位精通《三命通会》、《穷通宝鉴》与《麻衣神相》的资深中文命理顾问。
      
      【语言要求】
      1. 全程使用**简体中文**。
      2. 用词专业、优雅、温和，严禁中英文夹杂。
      3. 风格：理性分析，拒绝封建迷信恐吓。

      【客观事实】
      八字: ${chart.year.stem}${chart.year.branch} ${chart.month.stem}${chart.month.branch} ${chart.day.stem}${chart.day.branch} ${chart.hour.stem}${chart.hour.branch}
      日主: ${chart.dayMaster} 格局: ${chart.strength}
      大运: ${daYunStr}
      评分: ${chart.destinyScore} (这是硬指标)
      五行: ${balanceStr}
      灵数: ${lingShu.lifePathNumber}

      【输出任务 (必须严格返回此JSON结构)】
      {
        "archetype": "命格赐名(4字,如金水相涵)",
        "summary": "30字精评(温暖、点题)",
        "appearanceAnalysis": "容貌气质描述(基于五行/麻衣神相,100字,优美中文)",
        "annualLuckAnalysis": "${currentYear}年流年运势(结合大运,给出事业/财运/感情建议)",
        "historicalFigures": [
            {"name":"历史名人","similarity":"90%","reason":"相似点简述"}
        ],
        "strengthAnalysis": "格局深度分析(身强/身弱的利弊)",
        "bookAdvice": "穷通宝鉴/三命通会建议(保留古文风韵)",
        "bookAdviceTranslation": "古文的白话文翻译(通俗易懂)",
        "careerAdvice": "事业发展建议(基于十神优势)",
        "healthAdvice": "健康管理建议(基于五行强弱)",
        "numerologyAnalysis": "灵数解读(性格与天赋)"
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

// 奇门决策接口
app.post('/api/qimen', async (req, res) => {
  try {
    const { type, context, result } = req.body; 
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const signalMap = { 'green': '🟢 可行动 (大吉)', 'yellow': '🟡 需观察 (平)', 'red': '🔴 不建议 (凶)' };
    const signalText = signalMap[result.signal];

    const prompt = `
      角色：奇门遁甲决策顾问。
      语言：**简体中文**。
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