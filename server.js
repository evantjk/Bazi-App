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
// 🤖 模型架构配置
// ---------------------------------------------------------

const MODEL_ULTRA = "gemini-2.0-pro-exp-02-05"; // 使用目前逻辑推理最强的 2.0 Pro

// 自动降级链
const MODELS_CHAIN = [
    "gemini-2.0-flash-thinking-exp-01-21", // 尝试 Thinking 模型，分析能力极强
    "gemini-2.0-flash",
    "gemini-1.5-pro"
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
            temperature: 0.7, // 提高一点温度，让文案更丰富
            topK: 40,
            topP: 0.95,
        }
    });
    const result = await model.generateContent(prompt);
    return result.response.text();
}

// 🧠 智能路由与降级策略
async function generateSmartResponse(prompt, usePro = false) {
    // 1. Pro 模式
    if (usePro) {
        try {
            console.log(`🌟 [Pro模式] 调用旗舰模型 ${MODEL_ULTRA}...`);
            const text = await generateOnce(MODEL_ULTRA, prompt);
            return { text, modelUsed: MODEL_ULTRA };
        } catch (error) {
            console.warn(`⚠️ Pro模型繁忙，自动切换至标准链...`);
        }
    }

    // 2. 标准链
    for (let i = 0; i < MODELS_CHAIN.length; i++) {
        const modelName = MODELS_CHAIN[i];
        const retries = 2;
        for (let j = 0; j < retries; j++) {
            try {
                const text = await generateOnce(modelName, prompt);
                return { text, modelUsed: modelName };
            } catch (error) {
                const isBusy = error.message.includes('503') || error.message.includes('overloaded');
                if (isBusy && j < retries - 1) await new Promise(r => setTimeout(r, 1500));
                else break;
            }
        }
    }
    throw new Error("AI 服务全线繁忙，请稍后重试。");
}

// ---------------------------------------------------------
// 🔮 API Endpoints
// ---------------------------------------------------------

// 1. 八字 API (深度优化版)
app.post('/api/analyze', async (req, res) => {
  try {
    const { chart, currentYear, useProModel } = req.body;
    
    const daYunStr = chart?.daYun ? chart.daYun.map(d => d.ganZhi).join(',') : "暂无";
    const balanceStr = chart?.balanceNote ? chart.balanceNote.join(', ') : "五行平衡";
    const lingShu = chart?.lingShu || { lifePathNumber: 0 };

    const prompt = `
      【角色设定】
      你是一位精通《三命通会》、《穷通宝鉴》、《滴天髓》且兼通西方灵数学的资深命理宗师。
      你的风格：**深度剖析、拒绝空话、逻辑严密、论述详尽**。

      【命盘数据】
      八字: ${chart.year.stem}${chart.year.branch} ${chart.month.stem}${chart.month.branch} ${chart.day.stem}${chart.day.branch} ${chart.hour.stem}${chart.hour.branch}
      日主: ${chart.dayMaster} (属性:${chart.dayMasterElement})
      格局初步判断: ${chart.strength}
      大运: ${daYunStr}
      五行强弱: ${balanceStr}
      西方生命灵数: ${lingShu.lifePathNumber} (注意：这是基于阳历生日计算的Life Path Number)

      【任务：生成深度命理报告】
      请严格按照以下 JSON 格式输出，内容必须极其详尽，**严禁简略**。

      {
        "archetype": "命格赐名(4字，如：杀印相生格)",
        "summary": "30字以内的精辟总结，一针见血。",
        
        "strengthAnalysis": "格局深度解析（这是核心，必须超过500字）。请分三段撰写：\\n1. **日主强弱定性**：详细分析得令、得地、得势情况，判断身强身弱的根本原因。\\n2. **格局成象分析**：具体分析八字中的刑冲合害，成格还是破格？是否有通关之神？（如杀印相生、食神制杀等）。\\n3. **喜用神与大运**：明确指出喜用神是什么，忌神是什么，并简述当前大运对格局的影响。",
        
        "appearanceAnalysis": "容貌气质描述(150字，结合五行和十神心性描述外貌特征和给人的第一印象)",
        
        "annualLuckAnalysis": "${currentYear}年流年运势(300字，结合流年天干地支与大运的生克关系，详细推演事业、财运、感情的变化点)",
        
        "historicalFigures": [
            {"name": "名人1", "similarity": "90%", "reason": "详细对比：为何像？是性格像（如都具有坚韧不拔的杀印特性）还是遭遇像？"},
            {"name": "名人2", "similarity": "85%", "reason": "详细对比"},
            {"name": "名人3", "similarity": "80%", "reason": "详细对比"},
            {"name": "名人4", "similarity": "75%", "reason": "详细对比"},
            {"name": "名人5", "similarity": "70%", "reason": "详细对比"}
        ],
        // ⚠️ 警告：必须提供 5 位历史名人！少于 5 位将视为严重错误！
        
        "bookAdvice": "古籍建议(必须引用《穷通宝鉴》或《三命通会》中针对该日主生于该月的原文，不要自己编造)",
        "bookAdviceTranslation": "古文深度解析(翻译原文，并解释其在现代社会的应用场景)",
        
        "careerAdvice": "事业发展深度建议(300字)。请具体到：\\n1. **行业属性**：五行喜用对应的具体现代行业。\\n2. **职能定位**：适合做管理、技术、还是市场？\\n3. **发展策略**：在组织中如何晋升，或创业的切入点。",
        
        "healthAdvice": "健康深度管理(200字)。\\n1. **五行病理**：指出过旺或过弱五行对应的身体器官隐患。\\n2. **中医建议**：具体的调理方向（如滋阴补肾、疏肝理气等）。\\n3. **年份预警**：${currentYear}年需特别注意的健康问题。",
        
        "numerologyAnalysis": "灵数与五行融合解析(300字)。\\n1. **灵数本义**：解释西方灵数${lingShu.lifePathNumber}代表的性格底色（如1号领导者，3号艺术家）。\\n2. **中西合璧**：结合八字喜用神，分析这个数字对命主是'锦上添花'还是'雪中送炭'？\\n3. **补运建议**：给出具体的幸运数字、颜色及生活建议。"
      }
    `;

    const { text, modelUsed } = await generateSmartResponse(prompt, useProModel);
    const jsonStr = extractJSON(text);
    if (!jsonStr) throw new Error(`AI (${modelUsed}) 数据格式异常`);
    
    // 强制检查历史人物数量，如果少于5个，虽然不能重来，但在日志里记录
    const data = JSON.parse(jsonStr);
    if (!data.historicalFigures || data.historicalFigures.length < 5) {
        console.warn("⚠️ AI 未能返回 5 位名人，可能是模型偷懒。");
    }

    res.set('X-Model-Used', modelUsed).json(data);

  } catch (error) {
    console.error(error);
    res.status(503).json({ error: "服务器正忙，请稍等 5 秒后再试！" });
  }
});

