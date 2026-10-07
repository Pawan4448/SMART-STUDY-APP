import { useState } from 'react';
import { studyAPI } from '../lib/api';
import { AILoader, ErrorMessage, ContentInput } from './ui';
import { Map } from 'lucide-react';

const NODE_COLORS = {
  main: '#0f62fe',
  sub: '#8a3ffc',
  detail: '#009d9a',
};

const IMPORTANCE_SIZE = {
  high: 16,
  medium: 13,
  low: 11,
};

function ConceptNode({ node, x, y }) {
  const color = NODE_COLORS[node.type] || NODE_COLORS.detail;
  const fontSize = IMPORTANCE_SIZE[node.importance] || 12;
  const radius = node.type === 'main' ? 50 : node.type === 'sub' ? 38 : 28;

  return (
    <g transform={`translate(${x},${y})`}>
      <circle
        r={radius}
        fill={color + '20'}
        stroke={color}
        strokeWidth={node.type === 'main' ? 2.5 : 1.5}
      />
      <text
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize={fontSize}
        fontWeight={node.type === 'main' ? 700 : 500}
        style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
      >
        {node.label.length > 12 ? node.label.substring(0, 12) + '…' : node.label}
      </text>
    </g>
  );
}

function ConceptMapVisualization({ conceptMap }) {
  const { nodes = [], connections = [], centralConcept, keyInsights = [] } = conceptMap;
  
  if (!nodes.length) return null;

  // Position nodes in a radial layout
  const width = 700;
  const height = 500;
  const cx = width / 2;
  const cy = height / 2;
  
  const mainNode = nodes.find(n => n.type === 'main') || nodes[0];
  const subNodes = nodes.filter(n => n.type === 'sub');
  const detailNodes = nodes.filter(n => n.type === 'detail');

  const positions = {};
  
  // Center for main node
  if (mainNode) {
    positions[mainNode.id] = { x: cx, y: cy };
  }

  // Sub nodes in a ring
  subNodes.forEach((node, i) => {
    const angle = (i / Math.max(subNodes.length, 1)) * 2 * Math.PI - Math.PI / 2;
    positions[node.id] = {
      x: cx + 160 * Math.cos(angle),
      y: cy + 130 * Math.sin(angle),
    };
  });

  // Detail nodes in outer ring
  detailNodes.forEach((node, i) => {
    const angle = (i / Math.max(detailNodes.length, 1)) * 2 * Math.PI;
    positions[node.id] = {
      x: cx + 280 * Math.cos(angle),
      y: cy + 200 * Math.sin(angle),
    };
  });

  return (
    <div className="space-y-4">
      <div className="card overflow-x-auto">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Concept Map: {centralConcept}
        </p>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: 400, maxHeight: 420 }}>
          {/* Draw connections */}
          {connections.map((conn, i) => {
            const from = positions[conn.from];
            const to = positions[conn.to];
            if (!from || !to) return null;
            return (
              <g key={i}>
                <line
                  x1={from.x} y1={from.y}
                  x2={to.x} y2={to.y}
                  stroke={conn.strength === 'strong' ? '#4589ff60' : '#ffffff20'}
                  strokeWidth={conn.strength === 'strong' ? 2 : 1}
                  strokeDasharray={conn.strength === 'weak' ? '4,4' : 'none'}
                />
                {/* Relationship label */}
                <text
                  x={(from.x + to.x) / 2}
                  y={(from.y + to.y) / 2 - 5}
                  fill="#6b7280"
                  fontSize={9}
                  textAnchor="middle"
                  style={{ fontFamily: 'IBM Plex Mono, monospace' }}
                >
                  {(conn.relationship || '').substring(0, 20)}
                </text>
              </g>
            );
          })}

          {/* Draw nodes */}
          {nodes.map((node) => {
            const pos = positions[node.id];
            if (!pos) return null;
            return <ConceptNode key={node.id} node={node} x={pos.x} y={pos.y} />;
          })}
        </svg>
      </div>

      {/* Key Insights */}
      {keyInsights.length > 0 && (
        <div className="card bg-ibm-blue/5 border-ibm-blue/20">
          <p className="text-xs font-semibold text-ibm-blue-light mb-2">Key Insights</p>
          <ul className="space-y-1">
            {keyInsights.map((insight, i) => (
              <li key={i} className="text-xs text-gray-300 flex items-start gap-1.5">
                <span className="text-ibm-blue-light shrink-0">→</span> {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Node List */}
      <div className="card">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">All Concepts ({nodes.length})</p>
        <div className="grid grid-cols-2 gap-2">
          {nodes.map((node) => (
            <div key={node.id} className="flex items-start gap-2 p-2 bg-gray-800/50 rounded-sm">
              <div
                className="w-2 h-2 rounded-full mt-1 shrink-0"
                style={{ backgroundColor: NODE_COLORS[node.type] || '#6b7280' }}
              />
              <div>
                <p className="text-xs font-medium text-gray-200">{node.label}</p>
                {node.description && (
                  <p className="text-xs text-gray-500 mt-0.5">{node.description.substring(0, 60)}...</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ConceptMapper({ sharedContent, onContentChange }) {
  const [content, setContent] = useState(sharedContent || '');
  const [subject, setSubject] = useState('');
  const [conceptMap, setConceptMap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGenerate() {
    if (!content.trim()) { setError('Please enter content to map'); return; }
    setError('');
    setLoading(true);

    try {
      const res = await studyAPI.generateConceptMap({ content, subject });
      setConceptMap(res.conceptMap);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Input */}
        <div className="card space-y-4">
          <h3 className="section-title">
            <Map className="w-4 h-4 text-ibm-blue-light" />
            Concept Map Generator
          </h3>

          <div>
            <label className="label">Subject</label>
            <input value={subject} onChange={e => setSubject(e.target.value)}
              className="input" placeholder="e.g. Machine Learning" />
          </div>

          <ContentInput
            value={content}
            onChange={(v) => { setContent(v); onContentChange?.(v); }}
            onFileLoad={(text) => { setContent(text); onContentChange?.(text); }}
            rows={8}
          />

          {error && <ErrorMessage error={error} />}

          <button
            onClick={handleGenerate}
            disabled={loading || !content.trim()}
            className="btn-primary w-full justify-center"
          >
            {loading ? '⟳ Mapping...' : '🗺️ Generate Map'}
          </button>

          {/* Legend */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Legend</p>
            {Object.entries(NODE_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs text-gray-400 capitalize">{type} concept</span>
              </div>
            ))}
          </div>
        </div>

        {/* Map Visualization */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="card h-full min-h-64">
              <AILoader message="IBM Granite is mapping your knowledge..." />
            </div>
          ) : conceptMap ? (
            <ConceptMapVisualization conceptMap={conceptMap} />
          ) : (
            <div className="card h-full min-h-64 flex flex-col items-center justify-center gap-3 text-center">
              <div className="text-4xl opacity-30">🗺️</div>
              <p className="text-sm text-gray-500">Your concept map will render here</p>
              <p className="text-xs text-gray-600">AI-powered knowledge visualization</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
