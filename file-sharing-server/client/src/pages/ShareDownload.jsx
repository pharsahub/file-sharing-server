import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

export default function ShareDownload() {
  const { token } = useParams();
  const [shareData, setShareData] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/share/${token}`)
      .then(res => res.json().then(data => ({ status: res.status, data })))
      .then(({ status, data }) => {
        if (status >= 400) {
          setError(data.error);
        } else {
          setShareData(data);
        }
        setLoading(false);
      })
      .catch(err => {
        setError('Network error');
        setLoading(false);
      });
  }, [token]);

  const handleDownload = async (e) => {
    e.preventDefault();
    if (shareData?.requiresPassword && !password) {
      alert('Password required');
      return;
    }

    try {
      const res = await fetch(`/api/share/${token}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password || undefined })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Download failed');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = shareData?.original_name || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message);
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return <div className="page-center">Loading share information...</div>;
  }

  if (error) {
    return (
      <div className="page-center animate-fade-in">
        <div className="card" style={{ textAlign: 'center', maxWidth: '400px', width: '100%' }}>
          <div style={{ color: 'var(--danger-color)', marginBottom: '1rem' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
          <h2>Link Invalid</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-center animate-fade-in">
      <div className="card" style={{ maxWidth: '450px', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{shareData.original_name}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{formatSize(shareData.file_size)}</p>
          </div>
        </div>

        <form onSubmit={handleDownload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {shareData.requiresPassword && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>This file is protected. Enter password:</label>
              <input 
                type="password" 
                className="input-field" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                placeholder="Password"
              />
            </div>
          )}
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Download File
          </button>
        </form>
      </div>
    </div>
  );
}
