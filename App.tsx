import React, { useState } from 'react';
import { 
  Sparkles, Bot, Menu, MapPin, User, Award, Smile, Baby, Search, 
  Compass, CheckCircle, AlertTriangle, XCircle, Star, Activity, Zap 
} from 'lucide-react';
import { FiveElementChart } from './components/FiveElementChart';
import { calculateBazi, BaziChart, Pillar, ElementType, Gender } from './utils/baziLogic';
import { calculateQimen, QUESTION_TYPES, QimenType, QimenResult } from './utils/qimenLogic';
import { calculateZiwei, ZiweiChart } from './utils/ziweiLogic'; 
import { 
  analyzeBaziWithAI, 
  analyzeQimenWithAI, 
  analyzeZiweiWithAI, 
  AIAnalysisResult, 
  QimenAIResult, 
  ZiweiAIResult 
} from './utils/geminiService';

// --- 安全文本组件 ---
// 允许长文本换行显示，增加 whitespace-pre-wrap
const SafeText = ({ content }: { content: any }) => {
  if (!content) return null;
  if (typeof content === 'string') {
      return <span className="whitespace-pre-wrap">{content}</span>;
  }
  return <span className="text-red-400 text-xs">...</span>;
};

// --- 八字柱组件 ---
const PillarCard = ({ title, pillar, isDayMaster }: any) => {
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

  if (!pillar) {
      return (
        <div className="h-56 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400">
            等待排盘...
        </div>
      );
  }

  return (
    <div className={`flex flex-col items-center bg-white rounded-xl shadow-sm border p-3 lg:p-4 relative overflow-hidden ${pillar.kongWang ? 'border-dashed border-slate-300 bg-slate-50/50' : 'border-slate-100'}`}>
      {pillar.kongWang && (
          <div className="absolute top-0 right-0 bg-slate-200 text-slate-500 text-[9px] px-1.5 py-0.5 rounded-bl">
              空亡
          </div>
      )}
      <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">{title}</span>
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
      
      <div className={`w-10 h-10 flex items-center justify-center rounded-full text-xl font-serif font-bold mb-2 border ${getElementColor(pillar.elementStem)}`}>
          {pillar.stem}
      </div>
      
      <div className={`w-14 h-14 flex items-center justify-center rounded-lg text-2xl font-serif font-bold mb-1 border ${getElementColor(pillar.elementBranch)}`}>
          {pillar.branch}
      </div>
      
      <span className="text-[10px] text-slate-400 mt-1">
          {pillar.zodiac} · {pillar.hiddenStems[0]}
      </span>
    </div>
  );
};

