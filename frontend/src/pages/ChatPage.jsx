import React, { useState, useEffect, useRef } from 'react';
import { askQuestion, deleteSession } from '../services/chatService';
import Spinner from '../components/Spinner';

const Message = ({ role, content }) => (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-xl p-3 rounded-lg ${role === 'user' ? 'bg-pink-500 text-white' : 'bg-gray-700 text-gray-200'}`}>
            {/* Check if content is a component (like Spinner) or text */}
            {React.isValidElement(content) ? content : <p>{content}</p>}
        </div>
    </div>
);

function ChatPage() {
    const [messages, setMessages] = useState([{ role: 'ai', content: 'Hello! How can I help you today?' }]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [sessionName, setSessionName] = useState("Untitled Chat");
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);

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
        if (!input.trim() || isLoading) return;

        const userMessage = { role: 'user', content: input };
        const newMessages = [...messages, userMessage];
        
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            // The backend now handles context, AI calls, and saving messages.
            const aiMessage = await askQuestion({
                messages: newMessages.slice(1), // Exclude the initial UI-only message
                session_id: sessionId,
                session_name: sessionName,
            });
            
            setMessages(prev => [...prev, aiMessage]);

            // Set session name after first user message
            if (messages.length === 1) { // This means only the initial AI message was there
                const newName = input.substring(0, 30); // Use first 30 chars as name
                setSessionName(newName);
            }

        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage = { role: 'ai', content: `Error: ${error.response?.data?.error || error.message}` };
            setError(errorMessage.content);
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Helper button to preload a question about the portfolio
    const analyzePortfolio = () => {
        setInput(prev => `Based on my portfolio, ${prev}`);
    }

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
                        placeholder="Ask me anything about your portfolio..."
                        className="flex-grow bg-gray-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
                        disabled={isLoading}
                    />
                    <button 
                        type="button" 
                        title="Analyze my portfolio"
                        onClick={analyzePortfolio}
                        className="bg-green-600 hover:bg-green-700 rounded-lg p-3"
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </button>
                    <button type="submit" className="bg-pink-600 hover:bg-pink-700 rounded-lg px-6 py-3 font-semibold transition" disabled={isLoading}>
                        Send
                    </button>
                </form>
                 {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}
            </div>
        </div>
    );
}

export default ChatPage;