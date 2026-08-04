import React from 'react';

const EditProfileModal = ({
  open,
  onCancel,
  formData,
  onFieldChange,
  emailEditable,
  onToggleEmailEditable,
  onSave,
}) => {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="edit-profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Profile</h2>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>

        <div className="modal-content">
          <div className="profile-edit">
            <div className="profile-grid">
              <div className="form-group">
                <label htmlFor="firstname">First Name</label>
                <input
                  type="text"
                  id="firstname"
                  value={formData.firstname}
                  onChange={(e) => onFieldChange('firstname', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastname">Last Name</label>
                <input
                  type="text"
                  id="lastname"
                  value={formData.lastname}
                  onChange={(e) => onFieldChange('lastname', e.target.value)}
                />
              </div>
              <div className="form-group">
                <div className="email-field-header">
                  <label htmlFor="email">Email Address</label>
                  <div className="email-checkbox">
                    <input
                      type="checkbox"
                      id="enableEmailEdit"
                      checked={emailEditable}
                      onChange={(e) => onToggleEmailEditable(e.target.checked)}
                    />
                    <label htmlFor="enableEmailEdit" className="checkbox-label">
                      Allow email change
                    </label>
                  </div>
                </div>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => onFieldChange('email', e.target.value)}
                  readOnly={!emailEditable}
                  style={{
                    background: emailEditable ? 'white' : '#f5f5f5',
                    cursor: emailEditable ? 'text' : 'not-allowed'
                  }}
                  placeholder={emailEditable ? 'Enter your email address' : ''}
                />
                {emailEditable && (
                  <small className="email-warning">
                    ⚠️ Changing your email may require verification and could affect your login credentials.
                  </small>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="dateOfBirth">Date of Birth</label>
                <input
                  type="date"
                  id="dateOfBirth"
                  value={formData.date_of_birth}
                  onChange={(e) => onFieldChange('date_of_birth', e.target.value)}
                />
              </div>
            </div>
            <div className="profile-actions">
              <button className="btn-primary" onClick={onSave}>Save Changes</button>
              <button className="btn-secondary" onClick={onCancel}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
