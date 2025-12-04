
import React, { useState, useEffect } from 'react';
import { Lightbulb, ArrowRight, TrendingUp, Search, Filter, Bot, Globe, Loader2, Plus, Sparkles, Tag, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { recommendTopics, getTrendingKeywords } from '../services/geminiService';
import { TopicSuggestion, SearchSource, ContentType, GroundingLink } from '../types';

interface TopicRecommenderProps {
  onSelectTopic: (topic: string, keywords: string[]) => void;
}

const TopicRecommender: React.FC<TopicRecommenderProps> = ({ onSelectTopic }) => {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const [trendingKeywords, setTrendingKeywords] = useState<string[]>([]);
  const [topics, setTopics] = useState<TopicSuggestion[]>([]);
  const [summary, setSummary] = useState<string>('');
  
  // [UPDATED] AI 텍스트 출처 대신 실제 Grounding Links 사용
  const [groundingLinks, setGroundingLinks] = useState<GroundingLink[]>([]);
  
  const [sourceFilter, setSourceFilter] = useState<SearchSource>('ALL');
  const [typeFilter, setTypeFilter] = useState<ContentType | 'ALL'>('ALL');
  const [trendingLoading, setTrendingLoading] = useState(true);

  // 컴포넌트 마운트 시 초기 트렌드 키워드 로드
  useEffect(() => {
    const fetchInit = async () => {
      setTrendingLoading(true);
      try {
        const keywords = await getTrendingKeywords();
        setTrendingKeywords(keywords);
      } catch (error) {
        console.error("Failed to fetch trending keywords", error);
      } finally {
        setTrendingLoading(false);
      }
    };
    fetchInit();
  }, []);

  const handleRecommend = async (isLoadMore = false) => {
    const targetKeyword = keyword || (trendingKeywords.length > 0 ? trendingKeywords[0] : '사업자 인증서');
    if (!targetKeyword) return;

    if (isLoadMore) setLoadingMore(true);
    else {
      setLoading(true);
      setTopics([]); 
      setSummary('');
      setGroundingLinks([]);
    }

    try {
      const excludeList = topics.map(t => t.title);
      const response = await recommendTopics(targetKeyword, sourceFilter, excludeList);
      
      if (isLoadMore) {
        setTopics(prev => [...prev, ...response.items]);
      } else {
        setTopics(response.items);
        setSummary(response.summary);
        // [UPDATED] API에서 반환된 실제 링크 사용
        setGroundingLinks(response.groundingLinks || []);
      }
    } catch (error) {
      console.error(error);
      alert('주제 추천 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleChipClick = (k: string) => {
    setKeyword(k);
  };

  const filteredTopics = topics.filter(t => {
    const sourceMatch = sourceFilter === 'ALL' ? true : 
                        sourceFilter === 'PORTAL' ? (t.sourceType === 'PORTAL' || t.sourceType === 'HYBRID') :
                        (t.sourceType === 'AI' || t.sourceType === 'HYBRID');
    const typeMatch = typeFilter === 'ALL' ? true : t.contentTypeBadge === typeFilter;
    return sourceMatch && typeMatch;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-10">
       <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">1. 키워드 분석 및 주제 추천</h2>
        <p className="text-slate-500">Google Search 및 AI 트렌드를 분석하여 상위 노출 및 인용 가능성이 높은 주제를 도출합니다.</p>
      </div>

      {/* Input Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRecommend(false)}
              placeholder="핵심 키워드 입력 (예: 범용인증서 갱신, 전자입찰)"
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg"
            />
          </div>
          <button
            onClick={() => handleRecommend(false)}
            disabled={loading || !keyword}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <TrendingUp size={20} />}
            트렌드 분석 시작
          </button>
        </div>

        {trendingLoading ? (
           <div className="flex items-center gap-2 pt-2 text-slate-500 text-sm animate-pulse">
             <Loader2 size={14} className="animate-spin text-blue-600"/>
             <span>🔍 현재 사업자 인증서 관련 <strong>실시간 급상승 키워드</strong>를 확인 중입니다. 잠시만 기다려주세요...</span>
           </div>
        ) : (
           trendingKeywords.length > 0 && !loading && topics.length === 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-xs font-bold text-slate-500 flex items-center gap-1"><Sparkles size={12}/> 실시간 급상승 키워드</p>
              <div className="flex flex-wrap gap-2">
                {trendingKeywords.map((k, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleChipClick(k)}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 hover:border-blue-200 rounded-full text-xs transition-colors"
                  >
                    #{k}
                  </button>
                ))}
              </div>
            </div>
          )
        )}
      </div>

      {loading && (
        <div className="py-20 text-center space-y-4">
          <Loader2 className="animate-spin text-blue-600 mx-auto" size={48} />
          <div>
            <p className="text-lg font-bold text-slate-800">Google Search & AI 트렌드 분석 중...</p>
            <p className="text-slate-500 text-sm">최근 문서 발행량과 팩트(법령/세율)를 교차 검증하고 있습니다.</p>
          </div>
        </div>
      )}

      {!loading && topics.length > 0 && (
        <div className="space-y-6">
          
          {/* 1. Insight Box with Real Grounding Links */}
          {summary && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-100 flex gap-4 items-start relative flex-col md:flex-row">
               <div className="flex gap-4 w-full md:w-auto">
                 <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600 shrink-0 h-fit">
                   <Sparkles size={20} />
                 </div>
                 <div className="flex-1">
                   <h3 className="font-bold text-blue-900 mb-2">AI 트렌드 인사이트</h3>
                   <div className="text-sm text-blue-800 leading-relaxed prose prose-sm prose-blue max-w-none mb-4">
                      <ReactMarkdown components={{
                          strong: ({node, ...props}) => <strong className="font-bold text-blue-700 bg-blue-100/80 px-1 rounded mx-0.5" {...props} />,
                          p: ({node, ...props}) => <p className="mb-0" {...props} />
                      }}>
                          {summary}
                      </ReactMarkdown>
                   </div>
                 </div>
               </div>

               {/* [UPDATED] 실제 Grounding Links 표시 영역 */}
               {groundingLinks.length > 0 && (
                  <div className="w-full md:w-64 shrink-0 flex flex-col gap-2 border-t md:border-t-0 md:border-l border-blue-200 pt-4 md:pt-0 md:pl-4">
                     <span className="text-xs font-bold text-blue-500 block mb-1">🔍 분석에 참고한 실제 출처</span>
                     <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                        {groundingLinks.slice(0, 5).map((link, idx) => (
                          <a 
                            key={idx}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start gap-2 text-xs p-2 rounded bg-white/60 hover:bg-white border border-blue-100 transition-all group"
                            title={link.title}
                          >
                             <ExternalLink size={12} className="mt-0.5 text-blue-400 group-hover:text-blue-600 shrink-0"/>
                             <span className="text-slate-600 group-hover:text-blue-800 line-clamp-2 leading-tight">
                               {link.title.replace(' - Google Search', '')}
                             </span>
                          </a>
                        ))}
                     </div>
                  </div>
               )}
            </div>
          )}

          {/* 2. Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
               <span className="text-sm font-medium text-slate-500 whitespace-nowrap">검색 소스:</span>
               {(['ALL', 'PORTAL', 'AI'] as SearchSource[]).map(src => (
                 <button
                   key={src}
                   onClick={() => setSourceFilter(src)}
                   className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                     sourceFilter === src ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                   }`}
                 >
                   {src === 'ALL' ? '전체' : src}
                 </button>
               ))}
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
               <span className="text-sm font-medium text-slate-500 whitespace-nowrap">컨텐츠 타입:</span>
               {(['ALL', 'Information', 'Guide', 'Review', 'Issue', 'Comparison'] as (ContentType | 'ALL')[]).map(type => (
                 <button
                   key={type}
                   onClick={() => setTypeFilter(type)}
                   className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap border ${
                     typeFilter === type 
                     ? 'bg-blue-100 text-blue-700 border-blue-200' 
                     : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                   }`}
                 >
                   {type === 'ALL' && '전체'}
                   {type === 'Information' && '정보형'}
                   {type === 'Guide' && '가이드형'}
                   {type === 'Review' && '후기형'}
                   {type === 'Issue' && '이슈형'}
                   {type === 'Comparison' && '비교분석형'}
                 </button>
               ))}
            </div>
          </div>

          {/* 3. Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTopics.map((topic) => (
              <div key={topic.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 flex">
                   {topic.contentTypeBadge && (
                     <span className={`px-2 py-1 text-[10px] font-bold flex items-center gap-1 border-l border-b rounded-bl-lg
                        ${topic.contentTypeBadge === 'Information' ? 'bg-blue-50 text-blue-600 border-blue-100' : ''}
                        ${topic.contentTypeBadge === 'Guide' ? 'bg-teal-50 text-teal-600 border-teal-100' : ''}
                        ${topic.contentTypeBadge === 'Review' ? 'bg-green-50 text-green-600 border-green-100' : ''}
                        ${topic.contentTypeBadge === 'Issue' ? 'bg-red-50 text-red-600 border-red-100' : ''}
                        ${topic.contentTypeBadge === 'Comparison' ? 'bg-purple-50 text-purple-600 border-purple-100' : ''}
                     `}>
                       <Tag size={10}/> 
                       {topic.contentTypeBadge === 'Information' && '정보형'}
                       {topic.contentTypeBadge === 'Guide' && '가이드형'}
                       {topic.contentTypeBadge === 'Review' && '후기형'}
                       {topic.contentTypeBadge === 'Issue' && '이슈형'}
                       {topic.contentTypeBadge === 'Comparison' && '비교분석'}
                     </span>
                   )}
                   {topic.sourceType === 'PORTAL' && <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 flex items-center gap-1 border-b border-l rounded-bl-lg border-slate-200"><Globe size={10}/> 포털</span>}
                   {topic.sourceType === 'AI' && <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-1 flex items-center gap-1 border-b border-l rounded-bl-lg border-purple-200"><Bot size={10}/> AI</span>}
                </div>

                <div className="mb-3 mt-1">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mb-2 ${topic.rank <= 3 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                    추천순위 #{topic.rank}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug group-hover:text-blue-700 transition-colors">
                    {topic.title}
                  </h3>
                </div>

                <div className="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    <span className="font-bold text-blue-600 mr-1">Why?</span>
                    {topic.reason}
                  </p>
                </div>
                
                <div className="mt-auto space-y-3">
                  <div className="flex flex-wrap gap-1">
                    {topic.keywords.map((k, i) => (
                      <span key={i} className="px-2 py-1 bg-white border border-slate-200 rounded text-sm text-slate-500">#{k}</span>
                    ))}
                  </div>
                  <button 
                    onClick={() => onSelectTopic(topic.title, topic.keywords)}
                    className="w-full py-2.5 bg-slate-900 text-white rounded-lg hover:bg-blue-600 font-medium text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    이 주제 선택하기 <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {topics.length > 0 && (
            <div className="text-center pt-4">
              <button 
                onClick={() => handleRecommend(true)}
                disabled={loadingMore}
                className="px-6 py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2 mx-auto shadow-sm"
              >
                {loadingMore ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                주제 더보기 (다음 10개)
              </button>
            </div>
          )}

        </div>
      )}
      
      {!loading && topics.length === 0 && !keyword && trendingKeywords.length === 0 && !trendingLoading && (
        <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <Lightbulb size={48} className="mx-auto mb-3 opacity-30" />
          <p>키워드를 입력하면 SEO 전문가 봇이 주제를 분석해드립니다.</p>
        </div>
      )}
    </div>
  );
};

export default TopicRecommender;
