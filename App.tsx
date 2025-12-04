
import React, { useState } from 'react';
import Layout from './components/Layout';
import SeoChecker from './components/SeoChecker';
import TopicRecommender from './components/TopicRecommender';
import ContentConfigurator from './components/ContentConfigurator';
import ContentGenerator from './components/ContentGenerator';
import { AppMode, ContentConfig, ContentPackage } from './types';
import { FileText, Plus, Clock, ArrowRight, Trash2, ArrowLeft, PenSquare, CheckCircle } from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.SEO_CHECK);
  
  // 상태 관리
  const [selectedTopicData, setSelectedTopicData] = useState<{ topic: string, keywords: string[] } | null>(null);
  const [finalConfig, setFinalConfig] = useState<ContentConfig | null>(null);
  
  // [NEW] 컨텐츠 히스토리 및 뷰 모드 관리
  const [history, setHistory] = useState<ContentPackage[]>([]);
  const [viewingContent, setViewingContent] = useState<ContentPackage | null>(null); // 히스토리에서 선택해서 볼 때
  
  // [NEW] "Direct Creation" vs "History" view toggle within the generation tab
  // Default is false to ensure we start with Creation Form
  const [isHistoryView, setIsHistoryView] = useState(false);

  // [NEW] Toast Message State
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
        setToastMsg(null);
    }, 3000);
  };

  const handleTopicSelect = (topic: string, keywords: string[]) => {
    setSelectedTopicData({ topic, keywords });
    setViewingContent(null);
    setFinalConfig(null);
    setIsHistoryView(false); // 추천 받으면 바로 생성 화면으로
    setMode(AppMode.CONTENT_GEN); // [IMPORTANT] Recommender now directs to CONTENT_GEN tab, but specifically into the Configurator
  };

  const handleConfigComplete = (config: ContentConfig) => {
    setFinalConfig(config);
    setViewingContent(null);
    // mode is already CONTENT_GEN
  };

  const handleGenerationComplete = (pkg: ContentPackage) => {
    // 생성이 완료되면 히스토리에 추가
    setHistory(prev => [pkg, ...prev]);
  };

  const handleBackToTopic = () => {
    setMode(AppMode.TOPIC_IDEA);
  };

  const handleViewHistoryItem = (pkg: ContentPackage) => {
    setViewingContent(pkg);
    setFinalConfig(null);
    setIsHistoryView(false); // Hide the list, show the content
  };

  const handleReturnToCreator = () => {
    setViewingContent(null);
    setFinalConfig(null);
    setIsHistoryView(false); // Go back to creator form
  };
  
  const handleReturnToHistory = () => {
    setViewingContent(null);
    setFinalConfig(null);
    setIsHistoryView(true);
  }

  const handleDeleteHistory = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if(confirm('이 기록을 삭제하시겠습니까?')) {
        setHistory(prev => prev.filter((_, i) => i !== index));
        showToast("컨텐츠가 삭제되었습니다.");
    }
  }

  // 상세 화면에서 현재 보고 있는 컨텐츠 삭제
  const handleDeleteCurrentContent = () => {
    if (viewingContent) {
        setHistory(prev => prev.filter(item => item !== viewingContent));
        setViewingContent(null);
        setFinalConfig(null);
        setIsHistoryView(true); // 삭제 후 목록으로 이동
        showToast("컨텐츠가 삭제되었습니다.");
    }
  }

  // 3번 탭(컨텐츠 생성) 렌더링 로직 분리
  const renderContentTab = () => {
    // Case 1: Viewing a generated result (either just created or from history)
    if (finalConfig || viewingContent) {
        return (
            <ContentGenerator 
                config={finalConfig || viewingContent!.config} 
                existingResult={viewingContent}
                onComplete={finalConfig ? handleGenerationComplete : undefined}
                onBack={handleReturnToHistory} // "Back" goes to history/list if viewing result
                onDelete={viewingContent ? handleDeleteCurrentContent : undefined} // 이미 저장된 컨텐츠일 경우에만 삭제 허용
            />
        );
    }

    // Case 2: Viewing the History List
    if (isHistoryView) {
        return (
            <div className="space-y-8 animate-fade-in">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsHistoryView(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                             <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">컨텐츠 보관함</h2>
                            <p className="text-slate-500">생성된 컨텐츠 기록을 관리합니다.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsHistoryView(false)}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition-all flex items-center gap-2"
                    >
                        <Plus size={20}/> 새 컨텐츠 만들기
                    </button>
                </div>

                {history.length === 0 ? (
                    <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                        <FileText size={48} className="mx-auto mb-4 text-slate-300"/>
                        <p className="text-lg font-bold text-slate-600">보관된 컨텐츠가 없습니다.</p>
                        <p className="text-slate-400 text-sm mb-6">새로운 글을 작성하여 보관함에 채워보세요.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {history.map((item, idx) => (
                            <div 
                                key={idx}
                                onClick={() => handleViewHistoryItem(item)}
                                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-400 transition-all cursor-pointer group relative"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold border ${
                                        item.config.contentType === 'Information' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                        item.config.contentType === 'Guide' ? 'bg-teal-50 text-teal-600 border-teal-100' :
                                        item.config.contentType === 'Comparison' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                        'bg-slate-50 text-slate-600 border-slate-100'
                                    }`}>
                                        {item.config.contentType}
                                    </span>
                                    <button 
                                        onClick={(e) => handleDeleteHistory(e, idx)}
                                        className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                        title="기록 삭제"
                                    >
                                        <Trash2 size={14}/>
                                    </button>
                                </div>
                                <h3 className="font-bold text-slate-800 mb-2 line-clamp-2 group-hover:text-blue-700 transition-colors">
                                    {item.blogPost.title}
                                </h3>
                                <p className="text-xs text-slate-500 line-clamp-2 mb-4 h-8">
                                    {item.blogPost.lead}
                                </p>
                                <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-50">
                                    <div className="flex items-center gap-1">
                                        <Clock size={12}/>
                                        <span>{new Date().toLocaleDateString()}</span>
                                    </div>
                                    <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform text-blue-600 font-bold">
                                        열기 <ArrowRight size={12}/>
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Case 3: Default View -> Direct Content Configurator (No History Mode)
    // This is the default when clicking "Content Generation" tab
    return (
        <ContentConfigurator 
            initialTopic={selectedTopicData?.topic}
            initialKeywords={selectedTopicData?.keywords}
            onBack={selectedTopicData ? handleBackToTopic : undefined} // Only show back if came from recommender
            onGenerate={handleConfigComplete}
            onViewHistory={() => setIsHistoryView(true)}
        />
    );
  };

  const handleModeChange = (newMode: AppMode) => {
    setMode(newMode);
    // Reset transient states when switching main tabs
    if (newMode !== AppMode.CONTENT_GEN) {
        setIsHistoryView(false);
        setViewingContent(null);
        setFinalConfig(null);
        setSelectedTopicData(null);
    } else {
        // When entering Content Gen tab directly, reset specific states to ensure fresh start (Direct Input mode)
        setFinalConfig(null);
        setViewingContent(null);
        setIsHistoryView(false); // Default to Creator
    }
  };

  return (
    <Layout currentMode={mode} onModeChange={handleModeChange}>
      {mode === AppMode.SEO_CHECK && <SeoChecker />}
      
      {mode === AppMode.TOPIC_IDEA && (
        <TopicRecommender onSelectTopic={handleTopicSelect} />
      )}
      
      {/* 
         Combined Logic: 
         Both CONTENT_CONFIG (old flow) and CONTENT_GEN (tab click) now route to the unified renderContentTab function
         which handles the Configurator vs History logic.
      */}
      {(mode === AppMode.CONTENT_CONFIG || mode === AppMode.CONTENT_GEN) && renderContentTab()}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 animate-bounce-in z-50">
           <CheckCircle size={18} className="text-green-400"/>
           <span className="text-sm font-bold">{toastMsg}</span>
        </div>
      )}
    </Layout>
  );
};

export default App;
