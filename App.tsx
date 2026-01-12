import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Sparkles, Zap, Scroll, Bot, Menu, ArrowRight, MapPin, Globe, Activity, BookOpen, User, TrendingUp, Smile, Baby, Search, Grid, Compass, Lock, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { FiveElementChart } from './components/FiveElementChart';
import { calculateBazi, BaziChart, Pillar, ElementType, Gender, getAnnualRelations } from './utils/baziLogic';
import { calculateQimen, QUESTION_TYPES, QimenType, QimenResult } from './utils/qimenLogic'; // 引入奇门逻辑
import { analyzeBaziWithAI, analyzeQimenWithAI, AIAnalysisResult, QimenAIResult } from './utils/geminiService';

const SafeText = ({ content }: { content: any }) => {
  if (content === null || content === undefined) return null;
  if (typeof content === 'string') return <>{content}</>;
  if (typeof content === 'number') return <>{content}</>;
  return <span className="text-red-400 text-xs">【格式异常】</span>;
};

// ... PillarCard 组件 (保持不变) ...
const PillarCard = ({ title, pillar, isDayMaster }: { title: string; pillar?: any; isDayMaster?: boolean }) => {
    // ... (请保持原有的 PillarCard 代码)
    if (!pillar) return <div className="h-56 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400">等待输入...</div>;
    return (
        <div className={`flex flex-col items-center bg-white rounded-xl shadow-sm border p-3 ${pillar.kongWang ? 'border-dashed border-slate-300' : 'border-slate-100'}`}>
            <span className="text-[10px] text-slate-400 mb-1">{title}</span>
            <div className="text-xl font-bold">{pillar.stem}</div>
            <div className="text-xl font-bold">{pillar.branch}</div>
            <span className="text-[10px] text-slate-400">{pillar.zodiac}</span>
        </div>
    );
};

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // 八字状态
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>("12:00");
  const [longitude, setLongitude] = useState<string>("120");
  const [gender, setGender] = useState<Gender>('male');
  const [citySearch, setCitySearch] = useState("");
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const [result, setResult] = useState<BaziChart | null>(null);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  
  // 奇门状态
  const [qimenType, setQimenType] = useState<QimenType>('career');
  const [qimenContext, setQimenContext] = useState("");
  const [qimenResult, setQimenResult] = useState<QimenResult | null>(null);
  const [qimenAI, setQimenAI] = useState<QimenAIResult | null>(null);
  const [qimenLoading, setQimenLoading] = useState(false);
  const [qimenLocked, setQimenLocked] = useState(false);
  const [lockTimeLeft, setLockTimeLeft] = useState("");

  const [activeTab, setActiveTab] = useState<'energy' | 'luck' | 'numerology' | 'qimen'>('energy');

  // 检查奇门锁
  useEffect(() => {
    const lock = localStorage.getItem(`qimen_lock_${qimenType}`);
    if (lock) {
        const lockTime = parseInt(lock);
        const now = Date.now();
        const diff = 6 * 60 * 60 * 1000; // 6小时
        if (now - lockTime < diff) {
            setQimenLocked(true);
            const left = Math.ceil((diff - (now - lockTime)) / (1000 * 60)); // 分钟
            setLockTimeLeft(`${Math.floor(left/60)}小时${left%60}分`);
            // 恢复上次结果(可选)
        } else {
            setQimenLocked(false);
            localStorage.removeItem(`qimen_lock_${qimenType}`);
        }
    } else {
        setQimenLocked(false);
    }
  }, [qimenType]);

  const handleCitySearch = async () => { /* ...保持不变... */ };

  const handleAnalyze = async () => { /* ...保持不变... */ 
      // 为了演示，这里稍微简化逻辑，您之前的逻辑是好的，请直接复制之前的 handleAnalyze 逻辑
      setLoading(true); setAiLoading(true); setSidebarOpen(false);
      try {
        const chart = calculateBazi(new Date(`${date}T${time}`), longitude, gender);
        setResult(chart);
        const relations = getAnnualRelations(chart, '午');
        const aiData = await analyzeBaziWithAI(chart, 2026, relations);
        setAiResult(aiData);
      } catch(e) { console.error(e); }
      setLoading(false); setAiLoading(false);
  };

  const handleQimenAnalyze = async () => {
    if(qimenLocked) return;
    setQimenLoading(true);
    
    // 1. 规则引擎计算
    const qResult = calculateQimen(qimenType, new Date());
    setQimenResult(qResult);
    
    // 2. 锁定
    localStorage.setItem(`qimen_lock_${qimenType}`, Date.now().toString());
    setQimenLocked(true);

    // 3. AI 解读
    try {
        const aiData = await analyzeQimenWithAI(qimenType, qimenContext, qResult);
        setQimenAI(aiData);
    } catch(e) { console.error(e); }
    
    setQimenLoading(false);
    setActiveTab('qimen'); // 自动跳到奇门Tab
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-800">
      {/* 侧边栏 */}
      <div className={`fixed inset-y-0 left-0 z-40 w-80 bg-slate-900 text-white p-6 overflow-y-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static transition-transform`}>
        <div className="flex items-center gap-3 mb-8">
            <div className="bg-indigo-500 p-2 rounded-lg"><Sparkles className="text-white" size={20} /></div>
            <div><h1 className="text-xl font-bold">命理实验室</h1><span className="text-[10px] border border-indigo-700 px-1 rounded">AI Pro</span></div>
        </div>
        
        {/* 八字表单 */}
        <div className="space-y-4 mb-8">
            <h3 className="text-xs font-bold text-slate-500 uppercase">八字排盘</h3>
            <div className="flex bg-slate-800 rounded-lg p-1"><button onClick={() => setGender('male')} className={`flex-1 py-1 rounded ${gender==='male'?'bg-indigo-600':''}`}>男</button><button onClick={() => setGender('female')} className={`flex-1 py-1 rounded ${gender==='female'?'bg-pink-600':''}`}>女</button></div>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full bg-slate-800 rounded p-2 text-sm"/>
            <input type="time" value={time} onChange={e=>setTime(e.target.value)} className="w-full bg-slate-800 rounded p-2 text-sm"/>
            <button onClick={handleAnalyze} className="w-full bg-indigo-600 py-2 rounded font-bold hover:bg-indigo-500">开始八字分析</button>
        </div>

        {/* 奇门表单 */}
        <div className="space-y-4 pt-4 border-t border-slate-700">
            <h3 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Compass size={12}/> 奇门决策</h3>
            <select value={qimenType} onChange={e=>setQimenType(e.target.value as QimenType)} className="w-full bg-slate-800 rounded p-2 text-sm">
                {Object.entries(QUESTION_TYPES).map(([k,v]) => <option key={k} value={k}>{v.split(' ')[0]}</option>)}
            </select>
            <textarea value={qimenContext} onChange={e=>setQimenContext(e.target.value)} placeholder="简单描述当下困惑 (选填)" className="w-full bg-slate-800 rounded p-2 text-sm h-16"/>
            
            {qimenLocked ? (
                <div className="bg-slate-800 p-3 rounded text-center text-xs text-slate-400">
                    <Lock size={16} className="mx-auto mb-1 text-amber-500"/>
                    <p>局盘已锁定</p>
                    <p>冷却倒计时: {lockTimeLeft}</p>
                </div>
            ) : (
                <button onClick={handleQimenAnalyze} disabled={qimenLoading} className="w-full bg-emerald-600 py-2 rounded font-bold hover:bg-emerald-500 flex justify-center gap-2">
                    {qimenLoading ? '起局中...' : <><Compass size={18}/> 立即起局</>}
                </button>
            )}
        </div>
      </div>

      {/* 主内容 */}
      <div className="flex-1 h-full overflow-y-auto bg-slate-50">
        <div className="max-w-6xl mx-auto p-4 lg:p-10 space-y-6">
            
            {/* Tabs */}
            <div className="flex bg-white rounded-xl shadow-sm border border-slate-100 p-1">
                <button onClick={()=>setActiveTab('energy')} className={`flex-1 py-2 rounded-lg text-sm font-bold ${activeTab==='energy'?'bg-indigo-50 text-indigo-600':'text-slate-500'}`}>八字格局</button>
                <button onClick={()=>setActiveTab('luck')} className={`flex-1 py-2 rounded-lg text-sm font-bold ${activeTab==='luck'?'bg-indigo-50 text-indigo-600':'text-slate-500'}`}>流年运势</button>
                <button onClick={()=>setActiveTab('numerology')} className={`flex-1 py-2 rounded-lg text-sm font-bold ${activeTab==='numerology'?'bg-indigo-50 text-indigo-600':'text-slate-500'}`}>灵数解析</button>
                <button onClick={()=>setActiveTab('qimen')} className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1 ${activeTab==='qimen'?'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200':'text-slate-500'}`}>
                    <Compass size={14}/> 奇门决策
                </button>
            </div>

            {/* 奇门内容 */}
            {activeTab === 'qimen' && (
                <div className="space-y-6 animate-fade-in-up">
                    {!qimenResult ? (
                        <div className="text-center py-20 text-slate-400">
                            <Compass size={48} className="mx-auto mb-4 opacity-20"/>
                            <p>请在左侧选择问题类型，发起即时决策。</p>
                        </div>
                    ) : (
                        <>
                            {/* 信号灯卡片 */}
                            <div className={`rounded-2xl p-8 border-2 text-center relative overflow-hidden ${
                                qimenResult.signal === 'green' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                                qimenResult.signal === 'yellow' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                                'bg-red-50 border-red-200 text-red-800'
                            }`}>
                                <div className="absolute top-4 right-4 text-xs opacity-50">有效期至 {qimenResult.validUntil}</div>
                                {qimenResult.signal === 'green' && <CheckCircle size={64} className="mx-auto mb-4 text-emerald-500"/>}
                                {qimenResult.signal === 'yellow' && <AlertTriangle size={64} className="mx-auto mb-4 text-amber-500"/>}
                                {qimenResult.signal === 'red' && <XCircle size={64} className="mx-auto mb-4 text-red-500"/>}
                                
                                <h2 className="text-3xl font-bold mb-2">
                                    {qimenResult.signal === 'green' ? '可行动 (顺势)' : qimenResult.signal === 'yellow' ? '需观察 (调整)' : '不建议 (逆势)'}
                                </h2>
                                <p className="opacity-80 font-serif">{qimenResult.summary}</p>
                                
                                <div className="mt-4 flex flex-wrap justify-center gap-2">
                                    {qimenResult.factors.map(f => <span key={f} className="bg-white/50 px-2 py-1 rounded text-xs font-bold border border-white/20">{f}</span>)}
                                </div>
                            </div>

                            {/* AI 顾问解读 */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Bot size={18}/> 策略顾问建议</h3>
                                {qimenAI ? (
                                    <div className="space-y-4">
                                        <div className="bg-slate-50 p-4 rounded-lg border-l-4 border-indigo-500">
                                            <div className="font-bold text-slate-700 mb-1">核心判断</div>
                                            <p className="text-slate-600"><SafeText content={qimenAI.mainTendency}/></p>
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <div className="font-bold text-slate-700 mb-2 text-sm">💡 行动建议</div>
                                                <p className="text-sm text-slate-600 leading-relaxed"><SafeText content={qimenAI.actionAdvice}/></p>
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-700 mb-2 text-sm">🛡️ 风险提示</div>
                                                <p className="text-sm text-slate-600 leading-relaxed"><SafeText content={qimenAI.riskAlert}/></p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="animate-pulse space-y-3">
                                        <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                                        <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* 八字内容 (复用之前逻辑，此处为占位) */}
            {activeTab === 'energy' && result && (
                <div className="text-center p-10 text-slate-400">八字格局内容 (请点击左侧排盘)</div>
            )}
        </div>
      </div>
    </div>
  );
}