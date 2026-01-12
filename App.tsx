import React, { useState } from 'react';
import { Calendar, Clock, Sparkles, Bot, Menu, ArrowRight, MapPin, Globe, Activity, BookOpen, User, Award, TrendingUp, Smile, Baby, Search, Compass, CheckCircle, AlertTriangle, XCircle, Grid } from 'lucide-react';
import { FiveElementChart } from './components/FiveElementChart';
import { calculateBazi, BaziChart, Pillar, ElementType, Gender } from './utils/baziLogic';
import { calculateQimen, QUESTION_TYPES, QimenType, QimenResult } from './utils/qimenLogic';
import { analyzeBaziWithAI, analyzeQimenWithAI, AIAnalysisResult, QimenAIResult } from './utils/geminiService';

const SafeText = ({ content }: { content: any }) => {
  if (content === null || content === undefined) return null;
  if (typeof content === 'string') return <>{content}</>;
  return <span className="text-red-400 text-xs">【格式异常】</span>;
};

const PillarCard = ({ title, pillar, isDayMaster }: { title: string; pillar?: any; isDayMaster?: boolean }) => {
  const getElementColor = (type: ElementType) => {
    switch (type) {
      case 'gold': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'wood': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'water': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'fire': return 'text-red-600 bg-red-50 border-red-200';
      case 'earth': return 'text-amber-700 bg-amber-100 border-amber-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (!pillar) return <div className="h-56 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400">等待输入...</div>;

  return (
    <div className={`flex flex-col items-center bg-white rounded-xl shadow-sm border p-3 lg:p-4 relative overflow-hidden ${pillar.kongWang ? 'border-dashed border-slate-300 bg-slate-50/50' : 'border-slate-100'}`}>
      {pillar.kongWang && <div className="absolute top-0 right-0 bg-slate-200 text-slate-500 text-[9px] px-1.5 py-0.5 rounded-bl">空亡</div>}
      <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">{title}</span>
      <span className="text-[9px] text-slate-400 mb-2 scale-90">{pillar.naYin}</span>
      {!isDayMaster && <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded mb-1">{pillar.tenGodStem}</span>}
      {isDayMaster && <span className="text-[10px] text-white bg-indigo-500 px-1.5 py-0.5 rounded mb-1 shadow-sm">日主</span>}
      <div className={`w-10 h-10 flex items-center justify-center rounded-full text-xl font-serif font-bold mb-2 border ${getElementColor(pillar.elementStem)}`}>{pillar.stem}</div>
      <div className={`w-14 h-14 flex items-center justify-center rounded-lg text-2xl font-serif font-bold mb-1 border ${getElementColor(pillar.elementBranch)}`}>{pillar.branch}</div>
      <span className="text-[10px] text-slate-400 mt-1">{pillar.zodiac} · {pillar.hiddenStems[0]}</span>
    </div>
  );
};

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // 八字 Input
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>("12:00");
  const [longitude, setLongitude] = useState<string>("120");
  const [gender, setGender] = useState<Gender>('male');
  
  // ✅ 城市定位
  const [citySearch, setCitySearch] = useState("");
  const [isSearchingCity, setIsSearchingCity] = useState(false);

  // 八字 Result
  const [result, setResult] = useState<BaziChart | null>(null);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  
  // 奇门 Input & Result
  const [qimenType, setQimenType] = useState<QimenType>('career');
  const [qimenContext, setQimenContext] = useState("");
  const [qimenResult, setQimenResult] = useState<QimenResult | null>(null);
  const [qimenAI, setQimenAI] = useState<QimenAIResult | null>(null);
  const [qimenLoading, setQimenLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'energy' | 'luck' | 'numerology' | 'qimen' | 'ancient' | 'career'>('energy');
  const [isTranslated, setIsTranslated] = useState(false);

  // 🌍 城市自动定位功能
  const handleCitySearch = async () => {
    if(!citySearch) return;
    setIsSearchingCity(true);
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(citySearch)}`);
        const data = await response.json();
        if(data && data.length > 0) {
            const lon = parseFloat(data[0].lon).toFixed(4);
            setLongitude(lon);
            alert(`已定位到 ${data[0].display_name.split(',')[0]} (经度: ${lon})`);
        } else {
            alert("未找到该城市，请尝试输入英文拼写");
        }
    } catch(e) {
        alert("定位服务连接失败");
    } finally {
        setIsSearchingCity(false);
    }
  };

  const handleAnalyze = async () => {
    setLoading(true); setAiLoading(true); setSidebarOpen(false); setResult(null); setAiResult(null);
    try {
        const chart = calculateBazi(new Date(`${date}T${time}`), longitude, gender);
        setResult(chart);
        setLoading(false); // 本地计算完成
        const analysis = await analyzeBaziWithAI(chart, 2026);
        setAiResult(analysis);
    } catch (error) {
        alert("排盘错误，请检查输入");
    } finally {
        setLoading(false); setAiLoading(false);
    }
  };

  // ✅ 奇门分析 (无限制版)
  const handleQimenAnalyze = async () => {
    setQimenLoading(true);
    // 1. 本地规则引擎
    const qResult = calculateQimen(qimenType, new Date());
    setQimenResult(qResult);
    
    // 2. AI 解读 (无锁)
    try {
        const aiData = await analyzeQimenWithAI(qimenType, qimenContext, qResult);
        setQimenAI(aiData);
    } catch(e) { console.error(e); }
    
    setQimenLoading(false);
    setActiveTab('qimen'); 
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-800">
      
      {/* Sidebar */}
      <button onClick={() => setSidebarOpen(true)} className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md text-slate-600"><Menu size={24} /></button>
      <div className={`fixed inset-y-0 left-0 z-40 w-80 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out shadow-2xl ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:shadow-none`}>
        <div className="h-full flex flex-col p-6 overflow-y-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-indigo-500 p-2 rounded-lg"><Sparkles className="text-white" size={20} /></div>
            <div><h1 className="text-xl font-bold">命理实验室</h1><span className="text-[10px] border border-indigo-700 px-1 rounded">Creator Mode</span></div>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Baby size={12}/> 性别</label>
                <div className="flex bg-slate-800 rounded-lg p-1"><button onClick={() => setGender('male')} className={`flex-1 py-1.5 rounded ${gender==='male'?'bg-indigo-600':''}`}>男</button><button onClick={() => setGender('female')} className={`flex-1 py-1.5 rounded ${gender==='female'?'bg-pink-600':''}`}>女</button></div>
            </div>
            
            {/* 🌍 城市定位输入 */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Search size={12}/> 城市定位 (真太阳时)</label>
                <div className="flex gap-2">
                    <input type="text" value={citySearch} onChange={(e) => setCitySearch(e.target.value)} placeholder="如 Shanghai, Taipei" className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg py-2 px-3 focus:outline-none focus:border-indigo-500 text-sm" />
                    <button onClick={handleCitySearch} disabled={isSearchingCity} className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg disabled:opacity-50">
                        {isSearchingCity ? <span className="animate-spin">⏳</span> : <Search size={16}/>}
                    </button>
                </div>
            </div>

            <div className="space-y-2"><label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">经度</label><input type="text" value={longitude} onChange={(e) => setLongitude(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg py-2 px-3" /></div>
            <div className="space-y-2"><label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">日期</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg py-2 px-3" /></div>
            <div className="space-y-2"><label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">时间</label><input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg py-2 px-3" /></div>
            
            <button onClick={handleAnalyze} disabled={loading || aiLoading} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-indigo-500 disabled:opacity-50">{loading ? '排盘中...' : '八字排盘'}</button>

            {/* 奇门板块 */}
            <div className="pt-6 border-t border-slate-700 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><Compass size={12}/> 奇门决策 (无限制)</h3>
                <select value={qimenType} onChange={e=>setQimenType(e.target.value as any)} className="w-full bg-slate-800 rounded p-2 text-sm text-white">
                    {Object.entries(QUESTION_TYPES).map(([k,v]) => <option key={k} value={k}>{v.split(' ')[0]}</option>)}
                </select>
                <button onClick={handleQimenAnalyze} disabled={qimenLoading} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-emerald-500 disabled:opacity-50">
                    {qimenLoading ? '起局中...' : '立即起局'}
                </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 h-full overflow-y-auto relative">
        {!result && !loading && !qimenResult && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4"><Bot size={40} className="text-slate-300" /></div>
                <h2 className="text-xl font-semibold text-slate-600 mb-2">Creator Mode Ready</h2>
                <p>请输入信息开始排盘，或使用左侧奇门进行即时决策。</p>
             </div>
        )}

        <div className="max-w-6xl mx-auto p-6 lg:p-10 space-y-8 animate-fade-in">
            {/* 奇门结果展示 */}
            {qimenResult && (activeTab === 'qimen' || !result) && (
                <div className="space-y-6">
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
                        <p className="opacity-80 font-serif mb-4">{qimenResult.summary}</p>
                        
                        {qimenAI ? (
                            <div className="bg-white/60 p-4 rounded-xl text-left max-w-2xl mx-auto mt-6">
                                <p className="font-bold mb-2">💡 建议：</p>
                                <p className="text-sm leading-relaxed mb-4"><SafeText content={qimenAI.actionAdvice}/></p>
                                <p className="font-bold mb-2">🛡️ 风险：</p>
                                <p className="text-sm leading-relaxed"><SafeText content={qimenAI.riskAlert}/></p>
                            </div>
                        ) : <div className="animate-pulse text-sm">AI 正在解读策略...</div>}
                    </div>
                </div>
            )}

            {/* 八字结果展示 */}
            {result && (
                <>
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between gap-6">
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className="text-slate-500 text-xs flex items-center gap-1"><MapPin size={12}/> {result.meta.trueSolarTime}</span>
                                <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs">{gender==='male'?'乾造':'坤造'}</span>
                            </div>
                            <h1 className="text-3xl font-bold text-slate-800 mb-2">
                                <SafeText content={aiResult?.archetype || "计算中..."} />
                            </h1>
                            <p className="text-slate-600 italic"><SafeText content={aiResult?.summary || "..."} /></p>
                        </div>
                        <div className="flex items-center gap-4">
                             <div className="text-center">
                                <div className="text-2xl font-bold text-indigo-600">{result.destinyScore}</div>
                                <div className="text-xs text-slate-400">本地评分</div>
                             </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                        <PillarCard title="年" pillar={result.year} />
                        <PillarCard title="月" pillar={result.month} />
                        <PillarCard title="日" pillar={result.day} isDayMaster />
                        <PillarCard title="时" pillar={result.hour} />
                    </div>

                    {/* Tabs */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex overflow-x-auto">
                        {['energy', 'luck', 'numerology', 'career', 'qimen'].map(t => (
                            <button key={t} onClick={()=>setActiveTab(t as any)} className={`flex-1 py-3 text-sm font-bold capitalize ${activeTab===t ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}>
                                {t === 'qimen' ? '奇门决策' : t === 'numerology' ? '灵数' : t}
                            </button>
                        ))}
                    </div>

                    <div className="p-6 bg-white rounded-2xl border border-slate-100 min-h-[300px]">
                        {activeTab === 'energy' && <FiveElementChart scores={result.fiveElementScore} />}
                        {activeTab === 'luck' && <p className="text-sm leading-loose"><SafeText content={aiResult?.annualLuckAnalysis}/></p>}
                        {activeTab === 'numerology' && (
                            <div className="flex gap-8">
                                <div className="grid grid-cols-3 gap-1 w-32 h-32 bg-slate-100 p-1 rounded">
                                    {[4,9,2,3,5,7,8,1,6].map(n => (
                                        <div key={n} className={`flex items-center justify-center rounded ${result.lingShu?.grid[n] ? 'bg-indigo-500 text-white' : 'text-slate-300'}`}>{n}</div>
                                    ))}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold mb-2">命数: {result.lingShu?.lifePathNumber}</h4>
                                    <p className="text-sm text-slate-600"><SafeText content={aiResult?.numerologyAnalysis}/></p>
                                </div>
                            </div>
                        )}
                        {activeTab === 'career' && <p className="text-sm leading-loose"><SafeText content={aiResult?.careerAdvice}/></p>}
                        {activeTab === 'qimen' && (
                            <div className="text-center text-slate-400 py-10">
                                <p>请在左侧侧边栏使用奇门决策功能</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
}