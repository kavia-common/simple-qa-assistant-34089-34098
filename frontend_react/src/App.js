import React, { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

/**
 * Derive the backend base URL from environment variables with a sensible default.
 * Priority:
 * 1. REACT_APP_API_BASE (full absolute URL, e.g. https://api.example.com/api)
 * 2. REACT_APP_API_HOST + REACT_APP_API_PORT -> http://HOST:PORT
 * 3. Default to relative '' so CRA dev proxy can forward /api to 3001 (avoids CORS in dev)
 */
function useApiBase() {
  const base = useMemo(() => {
    const explicit = process.env.REACT_APP_API_BASE;
    if (explicit) return explicit.replace(/\/+$/, '');
    const host = process.env.REACT_APP_API_HOST;
    const port = process.env.REACT_APP_API_PORT;
    if (host || port) {
      const h = host || 'localhost';
      const p = port || '3001';
      return `http://${h}:${p}`;
    }
    // Use relative base by default so that CRA proxy handles CORS in dev
    return '';
  }, []);
  return base;
}

// PUBLIC_INTERFACE
function App() {
  // UI State
  const [messages, setMessages] = useState([
    { id: 'welcome-1', role: 'assistant', content: 'Hi! Ask me anything and I’ll do my best to help.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-scroll to bottom on new message
  const endRef = useRef(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Theme: light only as requested, but keep attribute for future compatibility
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  const apiBase = useApiBase();

  // PUBLIC_INTERFACE
  /**
   * Submit a question to the backend and append the assistant response.
   * - Adds the user message immediately for instant feedback.
   * - Shows a loading indicator until the response returns.
   */
  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    const question = input.trim();
    if (!question || loading) return;

    const userMsg = { id: `u-${Date.now()}`, role: 'user', content: question };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Prefer trailing slash to match backend path definition (/api + /ask/)
      const askPath = '/api/ask/';
      const url = `${apiBase}${askPath}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Request failed (${res.status}): ${text || res.statusText}`);
      }

      const data = await res.json();
      const answer = data?.answer ?? data?.response ?? JSON.stringify(data);
      const assistantMsg = { id: `a-${Date.now()}`, role: 'assistant', content: String(answer) };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const assistantMsg = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: `Sorry, I couldn't get an answer right now.\n\nDetails: ${err.message}`
      };
      setMessages(prev => [...prev, assistantMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App chat-app">
      <header className="chat-header">
        <div className="chat-brand">Simple Q&A</div>
        <div className="chat-subtitle">Minimal chat interface</div>
      </header>

      <main className="chat-main">
        <div className="messages" role="log" aria-live="polite" aria-busy={loading}>
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`message ${msg.role === 'user' ? 'from-user' : 'from-assistant'}`}
            >
              <div className="bubble">
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="message from-assistant">
              <div className="bubble bubble-loading" aria-label="Loading">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </main>

      <footer className="chat-footer">
        <form onSubmit={handleSubmit} className="input-row">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            className="text-input"
            placeholder="Ask a question..."
            aria-label="Your question"
            disabled={loading}
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={loading || !input.trim()}
            title="Send"
          >
            {loading ? 'Sending…' : 'Send'}
          </button>
        </form>
        <div className="api-tip">
          Backend endpoint: <code>{`${apiBase || ''}/api/ask/`}</code>
          <br />
          Tip: In development, we route via CRA proxy (package.json "proxy" -> http://localhost:3001) to avoid CORS.
          Use REACT_APP_API_BASE (or REACT_APP_API_HOST/REACT_APP_API_PORT) to call directly without the proxy.
        </div>
      </footer>
    </div>
  );
}

export default App;
