import { useState } from 'react';
import { studyAPI } from '../lib/api';
import { AILoader, ErrorMessage } from './ui';
import { Bell, Plus, Trash2, AlertTriangle, TrendingUp, Zap } from 'lucide-react';

const PRIORITY_CONFIG = {
  critical: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: '🚨' },
  high: { color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', icon: '⚠️' },
  medium: { color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', icon: '📌' },
  low: { color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', icon: '📗' },
};

const FREQUENCY_BADGE = {
  'very likely': 'badge-red',
  'likely': 'badge-yellow',
  'possible': 'badge-blue',
};

export default function ExamAlerts() {
  const [subject, setSubject] = useState('');
  const [topics, setTopics] = useState(['']);
  const [syllabus, setSyllabus] = useState('');
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const addTopic = () => setTopics([...topics, '']);
  const removeTopic = (i) => setTopics(topics.filter((_, idx) => idx !== i));
  const updateTopic = (i, v) => { const t = [...topics]; t[i] = v; setTopics(t); };

  async function handleGenerate() {
    const validTopics = topics.filter(t => t.trim());
    if (!subject.trim()) { setError('Please enter a subject'); return; }
    if (validTopics.length === 0) { setError('Add at least one topic'); return; }

    setError('');
    setLoading(true);

    try {
      const res = await studyAPI.getExamAlerts({ subject, topics: validTopics, syllabus });
      setAlerts(res.alerts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredAlerts = filter === 'all' ? alerts : alerts.filter(a => a.priority === filter);
  const criticalCount = alerts.filter(a => a.priority === 'critical').length;
  const highCount = alerts.filter(a => a.priority === 'high').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Config */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card space-y-4">
          <h3 className="section-title text-sm">
            <Bell className="w-4 h-4 text-ibm-blue-light" />
            Alert Configuration
          </h3>

          <div>
            <label className="label">Subject</label>
            <input value={subject} onChange={e => setSubject(e.target.value)}
              className="input" placeholder="e.g. Computer Networks" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Topics</label>
              <button onClick={addTopic} className="btn-ghost text-xs py-0.5">
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            <div className="space-y-2">
              {topics.map((topic, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={topic} onChange={e => updateTopic(i, e.target.value)}
                    className="input flex-1 text-xs" placeholder={`Topic ${i + 1}`} />
                  {topics.length > 1 && (
                    <button onClick={() => removeTopic(i)} className="btn-ghost py-2 px-2 text-red-400">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Syllabus Context (optional)</label>
            <textarea value={syllabus} onChange={e => setSyllabus(e.target.value)}
              className="textarea text-xs min-h-[80px]" placeholder="Paste your syllabus for more accurate predictions..." />
          </div>

          {error && <ErrorMessage error={error} />}

          <button onClick={handleGenerate} disabled={loading} className="btn-primary w-full justify-center">
            {loading ? '⟳ Analyzing...' : '🔮 Generate Exam Alerts'}
          </button>
        </div>

        {/* Alerts Panel */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="card">
              <AILoader message="IBM Granite is analyzing exam patterns..." />
            </div>
          ) : alerts.length > 0 ? (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="card bg-red-500/5 border-red-500/20 text-center py-3">
                  <p className="text-2xl font-bold text-red-400">{criticalCount}</p>
                  <p className="text-xs text-gray-500">Critical</p>
                </div>
                <div className="card bg-orange-500/5 border-orange-500/20 text-center py-3">
                  <p className="text-2xl font-bold text-orange-400">{highCount}</p>
                  <p className="text-xs text-gray-500">High Priority</p>
                </div>
                <div className="card bg-ibm-blue/5 border-ibm-blue/20 text-center py-3">
                  <p className="text-2xl font-bold text-ibm-blue-light">{alerts.length}</p>
                  <p className="text-xs text-gray-500">Total Topics</p>
                </div>
              </div>

              {/* Filter */}
              <div className="flex items-center gap-2 flex-wrap">
                {['all', 'critical', 'high', 'medium', 'low'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 text-xs rounded-full capitalize transition-colors ${
                      filter === f
                        ? 'bg-ibm-blue text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {f === 'all' ? `All (${alerts.length})` : f}
                  </button>
                ))}
              </div>

              {/* Alert Cards */}
              <div className="space-y-3">
                {filteredAlerts.map((alert, i) => {
                  const config = PRIORITY_CONFIG[alert.priority] || PRIORITY_CONFIG.medium;
                  return (
                    <div key={i} className={`card ${config.bg} animate-slide-up`}>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <span>{config.icon}</span>
                          <div>
                            <p className={`text-sm font-semibold ${config.color}`}>{alert.topic}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`badge ${FREQUENCY_BADGE[alert.examFrequency] || 'badge-blue'} text-xs`}>
                                {alert.examFrequency}
                              </span>
                              {alert.estimatedMark && (
                                <span className="badge bg-gray-700/50 text-gray-400 text-xs">
                                  {alert.estimatedMark}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className={`badge ${config.bg.replace('bg-', 'bg-').split(' ')[0]} ${config.color} capitalize text-xs border`}>
                          {alert.priority}
                        </span>
                      </div>

                      {alert.reason && (
                        <p className="text-xs text-gray-400 mb-2">
                          <strong className="text-gray-300">Why it matters:</strong> {alert.reason}
                        </p>
                      )}

                      {alert.preparationTip && (
                        <div className="flex items-start gap-1.5 bg-black/20 rounded-sm px-3 py-2 mt-2">
                          <Zap className="w-3 h-3 text-ibm-blue-light shrink-0 mt-0.5" />
                          <p className="text-xs text-gray-300">{alert.preparationTip}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="card flex flex-col items-center justify-center min-h-64 gap-3 text-center">
              <div className="text-4xl opacity-30">🔮</div>
              <p className="text-sm text-gray-500">Predictive exam alerts will appear here</p>
              <p className="text-xs text-gray-600">IBM Granite analyzes patterns to predict high-priority topics</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
