
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

interface QRScannerProps {
    onResult: (result: string) => void;
    onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onResult, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [cameraReady, setCameraReady] = useState(false);

    useEffect(() => {
        let stream: MediaStream | null = null;
        let animationFrameId: number;

        const startCamera = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.setAttribute('playsinline', 'true');
                    videoRef.current.play();
                    setCameraReady(true);
                    requestAnimationFrame(scan);
                }
            } catch (err) {
                console.error("Camera error:", err);
                setError("Could not access camera. Please ensure permissions are granted.");
            }
        };

        const scan = () => {
            if (videoRef.current && canvasRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
                const canvas = canvasRef.current;
                const video = videoRef.current;
                const context = canvas.getContext('2d');
                if (context) {
                    canvas.height = video.videoHeight;
                    canvas.width = video.videoWidth;
                    context.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: 'dontInvert',
                    });

                    if (code) {
                        onResult(code.data);
                        return; // Stop scanning once result is found
                    }
                }
            }
            animationFrameId = requestAnimationFrame(scan);
        };

        startCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            cancelAnimationFrame(animationFrameId);
        };
    }, [onResult]);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            const context = canvas.getContext('2d');
            if (context) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                onResult(dataUrl); // Treat the data URL as a result
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-4">
            <div className="relative w-full max-w-md aspect-square bg-gem-slate rounded-3xl overflow-hidden shadow-2xl border-2 border-gem-blue/50">
                {!cameraReady && !error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gem-onyx text-gem-offwhite">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gem-blue mb-4"></div>
                        <p className="font-bold">Opening Camera...</p>
                    </div>
                )}
                
                {error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950 p-8 text-center">
                        <svg className="w-16 h-16 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-red-200 font-bold mb-6">{error}</p>
                        <button onClick={onClose} className="px-8 py-3 bg-red-600 rounded-full font-black text-white">Go Back</button>
                    </div>
                )}

                <video 
                    ref={videoRef} 
                    className="w-full h-full object-cover"
                    style={{ transform: 'scaleX(1)' }}
                />
                
                {cameraReady && (
                    <>
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute inset-0 border-[60px] border-black/40" />
                            <div className="absolute top-[60px] left-[60px] right-[60px] bottom-[60px] border-2 border-gem-blue shadow-[0_0_50px_rgba(56,189,248,0.3)]" />
                            <div className="absolute top-[60px] left-[60px] right-[60px] h-[2px] bg-gem-blue/80 animate-scan-line shadow-[0_0_10px_#38bdf8]" />
                        </div>
                        {/* Capture Button Overlay */}
                        <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-auto">
                            <button 
                                onClick={handleCapture}
                                className="w-16 h-16 bg-white border-4 border-gray-200 rounded-full shadow-lg active:scale-90 transition-transform flex items-center justify-center"
                                aria-label="Capture photo for analysis"
                            >
                                <div className="w-12 h-12 bg-white border-2 border-gray-100 rounded-full" />
                            </button>
                        </div>
                    </>
                )}
                <canvas ref={canvasRef} className="hidden" />
            </div>
            
            <div className="mt-8 text-center">
                <p className="text-lg font-black text-white mb-1">Point at QR code or Capture photo</p>
                <p className="text-xs text-white/50 uppercase tracking-widest font-bold">Auto-detect QR • Click button to Analyze</p>
                <button 
                    onClick={onClose}
                    className="mt-8 px-8 py-3 bg-white/10 text-white rounded-full font-black border border-white/20 hover:bg-white/20 transition-all active:scale-95"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default QRScanner;
