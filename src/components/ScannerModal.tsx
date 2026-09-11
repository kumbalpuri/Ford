import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, Scan, Keyboard, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { playScanBeep } from '../utils/qrUtils';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (scannedText: string) => void;
  title?: string;
  subtitle?: string;
  placeholder?: string;
  suggestedValues?: string[];
  expectedFormat?: string;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'Connect Scanner / Scan QR Code',
  subtitle = 'Supports live camera, hardware USB/Bluetooth barcode scanner, or manual input',
  placeholder = 'Scan or type QR / Serial Code...',
  suggestedValues = [],
  expectedFormat
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'hardware' | 'quick'>('hardware');
  const [manualInput, setManualInput] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [lastScannedFeedback, setLastScannedFeedback] = useState<string | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const hardwareInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the hardware scanner input when modal opens or tab changes
  useEffect(() => {
    if (isOpen && activeTab === 'hardware') {
      setTimeout(() => {
        hardwareInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, activeTab]);

  // Handle Camera scanning
  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      setCameraError(null);
      const elementId = 'interactive-camera-reader';
      const qrScanner = new Html5Qrcode(elementId);
      html5QrCodeRef.current = qrScanner;

      qrScanner
        .start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          (decodedText) => {
            playScanBeep(true);
            setLastScannedFeedback(decodedText);
            onScan(decodedText.trim());
            setTimeout(() => {
              onClose();
            }, 600);
          },
          () => {
            // Ignore scan attempt failures (normal while scanning)
          }
        )
        .then(() => {
          setIsCameraActive(true);
        })
        .catch((err) => {
          console.warn('Camera initiation failed:', err);
          setCameraError(
            'Unable to access camera. Please check browser permissions or use the Hardware Scanner / Quick Simulator tab.'
          );
          setIsCameraActive(false);
        });

      return () => {
        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
          html5QrCodeRef.current
            .stop()
            .then(() => html5QrCodeRef.current?.clear())
            .catch(() => {});
        }
      };
    } else {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current
          .stop()
          .then(() => html5QrCodeRef.current?.clear())
          .catch(() => {});
      }
      setIsCameraActive(false);
    }
  }, [isOpen, activeTab, onScan, onClose]);

  // Hardware Scanner / Manual Input submission
  const handleSubmitManual = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = manualInput.trim();
    if (!val) return;

    playScanBeep(true);
    setLastScannedFeedback(val);
    onScan(val);
    setManualInput('');
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const handleQuickPick = (val: string) => {
    playScanBeep(true);
    setLastScannedFeedback(val);
    onScan(val);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="grid grid-cols-3 p-1.5 bg-slate-100 border-b border-slate-200 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('hardware')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md transition-all ${
              activeTab === 'hardware'
                ? 'bg-white text-blue-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>USB / Key In</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md transition-all ${
              activeTab === 'camera'
                ? 'bg-white text-blue-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Live Camera</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quick')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md transition-all ${
              activeTab === 'quick'
                ? 'bg-white text-blue-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Quick Pick</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {lastScannedFeedback && (
            <div className="flex items-center gap-2 p-2.5 bg-emerald-50 text-emerald-800 text-xs font-medium rounded-lg border border-emerald-200 animate-pulse">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Scanned successfully: <strong>{lastScannedFeedback}</strong></span>
            </div>
          )}

          {/* Hardware & Manual Scanner Tab */}
          {activeTab === 'hardware' && (
            <form onSubmit={handleSubmitManual} className="space-y-4">
              <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-lg text-xs text-blue-900">
                <p className="font-semibold mb-1">🔌 Hardware Barcode Scanner Ready</p>
                <p className="text-blue-700">
                  Point any USB / Bluetooth barcode or 2D QR gun scanner at the code. The scanner will automatically enter the code and register.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Scanner Input Buffer / Manual Entry
                </label>
                <div className="relative">
                  <input
                    ref={hardwareInputRef}
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder={placeholder}
                    className="w-full pl-3 pr-20 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!manualInput.trim()}
                    className="absolute right-1.5 top-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded text-xs font-medium transition-colors"
                  >
                    Enter
                  </button>
                </div>
                {expectedFormat && (
                  <p className="text-[11px] text-slate-500 mt-1">Expected: {expectedFormat}</p>
                )}
              </div>
            </form>
          )}

          {/* Camera Scanner Tab */}
          {activeTab === 'camera' && (
            <div className="space-y-3">
              {cameraError ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-2">
                  <div className="flex items-center gap-1.5 font-semibold text-amber-900">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Camera Permission Notice</span>
                  </div>
                  <p>{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('hardware')}
                    className="text-blue-700 font-semibold underline hover:text-blue-900"
                  >
                    Switch to Hardware / Keyboard Input
                  </button>
                </div>
              ) : (
                <div className="relative rounded-lg overflow-hidden bg-slate-900 border border-slate-300 flex flex-col items-center justify-center min-h-[260px]">
                  <div id="interactive-camera-reader" className="w-full max-w-[320px]"></div>
                  {!isCameraActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-xs gap-2 bg-slate-900">
                      <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
                      <span>Initializing live camera...</span>
                    </div>
                  )}
                </div>
              )}
              <p className="text-center text-[11px] text-slate-500">
                Align the product QR code or Box Mother QR inside the viewfinder.
              </p>
            </div>
          )}

          {/* Quick Pick Simulated Scanner Tab */}
          {activeTab === 'quick' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Click any available item code below to simulate an instant scan:
              </p>
              {suggestedValues.length > 0 ? (
                <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                  {suggestedValues.map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleQuickPick(val)}
                      className="flex items-center justify-between p-2.5 text-left border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50/50 transition-colors group"
                    >
                      <span className="font-mono text-xs font-semibold text-slate-800 group-hover:text-blue-700">
                        {val}
                      </span>
                      <span className="text-[11px] text-blue-600 font-medium px-2 py-0.5 bg-blue-100 rounded">
                        Pick & Scan
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No predefined items in this context. Use the USB/Key In tab.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span>Factory Traceability v1.0</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
