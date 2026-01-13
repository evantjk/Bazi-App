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

// 🛡️ 智能 JSON 提取器
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

// 基础生成函数
async function generateOnce(modelName, prompt) {
    const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: {
            temperature: 0.4, // 稍微降低随机性，保证格式稳定
            topP: 0.8,
            topK: 40,
        }
    });
    const result = await model.generateContent(prompt);
    return result.response.text();
}

// 智能降级策略
async function generateSmartResponse(prompt) {
    const maxRetriesMain = 4;
    for (let i = 0; i < maxRetriesMain; i++) {
        try {
            console.log(`🚀 [主力] 尝试调用 ${MODEL_MAIN} (第 ${i + 1}/${maxRetriesMain} 次)...`);
            const text = await generateOnce(MODEL_MAIN, prompt);
            return { text, modelUsed: MODEL_MAIN };
        } catch (error) {
            const isOverloaded = error.message.includes('503') || error.message.includes('overloaded');
            console.warn(`⚠️ [主力] ${MODEL_MAIN} 失败: ${error.message}`);
            if (i < maxRetriesMain - 1) {
                const delay = 2000 * Math.pow(2, i);
                await new Promise(r => setTimeout(r, delay));
            }
        }
    }

    const maxRetriesBackup = 2;
    for (let i = 0; i < maxRetriesBackup; i++) {
        try {
            console.log(`🛡️ [替补] 正在切换至 ${MODEL_BACKUP} (第 ${i + 1}/${maxRetriesBackup} 次)...`);
            const text = await generateOnce(MODEL_BACKUP, prompt);
            return { text, modelUsed: MODEL_BACKUP };
        } catch (error) {
            console.error(`❌ [替补] ${MODEL_BACKUP} 也失败了`);
            if (i < maxRetriesBackup - 1) await new Promise(r => setTimeout(r, 2000));
        }
    }
    throw new Error("所有 AI 模型（主力+替补）均不可用，请稍后再试。");
}

// 八字分析接口
app.post('/api/analyze', async (req, res) => {
  try {
    const { chart, currentYear } = req.body; 
    const daYunStr = chart?.daYun ? chart.daYun.map(d => d.ganZhi).join(',') : "暂无";
    const balanceStr = chart?.balanceNote ? chart.balanceNote.join(', ') : "五行平衡";
    const lingShu = chart?.lingShu || { lifePathNumber: 0 };

    // 🔥 增强版 Prompt：强制 5 人，强制深度，强制古籍
    const prompt = `
      【角色设定】
      你是一位精通《三命通会》、《穷通宝鉴》的资深命理大师。你的风格是**深度、详尽、引经据典**。
      
      【语言要求】
      1. 全程使用**简体中文**。
      2. 除非是专有名词，否则不要出现英文。

      【分析对象】
      八字: ${chart.year.stem}${chart.year.branch} ${chart.month.stem}${chart.month.branch} ${chart.day.stem}${chart.day.branch} ${chart.hour.stem}${chart.hour.branch}
      日主: ${chart.dayMaster} 格局: ${chart.strength}
      大运: ${daYunStr}
      五行诊断: ${balanceStr}
      灵数命数: ${lingShu.lifePathNumber}

      【输出任务 (必须严格遵循此JSON格式，不要Markdown)】
      {
        "archetype": "命格赐名(4字, 如金水相涵)",
        "summary": "30字精评(一针见血)",
        "appearanceAnalysis": "容貌气质描述(基于五行/麻衣神相, 100字)",
        "annualLuckAnalysis": "${currentYear}年流年运势(结合大运, 详细分析事业、财运、感情变化)",
        
        "historicalFigures": [
            {"name": "名人1", "similarity": "相似度", "reason": "对比分析"},
            {"name": "名人2", "similarity": "相似度", "reason": "对比分析"},
            {"name": "名人3", "similarity": "相似度", "reason": "对比分析"},
            {"name": "名人4", "similarity": "相似度", "reason": "对比分析"},
            {"name": "名人5", "similarity": "相似度", "reason": "对比分析"}
        ],
        // ⚠️ 必须列出 5 位！少于 5 位视为失败。
        
        "strengthAnalysis": "格局深度解析。详细分析日主强弱、喜用神、格局高低。字数不少于300字，要有深度。",
        
        "bookAdvice": "古籍建议(必须引用《穷通宝鉴》或《三命通会》的原文)",
        "bookAdviceTranslation": "古文的白话文深度解析(不仅仅是翻译，要有结合命主的解读)",
        
        "careerAdvice": "事业发展建议(具体到行业和职能)",
        "healthAdvice": "健康管理建议",
        
        "numerologyAnalysis": "灵数${lingShu.lifePathNumber}深度解读：包含性格优势、潜在挑战、人生使命。"
      }
    `;

    console.log("正在请求 AI (八字深度版)...");
    const { text, modelUsed } = await generateSmartResponse(prompt);
    
    const jsonStr = extractJSON(text);
    if (!jsonStr) throw new Error(`AI (${modelUsed}) 返回数据格式异常`);

    const data = JSON.parse(jsonStr);
    res.set('X-Model-Used', modelUsed);
    res.json(data);

  } catch (error) {
    console.error("API 错误:", error.message);
    res.status(503).json({ error: "分析服务繁忙，正在为您排队，请稍后再试！" });
  }
});

// 奇门决策接口
app.post('/api/qimen', async (req, res) => {
  try {
    const { type, context, result } = req.body; 
    const signalMap = { 'green': '🟢 可行动', 'yellow': '🟡 需观察', 'red': '🔴 不建议' };
    const prompt = `
      角色：奇门决策顾问。语言：简体中文。
      问题：${type} 背景：${context || "无"}
      信号：${signalMap[result.signal]} 判词：${result.summary} 因子：${result.factors.join(', ')}
      输出JSON: { "mainTendency": "核心判断", "reasoning": ["原因1", "原因2"], "actionAdvice": "行动建议", "riskAlert": "风险提示" }
    `;
    
    const { text, modelUsed } = await generateSmartResponse(prompt);
    const jsonStr = extractJSON(text);
    if (!jsonStr) throw new Error(`AI (${modelUsed}) 格式异常`);
    res.set('X-Model-Used', modelUsed).json(JSON.parse(jsonStr));

  } catch (error) {
    res.status(503).json({ error: "决策服务繁忙，请稍后再试。" });
  }
});

app.listen(port, () => {
  console.log(`✅ 后端服务器已启动: http://localhost:${port}`);
  console.log(`   - 主力: ${MODEL_MAIN} | 替补: ${MODEL_BACKUP}`);
});