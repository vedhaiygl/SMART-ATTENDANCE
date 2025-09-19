
import React, { useState } from 'react';
import QRScanner from './QRScanner';
import type { User, MarkAttendanceResult, PendingAttendanceRecord } from '../types';
import LivenessCheckModal from './LivenessCheckModal';

interface StudentScanPageProps {
    user: User;
    markAttendance: (code: string, studentId: string, selfieData?: string) => MarkAttendanceResult;
}

const StudentScanPage: React.FC<StudentScanPageProps> = ({ user, markAttendance }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<{ status: 'success' | 'error' | 'info'; message: string } | null>(null);
    const [scannerStatus, setScannerStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [manualCode, setManualCode] = useState('');
    const [isLivenessModalOpen, setIsLivenessModalOpen] = useState(false);
    const [codeForLiveness, setCodeForLiveness] = useState<string>('');

    const processAttendanceResult = (result: MarkAttendanceResult, codeUsed: string) => {
        const feedbackDuration = 2000;
        switch (result) {
            case 'success':
                setScannerStatus('success');
                setScanResult({ status: 'success', message: 'Attendance marked successfully!' });
                setTimeout(() => {
                    setIsScanning(false);
                    setScanResult(null);
                }, feedbackDuration);
                break;
            case 'already_marked':
                setScannerStatus('error');
                setScanResult({ status: 'info', message: 'Attendance already marked for this session.' });
                setTimeout(() => setScannerStatus('idle'), feedbackDuration);
                break;
            case 'limit_reached':
                setScannerStatus('error');
                setScanResult({ status: 'error', message: 'Attendance limit for this session has been reached.' });
                setTimeout(() => {
                    setIsScanning(false);
                    setScanResult(null);
                }, feedbackDuration);
                break;
            case 'not_enrolled':
                setScannerStatus('error');
                setScanResult({ status: 'error', message: 'You are not enrolled in this course.' });
                setTimeout(() => {
                    setIsScanning(false);
                    setScanResult(null);
                }, feedbackDuration);
                break;
            case 'expired_qr':
                setScannerStatus('error');
                setScanResult({ status: 'error', message: 'This QR code has expired. Please scan the new one.' });
                setTimeout(() => setScannerStatus('idle'), feedbackDuration);
                break;
            case 'liveness_required':
                setCodeForLiveness(codeUsed);
                setIsLivenessModalOpen(true);
                // Keep scanner paused if it was used
                if (isScanning) {
                    setScannerStatus('error'); // Use 'error' to keep the border red/paused visually
                }
                break;
            case 'invalid_qr':
                setScannerStatus('error');
                setScanResult({ status: 'error', message: 'Invalid attendance code. Please check the code and try again.' });
                setTimeout(() => setScannerStatus('idle'), feedbackDuration);
                break;
            case 'error':
            default:
                setScannerStatus('error');
                setScanResult({ status: 'error', message: 'An error occurred. Please try again.' });
                setTimeout(() => setScannerStatus('idle'), feedbackDuration);
                break;
        }
    };
    
    const submitAttendance = (code: string, selfieData?: string) => {
        if (!navigator.onLine) {
            try {
                const pendingRaw = localStorage.getItem('pendingAttendance');
                const records: PendingAttendanceRecord[] = pendingRaw ? JSON.parse(pendingRaw) : [];
                records.push({ code, studentId: user.id, selfieData, timestamp: Date.now() });
                localStorage.setItem('pendingAttendance', JSON.stringify(records));

                setScanResult({ status: 'info', message: 'You are offline. Attendance will be submitted when you reconnect.' });
                
                if (isScanning) {
                    setScannerStatus('success');
                    setTimeout(() => {
                        setIsScanning(false);
                        setScanResult(null);
                    }, 2000);
                }
            } catch (error) {
                 setScanResult({ status: 'error', message: 'Could not save attendance locally. Please check your device storage.' });
                 if (isScanning) setScannerStatus('error');
            }
            return;
        }

        const result = markAttendance(code, user.id, selfieData);
        processAttendanceResult(result, code);
    };

    const handleScanSuccess = (decodedText: string) => {
        if (scannerStatus !== 'idle') return;
        submitAttendance(decodedText);
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const code = manualCode.trim();
        if (!code) return;
        submitAttendance(code);
        setManualCode('');
    };
    
    const handleLivenessSubmit = (selfieData: string) => {
        setIsLivenessModalOpen(false);
        submitAttendance(codeForLiveness, selfieData);
        setCodeForLiveness('');
    };

    const handleScanError = (errorMessage: string) => {
        console.log(`QR Scanner Error: ${errorMessage}`);
    };

    if (isScanning) {
        return (
            <div className="w-full max-w-lg mt-6">
                <QRScanner
                    onSuccess={handleScanSuccess}
                    onError={handleScanError}
                    scannerStatus={scannerStatus}
                />
                <button
                    onClick={() => {
                        setIsScanning(false);
                        setScannerStatus('idle');
                        setScanResult(null);
                    }}
                    className="mt-4 w-full bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-500 transition-all active:scale-95"
                >
                    Cancel Scan
                </button>
                 {isLivenessModalOpen && (
                    <LivenessCheckModal
                        isOpen={isLivenessModalOpen}
                        onClose={() => {
                            setIsLivenessModalOpen(false);
                            setScannerStatus('idle'); // Resume scanner
                            setCodeForLiveness('');
                        }}
                        onSubmit={handleLivenessSubmit}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="w-full max-w-md p-8 mt-6 space-y-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Mark Your Attendance</h2>
            <p className="text-slate-500 dark:text-slate-400">Scan the session QR code or enter the short code provided by your instructor.</p>
            
            {scanResult && (
                <div className={`p-4 rounded-md text-sm font-medium ${
                    scanResult.status === 'success' ? 'bg-green-500/20 text-green-700 dark:text-green-300' :
                    scanResult.status === 'error' ? 'bg-red-500/20 text-red-700 dark:text-red-300' :
                    'bg-sky-500/20 text-sky-700 dark:text-sky-300'
                }`}>
                    {scanResult.message}
                </div>
            )}
            
            <div className="space-y-4">
                <button
                    onClick={() => {
                        setIsScanning(true);
                        setScanResult(null);
                        setScannerStatus('idle');
                    }}
                    className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-500 transition-all duration-150 transform hover:scale-105 active:scale-95"
                >
                    Scan QR Code
                </button>
                <div className="relative flex py-3 items-center">
                    <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
                    <span className="flex-shrink mx-4 text-slate-400 dark:text-slate-500 text-sm">OR</span>
                    <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
                </div>
                <form onSubmit={handleManualSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="short-code-input" className="sr-only">Enter Short Code</label>
                        <input
                            id="short-code-input"
                            type="text"
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                            placeholder="e.g., ABC-123"
                            className="w-full text-center tracking-widest font-mono text-lg p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <button type="submit" className="w-full bg-sky-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-sky-500 transition-all duration-150 transform hover:scale-105 active:scale-95">
                        Submit Code
                    </button>
                </form>
            </div>
             {isLivenessModalOpen && (
                <LivenessCheckModal
                    isOpen={isLivenessModalOpen}
                    onClose={() => {
                        setIsLivenessModalOpen(false);
                        setCodeForLiveness('');
                    }}
                    onSubmit={handleLivenessSubmit}
                />
            )}
        </div>
    );
};

export default StudentScanPage;
