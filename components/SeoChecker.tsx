
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Search, AlertCircle, CheckCircle2, RefreshCw, Target, Trophy, Copy, Hash, Image as ImageIcon, Sparkles, Type, Globe, Monitor, Code } from 'lucide-react';
import { analyzeSeo } from '../services/geminiService';
import { SeoAnalysisResult } from '../types';

const SeoChecker: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [title, setTitle] = useState(''); // [NEW] 제목 상태 추가
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SeoAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!keyword.trim() || !content.trim()) return;
    
    setLoading(true);
    setResult(null);
    setErrorMsg(null);
    
    try {
      // 제목이 없으면 키워드를 포함한 가상의 제목을 사용하거나 경고를 줄 수 있음. 여기서는 title 전달.
      const analysis = await analyzeSeo(keyword.trim(), content.trim(), title.trim());
      setResult(analysis);
    } catch (error) {
      console.error(error);
      setErrorMsg('분석 결과를 불러오는 데 실패했습니다. 원고 내용이 텍스트로 인식되는지 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('복사되었습니다.');
  };

  const getIntentColor = (fit: string) => {
    switch (fit) {
      case 'Excellent': return 'bg-green-100 text-green-700 border-green-200';
      case 'Good': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Fair': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Poor': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">SEO 컨텐츠 점검</h2>
        <p className="text-slate-500">Google Search 실시간 검색 결과를 바탕으로 제목과 본문의 검색 의도(Intent)와 경쟁력을 정밀 진단합니다.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Column 1: Input Section */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                <Target size={16} className="text-blue-600"/> 메인 타겟 키워드
              </label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="예: 소상공인 정책자금"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-800"
              />
            </div>

            {/* [NEW] Title Input */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                <Type size={16} className="text-blue-600"/> 블로그 제목 (Title)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="발행할 블로그 제목을 입력하세요 (키워드 포함 필수)"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">원고 내용</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="여기에 점검할 블로그 원고 내용을 붙여넣으세요."
                className="w-full h-[400px] px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none font-mono text-sm leading-relaxed"
              />
            </div>
            
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                <AlertCircle size={16} /> {errorMsg}
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={loading || !keyword.trim() || !content.trim()}
              className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                loading || !keyword.trim() || !content.trim()
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white hover:shadow-lg'
              }`}
            >
              {loading ? <RefreshCw className="animate-spin" size={20} /> : <Search size={20} />}
              {loading ? '검색 상위 컨텐츠와 비교 분석 중...' : 'SEO 정밀 점검 시작'}
            </button>
          </div>
        </div>

        {/* Column 2: Diagnosis */}
        <div className="xl:col-span-1 space-y-6">
          {result ? (
            <>
              {/* Score Card */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between relative overflow-hidden">
                <div className="z-10">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">SEO 종합 점수</h3>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className={`text-5xl font-bold ${result.score >= 80 ? 'text-green-600' : result.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {result.score}
                    </span>
                    <span className="text-slate-400 font-medium">/ 100</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    {result.score >= 80 ? '훌륭합니다! 상위 노출 가능성이 높습니다.' : '몇 가지 개선이 필요합니다.'}
                  </p>
                </div>
                <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-3xl shadow-lg transform rotate-12 ${result.score >= 80 ? 'bg-gradient-to-br from-green-400 to-green-600' : result.score >= 60 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : 'bg-gradient-to-br from-red-400 to-red-600'}`}>
                  {result.score >= 80 ? 'A' : result.score >= 60 ? 'B' : 'C'}
                </div>
              </div>

              {/* Intent Analysis */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                 <h3 className="font-bold text-slate-800 flex items-center gap-2">
                   <Target size={18} className="text-blue-600"/> 검색 의도(Intent) 적합성
                 </h3>
                 <div className="flex flex-col gap-3">
                   <div className="flex gap-2">
                       <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold">분석된 의도</span>
                       <span className="text-sm font-medium">
                         {result.intentAnalysis.actualType === 'Know' && '정보 탐색 (Know)'}
                         {result.intentAnalysis.actualType === 'Do' && '행동 유도 (Do)'}
                         {result.intentAnalysis.actualType === 'Go' && '특정 사이트 이동 (Go)'}
                         {result.intentAnalysis.actualType === 'Mixed' && '복합 의도 (Mixed)'}
                       </span>
                   </div>
                   <div className={`p-2 rounded-lg border flex items-center gap-2 ${getIntentColor(result.intentAnalysis.fit)}`}>
                      <span className="font-bold text-xs">적합성 판정</span>
                      <span className="font-bold text-sm">
                        {result.intentAnalysis.fit === 'Excellent' && '매우 적합 (Excellent)'}
                        {result.intentAnalysis.fit === 'Good' && '양호 (Good)'}
                        {result.intentAnalysis.fit === 'Fair' && '보통 (Fair)'}
                        {result.intentAnalysis.fit === 'Poor' && '부적합 (Poor)'}
                      </span>
                   </div>
                   <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                     <p className="text-sm text-slate-700 leading-relaxed">
                       <span className="font-bold text-slate-900 mr-1 block mb-1">판단 근거:</span>
                       {result.intentAnalysis.gapAnalysis || result.intentAnalysis.reason}
                     </p>
                   </div>
                 </div>
              </div>

              {/* Competitor Analysis (Restored) */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Trophy size={18} className="text-yellow-600" /> 경쟁사 벤치마킹 (Top 5)
                </h3>
                {result.competitorAnalysis && result.competitorAnalysis.length > 0 ? (
                    <div className="space-y-3">
                        {result.competitorAnalysis.map((comp, idx) => (
                            <div key={idx} className="bg-yellow-50/50 p-3 rounded-lg border border-yellow-100">
                                <div className="text-xs font-bold text-yellow-800 mb-1">{comp.name}</div>
                                <p className="text-sm text-slate-700 leading-snug">{comp.insight}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-slate-400">경쟁사 데이터 분석 중...</p>
                )}
              </div>

              {/* Improvements */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-blue-600" /> 개선 제안 (Action Item)
                </h3>
                <ul className="space-y-2">
                  {(result.improvements || []).map((item, idx) => (
                    <li key={idx} className="flex gap-3 items-start text-sm text-slate-700">
                      <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">{idx + 1}</span>
                      <div className="prose prose-sm prose-slate max-w-none">
                        <ReactMarkdown>{item}</ReactMarkdown>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div className="h-full bg-slate-100 rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 p-8 text-center min-h-[400px]">
              <Search size={48} className="mb-4 opacity-50" />
              <p className="font-medium text-lg text-slate-500">분석 대기 중</p>
              <p className="text-sm mt-2 opacity-70">제목과 본문을 모두 입력해야 정확한 점수가 나옵니다.</p>
            </div>
          )}
        </div>

        {/* Column 3: Technical SEO (Existing Code) */}
        <div className="xl:col-span-1 space-y-6">
          {result?.technicalSeo ? (
            <div className="bg-white p-0 rounded-2xl shadow-lg border-2 border-green-500 overflow-hidden relative">
              <div className="bg-green-600 p-4 text-white">
                 <h3 className="font-bold text-lg flex items-center gap-2">
                   <Type size={20} /> 기술적 SEO 최적화 패키지
                 </h3>
                 <p className="text-green-100 text-xs mt-1">블로그 발행 시 아래 코드를 그대로 사용하세요.</p>
              </div>

              <div className="p-6 space-y-6">
                {/* Meta Tags */}
                <div className="space-y-3">
                   <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                     <Target size={16} className="text-green-600"/> 1️⃣ 메타 태그 (Meta Tags)
                   </h4>
                   <div className="space-y-3">
                      <div className="relative group">
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Title ({result.technicalSeo.metaTitle.length}자)</label>
                        <div className="bg-slate-50 border border-slate-200 rounded p-3 text-sm text-slate-800 pr-10">
                          {result.technicalSeo.metaTitle}
                        </div>
                        <button onClick={() => copyToClipboard(result.technicalSeo!.metaTitle)} className="absolute right-2 top-7 text-slate-400 hover:text-green-600"><Copy size={16}/></button>
                      </div>
                      <div className="relative group">
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Description ({result.technicalSeo.metaDescription.length}자)</label>
                        <div className="bg-slate-50 border border-slate-200 rounded p-3 text-sm text-slate-800 pr-10">
                          {result.technicalSeo.metaDescription}
                        </div>
                        <button onClick={() => copyToClipboard(result.technicalSeo!.metaDescription)} className="absolute right-2 top-7 text-slate-400 hover:text-green-600"><Copy size={16}/></button>
                      </div>
                   </div>
                </div>

                {/* Hashtags */}
                <div className="space-y-3">
                   <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                     <Hash size={16} className="text-green-600"/> 2️⃣ 추천 해시태그 ({result.technicalSeo.hashtags.length}개)
                   </h4>
                   <div className="relative bg-blue-50 border border-blue-100 rounded-lg p-3">
                      <p className="text-xs text-blue-800 leading-relaxed">{(result.technicalSeo.hashtags || []).join(' ')}</p>
                      <button onClick={() => copyToClipboard((result.technicalSeo!.hashtags || []).join(' '))} className="absolute right-2 top-2 text-blue-400 hover:text-blue-700"><Copy size={14}/></button>
                   </div>
                </div>

                {/* [RESTORED] Image Strategy */}
                <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <ImageIcon size={16} className="text-green-600"/> 3️⃣ 이미지 전략 ({result.technicalSeo.recommendedImageCount}장 권장)
                    </h4>
                    <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                        <table className="w-full text-xs">
                            <thead className="bg-slate-100">
                                <tr>
                                    <th className="p-2 text-left font-bold text-slate-600">위치</th>
                                    <th className="p-2 text-left font-bold text-slate-600">ALT 태그 (복사)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {result.technicalSeo.imageStrategy.map((img, i) => (
                                    <tr key={i}>
                                        <td className="p-2 font-medium text-slate-700 w-20">{img.position}</td>
                                        <td className="p-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <code className="text-green-700 bg-green-50 px-1 py-0.5 rounded">alt="{img.alt}"</code>
                                                <button onClick={() => copyToClipboard(`[Prompt]\n${img.prompt}\n\n[Alt]\n${img.alt}`)} className="text-slate-400 hover:text-green-600" title="프롬프트+ALT 복사">
                                                    <Copy size={12}/>
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-slate-400 mt-1">{img.content}</p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* [NEW] URL Slug */}
                <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Globe size={16} className="text-green-600"/> 4️⃣ URL 슬러그 (Slug)
                    </h4>
                    <div className="relative bg-slate-50 border border-slate-200 rounded p-2 flex items-center justify-between">
                        <code className="text-xs font-bold text-slate-700">{result.technicalSeo.slug || "N/A"}</code>
                        <button onClick={() => copyToClipboard(result.technicalSeo!.slug || "")} className="text-slate-400 hover:text-green-600"><Copy size={14}/></button>
                    </div>
                </div>

                {/* [NEW] JSON-LD */}
                <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Code size={16} className="text-blue-600"/> 5️⃣ 구조화된 데이터 (JSON-LD)
                    </h4>
                    <div className="relative group">
                        <div className="bg-slate-900 text-slate-300 p-3 rounded-lg text-[10px] font-mono overflow-x-auto max-h-32">
                           {JSON.stringify(result.technicalSeo.jsonLd, null, 2)}
                        </div>
                        <button 
                            onClick={() => copyToClipboard(JSON.stringify(result.technicalSeo!.jsonLd, null, 2))}
                            className="absolute top-2 right-2 p-1.5 bg-slate-700 text-white rounded hover:bg-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Copy size={12}/>
                        </button>
                    </div>
                    <p className="text-[10px] text-slate-400">* HTML 편집 모드에서 &lt;head&gt; 태그 내에 삽입하세요.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 p-8 text-center min-h-[400px]">
               <Type size={48} className="mb-4 opacity-30" />
               <p className="font-medium text-slate-500">기술적 SEO 분석 대기</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeoChecker;
