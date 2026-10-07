const express = require('express');
const router = express.Router();
const progressService = require('../services/progress');

/**
 * GET /api/progress/:userId
 * Get full progress for a user
 */
router.get('/:userId', (req, res) => {
  const { userId } = req.params;
  const analytics = progressService.getAnalytics(userId);
  res.json({ success: true, ...analytics });
});

/**
 * GET /api/progress
 * Get default user progress
 */
router.get('/', (req, res) => {
  const analytics = progressService.getAnalytics();
  res.json({ success: true, ...analytics });
});

/**
 * POST /api/progress/session
 * Record a study session
 */
router.post('/session', (req, res) => {
  const { userId, subject, topic, duration, type } = req.body;
  const result = progressService.recordSession(userId, { subject, topic, duration, type });
  res.json({ success: true, ...result });
});

/**
 * POST /api/progress/quiz-score
 * Record quiz result
 */
router.post('/quiz-score', (req, res) => {
  const { userId, subject, score, totalQuestions, difficulty } = req.body;
  const progress = progressService.recordQuizScore(userId, { subject, score, totalQuestions, difficulty });
  res.json({ success: true, message: 'Quiz score recorded', streakDays: progress.streakDays });
});

/**
 * POST /api/progress/flashcard
 * Record flashcard review result
 */
router.post('/flashcard', (req, res) => {
  const { userId, cardId, known } = req.body;
  progressService.recordFlashcardReview(userId, cardId, known);
  res.json({ success: true, message: 'Flashcard review recorded' });
});

module.exports = router;
