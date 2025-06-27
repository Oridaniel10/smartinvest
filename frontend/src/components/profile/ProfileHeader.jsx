import React, { useRef, useState } from 'react';
import { updateProfileImage, updateUserPrivacy } from '../../services/userService';
import apiClient from '../../services/apiClient'; // apiClient for deposit
import Spinner from '../Spinner';
import { generateProfilePdf } from '../../utils/pdfGenerator';

/**
 * Displays user's profile info, P/L stats, and allows image updates and deposits.
 * 
 * @param {object} props - The component props.
 * @param {object} props.user - The enhanced user object from the /profile endpoint.
 * @param {Function} props.onImageUpdate - Callback for image update.
 * @param {Function} props.onTransactionSuccess - Callback for deposit success.
 * @param {Function} props.onPrivacyUpdate - Callback for privacy status update.
 * @param {boolean} [props.isPublicView=false] - If true, hides action buttons.
 */
function ProfileHeader({ user, onImageUpdate, onTransactionSuccess, onPrivacyUpdate, isPublicView = false }) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const fileInputRef = useRef(null);

  const handleImageClick = () => fileInputRef.current.click();

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profile_image', file);

    setIsUploading(true);
    try {
      const result = await updateProfileImage(formData);
      onImageUpdate(result.new_image_url);
    } catch (error) {
      alert(`Error updating image: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePrivacyChange = async (e) => {
    const newIsPublic = e.target.checked;
    setIsUpdatingPrivacy(true);
    try {
        await updateUserPrivacy(newIsPublic);
        onPrivacyUpdate(newIsPublic); // Notify parent component of the change
    } catch (error) {
        alert(`Failed to update privacy settings: ${error.message}`);
        // If the API call fails, we rely on the parent to pass the original state back down
        // to revert the toggle visually, ensuring UI consistency.
    } finally {
        setIsUpdatingPrivacy(false);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid positive amount.');
      return;
    }
    setIsDepositing(true);
    try {
      await apiClient.post('/transaction/deposit', { amount });
      alert('Deposit successful!');
      onTransactionSuccess(); // Refresh profile data
      setDepositAmount('');
    } catch (error) {
      alert(`Deposit failed: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsDepositing(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      await generateProfilePdf(user);
    } catch (error) {
      console.error("PDF Generation failed", error);
      alert(`Could not generate PDF: ${error.message}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!user) return null;

  const realizedPlColor = user.realized_pl >= 0 ? 'text-green-400' : 'text-red-400';
  const realizedPlSymbol = user.realized_pl >= 0 ? '+' : '';

  const unrealizedPlColor = user.unrealized_pl >= 0 ? 'text-green-400' : 'text-red-400';
  const unrealizedPlSymbol = user.unrealized_pl >= 0 ? '+' : '';

  const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);

  return (
    <div className="bg-white/5 dark:bg-gray-800/20 backdrop-blur-sm rounded-xl shadow-lg border border-white/10 p-6">
      {/* Top section: Image and Name */}
      <div className="flex flex-col items-center gap-4">
        <div className={`relative group ${!isPublicView && 'cursor-pointer'}`} onClick={!isPublicView ? handleImageClick : undefined}>
           <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" disabled={isPublicView} />
          <img
            src={user.profile_image}
            alt={`${user.name}'s profile`}
            className="w-32 h-32 rounded-full object-cover border-4 border-pink-500 shadow-md transition-opacity group-hover:opacity-50"
          />
          {!isPublicView && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              {isUploading ? <Spinner /> : <span className="text-white text-center text-sm">Change Photo</span>}
            </div>
          )}
        </div>
        <div className="text-center">
           <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{user.name}</h1>
        </div>

        {!isPublicView && (
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Private</span>
            <label htmlFor="privacy-toggle" className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="privacy-toggle"
                checked={user.is_public}
                onChange={handlePrivacyChange}
                className="sr-only peer"
                disabled={isUpdatingPrivacy}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-pink-600"></div>
            </label>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-300">Public</span>
          </div>
        )}
      </div>
      
      {/* Divider */}
      <hr className="my-6 border-white/10" />

      {/* Bottom section: Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
        <div>
          <span className="text-sm text-gray-400">Total Equity</span>
          <p className="text-xl font-semibold text-gray-800 dark:text-white">{formatCurrency(user.total_equity)}</p>
        </div>
        <div>
          <span className="text-sm text-gray-400">Cash Balance</span>
          <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(user.balance)}</p>
        </div>
        <div>
          <span className="text-sm text-gray-400">Unrealized P/L</span>
          <p className={`text-xl font-semibold ${unrealizedPlColor}`}>{unrealizedPlSymbol}{formatCurrency(user.unrealized_pl)}</p>
        </div>
        <div>
          <span className="text-sm text-gray-400">Realized P/L</span>
          <p className={`text-xl font-semibold ${realizedPlColor}`}>{realizedPlSymbol}{formatCurrency(user.realized_pl)}</p>
        </div>
        <div>
          <span className="text-sm text-gray-400">Total Deposits</span>
          <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(user.net_contributions)}</p>
        </div>
        <div>
          <span className="text-sm text-gray-400">Total Commissions</span>
          <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(user.total_commissions)}</p>
        </div>
      </div>
      
       {/* Deposit Form moved below stats - shown only in private view */}
      {!isPublicView && (
        <form onSubmit={handleDeposit} className="mt-6 border-t border-white/10 pt-4 flex flex-col sm:flex-row items-center gap-3">
            <label htmlFor="deposit" className="sr-only">Deposit Amount</label>
            <input
            id="deposit"
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="Add cash to balance"
            className="form-input flex-grow w-full sm:w-auto"
            min="0.01"
            step="any"
            />
            <button type="submit" disabled={isDepositing} className="btn-secondary w-full sm:w-auto">
            {isDepositing ? <Spinner /> : 'Deposit'}
            </button>
            <button type="button" onClick={handleDownloadPdf} disabled={isGeneratingPdf} className="btn-secondary w-full sm:w-auto">
                {isGeneratingPdf ? <Spinner /> : 'Download PDF'}
            </button>
        </form>
      )}
    </div>
  );
}

export default ProfileHeader; 