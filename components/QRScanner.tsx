import React, { useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
    onSuccess: (decodedText: string) => void;
    onError: (errorMessage: string) => void;
    scannerStatus: 'idle' | 'success' | 'error';
}

const QRScanner: React.FC<QRScannerProps> = ({ onSuccess, onError, scannerStatus }) => {
    useEffect(() => {
        const qrCodeScanner = new Html5Qrcode("reader");
        
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        // Wrapper to ensure onSuccess is only called when scanner is active
        const successCallback = (decodedText: string, decodedResult: any) => {
            onSuccess(decodedText);
            if (qrCodeScanner.isScanning) {
                qrCodeScanner.pause(true); // Pause after scan to show feedback
            }
        };

        const startScanner = async () => {
            try {
                await qrCodeScanner.start(
                    { facingMode: "environment" },
                    config,
                    successCallback,
                    onError
                );
            } catch (err) {
                console.error("Failed to start scanner with environment camera:", err);
                try {
                    await qrCodeScanner.start(
                        {}, // default camera
                        config,
                        successCallback,
                        onError
                    );
                } catch (fallbackErr) {
                    console.error("Fallback camera also failed:", fallbackErr);
                    onError("Could not start camera. Please grant permission and try again.");
                }
            }
        };

        startScanner();

        return () => {
            if (qrCodeScanner && qrCodeScanner.isScanning) {
                qrCodeScanner.stop().then(() => {
                    console.log("QR Code scanning stopped.");
                }).catch(err => {
                    console.error("Failed to stop the scanner.", err);
                }).finally(() => {
                    qrCodeScanner.clear();
                });
            }
        };
    }, [onSuccess, onError]);
    
    useEffect(() => {
        const qrCodeScanner = Html5Qrcode.getCameras() ? new Html5Qrcode("reader") : null;
        if (qrCodeScanner && qrCodeScanner.isScanning && scannerStatus === 'idle') {
           qrCodeScanner.resume();
        }
    }, [scannerStatus]);
    
    const feedbackClasses = {
        idle: 'border-slate-200 dark:border-slate-700',
        success: 'border-green-500 animate-green-glow',
        error: 'border-red-500 animate-red-glow',
    };

    const animationClass = scannerStatus === 'success' ? 'scale-105' : 'scale-100';


    return (
        <div className={`relative bg-white dark:bg-slate-800 p-4 rounded-xl border-4 transform transition-all duration-300 ${feedbackClasses[scannerStatus]} ${animationClass}`}>
            <div id="reader" className="w-full rounded-lg overflow-hidden"></div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 text-center">Place the QR code inside the box</p>
        </div>
    );
};

export default QRScanner;