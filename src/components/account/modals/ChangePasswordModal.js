import React from 'react';

const ChangePasswordModal = ({ open, onClose, data, onChange, onSubmit }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-ink/50 flex items-center justify-center z-[1000] p-5 box-border animate-scrim-quick max768:p-0 max768:items-stretch" onClick={onClose}>
      <div className="bg-bg border border-line rounded max-w-[480px] max-h-[90vh] w-full overflow-y-auto relative animate-modal-quick max768:max-h-screen max768:max-w-[100vw] max768:rounded-none max768:border-x-0" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center px-6 py-5 border-b border-line sticky top-0 bg-bg z-[1001] max768:px-4 max768:py-3.5">
          <h2 className="m-0 text-lg font-semibold tracking-[-0.01em] text-ink max768:text-[16px]">Change Password</h2>
          <button className="w-8 h-8 inline-flex items-center justify-center bg-transparent border-0 cursor-pointer text-ink-2 transition-colors duration-fast ease-[ease] hover:bg-surface hover:text-ink text-[24px] p-0 rounded" onClick={onClose}>×</button>
        </div>

        <div className="p-6 max768:p-4">
          <div className="flex flex-col gap-4">
            <div className="form-group">
              <label className="block mb-1.5 text-sm font-medium tracking-[0.04em] text-ink" htmlFor="currentPassword">Current Password</label>
              <input
                type="password"
                id="currentPassword"
                className="w-full h-11 px-3.5 border border-line rounded bg-bg text-ink text-base box-border [transition:border-color_120ms_ease,box-shadow_120ms_ease] focus:outline-none focus:border-ink focus:[box-shadow:0_0_0_1px_var(--ink)]"
                value={data.currentPassword}
                onChange={(e) => onChange('currentPassword', e.target.value)}
                placeholder="Enter your current password"
              />
            </div>
            <div className="form-group">
              <label className="block mb-1.5 text-sm font-medium tracking-[0.04em] text-ink" htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                className="w-full h-11 px-3.5 border border-line rounded bg-bg text-ink text-base box-border [transition:border-color_120ms_ease,box-shadow_120ms_ease] focus:outline-none focus:border-ink focus:[box-shadow:0_0_0_1px_var(--ink)]"
                value={data.newPassword}
                onChange={(e) => onChange('newPassword', e.target.value)}
                placeholder="Enter new password (min 8 characters)"
              />
            </div>
            <div className="form-group">
              <label className="block mb-1.5 text-sm font-medium tracking-[0.04em] text-ink" htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                className="w-full h-11 px-3.5 border border-line rounded bg-bg text-ink text-base box-border [transition:border-color_120ms_ease,box-shadow_120ms_ease] focus:outline-none focus:border-ink focus:[box-shadow:0_0_0_1px_var(--ink)]"
                value={data.confirmPassword}
                onChange={(e) => onChange('confirmPassword', e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            <div className="flex gap-2 justify-end pt-4 border-t border-line max768:flex-col-reverse">
              <button
                className="btn-primary max768:w-full"
                onClick={onSubmit}
                disabled={!data.currentPassword || !data.newPassword || !data.confirmPassword}
              >
                Change Password
              </button>
              <button className="btn-secondary max768:w-full" onClick={onClose}>
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
