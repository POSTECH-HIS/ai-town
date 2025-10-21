import React, { useState } from 'react';

export const NewPanel: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [savedTexts, setSavedTexts] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      setSavedTexts([...savedTexts, inputText.trim()]);
      setInputText('');
    }
  };

  return (
    <div style={{
      background: '#1a1a1a',
      borderRadius: '8px',
      padding: '16px',
      color: '#fff',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '16px',
        gap: '8px'
      }}>
        <span style={{ fontSize: '20px' }}>💭</span>
        <h2 style={{
          margin: 0,
          fontSize: '16px',
          fontWeight: 600
        }}>Social Event Injection</h2>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            style={{
              background: '#2a2a2a',
              border: '1px solid #3a3a3a',
              borderRadius: '6px',
              padding: '12px',
              color: '#fff',
              fontSize: '14px',
              minHeight: '80px',
              resize: 'vertical'
            }}
            placeholder="Enter a social event or conversation topic..."
          />
          <button
            type="submit"
            style={{
              background: '#4CAF50',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'background 0.2s',
              fontWeight: 500
            }}
            onMouseOver={e => (e.currentTarget.style.background = '#45a049')}
            onMouseOut={e => (e.currentTarget.style.background = '#4CAF50')}
          >
            Inject Event
          </button>
        </div>
      </form>

      {savedTexts.length > 0 && (
        <div style={{
          marginTop: '20px',
          borderTop: '1px solid #3a3a3a',
          paddingTop: '16px'
        }}>
          <h3 style={{
            fontSize: '14px',
            fontWeight: 600,
            marginBottom: '12px',
            color: '#aaa'
          }}>Recent Events</h3>
          <ul style={{
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {savedTexts.map((text, index) => (
              <li
                key={index}
                style={{
                  background: '#2a2a2a',
                  borderRadius: '6px',
                  padding: '12px',
                  fontSize: '14px',
                  lineHeight: '1.4',
                  color: '#ddd'
                }}
              >
                {text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};