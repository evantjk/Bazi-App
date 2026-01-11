import React, { useState } from 'react';
import { Calendar, Clock, Sparkles, Zap, Scroll, Bot, Menu, X, ArrowRight } from 'lucide-react';
import { FiveElementChart } from './components/FiveElementChart';
import { calculateBazi, BaziChart, Pillar, ELEMENT_CN_MAP } from './utils/baziLogic';

const PillarCard = ({ title, pillar }: { title: string; pillar?: Pillar }) => {
  const getElementColor = (type: string | undefined) => {
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
        Waiting...
    </div>
  );

  return (
    <div className="flex flex-col items-center bg-white rounded-xl shadow-sm border border-slate-100 p-4 transition-transform hover:-translate-y-1 duration-300">
      <span className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-3">{title}</span>
      
      {/* Heavenly Stem */}
      <div className={`w-12 h-12 flex items-center justify-center rounded-full text-2xl font-serif-sc font-bold mb-2 border ${getElementColor(pillar.elementStem)}`}>
        {pillar.stem}
      </div>
      
      {/* Earthly Branch */}
      <div className={`w-16 h-16 flex items-center justify-center rounded-lg text-3xl font-serif-sc font-bold mb-1 border ${getElementColor(pillar.elementBranch)}`}>
        {pillar.branch}
      </div>
      
      <span className="text-xs text-slate-500 font-medium">
        [{pillar.zodiac}]
      </span>
    </div>
  );
};

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>("12:00");
  const [result, setResult] = useState<BaziChart | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'energy' | 'ancient' | 'ai'>('energy');

  const handleAnalyze = () => {
    setLoading(true);
    setSidebarOpen(false); // Close sidebar on mobile
    
    // Simulate calculation delay for effect (UI UX)
    setTimeout(() => {
        try {
            const inputDate = new Date(`${date}T${time}`);
            const chart = calculateBazi(inputDate);
            setResult(chart);
        } catch (error) {
            console.error("Analysis Failed:", error);
            alert("日期格式有误或排盘失败，请重试。");
        }
        setLoading(false);
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
                <p className="text-indigo-600 font-medium animate-pulse">正在精密计算真太阳时与节气...</p>
             </div>
        )}

        {result && (
          <div className="max-w-5xl mx-auto p-6 lg:p-10 space-y-8 animate-fade-in">
            
            {/* Header / Result Banner */}
            <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded uppercase">AI Beta 版</span>
                        <span className="text-slate-400 text-xs">{date} {time}</span>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-slate-800 font-serif-sc mb-1">
                        {result.archetype}
                    </h1>
                    <p className="text-slate-500">
                        日主 <strong>{result.dayMaster}</strong> ({ELEMENT_CN_MAP[result.dayMasterElement]}) 
                        <span className="mx-2 text-slate-300">|</span> 
                        格局判断：{result.strength}
                    </p>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-right">
                        <div className="text-xs font-semibold text-slate-400 uppercase">命局平衡分</div>
                        <div className="text-4xl font-bold text-indigo-600">
                            {result.destinyScore}
                            <span className="text-lg text-slate-400 font-normal">分</span>
                        </div>
                    </div>
                    {/* Visual Ring for Score - Dynamic Color based on score */}
                    <div className={`h-12 w-12 rounded-full border-4 border-t-transparent transform -rotate-45
                        ${result.destinyScore > 80 ? 'border-emerald-500' : result.destinyScore > 60 ? 'border-indigo-500' : 'border-amber-500'}
                    `}></div>
                </div>
            </div>

            {/* Bazi Chart Grid */}
            <div className="grid grid-cols-4 gap-3 md:gap-6">
                <PillarCard title="年柱 (Root)" pillar={result.year} />
                <PillarCard title="月柱 (Shoot)" pillar={result.month} />
                <PillarCard title="日柱 (Flower)" pillar={result.day} />
                <PillarCard title="时柱 (Fruit)" pillar={result.hour} />
            </div>

            {/* Main Analysis Section: Grid with Visuals + Tabs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Visuals (Radar) */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Zap size={20} className="text-amber-500" />
                        五行能量分布
                    </h3>
                    <div className="flex-1 flex items-center justify-center">
                        <FiveElementChart scores={result.fiveElementScore} />
                    </div>
                    <div className="mt-4 text-center">
                        <p className="text-sm text-slate-500">
                            能量最强为 <span className="font-bold text-indigo-600">{ELEMENT_CN_MAP[result.strongestElement]}</span>，
                            日主能量 <span className={`font-bold ${result.strength === '身强' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {result.strength}
                            </span>。
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
                                    您的日主为<span className="font-bold text-indigo-600">{result.dayMaster}（{ELEMENT_CN_MAP[result.dayMasterElement]}）</span>。
                                    根据排盘结果，您的命局被判定为
                                    <span className="font-bold bg-slate-100 px-1 mx-1 rounded">{result.strength}</span>。
                                </p>
                                <p className="text-slate-600 leading-relaxed">
                                    命局中 <span className="font-bold">{ELEMENT_CN_MAP[result.strongestElement]}</span> 能量最为突出，这通常代表了您的显性性格特质或社会行为模式。
                                    {result.destinyScore > 80 ? '五行流通较为顺畅，一生波折较少。' : '五行分布有一定偏颇，需要后天补救以达到平衡。'}
                                </p>
                                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 mt-4">
                                    <h5 className="font-semibold text-slate-700 mb-2">⚖️ 用神建议</h5>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        {result.favorable}
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'ancient' && (
                            <div className="space-y-4 animate-fade-in-up">
                                <h4 className="text-lg font-bold text-slate-800 font-serif-sc">日主论命</h4>
                                <blockquote className="pl-4 border-l-4 border-indigo-200 italic text-slate-600 bg-slate-50 py-2 pr-2 rounded-r">
                                    {result.dayMaster === '甲' && "甲木参天，脱胎要火。春不容金，秋不容土。"}
                                    {result.dayMaster === '乙' && "乙木虽柔，刲羊解牛。怀丁抱丙，跨凤乘猴。"}
                                    {result.dayMaster === '丙' && "丙火猛烈，欺霜侮雪。能煅庚金，逢辛反怯。"}
                                    {result.dayMaster === '丁' && "丁火柔中，内性昭融。抱乙而孝，合壬而忠。"}
                                    {result.dayMaster === '戊' && "戊土固重，既中且正。静翕动辟，万物司命。"}
                                    {result.dayMaster === '己' && "己土卑湿，中正蓄藏。不愁木盛，不畏水狂。"}
                                    {result.dayMaster === '庚' && "庚金带煞，刚健为最。得水而清，得火而锐。"}
                                    {result.dayMaster === '辛' && "辛金软弱，温润而清。畏土之叠，乐水之盈。"}
                                    {result.dayMaster === '壬' && "壬水通河，能泄金气。刚中之德，周流不滞。"}
                                    {result.dayMaster === '癸' && "癸水至弱，达于天津。得龙而运，功化斯神。"}
                                </blockquote>
                                <p className="text-slate-600 leading-relaxed mt-4">
                                    （以上摘自《滴天髓》总论，描述了日主的基本心性与喜忌。）
                                </p>
                            </div>
                        )}

                        {activeTab === 'ai' && (
                            <div className="space-y-4 animate-fade-in-up">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600 mt-1">
                                        <Bot size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-slate-800">Beta 版智能建议</h4>
                                        <p className="text-slate-600 leading-relaxed mt-2">
                                            基于 <strong className="text-indigo-600">{result.strength}</strong> 的格局，结合最强的 <strong className="text-indigo-600">{ELEMENT_CN_MAP[result.strongestElement]}</strong> 能量：
                                        </p>
                                        <ul className="mt-4 space-y-2 text-slate-600 list-disc list-inside">
                                            {result.strength === '身弱' ? (
                                                <>
                                                    <li><strong className="text-slate-800">自我提升：</strong> 你需要更多的自信和支持。建议多学习、深造，通过知识（印星）来武装自己。</li>
                                                    <li><strong className="text-slate-800">社交策略：</strong> 寻找志同道合的伙伴（比劫）合作，避免单打独斗。</li>
                                                </>
                                            ) : (
                                                <>
                                                    <li><strong className="text-slate-800">事业突破：</strong> 你精力充沛，适合通过输出才华（食伤）或追求实际成果（财官）来消耗过剩的精力。</li>
                                                    <li><strong className="text-slate-800">行事风格：</strong> 建议学会收敛锋芒，多倾听他人意见，避免过于强势。</li>
                                                </>
                                            )}
                                            <li className="mt-2 text-sm text-slate-500 bg-slate-50 p-2 rounded">
                                                💡 提示：详细的职业与运势分析功能将在 Beta 2.0 版本中上线。
                                            </li>
                                        </ul>
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