// --- Tab 名称映射 ---
const TAB_NAMES: Record<string, string> = {
  energy: '格局能量',
  ziwei: '紫微斗数', 
  luck: '流年运势',
  numerology: '灵数解析',
  career: '事业发展',
  ancient: '古籍经典',
  qimen: '奇门决策'
};

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // --- 设置 ---
  const [useProModel, setUseProModel] = useState(false); // ⚡️ Pro 模式开关

  // --- 输入状态 ---
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>("12:00");
  const [longitude, setLongitude] = useState<string>("120");
  const [gender, setGender] = useState<Gender>('male');
  const [citySearch, setCitySearch] = useState("");
  const [isSearchingCity, setIsSearchingCity] = useState(false);

  // --- 计算结果状态 ---
  const [result, setResult] = useState<BaziChart | null>(null);
  const [ziweiResult, setZiweiResult] = useState<ZiweiChart | null>(null);
  const [qimenResult, setQimenResult] = useState<QimenResult | null>(null);
  
  // --- AI 结果状态 ---
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [ziweiAI, setZiweiAI] = useState<ZiweiAIResult | null>(null);
  const [qimenAI, setQimenAI] = useState<QimenAIResult | null>(null);
  
  // --- UI 交互状态 ---
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [qimenLoading, setQimenLoading] = useState(false);
  const [qimenType, setQimenType] = useState<QimenType>('career');
  const [qimenContext, setQimenContext] = useState("");
  const [activeTab, setActiveTab] = useState('energy');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isTranslated, setIsTranslated] = useState(false);

  // --- 城市定位功能 ---
  const handleCitySearch = async () => {
    if(!citySearch) return;
    setIsSearchingCity(true);
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(citySearch)}`);
        const data = await response.json();
        if(data && data.length > 0) {
            setLongitude(parseFloat(data[0].lon).toFixed(4));
            alert(`已定位到 ${data[0].display_name.split(',')[0]}`);
        } else { 
            alert("未找到该城市"); 
        }
    } catch(e) { 
        alert("定位服务连接失败"); 
    } finally { 
        setIsSearchingCity(false); 
    }
  };

  // --- 核心分析逻辑 (八字 + 紫微) ---
  const handleAnalyze = async () => {
    setLoading(true); 
    setSidebarOpen(false); 
    setErrorMsg(null);
    setAiResult(null); 
    setZiweiAI(null); // 清空旧数据
    
    try {
        const inputDate = new Date(`${date}T${time}`);
        
        // 1. 本地计算八字
        const baziObj = calculateBazi(inputDate, longitude, gender);
        setResult(baziObj);
        
        // 2. 本地计算紫微
        const ziweiObj = calculateZiwei(inputDate);
        setZiweiResult(ziweiObj);

        setLoading(false); // 本地计算极快，先结束 Loading 显示结果
        setAiLoading(true); // 开始 AI Loading

        // 3. 并行请求 AI 分析 (传入 useProModel)
        Promise.all([
            analyzeBaziWithAI(baziObj, 2026, useProModel).then(setAiResult),
            analyzeZiweiWithAI(ziweiObj, useProModel).then(setZiweiAI)
        ]).catch(e => {
            console.error("AI Error:", e);
            setErrorMsg(e.message || "AI 服务繁忙，请稍后重试");
        }).finally(() => {
            setAiLoading(false);
        });

    } catch (error) { 
        alert("计算出错，请检查输入格式"); 
        setLoading(false);
    } 
  };

  // --- 奇门分析逻辑 ---
  const handleQimenAnalyze = async () => {
    setQimenLoading(true);
    setQimenAI(null);
    
    // 1. 本地起局
    const qResult = calculateQimen(qimenType, new Date());
    setQimenResult(qResult);
    
    // 2. AI 解读 (传入 useProModel)
    try {
        const aiData = await analyzeQimenWithAI(qimenType, qimenContext, qResult, useProModel);
        setQimenAI(aiData);
    } catch(e) { 
        console.error(e); 
    }
    
    setQimenLoading(false);
    setActiveTab('qimen'); 
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-800">
      
      {/* 移动端菜单按钮 */}
      <button onClick={() => setSidebarOpen(true)} className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md"><Menu size={24} /></button>
      
      {/* 侧边栏 Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-80 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out shadow-2xl ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static`}>
        <div className="h-full flex flex-col p-6 overflow-y-auto">
          
          {/* Logo */}
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-indigo-500 p-2 rounded-lg"><Sparkles className="text-white" size={20} /></div>
            <div><h1 className="text-xl font-bold">命理实验室</h1><span className="text-[10px] border border-indigo-700 px-1 rounded">专业版</span></div>
          </div>

          {/* ⚡️ Gemini 3 Pro 模式开关 */}
          <div 
            onClick={() => setUseProModel(!useProModel)}
            className={`cursor-pointer mb-6 p-3 rounded-xl border flex items-center justify-between transition-all ${useProModel ? 'bg-gradient-to-r from-amber-600 to-amber-700 border-amber-500 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'}`}
          >
            <div className="flex items-center gap-2">
                <Zap size={18} className={useProModel ? 'fill-white' : ''}/>
                <span className="font-bold text-sm">Gemini 3 Pro</span>
            </div>
            <div className={`w-8 h-4 rounded-full relative transition-colors ${useProModel ? 'bg-white/30' : 'bg-slate-600'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm absolute top-0 transition-all ${useProModel ? 'right-0' : 'left-0'}`}></div>
            </div>
          </div>

          <div className="space-y-6">
             {/* 性别 */}
             <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase">性别</label>
                <div className="flex bg-slate-800 rounded-lg p-1">
                    <button onClick={() => setGender('male')} className={`flex-1 py-1.5 rounded ${gender==='male'?'bg-indigo-600':''}`}>男</button>
                    <button onClick={() => setGender('female')} className={`flex-1 py-1.5 rounded ${gender==='female'?'bg-pink-600':''}`}>女</button>
                </div>
             </div>

             {/* 城市搜索 */}
             <div className="flex gap-2">
                <input type="text" value={citySearch} onChange={(e) => setCitySearch(e.target.value)} placeholder="如 上海" className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-sm text-white" />
                <button onClick={handleCitySearch} disabled={isSearchingCity} className="bg-indigo-600 text-white p-2 rounded-lg">{isSearchingCity ? '...' : <Search size={16}/>}</button>
             </div>

             {/* 详细输入 */}
             <input type="text" value={longitude} onChange={e=>setLongitude(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2" placeholder="经度"/>
             <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2"/>
             <input type="time" value={time} onChange={e=>setTime(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white rounded p-2"/>
             
             {/* 排盘按钮 */}
             <button onClick={handleAnalyze} disabled={loading} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-indigo-500 disabled:opacity-50">
                {loading ? '排盘中...' : '全面排盘 (八字+紫微)'}
             </button>

             {/* 奇门板块 */}
             <div className="pt-6 border-t border-slate-700 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><Compass size={12}/> 奇门决策</h3>
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
      <div className="flex-1 h-full overflow-y-auto p-6 bg-slate-50">
        
        {/* 空状态 */}
        {!result && !qimenResult && (
             <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Bot size={48} className="mb-4 opacity-20"/>
                <p>请输入信息开始排盘</p>
             </div>
        )}

        {/* 错误提示 */}
        {errorMsg && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 flex items-center gap-2">
                <XCircle size={20}/> 
                <div>
                    <p className="font-bold">分析提示</p>
                    <p className="text-sm">{errorMsg}</p>
                </div>
            </div>
        )}

        {result && (
            <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
                
                {/* 头部：命格摘要 */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2"><MapPin size={14} className="text-slate-400"/> <span className="text-sm text-slate-500">{result.meta.trueSolarTime}</span></div>
                        <h1 className="text-3xl font-bold text-slate-800 mb-1">
                            <SafeText content={aiResult?.archetype || (aiLoading ? "AI思考中..." : "等待分析")} />
                        </h1>
                        <p className="text-slate-500 italic"><SafeText content={aiResult?.summary} /></p>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-indigo-600">{result.destinyScore}</div>
                        <div className="text-xs text-slate-400">评分</div>
                    </div>
                </div>

                {/* 八字四柱展示 */}
                <div className="grid grid-cols-4 gap-2">
                    <PillarCard title="年" pillar={result.year} />
                    <PillarCard title="月" pillar={result.month} />
                    <PillarCard title="日" pillar={result.day} isDayMaster />
                    <PillarCard title="时" pillar={result.hour} />
                </div>

                {/* Tab 导航栏 */}
                <div className="flex bg-white rounded-xl shadow-sm p-1 overflow-x-auto">
                    {['energy', 'ziwei', 'luck', 'numerology', 'career', 'ancient', 'qimen'].map(t => (
                        <button key={t} onClick={()=>setActiveTab(t)} className={`flex-1 py-3 text-sm font-bold whitespace-nowrap px-4 ${activeTab===t?'text-indigo-600 bg-indigo-50 rounded-lg':'text-slate-400'}`}>
                            {TAB_NAMES[t]}
                        </button>
                    ))}
                </div>

                {/* Tab 内容展示区 */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 min-h-[400px]">
                    
                    {/* 1. 格局能量 */}
                    {activeTab === 'energy' && (
                        <div className="space-y-6">
                            <FiveElementChart scores={result.fiveElementScore} />
                            
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                <h4 className="font-bold text-slate-800 mb-3 text-lg flex items-center gap-2"><Award size={20}/> 格局深度解析</h4>
                                <p className="text-slate-700 leading-relaxed text-justify whitespace-pre-wrap"><SafeText content={aiResult?.strengthAnalysis}/></p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-4 rounded-xl">
                                    <h4 className="font-bold mb-2 flex items-center gap-2"><Smile size={16}/> 容貌</h4>
                                    <p className="text-sm text-slate-600"><SafeText content={aiResult?.appearanceAnalysis}/></p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl">
                                    <h4 className="font-bold mb-2 flex items-center gap-2"><User size={16}/> 名人</h4>
                                    <ul className="space-y-2">
                                        {aiResult?.historicalFigures?.map((h, i) => (
                                            <li key={i} className="text-sm flex justify-between"><span className="font-bold">{h.name}</span><span className="text-xs text-indigo-500">{h.similarity}</span></li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            <div className="bg-emerald-50 p-4 rounded-xl text-emerald-800 text-sm">
                                <h4 className="font-bold mb-1">健康建议</h4>
                                <SafeText content={aiResult?.healthAdvice} />
                            </div>
                        </div>
                    )}

                    {/* 2. 紫微斗数 (新功能) */}
                    {activeTab === 'ziwei' && ziweiResult && (
                        <div className="space-y-6">
                            <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100">
                                <h3 className="text-purple-900 font-bold mb-4 flex items-center gap-2"><Star size={18}/> 紫微深度解读</h3>
                                {ziweiAI ? (
                                    <div className="space-y-4 text-sm text-purple-800">
                                        <div className="font-bold text-lg">{ziweiAI.pattern}</div>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="bg-white/60 p-3 rounded"><strong>命宫：</strong>{ziweiAI.lifeAnalysis}</div>
                                            <div className="bg-white/60 p-3 rounded"><strong>事业：</strong>{ziweiAI.careerAnalysis}</div>
                                            <div className="bg-white/60 p-3 rounded"><strong>财运：</strong>{ziweiAI.wealthAnalysis}</div>
                                            <div className="bg-white/60 p-3 rounded"><strong>感情：</strong>{ziweiAI.loveAnalysis}</div>
                                        </div>
                                    </div>
                                ) : <div className="animate-pulse text-purple-400">AI 正在推演星盘...</div>}
                            </div>
                            {/* 12 宫格布局 */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-100 p-2 rounded-xl">
                                {ziweiResult.palaces.map((p) => (
                                    <div key={p.index} className={`bg-white p-2 min-h-[120px] rounded relative flex flex-col justify-between ${p.index===ziweiResult.lifePalaceIndex ? 'ring-2 ring-purple-500' : ''}`}>
                                        <div className="flex justify-between"><span className="text-xs font-bold bg-slate-100 px-1 rounded">{p.name}</span><span className="text-[10px] text-slate-400">{p.earthlyBranch}</span></div>
                                        <div className="text-center text-red-600 font-bold text-sm my-1">
                                            {p.majorStars.length > 0 ? 
                                                p.majorStars.map(s => <span key={s.name} className="block">{s.name}</span>) :
                                                <span className="text-[10px] text-slate-300">无主星</span>
                                            }
                                        </div>
                                        <div className="flex justify-between text-[10px] text-slate-400 border-t pt-1 border-slate-50">
                                            <span>{p.decades}</span><span>{p.heavenlyStem}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 3. 流年运势 */}
                    {activeTab === 'luck' && (
                        <div className="space-y-4">
                            <h4 className="font-bold text-indigo-900">2026 流年运势</h4>
                            <p className="text-sm leading-loose text-indigo-800 whitespace-pre-wrap"><SafeText content={aiResult?.annualLuckAnalysis}/></p>
                        </div>
                    )}

                    {/* 4. 灵数解析 */}
                    {activeTab === 'numerology' && (
                        <div className="flex gap-8">
                            <div className="grid grid-cols-3 gap-1 w-32 h-32 bg-slate-100 p-1 rounded flex-shrink-0">
                                {[4,9,2,3,5,7,8,1,6].map(n => (
                                    <div key={n} className={`flex items-center justify-center rounded ${result.lingShu?.grid[n] ? 'bg-indigo-500 text-white' : 'text-slate-300'}`}>{n}</div>
                                ))}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold mb-2">命数: {result.lingShu?.lifePathNumber}</h4>
                                <p className="text-sm text-slate-600 leading-relaxed"><SafeText content={aiResult?.numerologyAnalysis}/></p>
                            </div>
                        </div>
                    )}

                    {/* 5. 古籍经典 */}
                    {activeTab === 'ancient' && (
                        <div className="space-y-4">
                            <div className="flex justify-between border-b pb-2 items-center">
                                <h4 className="font-bold text-amber-800">📜 穷通宝鉴</h4>
                                <button onClick={()=>setIsTranslated(!isTranslated)} className="text-xs bg-amber-100 px-3 py-1 rounded-full text-amber-800 hover:bg-amber-200 transition">
                                    {isTranslated?"查看原文":"查看白话"}
                                </button>
                            </div>
                            <div className="bg-amber-50 p-4 rounded-xl min-h-[100px]">
                                <p className="text-amber-900 text-sm leading-8"><SafeText content={isTranslated ? aiResult?.bookAdviceTranslation : aiResult?.bookAdvice}/></p>
                            </div>
                        </div>
                    )}

                    {/* 6. 事业发展 */}
                    {activeTab === 'career' && (
                        <div className="space-y-4">
                            <h4 className="font-bold text-slate-700">事业建议</h4>
                            <p className="text-sm leading-loose text-justify"><SafeText content={aiResult?.careerAdvice}/></p>
                        </div>
                    )}

                    {/* 7. 奇门决策 */}
                    {activeTab === 'qimen' && (
                        <div className="text-center py-10">
                            {qimenResult ? (
                                <div className={`rounded-xl p-6 border-2 text-left ${qimenResult.signal==='green'?'bg-emerald-50 border-emerald-200':qimenResult.signal==='yellow'?'bg-amber-50 border-amber-200':'bg-red-50 border-red-200'}`}>
                                    <h3 className="text-2xl font-bold mb-2">{qimenResult.signal==='green'?'🟢 可行动':qimenResult.signal==='yellow'?'🟡 需观察':'🔴 不建议'}</h3>
                                    <p className="opacity-80 mb-4">{qimenResult.summary}</p>
                                    <div className="bg-white/60 p-4 rounded-lg text-sm">
                                        <p className="font-bold mb-1">建议：</p><p className="mb-2"><SafeText content={qimenAI?.actionAdvice}/></p>
                                        <p className="font-bold mb-1">风险：</p><p><SafeText content={qimenAI?.riskAlert}/></p>
                                    </div>
                                </div>
                            ) : <p className="text-slate-400">请在左侧使用奇门决策</p>}
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
}