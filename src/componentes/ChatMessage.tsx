// Componente de Mensagem do Chat
import React from 'react';

interface ChatMessageProps {
    message: string;
    isUser: boolean;
    timestamp: Date;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isUser, timestamp }) => {
    return (
        <div className={`message-wrapper ${isUser ? 'message-user' : 'message-bot'}`}>
            <div className={`message-container ${isUser ? 'message-user-container' : 'message-bot-container'}`}>
                {/* Avatar */}
                <div className={`message-avatar ${isUser ? 'user-avatar' : 'bot-avatar'}`}>
                    {isUser ? (
                        <svg className="avatar-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 21V19C20 16.8 18.2 15 16 15H8C5.8 15 4 16.8 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    ) : (
                        <svg className="avatar-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="currentColor" strokeWidth="2" />
                            <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    )}
                </div>

                {/* Balão da mensagem */}
                <div className={`message-bubble ${isUser ? 'user-bubble' : 'bot-bubble'}`}>
                    <div className="message-content">{message}</div>
                    <div className={`message-time ${isUser ? 'user-time' : 'bot-time'}`}>
                        <svg className="time-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                            <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatMessage;