import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 120000, // 2 minutes for AI operations
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || error.message || 'Request failed';
    throw new Error(message);
  }
);

// Study API
export const studyAPI = {
  summarize: (data) => api.post('/study/summarize', data),
  generateFlashcards: (data) => api.post('/study/flashcards', data),
  generateStudyPlan: (data) => api.post('/study/study-plan', data),
  generateConceptMap: (data) => api.post('/study/concept-map', data),
  askQuestion: (data) => api.post('/study/ask', data),
  getExamAlerts: (data) => api.post('/study/exam-alerts', data),
};

// Upload API
export const uploadAPI = {
  uploadFile: (formData) => api.post('/upload/file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadText: (data) => api.post('/upload/text', data),
};

// Quiz API
export const quizAPI = {
  generate: (data) => api.post('/quiz/generate', data),
  submit: (data) => api.post('/quiz/submit', data),
};

// Progress API
export const progressAPI = {
  get: (userId) => api.get(userId ? `/progress/${userId}` : '/progress'),
  recordSession: (data) => api.post('/progress/session', data),
  recordQuizScore: (data) => api.post('/progress/quiz-score', data),
  recordFlashcard: (data) => api.post('/progress/flashcard', data),
};

export default api;
