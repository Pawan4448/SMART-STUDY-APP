import { useState } from 'react';
import { studyAPI } from '../lib/api';
import { AILoader, ErrorMessage, ContentInput, MarkdownRenderer } from './ui';
import { FileText, Copy, RefreshCw, Download } from 'lucide-react';

const LEVELS = ['beginner', 'intermediate', 'advanced'];

export default function Summarizer({ sharedContent, onContentChange }) {
  const [content, setContent] = useState(sharedContent || '');
  const [subject, setSubject] = useState('');
  const [level, setLevel] = useState('intermediate');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [metadata, setMetadata] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleContentChange = (val) => {
    setContent(val);
    onContentChange?.(val);
  };

  const handleFileLoad = (text, filename) => {
    setContent(text);
    onContentChange?.(text);
    if (filename && !subject) {
      setSubject(filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
    }
  };

  async function handleSummarize() {
    if (!content.trim()) { setError('Please enter content to summarize'); return; }
    setError('');
    setSummary('');
    setLoading(true);

    try {
      const res = await studyAPI.summarize({ content, subject, level });
      setSummary(res.summary);
      setMetadata({ wordCount: res.wordCount, estimatedReadTime: res.estimatedReadTime });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `summary-${subject || 'notes'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
      {/* Input Panel */}
      <div className="space-y-4">
        <div className="card">
          <h3 className="section-title mb-4">
            <FileText className="w-4 h-4 text-ibm-blue-light" />
            Input Content
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Subject (optional)</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="input"
                  placeholder="e.g. Quantum Physics"
                />
              </div>
              <div>
                <label className="label">Student Level</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="input"
                >
                  {LEVELS.map(l => (
                    <option key={l} value={l} className="bg-gray-800 capitalize">{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            <ContentInput
              value={content}
              onChange={handleContentChange}
              onFileLoad={handleFileLoad}
              rows={10}
            />

            {error && <ErrorMessage error={error} />}

            <button
              onClick={handleSummarize}
              disabled={loading || !content.trim()}
              className="btn-primary w-full justify-center"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⟳</span>
                  Generating Summary...
                </>
              ) : (
                <>✦ Generate AI Summary</>
              )}
            </button>
          </div>
        </div>

        {/* Tips */}
        <div className="card bg-ibm-blue/5 border-ibm-blue/20">
          <p className="text-xs font-semibold text-ibm-blue-light mb-2">💡 Tips for best results</p>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• Upload full chapters or lecture notes for comprehensive summaries</li>
            <li>• Specify your subject for domain-specific terminology</li>
            <li>• Choose "beginner" for simplified explanations</li>
            <li>• PDF files are supported for direct upload</li>
          </ul>
        </div>
      </div>

      {/* Output Panel */}
      <div className="space-y-4">
        <div className="card min-h-[400px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">
              <span className="text-ibm-blue-light">✦</span>
              AI Summary
            </h3>
            {summary && (
              <div className="flex items-center gap-2">
                {metadata && (
                  <span className="text-xs text-gray-500">{metadata.wordCount} words · {metadata.estimatedReadTime} read</span>
                )}
                <button onClick={handleCopy} className="btn-ghost py-1 text-xs">
                  <Copy className="w-3 h-3" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button onClick={handleDownload} className="btn-ghost py-1 text-xs">
                  <Download className="w-3 h-3" />
                  Save
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <AILoader message="IBM Granite is analyzing your content..." />
          ) : summary ? (
            <div className="animate-slide-up">
              <MarkdownRenderer content={summary} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-ibm-blue/10 border border-ibm-blue/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-ibm-blue-light opacity-60" />
              </div>
              <p className="text-sm text-gray-500">Your AI-generated summary will appear here</p>
              <p className="text-xs text-gray-600">Powered by IBM Granite 3 8B Instruct</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
