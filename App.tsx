import React, { useState } from 'react';
import { Calendar, Clock, Sparkles, Zap, Scroll, Bot, Menu, ArrowRight, MapPin, Globe, Activity, BookOpen, User, Star, Award, Languages, TrendingUp, Smile, Baby, Search, Grid } from 'lucide-react';
import { FiveElementChart } from './components/FiveElementChart';
import { calculateBazi, BaziChart, Pillar, ElementType, Gender, getAnnualRelations } from './utils/baziLogic';
import { analyzeBaziWithAI, AIAnalysisResult } from './utils/geminiService';

const SafeText = ({ content }: { content: any }) => {
  if (content === null || content === undefined) return null;
  if (typeof content === 'string') return <>{content}</>;
  if (typeof content === 'number') return <>{content}</>;
  return <span className="text-red-400 text-xs">【数据格式异常】{JSON.stringify(content)}</span>;
};

const PillarCard = ({ title, pillar, isDayMaster }: { title: string; pillar?: Pillar; isDayMaster?: boolean }) => {
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
    <div className={`flex flex-col items-center bg-white rounded-xl shadow-sm border p-3 lg:p-4 transition-transform hover:-translate-y-1 duration-300 relative overflow-hidden group ${pillar.kongWang ? 'border-dashed border-slate-300 bg-slate-50/50' : 'border-slate-100'}`}>
      {pillar.kongWang && <div className="absolute top-0 right-0 bg-slate-200 text-slate-500 text-[9px] px-1.5 py-0.5 rounded-bl">空亡</div>}
      <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1">{title}</span>
      <span className="text-[9px] text-slate-400 mb-2 scale-90">{pillar.naYin}</span>
      {!isDayMaster && <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded mb-1">{pillar.tenGodStem}</span>}
      {isDayMaster && <span className="text-[10px] text-white bg-indigo-500 px-1.5 py-0.5 rounded mb-1 shadow-sm">日主</span>}
      <div className={`w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center rounded-full text-xl lg:text-2xl font-serif font-bold mb-2 border ${getElementColor(pillar.elementStem)}`}>{pillar.stem}</div>
      <div className={`w-14 h-14 lg:w-16 lg:h-16 flex items-center justify-center rounded-lg text-2xl lg:text-3xl font-serif font-bold mb-1 border ${getElementColor(pillar.elementBranch)}`}>{pillar.branch}</div>
      <span className="text-[10px] text-slate-400 mt-1">{pillar.zodiac} · {pillar.hiddenStems[0]}</span>
      <div className="mt-2 flex flex-wrap gap-1 justify-center min-h-[20px]">
        {pillar.shenSha.map(ss => <span key={ss} className="text-[9px] text-pink-600 border border-pink-100 bg-pink-50 px-1 rounded">{ss}</span>)}
      </div>
    </div>
  );
};

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
  const [activeTab, setActiveTab] = useState<'energy' | 'luck' | 'numerology' | 'ancient' | 'career'>('energy');
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
            alert("未找到该城市，请尝试输入英文或更详细的名称");
        }
    } catch(e) {
        alert("定位服务连接失败");
    } finally {
        setIsSearchingCity(false);
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setAiLoading(true); 
    setSidebarOpen(false); 
    setResult(null);
    setAiResult(null);
    setIsTranslated(false);

    let chart: BaziChart;
    try {
        const inputDate = new Date(`${date}T${time}`);
        chart = calculateBazi(inputDate, longitude, gender);
        setResult(chart); 
    } catch (error) {
        alert("排盘出错了，请检查输入格式或确保依赖已更新");
        setLoading(false); setAiLoading(false);
        return;
    }
    setLoading(false);

    const currentYearBranch = '午'; 
    const relations = getAnnualRelations(chart, currentYearBranch);

    try {
        const analysis = await analyzeBaziWithAI(chart, 2026, relations);
        setAiResult(analysis);
    } catch (error) {
        console.error("AI 分析失败", error);
    } finally {
        setAiLoading(false); 
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-800">
      
      {/* 侧边栏 */}
      <button onClick={() => setSidebarOpen(true)} className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md text-slate-600"><Menu size={24} /></button>
      <div className={`fixed inset-y-0 left-0 z-40 w-80 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out shadow-2xl ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:shadow-none`}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-indigo-500 p-2 rounded-lg"><Sparkles className="text-white" size={20} /></div>
            <div><h1 className="text-xl font-bold tracking-tight">命理实验室</h1><span className="text-[10px] text-indigo-300 uppercase tracking-widest border border-indigo-700 px-1 rounded">AI Pro</span></div>
          </div>
          <div className="space-y-6 flex-1 overflow-y-auto">
            <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Baby size={12}/> 性别 (影响大运)</label>
                <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                    <button onClick={() => setGender('male')} className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${gender==='male' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>男</button>
                    <button onClick={() => setGender('female')} className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${gender==='female' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'}`}>女</button>
                </div>
            </div>
            <div className="space-y-2"><label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Calendar size={12}/> 出生日期</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg py-2.5 px-3 focus:outline-none focus:border-indigo-500" /></div>
            <div className="space-y-2"><label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Clock size={12}/> 出生时间</label><input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg py-2.5 px-3 focus:outline-none focus:border-indigo-500" /></div>
            
            {/* 🌍 城市自动定位输入框 */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Search size={12}/> 城市定位 (自动填经度)</label>
                <div className="flex gap-2">
                    <input type="text" value={citySearch} onChange={(e) => setCitySearch(e.target.value)} placeholder="输入城市 (如 Shanghai)" className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg py-2 px-3 focus:outline-none focus:border-indigo-500 text-sm" />
                    <button onClick={handleCitySearch} disabled={isSearchingCity} className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg disabled:opacity-50">
                        {isSearchingCity ? <span className="animate-spin">⏳</span> : <Search size={16}/>}
                    </button>
                </div>
            </div>

            <div className="space-y-2"><label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Globe size={12}/> 出生地经度</label><input type="text" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="如: 103.45" className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg py-2.5 px-3 focus:outline-none focus:border-indigo-500" /></div>
          </div>
          <button onClick={handleAnalyze} disabled={loading || aiLoading} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 mt-4 hover:opacity-90 disabled:opacity-50">{loading ? <span>排盘中...</span> : aiLoading ? <span>AI思考中...</span> : <>开始排盘 <ArrowRight size={18} /></>}</button>
        </div>
      </div>

      {/* 主内容 */}
      <div className="flex-1 h-full overflow-y-auto relative">
        {!result && !loading && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4"><Bot size={40} className="text-slate-300" /></div>
                <h2 className="text-xl font-semibold text-slate-600 mb-2">AI 命理系统已就绪</h2>
                <p>请输入信息，选择性别，开始排大运、看流年。</p>
             </div>
        )}

        {result && (
          <div className="max-w-6xl mx-auto p-6 lg:p-10 space-y-8 animate-fade-in">
            <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-slate-100 relative overflow-hidden flex flex-col md:flex-row justify-between gap-6">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded uppercase">Hybrid Analysis</span>
                        <span className="text-slate-500 text-xs flex items-center gap-1"><MapPin size={12}/> {result.meta.trueSolarTime} 真太阳时</span>
                        <span className={`text-xs px-2 py-0.5 rounded text-white ${gender==='male'?'bg-indigo-500':'bg-pink-500'}`}>{gender==='male'?'乾造 (男)':'坤造 (女)'}</span>
                    </div>
                    <h1 className="text-3xl lg:text-5xl font-bold text-slate-800 font-serif mb-2 tracking-tight">
                        {aiResult ? aiResult.archetype : <span className="animate-pulse bg-slate-200 text-transparent rounded">命格计算中...</span>}
                    </h1>
                    <p className="text-slate-600 text-lg font-serif italic">
                        "{aiResult ? <SafeText content={aiResult.summary} /> : 'AI 正在阅读您的星盘...'}"
                    </p>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-center">
                        <div className="relative w-24 h-24 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                                <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * result.destinyScore) / 100} className={`transition-all duration-1000 ease-out ${result.destinyScore >= 80 ? 'text-emerald-500' : result.destinyScore >= 60 ? 'text-indigo-500' : 'text-amber-500'}`} />
                            </svg>
                            <span className="absolute text-2xl font-bold text-slate-700">{result.destinyScore}</span>
                        </div>
                        <span className="text-xs font-semibold text-slate-400 uppercase mt-2">本地评分</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-2 md:gap-6">
                <PillarCard title="年柱" pillar={result.year} />
                <PillarCard title="月柱" pillar={result.month} />
                <PillarCard title="日柱" pillar={result.day} isDayMaster={true} />
                <PillarCard title="时柱" pillar={result.hour} />
            </div>
            
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 overflow-x-auto">
                <div className="flex justify-between items-center mb-2 px-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><TrendingUp size={12}/> 大运排盘</h3>
                    <span className="text-xs text-slate-400">每10年一运</span>
                </div>
                <div className="flex gap-4 min-w-max pb-2">
                    {result.daYun && result.daYun.length > 0 ? (
                        result.daYun.map((yun, idx) => (
                            <div key={idx} className="flex flex-col items-center bg-slate-50 border border-slate-100 rounded-lg p-2 min-w-[70px]">
                                <span className="text-[10px] text-slate-400 mb-1">{yun.startAge}岁</span>
                                <span className="text-lg font-serif font-bold text-slate-700">{yun.ganZhi}</span>
                                <span className="text-[9px] text-slate-400 mt-1">{yun.year}年</span>
                            </div>
                        ))
                    ) : (
                        <div className="text-xs text-slate-300 p-2">暂无大运数据</div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">五行能量</h3>
                        <FiveElementChart scores={result.fiveElementScore} />
                    </div>
                    
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                         <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                            <Smile size={16}/> 容貌分析
                        </h3>
                         {aiResult ? (
                            <p className="text-sm text-slate-600 leading-relaxed text-justify italic font-serif">
                                <SafeText content={aiResult.appearanceAnalysis} />
                            </p>
                         ) : <div className="animate-pulse h-20 bg-slate-50 rounded"></div>}
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                            <User size={16}/> 历史相似人物
                        </h3>
                        {aiResult && (
                            <div className="space-y-4">
                                {aiResult.historicalFigures.map((figure, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${idx===0 ? 'bg-yellow-500 ring-2 ring-yellow-200' : 'bg-slate-400'}`}>
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <div className="flex justify-between items-center w-full">
                                                <span className="font-bold text-slate-700"><SafeText content={figure.name}/></span>
                                                <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">相似度 <SafeText content={figure.similarity}/></span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1 leading-relaxed"><SafeText content={figure.reason}/></p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col min-h-[500px]">
                    <div className="flex border-b border-slate-100 overflow-x-auto">
                        <button onClick={() => setActiveTab('energy')} className={`flex-1 py-4 text-sm font-medium whitespace-nowrap px-4 ${activeTab==='energy'?'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50':'text-slate-500'}`}>
                            <Award size={16} className="inline mr-2"/> 格局分析
                        </button>
                        <button onClick={() => setActiveTab('luck')} className={`flex-1 py-4 text-sm font-medium whitespace-nowrap px-4 ${activeTab==='luck'?'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50':'text-slate-500'}`}>
                            <TrendingUp size={16} className="inline mr-2"/> 流年运势
                        </button>
                        {/* 🔢 灵数 Tab */}
                        <button onClick={() => setActiveTab('numerology')} className={`flex-1 py-4 text-sm font-medium whitespace-nowrap px-4 ${activeTab==='numerology'?'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50':'text-slate-500'}`}>
                            <Grid size={16} className="inline mr-2"/> 灵数解析
                        </button>
                        <button onClick={() => setActiveTab('ancient')} className={`flex-1 py-4 text-sm font-medium whitespace-nowrap px-4 ${activeTab==='ancient'?'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50':'text-slate-500'}`}>
                            <BookOpen size={16} className="inline mr-2"/> 穷通宝鉴
                        </button>
                        <button onClick={() => setActiveTab('career')} className={`flex-1 py-4 text-sm font-medium whitespace-nowrap px-4 ${activeTab==='career'?'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50':'text-slate-500'}`}>
                            <Zap size={16} className="inline mr-2"/> 事业建议
                        </button>
                    </div>

                    <div className="p-8 flex-1">
                        {aiLoading && !aiResult ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                                <Bot size={40} className="animate-bounce text-indigo-300"/>
                                <p className="animate-pulse">大师正在撰写命书...</p>
                            </div>
                        ) : (
                            <>
                                {activeTab === 'energy' && (
                                    <div className="space-y-6 animate-fade-in-up">
                                        <div>
                                            <h4 className="text-lg font-bold text-slate-800 mb-2">格局深度解析</h4>
                                            <p className="text-slate-600 leading-relaxed text-justify">
                                                <SafeText content={aiResult?.strengthAnalysis} />
                                            </p>
                                        </div>
                                        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                            <h4 className="text-emerald-800 font-bold mb-2 flex items-center gap-2"><Activity size={16}/> 健康建议</h4>
                                            <p className="text-emerald-700 text-sm">
                                                <SafeText content={aiResult?.healthAdvice} />
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {activeTab === 'luck' && (
                                    <div className="space-y-6 animate-fade-in-up">
                                        <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-xl">
                                            <h4 className="text-indigo-900 font-bold mb-4 flex items-center gap-2">
                                                <TrendingUp size={18}/> 2026 丙午流年运势
                                            </h4>
                                            <p className="text-indigo-800 text-base leading-relaxed text-justify">
                                                <SafeText content={aiResult?.annualLuckAnalysis} />
                                            </p>
                                        </div>
                                    </div>
                                )}
                                
                                {/* 🔢 灵数内容：九宫格可视化 + AI解读 */}
                                {activeTab === 'numerology' && (
                                    <div className="space-y-6 animate-fade-in-up">
                                        <div className="flex flex-col md:flex-row gap-8">
                                            {/* 九宫格 Grid */}
                                            <div className="flex-shrink-0">
                                                <h4 className="text-sm font-bold text-slate-400 uppercase mb-4 text-center">洛书九宫分布</h4>
                                                <div className="grid grid-cols-3 gap-2 w-48 h-48 mx-auto bg-slate-100 p-2 rounded-xl">
                                                    {/* 洛书顺序：4 9 2 / 3 5 7 / 8 1 6 */}
                                                    {[4,9,2,3,5,7,8,1,6].map(num => {
                                                        const count = result?.lingShu.grid[num] || 0;
                                                        return (
                                                            <div key={num} className={`flex items-center justify-center rounded-lg font-bold text-lg relative ${count > 0 ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' : 'bg-slate-200 text-slate-400'}`}>
                                                                {num}
                                                                {count > 1 && <span className="absolute top-0 right-0 bg-red-500 text-white text-[8px] px-1 rounded-bl-lg">{count}</span>}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                                <div className="text-center mt-4">
                                                    <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
                                                        命数: {result?.lingShu.lifePathNumber}
                                                    </span>
                                                </div>
                                            </div>
                                            {/* AI 解读 */}
                                            <div className="flex-1">
                                                <h4 className="text-lg font-bold text-slate-800 mb-2">灵数能量解读</h4>
                                                <p className="text-slate-600 leading-relaxed text-justify">
                                                    <SafeText content={aiResult?.numerologyAnalysis} />
                                                </p>
                                                <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-500">
                                                    * 九宫格中缺失的数字代表性格盲点或需补足的能量，重复的数字代表天赋优势。
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'ancient' && (
                                    <div className="space-y-6 animate-fade-in-up">
                                        <div className="p-6 bg-amber-50 border border-amber-100 rounded-xl">
                                            <div className="flex justify-between items-center mb-4 border-b border-amber-200 pb-2">
                                                <h4 className="text-amber-900 font-bold font-serif-sc text-lg">📜 调候用神</h4>
                                                <button onClick={() => setIsTranslated(!isTranslated)} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-semibold rounded-lg transition-colors border border-amber-200">
                                                    <Languages size={14}/> {isTranslated ? "看原文" : "白话翻译"}
                                                </button>
                                            </div>
                                            <div className="min-h-[100px]">
                                                {isTranslated ? (
                                                    <div className="animate-fade-in"><span className="text-xs font-bold text-amber-600 bg-amber-100 px-1 rounded mr-2">白话</span><p className="text-amber-800 text-base leading-8 font-sans inline"><SafeText content={aiResult?.bookAdviceTranslation} /></p></div>
                                                ) : (
                                                    <div className="animate-fade-in"><span className="text-xs font-bold text-amber-600 bg-amber-100 px-1 rounded mr-2">古文</span><p className="text-amber-900 text-lg leading-8 font-serif-sc inline"><SafeText content={aiResult?.bookAdvice} /></p></div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {activeTab === 'career' && (
                                    <div className="space-y-6 animate-fade-in-up">
                                         <div>
                                            <h4 className="text-lg font-bold text-slate-800 mb-2">事业发展方向</h4>
                                            <p className="text-slate-600 leading-relaxed text-justify">
                                                <SafeText content={aiResult?.careerAdvice} />
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}