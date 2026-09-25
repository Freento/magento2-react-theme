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
    <div className="fixed inset-0 bg-ink/50 flex items-center justify-center z-[1000] p-5 box-border animate-scrim-quick max768:p-0 max768:items-stretch" onClick={onCancel}>
      <div className="bg-bg border border-line rounded max-w-[560px] max-h-[90vh] w-full overflow-y-auto relative animate-modal-quick max768:max-h-screen max768:max-w-[100vw] max768:rounded-none max768:border-x-0" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center px-6 py-5 border-b border-line sticky top-0 bg-bg z-[1001] max768:px-4 max768:py-3.5">
          <h2 className="m-0 text-lg font-semibold tracking-[-0.01em] text-ink max768:text-[16px]">Edit Profile</h2>
          <button className="w-8 h-8 inline-flex items-center justify-center bg-transparent border-0 cursor-pointer text-ink-2 transition-colors duration-fast ease-[ease] hover:bg-surface hover:text-ink text-[24px] p-0 rounded" onClick={onCancel}>×</button>
        </div>

        <div className="p-6 max768:p-4">
          <div className="profile-edit">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-3.5 max768:grid-cols-1">
              <div className="form-group">
                <label className="block mb-1.5 text-sm font-medium tracking-[0.04em] text-ink" htmlFor="firstname">First Name</label>
                <input
                  type="text"
                  id="firstname"
                  className="w-full h-11 px-3.5 border border-line rounded bg-bg text-ink text-base box-border [transition:border-color_120ms_ease,box-shadow_120ms_ease] focus:outline-none focus:border-ink focus:[box-shadow:0_0_0_1px_var(--ink)]"
                  value={formData.firstname}
                  onChange={(e) => onFieldChange('firstname', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="block mb-1.5 text-sm font-medium tracking-[0.04em] text-ink" htmlFor="lastname">Last Name</label>
                <input
                  type="text"
                  id="lastname"
                  className="w-full h-11 px-3.5 border border-line rounded bg-bg text-ink text-base box-border [transition:border-color_120ms_ease,box-shadow_120ms_ease] focus:outline-none focus:border-ink focus:[box-shadow:0_0_0_1px_var(--ink)]"
                  value={formData.lastname}
                  onChange={(e) => onFieldChange('lastname', e.target.value)}
                />
              </div>
              <div className="form-group">
                <div className="flex justify-between items-center mb-1.5 flex-wrap gap-2">
                  <label className="block mb-1.5 text-sm font-medium tracking-[0.04em] text-ink" htmlFor="email">Email Address</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id="enableEmailEdit"
                      className="w-4 h-4 accent-ink m-0 cursor-pointer"
                      checked={emailEditable}
                      onChange={(e) => onToggleEmailEditable(e.target.checked)}
                    />
                    <label htmlFor="enableEmailEdit" className="text-13 font-normal text-ink-2 m-0 cursor-pointer">
                      Allow email change
                    </label>
                  </div>
                </div>
                <input
                  type="email"
                  id="email"
                  className="w-full h-11 px-3.5 border border-line rounded bg-bg text-ink text-base box-border [transition:border-color_120ms_ease,box-shadow_120ms_ease] focus:outline-none focus:border-ink focus:[box-shadow:0_0_0_1px_var(--ink)]"
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
                  <small className="block mt-1 text-sm text-ink-2 leading-[1.4]">
                    ⚠️ Changing your email may require verification and could affect your login credentials.
                  </small>
                )}
              </div>
              <div className="form-group">
                <label className="block mb-1.5 text-sm font-medium tracking-[0.04em] text-ink" htmlFor="dateOfBirth">Date of Birth</label>
                <input
                  type="date"
                  id="dateOfBirth"
                  className="w-full h-11 px-3.5 border border-line rounded bg-bg text-ink text-base box-border [transition:border-color_120ms_ease,box-shadow_120ms_ease] focus:outline-none focus:border-ink focus:[box-shadow:0_0_0_1px_var(--ink)]"
                  value={formData.date_of_birth}
                  onChange={(e) => onFieldChange('date_of_birth', e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-end pt-4 border-t border-line max768:flex-col-reverse max768:items-stretch">
              <button className="btn-primary max768:w-full" onClick={onSave}>Save Changes</button>
              <button className="btn-secondary max768:w-full" onClick={onCancel}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
