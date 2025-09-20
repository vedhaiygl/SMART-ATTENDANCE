import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ICONS } from '../constants';

interface LivenessCheckModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (selfieData: string) => void;
}

const LivenessCheckModal: React.FC<LivenessCheckModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const streamRef = useRef<MediaStream | null>(null);

    const startCamera = useCallback(async () => {
        if (streamRef.current) return;
        setCameraError(null);
        setIsCameraReady(false);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user' } 
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    setIsCameraReady(true);
                };
            }
        } catch (err) {
            console.error("Camera access denied:", err);
            setCameraError("Camera access is required. Please enable it in your browser settings.");
        }
    }, []);
    
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            startCamera();
        } else {
            stopCamera();
            setCapturedImage(null);
        }
        return () => stopCamera();
    }, [isOpen, startCamera, stopCamera]);

    const handleCapture = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const context = canvas.getContext('2d');
        if (context) {
            // Flip the image horizontally for a mirror effect to match the preview
            context.translate(canvas.width, 0);
            context.scale(-1, 1);
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg');
            setCapturedImage(dataUrl);
            stopCamera();
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
        startCamera();
    };

    const handleSubmit = () => {
        if (capturedImage) {
            onSubmit(capturedImage);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md w-full border border-slate-200 dark:border-slate-700 relative transform transition-transform scale-100"
                onClick={e => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-transform active:scale-90">
                    {ICONS.close}
                </button>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Liveness Check</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                    Please take a quick selfie to confirm your presence.
                </p>

                <div className="relative w-full aspect-square bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden flex items-center justify-center">
                    {capturedImage ? (
                        <img src={capturedImage} alt="Selfie preview" className="w-full h-full object-cover" />
                    ) : (
                        <>
                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]"></video>
                            {!isCameraReady && !cameraError && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                    <p className="text-white animate-pulse">Starting camera...</p>
                                </div>
                            )}
                            {cameraError && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 p-4">
                                    <p className="text-white text-center text-sm">{cameraError}</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
                <canvas ref={canvasRef} className="hidden"></canvas>

                <div className="mt-6 space-y-2">
                    {capturedImage ? (
                         <div className="grid grid-cols-2 gap-4">
                            <button onClick={handleRetake} className="w-full bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold py-3 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-all active:scale-95">
                                Retake
                            </button>
                            <button onClick={handleSubmit} className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-500 transition-all active:scale-95">
                                Confirm
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={handleCapture} 
                            disabled={!isCameraReady || !!cameraError}
                            className="w-full bg-emerald-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-emerald-500 transition-all active:scale-95 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
                        >
                            Capture Selfie
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LivenessCheckModal;