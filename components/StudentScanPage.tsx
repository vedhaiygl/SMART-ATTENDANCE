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

    const handleScanSuccess = (decodedText: string) => {
        setIsScanning(false);
        try {
            if (decodedText.startsWith('qr_')) {
                const result = markAttendance(user.id, decodedText);
                switch(result) {
                    case 'success':
                        setScanResult({ status: 'success', message: 'Attendance marked successfully!' });
                        break;
                    case 'already_marked':
                        setScanResult({ status: 'info', message: 'Attendance already marked for this session.' });
                        break;
                    case 'limit_reached':
                        setScanResult({ status: 'error', message: 'Attendance limit for this session has been reached.' });
                        break;
                    case 'not_enrolled':
                        setScanResult({ status: 'error', message: 'You are not enrolled in this course.' });
                        break;
                    case 'invalid_qr':
                         setScanResult({ status: 'error', message: 'This QR code is expired or invalid. Please scan the new one.' });
                         break;
                    case 'error':
                    default:
                         setScanResult({ status: 'error', message: 'An error occurred. Please try again.' });
                         break;
                }
            } else {
                throw new Error("Invalid QR code format");
            }
        } catch (error) {
            console.error("Scan error:", error);
            setScanResult({ status: 'error', message: 'Invalid or unreadable QR code. Please try again.' });
        }
    };

    const handleScanError = (errorMessage: string) => {
        console.log(errorMessage);
    };
    
    if (isScanning) {
         return (
            <div className="w-full max-w-lg mt-6">
               <QRScanner onSuccess={handleScanSuccess} onError={handleScanError} />
                <button 
                    onClick={() => setIsScanning(false)}
                    className="mt-4 w-full bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-500 transition-colors"
                >
                    Cancel Scan
                </button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md p-8 mt-6 space-y-6 bg-slate-800 rounded-2xl shadow-lg border border-slate-700">
            <h2 className="text-3xl font-bold text-white">Mark Your Attendance</h2>
            <p className="text-slate-400">Click the button below to open the camera and scan the QR code for your class session.</p>
            
            {scanResult && (
                 <div className={`p-4 rounded-md text-sm font-medium ${
                     scanResult.status === 'success' ? 'bg-green-500/20 text-green-300' : 
                     scanResult.status === 'error' ? 'bg-red-500/20 text-red-300' :
                     'bg-sky-500/20 text-sky-300'
                 }`}>
                    {scanResult.message}
                </div>
            )}
            
            <button
                onClick={() => {
                    setIsScanning(true);
                    setScanResult(null);
                }}
                className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-500 transition-colors duration-300 transform hover:scale-105"
            >
                Scan QR Code
            </button>
        </div>
    );
};

export default StudentScanPage;