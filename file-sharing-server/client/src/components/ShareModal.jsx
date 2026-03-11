import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function ShareModal({ file, onClose }) {
  const [expiresIn, setExpiresIn] = useState('');
  const [password, setPassword] = useState('');
  const [shareData, setShareData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const handleShare = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fileId: file.id,
          expiresInDays: expiresIn || null,
          password: password || null
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setShareData(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareData.link);
    alert('Link copied to clipboard!');
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="card animate-fade-in" style={{ width: '90%', maxWidth: '500px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3>Share "{file.original_name}"</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
        </div>

        {!shareData ? (
          <form onSubmit={handleShare} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Expiration (Days) - Optional</label>
              <input type="number" min="1" className="input-field" value={expiresIn} onChange={e => setExpiresIn(e.target.value)} placeholder="e.g. 7" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Password - Optional</label>
              <input type="text" className="input-field" value={password} onChange={e => setPassword(e.target.value)} placeholder="Leave blank for public link" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Generating...' : 'Generate Link'}
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div style={{ padding: '1rem', backgroundColor: 'var(--surface-hover)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', wordBreak: 'break-all' }}>
              <a href={shareData.link} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)' }}>{shareData.link}</a>
            </div>
            {shareData.hasPassword && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>Password is required to access this link. Make sure you saved it.</p>}
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={copyToClipboard}>Copy Link</button>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>Done</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
