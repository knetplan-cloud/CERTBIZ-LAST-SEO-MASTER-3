
import React, { useState, useEffect, useRef } from 'react';
import { Download, Copy, RefreshCw, Youtube, Image as ImageIcon, Tag, FileText, ChevronRight, Check, ShieldCheck, ArrowLeft, ExternalLink, BookOpen, Trash2, AlertTriangle, Monitor, CheckCircle2, Info, GitMerge, LayoutTemplate, Scissors, Globe, HelpCircle, Building2, ClipboardCheck, Edit, Save, Eraser, Megaphone } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateContentPackage } from '../services/geminiService';
import { ContentConfig, ContentPackage } from '../types';

interface ContentGeneratorProps {
  config: ContentConfig;
  existingResult?: ContentPackage | null; // 히스토리에서 볼 때 사용
  onComplete?: (pkg: ContentPackage) => void; // 생성 완료 시 부모에게 알림
  onBack: () => void; // 목록으로 돌아가기
  onDelete?: () => void; // [NEW] 현재 보고 있는 컨텐츠 삭제
}

// Helper to extract text from React children to detect special markers
const getTextFromChildren = (children: React.ReactNode): string => {
  if (children === null || children === undefined) return '';
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(getTextFromChildren).join('');
  if (React.isValidElement(children) && children.props) {
      // @ts-ignore
      return getTextFromChildren(children.props.children);
  }
  return '';
};

