import React, { useMemo, useState } from 'react';
import { askGemini } from '../utils/geminiApi';

function renderBoldText(text, keyPrefix) {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return (
                <strong key={`${keyPrefix}-bold-${index}`}>
                    {part.slice(2, -2)}
                </strong>
            );
        }
        return <React.Fragment key={`${keyPrefix}-txt-${index}`}>{part}</React.Fragment>;
    });
}

function renderMessageContent(content) {
    const blocks = content.split(/```[a-zA-Z]*\n?|```/g);
    const codeFenceCount = (content.match(/```/g) || []).length;
    const hasCode = codeFenceCount >= 2;

    if (!hasCode) {
        return <p className="ai-chat-message-text mb-0">{renderBoldText(content, 'plain')}</p>;
    }

    return blocks.map((block, index) => {
        const isCodeBlock = index % 2 === 1;
        if (isCodeBlock) {
            return (
                <pre key={`code-${index}`} className="ai-chat-code-block">
                    <code>{block.trim()}</code>
                </pre>
            );
        }

        if (!block.trim()) {
            return null;
        }

        return (
            <p key={`text-${index}`} className="ai-chat-message-text">
                {renderBoldText(block, `mixed-${index}`)}
            </p>
        );
    });
}

function AIChatWidget({ courseName }) {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const systemPrompt = useMemo(
        () => `You are a helpful coding tutor on CodeCampus. The student is currently studying ${courseName}. Answer their doubts clearly and concisely. Use code examples when helpful. Keep answers short and student-friendly.`,
        [courseName]
    );

    const handleSendMessage = async () => {
        const question = input.trim();
        if (!question || isLoading) {
            return;
        }

        const nextMessages = [...messages, { role: 'user', content: question }];
        const conversationHistory = messages.slice(-10);
        setMessages(nextMessages);
        setInput('');
        setIsLoading(true);

        try {
            const response = await askGemini(systemPrompt, question, conversationHistory);
            setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: 'AI is unavailable right now. Please try again.'
                }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="ai-chat-widget">
            {isOpen && (
                <div className="ai-chat-panel">
                    <div className="ai-chat-header">
                        <h6 className="mb-0">AI Doubt Solver</h6>
                        <small>{courseName}</small>
                    </div>
                    <div className="ai-chat-messages">
                        {messages.length === 0 ? (
                            <p className="ai-chat-empty">Ask your first doubt to get started.</p>
                        ) : (
                            messages.map((msg, index) => (
                                <div
                                    key={`${msg.role}-${index}`}
                                    className={`ai-chat-bubble ${msg.role === 'assistant' ? 'ai' : 'user'}`}
                                >
                                    {renderMessageContent(msg.content)}
                                </div>
                            ))
                        )}
                        {isLoading && (
                            <div className="ai-chat-bubble ai typing">
                                <span className="typing-dot"></span>
                                <span className="typing-dot"></span>
                                <span className="typing-dot"></span>
                            </div>
                        )}
                    </div>
                    <div className="ai-chat-input-row">
                        <textarea
                            rows={2}
                            className="ai-chat-input"
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask anything about this course..."
                        />
                        <button type="button" className="ai-chat-send" onClick={handleSendMessage} disabled={isLoading}>
                            Send
                        </button>
                    </div>
                </div>
            )}
            <button
                type="button"
                className="ai-chat-toggle"
                onClick={() => setIsOpen((prev) => !prev)}
                aria-label="Toggle AI chat"
            >
                💬
            </button>
        </div>
    );
}

export default AIChatWidget;
