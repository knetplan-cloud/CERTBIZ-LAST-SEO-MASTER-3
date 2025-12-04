
import React, { useState, useEffect } from 'react';
import { Settings, PenTool, Layout, Layers, Monitor, Wand2, ArrowLeft, Users, PlusSquare, AlertTriangle, Scale, Hash, Type, FileText, Target, CheckCircle2, Zap, Sliders, Sparkles } from 'lucide-react';
import { ContentConfig, ContentType, ContentPlatform, ParagraphCount, ToneType, DesignConcept, TargetPersona, ContentAddon } from '../types';

interface ContentConfiguratorProps {
  initialTopic?: string;
  initialKeywords?: string[];
  onBack?: () => void; // Optional now
  onGenerate: (config: ContentConfig) => void;
  onViewHistory?: () => void;
}

const ContentConfigurator: React.FC<ContentConfiguratorProps> = ({ 
  initialTopic = '', 
  initialKeywords = [], 
  onBack, 
  onGenerate,
  onViewHistory
}) => {
  // Mode Selection: 'Lite' (Fast) or 'Expert' (Detailed)
  const [configMode, setConfigMode] = useState<'Lite' | 'Expert'>('Lite');

  // [NEW] Topic & Keywords State for Direct Input
  const [topic, setTopic] = useState(initialTopic);
  const [keywordsStr, setKeywordsStr] = useState(initialKeywords.join(', '));

  // Shared State
  const [platform, setPlatform] = useState<ContentPlatform>('OrganicBlog');
  const [tone, setTone] = useState<ToneType>('Polite');

  // Expert Mode Only State
  const [contentType, setContentType] = useState<ContentType>('Information');
  const [paragraphCount, setParagraphCount] = useState<ParagraphCount>(7); 
  const [designConcept, setDesignConcept] = useState<DesignConcept>('SimpleIllust');
  const [targetPersona, setTargetPersona] = useState<TargetPersona>('Beginner_Owner');
  const [addons, setAddons] = useState<ContentAddon[]>([]);

  // 주제 추천 모드인지 여부 (initialTopic이 있으면 추천 모드)
  const isRecommendedMode = !!initialTopic;

  // Update state if props change (e.g. coming from Recommender)
  useEffect(() => {
    if (initialTopic) setTopic(initialTopic);
    if (initialKeywords.length > 0) setKeywordsStr(initialKeywords.join(', '));
  }, [initialTopic, initialKeywords]);

  // Lite Mode Automation Logic
  const getLiteModeDefaults = (plat: ContentPlatform) => {
    switch (plat) {
      case 'NaverCardNews':
        return {
          contentType: 'Information' as ContentType,
          paragraphCount: 6 as ParagraphCount,
          designConcept: 'TypoCard' as DesignConcept,
          targetPersona: 'General_Standard' as TargetPersona,
          addons: ['SummaryTable'] as ContentAddon[]
        };
      case 'NaverOfficial':
        return {
          contentType: 'Guide' as ContentType,
          paragraphCount: 8 as ParagraphCount,
          designConcept: 'SimpleIllust' as DesignConcept,
          targetPersona: 'Beginner_Owner' as TargetPersona,
          addons: ['Checklist', 'Tips'] as ContentAddon[]
        };
      case 'OrganicBlog': // 자사 사이트 정보성
        return {
          contentType: 'Information' as ContentType,
          paragraphCount: 10 as ParagraphCount,
          designConcept: 'WebCapture' as DesignConcept,
          targetPersona: 'Manager' as TargetPersona,
          addons: ['QnA', 'RealCase'] as ContentAddon[]
        };
      case 'Tistory':
        return {
          contentType: 'Review' as ContentType,
          paragraphCount: 9 as ParagraphCount,
          designConcept: 'DeviceCloseup' as DesignConcept,
          targetPersona: 'General_Standard' as TargetPersona,
          addons: ['Comparison', 'Tips'] as ContentAddon[]
        };
      case 'Shorts':
        return {
          contentType: 'Issue' as ContentType,
          paragraphCount: 5 as ParagraphCount, // 스크립트 씬 개수
          designConcept: 'SimpleIllust' as DesignConcept,
          targetPersona: 'General_Standard' as TargetPersona,
          addons: [] as ContentAddon[]
        };
      default:
        return {
          contentType: 'Information' as ContentType,
          paragraphCount: 7 as ParagraphCount,
          designConcept: 'SimpleIllust' as DesignConcept,
          targetPersona: 'Beginner_Owner' as TargetPersona,
          addons: [] as ContentAddon[]
        };
    }
  };

  const handleStartGeneration = () => {
    if (!topic.trim()) {
      alert('주제를 입력해주세요.');
      return;
    }
    
    // Parse keywords
    const keywords = keywordsStr.split(',').map(k => k.trim()).filter(k => k !== '');
    const finalKeywords = keywords.length > 0 ? keywords : [topic];

    if (configMode === 'Lite') {
      // Lite Mode: Auto-fill configuration based on Platform
      const defaults = getLiteModeDefaults(platform);
      onGenerate({
        topic,
        keywords: finalKeywords,
        platform,
        tone,
        ...defaults,
        generationMode: 'Lite'
      });
    } else {
      // Expert Mode: Use manual settings
      onGenerate({
        topic,
        keywords: finalKeywords,
        contentType,
        platform,
        paragraphCount,
        tone,
        designConcept,
        targetPersona,
        addons,
        generationMode: 'Expert'
      });
    }
  };

  const handleAddonToggle = (addon: ContentAddon) => {
    setAddons(prev => prev.includes(addon) ? prev.filter(a => a !== addon) : [...prev, addon]);
  };

  const handlePresetClick = (type: 'Light' | 'Standard' | 'Deep') => {
    if (type === 'Light') setParagraphCount(5);
    if (type === 'Standard') setParagraphCount(7);
    if (type === 'Deep') setParagraphCount(10);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {onBack && (
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
              <ArrowLeft size={24} />
            </button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-slate-900">컨텐츠 생성 및 설계</h2>
            <p className="text-slate-500">
                {isRecommendedMode ? '선택한 주제를 바탕으로 원고를 생성합니다.' : '주제를 입력하고 AI 맞춤형 원고 설계를 시작합니다.'}
            </p>
          </div>
        </div>
        
        {onViewHistory && (
          <button 
            onClick={onViewHistory}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 font-medium transition-colors text-sm"
          >
            <FileText size={16}/> 작성 기록(보관함) 보기
          </button>
        )}
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl max-w-md">
        <button
            onClick={() => setConfigMode('Lite')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${
                configMode === 'Lite' 
                ? 'bg-white text-blue-700 shadow-sm ring-1 ring-black/5' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
        >
            <Zap size={16} className={configMode === 'Lite' ? 'text-blue-500' : ''}/>
            빠른 생성 (Lite)
        </button>
        <button
            onClick={() => setConfigMode('Expert')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${
                configMode === 'Expert' 
                ? 'bg-white text-purple-700 shadow-sm ring-1 ring-black/5' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
        >
            <Sliders size={16} className={configMode === 'Expert' ? 'text-purple-500' : ''}/>
            전문가 설정 (Expert)
        </button>
      </div>

      {/* 1. TOPIC SECTION (Always Visible) */}
      {isRecommendedMode ? (
        // [CASE A] Recommended Mode: Read-only Summary
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-lg p-6 md:p-8 relative overflow-hidden text-white">
             <div className="absolute top-0 right-0 p-8 opacity-10">
                <Target size={120} />
             </div>
             <div className="relative z-10">
                 <div className="flex items-center gap-2 mb-3 opacity-80">
                     <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                     <span className="text-sm font-bold text-blue-200">선택된 주제 및 키워드 (AI 추천)</span>
                 </div>
                 <h3 className="text-2xl font-bold mb-4 leading-tight">{topic}</h3>
                 <div className="flex flex-wrap gap-2">
                     {keywordsStr.split(',').map((k, i) => k.trim() && (
                         <span key={i} className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-full text-xs text-blue-100 font-medium flex items-center gap-1">
                             <Hash size={10} className="opacity-50"/> {k.trim()}
                         </span>
                     ))}
                 </div>
             </div>
        </div>
      ) : (
        // [CASE B] Direct Mode: Editable Inputs
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs">1</span> 
            주제 및 키워드 설정
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Type size={16} className="text-blue-600"/> 메인 주제 (Topic)
                    </label>
                    <input 
                        type="text" 
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="예: 법인사업자 범용 공인인증서 발급 방법"
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium text-slate-900 placeholder:text-slate-300"
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Hash size={16} className="text-blue-600"/> 포함할 키워드 (쉼표 구분)
                    </label>
                    <input 
                        type="text" 
                        value={keywordsStr}
                        onChange={(e) => setKeywordsStr(e.target.value)}
                        placeholder="예: 당일발급, 서류제출, 비대면"
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-700 placeholder:text-slate-300"
                    />
                </div>
            </div>
        </div>
      )}

      {/* CONFIGURATION BODY */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 md:p-8 space-y-8">
            
            {/* LITE MODE: Simply Select Platform & Tone */}
            {configMode === 'Lite' && (
                <div className="space-y-6">
                    <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <Sparkles className="text-blue-600 shrink-0" size={24}/>
                        <div>
                            <h4 className="font-bold text-blue-900">빠른 생성 모드 (Lite)</h4>
                            <p className="text-sm text-blue-700">
                                사용처와 어조만 선택하면, SEO 최적화된 디자인 컨셉, 단락 구조, 부가 컨텐츠(표, 체크리스트 등)를 
                                <span className="font-bold"> AI가 자동으로 최적화하여 설정</span>합니다.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Platform Selector */}
                        <div className="space-y-4">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                <Monitor size={18} className="text-blue-600" /> 어디에 올리실 건가요? (사용처)
                            </label>
                            <div className="grid grid-cols-1 gap-3">
                                {[
                                    { id: 'NaverCardNews', label: '네이버 카드뉴스', desc: '이미지 중심, 짧은 호흡 (6단락, 타이포그래피)' },
                                    { id: 'NaverOfficial', label: '네이버 공식 블로그', desc: '전문성 강조, 가이드형 (8단락, 일러스트)' },
                                    { id: 'OrganicBlog', label: '자사 사이트 게시판', desc: '정보성, SEO 트래픽 유도 (10단락, 캡쳐형)' },
                                    { id: 'Tistory', label: '티스토리/외부 블로그', desc: '리뷰/후기 스타일 (9단락, 사진중심)' },
                                    { id: 'Shorts', label: '숏츠 (유튜브/인스타)', desc: '영상 시나리오 전용 (5씬 구조)' }
                                ].map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => setPlatform(p.id as ContentPlatform)}
                                        className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all group ${
                                            platform === p.id 
                                            ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' 
                                            : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'
                                        }`}
                                    >
                                        <div>
                                            <span className={`font-bold block ${platform === p.id ? 'text-blue-700' : 'text-slate-800'}`}>{p.label}</span>
                                            <span className="text-xs text-slate-500">{p.desc}</span>
                                        </div>
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${platform === p.id ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>
                                            {platform === p.id && <div className="w-1.5 h-1.5 bg-white rounded-full"/>}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tone Selector */}
                        <div className="space-y-4">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                <PenTool size={18} className="text-blue-600" /> 어떤 말투로 쓸까요? (어조)
                            </label>
                            <div className="grid grid-cols-1 gap-3">
                                {[
                                    { id: 'Polite', label: '해요체 (친절해요)', desc: '"추천드려요", "살펴볼게요"' },
                                    { id: 'Formal', label: '합니다체 (신뢰감)', desc: '"확인해야 합니다", "중요합니다"' },
                                    { id: 'Soft', label: '부드럽게 (감성적)', desc: '"좋았답니다", "함께해요"' },
                                    { id: 'Honorific', label: '극존칭 (비즈니스)', desc: '"하시기 바랍니다", "드리겠습니다"' },
                                ].map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => setTone(t.id as ToneType)}
                                        className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                                            tone === t.id 
                                            ? 'bg-purple-50 border-purple-500 ring-1 ring-purple-500' 
                                            : 'bg-white border-slate-200 hover:border-purple-300 hover:shadow-sm'
                                        }`}
                                    >
                                        <div>
                                            <span className={`font-bold block ${tone === t.id ? 'text-purple-700' : 'text-slate-800'}`}>{t.label}</span>
                                        </div>
                                        <span className="text-xs text-slate-500">{t.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* EXPERT MODE: Full Configuration */}
            {configMode === 'Expert' && (
            <>
                {/* 2. 형식 및 타겟 */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs">2</span> 
                    형식 및 타겟 설정 (상세)
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                            <Layout size={18} className="text-blue-600" /> 컨텐츠 형식 (Type)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {(['Information', 'Guide', 'Review', 'Issue', 'Comparison'] as ContentType[]).map((type) => (
                            <button
                                key={type}
                                onClick={() => setContentType(type)}
                                className={`p-3 rounded-lg text-sm border text-left transition-all ${
                                contentType === type 
                                    ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' 
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <span className="font-bold block mb-0.5">
                                {type === 'Information' && '정보형'}
                                {type === 'Guide' && '가이드형'}
                                {type === 'Review' && '후기형'}
                                {type === 'Issue' && '이슈형'}
                                {type === 'Comparison' && '비교분석형'}
                                </span>
                                <span className="text-xs opacity-70">
                                {type === 'Information' && '트래픽 유도 (지식)'}
                                {type === 'Guide' && '따라하기 (How-to)'}
                                {type === 'Review' && '신뢰도 상승 (경험)'}
                                {type === 'Issue' && '급상승 이슈 (뉴스)'}
                                {type === 'Comparison' && '구매전환 유도 (VS)'}
                                </span>
                            </button>
                            ))}
                        </div>
                        </div>

                        <div className="space-y-4">
                        {/* 타겟 페르소나 */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                            <Users size={18} className="text-blue-600" /> 타겟 독자 (Persona)
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                            {[
                                { id: 'General_Standard', label: '일반 사업자 (표준)', desc: '누구나 이해하기 쉬움' },
                                { id: 'Beginner_Owner', label: '초보 사장님', desc: '쉬운 용어, 친절함' },
                                { id: 'Manager', label: '경리/실무자', desc: '절차, 서류 중심' },
                                { id: 'Veteran_CEO', label: '베테랑 대표', desc: '절세, 고급 정보' }
                            ].map(p => (
                                <button
                                key={p.id}
                                onClick={() => setTargetPersona(p.id as TargetPersona)}
                                className={`p-2 rounded-lg border text-center transition-all ${
                                    targetPersona === p.id 
                                    ? 'bg-blue-50 border-blue-500 text-blue-700' 
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                                >
                                <span className="block text-sm font-bold">{p.label}</span>
                                <span className="text-[10px] opacity-70">{p.desc}</span>
                                </button>
                            ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                            <Monitor size={18} className="text-blue-600" /> 활용 플랫폼
                            </label>
                            <select 
                            value={platform} 
                            onChange={(e) => setPlatform(e.target.value as ContentPlatform)}
                            className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                            >
                            <option value="OrganicBlog">자사 사이트 블로그 (SEO)</option>
                            <option value="NaverOfficial">네이버 공식 블로그</option>
                            <option value="NaverCardNews">네이버 카드뉴스</option>
                            <option value="Tistory">티스토리 (다음/구글 노출)</option>
                            <option value="Shorts">유튜브/SNS 숏츠 전용</option>
                            </select>
                        </div>
                        </div>
                    </div>
                </div>

                <hr className="border-slate-100" />

                {/* 3. 구조 & 부가 컨텐츠 */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs">3</span> 
                    구조 및 옵션
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                            <Layers size={18} className="text-blue-600" /> 컨텐츠 깊이 & 단락 (Hybrid)
                        </label>
                        
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button onClick={() => handlePresetClick('Light')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${paragraphCount <= 6 ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>가볍게 (스낵형)</button>
                            <button onClick={() => handlePresetClick('Standard')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${paragraphCount >= 7 && paragraphCount <= 8 ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>표준 (일반형)</button>
                            <button onClick={() => handlePresetClick('Deep')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${paragraphCount >= 9 ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>깊게 (전문가형)</button>
                        </div>

                        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <input 
                                type="range" 
                                min="5" 
                                max="11" 
                                step="1" 
                                value={paragraphCount} 
                                onChange={(e) => setParagraphCount(Number(e.target.value) as ParagraphCount)}
                                className="flex-1 accent-blue-600"
                            />
                            <span className="font-bold text-xl text-blue-600 w-12 text-center">{paragraphCount}</span>
                        </div>
                        </div>

                        <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                            <PlusSquare size={18} className="text-blue-600" /> 부가 컨텐츠 구조 (Add-ons)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                            { id: 'SummaryTable', label: '요약 표' },
                            { id: 'Comparison', label: '비교 분석 (vs)', icon: Scale },
                            { id: 'Warning', label: '주의사항/경고', icon: AlertTriangle },
                            { id: 'QnA', label: '자주 묻는 질문' },
                            { id: 'Checklist', label: '체크리스트' },
                            { id: 'RealCase', label: '실제 사례' },
                            { id: 'Tips', label: '꿀팁 박스' }
                            ].map(item => (
                            <button
                                key={item.id}
                                onClick={() => handleAddonToggle(item.id as ContentAddon)}
                                className={`flex items-center gap-2 p-2 rounded-lg border text-sm transition-all ${
                                addons.includes(item.id as ContentAddon)
                                ? 'bg-green-50 border-green-500 text-green-700'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${addons.includes(item.id as ContentAddon) ? 'bg-green-500 border-green-500' : 'border-slate-300'}`}>
                                {addons.includes(item.id as ContentAddon) ? <Wand2 size={10} className="text-white" /> : (item.icon ? <item.icon size={10} className="text-slate-400"/> : null)}
                                </div>
                                {item.label}
                            </button>
                            ))}
                        </div>
                        </div>
                    </div>
                </div>
                
                <hr className="border-slate-100" />

                {/* 4. 디자인 및 어조 */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs">4</span> 
                    디자인 및 어조
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                            <Wand2 size={18} className="text-blue-600" /> 이미지/디자인 컨셉
                        </label>
                        <div className="space-y-2">
                            {[
                            { id: 'SimpleIllust', label: '단순 일러스트 (3D Clay)', desc: '깔끔한 배경 + 중앙 아이콘' },
                            { id: 'TypoCard', label: '타이포그래피 카드뉴스', desc: '텍스트 강조형, 가독성 중심' },
                            { id: 'WebCapture', label: '웹사이트 캡쳐 가이드', desc: '실제 사이트 화면 활용' },
                            { id: 'DeviceCloseup', label: '디바이스 클로즈업', desc: 'PC/모바일 사용하는 손/화면' },
                            ].map((concept) => (
                            <button
                                key={concept.id}
                                onClick={() => setDesignConcept(concept.id as DesignConcept)}
                                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                                designConcept === concept.id
                                    ? 'bg-purple-50 border-purple-500 ring-1 ring-purple-500'
                                    : 'bg-white border-slate-200 hover:border-purple-300'
                                }`}
                            >
                                <div className="flex flex-col">
                                <span className={`text-sm font-bold ${designConcept === concept.id ? 'text-purple-800' : 'text-slate-700'}`}>
                                    {concept.label}
                                </span>
                                <span className="text-xs text-slate-500">{concept.desc}</span>
                                </div>
                                {designConcept === concept.id && <div className="w-3 h-3 rounded-full bg-purple-600"></div>}
                            </button>
                            ))}
                        </div>
                        </div>
                        
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                            <PenTool size={18} className="text-blue-600" /> 어조 (Tone)
                            </label>
                            <div className="flex flex-col gap-2 bg-slate-100 p-2 rounded-lg">
                            {(['Polite', 'Formal', 'Soft'] as ToneType[]).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTone(t)}
                                    className={`w-full py-2.5 px-3 text-xs font-bold rounded-md transition-all text-left flex justify-between items-center ${tone === t ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}
                                >
                                    <span>
                                    {t === 'Polite' && '해요체 (친절해요)'}
                                    {t === 'Formal' && '합니다체 (신뢰감)'}
                                    {t === 'Soft' && '부드럽게 (감성적)'}
                                    </span>
                                    <span className="text-[10px] font-normal opacity-70">
                                    {t === 'Polite' && '"추천드려요"'}
                                    {t === 'Formal' && '"확인해야 합니다"'}
                                    {t === 'Soft' && '"좋았답니다"'}
                                    </span>
                                </button>
                            ))}
                            </div>
                        </div>
                    </div>
                </div>
            </>
            )}

        </div>

        {/* Action Bar */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
           <button
            onClick={handleStartGeneration}
            className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
           >
             <Wand2 size={20} />
             {configMode === 'Lite' ? '빠른 설정으로 즉시 생성' : '전문가 설정으로 생성'}
           </button>
        </div>
      </div>
    </div>
  );
};

export default ContentConfigurator;
