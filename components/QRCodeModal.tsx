import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ICONS } from '../constants';
import type { Session } from '../types';
import { QR_CODE_VALIDITY_SECONDS } from '../hooks/useAttendanceData';

interface QRCodeModalProps {
    onClose: () => void;
    session: Session;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ onClose, session }) => {
    const { qrCodeValue, scannedCount = 0, limit = 0, type, shortCode } = session;
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [timeLeft, setTimeLeft] = useState(QR_CODE_VALIDITY_SECONDS);

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
           if (event.key === 'Escape') {
              if (isFocusMode) {
                  setIsFocusMode(false);
              } else {
                onClose();
              }
           }
        };
        window.addEventListener('keydown', handleEsc);
    
        return () => {
          window.removeEventListener('keydown', handleEsc);
        };
      }, [onClose, isFocusMode]);

    useEffect(() => {
        if (qrCodeValue && qrCodeValue.startsWith('qr_')) {
            const parts = qrCodeValue.split('_');
            const timestamp = parseInt(parts[1], 10);
            
            if (!isNaN(timestamp)) {
                const expirationTime = timestamp + QR_CODE_VALIDITY_SECONDS * 1000;

                const updateTimer = () => {
                    const now = Date.now();
                    const remaining = Math.max(0, Math.round((expirationTime - now) / 1000));
                    setTimeLeft(remaining);
                };

                updateTimer(); // Initial update
                const intervalId = setInterval(updateTimer, 1000);
                
                return () => clearInterval(intervalId);
            }
        }
    }, [qrCodeValue]);


    const isGenerating = qrCodeValue === 'generating...';
    const isLimitReached = (limit > 0 && scannedCount >= limit) || qrCodeValue === 'limit_reached';

    const renderQRCode = () => {
        if (isLimitReached) {
            return (
                <div className="h-[216px] flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-lg">
                    <h3 className="text-xl font-bold text-green-600 dark:text-green-400">Limit Reached!</h3>
                    <p className="text-slate-600 dark:text-slate-300 mt-1">All slots are filled.</p>
                </div>
            );
        }

        if (isGenerating || !qrCodeValue || timeLeft === 0) {
            return (
                <div className="h-[216px] flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse">
                    <h3 className="text-xl font-bold text-sky-600 dark:text-sky-400">Generating New Code...</h3>
                    <p className="text-slate-600 dark:text-slate-300 mt-1">Please wait.</p>
                </div>
            );
        }

        return (
            <div className="p-4 bg-white rounded-lg inline-block">
                <QRCodeSVG value={qrCodeValue} size={isFocusMode ? 300 : 200} />
            </div>
        );
    };
    
    const renderTimer = () => {
        if (isLimitReached) return null;
        
        const progressPercentage = (timeLeft / QR_CODE_VALIDITY_SECONDS) * 100;

        return (
            <div className={`mt-6 ${isFocusMode ? 'w-80' : 'w-full'}`}>
                <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2.5">
                    <div
                        className="bg-emerald-600 h-2.5 rounded-full"
                        style={{
                            width: `${progressPercentage}%`,
                            transition: timeLeft === QR_CODE_VALIDITY_SECONDS ? 'none' : 'width 1s linear',
                        }}
                    ></div>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    {timeLeft > 0 ? `Code expires in ${timeLeft}s` : 'Generating new code...'}
                </p>
            </div>
        );
    };

    if (isFocusMode) {
        return (
            <div 
                className="fixed inset-0 bg-white dark:bg-slate-900 flex flex-col items-center justify-center z-[60] p-8"
            >
                <button 
                    onClick={() => setIsFocusMode(false)} 
                    className="absolute top-6 right-6 p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-90"
                    aria-label="Exit focus mode"
                    title="Exit Focus Mode"
                >
                    {ICONS.exitFullscreen}
                </button>
                <div className="flex flex-col items-center text-center">
                    {renderQRCode()}

                    {type === 'Online' && shortCode && !isLimitReached && (
                         <div className="mt-10">
                            <p className="text-xl text-slate-500 dark:text-slate-400 mb-2">Or enter this code:</p>
                            <div className="bg-slate-100 dark:bg-slate-800 py-4 px-8 rounded-lg">
                                <p className="text-5xl font-bold text-slate-900 dark:text-white tracking-widest font-mono">{shortCode}</p>
                            </div>
                        </div>
                    )}
                    
                    <p className="text-5xl font-bold text-slate-900 dark:text-white mt-8">
                        {scannedCount} / {limit}
                    </p>
                    <p className="text-lg text-slate-400 dark:text-slate-500">Students Attended</p>
                    {renderTimer()}
                </div>
            </div>
        );
    }

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center border border-slate-200 dark:border-slate-700 relative transform transition-transform scale-100"
                onClick={e => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-transform active:scale-90">
                    {ICONS.close}
                </button>
                <button 
                    onClick={() => setIsFocusMode(true)} 
                    className="absolute top-4 left-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-transform active:scale-90"
                    aria-label="Enter focus mode"
                    title="Focus Mode"
                >
                    {ICONS.fullscreen}
                </button>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Live Attendance Session</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                    {type === 'Online'
                        ? 'Students can scan this code or enter the short code.'
                        : 'Students can scan this code to mark attendance.'
                    }
                </p>
                
                {renderQRCode()}

                {type === 'Online' && shortCode && !isLimitReached && (
                    <div className="mt-6">
                        <p className="text-sm text-slate-400 dark:text-slate-500 mb-2">Or enter this code:</p>
                        <div className="bg-slate-100 dark:bg-slate-700 py-3 px-6 rounded-lg">
                            <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-widest font-mono">{shortCode}</p>
                        </div>
                    </div>
                )}
                
                <p className="text-xl font-bold text-slate-900 dark:text-white mt-4">
                    {scannedCount} / {limit}
                </p>
                <p className="text-sm text-slate-400 dark:text-slate-500">Students Attended</p>
                {renderTimer()}
            </div>
        </div>
    );
};

export default QRCodeModal;