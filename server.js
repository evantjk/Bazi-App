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
  console.error("❌ 致命错误：未找到 GEMINI_API_KEY。");
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

// ---------------------------------------------
// 🔮 原有的八字 API (保持不变)
// ---------------------------------------------
app.post('/api/analyze', async (req, res) => {
    // ... (保留您之前的 /api/analyze 代码，为了篇幅这里省略，请保留原样)
    // 如果您直接覆盖，请把之前的 /api/analyze 代码复制回来，或者看下一步的完整代码
    // 为了方便，这里我把完整的 server.js 贴在最后
    try {
        const { chart, currentYear, relations } = req.body; 
        const daYunStr = chart.daYun ? chart.daYun.map(d => d.ganZhi).join(',') : "暂无";
        const relationsStr = relations && relations.length > 0 ? relations.join(', ') : "本年无明显冲合";
        const balanceStr = chart.balanceNote ? chart.balanceNote.join(', ') : "五行平衡";
        const lingShu = chart.lingShu || { lifePathNumber: 0, grid: {}, missingNumbers: [] };
        
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash", 
            generationConfig: { temperature: 0.2, topP: 0.8, topK: 40 }
        });

        const prompt = `
            角色:资深命理师. 任务:八字及${currentYear}分析. 
            禁忌:无绝对宿命论,无恐吓.
            客观事实: 八字:${chart.year.stem}${chart.year.branch}... 日主:${chart.dayMaster} 格局:${chart.strength} 大运:${daYunStr} 评分:${chart.destinyScore} 冲合:${relationsStr} 五行:${balanceStr} 灵数:${lingShu.lifePathNumber}
            
            输出JSON:
            {
                "archetype": "命格赐名", "summary": "精评", "appearanceAnalysis": "容貌", "annualLuckAnalysis": "流年运势", 
                "historicalFigures": [], "strengthAnalysis": "格局", "bookAdvice": "古文", "bookAdviceTranslation": "白话",
                "careerAdvice": "事业", "healthAdvice": "健康", "numerologyAnalysis": "灵数"
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

// ---------------------------------------------
// 🚪 新增：奇门遁甲 API
// ---------------------------------------------
app.post('/api/qimen', async (req, res) => {
  try {
    const { type, context, result } = req.body; 
    // result 是 rules engine 算出来的 { signal: 'green', score: 85, summary: '...' }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", 
      generationConfig: {
        temperature: 0.4, // 稍微高一点，让文案灵活些，但核心结论不能变
        topP: 0.8,
      }
    });

    // 映射信号灯到中文
    const signalMap = {
        'green': '🟢 可行动 (顺势)',
        'yellow': '🟡 需观察 (调整)',
        'red': '🔴 不建议 (逆势)'
    };
    const signalText = signalMap[result.signal];

    const prompt = `
      【角色设定】
      你是一位精通奇门遁甲的决策顾问。你的任务是根据“局面信号”解释当下的时机，为用户提供行动建议。
      
      【用户问题】
      类型：${type}
      背景：${context || "无具体背景"}
      
      【盘面客观结果 (由规则引擎判定，不可更改)】
      信号灯：${signalText} (这是核心结论！)
      综合评分：${result.score}分
      格局判词：${result.summary}
      关键因子：${result.factors.join(', ')}

      【解读要求】
      1. **绝对忠实于信号灯**：如果信号是红灯，你必须建议谨慎/停止；如果是绿灯，建议积极行动。不能反着说。
      2. **风格**：干练、直击要害、商业顾问风格。
      3. **禁忌**：不谈鬼神，不谈生死，只谈时机和策略。

      【输出格式 (纯JSON)】
      {
        "mainTendency": "1句核心判断 (如：时机成熟，利于主动出击)",
        "reasoning": ["关键原因1", "关键原因2"], 
        "actionAdvice": "2-3条具体建议 (基于${signalText}的策略)",
        "riskAlert": "1条温和的风控提醒"
      }
    `;

    console.log(`正在请求 奇门决策 (${type})... 信号: ${result.signal}`);
    
    const aiRes = await generateWithRetry(model, prompt);
    const text = aiRes.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) throw new Error("AI 返回格式异常");

    const data = JSON.parse(jsonMatch[0]);
    res.json(data);

  } catch (error) {
    console.error("奇门 API 报错:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`✅ 后端服务器已启动: http://localhost:${port}`);
});