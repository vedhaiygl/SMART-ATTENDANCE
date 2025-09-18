import React, { useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ICONS } from '../constants';

interface QRCodeModalProps {
    onClose: () => void;
    qrCodeValue: string | undefined;
    scannedCount: number;
    limit: number;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ onClose, qrCodeValue, scannedCount, limit }) => {
    
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
           if (event.key === 'Escape') {
              onClose();
           }
        };
        window.addEventListener('keydown', handleEsc);
    
        return () => {
          window.removeEventListener('keydown', handleEsc);
        };
      }, [onClose]);

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

        if (isGenerating || !qrCodeValue) {
            return (
                <div className="h-[216px] flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse">
                    <h3 className="text-xl font-bold text-sky-600 dark:text-sky-400">Generating New Code...</h3>
                    <p className="text-slate-600 dark:text-slate-300 mt-1">Please wait.</p>
                </div>
            );
        }

        return (
            <div className="p-4 bg-white rounded-lg inline-block">
                <QRCodeSVG value={qrCodeValue} size={200} />
            </div>
        );
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center border border-slate-200 dark:border-slate-700 relative transform transition-transform scale-100"
                onClick={e => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                    {ICONS.close}
                </button>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Live Attendance Session</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">Students can scan this code to mark attendance.</p>
                
                {renderQRCode()}
                
                <p className="text-xl font-bold text-slate-900 dark:text-white mt-4">
                    {scannedCount} / {limit}
                </p>
                <p className="text-sm text-slate-400 dark:text-slate-500">Students Attended</p>
            </div>
        </div>
    );
};

export default QRCodeModal;