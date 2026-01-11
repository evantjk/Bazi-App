import React, { useState } from 'react';
import { Calendar, Clock, Sparkles, Zap, Scroll, Bot, Menu, X, ArrowRight, MapPin, Globe, Activity, Heart, BookOpen } from 'lucide-react';
import { FiveElementChart } from './components/FiveElementChart';
import { calculateBazi, BaziChart, Pillar, ElementType, ELEMENT_CN_MAP } from './utils/baziLogic';
import { analyzeBaziWithAI, AIAnalysisResult } from './utils/geminiService';

// ----------------------------------------------------------------------
// 子组件：单柱卡片 (PillarCard)
// ----------------------------------------------------------------------
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

  if (!pillar) return (
    <div className="h-56 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400">
        等待输入...
    </div>
  );

  return (
    <div className={`flex flex-col items-center bg-white rounded-xl shadow-sm border p-3 lg:p-4 transition-transform hover:-translate-y-1 duration-300 relative overflow-hidden group
        ${pillar.kongWang ? 'border-dashed border-slate-300 bg-slate-50/50' : 'border-slate-100'}
    `}>
      {pillar.kongWang && (
        <div className="absolute top-0 right-0 bg-slate-200 text-slate-500 text-[9px] px-1.5 py-0.5 rounded-bl">空亡</div>
      )}
      
      <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1">{title}</span>
      <span className="text-[9px] text-slate-400 mb-2 scale-90">{pillar.naYin}</span>

      {!isDayMaster && (
        <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded mb-1">
          {pillar.tenGodStem}
        </span>
      )}
      {isDayMaster && (
        <span className="text-[10px] text-white bg-indigo-500 px-1.5 py-0.5 rounded mb-1 shadow-sm">
          日主
        </span>
      )}

      <div className={`w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center rounded-full text-xl lg:text-2xl font-serif font-bold mb-2 border ${getElementColor(pillar.elementStem)}`}>
        {pillar.stem}
      </div>
      <div className={`w-14 h-14 lg:w-16 lg:h-16 flex items-center justify-center rounded-lg text-2xl lg:text-3xl font-serif font-bold mb-1 border ${getElementColor(pillar.elementBranch)}`}>
        {pillar.branch}
      </div>
      
      <span className="text-[10px] text-slate-400 mt-1">
        {pillar.zodiac} · {pillar.hiddenStems[0]}
      </span>

      <div className="mt-2 flex flex-wrap gap-1 justify-center min-h-[20px]">
        {pillar.shenSha.map(ss => (
            <span key={ss} className="text-[9px] text-pink-600 border border-pink-100 bg-pink-50 px-1 rounded">
                {ss}
            </span>
        ))}
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// 主应用组件 (App)
// ----------------------------------------------------------------------
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

  const handleAnalyze = async () => {
    setLoading(true);
    setAiLoading(true);
    setSidebarOpen(false); 
    setResult(null);
    setAiResult(null);

    // 1. 本地算法排盘
    let chart: BaziChart;
    try {
        const inputDate = new Date(`${date}T${time}`);
        chart = calculateBazi(inputDate, longitude);
        setResult(chart);
    } catch (error) {
        console.error("排盘失败:", error);
        alert("排盘出错了，请检查输入格式");
        setLoading(false);
        setAiLoading(false);
        return;
    }
    setLoading(false);

    // 2. AI 深度分析
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
      
      {/* Mobile Menu Button */}
      <button onClick={() => setSidebarOpen(true)} className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md text-slate-600">
        <Menu size={24} />
      </button>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-80 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out shadow-2xl
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:shadow-none
      `}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-indigo-500 p-2 rounded-lg">
              <Sparkles className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">命理实验室</h1>
              <span className="text-[10px] text-indigo-300 uppercase tracking-widest border border-indigo-700 px-1 rounded">AI Pro</span>
            </div>
          </div>

          <div className="space-y-6 flex-1 overflow-y-auto">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Calendar size={12}/> 出生日期
              </label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg py-2.5 px-3 focus:outline-none focus:border-indigo-500" />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Clock size={12}/> 出生时间
              </label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg py-2.5 px-3 focus:outline-none focus:border-indigo-500" />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Globe size={12}/> 出生地经度 (支持度分秒)
              </label>
              <input 
                  type="text" 
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="如: 103°45'34 或 103.76"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg py-2.5 px-3 focus:outline-none focus:border-indigo-500"
                />
              <p className="text-[10px] text-slate-500">支持格式：103.5 或 103°45'34"</p>
            </div>
          </div>

          <button onClick={handleAnalyze} disabled={loading || aiLoading}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 mt-4 hover:opacity-90 disabled:opacity-50">
            {loading ? <span>计算中...</span> : <>开始排盘 <ArrowRight size={18} /></>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 h-full overflow-y-auto relative">
        {!result && !loading && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <Bot size={40} className="text-slate-300" />
                </div>
                <h2 className="text-xl font-semibold text-slate-600 mb-2">AI 命理系统已就绪</h2>
                <p>请输入出生信息。Gemini AI 将为您生成命格原型与《穷通宝鉴》调候分析。</p>
             </div>
        )}

        {result && (
          <div className="max-w-6xl mx-auto p-6 lg:p-10 space-y-8 animate-fade-in">
            
            {/* Banner */}
            <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                <div>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded uppercase">Gemini AI Analysis</span>
                        <span className="text-slate-500 text-xs flex items-center gap-1"><MapPin size={12}/> {result.meta.trueSolarTime} 真太阳时</span>
                    </div>
                    
                    {/* AI 命格称呼 */}
                    <h1 className="text-3xl lg:text-5xl font-bold text-slate-800 font-serif mb-2 tracking-tight">
                        {aiResult ? aiResult.archetype : <span className="animate-pulse bg-slate-200 text-transparent rounded">正在生成命格...</span>}
                    </h1>
                    
                    {/* AI 总结 */}
                    <p className="text-slate-600 text-lg font-serif italic">
                        "{aiResult ? aiResult.summary : 'AI 正在阅读您的星盘...'}"
                    </p>
                </div>

                <div className="flex flex-col items-end justify-center min-w-[120px]">
                    <div className="text-xs font-semibold text-slate-400 uppercase">命局强弱</div>
                    <div className="text-2xl font-bold text-indigo-600">{result.strength}</div>
                    <div className="text-xs text-slate-400 mt-1">{result.seasonStatus}</div>
                </div>
            </div>

            {/* 四柱卡片 */}
            <div className="grid grid-cols-4 gap-2 md:gap-6">
                <PillarCard title="年柱" pillar={result.year} />
                <PillarCard title="月柱" pillar={result.month} />
                <PillarCard title="日柱" pillar={result.day} isDayMaster={true} />
                <PillarCard title="时柱" pillar={result.hour} />
            </div>

            {/* 详情与图表 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* 左侧图表 */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">五行能量</h3>
                        <FiveElementChart scores={result.fiveElementScore} />
                    </div>
                    
                    {/* 健康建议 (AI) */}
                    <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
                        <h3 className="text-emerald-800 font-bold flex items-center gap-2 mb-3">
                            <Activity size={18}/> 健康预警
                        </h3>
                        <p className="text-sm text-emerald-700 leading-relaxed">
                            {aiResult ? aiResult.healthAdvice : "AI 分析中..."}
                        </p>
                    </div>
                </div>

                {/* 右侧 Tab 内容 */}
                <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col min-h-[500px]">
                    <div className="flex border-b border-slate-100">
                        <button onClick={() => setActiveTab('energy')} className={`flex-1 py-4 text-sm font-medium ${activeTab==='energy'?'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50':'text-slate-500'}`}>
                            <Zap size={16} className="inline mr-2"/> 格局深度
                        </button>
                        <button onClick={() => setActiveTab('ancient')} className={`flex-1 py-4 text-sm font-medium ${activeTab==='ancient'?'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50':'text-slate-500'}`}>
                            <BookOpen size={16} className="inline mr-2"/> 穷通宝鉴 (AI版)
                        </button>
                        <button onClick={() => setActiveTab('career')} className={`flex-1 py-4 text-sm font-medium ${activeTab==='career'?'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50':'text-slate-500'}`}>
                            <Activity size={16} className="inline mr-2"/> 事业财运
                        </button>
                    </div>

                    <div className="p-8 flex-1">
                        {aiLoading ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                                <Bot size={40} className="animate-bounce text-indigo-300"/>
                                <p className="animate-pulse">Gemini 正在翻阅古籍...</p>
                            </div>
                        ) : (
                            <>
                                {activeTab === 'energy' && (
                                    <div className="space-y-6 animate-fade-in-up">
                                        <div>
                                            <h4 className="text-lg font-bold text-slate-800 mb-2">格局成败与强弱</h4>
                                            <p className="text-slate-600 leading-relaxed text-justify">
                                                {aiResult?.strengthAnalysis}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'ancient' && (
                                    <div className="space-y-6 animate-fade-in-up">
                                        <div className="p-6 bg-amber-50 border border-amber-100 rounded-xl">
                                            <h4 className="text-amber-900 font-bold mb-4 font-serif-sc text-lg border-b border-amber-200 pb-2">
                                                📜 调候用神
                                            </h4>
                                            <p className="text-amber-800 text-base leading-8 font-serif-sc">
                                                {aiResult?.bookAdvice}
                                            </p>
                                        </div>
                                        <p className="text-xs text-slate-400 italic">
                                            * 此内容由 AI 基于《穷通宝鉴》逻辑推演生成，解决了古籍缺漏的问题。
                                        </p>
                                    </div>
                                )}

                                {activeTab === 'career' && (
                                    <div className="space-y-6 animate-fade-in-up">
                                         <div>
                                            <h4 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                                                <Zap size={18} className="text-yellow-500"/> 事业方向
                                            </h4>
                                            <p className="text-slate-600 leading-relaxed text-justify">
                                                {aiResult?.careerAdvice}
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