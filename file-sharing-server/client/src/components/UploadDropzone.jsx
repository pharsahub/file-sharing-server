import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function UploadDropzone({ onUploadSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { token } = useAuth();
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files) => {
    // For simplicity in this demo, uploading the first file
    // Ideally, iterate and do chunked uploads for large ones.
    const file = files[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    
    // Using XMLHttpRequest to track progress easily
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/files/upload', true);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percentComplete = (e.loaded / e.total) * 100;
        setProgress(Math.round(percentComplete));
      }
    };
    
    xhr.onload = () => {
      if (xhr.status === 201) {
        setProgress(100);
        onUploadSuccess(JSON.parse(xhr.responseText));
      } else {
        alert('Upload failed: ' + xhr.responseText);
      }
      setTimeout(() => setUploading(false), 500);
    };
    
    xhr.onerror = () => {
      alert('Upload failed due to network error');
      setUploading(false);
    };
    
    xhr.send(formData);
  };

  return (
    <div 
      style={{
        width: '100%',
        padding: '2rem',
        border: `2px dashed ${dragActive ? 'var(--primary-color)' : 'var(--border-color)'}`,
        borderRadius: 'var(--radius-lg)',
        backgroundColor: dragActive ? 'rgba(99, 102, 241, 0.05)' : 'var(--surface-color)',
        textAlign: 'center',
        transition: 'var(--transition)',
        position: 'relative'
      }}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input 
        ref={inputRef}
        type="file"
        multiple
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      
      {!uploading ? (
        <div>
          <div style={{ marginBottom: '1rem' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </div>
          <h3 style={{ marginBottom: '0.5rem' }}>Drag & Drop files here</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.875rem' }}>or click to browse from your computer</p>
          <button className="btn btn-primary" onClick={() => inputRef.current.click()}>
            Browse Files
          </button>
        </div>
      ) : (
        <div>
          <h3 style={{ marginBottom: '1rem' }}>Uploading... {progress}%</h3>
          <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--surface-hover)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', backgroundColor: 'var(--primary-color)', transition: 'width 0.2s ease' }}></div>
          </div>
        </div>
      )}
    </div>
  );
}
