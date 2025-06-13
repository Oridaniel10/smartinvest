import apiClient from './api';

/**
 * Saves a single chat message to the backend.
 * @param {object} messageData - { message, role, session_id }
 * @returns {Promise<object>} The response from the server, including the session_id.
 */
export const saveMessage = async (messageData) => {
    const response = await apiClient.post('/chat/send', messageData);
    return response.data;
};

/**
 * Deletes all messages for a given session from the backend.
 * @param {string} sessionId - The ID of the session to delete.
 */
export const deleteSession = async (sessionId) => {
    if (!sessionId) return;
    try {
        await apiClient.delete(`/chat/sessions/${sessionId}`);
    } catch (error) {
        console.error(`Failed to delete session ${sessionId}:`, error);
        // We don't re-throw the error as this is a cleanup task
    }
};

/**
 * Fetches the message history for a given session.
 * @param {string} sessionId - The ID of the session to fetch history for.
 * @returns {Promise<Array>} A list of messages.
 */
export const getHistory = async (sessionId) => {
    if (!sessionId) return { messages: [] };
    const response = await apiClient.get(`/chat/history?session_id=${sessionId}`);
    return response.data;
} 