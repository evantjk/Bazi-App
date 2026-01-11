import React, { useState } from 'react';
import { Calendar, Clock, Sparkles, Zap, Scroll, Bot, Menu, X, ArrowRight } from 'lucide-react';
import { FiveElementChart } from './components/FiveElementChart';
import { calculateBazi, BaziChart, Pillar } from './utils/baziLogic';

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
    
    // Simulate calculation delay for effect
    setTimeout(() => {
        const inputDate = new Date(`${date}T${time}`);
        const chart = calculateBazi(inputDate);
        setResult(chart);
        setLoading(false);
    }, 800);
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
                    <h1 className="text-3xl lg:text-4xl font-bold text-slate-800 font-serif-sc mb-1">
                        🦁 称号：破局的创新者
                    </h1>
                    <p className="text-slate-500">命带魁罡，刚毅果决，适合开创性事业。</p>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-right">
                        <div className="text-xs font-semibold text-slate-400 uppercase">综合评分</div>
                        <div className="text-4xl font-bold text-indigo-600">88<span className="text-lg text-slate-400 font-normal">分</span></div>
                    </div>
                    <div className="h-12 w-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 transform -rotate-45"></div>
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
                        <FiveElementChart />
                    </div>
                    <div className="mt-4 text-center">
                        <p className="text-sm text-slate-500">
                            <span className="font-bold text-emerald-600">木</span> 气最旺，
                            <span className="font-bold text-blue-600">水</span> 气偏弱。
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
                                    此命局日元为<span className="font-bold text-emerald-600">甲木</span>，生于寅月，得令而旺。
                                    天干透出比肩，地支有根。整体能量场偏强，具有极强的生命力和向上生长的欲望。
                                </p>
                                <p className="text-slate-600 leading-relaxed">
                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
                                    Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                                </p>
                                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 mt-4">
                                    <h5 className="font-semibold text-slate-700 mb-2">喜用神建议</h5>
                                    <p className="text-sm text-slate-500">
                                        建议以<span className="font-bold text-red-500">火</span>（食伤）泄秀，或以<span className="font-bold text-yellow-600">金</span>（官杀）修剪枝叶。
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'ancient' && (
                            <div className="space-y-4 animate-fade-in-up">
                                <h4 className="text-lg font-bold text-slate-800 font-serif-sc">《三命通会》摘录</h4>
                                <blockquote className="pl-4 border-l-4 border-indigo-200 italic text-slate-600 bg-slate-50 py-2 pr-2 rounded-r">
                                    "甲木参天，脱胎要火。春不容金，秋不容土。火炽乘龙，水荡骑虎。地润天和，植立千古。"
                                </blockquote>
                                <p className="text-slate-600 leading-relaxed mt-4">
                                    此段古文说明了甲木的性质。Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
                                    Excepteur sint occaecat cupidatat non proident.
                                </p>
                                <h4 className="text-lg font-bold text-slate-800 font-serif-sc mt-6">《穷通宝鉴》调候</h4>
                                <p className="text-slate-600 leading-relaxed">
                                    寅月甲木，初春尚寒，先用丙火温暖，次用癸水滋润。
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
                                        <h4 className="text-lg font-bold text-slate-800">现代职业发展建议</h4>
                                        <p className="text-slate-600 leading-relaxed mt-2">
                                            基于您的五行结构，您具备很强的独立思考能力和领导潜质。适合从事需要开创性、规划性和仁慈之心的行业。
                                        </p>
                                        <ul className="mt-4 space-y-2 text-slate-600 list-disc list-inside">
                                            <li><strong className="text-slate-800">推荐行业：</strong> 教育培训、园林设计、木材家具、文化出版。</li>
                                            <li><strong className="text-slate-800">职场风格：</strong> 直率坦诚，不喜欢拐弯抹角，容易成为团队的精神领袖。</li>
                                            <li><strong className="text-slate-800">注意事项：</strong> 容易固执己见，建议多听取他人意见，保持柔韧性。</li>
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