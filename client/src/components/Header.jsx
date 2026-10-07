import { Sparkles, Bell, User } from 'lucide-react';

const PAGE_TITLES = {
  dashboard: { title: 'Learning Dashboard', desc: 'Your study progress and insights' },
  summarizer: { title: 'AI Summarizer', desc: 'Convert any content into concise study notes' },
  flashcards: { title: 'Flashcard Generator', desc: 'Create smart flashcards with spaced repetition' },
  quiz: { title: 'Quiz Arena', desc: 'Test your knowledge with AI-generated quizzes' },
  planner: { title: 'Study Planner', desc: 'Personalized adaptive study schedule' },
  concepts: { title: 'Concept Mapper', desc: 'Visualize knowledge connections' },
  ask: { title: 'Ask AI Tutor', desc: 'Get instant answers from IBM Granite' },
  alerts: { title: 'Exam Alerts', desc: 'Predictive insights on high-priority topics' },
};

export default function Header({ currentPage }) {
  const info = PAGE_TITLES[currentPage] || PAGE_TITLES.dashboard;

  return (
    <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-base font-semibold text-gray-100">{info.title}</h1>
        <p className="text-xs text-gray-500 mt-0.5">{info.desc}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ibm-blue/10 border border-ibm-blue/20">
          <Sparkles className="w-3 h-3 text-ibm-blue-light" />
          <span className="text-xs font-medium text-ibm-blue-light">Granite AI Active</span>
        </div>
        <button className="w-8 h-8 rounded-full bg-ibm-purple/20 border border-ibm-purple/30 flex items-center justify-center">
          <User className="w-4 h-4 text-purple-400" />
        </button>
      </div>
    </header>
  );
}
