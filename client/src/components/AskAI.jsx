import { useState, useRef } from 'react';
import { studyAPI } from '../lib/api';
import { AILoader, ErrorMessage, MarkdownRenderer } from './ui';
import { HelpCircle, Send, BookOpen } from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  'What is the difference between supervised and unsupervised learning?',
  'Explain the concept of recursion with an example',
  'What are the key principles of object-oriented programming?',
  'How does gradient descent work in machine learning?',
  'What is the difference between TCP and UDP?',
  'Explain Big O notation and why it matters',
];

export default function AskAI({ sharedContent }) {
  const [question, setQuestion] = useState('');
  const [subject, setSubject] = useState('');
  const [useContext, setUseContext] = useState(true);
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  async function handleAsk(q = question) {
    if (!q.trim()) return;
    setError('');
    
    const userMsg = { role: 'user', content: q, timestamp: new Date() };
    setConversation(prev => [...prev, userMsg]);
    setQuestion('');
    setLoading(true);

    try {
      const res = await studyAPI.askQuestion({
        question: q,
        context: useContext && sharedContent ? sharedContent.substring(0, 2000) : '',
        subject
      });

      const aiMsg = { role: 'assistant', content: res.answer, timestamp: new Date() };
      setConversation(prev => [...prev, aiMsg]);

      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      setError(err.message);
      // Remove the user message if failed
      setConversation(prev => prev.filter(m => m !== userMsg));
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in" style={{ minHeight: '70vh' }}>
      {/* Sidebar */}
      <div className="space-y-4">
        <div className="card">
          <h3 className="section-title mb-3 text-sm">
            <HelpCircle className="w-4 h-4 text-ibm-blue-light" />
            AI Tutor Settings
          </h3>

          <div className="space-y-3">
            <div>
              <label className="label">Subject Context</label>
              <input value={subject} onChange={e => setSubject(e.target.value)}
                className="input text-xs" placeholder="e.g. Physics, Math..." />
            </div>

            {sharedContent && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useContext}
                  onChange={e => setUseContext(e.target.checked)}
                  className="rounded"
                />
                <span className="text-xs text-gray-400">Use uploaded notes as context</span>
              </label>
            )}

            <button
              onClick={() => setConversation([])}
              className="btn-ghost text-xs w-full text-center"
            >
              Clear Conversation
            </button>
          </div>
        </div>

        <div className="card">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            Suggested Questions
          </p>
          <div className="space-y-1.5">
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => handleAsk(q)}
                disabled={loading}
                className="w-full text-left text-xs text-gray-400 hover:text-gray-200 px-2 py-1.5 rounded-sm hover:bg-gray-800 transition-colors leading-relaxed"
              >
                <span className="text-ibm-blue-light mr-1">→</span>
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="lg:col-span-3 flex flex-col card p-0 overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ minHeight: 400, maxHeight: '60vh' }}>
          {conversation.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-12">
              <div className="w-14 h-14 rounded-full bg-ibm-blue/10 border border-ibm-blue/20 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-ibm-blue-light opacity-60" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400">Ask IBM Granite AI Tutor</p>
                <p className="text-xs text-gray-600 mt-1">Ask any academic question or get help understanding concepts</p>
              </div>
            </div>
          ) : (
            conversation.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                <div className={`max-w-[85%] rounded-sm ${
                  msg.role === 'user'
                    ? 'bg-ibm-blue text-white px-4 py-3 text-sm'
                    : 'bg-gray-800 border border-gray-700 px-4 py-4'
                }`}>
                  {msg.role === 'assistant' ? (
                    <>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-ibm-blue-light text-xs">✦</span>
                        <span className="text-xs text-gray-500 font-mono">IBM Granite</span>
                      </div>
                      <MarkdownRenderer content={msg.content} />
                    </>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 border border-gray-700 rounded-sm px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-ibm-blue-light text-xs">✦</span>
                  <AILoader message="" />
                  <span className="text-xs text-gray-500">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="max-w-lg">
              <ErrorMessage error={error} />
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-800 p-4">
          <div className="flex items-end gap-3">
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              className="textarea flex-1 text-sm min-h-[44px] max-h-32 resize-none py-2.5"
              placeholder="Ask a question... (Enter to send, Shift+Enter for new line)"
              rows={1}
            />
            <button
              onClick={() => handleAsk()}
              disabled={loading || !question.trim()}
              className="btn-primary shrink-0 py-2.5 px-4"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
