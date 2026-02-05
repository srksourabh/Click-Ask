
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

interface WelcomeScreenProps {
    onUpload: (files: File[]) => Promise<void>;
    apiKeyError: string | null;
    isApiKeySelected: boolean;
    onSelectKey: () => Promise<void>;
    onScan: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ 
    onUpload, 
    apiKeyError, 
    isApiKeySelected, 
    onSelectKey, 
    onScan 
}) => {
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            onUpload(Array.from(event.target.files));
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <div className="w-full max-w-3xl text-center relative z-20">
                {/* Brand Logo: Detailed Television Box with World */}
                <div className="mb-10 flex justify-center animate-float">
                    <div className="relative p-4 bg-white/90 backdrop-blur rounded-[3rem] shadow-2xl border border-gray-100">
                        <div className="w-64 h-52 bg-slate-800 rounded-[2.5rem] overflow-hidden relative border-[8px] border-slate-700 flex items-center justify-center shadow-inner group">
                            <svg className="w-full h-full" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect width="120" height="100" fill="#bae6fd" />
                                <circle cx="100" cy="20" r="10" fill="#2563eb" />
                                <path d="M96 15C98 12 102 12 104 15C106 18 104 23 100 25C96 27 94 22 96 15Z" fill="#22c55e" opacity="0.6" />
                                <circle cx="102" cy="18" r="2" fill="white" opacity="0.3" />
                                <circle cx="20" cy="20" r="6" fill="#fbbf24">
                                    <animate attributeName="r" values="6;7;6" dur="3s" repeatCount="indefinite" />
                                </circle>
                                <path d="M0 70C30 60 90 60 120 70V100H0V70Z" fill="#15803d" />
                                <path d="M0 82C40 75 80 75 120 82V100H0V82Z" fill="#166534" />
                                <g transform="translate(48, 50)">
                                    <rect width="20" height="18" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.5" />
                                    <path d="M-2 0L10 -12L22 0H-2Z" fill="#dc2626" />
                                    <rect x="8" y="10" width="4" height="8" fill="#451a03" />
                                    <rect x="3" y="4" width="4" height="4" fill="#bae6fd" stroke="#38bdf8" strokeWidth="0.5" />
                                    <rect x="13" y="4" width="4" height="4" fill="#bae6fd" stroke="#38bdf8" strokeWidth="0.5" />
                                    <rect x="15" y="-10" width="3" height="6" fill="#991b1b" />
                                    <g className="animate-pulse">
                                        <circle cx="16.5" cy="-14" r="1.5" fill="gray" opacity="0.4" />
                                        <circle cx="18" cy="-18" r="2" fill="gray" opacity="0.2" />
                                    </g>
                                </g>
                                <circle cx="20" cy="85" r="1" fill="#facc15" />
                                <circle cx="25" cy="88" r="1" fill="white" />
                                <circle cx="85" cy="82" r="1" fill="#ec4899" />
                                <circle cx="95" cy="87" r="1" fill="#facc15" />
                                <path d="M10 10L60 10L20 50H10V10Z" fill="white" opacity="0.1" />
                            </svg>
                            <div className="absolute right-2 bottom-8 flex flex-col space-y-3">
                                <div className="w-4 h-4 bg-slate-600 rounded-full border border-slate-500 shadow-sm transition-transform group-hover:rotate-45"></div>
                                <div className="w-4 h-4 bg-slate-600 rounded-full border border-slate-500 shadow-sm transition-transform group-hover:-rotate-45"></div>
                            </div>
                        </div>
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex space-x-20">
                            <div className="w-1.5 h-20 bg-slate-400 -rotate-20 origin-bottom rounded-full shadow-sm"></div>
                            <div className="w-1.5 h-20 bg-slate-400 rotate-20 origin-bottom rounded-full shadow-sm"></div>
                        </div>
                    </div>
                </div>

                <h1 className="text-5xl sm:text-6xl font-black mb-4 text-gray-900 tracking-tight">Click and ask</h1>
                <p className="text-gray-500 mb-10 max-w-lg mx-auto text-lg leading-relaxed font-medium">
                    Analyze documents or photos instantly with Gemini's high-intelligence vision and RAG capabilities.
                </p>

                <div className="flex flex-col items-center w-full max-w-xl mx-auto space-y-6 mb-12 px-2">
                     {!isApiKeySelected ? (
                        <button
                            onClick={onSelectKey}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black rounded-3xl py-6 px-8 text-center shadow-xl shadow-blue-100 transition-all hover:-translate-y-1 active:scale-95"
                        >
                            Select API Key to Begin
                        </button>
                    ) : (
                        <div className="w-full flex items-center justify-center gap-3">
                            <button
                                onClick={onScan}
                                className="flex-1 h-16 sm:h-20 bg-white border-2 border-gray-100 text-gray-900 font-bold rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-sm hover:border-blue-500 transition-all hover:-translate-y-1 active:scale-95 text-base sm:text-lg overflow-hidden"
                            >
                                <svg className="w-6 h-6 mr-1.5 sm:mr-3 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                </svg>
                                <span className="truncate">Scan</span>
                            </button>

                            <div className="flex-1 relative h-16 sm:h-20">
                                <input 
                                    id="file-upload" 
                                    type="file" 
                                    multiple 
                                    className="hidden" 
                                    onChange={handleFileChange} 
                                    accept=".pdf,.txt,.md,image/*" 
                                />
                                <label 
                                    htmlFor="file-upload"
                                    className="flex items-center justify-center w-full h-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl sm:rounded-3xl cursor-pointer transition-all hover:-translate-y-1 active:scale-95 shadow-lg shadow-blue-100 text-base sm:text-lg px-2 overflow-hidden"
                                >
                                    <svg className="w-6 h-6 mr-1.5 sm:mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                    <span className="truncate">Upload</span>
                                </label>
                            </div>
                        </div>
                    )}
                    {apiKeyError && <p className="text-red-600 text-sm font-bold uppercase tracking-wider">{apiKeyError}</p>}
                </div>
            </div>
        </div>
    );
};

export default WelcomeScreen;
