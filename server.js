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
// 🤖 模型架构配置 (Model Configuration)
// ---------------------------------------------------------

// 👑 旗舰模型 (前端点击 "Gemini 3 Pro" 按钮时触发)
// 逻辑天花板，用于处理最复杂的命理推理
const MODEL_ULTRA = "gemini-3-pro-preview";

// ⛓️ 自动降级链 (默认使用，按优先级排序)
// 策略：3-Flash (最新极速) -> 2.5-Pro (深度稳健) -> 2.5-Flash (均衡)
const MODELS_CHAIN = [
    "gemini-2.5-pro", 
    "gemini-3-flash-preview"
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
    const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: {
            temperature: 1.0,
            topK: 40,
            topP: 0.95,
        }
    });
    const result = await model.generateContent(prompt);
    return result.response.text();
}

// 🧠 智能路由与降级策略
async function generateSmartResponse(prompt, usePro = false) {
    // 1. Pro 模式 (手动激活 3-Pro)
    if (usePro) {
        try {
            console.log(`🌟 [Pro模式] 调用旗舰模型 ${MODEL_ULTRA}...`);
            const text = await generateOnce(MODEL_ULTRA, prompt);
            return { text, modelUsed: MODEL_ULTRA };
        } catch (error) {
            console.warn(`⚠️ [Pro模式] ${MODEL_ULTRA} 暂时不可用，自动切换至标准链路...`);
        }
    }

    // 2. 标准自动链
    for (let i = 0; i < MODELS_CHAIN.length; i++) {
        const modelName = MODELS_CHAIN[i];
        // 每个模型尝试 2 次
        const retries = 10; 
        
        for (let j = 0; j < retries; j++) {
            try {
                if (j > 0) console.log(`   🔄 ${modelName} 重试 (${j+1}/${retries})...`);
                const text = await generateOnce(modelName, prompt);
                return { text, modelUsed: modelName };
            } catch (error) {
                const isBusy = error.message.includes('503') || error.message.includes('overloaded');
                console.warn(`❌ ${modelName} 失败: ${error.message.split(' ')[0]}`);
                
                if (isBusy && j < retries - 1) {
                    await new Promise(r => setTimeout(r, 1500)); 
                } else {
                    break; // 非繁忙错误直接跳过
                }
            }
        }
    }

    throw new Error("所有 AI 线路均繁忙，请稍后再试。");
}

// ---------------------------------------------------------
// 🔮 API Endpoints (深度 Prompt)
// ---------------------------------------------------------

// 1. 八字 API
app.post('/api/analyze', async (req, res) => {
  try {
    const { chart, currentYear, useProModel } = req.body;
    
    const daYunStr = chart?.daYun ? chart.daYun.map(d => d.ganZhi).join(',') : "暂无";
    const balanceStr = chart?.balanceNote ? chart.balanceNote.join(', ') : "五行平衡";
    const lingShu = chart?.lingShu || { lifePathNumber: 0 };

    const prompt = `
      【角色】资深命理宗师（文风稳重、详尽、逻辑严密，拒绝简略）。
      【要求】简体中文。所有专业术语必须解释。

      【数据】
      八字: ${chart.year.stem}${chart.year.branch} ${chart.month.stem}${chart.month.branch} ${chart.day.stem}${chart.day.branch} ${chart.hour.stem}${chart.hour.branch}
      日主: ${chart.dayMaster} (${chart.dayMasterElement})
      大运: ${daYunStr}
      五行: ${balanceStr}
      西方灵数: ${lingShu.lifePathNumber}号人

      【输出任务 JSON】
      {
        "archetype": "命格赐名",
        "summary": "30字精评",
        "appearanceAnalysis": "容貌气质(100字)",
        "annualLuckAnalysis": "${currentYear}年流年运势(300字，结合大运流年)",
        
        "historicalFigures": [
            {"name":"名人1","similarity":"90%","reason":"详细对比"},
            {"name":"名人2","similarity":"80%","reason":"详细对比"},
            {"name":"名人3","similarity":"70%","reason":"详细对比"},
            {"name":"名人4","similarity":"60%","reason":"详细对比"},
            {"name":"名人5","similarity":"50%","reason":"详细对比"}
        ],
        
        "strengthAnalysis": "格局深度解析（严禁少于500字）。请严格分三段撰写：\\n1. **日主强弱**：详细分析得令、得地、得势情况。\\n2. **格局成象**：分析八字结构、刑冲合害、成格还是破格。\\n3. **喜用分析**：明确指出喜用神、忌神，并解释原因。",
        
        "bookAdvice": "古籍建议(引用穷通宝鉴原文)", 
        "bookAdviceTranslation": "白话深度解析",
        
        "careerAdvice": "事业深度建议（严禁少于300字）。请分点阐述：\\n1. **行业属性**：适合的具体五行行业。\\n2. **职能定位**：适合做管理、技术、还是市场？\\n3. **发展策略**：在职场或创业中的具体战术建议。",
        
        "healthAdvice": "健康深度建议（200字）。请指出五行过旺或过弱对应的具体器官隐患，并给出中医调理建议。",
        
        "numerologyAnalysis": "灵数与命理融合（严禁混淆概念）。请分两步分析：\\n1. **灵数本义**：先解释西方灵数${lingShu.lifePathNumber}号人的性格天赋（如1号领导者、5号自由者）。"\\n2. 灵数深度分析： 增加更多解释和分析。"
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
      输出JSON: { "mainTendency": "核心判断(1句话)", "reasoning": ["原因1(星门)", "原因2(五行)"], "actionAdvice": "行动建议(3条具体策略)", "riskAlert": "风险提示" }
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
        "pattern": "格局名称", "lifeAnalysis": "命宫解析(200字，详述性格命运)",
        "wealthAnalysis": "财运(150字)", "careerAnalysis": "事业(150字)", "loveAnalysis": "感情(150字)"
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
  console.log(`   💎 旗舰模型: ${MODEL_ULTRA}`);
  console.log(`   ⛓️ 自动降级链: ${MODELS_CHAIN.join(' -> ')}`);
});