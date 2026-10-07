import { useState } from 'react';
import { quizAPI } from '../lib/api';
import { AILoader, ErrorMessage, ContentInput } from './ui';
import { Brain, Check, X, Trophy, ArrowRight } from 'lucide-react';

const DIFFICULTY_OPTIONS = ['easy', 'medium', 'hard'];

export default function QuizArena({ sharedContent, onContentChange }) {
  const [content, setContent] = useState(sharedContent || '');
  const [subject, setSubject] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState('medium');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [phase, setPhase] = useState('setup'); // setup | quiz | results

  async function handleGenerate() {
    if (!content.trim()) { setError('Please enter content for the quiz'); return; }
    setError('');
    setLoading(true);
    setAnswers({});
    setResult(null);

    try {
      const res = await quizAPI.generate({ content, subject, questionCount, difficulty });
      setQuestions(res.questions);
      setPhase('quiz');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (Object.keys(answers).length < questions.length) {
      setError(`Please answer all ${questions.length} questions before submitting`);
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      // Build answers array indexed by question position
      const answersArray = questions.map((q, i) => answers[i]);
      const res = await quizAPI.submit({
        questions,
        answers: answersArray,
        subject,
        difficulty
      });
      setResult(res);
      setPhase('results');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleSelectAnswer(questionIdx, option) {
    // Extract just the letter (A, B, C, D)
    const letter = option.charAt(0).toUpperCase();
    setAnswers(prev => ({ ...prev, [questionIdx]: letter }));
  }

  if (phase === 'results' && result) {
    const scoreColor = result.percentage >= 75 ? 'text-green-400' : result.percentage >= 50 ? 'text-yellow-400' : 'text-red-400';

    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        {/* Score Card */}
        <div className="card text-center py-8 bg-gradient-to-b from-ibm-blue/10 to-transparent border-ibm-blue/20">
          <Trophy className="w-10 h-10 mx-auto mb-3 text-yellow-400" />
          <div className={`text-5xl font-bold ${scoreColor} mb-2`}>{result.percentage}%</div>
          <div className="text-xl font-semibold text-gray-200 mb-1">Grade: {result.grade}</div>
          <div className="text-sm text-gray-400 mb-4">{result.score} / {result.totalQuestions} correct</div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-full text-sm text-gray-300">
            {result.feedback}
          </div>
        </div>

        {/* Answer Review */}
        <div className="space-y-3">
          <h3 className="section-title">Detailed Results</h3>
          {result.results.map((r, i) => (
            <div key={i} className={`card ${r.isCorrect ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
              <div className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${r.isCorrect ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                  {r.isCorrect
                    ? <Check className="w-3.5 h-3.5 text-green-400" />
                    : <X className="w-3.5 h-3.5 text-red-400" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-200 mb-2">Q{i + 1}: {r.question}</p>
                  <div className="text-xs space-y-1">
                    <p>Your answer: <span className={r.isCorrect ? 'text-green-400' : 'text-red-400 line-through'}>{r.userAnswer}</span></p>
                    {!r.isCorrect && <p>Correct: <span className="text-green-400">{r.correctAnswer}</span></p>}
                    <p className="text-gray-400 mt-1.5 leading-relaxed">{r.explanation}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={() => { setPhase('quiz'); setAnswers({}); setResult(null); }} className="btn-secondary flex-1 justify-center">
            Retake Quiz
          </button>
          <button onClick={() => { setPhase('setup'); setQuestions([]); setAnswers({}); setResult(null); }} className="btn-primary flex-1 justify-center">
            New Quiz
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'quiz' && questions.length > 0) {
    const answered = Object.keys(answers).length;

    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <button onClick={() => setPhase('setup')} className="btn-ghost text-xs">← Back</button>
          <div className="text-xs text-gray-500">
            {answered} / {questions.length} answered
          </div>
        </div>

        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(answered / questions.length) * 100}%` }} />
        </div>

        <div className="space-y-4">
          {questions.map((q, i) => (
            <div key={q.id || i} className="card animate-slide-up">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="badge-blue">Q{i + 1}</span>
                  {q.topic && <span className="badge bg-gray-700/50 text-gray-400">{q.topic}</span>}
                </div>
                <span className={`badge ${q.difficulty === 'hard' ? 'badge-red' : q.difficulty === 'easy' ? 'badge-green' : 'badge-yellow'}`}>
                  {q.difficulty}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-100 mb-4">{q.question}</p>
              <div className="space-y-2">
                {q.options.map((option, oi) => {
                  const letter = option.charAt(0).toUpperCase();
                  const selected = answers[i] === letter;
                  return (
                    <button
                      key={oi}
                      onClick={() => handleSelectAnswer(i, option)}
                      className={`w-full text-left text-sm px-4 py-2.5 rounded-sm border transition-colors ${
                        selected
                          ? 'bg-ibm-blue/20 border-ibm-blue-light text-ibm-blue-light'
                          : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750 hover:border-gray-600'
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {error && <ErrorMessage error={error} />}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="btn-primary w-full justify-center py-3"
        >
          {submitting ? '⟳ Submitting...' : `Submit Quiz (${answered}/${questions.length} answered)`}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
      <div className="card">
        <h3 className="section-title mb-4">
          <Brain className="w-4 h-4 text-ibm-blue-light" />
          Quiz Configuration
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Subject</label>
              <input value={subject} onChange={e => setSubject(e.target.value)}
                className="input" placeholder="e.g. History" />
            </div>
            <div>
              <label className="label">Questions</label>
              <select value={questionCount} onChange={e => setQuestionCount(Number(e.target.value))} className="input">
                {[3, 5, 8, 10, 15].map(n => (
                  <option key={n} value={n} className="bg-gray-800">{n}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Difficulty</label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="input">
                {DIFFICULTY_OPTIONS.map(d => (
                  <option key={d} value={d} className="bg-gray-800 capitalize">{d.charAt(0).toUpperCase() + d.slice(1)}</option>
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
          {loading && <AILoader message="IBM Granite is crafting your quiz questions..." />}

          <button
            onClick={handleGenerate}
            disabled={loading || !content.trim()}
            className="btn-primary w-full justify-center"
          >
            {loading ? '⟳ Generating...' : '🧠 Generate Quiz'}
          </button>
        </div>
      </div>
    </div>
  );
}
