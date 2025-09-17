import React, { useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
    onSuccess: (decodedText: string) => void;
    onError: (errorMessage: string) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onSuccess, onError }) => {
    useEffect(() => {
        const qrCodeScanner = new Html5Qrcode("reader");
        
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        const startScanner = async () => {
            try {
                await qrCodeScanner.start(
                    { facingMode: "environment" },
                    config,
                    onSuccess,
                    onError
                );
            } catch (err) {
                console.error("Failed to start scanner with environment camera:", err);
                try {
                    await qrCodeScanner.start(
                        {}, // default camera
                        config,
                        onSuccess,
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
            if (qrCodeScanner.isScanning) {
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

    return (
        <div className="bg-slate-800 p-4 rounded-xl border-2 border-slate-700 shadow-lg">
            <div id="reader" className="w-full rounded-lg overflow-hidden"></div>
            <p className="text-slate-400 text-sm mt-2 text-center">Place the QR code inside the box</p>
        </div>
    );
};

export default QRScanner;
