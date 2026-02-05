
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { QueryResult, FileData } from '../types';

/**
 * Helper to get a fresh instance of the Gemini API client.
 */
function getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
}

// Recommended Gemini 3 models
const TEXT_MODEL = 'gemini-3-flash-preview';
const PRO_MODEL = 'gemini-3-pro-preview';

/**
 * Main query function that sends documents alongside the user prompt.
 * This utilizes Gemini's massive context window for reliable RAG-like behavior.
 */
export async function queryWithContext(
    files: FileData[], 
    query: string,
    history: any[] = []
): Promise<QueryResult> {
    const ai = getAI();
    
    // Convert local FileData into Gemini API parts
    const fileParts = files.map(f => ({
        inlineData: {
            data: f.data,
            mimeType: f.mimeType
        }
    }));

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: [
            ...history,
            { 
                role: 'user', 
                parts: [
                    ...fileParts,
                    { text: `Based on the provided files, please answer this: ${query}` }
                ] 
            }
        ],
        config: {
            temperature: 0.2, // Lower temperature for more factual RAG-style responses
        }
    });

    return {
        text: response.text || "I couldn't generate a response based on those files.",
    };
}

/**
 * Analyzes a single image with specialized prompt.
 */
export async function analyzeImage(base64Data: string, mimeType: string, prompt: string): Promise<string> {
    const ai = getAI();
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: PRO_MODEL,
        contents: {
            parts: [
                { inlineData: { data: base64Data, mimeType: mimeType } },
                { text: prompt || "Analyze this image in detail." }
            ]
        }
    });
    return response.text || "No analysis provided.";
}

/**
 * Generates sample questions for the UI based on uploaded content.
 */
export async function generateExampleQuestions(files: FileData[]): Promise<string[]> {
    const ai = getAI();
    try {
        const fileParts = files.map(f => ({
            inlineData: { data: f.data, mimeType: f.mimeType }
        }));

        const response = await ai.models.generateContent({
            model: TEXT_MODEL,
            contents: {
                parts: [
                    ...fileParts,
                    { text: "Generate 3 concise, insightful questions a user might ask about these documents. Return ONLY a JSON array of strings." }
                ]
            },
            config: {
                responseMimeType: "application/json"
            }
        });
        
        const text = response.text || "[]";
        return JSON.parse(text.trim());
    } catch (err) {
        return ["What is the summary?", "What are the main points?", "Can you explain the key details?"];
    }
}

export async function fetchWebsiteContent(url: string): Promise<string> {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch");
        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const textParts: string[] = [];
        const title = doc.querySelector('title')?.innerText;
        if (title) textParts.push(`# ${title}`);
        doc.querySelectorAll('h1, h2, h3, p, li').forEach(el => {
            const txt = (el as HTMLElement).innerText.trim();
            if (txt) textParts.push(txt);
        });
        return textParts.join('\n\n') || `Scanned URL: ${url}.`;
    } catch (e) {
        return `Scanned URL: ${url}.`;
    }
}
