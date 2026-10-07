import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Summarizer from './components/Summarizer';
import FlashcardDeck from './components/FlashcardDeck';
import StudyPlanner from './components/StudyPlanner';
import QuizArena from './components/QuizArena';
import ConceptMapper from './components/ConceptMapper';
import AskAI from './components/AskAI';
import ExamAlerts from './components/ExamAlerts';
import Header from './components/Header';

const PAGES = {
  dashboard: Dashboard,
  summarizer: Summarizer,
  flashcards: FlashcardDeck,
  planner: StudyPlanner,
  quiz: QuizArena,
  concepts: ConceptMapper,
  ask: AskAI,
  alerts: ExamAlerts,
};

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [content, setContent] = useState(''); // Shared content state across tools

  const PageComponent = PAGES[page] || Dashboard;

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <Sidebar currentPage={page} onNavigate={setPage} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header currentPage={page} onNavigate={setPage} />
        <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
          <PageComponent
            sharedContent={content}
            onContentChange={setContent}
            onNavigate={setPage}
          />
        </main>
      </div>
    </div>
  );
}
