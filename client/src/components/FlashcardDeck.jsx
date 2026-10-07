import { useState } from 'react';
import { studyAPI, progressAPI } from '../lib/api';
import { AILoader, ErrorMessage, ContentInput } from './ui';
import { CreditCard, ChevronLeft, ChevronRight, Check, X, RotateCcw, Shuffle } from 'lucide-react';

const DIFFICULTY_COLORS = {
  easy: 'badge-green',
  medium: 'badge-yellow',
  hard: 'badge-red',
};

export default function FlashcardDeck({ sharedContent, onContentChange }) {
  const [content, setContent] = useState(sharedContent || '');
  const [subject, setSubject] = useState('');
  const [count, setCount] = useState(10);
  const [cards, setCards] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('generate'); // 'generate' | 'study'
  const [score, setScore] = useState({ known: 0, unknown: 0 });
  const [reviewed, setReviewed] = useState(new Set());

  async function handleGenerate() {
    if (!content.trim()) { setError('Please enter content first'); return; }
    setError('');
    setLoading(true);

    try {
      const res = await studyAPI.generateFlashcards({ content, subject, count });
      setCards(res.flashcards);
      setCurrentIdx(0);
      setFlipped(false);
      setScore({ known: 0, unknown: 0 });
      setReviewed(new Set());
      setMode('study');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleFlip() {
    setFlipped(!flipped);
  }

  function handleKnown() {
    const cardId = cards[currentIdx]?.id;
    progressAPI.recordFlashcard({ cardId, known: true }).catch(() => {});
    setScore(s => ({ ...s, known: s.known + 1 }));
    setReviewed(r => new Set([...r, currentIdx]));
    nextCard();
  }

  function handleUnknown() {
    const cardId = cards[currentIdx]?.id;
    progressAPI.recordFlashcard({ cardId, known: false }).catch(() => {});
    setScore(s => ({ ...s, unknown: s.unknown + 1 }));
    nextCard();
  }

  function nextCard() {
    setFlipped(false);
    setTimeout(() => {
      if (currentIdx < cards.length - 1) {
        setCurrentIdx(currentIdx + 1);
      }
    }, 150);
  }

  function prevCard() {
    setFlipped(false);
    setTimeout(() => {
      if (currentIdx > 0) {
        setCurrentIdx(currentIdx - 1);
      }
    }, 150);
  }

  function handleShuffle() {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIdx(0);
    setFlipped(false);
    setScore({ known: 0, unknown: 0 });
    setReviewed(new Set());
  }

  function handleRestart() {
    setCurrentIdx(0);
    setFlipped(false);
    setScore({ known: 0, unknown: 0 });
    setReviewed(new Set());
  }

  const allReviewed = reviewed.size >= cards.length && cards.length > 0;
  const card = cards[currentIdx];
  const progress = cards.length > 0 ? ((currentIdx) / cards.length) * 100 : 0;

  if (mode === 'study' && cards.length > 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={() => setMode('generate')} className="btn-ghost text-xs">
            ← Back to Generator
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">{currentIdx + 1} / {cards.length}</span>
            <button onClick={handleShuffle} className="btn-ghost py-1 text-xs">
              <Shuffle className="w-3 h-3" /> Shuffle
            </button>
            <button onClick={handleRestart} className="btn-ghost py-1 text-xs">
              <RotateCcw className="w-3 h-3" /> Restart
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span className="text-green-400">✓ Known: {score.known}</span>
            <span className="text-red-400">✗ Review: {score.unknown}</span>
          </div>
          <div className="progress-bar h-2">
            <div className="progress-fill bg-green-500" style={{ width: `${(reviewed.size / cards.length) * 100}%` }} />
          </div>
        </div>

        {/* Flashcard */}
        {!allReviewed ? (
          <>
            <div className="flashcard-container" style={{ height: 280 }}>
              <div
                className={`flashcard-inner w-full h-full cursor-pointer ${flipped ? 'flipped' : ''}`}
                onClick={handleFlip}
              >
                {/* Front */}
                <div className="flashcard-front card w-full h-full flex flex-col items-center justify-center p-8 text-center border-gray-700 hover:border-ibm-blue/40 transition-colors">
                  <div className="flex items-center gap-2 mb-4 absolute top-4 right-4">
                    {card?.topic && <span className="badge-blue">{card.topic}</span>}
                    {card?.difficulty && <span className={DIFFICULTY_COLORS[card.difficulty] || 'badge'}>{card.difficulty}</span>}
                  </div>
                  <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Question</p>
                  <p className="text-lg font-medium text-gray-100 leading-relaxed">{card?.front}</p>
                  <p className="text-xs text-gray-600 mt-6">Click to reveal answer</p>
                </div>

                {/* Back */}
                <div className="flashcard-back card w-full h-full flex flex-col items-center justify-center p-8 text-center bg-ibm-blue/5 border-ibm-blue/30">
                  <p className="text-xs text-ibm-blue-light mb-3 uppercase tracking-wider">Answer</p>
                  <p className="text-base text-gray-200 leading-relaxed">{card?.back}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {flipped && (
              <div className="flex gap-4 animate-slide-up">
                <button
                  onClick={handleUnknown}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-sm bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors font-medium"
                >
                  <X className="w-4 h-4" /> Need Review
                </button>
                <button
                  onClick={handleKnown}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-sm bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-colors font-medium"
                >
                  <Check className="w-4 h-4" /> I Know This!
                </button>
              </div>
            )}

            {!flipped && (
              <div className="flex gap-3">
                <button onClick={prevCard} disabled={currentIdx === 0} className="btn-ghost disabled:opacity-30">
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <button onClick={handleFlip} className="btn-primary flex-1 justify-center">
                  Flip Card
                </button>
                <button onClick={nextCard} disabled={currentIdx === cards.length - 1} className="btn-ghost disabled:opacity-30">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        ) : (
          /* Completion Screen */
          <div className="card text-center py-10 space-y-4 animate-slide-up">
            <div className="text-4xl">🎉</div>
            <h3 className="text-xl font-semibold text-gray-100">Deck Complete!</h3>
            <p className="text-gray-400 text-sm">You've reviewed all {cards.length} flashcards</p>
            <div className="flex justify-center gap-6 my-4">
              <div>
                <p className="text-2xl font-bold text-green-400">{score.known}</p>
                <p className="text-xs text-gray-500">Known</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-400">{score.unknown}</p>
                <p className="text-xs text-gray-500">Need Review</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-ibm-blue-light">
                  {Math.round((score.known / cards.length) * 100)}%
                </p>
                <p className="text-xs text-gray-500">Mastery</p>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <button onClick={handleRestart} className="btn-secondary">Study Again</button>
              <button onClick={() => setMode('generate')} className="btn-primary">New Deck</button>
            </div>
          </div>
        )}

        {/* Card List Preview */}
        <div className="card">
          <p className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wide">All Cards ({cards.length})</p>
          <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto">
            {cards.map((c, i) => (
              <button
                key={c.id}
                onClick={() => { setCurrentIdx(i); setFlipped(false); }}
                className={`text-left text-xs px-3 py-2 rounded-sm flex items-center gap-2 transition-colors ${
                  i === currentIdx ? 'bg-ibm-blue/20 text-ibm-blue-light' :
                  reviewed.has(i) ? 'bg-green-500/5 text-gray-500' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <span className="shrink-0 text-gray-600">#{i + 1}</span>
                <span className="truncate">{c.front}</span>
                {reviewed.has(i) && <Check className="w-3 h-3 text-green-500 ml-auto shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
      <div className="card">
        <h3 className="section-title mb-4">
          <CreditCard className="w-4 h-4 text-ibm-blue-light" />
          Generate Flashcards
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Subject</label>
              <input value={subject} onChange={e => setSubject(e.target.value)}
                className="input" placeholder="e.g. Biology" />
            </div>
            <div>
              <label className="label">Number of Cards</label>
              <select value={count} onChange={e => setCount(Number(e.target.value))} className="input">
                {[5, 10, 15, 20].map(n => (
                  <option key={n} value={n} className="bg-gray-800">{n} cards</option>
                ))}
              </select>
            </div>
          </div>

          <ContentInput
            value={content}
            onChange={(v) => { setContent(v); onContentChange?.(v); }}
            onFileLoad={(text) => { setContent(text); onContentChange?.(text); }}
          />

          {error && <ErrorMessage error={error} />}
          {loading && <AILoader message="Creating your flashcards with IBM Granite..." />}

          <button
            onClick={handleGenerate}
            disabled={loading || !content.trim()}
            className="btn-primary w-full justify-center"
          >
            {loading ? '⟳ Generating...' : '🃏 Generate Flashcards'}
          </button>
        </div>
      </div>
    </div>
  );
}
