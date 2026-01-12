import express from 'express';
import cors from 'cors';
import OpenAI from 'openai'; // Changed from @google/generative-ai
import 'dotenv/config';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Check for API Key
const API_KEY = process.env.DEEPSEEK_API_KEY;

if (!API_KEY) {
  console.error("❌ Fatal Error: DEEPSEEK_API_KEY not found in .env file.");
  process.exit(1);
}

// Configure DeepSeek Client (using OpenAI SDK)
const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com', // DeepSeek Endpoint
  apiKey: API_KEY
});

app.post('/api/analyze', async (req, res) => {
  try {
    const { chart, currentYear } = req.body; 
    
    const daYunStr = chart.daYun ? chart.daYun.map(d => d.ganZhi).join(',') : "暂无";

    console.log(`DeepSeek (V3.2) Analysis Requested for ${currentYear}...`);

    // Prepare the system prompt
    const systemPrompt = `
      You are a profound master of Bazi (Four Pillars of Destiny), proficient in "Qiong Tong Bao Jian", "San Ming Tong Hui", and "Ma Yi Shen Xiang".
      Your task is to analyze the user's Bazi chart and provide a structured JSON response.
      
      Output ONLY valid JSON. No markdown formatting, no code blocks, no intro/outro text.
    `;

    // Prepare the user data prompt
    const userPrompt = `
      [Bazi Chart Information]
      Eight Characters: ${chart.year.stem}${chart.year.branch} ${chart.month.stem}${chart.month.branch} ${chart.day.stem}${chart.day.branch} ${chart.hour.stem}${chart.hour.branch}
      Day Master: ${chart.dayMaster} (${chart.dayMasterElement})
      Strength: ${chart.strength}
      Major Cycles (Da Yun): ${daYunStr}
      Current Annual Pillar (Liu Nian): ${currentYear} (Bing Wu Year)

      [Analysis Requirements]
      Return a JSON object with these exact keys:
      {
        "archetype": "A poetic 4-character title for this destiny pattern (e.g., 'Golden Water Harmony')",
        "score": Integer between 0-100 indicating auspiciousness,
        "summary": "A punchy 30-word summary of the destiny",
        "appearanceAnalysis": "Analyze appearance and temperament based on Five Elements and Ma Yi Shen Xiang (approx 100 words). E.g., 'Metal Heavy' implies pale skin/oval face.",
        "annualLuckAnalysis": "Detailed fortune for ${currentYear} (career, wealth, love) considering the interaction between Original Chart, Da Yun, and ${currentYear} (approx 150 words).",
        "historicalFigures": [
           {"name": "Name", "similarity": "90%", "reason": "Why they are similar"}
        ] (List 5 figures),
        "strengthAnalysis": "Analysis of the Day Master's strength and chart structure (100 words)",
        "bookAdvice": "Advice in the style of 'Qiong Tong Bao Jian' (Classical Chinese)",
        "bookAdviceTranslation": "Modern vernacular translation of the book advice",
        "careerAdvice": "Actionable career direction based on Ten Gods",
        "healthAdvice": "Health warnings based on Five Elements balance"
      }
    `;

    // Call DeepSeek API
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      model: "deepseek-chat", // Points to DeepSeek-V3.2
      temperature: 1.1,      // DeepSeek recommends slightly higher temp for creative tasks (default is 1.0)
      response_format: { type: "json_object" } // Enforces JSON output
    });

    const text = completion.choices[0].message.content;
    
    // Safety Parse: Ensure valid JSON even if model adds fluff
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error("DeepSeek returned invalid format (No JSON found)");
    }

    const data = JSON.parse(jsonMatch[0]);
    res.json(data);

  } catch (error) {
    console.error("DeepSeek API Error:", error);
    
    // Handle overload errors specifically
    if (error.status === 503) {
        res.status(503).json({ error: "DeepSeek is currently overloaded. Please try again in a moment." });
    } else {
        res.status(500).json({ error: error.message || "Server Error" });
    }
  }
});

app.listen(port, () => {
  console.log(`✅ DeepSeek Backend Server running: http://localhost:${port}`);
});