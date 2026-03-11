import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function LocalDiscovery() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [ws, setWs] = useState(null);
  const [status, setStatus] = useState('Connecting...');

  // Use a stable ID for the session
  const [myId] = useState(Math.random().toString(36).substring(7));
  const device = navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop';

  useEffect(() => {
    const wsUrl = process.env.NODE_ENV === 'development' 
      ? 'ws://localhost:5000/discovery' 
      : `wss://${window.location.host}/discovery`;
      
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      setStatus('Discovering nearby devices...');
      websocket.send(JSON.stringify({
        type: 'register',
        id: myId,
        name: user?.username || `GuestUser_${Math.floor(Math.random()*100)}`,
        device
      }));
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'users') {
          // filter out self
          setUsers(data.users.filter(u => u.id !== myId));
        } else if (data.type === 'signal') {
          alert(`Received transfer request from ${data.sender}. (WebRTC setup goes here)`);
        }
      } catch (e) {
        console.error('WS Error:', e);
      }
    };

    websocket.onclose = () => {
      setStatus('Disconnected from discovery server.');
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [user]);

  const initiateTransfer = (targetId) => {
    // In a full WebRTC implementation, this would send an offer SDT
    if (ws) {
      ws.send(JSON.stringify({
        type: 'signal',
        target: targetId,
        signal: { type: 'offer', sdp: 'dummy-offer' }
      }));
      alert('Transfer initiated! (WebRTC connection simulation)');
    }
  };

  return (
    <div className="animate-fade-in" style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Local Network Transfer</h1>
        <p style={{ color: 'var(--text-muted)' }}>{status}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
        {/* Radar Effect for My Device */}
        <div style={{ 
          width: '120px', height: '120px', 
          borderRadius: '50%', 
          backgroundColor: 'var(--surface-color)',
          border: '2px solid var(--primary-color)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--primary-color)', marginBottom: '0.25rem'}}>
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>You</span>
        </div>

        <div style={{ color: 'var(--border-color)', margin: '1rem 0' }}>↓</div>

        {/* Other Devices */}
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {users.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No other devices found on your network.</p>
          ) : (
            users.map(u => (
              <div 
                key={u.id} 
                className="card" 
                style={{ 
                  width: '150px', 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', 
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  padding: '1.5rem 1rem'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                onClick={() => initiateTransfer(u.id)}
              >
                {u.device === 'Mobile' ? (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{color: 'inherit', marginBottom: '0.5rem'}}><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                ) : (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{color: 'inherit', marginBottom: '0.5rem'}}><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                )}
                <span style={{ fontWeight: 500, display: 'block' }}>{u.name}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.ip}</span>
                <button className="btn btn-primary" style={{ marginTop: '1rem', padding: '0.25rem 0.5rem', width: '100%', fontSize: '0.75rem' }}>Send File</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
