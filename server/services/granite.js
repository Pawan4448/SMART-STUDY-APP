const { WatsonXAI } = require('@ibm-cloud/watsonx-ai');

let client = null;

function getClient() {
  if (!client) {
    client = WatsonXAI.newInstance({
      version: '2024-05-31',
      serviceUrl: process.env.WATSONX_URL || 'https://us-south.ml.cloud.ibm.com',
    });
  }
  return client;
}

const MODEL_ID = 'ibm/granite-3-8b-instruct';
const PROJECT_ID = process.env.WATSONX_PROJECT_ID;

/**
 * Core function to call IBM Granite via WatsonX AI
 */
async function callGranite(prompt, options = {}) {
  const watsonxClient = getClient();

  const params = {
    input: prompt,
    modelId: options.modelId || MODEL_ID,
    projectId: PROJECT_ID,
    parameters: {
      max_new_tokens: options.maxTokens || 1024,
      min_new_tokens: options.minTokens || 10,
      temperature: options.temperature || 0.7,
      top_p: options.topP || 0.9,
      repetition_penalty: 1.1,
      stop_sequences: options.stopSequences || [],
    },
  };

  try {
    const response = await watsonxClient.generateText(params);
    const result = response.result;
    if (result && result.results && result.results.length > 0) {
      return result.results[0].generated_text.trim();
    }
    throw new Error('No text generated from Granite model');
  } catch (error) {
    console.error('Granite API Error:', error.message);
    throw error;
  }
}

/**
 * Summarize study content
 */
async function summarizeContent(content, subject = '', level = 'intermediate') {
  const prompt = `<|system|>
You are an expert academic tutor and content summarizer. Create clear, structured summaries that help students learn effectively.
<|user|>
Summarize the following ${subject ? subject + ' ' : ''}content for a ${level} level student. 

Structure your summary with:
1. **Key Concepts** (bullet points)
2. **Main Ideas** (2-3 paragraphs)
3. **Important Terms** (with brief definitions)
4. **Key Takeaways** (3-5 actionable points)

Content to summarize:
${content}
<|assistant|>`;

  return await callGranite(prompt, { maxTokens: 1500, temperature: 0.5 });
}

/**
 * Generate flashcards from content
 */
async function generateFlashcards(content, count = 10, subject = '') {
  const prompt = `<|system|>
You are an expert educator specializing in creating effective study flashcards using spaced repetition principles.
<|user|>
Create exactly ${count} flashcards from the following ${subject ? subject + ' ' : ''}content.

Return ONLY a valid JSON array with this exact structure:
[
  {
    "id": 1,
    "front": "Question or term here",
    "back": "Answer or definition here",
    "difficulty": "easy|medium|hard",
    "topic": "subtopic name"
  }
]

Content:
${content}
<|assistant|>`;

  const raw = await callGranite(prompt, { maxTokens: 2000, temperature: 0.6 });
  
  try {
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Could not parse flashcards JSON');
  } catch {
    // Return structured fallback
    return generateFallbackFlashcards(raw, count);
  }
}

function generateFallbackFlashcards(text, count) {
  const lines = text.split('\n').filter(l => l.trim());
  const cards = [];
  for (let i = 0; i < Math.min(count, 5); i++) {
    cards.push({
      id: i + 1,
      front: `Concept ${i + 1}`,
      back: lines[i] || 'Review source material',
      difficulty: ['easy', 'medium', 'hard'][i % 3],
      topic: 'General'
    });
  }
  return cards;
}

/**
 * Generate a personalized study plan
 */
async function generateStudyPlan(subject, topics, examDate, hoursPerDay, weakAreas = []) {
  const daysUntilExam = Math.ceil((new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24));
  
  const prompt = `<|system|>
You are an expert academic coach who creates personalized, adaptive study plans based on cognitive science and spaced repetition.
<|user|>
Create a detailed personalized study plan with the following parameters:
- Subject: ${subject}
- Topics to cover: ${topics.join(', ')}
- Days until exam: ${daysUntilExam}
- Study hours per day: ${hoursPerDay}
- Weak areas needing extra focus: ${weakAreas.length > 0 ? weakAreas.join(', ') : 'None specified'}

Return ONLY a valid JSON object with this structure:
{
  "overview": "brief plan description",
  "totalHours": number,
  "dailyPlans": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "focus": "main topic",
      "tasks": ["task 1", "task 2", "task 3"],
      "duration": "X hours",
      "priority": "high|medium|low",
      "reviewTopics": ["topic to review"]
    }
  ],
  "weeklyMilestones": ["milestone 1", "milestone 2"],
  "examAlerts": ["alert about frequently tested topics"],
  "recommendations": ["personalized recommendation"]
}
<|assistant|>`;

  const raw = await callGranite(prompt, { maxTokens: 2500, temperature: 0.6 });
  
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Could not parse study plan JSON');
  } catch {
    return { overview: raw, dailyPlans: [], weeklyMilestones: [], examAlerts: [], recommendations: [] };
  }
}

