import { useState } from 'react';
import { studyAPI } from '../lib/api';
import { AILoader, ErrorMessage } from './ui';
import { Calendar, Plus, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';

const PRIORITY_STYLES = {
  high: 'text-red-400 bg-red-500/10 border-red-500/20',
  medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  low: 'text-green-400 bg-green-500/10 border-green-500/20',
};

export default function StudyPlanner() {
  const [subject, setSubject] = useState('');
  const [topics, setTopics] = useState(['']);
  const [examDate, setExamDate] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [weakAreas, setWeakAreas] = useState('');
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addTopic = () => setTopics([...topics, '']);
  const removeTopic = (i) => setTopics(topics.filter((_, idx) => idx !== i));
  const updateTopic = (i, v) => { const t = [...topics]; t[i] = v; setTopics(t); };

  async function handleGenerate() {
    const validTopics = topics.filter(t => t.trim());
    if (!subject.trim()) { setError('Please enter a subject'); return; }
    if (validTopics.length === 0) { setError('Please add at least one topic'); return; }
    if (!examDate) { setError('Please select your exam date'); return; }

    const examDays = Math.ceil((new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (examDays < 1) { setError('Exam date must be in the future'); return; }

    setError('');
    setLoading(true);

    try {
      const res = await studyAPI.generateStudyPlan({
        subject,
        topics: validTopics,
        examDate,
        hoursPerDay,
        weakAreas: weakAreas ? weakAreas.split(',').map(w => w.trim()).filter(Boolean) : []
      });
      setPlan(res.plan);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
      {/* Input */}
      <div className="space-y-4">
        <div className="card">
          <h3 className="section-title mb-4">
            <Calendar className="w-4 h-4 text-ibm-blue-light" />
            Plan Configuration
          </h3>

          <div className="space-y-4">
            <div>
              <label className="label">Subject / Course</label>
              <input value={subject} onChange={e => setSubject(e.target.value)}
                className="input" placeholder="e.g. Data Structures & Algorithms" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Topics to Cover</label>
                <button onClick={addTopic} className="btn-ghost text-xs py-0.5">
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>
              <div className="space-y-2">
                {topics.map((topic, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={topic}
                      onChange={e => updateTopic(i, e.target.value)}
                      className="input flex-1"
                      placeholder={`Topic ${i + 1}, e.g. Binary Trees`}
                    />
                    {topics.length > 1 && (
                      <button onClick={() => removeTopic(i)} className="btn-ghost py-2 px-2 text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Exam Date</label>
                <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)}
                  className="input" min={new Date().toISOString().split('T')[0]} />
              </div>
              <div>
                <label className="label">Hours per Day</label>
                <select value={hoursPerDay} onChange={e => setHoursPerDay(Number(e.target.value))} className="input">
                  {[1, 2, 3, 4, 5, 6, 8].map(h => (
                    <option key={h} value={h} className="bg-gray-800">{h} hour{h > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Weak Areas (optional)</label>
              <input value={weakAreas} onChange={e => setWeakAreas(e.target.value)}
                className="input" placeholder="e.g. Dynamic Programming, Graph Traversal (comma-separated)" />
            </div>

            {error && <ErrorMessage error={error} />}

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="btn-primary w-full justify-center"
            >
              {loading ? '⟳ Creating Plan...' : '📅 Generate Study Plan'}
            </button>
          </div>
        </div>
      </div>

      {/* Output */}
      <div className="space-y-4">
        {loading ? (
          <div className="card">
            <AILoader message="IBM Granite is creating your personalized plan..." />
          </div>
        ) : plan ? (
          <div className="space-y-4 animate-slide-up">
            {/* Overview */}
            {plan.overview && (
              <div className="card bg-ibm-blue/5 border-ibm-blue/20">
                <p className="text-xs font-semibold text-ibm-blue-light mb-1.5">Plan Overview</p>
                <p className="text-sm text-gray-300">{plan.overview}</p>
                {plan.totalHours && (
                  <p className="text-xs text-gray-500 mt-2">Total: ~{plan.totalHours} hours of study</p>
                )}
              </div>
            )}

            {/* Exam Alerts */}
            {plan.examAlerts?.length > 0 && (
              <div className="card border-yellow-500/20 bg-yellow-500/5">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
                  <p className="text-xs font-semibold text-yellow-400">Exam Focus Alerts</p>
                </div>
                <ul className="space-y-1">
                  {plan.examAlerts.map((alert, i) => (
                    <li key={i} className="text-xs text-yellow-300/80 flex items-start gap-1.5">
                      <span className="shrink-0">⚡</span> {alert}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Daily Plans */}
            {plan.dailyPlans?.length > 0 && (
              <div className="card">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Daily Schedule</p>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {plan.dailyPlans.map((day) => (
                    <div key={day.day} className={`p-3 rounded-sm border ${PRIORITY_STYLES[day.priority] || PRIORITY_STYLES.medium}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold">Day {day.day} — {day.date}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs opacity-70">{day.duration}</span>
                          <span className="badge text-xs" style={{ background: 'transparent' }}>{day.priority}</span>
                        </div>
                      </div>
                      <p className="text-xs font-medium mb-1.5">📖 {day.focus}</p>
                      <ul className="space-y-0.5">
                        {(day.tasks || []).map((task, ti) => (
                          <li key={ti} className="text-xs opacity-80 flex items-start gap-1">
                            <span>•</span> {task}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {plan.recommendations?.length > 0 && (
              <div className="card">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                  <p className="text-xs font-semibold text-green-400">AI Recommendations</p>
                </div>
                <ul className="space-y-1.5">
                  {plan.recommendations.map((rec, i) => (
                    <li key={i} className="text-xs text-gray-300 flex items-start gap-1.5">
                      <span className="shrink-0 text-green-400">✓</span> {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="card flex flex-col items-center justify-center min-h-64 gap-3 text-center">
            <div className="text-4xl opacity-30">📅</div>
            <p className="text-sm text-gray-500">Your personalized study plan will appear here</p>
            <p className="text-xs text-gray-600">IBM Granite will create a day-by-day adaptive schedule</p>
          </div>
        )}
      </div>
    </div>
  );
}
