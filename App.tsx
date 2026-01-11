import React, { useState } from 'react';
import { Calendar, Clock, Sparkles, Zap, Scroll, Bot, Menu, X, ArrowRight, MapPin, Globe } from 'lucide-react';
import { FiveElementChart } from './components/FiveElementChart';
import { calculateBazi, BaziChart, Pillar, ElementType, ELEMENT_CN_MAP } from './utils/baziLogic';

// ----------------------------------------------------------------------
// 子组件：单柱卡片 (PillarCard) - 专业版 (含神煞、纳音、空亡)
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
      
      {/* 纳音 */}
      <span className="text-[9px] text-slate-400 mb-2 scale-90">{pillar.naYin}</span>

      {/* 天干十神 */}
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

      {/* 天干 */}
      <div className={`w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center rounded-full text-xl lg:text-2xl font-serif font-bold mb-2 border ${getElementColor(pillar.elementStem)}`}>
        {pillar.stem}
      </div>
      
      {/* 地支 */}
      <div className={`w-14 h-14 lg:w-16 lg:h-16 flex items-center justify-center rounded-lg text-2xl lg:text-3xl font-serif font-bold mb-1 border ${getElementColor(pillar.elementBranch)}`}>
        {pillar.branch}
      </div>
      
      {/* 藏干主气 */}
      <span className="text-[10px] text-slate-400 mt-1">
        {pillar.zodiac} · {pillar.hiddenStems[0]}
      </span>

      {/* 神煞 (如果有) */}
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
  const [longitude, setLongitude] = useState<string>("120.0"); // 默认为北京时间经度
  const [result, setResult] = useState<BaziChart | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'energy' | 'ancient' | 'ai'>('energy');

  const handleAnalyze = () => {
    setLoading(true);
    setSidebarOpen(false); 
    
    setTimeout(() => {
        try {
            const inputDate = new Date(`${date}T${time}`);
            // Parse longitude safely
            let lng = parseFloat(longitude);
            if (isNaN(lng)) lng = 120.0;
            if (lng < -180) lng = -180;
            if (lng > 180) lng = 180;

            const chart = calculateBazi(inputDate, lng);
            setResult(chart);
        } catch (error) {
            console.error("排盘失败:", error);
            alert("排盘出错了，请检查输入信息");
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
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-500 p-2 rounded-lg">
                <Sparkles className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">命理实验室</h1>
                <span className="text-[10px] text-indigo-300 uppercase tracking-widest border border-indigo-700 px-1 rounded">Professional</span>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-6 flex-1 overflow-y-auto">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Calendar size={12}/> 出生日期 (公历)
              </label>
              <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Clock size={12}/> 出生时间
              </label>
              <input 
                  type="time" 
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Globe size={12}/> 出生地经度 (重要)
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.1"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="例如: 116.4 (北京)"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg py-2.5 pl-3 pr-10 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
                <span className="absolute right-3 top-3 text-slate-500 text-xs">°E</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                * 真太阳时校正基准。北京116.4，上海121.5，成都104.1，西安108.9。如果不确定，请保持120 (标准时间)。
              </p>
            </div>
          </div>

          <button 
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? (
                <span>排盘运算中...</span>
            ) : (
                <>
                    开始精准排盘 <ArrowRight size={18} />
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
                    <MapPin size={40} className="text-slate-300" />
                </div>
                <h2 className="text-xl font-semibold text-slate-600 mb-2">精准排盘系统</h2>
                <p className="max-w-md mx-auto">请输入出生地经度以获取真太阳时。我们的算法将自动校正时差，为您呈现最准确的四柱八字。</p>
             </div>
        )}

        {loading && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm z-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                <p className="text-indigo-600 font-medium animate-pulse">正在校正真太阳时...</p>
             </div>
        )}

        {result && (
          <div className="max-w-5xl mx-auto p-6 lg:p-10 space-y-8 animate-fade-in">
            
            {/* Header / Result Banner */}
            <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded uppercase">PRO Ver.</span>
                        <span className="flex items-center gap-1 text-slate-500 text-xs bg-slate-100 px-2 py-1 rounded">
                             <Clock size={10}/> 真太阳时: {result.meta.trueSolarTime}
                        </span>
                        <span className="text-slate-400 text-xs">
                             ({result.meta.location})
                        </span>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-slate-800 font-serif mb-1">
                        {result.archetype}
                    </h1>
                    <p className="text-slate-500 text-sm lg:text-base">
                      日元 <strong>{result.dayMaster}</strong> · 
                      月令状态：<span className="text-slate-700 font-medium">{result.seasonStatus}</span> · 
                      格局：<span className={result.strength === '身强' ? 'text-orange-600 font-bold' : 'text-blue-600 font-bold'}>{result.strength}</span>
                    </p>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-right">
                        <div className="text-xs font-semibold text-slate-400 uppercase">命局平衡分</div>
                        <div className="text-4xl font-bold text-indigo-600">
                            {result.destinyScore}<span className="text-lg text-slate-400 font-normal">分</span>
                        </div>
                    </div>
                    <div className={`h-12 w-12 rounded-full border-4 transform -rotate-45
                        ${result.destinyScore > 80 ? 'border-indigo-100 border-t-indigo-600' : 'border-orange-100 border-t-orange-500'}
                    `}></div>
                </div>
            </div>

            {/* Bazi Chart Grid (Real Data) */}
            <div className="grid grid-cols-4 gap-2 md:gap-6">
                <PillarCard title="年柱" pillar={result.year} />
                <PillarCard title="月柱" pillar={result.month} />
                <PillarCard title="日柱" pillar={result.day} isDayMaster={true} />
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
                            <Zap size={16} /> 能量与强弱
                        </button>
                        <button 
                            onClick={() => setActiveTab('ancient')}
                            className={`flex-1 py-4 px-6 text-sm font-medium flex items-center justify-center gap-2 transition-colors
                                ${activeTab === 'ancient' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}
                            `}
                        >
                            <Scroll size={16} /> 《穷通宝鉴》
                        </button>
                        <button 
                            onClick={() => setActiveTab('ai')}
                            className={`flex-1 py-4 px-6 text-sm font-medium flex items-center justify-center gap-2 transition-colors
                                ${activeTab === 'ai' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}
                            `}
                        >
                            <Bot size={16} /> AI 深度建议
                        </button>
                    </div>

                    <div className="p-6 md:p-8 flex-1 overflow-y-auto">
                        {activeTab === 'energy' && (
                            <div className="space-y-4 animate-fade-in-up">
                                <h4 className="text-lg font-bold text-slate-800">格局与喜忌 (Pro)</h4>
                                <p className="text-slate-600 leading-relaxed">
                                    日主 <span className="font-bold text-indigo-600">{result.dayMaster}</span> 生于 <strong>{result.month.zodiac}</strong> 月。
                                    <br/>
                                    <strong>季节状态：</strong>{result.seasonStatus}。
                                    <br/>
                                    <strong>系统判定：</strong><span className="font-bold underline decoration-indigo-300 decoration-2">{result.strength}</span>。
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
                                    <h4 className="text-amber-900 font-bold mb-2 font-serif-sc">📜 《穷通宝鉴》调候</h4>
                                    <p className="text-amber-800 text-sm leading-7 font-serif-sc">
                                        {result.bookAdvice}
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
                                        <h4 className="text-lg font-bold text-slate-800">综合命理建议</h4>
                                        <p className="text-slate-600 leading-relaxed mt-2">
                                            您是 <strong>{result.archetype}</strong> 原型。
                                        </p>
                                        <p className="text-slate-600 leading-relaxed mt-2">
                                            {result.strength === '身强' 
                                                ? '您属于身强之人，正如大树参天或江河奔腾。在事业上，您适合开创性的工作，不畏艰难（官杀制身）。由于自我意识较强，注意避免固执，多倾听他人建议。' 
                                                : '您属于身弱之人，如同温室花朵或涓涓细流，虽然柔和但韧性极佳。您善于适应环境，但容易感到压力。建议在事业上寻求团队合作（比劫）或长辈提携（印星）。'}
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