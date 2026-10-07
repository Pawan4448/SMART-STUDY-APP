const express = require('express');
const router = express.Router();
const granite = require('../services/granite');
const progressService = require('../services/progress');

/**
 * POST /api/quiz/generate
 * Generate quiz from content
 */
router.post('/generate', async (req, res) => {
  try {
    const { content, subject, questionCount = 5, difficulty = 'medium', userId } = req.body;

    if (!content || content.trim().length < 10) {
      return res.status(400).json({ error: 'Content is required to generate quiz' });
    }

    const questions = await granite.generateQuiz(
      content,
      Math.min(questionCount, 15),
      difficulty,
      subject
    );

    if (questions.length === 0) {
      return res.status(500).json({ error: 'Could not generate quiz questions from this content' });
    }

    res.json({
      success: true,
      questions,
      subject: subject || 'General',
      difficulty,
      totalQuestions: questions.length
    });
  } catch (error) {
    console.error('Quiz generation error:', error);
    res.status(500).json({ error: 'Failed to generate quiz', details: error.message });
  }
});

/**
 * POST /api/quiz/submit
 * Submit quiz answers and get score
 */
router.post('/submit', async (req, res) => {
  try {
    const { questions, answers, subject, difficulty, userId } = req.body;

    if (!questions || !answers) {
      return res.status(400).json({ error: 'Questions and answers are required' });
    }

    let score = 0;
    const results = questions.map((q, i) => {
      const userAnswer = answers[i] || answers[q.id];
      const isCorrect = userAnswer && userAnswer.toUpperCase() === q.correct.toUpperCase();
      if (isCorrect) score++;
      return {
        questionId: q.id,
        question: q.question,
        userAnswer,
        correctAnswer: q.correct,
        isCorrect,
        explanation: q.explanation,
        topic: q.topic
      };
    });

    const percentage = Math.round((score / questions.length) * 100);

    // Record score
    progressService.recordQuizScore(userId, {
      subject: subject || 'General',
      score,
      totalQuestions: questions.length,
      difficulty
    });

    res.json({
      success: true,
      score,
      totalQuestions: questions.length,
      percentage,
      grade: getGrade(percentage),
      results,
      feedback: getPerformanceFeedback(percentage)
    });
  } catch (error) {
    console.error('Quiz submit error:', error);
    res.status(500).json({ error: 'Failed to submit quiz', details: error.message });
  }
});

function getGrade(percentage) {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
}

function getPerformanceFeedback(percentage) {
  if (percentage >= 90) return 'Excellent! You have mastered this topic. 🌟';
  if (percentage >= 75) return 'Great job! A little more practice and you\'ll be an expert. 💪';
  if (percentage >= 60) return 'Good effort! Focus on the incorrect answers to improve. 📚';
  if (percentage >= 40) return 'Keep studying! Review the material and try again. 🔄';
  return 'This topic needs more attention. Start from the basics and revisit the content. 📖';
}

module.exports = router;
