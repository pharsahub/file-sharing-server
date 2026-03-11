import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import UploadDropzone from '../components/UploadDropzone';
import ShareModal from '../components/ShareModal';

export default function Dashboard() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shareFile, setShareFile] = useState(null);
  const { token } = useAuth();

  const fetchFiles = async () => {
    try {
      const res = await fetch('/api/files', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setFiles(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    
    try {
      await fetch(`/api/files/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setFiles(files.filter(f => f.id !== id));
    } catch (e) {
      alert('Delete failed');
    }
  };

  const handleDownload = async (file) => {
    // Note: Can't easily use standard <a> tag with JWT since it sends in headers.
    // Fetch blob and trigger download
    try {
      const res = await fetch(`/api/files/${file.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.original_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert('Download failed');
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>My Files</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage and share your uploaded content securely.</p>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <UploadDropzone onUploadSuccess={(newFile) => setFiles([newFile, ...files])} />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading files...</div>
        ) : files.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: '1rem', opacity: 0.5 }}>
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
              <polyline points="13 2 13 9 20 9"></polyline>
            </svg>
            <p>No files uploaded yet.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Name</th>
                <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Size</th>
                <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Date</th>
                <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map(file => (
                <tr key={file.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-hover)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                        <polyline points="13 2 13 9 20 9"></polyline>
                      </svg>
                      {file.original_name}
                    </div>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{formatSize(file.file_size)}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{new Date(file.upload_date).toLocaleDateString()}</td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button className="btn btn-outline" style={{ padding: '0.4rem', fontSize: '0.8rem' }} onClick={() => handleDownload(file)}>Download</button>
                      <button className="btn btn-outline" style={{ padding: '0.4rem', fontSize: '0.8rem' }} onClick={() => setShareFile(file)}>Share</button>
                      <button className="btn btn-danger" style={{ padding: '0.4rem', fontSize: '0.8rem' }} onClick={() => handleDelete(file.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {shareFile && <ShareModal file={shareFile} onClose={() => setShareFile(null)} />}
    </div>
  );
}
