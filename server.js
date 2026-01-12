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

// 🛡️ 智能 JSON 提取器 (核心修复：解决 'Unexpected non-whitespace' 报错)
// 通过计算花括号的层级，精准提取第一个完整的 JSON 对象，忽略结尾的废话
function extractJSON(str) {
  let startIndex = str.indexOf('{');
  if (startIndex === -1) return null;
  
  let braceCount = 0;
  let endIndex = -1;
  
  for (let i = startIndex; i < str.length; i++) {
    if (str[i] === '{') {
      braceCount++;
    } else if (str[i] === '}') {
      braceCount--;
      if (braceCount === 0) {
        endIndex = i;
        break;
      }
    }
  }
  
  if (endIndex !== -1) {
    return str.substring(startIndex, endIndex + 1);
  }
  return null;
}

// 自动重试机制 (针对 503 Overloaded)
async function generateWithRetry(model, prompt, retries = 5, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await model.generateContent(prompt);
    } catch (error) {
      const isTransientError = error.message.includes('503') || error.message.includes('overloaded') || error.message.includes('429');
      if (isTransientError && i < retries - 1) {
        console.warn(`⚠️ Google 服务器繁忙 (503)，正在进行第 ${i + 1}/${retries} 次重试...`);
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
    
    const daYunStr = chart?.daYun ? chart.daYun.map(d => d.ganZhi).join(',') : "暂无";
    const balanceStr = chart?.balanceNote ? chart.balanceNote.join(', ') : "五行平衡";
    const lingShu = chart?.lingShu || { lifePathNumber: 0 };

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      【角色设定】
      你是一位精通《三命通会》、《穷通宝鉴》与《麻衣神相》的资深中文命理大师。你的风格是**深度、详尽、专业**。
      
      【语言要求】
      1. 全程使用**简体中文**。
      2. 遇到专业术语必须解释其含义。

      【客观事实】
      八字: ${chart.year.stem}${chart.year.branch} ${chart.month.stem}${chart.month.branch} ${chart.day.stem}${chart.day.branch} ${chart.hour.stem}${chart.hour.branch}
      日主: ${chart.dayMaster} 格局: ${chart.strength}
      大运: ${daYunStr}
      评分: ${chart.destinyScore}
      五行: ${balanceStr}
      灵数: ${lingShu.lifePathNumber}

      【输出任务 (必须严格返回JSON，不要包含Markdown代码块)】
      {
        "archetype": "命格赐名(4字,如金水相涵)",
        "summary": "30字精评(一针见血)",
        "appearanceAnalysis": "容貌气质描述(基于五行/麻衣神相,100字,优美中文)",
        "annualLuckAnalysis": "${currentYear}年流年运势(结合大运,详细分析事业、财运、感情变化)",
        
        "historicalFigures": [
            {"name":"名人姓名","similarity":"85%","reason":"详细对比：为什么像？性格还是遭遇？"}
        ], 
        // ⚠️ 重要指令：必须列出 5 位历史人物！少于 5 位视为任务失败。
        
        "strengthAnalysis": "格局深度解析。请详细分析日主强弱、喜用神选取理由、格局的高低成败。字数不少于300字，需要有理有据。",
        
        "bookAdvice": "古籍建议(引用穷通宝鉴/三命通会原文)",
        "bookAdviceTranslation": "古文的白话文深度解析(不仅仅是翻译，要有解读)",
        "careerAdvice": "事业发展建议(具体到行业和职能)",
        "healthAdvice": "健康管理建议",
        "numerologyAnalysis": "灵数解读(性格与天赋)"
      }
    `;

    console.log("正在请求 AI (深度八字分析)...");
    const result = await generateWithRetry(model, prompt);
    const text = result.response.text();
    
    // ✅ 使用智能提取器，彻底解决 JSON 解析错误
    const jsonStr = extractJSON(text);
    
    if (!jsonStr) {
        console.error("AI 返回原始内容:", text);
        throw new Error("无法从 AI 返回中提取有效的 JSON 数据");
    }

    const data = JSON.parse(jsonStr);
    res.json(data);

  } catch (error) {
    console.error("API 错误:", error.message);
    if (error.message.includes('503') || error.message.includes('overloaded')) {
        res.status(503).json({ error: "AI 大脑过载（Google服务器繁忙），已自动重试多次仍失败，请稍后几秒再试。" });
    } else {
        res.status(500).json({ error: error.message });
    }
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
    
    console.log("正在请求 AI (奇门决策)...");
    const aiRes = await generateWithRetry(model, prompt);
    const text = aiRes.response.text();
    
    // ✅ 同样使用智能提取器
    const jsonStr = extractJSON(text);
    if (!jsonStr) throw new Error("AI 奇门数据格式异常");

    res.json(JSON.parse(jsonStr));

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`✅ 后端服务器已启动: http://localhost:${port}`);
});