import React, { useState } from 'react';
import { Calendar, Clock, Sparkles, Zap, Scroll, Bot, Menu, X, ArrowRight } from 'lucide-react';
import { FiveElementChart } from './components/FiveElementChart';
import { calculateBazi, BaziChart, Pillar, ElementType, ELEMENT_CN_MAP } from './utils/baziLogic';

// ----------------------------------------------------------------------
// 子组件：单柱卡片 (PillarCard)
// ----------------------------------------------------------------------
const PillarCard = ({ title, pillar }: { title: string; pillar?: Pillar }) => {
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
    <div className="h-48 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400">
        等待输入...
    </div>
  );

  return (
    <div className="flex flex-col items-center bg-white rounded-xl shadow-sm border border-slate-100 p-4 transition-transform hover:-translate-y-1 duration-300">
      <span className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-3">{title}</span>
      
      {/* 天干 */}
      <div className={`w-12 h-12 flex items-center justify-center rounded-full text-2xl font-serif font-bold mb-2 border ${getElementColor(pillar.elementStem)}`}>
        {pillar.stem}
      </div>
      
      {/* 地支 */}
      <div className={`w-16 h-16 flex items-center justify-center rounded-lg text-3xl font-serif font-bold mb-1 border ${getElementColor(pillar.elementBranch)}`}>
        {pillar.branch}
      </div>
      
      <span className="text-xs text-slate-500 font-medium">
        [{pillar.zodiac}]
      </span>
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
  const [result, setResult] = useState<BaziChart | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'energy' | 'ancient' | 'ai'>('energy');

  const handleAnalyze = () => {
    setLoading(true);
    setSidebarOpen(false); 
    
    // 模拟一点点计算延迟，让用户感觉“正在用力思考”
    setTimeout(() => {
        try {
            const inputDate = new Date(`${date}T${time}`);
            const chart = calculateBazi(inputDate);
            setResult(chart);
        } catch (error) {
            console.error("排盘失败:", error);
            alert("排盘出错了，请检查日期是否正确");
        } finally {
            setLoading(false);
        }
    }, 600);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-800">
      
      {/* Mobile Menu Button */}
      <button 
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md text-slate-600"
      >
        <Menu size={24} />
      </button>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-80 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out shadow-2xl
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:shadow-none
      `}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-500 p-2 rounded-lg">
                <Sparkles className="text-white" size={20} />
              </div>
              <h1 className="text-xl font-bold tracking-tight">命理实验室</h1>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-6 flex-1">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">出生日期 (公历)</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 text-slate-500" size={18} />
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg py-2.5 pl-10 pr-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">出生时间</label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 text-slate-500" size={18} />
                <input 
                  type="time" 
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg py-2.5 pl-10 pr-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <button 
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
                <span>正在排盘...</span>
            ) : (
                <>
                    开始分析 <ArrowRight size={18} />
                </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 h-full overflow-y-auto overflow-x-hidden relative">
        {!result && !loading && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <Sparkles size={40} className="text-slate-300" />
                </div>
                <h2 className="text-xl font-semibold text-slate-600 mb-2">准备好探索你的命运了吗？</h2>
                <p>请在左侧输入您的出生信息以开始。</p>
             </div>
        )}

        {loading && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm z-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                <p className="text-indigo-600 font-medium animate-pulse">正在解析天干地支...</p>
             </div>
        )}

        {result && (
          <div className="max-w-5xl mx-auto p-6 lg:p-10 space-y-8 animate-fade-in">
            
            {/* Header / Result Banner */}
            <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded uppercase">AI 分析结果</span>
                        <span className="text-slate-400 text-xs">{date} {time}</span>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-slate-800 font-serif mb-1">
                        {result.archetype}
                    </h1>
                    <p className="text-slate-500">
                      日主 <strong>{result.dayMaster}</strong> ({ELEMENT_CN_MAP[result.dayMasterElement]}) · 
                      格局判定：<span className={result.strength === '身强' ? 'text-orange-600 font-bold' : 'text-blue-600 font-bold'}>{result.strength}</span>
                    </p>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-right">
                        <div className="text-xs font-semibold text-slate-400 uppercase">命局平衡分</div>
                        <div className="text-4xl font-bold text-indigo-600">
                            {result.destinyScore}<span className="text-lg text-slate-400 font-normal">分</span>
                        </div>
                    </div>
                    {/* 根据分数动态显示颜色环 */}
                    <div className={`h-12 w-12 rounded-full border-4 transform -rotate-45
                        ${result.destinyScore > 80 ? 'border-indigo-100 border-t-indigo-600' : 'border-orange-100 border-t-orange-500'}
                    `}></div>
                </div>
            </div>

            {/* Bazi Chart Grid (Real Data) */}
            <div className="grid grid-cols-4 gap-3 md:gap-6">
                <PillarCard title="年柱" pillar={result.year} />
                <PillarCard title="月柱" pillar={result.month} />
                <PillarCard title="日柱" pillar={result.day} />
                <PillarCard title="时柱" pillar={result.hour} />
            </div>

            {/* Main Analysis Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Visuals (Radar Chart) */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Zap size={20} className="text-amber-500" />
                        五行能量分布
                    </h3>
                    <div className="flex-1 flex items-center justify-center">
                        {/* 传入真实计算的五行分数 */}
                        <FiveElementChart scores={result.fiveElementScore} />
                    </div>
                    <div className="mt-4 text-center">
                        <p className="text-sm text-slate-500">
                            能量最强：<span className="font-bold text-indigo-600">{ELEMENT_CN_MAP[result.strongestElement]}</span>
                        </p>
                    </div>
                </div>

                {/* Tabs / Details */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden min-h-[400px]">
                    <div className="flex border-b border-slate-100">
                        <button 
                            onClick={() => setActiveTab('energy')}
                            className={`flex-1 py-4 px-6 text-sm font-medium flex items-center justify-center gap-2 transition-colors
                                ${activeTab === 'energy' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}
                            `}
                        >
                            <Zap size={16} /> 能量分析
                        </button>
                        <button 
                            onClick={() => setActiveTab('ancient')}
                            className={`flex-1 py-4 px-6 text-sm font-medium flex items-center justify-center gap-2 transition-colors
                                ${activeTab === 'ancient' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}
                            `}
                        >
                            <Scroll size={16} /> 古籍断语
                        </button>
                        <button 
                            onClick={() => setActiveTab('ai')}
                            className={`flex-1 py-4 px-6 text-sm font-medium flex items-center justify-center gap-2 transition-colors
                                ${activeTab === 'ai' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}
                            `}
                        >
                            <Bot size={16} /> AI 建议
                        </button>
                    </div>

                    <div className="p-6 md:p-8 flex-1 overflow-y-auto">
                        {activeTab === 'energy' && (
                            <div className="space-y-4 animate-fade-in-up">
                                <h4 className="text-lg font-bold text-slate-800">五行强弱分析</h4>
                                <p className="text-slate-600 leading-relaxed">
                                    此命局日元为 <span className="font-bold text-indigo-600">{result.dayMaster}</span> ({ELEMENT_CN_MAP[result.dayMasterElement]})，
                                    生于 <strong>{result.month.zodiac}</strong> 月。
                                    系统判定为：<span className="font-bold underline decoration-indigo-300 decoration-2">{result.strength}</span>。
                                </p>
                                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100 mt-4">
                                    <h5 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                                        <Sparkles size={16} /> 喜用神建议
                                    </h5>
                                    <p className="text-sm text-indigo-800 leading-relaxed">
                                        {result.favorable}
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'ancient' && (
                            <div className="space-y-4 animate-fade-in-up">
                                <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg">
                                    <h4 className="text-amber-900 font-bold mb-2">💡 提示</h4>
                                    <p className="text-amber-800 text-sm">
                                        古籍断语功能（《穷通宝鉴》与《三命通会》）需要连接完整的文本数据库。
                                        目前处于 <strong>MVP 阶段</strong>，此处为静态占位符。
                                        <br/><br/>
                                        下一步我们将把 <code>yue.py</code> 和 <code>sizi.py</code> 中的数万字古籍数据导入此处。
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'ai' && (
                            <div className="space-y-4 animate-fade-in-up">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600 mt-1">
                                        <Bot size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-slate-800">AI 命理师的建议</h4>
                                        <p className="text-slate-600 leading-relaxed mt-2">
                                            您的命格原型是 <strong>{result.archetype}</strong>。
                                        </p>
                                        <p className="text-slate-600 leading-relaxed mt-2">
                                            {result.strength === '身强' 
                                                ? '作为身强之人，您精力充沛，具有很强的执行力。但也容易流于刚愎自用。建议多倾听他人意见，并将过剩的精力投入到富有挑战性的事业或创作中（食伤泄秀）。' 
                                                : '作为身弱之人，您心思细腻，善于配合。但也容易感到精力不足或缺乏安全感。建议多依靠团队力量，寻求长辈或导师的支持（印星生身），避免单打独斗。'}
                                        </p>
                                    </div>
                                </div>
                            </div>
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