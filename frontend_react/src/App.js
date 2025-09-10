import React, { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

/**
 * Derive the backend base URL from environment variables with a sensible default.
 * Uses:
 * - REACT_APP_API_BASE for full URL override
 * - REACT_APP_API_HOST and REACT_APP_API_PORT to construct http://HOST:PORT
 * Defaults to http://localhost:3001
 */
function useApiBase() {
  const base = useMemo(() => {
    const explicit = process.env.REACT_APP_API_BASE;
    if (explicit) return explicit.replace(/\/+$/, '');
    const host = process.env.REACT_APP_API_HOST || 'localhost';
    const port = process.env.REACT_APP_API_PORT || '3001';
    return `http://${host}:${port}`;
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
      const res = await fetch(`${apiBase}/api/ask`, {
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
          Backend: <code>{apiBase}/api/ask</code> — override with REACT_APP_API_BASE or host/port env vars.
        </div>
      </footer>
    </div>
  );
}

export default App;
