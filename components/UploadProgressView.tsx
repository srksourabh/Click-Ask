
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { FileProgress } from '../types';
import Spinner from './Spinner';
import TrashIcon from './icons/TrashIcon';

interface UploadProgressViewProps {
    files: FileProgress[];
    message: string;
    onCancelFile: (id: string) => void;
}

const UploadProgressView: React.FC<UploadProgressViewProps> = ({ files, message, onCancelFile }) => {
    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'completed': return 'text-green-600 bg-green-50 border-green-200';
            case 'error': return 'text-red-600 bg-red-50 border-red-200';
            case 'uploading': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'processing': return 'text-amber-600 bg-amber-50 border-amber-200';
            case 'cancelled': return 'text-gray-400 bg-gray-50 border-gray-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'completed': return 'Done';
            case 'error': return 'Failed';
            case 'uploading': return 'Uploading...';
            case 'processing': return 'Processing...';
            case 'cancelled': return 'Cancelled';
            case 'queued': return 'Waiting...';
            default: return status;
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gem-onyx">
            <div className="w-full max-w-2xl bg-gem-slate rounded-2xl shadow-xl p-8 border border-gem-mist">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gem-offwhite mb-2">{message}</h2>
                    <p className="text-gem-offwhite/60">
                        {files.filter(f => f.status === 'completed').length} of {files.length} files indexed
                    </p>
                </div>

                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                    {files.map((file) => (
                        <div 
                            key={file.id} 
                            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${getStatusStyles(file.status)}`}
                        >
                            <div className="flex items-center space-x-4 min-w-0 flex-1">
                                <div className="flex-shrink-0">
                                    {(file.status === 'uploading' || file.status === 'processing') ? (
                                        <Spinner />
                                    ) : file.status === 'completed' ? (
                                        <div className="text-green-600">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    ) : (
                                        <div className="w-6 h-6 border-2 border-current opacity-20 rounded-full" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-semibold truncate text-gem-offwhite">{file.name}</h3>
                                    <p className="text-xs font-medium uppercase tracking-wider opacity-80">
                                        {getStatusLabel(file.status)}
                                    </p>
                                    {file.errorMessage && (
                                        <p className="text-[10px] mt-1 text-red-500 truncate">{file.errorMessage}</p>
                                    )}
                                </div>
                            </div>

                            {(file.status === 'queued' || file.status === 'uploading' || file.status === 'processing') && (
                                <button
                                    onClick={() => onCancelFile(file.id)}
                                    className="ml-4 p-2 text-red-400 hover:bg-red-100 rounded-full transition-colors"
                                    title="Cancel this upload"
                                >
                                    <TrashIcon />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Overall Mini Progress Bar */}
                <div className="mt-8 pt-6 border-t border-gem-mist">
                    <div className="w-full bg-gem-mist rounded-full h-2 overflow-hidden">
                        <div 
                            className="bg-gem-blue h-full transition-all duration-500 ease-out"
                            style={{ width: `${(files.filter(f => f.status === 'completed').length / files.length) * 100}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UploadProgressView;
