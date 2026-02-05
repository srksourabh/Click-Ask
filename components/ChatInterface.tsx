
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import Spinner from './Spinner';
import SendIcon from './icons/SendIcon';
import RefreshIcon from './icons/RefreshIcon';

interface ChatInterfaceProps {
    documentName: string;
    history: ChatMessage[];
    isQueryLoading: boolean;
    onSendMessage: (message: string) => void;
    onNewChat: () => void;
    exampleQuestions: string[];
    contextImage?: { data: string, type: string } | null;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
    documentName, 
    history, 
    isQueryLoading, 
    onSendMessage, 
    onNewChat, 
    exampleQuestions,
    contextImage
}) => {
    const [query, setQuery] = useState('');
    const [currentSuggestion, setCurrentSuggestion] = useState('');
    const [modalContent, setModalContent] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (exampleQuestions.length === 0) {
            setCurrentSuggestion('');
            return;
        }

        setCurrentSuggestion(exampleQuestions[0]);
        let suggestionIndex = 0;
        const intervalId = setInterval(() => {
            suggestionIndex = (suggestionIndex + 1) % exampleQuestions.length;
            setCurrentSuggestion(exampleQuestions[suggestionIndex]);
        }, 5000);

        return () => clearInterval(intervalId);
    }, [exampleQuestions]);
    
    const renderMarkdown = (text: string) => {
        if (!text) return { __html: '' };

        const lines = text.split('\n');
        let html = '';
        let listType: 'ul' | 'ol' | null = null;
        let paraBuffer = '';

        function flushPara() {
            if (paraBuffer) {
                html += `<p class="my-3 leading-relaxed">${paraBuffer}</p>`;
                paraBuffer = '';
            }
        }

        function flushList() {
            if (listType) {
                html += `</${listType}>`;
                listType = null;
            }
        }

        for (const rawLine of lines) {
            const line = rawLine
                .replace(/\*\*(.*?)\*\*|__(.*?)__/g, '<strong class="text-blue-600">$1$2</strong>')
                .replace(/\*(.*?)\*|_(.*?)_/g, '<em class="text-teal-600">$1$2</em>')
                .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');

            const isOl = line.match(/^\s*\d+\.\s(.*)/);
            const isUl = line.match(/^\s*[\*\-]\s(.*)/);

            if (isOl) {
                flushPara();
                if (listType !== 'ol') {
                    flushList();
                    html += '<ol class="list-decimal list-inside my-3 pl-4 space-y-2">';
                    listType = 'ol';
                }
                html += `<li>${isOl[1]}</li>`;
            } else if (isUl) {
                flushPara();
                if (listType !== 'ul') {
                    flushList();
                    html += '<ul class="list-disc list-inside my-3 pl-4 space-y-2">';
                    listType = 'ul';
                }
                html += `<li>${isUl[1]}</li>`;
            } else {
                flushList();
                if (line.trim() === '') {
                    flushPara();
                } else {
                    paraBuffer += (paraBuffer ? ' ' : '') + line;
                }
            }
        }

        flushPara();
        flushList();

        return { __html: html };
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            onSendMessage(query);
            setQuery('');
        }
    };

    const handleSourceClick = (text: string) => {
        setModalContent(text);
    };

    const closeModal = () => {
        setModalContent(null);
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history, isQueryLoading]);

    return (
        <div className="flex flex-col h-full relative text-gray-900">
            <header className="absolute top-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl z-20 border-b border-gray-100">
                <div className="w-full max-w-5xl mx-auto flex justify-between items-center px-4">
                    <div className="min-w-0 flex items-center">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mr-4 shadow-sm">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                            </svg>
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xl font-black truncate max-w-[200px] sm:max-w-md" title={documentName}>
                                {documentName}
                            </h1>
                            <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-black mt-0.5">Session Active</p>
                        </div>
                    </div>
                    <button
                        onClick={onNewChat}
                        className="flex items-center px-5 py-3 bg-gray-900 hover:bg-black text-white rounded-2xl transition-all active:scale-95 shadow-lg shadow-gray-200 font-bold"
                    >
                        <RefreshIcon />
                        <span className="ml-2 hidden sm:inline">New Chat</span>
                    </button>
                </div>
            </header>

            <div className="flex-grow pt-28 pb-44 overflow-y-auto px-4 custom-scrollbar">
                <div className="w-full max-w-4xl mx-auto space-y-10">
                    {/* Image Preview if analyzing an image */}
                    {contextImage && (
                        <div className="flex justify-center mb-10">
                            <div className="relative p-2 bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-sm">
                                <img 
                                    src={`data:${contextImage.type};base64,${contextImage.data}`} 
                                    alt="Analyzing" 
                                    className="rounded-2xl w-full max-h-[300px] object-contain" 
                                />
                                <div className="absolute top-4 left-4 bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Analysis Source</div>
                            </div>
                        </div>
                    )}

                    {history.length === 0 && !isQueryLoading && (
                        <div className="text-center py-24 opacity-10">
                            <svg className="w-24 h-24 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            <p className="text-3xl font-black">Ask Gemini anything</p>
                        </div>
                    )}
                    
                    {history.map((message, index) => (
                        <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                            <div className={`max-w-[85%] lg:max-w-[80%] px-7 py-5 rounded-[2.5rem] shadow-xl ${
                                message.role === 'user' 
                                ? 'bg-blue-600 text-white font-bold' 
                                : 'bg-white border border-gray-50 shadow-gray-100'
                            }`}>
                                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={renderMarkdown(message.parts[0].text)} />
                                {message.role === 'model' && message.groundingChunks && message.groundingChunks.length > 0 && (
                                    <div className="mt-6 pt-5 border-t border-gray-100">
                                        <h4 className="text-[10px] font-black text-gray-400 mb-3 uppercase tracking-[0.1em]">Verified Context</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {message.groundingChunks.map((chunk, chunkIndex) => (
                                                chunk.retrievedContext?.text && (
                                                    <button
                                                        key={chunkIndex}
                                                        onClick={() => handleSourceClick(chunk.retrievedContext!.text!)}
                                                        className="bg-gray-50 hover:bg-gray-100 text-[10px] font-black px-4 py-2 rounded-xl transition-all border border-gray-100 text-gray-500"
                                                    >
                                                        Detail {chunkIndex + 1}
                                                    </button>
                                                )
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isQueryLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white px-8 py-5 rounded-[2.5rem] border border-gray-50 flex items-center shadow-xl shadow-gray-100">
                                <Spinner />
                                <span className="ml-4 text-xs font-black text-blue-600 uppercase tracking-widest animate-pulse">Thinking...</span>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-8 bg-white/80 backdrop-blur-3xl border-t border-gray-100">
                 <div className="max-w-4xl mx-auto">
                    <div className="mb-5 min-h-[2.5rem] flex items-center justify-center overflow-x-auto no-scrollbar gap-2">
                        {!isQueryLoading && currentSuggestion && (
                            <button
                                onClick={() => setQuery(currentSuggestion)}
                                className="text-xs font-black text-gray-400 bg-gray-50 border border-gray-100 hover:bg-white hover:border-blue-300 hover:text-blue-600 transition-all px-6 py-3 rounded-full whitespace-nowrap active:scale-95 shadow-sm"
                            >
                                {currentSuggestion}
                            </button>
                        )}
                    </div>
                     <form onSubmit={handleSubmit} className="relative flex items-center">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Ask a question..."
                            className="w-full bg-white border-2 border-gray-100 rounded-3xl py-6 pl-8 pr-24 text-gray-900 placeholder-gray-300 focus:outline-none focus:border-blue-600 transition-all shadow-2xl shadow-gray-100 text-lg"
                            disabled={isQueryLoading}
                        />
                        <button 
                            type="submit" 
                            disabled={isQueryLoading || !query.trim()} 
                            className="absolute right-4 p-4 bg-blue-600 hover:bg-blue-700 rounded-2xl text-white disabled:bg-gray-200 transition-all shadow-lg active:scale-90"
                        >
                            <SendIcon />
                        </button>
                    </form>
                    <p className="mt-4 text-[9px] text-center text-gray-300 font-black uppercase tracking-[0.3em]">Intelligence by Gemini 3 Pro Preview</p>
                </div>
            </div>

            {modalContent !== null && (
                <div 
                    className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-50 p-6" 
                    onClick={closeModal} 
                >
                    <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-gray-100 animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-black uppercase tracking-widest text-blue-600">Context Fragment</h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><RefreshIcon /></button>
                        </div>
                        <div 
                            className="flex-grow overflow-y-auto pr-4 text-gray-600 border-t border-b border-gray-50 py-8 custom-scrollbar leading-relaxed text-lg"
                            dangerouslySetInnerHTML={renderMarkdown(modalContent || '')}
                        >
                        </div>
                        <div className="flex justify-end mt-10">
                            <button onClick={closeModal} className="px-12 py-4 rounded-2xl bg-gray-900 text-white font-black hover:bg-black transition-all active:scale-95 shadow-xl">
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatInterface;
