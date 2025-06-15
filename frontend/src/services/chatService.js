import apiClient from './api';

/**
 * Sends the entire conversation history to the backend to get a response from the AI.
 * The backend will save the user message and the AI response.
 * @param {object} payload - { messages, session_id, session_name }
 * @returns {Promise<object>} The AI's response message object { role, content }.
 */
export const askQuestion = async (payload) => {
    const response = await apiClient.post('/chat/ask', payload);
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