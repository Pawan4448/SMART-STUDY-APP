import {
  LayoutDashboard, FileText, CreditCard, Calendar, Brain,
  HelpCircle, Map, Bell, Sparkles, BookOpen
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'summarizer', label: 'Summarizer', icon: FileText },
  { id: 'flashcards', label: 'Flashcards', icon: CreditCard },
  { id: 'quiz', label: 'Quiz Arena', icon: Brain },
  { id: 'planner', label: 'Study Planner', icon: Calendar },
  { id: 'concepts', label: 'Concept Map', icon: Map },
  { id: 'ask', label: 'Ask AI', icon: HelpCircle },
  { id: 'alerts', label: 'Exam Alerts', icon: Bell },
];

export default function Sidebar({ currentPage, onNavigate }) {
  return (
    <aside className="w-60 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-ibm-blue rounded flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-100 leading-tight">StudyGen AI</div>
            <div className="text-xs text-gray-500 font-mono">IBM Granite</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-xs text-gray-600 uppercase tracking-wider font-medium px-1 mb-2">Tools</p>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={currentPage === id ? 'nav-item-active w-full text-left' : 'nav-item w-full text-left'}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-gray-800">
        <div className="flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-xs text-gray-500">Powered by IBM Cloud</span>
        </div>
      </div>
    </aside>
  );
}
