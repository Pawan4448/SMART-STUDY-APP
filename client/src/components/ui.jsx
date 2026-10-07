export function LoadingDots() {
  return (
    <div className="dot-loader">
      <span /><span /><span />
    </div>
  );
}

export function AILoader({ message = 'IBM Granite is thinking...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-ibm-blue/20 border border-ibm-blue/40 flex items-center justify-center">
          <span className="text-ibm-blue text-sm">✦</span>
        </div>
        <LoadingDots />
      </div>
      <p className="text-sm text-gray-400 font-mono animate-pulse">{message}</p>
    </div>
  );
}

export function ErrorMessage({ error, onRetry }) {
  return (
    <div className="card border-red-800/50 bg-red-950/20 flex items-start gap-3">
      <span className="text-red-400 text-lg shrink-0">⚠</span>
      <div className="flex-1">
        <p className="text-sm font-medium text-red-300">Error</p>
        <p className="text-xs text-red-400 mt-1">{error}</p>
        {onRetry && (
          <button onClick={onRetry} className="btn-ghost text-xs mt-2 text-red-400 hover:text-red-300 px-0">
            Try again →
          </button>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <div className="text-4xl opacity-30">{icon || '📚'}</div>
      <p className="text-sm font-medium text-gray-400">{title}</p>
      {description && <p className="text-xs text-gray-600 max-w-xs">{description}</p>}
      {action}
    </div>
  );
}

export function StatCard({ label, value, sub, color = 'blue', icon }) {
  const colors = {
    blue: 'bg-ibm-blue/10 border-ibm-blue/20 text-ibm-blue-light',
    green: 'bg-green-500/10 border-green-500/20 text-green-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    yellow: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    orange: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
    teal: 'bg-teal-500/10 border-teal-500/20 text-teal-400',
  };

  return (
    <div className={`card border ${colors[color] || colors.blue}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium opacity-70 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
        </div>
        {icon && <span className="text-2xl opacity-50">{icon}</span>}
      </div>
    </div>
  );
}

export function MarkdownRenderer({ content }) {
  if (!content) return null;

  // Simple markdown-to-HTML for study content
  const html = content
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-gray-800 px-1 py-0.5 rounded text-green-400 font-mono text-xs">$1</code>')
    .replace(/^### (.*$)/gim, '<h3 class="text-base font-semibold text-gray-100 mt-4 mb-1.5">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-lg font-semibold text-gray-100 mt-5 mb-2">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold text-gray-100 mt-5 mb-2">$1</h1>')
    .replace(/^\* (.*$)/gim, '<li class="text-gray-300 text-sm ml-4 list-disc">$1</li>')
    .replace(/^- (.*$)/gim, '<li class="text-gray-300 text-sm ml-4 list-disc">$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li class="text-gray-300 text-sm ml-4 list-decimal">$1</li>')
    .replace(/\n\n/g, '</p><p class="mb-3 text-gray-300 text-sm leading-relaxed">')
    .replace(/\n/g, '<br/>');

  return (
    <div
      className="text-sm text-gray-300 leading-relaxed"
      dangerouslySetInnerHTML={{ __html: `<p class="mb-3">${html}</p>` }}
    />
  );
}

export function ContentInput({ value, onChange, onFileLoad, placeholder, rows = 6 }) {
  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload/file', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success && onFileLoad) {
        onFileLoad(data.text, data.filename);
      }
    } catch (err) {
      console.error('File upload failed:', err);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="label">Study Content</label>
        <label className="btn-ghost text-xs cursor-pointer py-1">
          📎 Upload File
          <input type="file" accept=".pdf,.txt,.md,.rtf" onChange={handleFile} className="hidden" />
        </label>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="textarea font-mono text-xs"
        placeholder={placeholder || 'Paste your notes, textbook content, or any study material here...'}
        rows={rows}
      />
      <p className="text-xs text-gray-600">{value ? `${value.split(/\s+/).filter(Boolean).length} words` : 'Supports PDF, TXT, MD file uploads'}</p>
    </div>
  );
}
