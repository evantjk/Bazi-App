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

// ---------------------------------------------------------
// 🤖 模型配置 (Model Configuration)
// ---------------------------------------------------------

// 👑 顶级模型 (需要用户手动点击按钮激活)
const MODEL_ULTRA = "gemini-3-pro-preview";

// ⛓️ 自动降级链 (优先使用列表顶部的模型)
// 逻辑：3-Flash (最快最新) -> 2.5-Pro (性能强) -> 2.5-Flash (均衡) -> 2.5-Lite (保底)
const MODELS_CHAIN = [
    "gemini-3-flash-preview",
    "gemini-2.5-pro",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite"
];

// 🛡️ 智能 JSON 提取器
function extractJSON(str) {
  let startIndex = str.indexOf('{');
  if (startIndex === -1) return null;
  
  let braceCount = 0;
  let endIndex = -1;
  
  for (let i = startIndex; i < str.length; i++) {
    if (str[i] === '{') braceCount++;
    else if (str[i] === '}') {
      braceCount--;
      if (braceCount === 0) { endIndex = i; break; }
    }
  }
  return endIndex !== -1 ? str.substring(startIndex, endIndex + 1) : null;
}

// 基础生成函数
async function generateOnce(modelName, prompt) {
    console.log(`📡 请求模型: ${modelName}...`);
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    return result.response.text();
}

// 🧠 智能路由与降级策略
async function generateSmartResponse(prompt, usePro = false) {
    // 1. 如果用户开启了 "Pro 模式"，优先尝试 Gemini 3 Pro
    if (usePro) {
        try {
            console.log(`🌟 [Pro模式] 正在调用顶级模型 ${MODEL_ULTRA}...`);
            const text = await generateOnce(MODEL_ULTRA, prompt);
            return { text, modelUsed: MODEL_ULTRA };
        } catch (error) {
            console.warn(`⚠️ [Pro模式] ${MODEL_ULTRA} 暂时不可用 (${error.message})，自动切换至标准链路...`);
            // 如果 Pro 失败，不报错，而是自动落入下方的标准链条，保证用户能拿到结果
        }
    }

    // 2. 标准自动降级链 (Auto Fallback Chain)
    for (let i = 0; i < MODELS_CHAIN.length; i++) {
        const modelName = MODELS_CHAIN[i];
        
        // 每个模型尝试 2 次 (避免因网络抖动直接跳过好模型)
        const retriesPerModel = 2; 
        
        for (let j = 0; j < retriesPerModel; j++) {
            try {
                if (j > 0) console.log(`   🔄 ${modelName} 重试第 ${j+1} 次...`);
                const text = await generateOnce(modelName, prompt);
                return { text, modelUsed: modelName }; // 成功！
            } catch (error) {
                const isOverloaded = error.message.includes('503') || error.message.includes('overloaded') || error.message.includes('429');
                console.warn(`❌ ${modelName} (尝试 ${j+1}/${retriesPerModel}) 失败: ${error.message.split(' ')[0]}`);
                
                // 如果是服务器过载，等待一下再试；如果是其他错误(如404)，直接跳过该模型
                if (isOverloaded && j < retriesPerModel - 1) {
                    await new Promise(r => setTimeout(r, 1500)); 
                } else {
                    break; // 停止重试当前模型，进入下一个模型
                }
            }
        }
    }

    throw new Error("所有 AI 模型均繁忙，请稍后重试。");
}

// ---------------------------------------------------------
// 🔮 API Endpoints
// ---------------------------------------------------------

