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

// 定义两个模型：主力(2.5) 和 替补(1.5)
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

// 基础生成函数 (单次尝试)
async function generateOnce(modelName, prompt) {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    return result.response.text();
}

// 🧠 智能降级策略核心函数
// 逻辑：尝试主力模型 N 次 -> 失败 -> 尝试替补模型 M 次
async function generateSmartResponse(prompt) {
    // 阶段一：主力冲锋 (2.5 Flash) - 尝试 4 次
    const maxRetriesMain = 4;
    for (let i = 0; i < maxRetriesMain; i++) {
        try {
            console.log(`🚀 [主力] 尝试调用 ${MODEL_MAIN} (第 ${i + 1}/${maxRetriesMain} 次)...`);
            const text = await generateOnce(MODEL_MAIN, prompt);
            return { text, modelUsed: MODEL_MAIN }; // 成功返回
        } catch (error) {
            const isOverloaded = error.message.includes('503') || error.message.includes('overloaded') || error.message.includes('429');
            console.warn(`⚠️ [主力] ${MODEL_MAIN} 失败: ${error.message}`);
            
            if (i < maxRetriesMain - 1) {
                // 如果还有重试机会，等待后继续
                const delay = 2000 * Math.pow(2, i); // 指数退避: 2s, 4s, 8s
                await new Promise(r => setTimeout(r, delay));
            } else {
                console.warn(`🔥 [主力] ${MODEL_MAIN} 全部尝试失败，准备切换替补模型...`);
            }
        }
    }

    // 阶段二：替补兜底 (1.5 Flash) - 尝试 2 次
    // 如果主力全挂了，1.5 通常很稳，不需要试太多次
    const maxRetriesBackup = 2;
    for (let i = 0; i < maxRetriesBackup; i++) {
        try {
            console.log(`🛡️ [替补] 正在切换至 ${MODEL_BACKUP} (第 ${i + 1}/${maxRetriesBackup} 次)...`);
            const text = await generateOnce(MODEL_BACKUP, prompt);
            return { text, modelUsed: MODEL_BACKUP }; // 降级成功
        } catch (error) {
            console.error(`❌ [替补] ${MODEL_BACKUP} 也失败了: ${error.message}`);
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

    // 使用智能降级策略调用
    const { text, modelUsed } = await generateSmartResponse(prompt);
    
    // 解析 JSON
    const jsonStr = extractJSON(text);
    if (!jsonStr) {
        console.error("AI 返回原始内容:", text);
        throw new Error(`AI (${modelUsed}) 返回数据格式异常`);
    }

    const data = JSON.parse(jsonStr);
    
    // 可选：在返回头里告诉前端用了哪个模型（方便调试）
    res.set('X-Model-Used', modelUsed);
    res.json(data);

  } catch (error) {
    console.error("最终失败:", error.message);
    res.status(503).json({ error: "服务器正忙（已切换备用线路仍超时），请稍等 5 秒后再试！" });
  }
});

// 奇门决策接口
app.post('/api/qimen', async (req, res) => {
  try {
    const { type, context, result } = req.body; 
    
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
    
    const { text, modelUsed } = await generateSmartResponse(prompt);
    
    const jsonStr = extractJSON(text);
    if (!jsonStr) throw new Error(`AI (${modelUsed}) 奇门数据格式异常`);

    res.set('X-Model-Used', modelUsed);
    res.json(JSON.parse(jsonStr));

  } catch (error) {
    res.status(503).json({ error: "决策服务繁忙，请稍后再试。" });
  }
});

app.listen(port, () => {
  console.log(`✅ 后端服务器已启动: http://localhost:${port}`);
  console.log(`   - 主力模型: ${MODEL_MAIN} (重试 4 次)`);
  console.log(`   - 替补模型: ${MODEL_BACKUP} (重试 2 次)`);
});