import React from 'react';
import { LayoutDashboard, FileText, Search, ShieldCheck } from 'lucide-react';
import { AppMode } from '../types';

interface LayoutProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ currentMode, onModeChange, children }) => {
  const navItems = [
    { mode: AppMode.SEO_CHECK, label: 'SEO 점검', icon: Search, desc: '키워드 및 원고 분석' },
    { mode: AppMode.TOPIC_IDEA, label: '주제 추천', icon: LayoutDashboard, desc: '트렌드 기반 아이디어' },
    { mode: AppMode.CONTENT_GEN, label: '컨텐츠 생성', icon: FileText, desc: '블로그 원고 자동화' },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 fixed h-full z-10 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center text-white">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 leading-tight">인증센터</h1>
            <p className="text-xs text-slate-500">마케팅 SEO 마스터</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.mode}
              onClick={() => onModeChange(item.mode)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${
                currentMode === item.mode
                  ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon size={20} className={currentMode === item.mode ? 'text-blue-600' : 'text-slate-400'} />
              <div>
                <p className="font-medium text-sm">{item.label}</p>
                <p className="text-[10px] opacity-70">{item.desc}</p>
              </div>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-900 rounded-xl p-4 text-white text-xs">
            <p className="font-semibold mb-1">Gemini AI Powered</p>
            <p className="opacity-70">실시간 SEO 분석 및 컨텐츠 생성이 가능합니다.</p>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-white z-20 border-b border-slate-200 p-4 flex justify-between items-center">
         <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-blue-700"/>
            <span className="font-bold text-slate-800">인증센터 SEO</span>
         </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 max-w-[1920px] mx-auto w-full">
        {children}
      </main>
    </div>
  );
};

export default Layout;