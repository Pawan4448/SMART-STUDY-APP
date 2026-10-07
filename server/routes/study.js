const express = require('express');
const router = express.Router();
const granite = require('../services/granite');
const progressService = require('../services/progress');

/**
 * POST /api/study/summarize
 * Summarize uploaded or pasted content
 */
router.post('/summarize', async (req, res) => {
  try {
    const { content, subject, level = 'intermediate', userId } = req.body;

    if (!content || content.trim().length < 10) {
      return res.status(400).json({ error: 'Content is required (minimum 10 characters)' });
    }

    const summary = await granite.summarizeContent(content, subject, level);

    // Record session
    progressService.recordSession(userId, {
      type: 'summarize',
      subject: subject || 'General',
      topic: subject || 'Summary',
      duration: Math.ceil(content.length / 500) // estimate reading time
    });

    res.json({
      success: true,
      summary,
      wordCount: content.split(/\s+/).length,
      estimatedReadTime: `${Math.ceil(content.split(/\s+/).length / 200)} min`
    });
  } catch (error) {
    console.error('Summarize error:', error);
    res.status(500).json({ error: 'Failed to generate summary', details: error.message });
  }
});

/**
 * POST /api/study/flashcards
 * Generate flashcards from content
 */
router.post('/flashcards', async (req, res) => {
  try {
    const { content, subject, count = 10, userId } = req.body;

    if (!content || content.trim().length < 10) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const flashcards = await granite.generateFlashcards(content, Math.min(count, 20), subject);

    progressService.recordSession(userId, {
      type: 'flashcards',
      subject: subject || 'General',
      topic: subject || 'Flashcards',
      duration: 5
    });

    res.json({
      success: true,
      flashcards,
      count: flashcards.length
    });
  } catch (error) {
    console.error('Flashcards error:', error);
    res.status(500).json({ error: 'Failed to generate flashcards', details: error.message });
  }
});

/**
 * POST /api/study/study-plan
 * Generate personalized study plan
 */
router.post('/study-plan', async (req, res) => {
  try {
    const { subject, topics, examDate, hoursPerDay = 2, weakAreas = [], userId } = req.body;

    if (!subject || !topics || !examDate) {
      return res.status(400).json({ error: 'Subject, topics, and exam date are required' });
    }

    const topicList = Array.isArray(topics) ? topics : topics.split(',').map(t => t.trim());
    const plan = await granite.generateStudyPlan(subject, topicList, examDate, hoursPerDay, weakAreas);

    progressService.recordSession(userId, {
      type: 'study_plan',
      subject,
      topic: 'Study Planning',
      duration: 2
    });

    res.json({
      success: true,
      plan,
      subject,
      examDate,
      hoursPerDay
    });
  } catch (error) {
    console.error('Study plan error:', error);
    res.status(500).json({ error: 'Failed to generate study plan', details: error.message });
  }
});

/**
 * POST /api/study/concept-map
 * Generate concept map from content
 */
router.post('/concept-map', async (req, res) => {
  try {
    const { content, subject, userId } = req.body;

    if (!content || content.trim().length < 10) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const conceptMap = await granite.generateConceptMap(content, subject);

    progressService.recordSession(userId, {
      type: 'concept_map',
      subject: subject || 'General',
      topic: subject || 'Concept Mapping',
      duration: 3
    });

    res.json({ success: true, conceptMap });
  } catch (error) {
    console.error('Concept map error:', error);
    res.status(500).json({ error: 'Failed to generate concept map', details: error.message });
  }
});

/**
 * POST /api/study/ask
 * Answer a student question
 */
router.post('/ask', async (req, res) => {
  try {
    const { question, context, subject, userId } = req.body;

    if (!question || question.trim().length < 3) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const answer = await granite.answerQuestion(question, context, subject);

    progressService.recordSession(userId, {
      type: 'question',
      subject: subject || 'General',
      topic: question.substring(0, 50),
      duration: 2
    });

    res.json({ success: true, answer, question });
  } catch (error) {
    console.error('Ask question error:', error);
    res.status(500).json({ error: 'Failed to answer question', details: error.message });
  }
});

/**
 * POST /api/study/exam-alerts
 * Generate predictive exam alerts
 */
router.post('/exam-alerts', async (req, res) => {
  try {
    const { subject, topics, syllabus, userId } = req.body;

    if (!subject || !topics) {
      return res.status(400).json({ error: 'Subject and topics are required' });
    }

    const topicList = Array.isArray(topics) ? topics : topics.split(',').map(t => t.trim());
    const alerts = await granite.generateExamAlerts(subject, topicList, syllabus);

    res.json({ success: true, alerts, subject });
  } catch (error) {
    console.error('Exam alerts error:', error);
    res.status(500).json({ error: 'Failed to generate exam alerts', details: error.message });
  }
});

module.exports = router;
