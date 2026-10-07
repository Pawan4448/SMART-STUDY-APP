import { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart,
  PolarGrid, PolarAngleAxis, Radar
} from 'recharts';
import { progressAPI } from '../lib/api';
import { StatCard, AILoader, EmptyState } from './ui';
import { Trophy, Flame, Clock, Star, Target, TrendingUp, BookOpen, Zap } from 'lucide-react';

export default function Dashboard({ onNavigate }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchAnalytics() {
    try {
      const data = await progressAPI.get();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <AILoader message="Loading your dashboard..." />;

  const s = analytics?.summary || {};
  const weeklyActivity = analytics?.weeklyActivity || [];
  const scoreTrend = analytics?.scoreTrend || [];
  const subjectProgress = analytics?.subjectProgress || {};
  const milestones = analytics?.milestones || [];
  const weakAreas = analytics?.weakAreas || [];

  const subjectRadarData = Object.entries(subjectProgress).map(([name, data]) => ({
    subject: name.substring(0, 12),
    confidence: data.confidence || 50,
    time: Math.min(100, Math.round((data.timeSpent / 60) * 10)),
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="card bg-gradient-to-r from-ibm-blue/20 to-ibm-purple/10 border-ibm-blue/30">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-100">Welcome back, Student! 👋</h2>
            <p className="text-sm text-gray-400 mt-1">
              {s.streakDays > 0
                ? `🔥 You're on a ${s.streakDays}-day streak! Keep it going.`
                : 'Start studying to build your streak!'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Level {s.level || 1}</p>
            <p className="text-2xl font-bold text-ibm-blue-light">{s.totalXP || 0} XP</p>
          </div>
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Weekly Goal Progress</span>
            <span>{s.weeklyGoalProgress || 0}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${s.weeklyGoalProgress || 0}%` }} />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Study Time" value={`${Math.round((s.totalStudyTime || 0) / 60)}h`}
          sub={`${s.totalStudyTime || 0} min total`} color="blue" icon="⏱️" />
        <StatCard label="Sessions" value={s.sessionsCompleted || 0}
          sub="Completed" color="green" icon="📚" />
        <StatCard label="Avg Score" value={`${s.averageScore || 0}%`}
          sub="Quiz performance" color="purple" icon="🎯" />
        <StatCard label="Topics" value={s.topicsStudied || 0}
          sub="Explored" color="teal" icon="🗺️" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Weekly Activity */}
        <div className="card">
          <h3 className="section-title mb-4">
            <TrendingUp className="w-4 h-4 text-ibm-blue-light" />
            Weekly Study Activity
          </h3>
          {weeklyActivity.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={weeklyActivity}>
                <defs>
                  <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4589ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4589ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '6px' }}
                  labelStyle={{ color: '#d1d5db' }}
                  itemStyle={{ color: '#4589ff' }}
                />
                <Area type="monotone" dataKey="minutes" stroke="#4589ff" fill="url(#blueGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon="📊" title="No activity data yet" description="Start studying to see your progress chart" />
          )}
        </div>

        {/* Score Trend */}
        <div className="card">
          <h3 className="section-title mb-4">
            <Star className="w-4 h-4 text-yellow-400" />
            Quiz Score Trend
          </h3>
          {scoreTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={scoreTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="quiz" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '6px' }}
                  labelStyle={{ color: '#d1d5db' }}
                />
                <Line type="monotone" dataKey="score" stroke="#8a3ffc" strokeWidth={2} dot={{ fill: '#8a3ffc' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon="📈" title="No quiz scores yet" description="Take a quiz to see your performance trend" />
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Subject Radar */}
        <div className="card">
          <h3 className="section-title mb-4">
            <BookOpen className="w-4 h-4 text-teal-400" />
            Subject Confidence
          </h3>
          {subjectRadarData.length > 1 ? (
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={subjectRadarData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 10 }} />
                <Radar name="Confidence" dataKey="confidence" stroke="#009d9a" fill="#009d9a" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon="🎯" title="Study multiple subjects" description="Add different subjects to see radar" />
          )}
        </div>

        {/* Weak Areas */}
        <div className="card">
          <h3 className="section-title mb-4">
            <Zap className="w-4 h-4 text-orange-400" />
            Areas to Improve
          </h3>
          {weakAreas.length > 0 ? (
            <div className="space-y-3">
              {weakAreas.slice(0, 4).map(({ subject, confidence }) => (
                <div key={subject}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-300">{subject}</span>
                    <span className="text-orange-400 font-medium">{confidence}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${confidence}%`,
                        backgroundColor: confidence < 40 ? '#ef4444' : confidence < 60 ? '#f97316' : '#eab308'
                      }}
                    />
                  </div>
                </div>
              ))}
              <button onClick={() => onNavigate('planner')} className="btn-secondary text-xs w-full mt-2">
                Create Study Plan →
              </button>
            </div>
          ) : (
            <EmptyState icon="✅" title="No weak areas detected" description="Keep studying to get personalized insights" />
          )}
        </div>

        {/* Milestones */}
        <div className="card">
          <h3 className="section-title mb-4">
            <Trophy className="w-4 h-4 text-yellow-400" />
            Achievements
          </h3>
          {milestones.length > 0 ? (
            <div className="space-y-2">
              {milestones.slice(-5).reverse().map((m) => (
                <div key={m.id} className="flex items-center gap-2.5 p-2 bg-yellow-500/5 border border-yellow-500/10 rounded-sm">
                  <span className="text-base">{m.label.split(' ')[0]}</span>
                  <div>
                    <p className="text-xs font-medium text-gray-200">{m.label.substring(2)}</p>
                    <p className="text-xs text-yellow-400">+{m.xp} XP</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="🏆" title="No achievements yet" description="Study consistently to earn badges" />
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="section-title mb-4">
          <Target className="w-4 h-4 text-ibm-blue-light" />
          Quick Start
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { page: 'summarizer', icon: '📝', label: 'Summarize Notes', desc: 'Upload or paste content' },
            { page: 'flashcards', icon: '🃏', label: 'Make Flashcards', desc: 'Instant card generation' },
            { page: 'quiz', icon: '🧠', label: 'Take a Quiz', desc: 'Test your knowledge' },
            { page: 'planner', icon: '📅', label: 'Plan Study', desc: 'AI-powered schedule' },
          ].map(({ page, icon, label, desc }) => (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              className="card-hover p-4 text-left hover:border-ibm-blue/40"
            >
              <span className="text-2xl">{icon}</span>
              <p className="text-sm font-medium text-gray-200 mt-2">{label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
