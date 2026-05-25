// pages/Profile/components/EditProfileModal.jsx
import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import axios from '../../../axios';
import './EditProfileModal.css';

const EditProfileModal = ({ isOpen, onClose, user, onUpdate }) => {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    name: user?.name || '',
    bio: user?.bio || '',
    profile_pic: null,
    link: user?.link || '',
  });
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(user?.profile_pic || null);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);
  const { t } = useTranslation();

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, profile_pic: t('editProfile.errors.imageTooLarge') }));
        return;
      }

      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, profile_pic: t('editProfile.errors.invalidImage') }));
        return;
      }

      setFormData(prev => ({ ...prev, profile_pic: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = t('editProfile.errors.usernameRequired');
    } else if (!/^[a-zA-Z0-9_.]+$/.test(formData.username)) {
      newErrors.username = t('editProfile.errors.usernameInvalid');
    }

    if (!formData.name.trim()) {
      newErrors.name = t('editProfile.errors.nameRequired');
    }

    if (formData.bio && formData.bio.length > 150) {
      newErrors.bio = t('editProfile.errors.bioTooLong');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const data = new FormData();
      data.append('username', formData.username);
      data.append('name', formData.name);
      data.append('bio', formData.bio);
      data.append('link', formData.link);

      if (formData.profile_pic) {
        data.append('profile_pic', formData.profile_pic);
      }

      data.append('_method', 'PUT');

      const response = await axios.post('/api/profile/update', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        onUpdate(response.data.user);
        onClose();
      }
    } catch (error) {
      console.error(t('editProfile.errors.updateError'), error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        alert(t('editProfile.errors.genericError'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-profile-overlay" onClick={onClose}>
      <div className="edit-profile-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="edit-profile-header">
          <h2 className="edit-profile-title">{t('editProfile.title')}</h2>
          <button
            className="edit-profile-close"
            onClick={onClose}
            aria-label={t('editProfile.close')}
          >
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="edit-profile-form">
          <div className="edit-profile-body">
            {/* Avatar Section */}
            <div className="avatar-upload-section">
              <div
                className="avatar-upload-preview"
                onClick={() => fileInputRef.current?.click()}
              >
                {previewImage ? (
                  <img
                    src={previewImage.startsWith('data:') ? previewImage : `import.meta.env.VITE_API_URL${previewImage}`}
                    alt={t('editProfile.preview')}
                    className="avatar-upload-image"
                  />
                ) : (
                  <div className="avatar-upload-placeholder">
                    <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" fill="none">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round"/>
                      <circle cx="12" cy="7" r="4" strokeLinecap="round"/>
                    </svg>
                  </div>
                )}
                <div className="avatar-upload-overlay">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleImageChange}
              />
              <span
                className="avatar-upload-text"
                onClick={() => fileInputRef.current?.click()}
              >
                {t('editProfile.changePhoto')}
              </span>
              {errors.profile_pic && (
                <span className="avatar-upload-error">{errors.profile_pic}</span>
              )}
            </div>

            {/* Username */}
            <div className="form-group">
              <label className="form-label">{t('editProfile.fields.username')}</label>
              <input
                type="text"
                name="username"
                className={`form-input ${errors.username ? 'has-error' : ''}`}
                value={formData.username}
                onChange={handleChange}
                placeholder={t('editProfile.placeholders.username')}
              />
              <span className="form-help">
                {t('editProfile.help.username')}
              </span>
              {errors.username && (
                <span className="form-error">{errors.username}</span>
              )}
            </div>

            {/* Name */}
            <div className="form-group">
              <label className="form-label">{t('editProfile.fields.name')}</label>
              <input
                type="text"
                name="name"
                className={`form-input ${errors.name ? 'has-error' : ''}`}
                value={formData.name}
                onChange={handleChange}
                placeholder={t('editProfile.placeholders.name')}
              />
              <span className="form-help">
                {t('editProfile.help.name')}
              </span>
              {errors.name && (
                <span className="form-error">{errors.name}</span>
              )}
            </div>

            {/* Bio */}
            <div className="form-group">
              <label className="form-label">{t('editProfile.fields.bio')}</label>
              <textarea
                name="bio"
                className={`form-textarea ${errors.bio ? 'has-error' : ''}`}
                value={formData.bio}
                onChange={handleChange}
                placeholder={t('editProfile.placeholders.bio')}
                maxLength="150"
                rows="3"
              />
              <div className="char-counter">
                <span className={formData.bio?.length >= 140 ? 'near-limit' : ''}>
                  {formData.bio?.length || 0}/150
                </span>
              </div>
              {errors.bio && (
                <span className="form-error">{errors.bio}</span>
              )}
            </div>

            {/* Link */}
            <div className="form-group">
              <label className="form-label">{t('editProfile.fields.link')}</label>
              <input
                type="url"
                name="link"
                className="form-input"
                value={formData.link}
                onChange={handleChange}
                placeholder={t('editProfile.placeholders.link')}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="edit-profile-footer">
            <button
              type="button"
              className="btn btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-save"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  {t('editProfile.saving')}
                </>
              ) : (
                <>{t('editProfile.save')}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;





