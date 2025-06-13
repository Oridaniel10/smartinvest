import React, { useState, useEffect, useRef } from 'react';
import { saveMessage, deleteSession } from '../services/chatService';
import { getProfileData } from '../services/userService';
import { generateProfileAsText } from '../utils/pdfGenerator';
import { calculatePortfolioStats } from '../utils/portfolioCalculations';
import Spinner from '../components/Spinner';

// Azure AI Inference Client setup
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
const AI_ENDPOINT = "https://models.github.ai/inference";
const AI_MODEL = "openai/gpt-4.1-nano";

const aiClient = GITHUB_TOKEN ? ModelClient(AI_ENDPOINT, new AzureKeyCredential(GITHUB_TOKEN)) : null;

const Message = ({ role, content }) => (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-xl p-3 rounded-lg ${role === 'user' ? 'bg-pink-500 text-white' : 'bg-gray-700 text-gray-200'}`}>
            <p>{content}</p>
        </div>
    </div>
);

function ChatPage() {
    const [messages, setMessages] = useState([{ role: 'ai', content: 'Hello! How can I help you today?' }]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [profileContext, setProfileContext] = useState(null);
    const messagesEndRef = useRef(null);

    // Effect to fetch user data on mount
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const rawData = await getProfileData();
                const processedData = await calculatePortfolioStats(rawData);
                const textContext = generateProfileAsText(processedData);
                setProfileContext(textContext);
            } catch (error) {
                console.error("Failed to load user profile for chat context:", error);
            }
        };
        fetchUserData();
    }, []);

    // Effect for session management (create on mount, delete on unmount)
    useEffect(() => {
        const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setSessionId(newSessionId);
        console.log(`Chat session started: ${newSessionId}`);

        return () => {
            console.log(`Chat page unmounted. Deleting session: ${newSessionId}`);
            deleteSession(newSessionId);
        };
    }, []);

    // Effect to scroll to the bottom of the chat on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !aiClient) {
            if (!aiClient) console.error("AI Client not initialized. Is VITE_GITHUB_TOKEN set?");
            return;
        }

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            await saveMessage({ message: userMessage.content, role: 'user', session_id: sessionId });
            
            // Construct a valid message history for the API
            const apiHistory = [
                // Filter out the initial UI-only message
                ...messages.slice(1), 
                userMessage
            ].map(({ role, content }) => ({
                // Map our 'ai' role to the standard 'assistant' role for the API
                role: role === 'ai' ? 'assistant' : role,
                content
            }));
            
            // Prepend the user's profile context if it exists
            const systemPrompt = `You are SmartInvest AI, a helpful and concise financial assistant.
            The user has provided the following summary of their investment portfolio. Use this information to answer their questions accurately.
            ---
            ${profileContext || "User has not provided portfolio context."}
            ---
            `;

            const response = await aiClient.path("/chat/completions").post({
                body: {
                    messages: [
                        { role: "system", content: systemPrompt },
                        ...apiHistory
                    ],
                    model: AI_MODEL,
                    temperature: 0.7,
                }
            });

            if (isUnexpected(response)) {
                const errorBody = response.body.error;
                throw new Error(errorBody?.message || "Failed to get response from AI.");
            }

            const aiMessageContent = response.body.choices[0]?.message?.content || "Sorry, I couldn't process that.";
            const aiMessage = { role: 'ai', content: aiMessageContent };
            
            setMessages(prev => [...prev, aiMessage]);
            await saveMessage({ message: aiMessage.content, role: 'ai', session_id: sessionId });

        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage = { role: 'ai', content: `Error: ${error.message}` };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] bg-gray-800 text-white">
            <div className="flex-grow p-6 space-y-4 overflow-y-auto">
                {messages.map((msg, index) => (
                    <Message key={index} role={msg.role} content={msg.content} />
                ))}
                {isLoading && <Message role="ai" content={<Spinner />} />}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 bg-gray-900 border-t border-gray-700">
                <form onSubmit={handleSendMessage} className="flex items-center gap-4">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask me anything..."
                        className="flex-grow bg-gray-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
                        disabled={isLoading}
                    />
                    <button type="submit" className="bg-pink-600 hover:bg-pink-700 rounded-lg px-6 py-3 font-semibold transition" disabled={isLoading}>
                        Send
                    </button>
                    {profileContext && (
                        <button 
                            type="button" 
                            title="Analyze my portfolio"
                            onClick={() => setInput(prev => `Based on my portfolio, ${prev}`)}
                            className="bg-green-600 hover:bg-green-700 rounded-lg p-3"
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </button>
                    )}
                </form>
                 {!aiClient && <p className="text-red-500 text-xs mt-2 text-center">AI service is not configured. Please check your API key.</p>}
            </div>
        </div>
    );
}

export default ChatPage;