// 2. 奇门 API
app.post('/api/qimen', async (req, res) => {
  try {
    const { type, context, result, useProModel } = req.body;
    const signalMap = { 'green': '🟢 可行动', 'yellow': '🟡 需观察', 'red': '🔴 不建议' };
    
    const prompt = `
      角色：奇门遁甲决策顾问。语言：简体中文。
      问题：${type} 背景：${context || "无"}
      信号：${signalMap[result.signal]} 判词：${result.summary} 因子：${result.factors.join(', ')}
      输出JSON: { "mainTendency": "核心判断(1句话)", "reasoning": ["原因1(结合星门)", "原因2(结合五行)"], "actionAdvice": "具体的行动策略(3条)", "riskAlert": "风险提示" }
    `;
    
    const { text, modelUsed } = await generateSmartResponse(prompt, useProModel);
    const jsonStr = extractJSON(text);
    if (!jsonStr) throw new Error(`AI (${modelUsed}) 数据异常`);
    res.set('X-Model-Used', modelUsed).json(JSON.parse(jsonStr));

  } catch (error) {
    res.status(503).json({ error: "决策服务繁忙" });
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
        "pattern": "格局名称", "lifeAnalysis": "命宫深度解析(性格命运，200字)",
        "wealthAnalysis": "财运深度解析(150字)", "careerAnalysis": "事业深度解析(150字)", "loveAnalysis": "感情深度解析(150字)"
      }
    `;

    const { text, modelUsed } = await generateSmartResponse(prompt, useProModel);
    const jsonStr = extractJSON(text);
    if (!jsonStr) throw new Error(`AI (${modelUsed}) 数据异常`);
    res.set('X-Model-Used', modelUsed).json(JSON.parse(jsonStr));

  } catch (error) {
    res.status(503).json({ error: "紫微服务繁忙" });
  }
});

app.listen(port, () => {
  console.log(`✅ 后端服务器已启动: http://localhost:${port}`);
  console.log(`   💎 旗舰模型: ${MODEL_ULTRA}`);
});