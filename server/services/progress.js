const { v4: uuidv4 } = require('uuid');

// In-memory store (replace with DB in production)
const studySessions = new Map();
const userProgress = new Map();
const DEFAULT_USER = 'student_001';

function getProgress(userId = DEFAULT_USER) {
  if (!userProgress.has(userId)) {
    userProgress.set(userId, {
      userId,
      totalStudyTime: 0,        // minutes
      sessionsCompleted: 0,
      topicsStudied: [],
      quizScores: [],
      flashcardPerformance: {},
      weeklyGoal: 300,          // minutes per week
      weeklyProgress: 0,
      streakDays: 0,
      lastStudyDate: null,
      subjectProgress: {},
      milestones: [],
      createdAt: new Date().toISOString()
    });
  }
  return userProgress.get(userId);
}

function recordSession(userId = DEFAULT_USER, sessionData) {
  const progress = getProgress(userId);
  const sessionId = uuidv4();

  // Update streak
  const today = new Date().toDateString();
  if (progress.lastStudyDate && progress.lastStudyDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    progress.streakDays = progress.lastStudyDate === yesterday ? progress.streakDays + 1 : 1;
  } else if (!progress.lastStudyDate) {
    progress.streakDays = 1;
  }
  progress.lastStudyDate = today;

  // Update time
  progress.totalStudyTime += sessionData.duration || 0;
  progress.weeklyProgress += sessionData.duration || 0;
  progress.sessionsCompleted += 1;

  // Track topics
  if (sessionData.topic && !progress.topicsStudied.includes(sessionData.topic)) {
    progress.topicsStudied.push(sessionData.topic);
  }

  // Update subject progress
  if (sessionData.subject) {
    if (!progress.subjectProgress[sessionData.subject]) {
      progress.subjectProgress[sessionData.subject] = {
        timeSpent: 0,
        sessions: 0,
        lastStudied: null,
        confidence: 50
      };
    }
    progress.subjectProgress[sessionData.subject].timeSpent += sessionData.duration || 0;
    progress.subjectProgress[sessionData.subject].sessions += 1;
    progress.subjectProgress[sessionData.subject].lastStudied = new Date().toISOString();
  }

  // Check milestones
  checkMilestones(progress);

  const session = {
    id: sessionId,
    userId,
    ...sessionData,
    timestamp: new Date().toISOString()
  };
  studySessions.set(sessionId, session);

  return { sessionId, progress };
}

function recordQuizScore(userId = DEFAULT_USER, quizData) {
  const progress = getProgress(userId);
  
  progress.quizScores.push({
    id: uuidv4(),
    subject: quizData.subject,
    score: quizData.score,
    totalQuestions: quizData.totalQuestions,
    percentage: Math.round((quizData.score / quizData.totalQuestions) * 100),
    difficulty: quizData.difficulty,
    timestamp: new Date().toISOString()
  });

  // Update subject confidence
  if (quizData.subject && progress.subjectProgress[quizData.subject]) {
    const pct = (quizData.score / quizData.totalQuestions) * 100;
    const current = progress.subjectProgress[quizData.subject].confidence;
    progress.subjectProgress[quizData.subject].confidence = Math.round((current * 0.7) + (pct * 0.3));
  }

  return progress;
}

function recordFlashcardReview(userId = DEFAULT_USER, cardId, known) {
  const progress = getProgress(userId);
  
  if (!progress.flashcardPerformance[cardId]) {
    progress.flashcardPerformance[cardId] = { correct: 0, incorrect: 0, lastReview: null };
  }
  
  if (known) {
    progress.flashcardPerformance[cardId].correct += 1;
  } else {
    progress.flashcardPerformance[cardId].incorrect += 1;
  }
  progress.flashcardPerformance[cardId].lastReview = new Date().toISOString();
  
  return progress;
}

function checkMilestones(progress) {
  const milestoneChecks = [
    { condition: progress.totalStudyTime >= 60, id: 'first_hour', label: '🎯 First Hour Studied', xp: 50 },
    { condition: progress.totalStudyTime >= 600, id: 'ten_hours', label: '📚 10 Hours Milestone', xp: 200 },
    { condition: progress.sessionsCompleted >= 10, id: 'ten_sessions', label: '🔥 10 Sessions Completed', xp: 100 },
    { condition: progress.streakDays >= 7, id: 'week_streak', label: '⚡ 7-Day Streak', xp: 300 },
    { condition: progress.topicsStudied.length >= 5, id: 'five_topics', label: '🗺️ Explored 5 Topics', xp: 150 },
    { condition: progress.quizScores.length >= 5, id: 'five_quizzes', label: '🏆 Completed 5 Quizzes', xp: 100 },
  ];

  milestoneChecks.forEach(({ condition, id, label, xp }) => {
    if (condition && !progress.milestones.find(m => m.id === id)) {
      progress.milestones.push({ id, label, xp, earnedAt: new Date().toISOString() });
    }
  });
}

function getAnalytics(userId = DEFAULT_USER) {
  const progress = getProgress(userId);
  const scores = progress.quizScores;

  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((sum, s) => sum + s.percentage, 0) / scores.length)
    : 0;

  // Get weak areas (subjects with low confidence or low quiz scores)
  const weakAreas = Object.entries(progress.subjectProgress)
    .filter(([, data]) => data.confidence < 60)
    .map(([subject, data]) => ({ subject, confidence: data.confidence }));

  // Weekly activity for chart (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toDateString();
  });

  const weeklyActivity = last7Days.map(day => {
    const daySessions = Array.from(studySessions.values())
      .filter(s => new Date(s.timestamp).toDateString() === day);
    return {
      day: new Date(day).toLocaleDateString('en-US', { weekday: 'short' }),
      minutes: daySessions.reduce((sum, s) => sum + (s.duration || 0), 0)
    };
  });

  // Score trend (last 10 quizzes)
  const scoreTrend = scores.slice(-10).map((s, i) => ({
    quiz: `Quiz ${i + 1}`,
    score: s.percentage,
    subject: s.subject
  }));

  const totalXP = progress.milestones.reduce((sum, m) => sum + m.xp, 0);
  const level = Math.floor(totalXP / 200) + 1;

  return {
    summary: {
      totalStudyTime: progress.totalStudyTime,
      sessionsCompleted: progress.sessionsCompleted,
      topicsStudied: progress.topicsStudied.length,
      averageScore: avgScore,
      streakDays: progress.streakDays,
      weeklyGoalProgress: Math.min(100, Math.round((progress.weeklyProgress / progress.weeklyGoal) * 100)),
      totalXP,
      level
    },
    weakAreas,
    weeklyActivity,
    scoreTrend,
    subjectProgress: progress.subjectProgress,
    milestones: progress.milestones,
    recentQuizzes: scores.slice(-5).reverse()
  };
}

module.exports = {
  getProgress,
  recordSession,
  recordQuizScore,
  recordFlashcardReview,
  getAnalytics
};
