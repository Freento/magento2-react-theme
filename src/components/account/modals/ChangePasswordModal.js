import React from 'react';

const ChangePasswordModal = ({ open, onClose, data, onChange, onSubmit }) => {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="change-password-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Change Password</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          <div className="password-form">
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <input
                type="password"
                id="currentPassword"
                value={data.currentPassword}
                onChange={(e) => onChange('currentPassword', e.target.value)}
                placeholder="Enter your current password"
              />
            </div>
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                value={data.newPassword}
                onChange={(e) => onChange('newPassword', e.target.value)}
                placeholder="Enter new password (min 8 characters)"
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={data.confirmPassword}
                onChange={(e) => onChange('confirmPassword', e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            <div className="password-actions">
              <button
                className="btn-primary"
                onClick={onSubmit}
                disabled={!data.currentPassword || !data.newPassword || !data.confirmPassword}
              >
                Change Password
              </button>
              <button className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
