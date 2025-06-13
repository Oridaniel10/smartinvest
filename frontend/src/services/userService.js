import apiClient from './api';
import axios from 'axios';

/**
 * Fetches the complete profile data for the logged-in user.
 * This includes portfolio, transactions, and calculated stats.
 * @returns {Promise<object>} The user's profile data.
 */
export const getProfileData = async () => {
  try {
    const response = await apiClient.get('/user/profile');
    return response.data;
  } catch (error) {
    console.error("Error fetching user profile data:", error.response?.data?.error || error.message);
    throw new Error(error.response?.data?.error || 'Failed to fetch profile data');
  }
};

/**
 * Fetches the public profile data for a specific user by their username.
 * @param {string} username - The username of the user to fetch.
 * @returns {Promise<object>} The public profile data.
 */
export const getPublicUserData = async (username) => {
  const response = await apiClient.get(`/user/users/${username}/profile`);
  return response.data;
};

/**
 * Submits a form data object to update the user's profile image.
 * @param {FormData} formData - The form data containing the image file.
 * @returns {Promise<object>} The result of the upload.
 */
export const updateProfileImage = async (formData) => {
  try {
    const response = await apiClient.post('/user/profile/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating profile image:", error.response?.data?.error || error.message);
    throw new Error(error.response?.data?.error || 'Failed to update profile image');
  }
};

/**
 * Fetches the top users, ranked by performance.
 * @param {string} timeframe - The time window for performance calculation (e.g., '24h', '1m', 'all').
 * @returns {Promise<Array>} A list of top user objects with their stats.
 */
export const getTopUsers = async (timeframe = 'all') => {
  try {
    const response = await apiClient.get(`/user/top?timeframe=${timeframe}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching top users for timeframe ${timeframe}:`, error);
    throw error;
  }
};
