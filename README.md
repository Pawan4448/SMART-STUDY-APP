# Smart Study Generator — IBM Granite AI
### 🚀 Intelligent, Adaptive Study Companion

---

## 🧠 What It Does

The **Smart Study Generator** is a full-stack AI-powered platform that transforms any raw study material into structured, personalized learning assets — powered by **IBM Granite 3 8B Instruct** via **IBM WatsonX AI**.

| Feature | Description |
|---|---|
| **AI Summarizer** | Upload PDFs/notes → structured summaries with key terms |
| **Flashcard Generator** | Auto-creates flashcard decks with spaced repetition |
| **Quiz Arena** | Generates MCQ quizzes, scores them, explains answers |
| **Study Planner** | Day-by-day adaptive plan based on exam date + weak areas |
| **Concept Mapper** | Visual SVG knowledge graph of topic relationships |
| **Ask AI Tutor** | Chat with IBM Granite about any academic topic |
| **Exam Alerts** | Predictive priority alerts for high-frequency exam topics |
| **Dashboard** | Real-time analytics: streak, XP, weak areas, score trend |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **AI Model** | IBM Granite 3 8B Instruct (ibm/granite-3-8b-instruct) |
| **AI Platform** | IBM WatsonX AI (`@ibm-cloud/watsonx-ai`) |
| **Backend** | Node.js + Express |
| **Frontend** | React 18 + Vite + Tailwind CSS |
| **Charts** | Recharts (Area, Line, Radar) |
| **Icons** | Lucide React |
| **File Upload** | express-fileupload + pdf-parse |

---

## ⚙️ Setup & Running

### 1. Get IBM WatsonX Credentials
1. Go to [IBM Cloud](https://cloud.ibm.com)
2. Create a **WatsonX.ai** service instance
3. Get your **API key** and **Project ID**

### 2. Configure Environment
Copy `.env.example` to `.env` and fill in:
```
WATSONX_API_KEY=your_key_here
WATSONX_PROJECT_ID=your_project_id_here
WATSONX_URL=https://us-south.ml.cloud.ibm.com
```

### 3. Install & Run
```bash
# Install all dependencies
npm run install:all

# Run dev server (backend + frontend together)
npm run dev
```

- **Backend API**: http://localhost:5000/api
- **Frontend**: http://localhost:5173

### 4. Production Build
```bash
npm run build
NODE_ENV=production npm start
```

---

## 📂 Project Structure

```
smart-study-generator/
├── server/
│   ├── index.js              # Express server entry point
│   ├── services/
│   │   ├── granite.js        # IBM Granite AI integration
│   │   └── progress.js       # Study progress tracker
│   └── routes/
│       ├── study.js          # Summarize, flashcards, plan, Q&A
│       ├── upload.js         # File upload + text extraction
│       ├── quiz.js           # Quiz generation & scoring
│       └── progress.js       # Progress API endpoints
└── client/
    └── src/
        ├── App.jsx           # Root with navigation state
        ├── lib/api.js        # Axios API client
        └── components/
            ├── Dashboard.jsx      # Analytics dashboard
            ├── Summarizer.jsx     # AI content summarizer
            ├── FlashcardDeck.jsx  # Interactive flashcards
            ├── QuizArena.jsx      # Quiz generator & runner
            ├── StudyPlanner.jsx   # Personalized study plans
            ├── ConceptMapper.jsx  # SVG concept maps
            ├── AskAI.jsx          # AI tutor chat
            └── ExamAlerts.jsx     # Predictive exam alerts
```

---

## 🔗 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/study/summarize` | Summarize content with Granite |
| POST | `/api/study/flashcards` | Generate flashcard deck |
| POST | `/api/study/study-plan` | Generate personalized plan |
| POST | `/api/study/concept-map` | Build concept map |
| POST | `/api/study/ask` | Answer student question |
| POST | `/api/study/exam-alerts` | Predictive exam topic alerts |
| POST | `/api/quiz/generate` | Create MCQ quiz |
| POST | `/api/quiz/submit` | Score submitted quiz |
| POST | `/api/upload/file` | Upload PDF/TXT file |
| GET  | `/api/progress` | Get student analytics |

---

## 🎯 IBM Granite Prompt Strategy

Each feature uses **structured prompt engineering** with Granite's chat template:

```
<|system|>
Expert academic tutor context...
<|user|>
Task-specific instruction with output schema...
<|assistant|>
```

JSON outputs are validated client-side with fallback parsing for robustness.

---

## 📊 Progress Tracking

- **XP System**: Earn XP for completing sessions, quizzes, streaks
- **Leveling**: Level up every 200 XP
- **Streaks**: Daily study streak tracking
- **Milestones**: Badges for first hour, 10 sessions, 7-day streak, etc.
- **Weak Areas**: Auto-identified from quiz scores < 60% confidence
- **Subject Radar**: Visual confidence map per subject
