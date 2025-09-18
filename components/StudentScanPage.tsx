import React, { useState } from 'react';
import QRScanner from './QRScanner';
import type { User, MarkAttendanceResult } from '../types';

interface StudentScanPageProps {
    user: User;
    markAttendance: (studentId: string, qrCodeValue: string) => MarkAttendanceResult;
}

const StudentScanPage: React.FC<StudentScanPageProps> = ({ user, markAttendance }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<{ status: 'success' | 'error' | 'info'; message: string } | null>(null);
    const [scannerStatus, setScannerStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleScanSuccess = (decodedText: string) => {
        const feedbackDuration = 1500;

        // Prevent multiple scans while processing feedback for a previous one
        if (scannerStatus !== 'idle') return;

        try {
            if (decodedText.startsWith('qr_')) {
                const result = markAttendance(user.id, decodedText);
                switch(result) {
                    case 'success':
                        setScannerStatus('success');
                        setScanResult({ status: 'success', message: 'Attendance marked successfully!' });
                        setTimeout(() => setIsScanning(false), feedbackDuration);
                        break;
                    case 'already_marked':
                        setScannerStatus('error');
                        setScanResult({ status: 'info', message: 'Attendance already marked for this session.' });
                        setTimeout(() => setScannerStatus('idle'), feedbackDuration);
                        break;
                    case 'limit_reached':
                        setScannerStatus('error');
                        setScanResult({ status: 'error', message: 'Attendance limit for this session has been reached.' });
                        setTimeout(() => setIsScanning(false), feedbackDuration);
                        break;
                    case 'not_enrolled':
                        setScannerStatus('error');
                        setScanResult({ status: 'error', message: 'You are not enrolled in this course.' });
                        setTimeout(() => setIsScanning(false), feedbackDuration);
                        break;
                    case 'expired_qr':
                         setScannerStatus('error');
                         setScanResult({ status: 'error', message: 'This QR code has expired. Please scan the new one.' });
                         setTimeout(() => setScannerStatus('idle'), feedbackDuration);
                         break;
                    case 'invalid_qr':
                         setScannerStatus('error');
                         setScanResult({ status: 'error', message: 'This QR code is invalid. Please find the active session code.' });
                         setTimeout(() => setScannerStatus('idle'), feedbackDuration);
                         break;
                    case 'error':
                    default:
                         setScannerStatus('error');
                         setScanResult({ status: 'error', message: 'An error occurred. Please try again.' });
                         setTimeout(() => setScannerStatus('idle'), feedbackDuration);
                         break;
                }
            } else {
                throw new Error("Invalid QR code format");
            }
        } catch (error) {
            console.error("Scan error:", error);
            setScannerStatus('error');
            setScanResult({ status: 'error', message: 'Invalid or unreadable QR code. Please try again.' });
            setTimeout(() => setScannerStatus('idle'), feedbackDuration);
        }
    };

    const handleScanError = (errorMessage: string) => {
        // This handles camera errors, not QR content errors.
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
                        setScannerStatus('idle'); // Ensure state is reset
                    }}
                    className="mt-4 w-full bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-500 transition-colors"
                >
                    Cancel Scan
                </button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md p-8 mt-6 space-y-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Mark Your Attendance</h2>
            <p className="text-slate-500 dark:text-slate-400">Click the button below to open the camera and scan the QR code for your class session.</p>
            
            {scanResult && (
                 <div className={`p-4 rounded-md text-sm font-medium ${
                     scanResult.status === 'success' ? 'bg-green-500/20 text-green-700 dark:text-green-300' : 
                     scanResult.status === 'error' ? 'bg-red-500/20 text-red-700 dark:text-red-300' :
                     'bg-sky-500/20 text-sky-700 dark:text-sky-300'
                 }`}>
                    {scanResult.message}
                </div>
            )}
            
            <button
                onClick={() => {
                    setIsScanning(true);
                    setScanResult(null);
                    setScannerStatus('idle');
                }}
                className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-500 transition-colors duration-300 transform hover:scale-105"
            >
                Scan QR Code
            </button>
        </div>
    );
};

export default StudentScanPage;