// Robust markdown cleaner
const cleanMarkdown = (text: string) => {
    if (!text) return '';
    return text
        // Fix: ** text ** -> **text** (Space inside bold) - Aggressive Regex
        .replace(/\*\*\s+(.*?)\s+\*\*/g, '**$1**')
        .replace(/\*\*\s+(.*?)\*\*/g, '**$1**')
        .replace(/\*\*(.*?)\s+\*\*/g, '**$1**')
        // Fix: **** -> (Empty bold)
        .replace(/\*\*\*\*/g, '')
        // Fix: Repeated newlines to max 2
        .replace(/\n{3,}/g, '\n\n')
        // Clean up common artifacts
        .replace(/^[ \t]+#+/gm, (match) => match.trim());
};

// Remove All Markdown Syntax for Pure Text Copy
const removeMarkdownSyntax = (text: string) => {
    if (!text) return '';
    return text
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove Bold
        .replace(/\*(.*?)\*/g, '$1')     // Remove Italic
        .replace(/^#+\s/gm, '')          // Remove Headers
        .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove Links
        .replace(/>\s?/g, '')            // Remove Blockquotes
        .replace(/`/g, '')               // Remove Code ticks
        .replace(/- \[( |x)\]/g, '•')    // Replace checkboxes
        .replace(/^-\s/gm, '• ');        // Replace bullets
};

// Helper component for Table Copy
const TableRenderer = (props: any) => {
    const tableRef = useRef<HTMLTableElement>(null);

    const handleCopyTable = () => {
        if (tableRef.current) {
            // Excel 호환을 위해 HTML 타입으로 클립보드에 복사
            const range = document.createRange();
            range.selectNode(tableRef.current);
            const selection = window.getSelection();
            if (selection) {
                selection.removeAllRanges();
                selection.addRange(range);
                // Execute copy
                try {
                   document.execCommand('copy');
                   alert('표가 복사되었습니다. 엑셀에 붙여넣기(Ctrl+V) 하세요.');
                } catch (e) {
                   alert('복사에 실패했습니다.');
                }
                selection.removeAllRanges();
            }
        }
    };

    return (
        <div className="relative group my-8">
            <button 
                onClick={handleCopyTable}
                className="absolute -top-8 right-0 bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 z-10"
                title="엑셀 붙여넣기용 복사"
            >
                <Copy size={12}/> 표 복사 (Excel용)
            </button>
            <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm">
                <table ref={tableRef} className="w-full text-sm border-collapse" {...props} />
            </div>
        </div>
    );
};

// Custom H2 Renderer for Visual Hierarchy
const H2Renderer = (props: any) => (
    <h2 className="text-2xl font-bold text-slate-800 mt-10 mb-4 pb-2 border-b-2 border-slate-100 flex items-center gap-2" {...props} />
);

// Custom Blockquote for Tip/Warning
const BlockquoteRenderer = (props: any) => {
    const text = getTextFromChildren(props.children);
    let className = "border-l-4 pl-4 py-2 my-6 text-slate-700 bg-slate-50 italic";
    let icon = null;

    if (text.includes("Tip") || text.includes("팁")) {
        className = "bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg not-italic text-slate-700 my-6 shadow-sm";
        icon = <span className="font-bold text-blue-600 mr-2">💡 Tip:</span>;
    } else if (text.includes("주의") || text.includes("경고")) {
        className = "bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg not-italic text-slate-700 my-6 shadow-sm";
        icon = <span className="font-bold text-red-600 mr-2">⚠️ 주의:</span>;
    }

    return (
        <blockquote className={className}>
            {icon ? <div>{icon}{props.children}</div> : props.children}
        </blockquote>
    );
};

const ContentGenerator: React.FC<ContentGeneratorProps> = ({ config, existingResult, onComplete, onBack, onDelete }) => {
  const [loading, setLoading] = useState(!existingResult);
  const [result, setResult] = useState<ContentPackage | null>(existingResult || null);
  const [activeTab, setActiveTab] = useState<'blog' | 'structure' | 'shorts' | 'images' | 'seo' | 'factcheck'>('blog');
  const [error, setError] = useState<string | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentBody, setCurrentBody] = useState('');
  
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (existingResult) {
        setResult(existingResult);
        setCurrentBody(cleanMarkdown(existingResult.blogPost.body));
        setLoading(false);
        return;
    }

    const fetchContent = async () => {
      try {
        setLoading(true);
        const data = await generateContentPackage(config);
        setResult(data);
        setCurrentBody(cleanMarkdown(data.blogPost.body));
        if (onComplete) onComplete(data);
      } catch (err) {
        console.error(err);
        setError("컨텐츠 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [config]);

  const handleSaveEdit = () => {
    setIsEditing(false);
    if (result) {
        const updatedResult = {
            ...result,
            blogPost: {
                ...result.blogPost,
                body: currentBody
            }
        };
        setResult(updatedResult);
        if (onComplete) onComplete(updatedResult); 
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('복사되었습니다.');
  };

  const handleCleanTextCopy = () => {
      const cleanText = removeMarkdownSyntax(currentBody);
      navigator.clipboard.writeText(cleanText);
      alert('서식이 제거된 순수 텍스트가 복사되었습니다.\n(제목, ** 표시 등 제거됨)');
  }

  const handleSmartCopy = async () => {
    if (!contentRef.current) return;
    
    if (isEditing) {
        alert('편집 모드를 완료한 후 복사해주세요.');
        return;
    }

    try {
        const range = document.createRange();
        range.selectNode(contentRef.current);
        const selection = window.getSelection();
        if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
            
            const htmlBlob = new Blob([contentRef.current.innerHTML], { type: 'text/html' });
            const textBlob = new Blob([contentRef.current.innerText], { type: 'text/plain' });
            
            await navigator.clipboard.write([
                new ClipboardItem({
                    'text/html': htmlBlob,
                    'text/plain': textBlob,
                }),
            ]);
            
            selection.removeAllRanges();
            alert('✅ 스마트 복사 완료!\n\n블로그 에디터(네이버/워드프레스)에 붙여넣기(Ctrl+V) 하세요.\n박스, 표, 리스트 등 서식이 그대로 유지됩니다.');
        }
    } catch (err) {
        console.error('Smart Copy Failed', err);
        alert('스마트 복사에 실패했습니다. 일반 텍스트 복사를 사용해주세요.');
    }
  };

  const handleDelete = () => {
    if (onDelete && confirm('정말로 이 컨텐츠를 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다.')) {
      onDelete();
    }
  };

  const handleDownloadHTML = () => {
    if (!result) return;
    const bodyToDownload = isEditing ? currentBody : result.blogPost.body;
    
    // Banner HTML construction if exists
    const bannerHtml = result.blogPost.bannerConfig ? `
       <div style="margin-top: 50px; padding: 40px; background-color: ${result.blogPost.bannerConfig.bgColor}; border-radius: 16px; text-align: center; color: white;">
           <div style="font-size: 16px; opacity: 0.9; margin-bottom: 8px;">${result.blogPost.bannerConfig.subCopy}</div>
           <div style="font-size: 28px; font-weight: bold; margin-bottom: 24px;">${result.blogPost.bannerConfig.mainCopy}</div>
           <a href="https://www.certbiz.com" target="_blank" style="display: inline-block; padding: 15px 30px; background-color: white; color: ${result.blogPost.bannerConfig.bgColor}; font-weight: bold; text-decoration: none; border-radius: 8px;">${result.blogPost.bannerConfig.ctaText}</a>
       </div>
    ` : '';
    
    const element = document.createElement("a");
    const file = new Blob(
      [`
        <!DOCTYPE html>
        <html lang="ko">
          <head>
            <meta charset="utf-8">
            <title>${result.blogPost.title}</title>
            <style>
                body { 
                    font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; 
                    line-height: 1.8; 
                    max-width: 800px; 
                    margin: 0 auto; 
                    padding: 40px; 
                    color: #1f2937; 
                    background-color: #fff;
                }
                /* Headings */
                h1 { font-size: 36px; color: #111; margin-bottom: 30px; letter-spacing: -1px; border-bottom: 4px solid #111; padding-bottom: 20px; line-height: 1.3; }
                h2 { font-size: 28px; color: #1e3a8a; margin-top: 60px; margin-bottom: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; font-weight: 800; }
                h3 { font-size: 22px; color: #334155; margin-top: 40px; margin-bottom: 16px; font-weight: 700; border-left: 5px solid #3b82f6; padding-left: 12px; }
                p { margin-bottom: 24px; font-size: 17px; word-break: keep-all; color: #374151; }
                
                /* Lists */
                ul, ol { margin-bottom: 24px; padding-left: 24px; }
                li { margin-bottom: 10px; font-size: 17px; }

                /* Custom Blocks */
                .lead-section { background-color: #eff6ff; padding: 30px; border-radius: 12px; margin-bottom: 50px; border: 1px solid #dbeafe; }
                .lead-text { font-size: 19px; font-weight: 600; color: #1e40af; line-height: 1.6; }
                .tip-box { background: #f0f9ff; border-left: 5px solid #0ea5e9; padding: 20px; margin: 30px 0; border-radius: 4px; }
                .warning-box { background: #fef2f2; border-left: 5px solid #ef4444; padding: 20px; margin: 30px 0; border-radius: 4px; }
                .image-guide { background: #f3e8ff; border: 1px dashed #d8b4fe; padding: 15px; margin: 30px 0; font-size: 14px; color: #6b21a8; text-align: center; border-radius: 8px; }
                .qna-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 30px 0; }
                .case-box { background: #f8fafc; border: 1px solid #e2e8f0; border-left: 5px solid #64748b; padding: 20px; margin: 30px 0; }
                
                /* Table */
                table { border-collapse: collapse; width: 100%; margin: 30px 0; font-size: 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                th, td { border: 1px solid #cbd5e1; padding: 12px 15px; text-align: left; }
                th { background-color: #f1f5f9; font-weight: bold; color: #334155; }
                tr:nth-child(even) { background-color: #f8fafc; }
                
                strong { color: #000; font-weight: 800; }
            </style>
          </head>
          <body>
            <h1>${result.blogPost.title}</h1>
            
            <div class="lead-section">
                <div class="lead-text">${result.blogPost.lead}</div>
            </div>

            ${bodyToDownload
                .replace(/> 💡 \*\*Tip:\*\* (.*)/g, '<div class="tip-box"><strong>💡 Tip:</strong> $1</div>')
                .replace(/> ⚠️ \*\*주의:\*\* (.*)/g, '<div class="warning-box"><strong>⚠️ 주의:</strong> $1</div>')
                .replace(/> 🖼️ \*\*\[이미지 삽입\]:\*\* (.*)/g, '<div class="image-guide">📷 이미지 삽입: $1</div>')
                .replace(/> ❓ \*\*Q&A:\*\* (.*)/g, '<div class="qna-box"><strong>❓ Q&A:</strong> $1</div>')
                .replace(/> 🏢 \*\*실제 사례:\*\* (.*)/g, '<div class="case-box"><strong>🏢 실제 사례:</strong> $1</div>')
                // Basic Markdown Parsing for HTML export
                .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n\n/g, '<br/><br/>')
            }

            ${bannerHtml}
          </body>
        </html>
      `], 
      {type: 'text/html'}
    );
    element.href = URL.createObjectURL(file);
    element.download = `${result.blogPost.title}.html`;
    document.body.appendChild(element);
    element.click();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] text-center space-y-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-bold text-blue-600 text-sm">AI</div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-800">SEO 컨텐츠 패키지 생성 중...</h2>
          <p className="text-slate-500">
            주제: {config.topic}<br/>
            Google Search로 최신 법령/세율을 확인하고 구조화된 정보를 설계합니다.<br/>
            <span className="text-blue-600 font-bold text-xs mt-1 block">✨ 정보 80% : 홍보 20% 황금 비율 최적화 중</span>
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-red-500">
        <p className="text-xl font-bold mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="px-6 py-2 bg-slate-800 text-white rounded-lg">다시 시도</button>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm font-bold mb-3 transition-colors">
             <ArrowLeft size={16}/> 목록으로 돌아가기
          </button>
          <div className="flex items-center gap-2 mb-2">
             <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">생성 완료</span>
             <span className="text-xs text-slate-400 font-mono">{new Date().toLocaleDateString()}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 leading-tight">{result.blogPost.title}</h1>
        </div>
        <div className="flex gap-2">
           {existingResult && onDelete && (
             <button onClick={handleDelete} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 text-red-500 rounded-lg hover:bg-red-50 hover:border-red-200 font-medium transition-colors" title="이 기록 삭제">
               <Trash2 size={18}/>
             </button>
           )}
           <button onClick={handleDownloadHTML} className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 font-medium text-sm">
             <Download size={18}/> HTML 다운로드
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Tabs */}
        <div className="lg:col-span-1 space-y-2">
          {[
            { id: 'blog', label: '블로그 원고', icon: FileText },
            { id: 'structure', label: '기획 의도/구조', icon: GitMerge },
            { id: 'factcheck', label: '팩트체크/출처', icon: ShieldCheck }, 
            { id: 'images', label: '이미지 작업지시서', icon: ImageIcon },
            { id: 'shorts', label: 'Shorts 시나리오', icon: Youtube },
            { id: 'seo', label: 'SEO 분석/메타', icon: Tag },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-300 ring-offset-2'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <tab.icon size={20} />
                <span className="font-bold">{tab.label}</span>
              </div>
              <ChevronRight size={16} className={activeTab === tab.id ? 'opacity-100' : 'opacity-0'} />
            </button>
          ))}
          
          <div className="mt-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
             <h4 className="font-bold text-slate-700 text-sm mb-2">SEO 요약</h4>
             <p className="text-xs text-slate-600 leading-relaxed">{result.blogPost.seoAnalysis}</p>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[600px] p-6 md:p-8">
           
           {/* 1. Blog Post */}
           {activeTab === 'blog' && (
             <div className="space-y-6">
               {/* Copy Toolbar */}
               <div className="flex flex-wrap justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 gap-3">
                 <div className="text-xs text-slate-500 font-mono pl-2">
                    공백포함 <span className="font-bold text-slate-900">{currentBody.length}자</span>
                 </div>
                 <div className="flex gap-2">
                    <button 
                        onClick={() => {
                            if (isEditing) handleSaveEdit();
                            else setIsEditing(true);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1 transition-colors ${
                            isEditing 
                            ? 'bg-green-600 text-white hover:bg-green-700' 
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        {isEditing ? <><Save size={14}/> 저장 완료</> : <><Edit size={14}/> 원문 수정</>}
                    </button>
                    
                    <button 
                        onClick={handleCleanTextCopy} 
                        disabled={isEditing}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 text-xs font-bold hover:bg-slate-50 flex items-center gap-1 disabled:opacity-50"
                        title="서식 기호(*, # 등)를 모두 제거하고 텍스트만 복사합니다"
                    >
                        <Eraser size={14}/> 텍스트만 복사
                    </button>

                    <button 
                        onClick={handleSmartCopy}
                        disabled={isEditing}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 shadow-sm flex items-center gap-1 disabled:opacity-50"
                    >
                        <Scissors size={14}/> 스마트 복사 (서식 유지)
                    </button>
                 </div>
               </div>

               {/* Rendered Content Area */}
               <div ref={contentRef} className="bg-white p-2">
                    {/* H1 Title */}
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-8 pb-4 border-b-4 border-slate-900 leading-tight">
                        {result.blogPost.title}
                    </h1>

                    {/* Lead Section */}
                    <div className="mb-10 p-8 bg-blue-50 rounded-2xl border border-blue-100 not-prose relative overflow-hidden lead-section">
                        <p className="text-xl text-blue-900 font-bold leading-relaxed relative z-10">
                            {result.blogPost.lead}
                        </p>
                    </div>

                    {isEditing ? (
                        <div className="w-full">
                            <textarea
                                value={currentBody}
                                onChange={(e) => setCurrentBody(e.target.value)}
                                className="w-full h-[600px] p-4 font-mono text-sm leading-relaxed border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-slate-50"
                                placeholder="마크다운 내용을 직접 수정하세요."
                            />
                            <div className="mt-2 text-center">
                                <button onClick={handleSaveEdit} className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700">
                                    편집 완료 및 적용
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                        <div className="prose prose-lg max-w-none prose-headings:text-slate-800 prose-headings:font-bold prose-p:text-slate-600 prose-p:leading-8 prose-li:text-slate-600 prose-strong:text-slate-900 prose-strong:font-extrabold">
                            <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    table: TableRenderer,
                                    h2: H2Renderer,
                                    blockquote: BlockquoteRenderer,
                                    a: ({node, ...props}) => <a className="text-blue-600 hover:text-blue-800 underline font-bold" {...props} />
                                }}
                            >
                                {currentBody}
                            </ReactMarkdown>
                        </div>
                        
                        {/* Banner Preview Area */}
                        {result.blogPost.bannerConfig && (
                           <div className="mt-16 not-prose">
                               <div className="flex items-center gap-2 mb-3">
                                  <Megaphone size={20} className="text-slate-400" />
                                  <span className="text-sm font-bold text-slate-500">생성된 배너 시안 (하단 삽입용)</span>
                               </div>
                               <div 
                                 className="rounded-2xl p-10 text-center text-white shadow-lg flex flex-col items-center justify-center gap-6"
                                 style={{ backgroundColor: result.blogPost.bannerConfig.bgColor }}
                               >
                                  <div className="space-y-2">
                                     <p className="text-lg opacity-90 font-medium">{result.blogPost.bannerConfig.subCopy}</p>
                                     <h3 className="text-3xl font-extrabold leading-tight">{result.blogPost.bannerConfig.mainCopy}</h3>
                                  </div>
                                  <a 
                                    href="https://www.certbiz.com" 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="px-8 py-4 bg-white rounded-xl font-bold text-lg shadow-md hover:scale-105 transition-transform"
                                    style={{ color: result.blogPost.bannerConfig.bgColor }}
                                  >
                                    {result.blogPost.bannerConfig.ctaText}
                                  </a>
                               </div>
                           </div>
                        )}
                        </>
                    )}
               </div>
             </div>
           )}

           {/* 2. Structure */}
           {activeTab === 'structure' && (
              <div className="space-y-6">
                 <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <GitMerge className="text-blue-600"/> 컨텐츠 설계 구조
                 </h3>
                 <div className="space-y-4">
                    {result.structure?.map((item, idx) => (
                        <div key={idx} className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                           <div className="flex flex-col items-center gap-2 min-w-[60px]">
                              <span className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-sm">
                                {idx + 1}
                              </span>
                              <div className="h-full w-0.5 bg-slate-200"></div>
                           </div>
                           <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                 <span className="font-bold text-slate-900">{item.stage}</span>
                                 <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-xs text-slate-500">{item.intent}</span>
                              </div>
                              <p className="text-sm text-slate-700 mb-3">{item.contentSummary}</p>
                              <div className="flex flex-wrap gap-2">
                                 {item.keywordsUsed?.map((k, i) => (
                                     <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md font-medium">#{k}</span>
                                 ))}
                              </div>
                           </div>
                        </div>
                    ))}
                 </div>
              </div>
           )}

           {/* 3. Fact Check & Sources */}
           {activeTab === 'factcheck' && (
             <div className="space-y-8">
                {/* Grounding Links (Google Search Results) */}
                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                   <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                      <Globe size={20}/> AI가 참조한 실제 출처 (Google Search)
                   </h3>
                   {result.groundingLinks && result.groundingLinks.length > 0 ? (
                       <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {result.groundingLinks.map((link, idx) => (
                              <li key={idx}>
                                  <a 
                                    href={link.url} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-400 hover:shadow-sm transition-all group"
                                  >
                                      <div className="p-2 bg-blue-50 rounded-full text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                          <ExternalLink size={16}/>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                          <p className="text-sm font-bold text-slate-800 truncate group-hover:text-blue-700">{link.title}</p>
                                          <p className="text-xs text-slate-400 truncate">{link.url}</p>
                                      </div>
                                  </a>
                              </li>
                          ))}
                       </ul>
                   ) : (
                       <div className="text-center py-8 text-blue-400">
                          <p>참조된 외부 링크가 없습니다. (내부 지식 기반 생성)</p>
                       </div>
                   )}
                </div>

                {/* Fact Check Report */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                   <div className="p-4 bg-slate-50 border-b border-slate-200">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                         <ShieldCheck className="text-green-600"/> 팩트체크 리포트 (Fact-Check)
                      </h3>
                   </div>
                   <div className="divide-y divide-slate-100">
                      {result.factCheck?.map((fact, idx) => (
                          <div key={idx} className="p-5 flex flex-col md:flex-row gap-4 md:items-start">
                             <div className="flex-1">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Verification Item</p>
                                <p className="font-bold text-slate-800 text-lg">{fact.item}</p>
                             </div>
                             <div className="flex-[2]">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Result & Source</p>
                                <p className="text-slate-700 mb-2">{fact.result}</p>
                                <div className="flex items-center gap-2">
                                   <span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-600 flex items-center gap-1">
                                      <Check size={12}/> {fact.source}
                                   </span>
                                   {fact.status === 'Verified' && <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">검증됨</span>}
                                   {fact.status === 'Corrected' && <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-bold">수정됨</span>}
                                </div>
                             </div>
                          </div>
                      ))}
                   </div>
                </div>
             </div>
           )}

           {/* 4. Images */}
           {activeTab === 'images' && (
               <div className="space-y-6">
                  <div className="flex items-center justify-between">
                     <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <ImageIcon className="text-purple-600"/> 이미지 생성 가이드
                     </h3>
                     <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                        Concept: {result.config.designConcept}
                     </span>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                     {result.imagePrompts?.map((img, idx) => (
                         <div key={idx} className="bg-slate-50 p-5 rounded-xl border border-slate-200 hover:border-purple-300 transition-colors">
                             <div className="flex justify-between items-start mb-3">
                                <span className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs font-bold">
                                   #{idx + 1}번 이미지 (문단 {img.paragraphIndex} 근처)
                                </span>
                                <button onClick={() => copyToClipboard(img.englishPrompt)} className="text-slate-400 hover:text-purple-600 flex items-center gap-1 text-xs">
                                   <Copy size={12}/> 영문 프롬프트 복사
                                </button>
                             </div>
                             <div className="space-y-3">
                                <div>
                                   <p className="text-xs font-bold text-slate-500 mb-1">Korean Description</p>
                                   <p className="text-sm text-slate-800 font-medium">{img.koreanPrompt}</p>
                                </div>
                                <div className="bg-white p-3 rounded border border-slate-200 font-mono text-xs text-slate-600">
                                   {img.englishPrompt}
                                </div>
                             </div>
                         </div>
                     ))}
                  </div>
               </div>
           )}

           {/* 5. Shorts Script */}
           {activeTab === 'shorts' && (
              <div className="space-y-6">
                 <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Youtube className="text-red-600"/> 유튜브 숏츠 시나리오 (30초)
                 </h3>
                 <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-900 p-4 text-white">
                       <h4 className="font-bold">{result.shortsScript?.title}</h4>
                    </div>
                    <div className="divide-y divide-slate-100">
                       {result.shortsScript?.scenes.map((scene, idx) => (
                           <div key={idx} className="p-4 flex gap-4">
                              <div className="w-16 text-center shrink-0">
                                 <span className="block text-lg font-bold text-slate-300">#{idx + 1}</span>
                                 <span className="text-xs font-mono text-red-500">{scene.time}</span>
                              </div>
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <p className="text-xs font-bold text-slate-400 mb-1 flex items-center gap-1"><Monitor size={10}/> Visual (화면)</p>
                                    <p className="text-sm text-slate-700">{scene.visual}</p>
                                 </div>
                                 <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                    <p className="text-xs font-bold text-blue-400 mb-1 flex items-center gap-1"><Megaphone size={10}/> Audio (내레이션)</p>
                                    <p className="text-sm text-slate-800 font-medium">"{scene.audio}"</p>
                                 </div>
                              </div>
                           </div>
                       ))}
                    </div>
                 </div>
              </div>
           )}

           {/* 6. SEO Meta */}
           {activeTab === 'seo' && (
              <div className="space-y-6">
                 <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Tag className="text-green-600"/> 메타 태그 & 키워드
                 </h3>
                 <div className="bg-slate-900 rounded-xl p-6 text-slate-300 font-mono text-sm space-y-4 shadow-lg">
                    <div>
                       <span className="text-purple-400 block mb-1">&lt;title&gt;</span>
                       <div className="text-white pl-4 border-l-2 border-purple-500">{result.seoMeta.metaTitle}</div>
                    </div>
                    <div>
                       <span className="text-purple-400 block mb-1">&lt;meta name="description"&gt;</span>
                       <div className="text-white pl-4 border-l-2 border-purple-500">{result.seoMeta.metaDescription}</div>
                    </div>
                    <div>
                       <span className="text-purple-400 block mb-1">&lt;meta name="keywords"&gt;</span>
                       <div className="text-white pl-4 border-l-2 border-purple-500">{result.seoMeta.mainKeywords.join(', ')}, {result.seoMeta.subKeywords.join(', ')}</div>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-5 rounded-xl border border-slate-200">
                       <h4 className="font-bold text-slate-700 mb-3 text-sm">추천 해시태그</h4>
                       <div className="flex flex-wrap gap-2">
                          {result.seoMeta.hashtags.map((tag, i) => (
                             <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs hover:bg-blue-100 hover:text-blue-600 transition-colors cursor-pointer">
                                {tag}
                             </span>
                          ))}
                       </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-slate-200">
                       <h4 className="font-bold text-slate-700 mb-3 text-sm">구조화된 데이터 (JSON-LD)</h4>
                       <pre className="text-[10px] bg-slate-50 p-2 rounded border border-slate-100 overflow-x-auto">
                          {JSON.stringify(result.seoMeta.structuredData, null, 2)}
                       </pre>
                    </div>
                 </div>
              </div>
           )}

        </div>
      </div>
    </div>
  );
};

export default ContentGenerator;
