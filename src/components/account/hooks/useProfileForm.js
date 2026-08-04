import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { UPDATE_CUSTOMER_PROFILE, CHANGE_CUSTOMER_PASSWORD } from '../../../queries/customer';

export default function useProfileForm({ customerData, user, refetchCustomerData }) {
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isEmailEditable, setIsEmailEditable] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    date_of_birth: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const [updateCustomerProfile] = useMutation(UPDATE_CUSTOMER_PROFILE);
  const [changeCustomerPassword] = useMutation(CHANGE_CUSTOMER_PASSWORD);

  const handleEditProfile = () => {
    setEditFormData({
      firstname: customerData?.customer?.firstname || '',
      lastname: customerData?.customer?.lastname || '',
      email: customerData?.customer?.email || user.email,
      date_of_birth: customerData?.customer?.date_of_birth || ''
    });
    setIsEditProfileModalOpen(true);
    setSaveError('');
    setSaveSuccess('');
  };

  const handleCancelEdit = () => {
    setIsEditProfileModalOpen(false);
    setIsEmailEditable(false);
    setEditFormData({
      firstname: '',
      lastname: '',
      email: '',
      date_of_birth: ''
    });
    setSaveError('');
    setSaveSuccess('');
  };

  const handleSaveProfile = async () => {
    try {
      setSaveError('');
      setSaveSuccess('');

      const updateInput = {
        firstname: editFormData.firstname,
        lastname: editFormData.lastname,
        date_of_birth: editFormData.date_of_birth || null
      };

      if (isEmailEditable) {
        updateInput.email = editFormData.email;
      }

      await updateCustomerProfile({
        variables: { input: updateInput }
      });

      await refetchCustomerData();
      setIsEditProfileModalOpen(false);
      setIsEmailEditable(false);
      setSaveSuccess('Profile updated successfully!');

      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setSaveError(error.message || 'Failed to update profile. Please try again.');
    }
  };

  const handleInputChange = (field, value) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOpenChangePassword = () => {
    setIsChangePasswordModalOpen(true);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordError('');
    setPasswordSuccess('');
  };

  const handleCloseChangePassword = () => {
    setIsChangePasswordModalOpen(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordError('');
    setPasswordSuccess('');
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  const handleChangePassword = async () => {
    try {
      setPasswordError('');
      setPasswordSuccess('');

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setPasswordError('New passwords do not match.');
        return;
      }

      if (passwordData.newPassword.length < 8) {
        setPasswordError('New password must be at least 8 characters long.');
        return;
      }

      await changeCustomerPassword({
        variables: {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        }
      });

      setPasswordSuccess('Password changed successfully!');
      setTimeout(() => {
        setPasswordSuccess('');
        handleCloseChangePassword();
      }, 2000);
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordError(error.message || 'Failed to change password. Please check your current password and try again.');
    }
  };

  return {
    editFormData,
    isEditProfileModalOpen,
    isEmailEditable,
    setIsEmailEditable,
    passwordData,
    isChangePasswordModalOpen,
    // Toast messages (rendered app-side in MyAccount's toast stack).
    saveError, saveSuccess, setSaveError, setSaveSuccess,
    passwordError, passwordSuccess, setPasswordError, setPasswordSuccess,
    handleEditProfile,
    handleCancelEdit,
    handleSaveProfile,
    handleInputChange,
    handleOpenChangePassword,
    handleCloseChangePassword,
    handlePasswordChange,
    handleChangePassword,
  };
}