/**
 * Generate quiz questions
 */
async function generateQuiz(content, questionCount = 5, difficulty = 'medium', subject = '') {
  const prompt = `<|system|>
You are an expert exam question creator who designs questions that test deep understanding and critical thinking.
<|user|>
Create ${questionCount} multiple-choice quiz questions at ${difficulty} difficulty from this ${subject ? subject + ' ' : ''}content.

Return ONLY a valid JSON array:
[
  {
    "id": 1,
    "question": "Question text here?",
    "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
    "correct": "A",
    "explanation": "Why this answer is correct",
    "topic": "subtopic",
    "difficulty": "${difficulty}"
  }
]

Content:
${content}
<|assistant|>`;

  const raw = await callGranite(prompt, { maxTokens: 2000, temperature: 0.5 });
  
  try {
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Could not parse quiz JSON');
  } catch {
    return [];
  }
}

/**
 * Generate concept map
 */
async function generateConceptMap(content, subject = '') {
  const prompt = `<|system|>
You are an expert in knowledge visualization and concept mapping for educational purposes.
<|user|>
Create a concept map from the following ${subject ? subject + ' ' : ''}content.

Return ONLY a valid JSON object:
{
  "centralConcept": "main topic",
  "nodes": [
    {
      "id": "node1",
      "label": "Concept Name",
      "description": "Brief description",
      "type": "main|sub|detail",
      "importance": "high|medium|low"
    }
  ],
  "connections": [
    {
      "from": "node1",
      "to": "node2",
      "relationship": "relationship description",
      "strength": "strong|moderate|weak"
    }
  ],
  "keyInsights": ["insight 1", "insight 2"]
}

Content:
${content}
<|assistant|>`;

  const raw = await callGranite(prompt, { maxTokens: 1500, temperature: 0.5 });
  
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Could not parse concept map JSON');
  } catch {
    return { centralConcept: subject || 'Main Concept', nodes: [], connections: [], keyInsights: [] };
  }
}

/**
 * Answer a student question with context
 */
async function answerQuestion(question, context = '', subject = '') {
  const prompt = `<|system|>
You are an intelligent, patient academic tutor. Provide clear, accurate, and educational answers. Use examples and analogies to aid understanding.
<|user|>
${context ? `Context from student's notes:\n${context}\n\n` : ''}Student Question${subject ? ' about ' + subject : ''}: ${question}

Provide a comprehensive answer that:
1. Directly answers the question
2. Explains the underlying concepts
3. Gives a practical example if relevant
4. Suggests what to study next
<|assistant|>`;

  return await callGranite(prompt, { maxTokens: 1200, temperature: 0.7 });
}

/**
 * Generate predictive exam alerts
 */
async function generateExamAlerts(subject, topics, syllabus = '') {
  const prompt = `<|system|>
You are an expert academic analyst with deep knowledge of exam patterns and frequently tested topics across various subjects.
<|user|>
Analyze this ${subject} course and generate predictive exam alerts for a student.

Topics: ${topics.join(', ')}
${syllabus ? 'Syllabus context: ' + syllabus : ''}

Return ONLY a valid JSON array:
[
  {
    "topic": "topic name",
    "priority": "critical|high|medium|low",
    "reason": "why this is frequently tested",
    "examFrequency": "very likely|likely|possible",
    "preparationTip": "specific study tip",
    "estimatedMark": "5-10 marks"
  }
]
<|assistant|>`;

  const raw = await callGranite(prompt, { maxTokens: 1500, temperature: 0.6 });
  
  try {
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch {
    return [];
  }
}

module.exports = {
  callGranite,
  summarizeContent,
  generateFlashcards,
  generateStudyPlan,
  generateQuiz,
  generateConceptMap,
  answerQuestion,
  generateExamAlerts
};