// 1. 八字 API
app.post('/api/analyze', async (req, res) => {
  try {
    const { chart, currentYear, useProModel } = req.body; // 接收 useProModel 参数
    
    const daYunStr = chart?.daYun ? chart.daYun.map(d => d.ganZhi).join(',') : "暂无";
    const balanceStr = chart?.balanceNote ? chart.balanceNote.join(', ') : "五行平衡";
    const lingShu = chart?.lingShu || { lifePathNumber: 0 };

    const prompt = `
      【角色】资深中文命理大师 (精通三命通会/穷通宝鉴)。
      【要求】简体中文，深度详尽，专业术语需解释。
      【数据】
      八字: ${chart.year.stem}${chart.year.branch} ${chart.month.stem}${chart.month.branch} ${chart.day.stem}${chart.day.branch} ${chart.hour.stem}${chart.hour.branch}
      日主: ${chart.dayMaster} 格局: ${chart.strength} 大运: ${daYunStr} 评分: ${chart.destinyScore}
      
      【任务 JSON】
      {
        "archetype": "命格赐名(4字)", "summary": "30字精评",
        "appearanceAnalysis": "容貌气质(100字)",
        "annualLuckAnalysis": "${currentYear}年流年运势(结合大运)",
        "historicalFigures": [{"name":"名人","similarity":"85%","reason":"对比"}],
        "strengthAnalysis": "格局深度解析(300字+)",
        "bookAdvice": "古籍建议", "bookAdviceTranslation": "白话解析",
        "careerAdvice": "事业建议", "healthAdvice": "健康建议", "numerologyAnalysis": "灵数解读"
      }
    `;

    const { text, modelUsed } = await generateSmartResponse(prompt, useProModel);
    const jsonStr = extractJSON(text);
    if (!jsonStr) throw new Error(`AI (${modelUsed}) 数据格式异常`);
    res.set('X-Model-Used', modelUsed).json(JSON.parse(jsonStr));

  } catch (error) {
    res.status(503).json({ error: "服务器正忙，请稍等 5 秒后再试！" });
  }
});

// 2. 奇门 API
app.post('/api/qimen', async (req, res) => {
  try {
    const { type, context, result, useProModel } = req.body;
    const signalMap = { 'green': '🟢 可行动', 'yellow': '🟡 需观察', 'red': '🔴 不建议' };
    
    const prompt = `
      角色：奇门决策顾问。语言：简体中文。
      问题：${type} 背景：${context || "无"}
      信号：${signalMap[result.signal]} 判词：${result.summary} 因子：${result.factors.join(', ')}
      输出JSON: { "mainTendency": "核心判断", "reasoning": ["原因"], "actionAdvice": "建议", "riskAlert": "风险" }
    `;
    
    const { text, modelUsed } = await generateSmartResponse(prompt, useProModel);
    const jsonStr = extractJSON(text);
    if (!jsonStr) throw new Error(`AI (${modelUsed}) 数据异常`);
    res.set('X-Model-Used', modelUsed).json(JSON.parse(jsonStr));

  } catch (error) {
    res.status(503).json({ error: "决策服务繁忙，请稍后再试。" });
  }
});

// 3. 紫微 API
app.post('/api/ziwei', async (req, res) => {
  try {
    const { chart, useProModel } = req.body;
    const lifePalace = chart.palaces[chart.lifePalaceIndex];
    const getStars = (p) => p.majorStars.map(s => s.name).join(',') || "无主星";

    const prompt = `
      角色：钦天监紫微斗数大师。语言：简体中文。
      信息：局数${chart.element}, 命宫${lifePalace.earthlyBranch}有[${getStars(lifePalace)}]。
      任务：三方四正深度解读。
      输出JSON: {
        "pattern": "格局名称", "lifeAnalysis": "命宫解析(200字)",
        "wealthAnalysis": "财运", "careerAnalysis": "事业", "loveAnalysis": "感情"
      }
    `;

    const { text, modelUsed } = await generateSmartResponse(prompt, useProModel);
    const jsonStr = extractJSON(text);
    if (!jsonStr) throw new Error(`AI (${modelUsed}) 数据异常`);
    res.set('X-Model-Used', modelUsed).json(JSON.parse(jsonStr));

  } catch (error) {
    res.status(503).json({ error: "紫微服务繁忙，请稍后再试。" });
  }
});

app.listen(port, () => {
  console.log(`✅ 后端服务器已启动: http://localhost:${port}`);
  console.log(`   💎 旗舰模型 (按钮激活): ${MODEL_ULTRA}`);
  console.log(`   ⛓️ 自动降级链: ${MODELS_CHAIN.join(' -> ')}`);
});