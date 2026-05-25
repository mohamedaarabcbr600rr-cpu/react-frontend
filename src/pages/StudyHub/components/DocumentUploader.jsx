import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { studyService } from '../services/studyService';
import { motion } from 'framer-motion';

const DocumentUploader = ({ onComplete }) => {
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');

  const onDrop = useCallback((acceptedFiles) => {
    setFile(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'] },
    maxFiles: 1
  });

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }

    if (!file && !text.trim()) {
      alert('Please upload a file or paste text');
      return;
    }

    setUploading(true);
    try {
      const result = await studyService.uploadDocument({
        subject: localStorage.getItem('selected_subject'),
        title,
        file,
        text: text || null
      });
      onComplete(result.material);
    } catch (error) {
      console.error(error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="document-uploader">
      <h1>📄 Upload your document</h1>
      
      <input
        type="text"
        placeholder="Document title (ex: Chapter 3 - Functions)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="title-input"
      />

      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
        <input {...getInputProps()} />
        {file ? (
          <p>✅ {file.name}</p>
        ) : (
          <p>📁 Drag & drop a PDF or TXT file here, or click to select</p>
        )}
      </div>

      <div className="or-divider">— OR —</div>

      <textarea
        placeholder="Or paste your text here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
      />

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSubmit}
        disabled={uploading}
        className="upload-btn"
      >
        {uploading ? '⏳ Processing...' : '🚀 Generate AI Study Plan'}
      </motion.button>
    </div>
  );
};

export default DocumentUploader;
