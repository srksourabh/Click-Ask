
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
export interface FileData {
    name: string;
    mimeType: string;
    data: string; // Base64 string
}

export interface GroundingChunk {
    retrievedContext?: {
        text?: string;
    };
}

export interface QueryResult {
    text: string;
    groundingChunks?: GroundingChunk[];
}

export enum AppStatus {
    Initializing,
    Welcome,
    Scanning,
    Scraping,
    Uploading,
    Chatting,
    ImageAnalysis,
    Error,
}

export type FileStatus = 'queued' | 'uploading' | 'processing' | 'completed' | 'error' | 'cancelled';

export interface FileProgress {
    id: string;
    name: string;
    status: FileStatus;
    errorMessage?: string;
}

export interface ChatMessage {
    role: 'user' | 'model';
    parts: { text?: string; inlineData?: { data: string; mimeType: string } }[];
    groundingChunks?: GroundingChunk[];
}
