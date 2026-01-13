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

const MODEL_MAIN = "gemini-2.5-flash";
const MODEL_BACKUP = "gemini-1.5-flash";

// 🛡️ Smart JSON Extractor
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

async function generateOnce(modelName, prompt) {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    return result.response.text();
}

async function generateSmartResponse(prompt) {
    // Phase 1: Main Model (2.5) - 4 retries
    const maxRetriesMain = 4;
    for (let i = 0; i < maxRetriesMain; i++) {
        try {
            console.log(`🚀 [主力] 尝试调用 ${MODEL_MAIN} (第 ${i + 1}/${maxRetriesMain} 次)...`);
            const text = await generateOnce(MODEL_MAIN, prompt);
            return { text, modelUsed: MODEL_MAIN };
        } catch (error) {
            const isOverloaded = error.message.includes('503') || error.message.includes('overloaded') || error.message.includes('429');
            console.warn(`⚠️ [主力] ${MODEL_MAIN} 失败: ${error.message}`);
            
            if (i < maxRetriesMain - 1) {
                const delay = 2000 * Math.pow(2, i);
                await new Promise(r => setTimeout(r, delay));
            } else {
                console.warn(`🔥 [主力] 全部失败，切换替补...`);
            }
        }
    }

    // Phase 2: Backup Model (1.5) - 2 retries
    const maxRetriesBackup = 2;
    for (let i = 0; i < maxRetriesBackup; i++) {
        try {
            console.log(`🛡️ [替补] 正在切换至 ${MODEL_BACKUP} (第 ${i + 1}/${maxRetriesBackup} 次)...`);
            const text = await generateOnce(MODEL_BACKUP, prompt);
            return { text, modelUsed: MODEL_BACKUP };
        } catch (error) {
            console.error(`❌ [替补] ${MODEL_BACKUP} 也失败了: ${error.message}`);
            if (i < maxRetriesBackup - 1) await new Promise(r => setTimeout(r, 2000));
        }
    }

    throw new Error("所有 AI 模型（主力+替补）均不可用，请稍后再试。");
}

// 1. Bazi API
app.post('/api/analyze', async (req, res) => {
  try {
    const { chart, currentYear } = req.body; 
    const daYunStr = chart?.daYun ? chart.daYun.map(d => d.ganZhi).join(',') : "暂无";
    const balanceStr = chart?.balanceNote ? chart.balanceNote.join(', ') : "五行平衡";
    const lingShu = chart?.lingShu || { lifePathNumber: 0 };

    const prompt = `
      【角色设定】资深中文命理大师。风格深度、详尽、专业。
      【语言要求】简体中文。遇到专业术语必须解释。
      【客观事实】
      八字: ${chart.year.stem}${chart.year.branch} ${chart.month.stem}${chart.month.branch} ${chart.day.stem}${chart.day.branch} ${chart.hour.stem}${chart.hour.branch}
      日主: ${chart.dayMaster} 格局: ${chart.strength} 大运: ${daYunStr} 评分: ${chart.destinyScore} 五行: ${balanceStr} 灵数: ${lingShu.lifePathNumber}

      【输出任务 (严格JSON)】
      {
        "archetype": "命格赐名(4字)",
        "summary": "30字精评",
        "appearanceAnalysis": "容貌气质(100字)",
        "annualLuckAnalysis": "${currentYear}年流年运势(结合大运)",
        "historicalFigures": [{"name":"名人姓名","similarity":"85%","reason":"详细对比"}],
        "strengthAnalysis": "格局深度解析(300字+)",
        "bookAdvice": "古籍建议", "bookAdviceTranslation": "白话深度解析",
        "careerAdvice": "事业建议", "healthAdvice": "健康建议", "numerologyAnalysis": "灵数解读"
      }
    `;

    const { text, modelUsed } = await generateSmartResponse(prompt);
    const jsonStr = extractJSON(text);
    if (!jsonStr) throw new Error(`AI (${modelUsed}) 数据格式异常`);
    res.set('X-Model-Used', modelUsed).json(JSON.parse(jsonStr));

  } catch (error) {
    res.status(503).json({ error: "服务器正忙，请稍等 5 秒后再试！" });
  }
});

// 2. Qimen API
app.post('/api/qimen', async (req, res) => {
  try {
    const { type, context, result } = req.body; 
    const signalMap = { 'green': '🟢 可行动', 'yellow': '🟡 需观察', 'red': '🔴 不建议' };
    const prompt = `
      角色：奇门决策顾问。语言：简体中文。
      问题：${type} 背景：${context || "无"}
      信号：${signalMap[result.signal]} 判词：${result.summary} 因子：${result.factors.join(', ')}
      输出JSON: { "mainTendency": "核心判断", "reasoning": ["原因"], "actionAdvice": "行动建议", "riskAlert": "风险提示" }
    `;
    
    const { text, modelUsed } = await generateSmartResponse(prompt);
    const jsonStr = extractJSON(text);
    if (!jsonStr) throw new Error(`AI (${modelUsed}) 数据格式异常`);
    res.set('X-Model-Used', modelUsed).json(JSON.parse(jsonStr));

  } catch (error) {
    res.status(503).json({ error: "决策服务繁忙，请稍后再试。" });
  }
});

// 3. Ziwei API
app.post('/api/ziwei', async (req, res) => {
  try {
    const { chart } = req.body; 
    const lifePalace = chart.palaces[chart.lifePalaceIndex];
    const getStars = (p) => p.majorStars.map(s => s.name).join(',') || "无主星";

    const prompt = `
      角色：钦天监紫微斗数大师。语言：简体中文。
      信息：局数${chart.element}, 命宫${lifePalace.earthlyBranch}有[${getStars(lifePalace)}]。
      任务：三方四正深度解读。
      输出JSON: {
        "pattern": "格局名称",
        "lifeAnalysis": "命宫深度解析(200字)",
        "wealthAnalysis": "财运深度解析(150字)",
        "careerAnalysis": "事业深度解析(150字)",
        "loveAnalysis": "感情深度解析(150字)"
      }
    `;

    const { text, modelUsed } = await generateSmartResponse(prompt);
    const jsonStr = extractJSON(text);
    if (!jsonStr) throw new Error(`AI (${modelUsed}) 数据格式异常`);
    res.set('X-Model-Used', modelUsed).json(JSON.parse(jsonStr));

  } catch (error) {
    res.status(503).json({ error: "紫微服务繁忙，请稍后再试。" });
  }
});

app.listen(port, () => {
  console.log(`✅ 后端服务器已启动: http://localhost:${port}`);
});