
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppStatus, ChatMessage, FileProgress, FileStatus, FileData } from './types';
import * as geminiService from './services/geminiService';
import Spinner from './components/Spinner';
import WelcomeScreen from './components/WelcomeScreen';
import UploadProgressView from './components/UploadProgressView';
import ChatInterface from './components/ChatInterface';
import QRScanner from './components/QRScanner';

declare global {
    interface AIStudio {
        openSelectKey: () => Promise<void>;
        hasSelectedApiKey: () => Promise<boolean>;
    }
    interface Window {
        aistudio?: AIStudio;
    }
}

const App: React.FC = () => {
    const [status, setStatus] = useState<AppStatus>(AppStatus.Initializing);
    const [isApiKeySelected, setIsApiKeySelected] = useState(false);
    const [apiKeyError, setApiKeyError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [uploadFilesProgress, setUploadFilesProgress] = useState<FileProgress[]>([]);
    const [globalUploadMessage, setGlobalUploadMessage] = useState<string>('');
    const [uploadedFiles, setUploadedFiles] = useState<FileData[]>([]);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [isQueryLoading, setIsQueryLoading] = useState(false);
    const [exampleQuestions, setExampleQuestions] = useState<string[]>([]);
    const [documentName, setDocumentName] = useState<string>('');
    const [analyzingImageBase64, setAnalyzingImageBase64] = useState<{data: string, type: string} | null>(null);
    
    const cancelledFileIds = useRef<Set<string>>(new Set());

    const checkApiKey = useCallback(async () => {
        if (window.aistudio?.hasSelectedApiKey) {
            try {
                const hasKey = await window.aistudio.hasSelectedApiKey();
                setIsApiKeySelected(hasKey);
            } catch (e) {
                setIsApiKeySelected(false);
            }
        } else {
            setIsApiKeySelected(true);
        }
    }, []);

    useEffect(() => {
        checkApiKey();
        window.addEventListener('focus', checkApiKey);
        return () => window.removeEventListener('focus', checkApiKey);
    }, [checkApiKey]);

    const handleError = (message: string, err: any) => {
        console.error(message, err);
        setError(`${message}${err ? `: ${err instanceof Error ? err.message : String(err)}` : ''}`);
        setStatus(AppStatus.Error);
    };

    const clearError = () => {
        setError(null);
        setStatus(AppStatus.Welcome);
    }

    useEffect(() => {
        setStatus(AppStatus.Welcome);
    }, []);

    const handleSelectKey = async () => {
        if (window.aistudio?.openSelectKey) {
            try {
                await window.aistudio.openSelectKey();
                setIsApiKeySelected(true);
            } catch (err) {
                console.error("Failed to open API key selection dialog", err);
            }
        }
    };

    const updateFileProgress = (id: string, status: FileStatus, errorMessage?: string) => {
        setUploadFilesProgress(prev => prev.map(p => p.id === id ? { ...p, status, errorMessage } : p));
    };

    const readFileAsBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = (reader.result as string).split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleUploadAndStartChat = async (targetFiles: File[]) => {
        if (!isApiKeySelected) {
            setApiKeyError("Please select your Gemini API Key first.");
            return;
        }
        if (targetFiles.length === 0) return;
        
        setApiKeyError(null);
        cancelledFileIds.current.clear();

        // Special case: single image direct analysis
        const imageFiles = targetFiles.filter(f => f.type.startsWith('image/'));
        if (imageFiles.length === 1 && targetFiles.length === 1) {
            const image = imageFiles[0];
            try {
                const base64 = await readFileAsBase64(image);
                setAnalyzingImageBase64({data: base64, type: image.type});
                setDocumentName(image.name);
                setChatHistory([]);
                setStatus(AppStatus.ImageAnalysis);
                setIsQueryLoading(true);
                const analysis = await geminiService.analyzeImage(base64, image.type, "Please describe and analyze this image in detail.");
                setChatHistory([{ role: 'model', parts: [{ text: analysis }] }]);
            } catch (err) {
                handleError("Image analysis failed", err);
            } finally {
                setIsQueryLoading(false);
            }
            return;
        }
        
        setStatus(AppStatus.Uploading);
        setGlobalUploadMessage("Processing items...");
        
        const initialProgress: FileProgress[] = targetFiles.map((f, i) => ({
            id: `file-${i}-${Date.now()}`,
            name: f.name,
            status: 'queued'
        }));
        setUploadFilesProgress(initialProgress);

        try {
            const loadedFileData: FileData[] = [];

            for (let i = 0; i < targetFiles.length; i++) {
                const file = targetFiles[i];
                const progressId = initialProgress[i].id;
                
                if (cancelledFileIds.current.has(progressId)) continue;
                
                updateFileProgress(progressId, 'uploading');
                try {
                    const base64 = await readFileAsBase64(file);
                    loadedFileData.push({
                        name: file.name,
                        mimeType: file.type || 'application/octet-stream',
                        data: base64
                    });
                    updateFileProgress(progressId, 'completed');
                } catch (err: any) {
                    updateFileProgress(progressId, 'error', err.message);
                }
            }

            setUploadedFiles(loadedFileData);
            setGlobalUploadMessage("Analyzing items...");
            
            const questions = await geminiService.generateExampleQuestions(loadedFileData);
            setExampleQuestions(questions);

            setDocumentName(loadedFileData.length === 1 ? loadedFileData[0].name : `${loadedFileData.length} items`);
            setChatHistory([]);
            setStatus(AppStatus.Chatting);
        } catch (err: any) {
            handleError("Processing failed", err);
        }
    };

    const handleScannedResult = async (result: string) => {
        if (!isApiKeySelected) {
            setApiKeyError("Select API key first.");
            setStatus(AppStatus.Welcome);
            return;
        }
        
        if (result.startsWith('data:image/')) {
            const [header, base64] = result.split(',');
            const mimeType = header.split(';')[0].split(':')[1];
            setAnalyzingImageBase64({data: base64, type: mimeType});
            setDocumentName("Captured Photo");
            setChatHistory([]);
            setStatus(AppStatus.ImageAnalysis);
            setIsQueryLoading(true);
            try {
                const analysis = await geminiService.analyzeImage(base64, mimeType, "Analyze this captured image.");
                setChatHistory([{ role: 'model', parts: [{ text: analysis }] }]);
            } catch (err) {
                handleError("Photo analysis failed", err);
            } finally {
                setIsQueryLoading(false);
            }
            return;
        }

        setStatus(AppStatus.Scraping);
        setGlobalUploadMessage("Analyzing scanned content...");
        try {
            const content = await geminiService.fetchWebsiteContent(result);
            const file = new File([content], `scanned-content.txt`, { type: 'text/plain' });
            await handleUploadAndStartChat([file]);
        } catch {
            const file = new File([result], `scanned-text.txt`, { type: 'text/plain' });
            await handleUploadAndStartChat([file]);
        }
    };

    const handleSendMessage = async (message: string) => {
        const userMessage: ChatMessage = { role: 'user', parts: [{ text: message }] };
        setChatHistory(prev => [...prev, userMessage]);
        setIsQueryLoading(true);
        try {
            if (status === AppStatus.ImageAnalysis && analyzingImageBase64) {
                const result = await geminiService.analyzeImage(analyzingImageBase64.data, analyzingImageBase64.type, message);
                setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: result }] }]);
            } else if (uploadedFiles.length > 0) {
                const result = await geminiService.queryWithContext(uploadedFiles, message, chatHistory);
                setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: result.text }] }]);
            }
        } catch (err) {
            handleError("Failed to get response", err);
        } finally {
            setIsQueryLoading(false);
        }
    };
    
    const renderContent = () => {
        switch(status) {
            case AppStatus.Initializing:
                return (
                    <div className="flex flex-col items-center justify-center h-screen">
                        <Spinner /> <span className="mt-4 text-gray-500 font-bold">Waking up Gemini...</span>
                    </div>
                );
            case AppStatus.Welcome:
                 return <WelcomeScreen 
                            onUpload={handleUploadAndStartChat} 
                            apiKeyError={apiKeyError} 
                            isApiKeySelected={isApiKeySelected} 
                            onSelectKey={handleSelectKey} 
                            onScan={() => setStatus(AppStatus.Scanning)}
                        />;
            case AppStatus.Scanning:
                return <QRScanner onResult={handleScannedResult} onClose={() => setStatus(AppStatus.Welcome)} />;
            case AppStatus.Scraping:
            case AppStatus.Uploading:
                return (
                    <UploadProgressView 
                        files={uploadFilesProgress} 
                        message={globalUploadMessage} 
                        onCancelFile={(id) => {
                            cancelledFileIds.current.add(id);
                            updateFileProgress(id, 'cancelled');
                        }}
                    />
                );
            case AppStatus.ImageAnalysis:
            case AppStatus.Chatting:
                return <ChatInterface 
                    documentName={documentName}
                    history={chatHistory}
                    isQueryLoading={isQueryLoading}
                    onSendMessage={handleSendMessage}
                    onNewChat={() => {
                        setUploadedFiles([]);
                        setChatHistory([]);
                        setAnalyzingImageBase64(null);
                        setStatus(AppStatus.Welcome);
                    }}
                    exampleQuestions={exampleQuestions.length > 0 ? exampleQuestions : ["Summarize the main points", "What are the key details?", "Help me understand this"]}
                    contextImage={analyzingImageBase64}
                />;
            case AppStatus.Error:
                 return (
                    <div className="flex flex-col items-center justify-center h-screen text-red-600 p-8 text-center">
                        <h1 className="text-3xl font-black mb-4">Something went wrong</h1>
                        <p className="max-w-md mb-8 text-gray-500">{error}</p>
                        <button onClick={clearError} className="px-12 py-4 rounded-3xl bg-gray-900 text-white font-black">Reset App</button>
                    </div>
                );
            default: return null;
        }
    }

    return <main className="h-screen overflow-hidden font-sans">{renderContent()}</main>;
};

export default App;
