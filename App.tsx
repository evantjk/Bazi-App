import React, { useState } from 'react';
import { Calendar, Clock, Sparkles, Zap, Scroll, Bot, Menu, ArrowRight, MapPin, Globe, Activity, BookOpen, User, Star, Award, Languages } from 'lucide-react';
import { FiveElementChart } from './components/FiveElementChart';
import { calculateBazi, BaziChart, Pillar, ElementType } from './utils/baziLogic';
import { analyzeBaziWithAI, AIAnalysisResult } from './utils/geminiService';

// --- 子组件：单柱卡片 ---
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

// --- 主应用组件 ---
export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>("12:00");
  const [longitude, setLongitude] = useState<string>("120"); 
  
  const [result, setResult] = useState<BaziChart | null>(null);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'energy' | 'ancient' | 'career'>('energy');
  const [isTranslated, setIsTranslated] = useState(false); // 控制翻译开关

  const handleAnalyze = async () => {
    setLoading(true);
    setAiLoading(true);
    setSidebarOpen(false); 
    setResult(null);
    setAiResult(null);
    setIsTranslated(false); // 每次重新分析时重置翻译状态

    let chart: BaziChart;
    try {
        const inputDate = new Date(`${date}T${time}`);
        chart = calculateBazi(inputDate, longitude);
        setResult(chart);
    } catch (error) {
        alert("排盘出错了，请检查输入格式");
        setLoading(false); setAiLoading(false);
        return;
    }
    setLoading(false);

    try {
        const analysis = await analyzeBaziWithAI(chart);
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
            <div className="space-y-2"><label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Calendar size={12}/> 出生日期</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg py-2.5 px-3 focus:outline-none focus:border-indigo-500" /></div>
            <div className="space-y-2"><label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Clock size={12}/> 出生时间</label><input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg py-2.5 px-3 focus:outline-none focus:border-indigo-500" /></div>
            <div className="space-y-2"><label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Globe size={12}/> 出生地经度</label><input type="text" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="如: 103°45'34" className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg py-2.5 px-3 focus:outline-none focus:border-indigo-500" /></div>
          </div>
          <button onClick={handleAnalyze} disabled={loading || aiLoading} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 mt-4 hover:opacity-90 disabled:opacity-50">{loading ? <span>计算中...</span> : <>开始排盘 <ArrowRight size={18} /></>}</button>
        </div>
      </div>

      {/* 主内容 */}
      <div className="flex-1 h-full overflow-y-auto relative">
        {!result && !loading && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4"><Bot size={40} className="text-slate-300" /></div>
                <h2 className="text-xl font-semibold text-slate-600 mb-2">AI 命理系统已就绪</h2>
                <p>请输入信息，AI 将为您评分并寻找历史上的“同路人”。</p>
             </div>
        )}

        {result && (
          <div className="max-w-6xl mx-auto p-6 lg:p-10 space-y-8 animate-fade-in">
            
            {/* 顶部横幅：命格名称 + AI 评分 */}
            <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-slate-100 relative overflow-hidden flex flex-col md:flex-row justify-between gap-6">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                
                <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded uppercase">Gemini 2.5 Analysis</span>
                        <span className="text-slate-500 text-xs flex items-center gap-1"><MapPin size={12}/> {result.meta.trueSolarTime} 真太阳时</span>
                        {/* 均时差提示 */}
                        {result.meta.equationOfTime && <span className="text-slate-400 text-xs bg-slate-50 px-1 rounded border border-slate-100">均时差: {result.meta.equationOfTime}</span>}
                    </div>
                    {/* 命格赐名 */}
                    <h1 className="text-3xl lg:text-5xl font-bold text-slate-800 font-serif mb-2 tracking-tight">
                        {aiResult ? aiResult.archetype : <span className="animate-pulse bg-slate-200 text-transparent rounded">正在计算命格...</span>}
                    </h1>
                    <p className="text-slate-600 text-lg font-serif italic">
                        "{aiResult ? aiResult.summary : 'AI 正在阅读您的星盘...'}"
                    </p>
                </div>

                {/* 右侧：评分圆环 */}
                <div className="flex items-center gap-6">
                    {aiResult && (
                        <div className="flex flex-col items-center">
                            <div className="relative w-24 h-24 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * aiResult.score) / 100} className={`transition-all duration-1000 ease-out ${aiResult.score >= 80 ? 'text-emerald-500' : aiResult.score >= 60 ? 'text-indigo-500' : 'text-amber-500'}`} />
                                </svg>
                                <span className="absolute text-2xl font-bold text-slate-700">{aiResult.score}</span>
                            </div>
                            <span className="text-xs font-semibold text-slate-400 uppercase mt-2">格局评分</span>
                        </div>
                    )}
                </div>
            </div>

            {/* 四柱显示 */}
            <div className="grid grid-cols-4 gap-2 md:gap-6">
                <PillarCard title="年柱" pillar={result.year} />
                <PillarCard title="月柱" pillar={result.month} />
                <PillarCard title="日柱" pillar={result.day} isDayMaster={true} />
                <PillarCard title="时柱" pillar={result.hour} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* 左侧：五行图 + 历史人物 */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">五行能量</h3>
                        <FiveElementChart scores={result.fiveElementScore} />
                    </div>
                    
                    {/* 历史人物对标 */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                            <User size={16}/> 历史相似人物
                        </h3>
                        {aiResult ? (
                            <div className="space-y-4">
                                {aiResult.historicalFigures.map((figure, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${idx===0 ? 'bg-yellow-500 ring-2 ring-yellow-200' : 'bg-slate-400'}`}>
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <div className="flex justify-between items-center w-full">
                                                <span className="font-bold text-slate-700">{figure.name}</span>
                                                <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">相似度 {figure.similarity}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{figure.reason}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-400 text-sm animate-pulse">正在搜索历史长河...</div>
                        )}
                    </div>
                </div>

                {/* 右侧：Tab 内容 */}
                <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col min-h-[500px]">
                    <div className="flex border-b border-slate-100">
                        <button onClick={() => setActiveTab('energy')} className={`flex-1 py-4 text-sm font-medium ${activeTab==='energy'?'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50':'text-slate-500'}`}>
                            <Award size={16} className="inline mr-2"/> 格局分析
                        </button>
                        <button onClick={() => setActiveTab('ancient')} className={`flex-1 py-4 text-sm font-medium ${activeTab==='ancient'?'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50':'text-slate-500'}`}>
                            <BookOpen size={16} className="inline mr-2"/> 穷通宝鉴
                        </button>
                        <button onClick={() => setActiveTab('career')} className={`flex-1 py-4 text-sm font-medium ${activeTab==='career'?'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50':'text-slate-500'}`}>
                            <Zap size={16} className="inline mr-2"/> 事业建议
                        </button>
                    </div>

                    <div className="p-8 flex-1">
                        {aiLoading ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                                <Bot size={40} className="animate-bounce text-indigo-300"/>
                                <p className="animate-pulse">Gemini 正在撰写命书...</p>
                            </div>
                        ) : (
                            <>
                                {activeTab === 'energy' && (
                                    <div className="space-y-6 animate-fade-in-up">
                                        <div>
                                            <h4 className="text-lg font-bold text-slate-800 mb-2">格局深度解析</h4>
                                            <p className="text-slate-600 leading-relaxed text-justify">{aiResult?.strengthAnalysis}</p>
                                        </div>
                                        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                            <h4 className="text-emerald-800 font-bold mb-2 flex items-center gap-2"><Activity size={16}/> 健康建议</h4>
                                            <p className="text-emerald-700 text-sm">{aiResult?.healthAdvice}</p>
                                        </div>
                                    </div>
                                )}
                                
                                {/* 穷通宝鉴 Tab (增加翻译功能) */}
                                {activeTab === 'ancient' && (
                                    <div className="space-y-6 animate-fade-in-up">
                                        <div className="p-6 bg-amber-50 border border-amber-100 rounded-xl">
                                            {/* 标题栏 + 翻译按钮 */}
                                            <div className="flex justify-between items-center mb-4 border-b border-amber-200 pb-2">
                                                <h4 className="text-amber-900 font-bold font-serif-sc text-lg">📜 调候用神</h4>
                                                
                                                {/* 翻译按钮 */}
                                                <button 
                                                    onClick={() => setIsTranslated(!isTranslated)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-semibold rounded-lg transition-colors border border-amber-200"
                                                >
                                                    <Languages size={14}/>
                                                    {isTranslated ? "看原文" : "白话翻译"}
                                                </button>
                                            </div>
                                            
                                            {/* 内容显示：根据状态切换 */}
                                            <div className="min-h-[100px]">
                                                {isTranslated ? (
                                                    <div className="animate-fade-in">
                                                        <span className="text-xs font-bold text-amber-600 bg-amber-100 px-1 rounded mr-2">白话</span>
                                                        <p className="text-amber-800 text-base leading-8 font-sans inline">
                                                            {aiResult?.bookAdviceTranslation}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="animate-fade-in">
                                                        <span className="text-xs font-bold text-amber-600 bg-amber-100 px-1 rounded mr-2">古文</span>
                                                        <p className="text-amber-900 text-lg leading-8 font-serif-sc inline">
                                                            {aiResult?.bookAdvice}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-400 italic text-center">
                                            * 此内容由 AI 模拟《穷通宝鉴》古籍逻辑生成
                                        </p>
                                    </div>
                                )}

                                {activeTab === 'career' && (
                                    <div className="space-y-6 animate-fade-in-up">
                                         <div>
                                            <h4 className="text-lg font-bold text-slate-800 mb-2">事业发展方向</h4>
                                            <p className="text-slate-600 leading-relaxed text-justify">{aiResult?.careerAdvice}</p>
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