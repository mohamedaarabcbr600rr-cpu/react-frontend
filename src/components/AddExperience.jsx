import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './AddExperience.css';
import axios from "../axios";

const AddExperience = ({ onAdd }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const fileInputRef = useRef(null);
  const { t } = useTranslation();

  const commonEmojis = ['😀', '😂', '😍', '🎉', '👍', '❤️', '🔥', '💪', '🌟', '📝', '💡', '🚀'];

  const handleMediaUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime'];
    const maxImages = 10;

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        setError(t('addExperience.errors.unsupportedFormat'));
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError(t('addExperience.errors.fileTooLarge'));
        return;
      }
    }

    if (mediaFiles.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} images autorisées.`);
      return;
    }

    const newPreviews = [];
    let loaded = 0;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push({
          src: reader.result,
          type: file.type.startsWith('image/') ? 'image' : 'video',
          name: file.name,
        });
        loaded++;
        if (loaded === files.length) {
          setMediaFiles(prev => [...prev, ...files]);
          setMediaPreviews(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setError('');
  };

  const removeMedia = (index) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const insertEmoji = (emoji) => setContent(prev => prev + emoji);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    if (!title.trim() || !content.trim()) {
      setError(t('addExperience.errors.fillAllFields'));
      setIsSubmitting(false);
      return;
    }
    if (title.length > 100) {
      setError(t('addExperience.errors.titleTooLong'));
      setIsSubmitting(false);
      return;
    }
    if (content.length > 1000) {
      setError(t('addExperience.errors.contentTooLong'));
      setIsSubmitting(false);
      return;
    }

    try {
      await axios.get('/sanctum/csrf-cookie');

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('content', content.trim());

      mediaFiles.forEach(file => formData.append('media[]', file));

      const res = await axios.post('/api/experiences', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      onAdd(res.data);
      setTitle('');
      setContent('');
      setMediaFiles([]);
      setMediaPreviews([]);
      setShowForm(false);
      setError('');
    } catch (err) {
      console.error(err.response?.data || err.message);
      if (err.response?.data?.errors) {
        setError(Object.values(err.response.data.errors).flat().join('\n'));
      } else {
        setError(t('addExperience.errors.genericError'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setTitle('');
    setContent('');
    setMediaFiles([]);
    setMediaPreviews([]);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getCharCounterColor = (length, max) => {
    if (length > max) return 'limit';
    if (length > max * 0.8) return 'warning';
    return '';
  };

  if (!showForm) {
    return (
      <div className="add-experience">
        <button className="add-experience__trigger" onClick={() => setShowForm(true)}>
          {t('addExperience.trigger')}
        </button>
      </div>
    );
  }

  return (
    <div className="add-experience">
      <form className="add-experience__form" onSubmit={handleSubmit}>
        {error && (
          <div className="add-experience__error">
            {error.split('\n').map((msg, i) => <div key={i}>{msg}</div>)}
          </div>
        )}

        <div className="add-experience__group">
          <label className="add-experience__label" htmlFor="title">
            {t('addExperience.titleLabel')}
          </label>
          <input
            id="title"
            type="text"
            className="add-experience__input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('addExperience.titlePlaceholder')}
            maxLength={100}
            required
            disabled={isSubmitting}
          />
          <div className={`add-experience__counter ${getCharCounterColor(title.length, 100)}`}>
            {t('addExperience.charCounter', { current: title.length, max: 100 })}
          </div>
        </div>

        <div className="add-experience__group">
          <label className="add-experience__label" htmlFor="content">
            {t('addExperience.contentLabel')}
          </label>
          <div className="add-experience__textarea-wrapper">
            <textarea
              id="content"
              className="add-experience__textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('addExperience.contentPlaceholder')}
              maxLength={1000}
              required
              disabled={isSubmitting}
            />
            <div className="add-experience__emoji-btn">
              <select
                onChange={(e) => e.target.value && insertEmoji(e.target.value)}
                value=""
                className="add-experience__emoji-select"
              >
                <option value="">😊</option>
                {commonEmojis.map(emoji => (
                  <option key={emoji} value={emoji}>{emoji}</option>
                ))}
              </select>
              <span>😊</span>
            </div>
          </div>
          <div className={`add-experience__counter ${getCharCounterColor(content.length, 1000)}`}>
            {t('addExperience.charCounter', { current: content.length, max: 1000 })}
          </div>
        </div>

        <div className="add-experience__group">
          <label className="add-experience__label">
            {t('addExperience.mediaLabel')}
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleMediaUpload}
            style={{ display: 'none' }}
            id="media-upload"
          />

          {mediaPreviews.length === 0 ? (
            <div className="add-experience__upload" onClick={() => fileInputRef.current?.click()}>
              <div className="add-experience__upload-icon">📸 📹</div>
              <div className="add-experience__upload-text">{t('addExperience.uploadText')}</div>
            </div>
          ) : (
            <div className="add-experience__multi-preview">
              {mediaPreviews.map((item, index) => (
                <div key={index} className="add-experience__multi-preview-item">
                  {item.type === 'image' ? (
                    <img src={item.src} alt={`preview-${index}`} className="add-experience__multi-preview-img" />
                  ) : (
                    <video src={item.src} className="add-experience__multi-preview-img" />
                  )}
                  <button
                    type="button"
                    className="add-experience__preview-remove"
                    onClick={() => removeMedia(index)}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <div
                className="add-experience__multi-preview-add"
                onClick={() => fileInputRef.current?.click()}
              >
                <span>+</span>
              </div>
            </div>
          )}
        </div>

        <div className="add-experience__buttons">
          <button
            type="button"
            className="add-experience__cancel"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            className="add-experience__submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? t('addExperience.publishing') : t('addExperience.publish')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddExperience;