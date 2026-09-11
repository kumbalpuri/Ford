import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useTraceability } from '../context/TraceabilityContext';
import { useLanguage } from '../context/LanguageContext';
import { MotherBox } from '../types';
import { playScanBeep } from '../utils/qrUtils';
import { QuickPackBoxModal } from './QuickPackBoxModal';
import {
  Camera,
  X,
  Scan,
  Smartphone,
  Tablet,
  CheckCircle2,
  AlertCircle,
  Truck,
  Package,
  Building2,
  Search,
  Sparkles,
  RefreshCw,
  Plus,
  Trash2,
  Volume2,
  Vibrate,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Info
} from 'lucide-react';

interface MobileScannerTerminalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'dispatch' | 'pack' | 'sister' | 'audit';
}

export const MobileScannerTerminal: React.FC<MobileScannerTerminalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'dispatch'
}) => {
  const {
    products,
    customers,
    boxes,
    dispatches,
    scDispatches,
    packBox,
    dispatchBoxesFromFactory,
    receiveBoxesAtSisterConcern,
    dispatchBoxesFromSisterConcern
  } = useTraceability();
  const { isGerman } = useLanguage();

  // Terminal Modes
  const [terminalMode, setTerminalMode] = useState<'dispatch' | 'pack' | 'sister' | 'audit'>(defaultMode);

  // Scanner Hardware & Camera State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCodeInput, setManualCodeInput] = useState<string>('');
  const [lastScannedFeedback, setLastScannedFeedback] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<boolean>(true);

  // Debounce tracking to prevent repeated trigger of same barcode in continuous camera mode
  const lastScannedTimeRef = useRef<{ [code: string]: number }>({});
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const manualInputRef = useRef<HTMLInputElement>(null);

  // Quick Pack Box Modal state
  const [isQuickPackOpen, setIsQuickPackOpen] = useState<boolean>(false);

  // Mode 1: Dispatch State
  const [dispatchCustomerId, setDispatchCustomerId] = useState<string>(customers[0]?.id || '');
  const [dispatchInvoice, setDispatchInvoice] = useState<string>(
    `SAP-INV-${Math.floor(10000 + Math.random() * 90000)}`
  );
  const [dispatchBoxIds, setDispatchBoxIds] = useState<string[]>([]);

  // Mode 2: Pack State
  const [packProductId, setPackProductId] = useState<string>(products[0]?.id || '');
  const [packSerials, setPackSerials] = useState<string[]>([]);
  const [packOperator, setPackOperator] = useState<string>('Mobile Operator 1');

  // Mode 3: Sister Concern State
  const [sisterSubMode, setSisterSubMode] = useState<'inward' | 'outward'>('inward');
  const [sisterCustomerId, setSisterCustomerId] = useState<string>(
    customers.find((c) => !c.isSisterConcern)?.id || customers[0]?.id || ''
  );
  const [sisterScannedBoxIds, setSisterScannedBoxIds] = useState<string[]>([]);
  const [sisterInvoiceNumber, setSisterInvoiceNumber] = useState<string>(
    `SC-DN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );

  // Mode 4: Audit Lookup Result
  const [auditResult, setAuditResult] = useState<any | null>(null);

  // Notification Banner
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const triggerHaptic = (success: boolean) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (success) {
        navigator.vibrate([40, 30, 80]);
      } else {
        navigator.vibrate([100, 50, 100, 50, 200]);
      }
    }
  };

  // Camera start/stop lifecycle
  useEffect(() => {
    if (!isOpen) {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().then(() => html5QrCodeRef.current?.clear()).catch(() => {});
      }
      return;
    }

    if (isCameraActive) {
      setCameraError(null);
      const elementId = 'mobile-live-camera-feed';

      // Give DOM time to mount container
      const timeout = setTimeout(() => {
        try {
          const qrScanner = new Html5Qrcode(elementId);
          html5QrCodeRef.current = qrScanner;

          qrScanner
            .start(
              { facingMode: cameraFacing },
              {
                fps: 12,
                qrbox: (viewfinderWidth, viewfinderHeight) => {
                  const edge = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.72);
                  return { width: edge, height: edge };
                }
              },
              (decodedText) => {
                handleCodeDetected(decodedText.trim());
              },
              () => {
                // scanning attempt (normal in stream)
              }
            )
            .catch((err) => {
              console.warn('Mobile camera failed:', err);
              setCameraError(
                isGerman
                  ? 'Kamerazugriff fehlgeschlagen. Bitte Berechtigungen prüfen oder manuelle Eingabe nutzen.'
                  : 'Camera access denied or unavailable. Use manual/hardware barcode input.'
              );
              setIsCameraActive(false);
            });
        } catch (e) {
          console.error(e);
        }
      }, 200);

      return () => {
        clearTimeout(timeout);
        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
          html5QrCodeRef.current.stop().then(() => html5QrCodeRef.current?.clear()).catch(() => {});
        }
      };
    } else {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().then(() => html5QrCodeRef.current?.clear()).catch(() => {});
      }
    }
  }, [isOpen, isCameraActive, cameraFacing]);

  // Main Barcode Processing Logic
  const handleCodeDetected = (rawCode: string) => {
    const code = rawCode.trim().toUpperCase();
    if (!code) return;

    // Check debounce: suppress identical code scanned within 2 seconds
    const now = Date.now();
    const lastTime = lastScannedTimeRef.current[code] || 0;
    if (now - lastTime < 2000) {
      return;
    }
    lastScannedTimeRef.current[code] = now;

    // Route based on active mode
    if (terminalMode === 'dispatch') {
      processDispatchScan(code);
    } else if (terminalMode === 'pack') {
      processPackScan(code);
    } else if (terminalMode === 'sister') {
      processSisterScan(code);
    } else if (terminalMode === 'audit') {
      processAuditScan(code);
    }
  };

  // 1. Process Dispatch Scan
  const processDispatchScan = (code: string) => {
    if (dispatchBoxIds.includes(code)) {
      playScanBeep(false);
      triggerHaptic(false);
      setFeedbackSuccess(false);
      setLastScannedFeedback(`${code}: Already in current dispatch!`);
      showToast(
        isGerman ? `Kiste "${code}" bereits in dieser Sendung!` : `Box "${code}" already scanned!`,
        'error'
      );
      return;
    }

    const box = boxes.find((b) => b.id === code);
    if (!box) {
      playScanBeep(false);
      triggerHaptic(false);
      setFeedbackSuccess(false);
      setLastScannedFeedback(`${code}: Unknown Box ID`);
      showToast(
        isGerman ? `Kiste "${code}" nicht gefunden!` : `Box "${code}" not found in system!`,
        'error'
      );
      return;
    }

    if (box.status !== 'PACKED_IN_STOCK') {
      playScanBeep(false);
      triggerHaptic(false);
      setFeedbackSuccess(false);
      setLastScannedFeedback(`${code}: Status is ${box.status}`);
      showToast(
        isGerman
          ? `Kiste "${code}" kann nicht versendet werden (Status: ${box.status})`
          : `Box "${code}" not available in stock (status: ${box.status})`,
        'error'
      );
      return;
    }

    playScanBeep(true);
    triggerHaptic(true);
    setFeedbackSuccess(true);
    setLastScannedFeedback(`✓ ${code} (${box.productName})`);
    setDispatchBoxIds((prev) => [...prev, code]);
    showToast(
      isGerman ? `Kiste hinzugefügt: ${code}` : `Box scanned: ${code}`,
      'success'
    );
  };

  // 2. Process Pack Scan (Parts into Box)
  const currentPackProduct = products.find((p) => p.id === packProductId) || products[0];
  const packCapacity = currentPackProduct ? currentPackProduct.boxCapacity : 10;

  const processPackScan = (code: string) => {
    if (packSerials.includes(code)) {
      playScanBeep(false);
      triggerHaptic(false);
      setFeedbackSuccess(false);
      setLastScannedFeedback(`${code}: Duplicate part serial!`);
      showToast(
        isGerman ? `Teil "${code}" bereits gescannt!` : `Serial "${code}" already in box!`,
        'error'
      );
      return;
    }

    if (packSerials.length >= packCapacity) {
      playScanBeep(false);
      triggerHaptic(false);
      setFeedbackSuccess(false);
      setLastScannedFeedback(`Box full! (${packCapacity}/${packCapacity})`);
      showToast(
        isGerman ? `Kiste voll (${packCapacity} Stk.)!` : `Box full! (${packCapacity} units)`,
        'error'
      );
      return;
    }

    playScanBeep(true);
    triggerHaptic(true);
    setFeedbackSuccess(true);
    setLastScannedFeedback(`✓ Serial: ${code} (${packSerials.length + 1}/${packCapacity})`);
    setPackSerials((prev) => [...prev, code]);
  };

  // 3. Process Sister Concern Scan
  const processSisterScan = (code: string) => {
    const box = boxes.find((b) => b.id === code);
    if (!box) {
      playScanBeep(false);
      triggerHaptic(false);
      setFeedbackSuccess(false);
      setLastScannedFeedback(`${code}: Box Not Found`);
      showToast(isGerman ? `Kiste nicht gefunden` : `Box not found`, 'error');
      return;
    }

    if (sisterSubMode === 'inward') {
      if (box.status !== 'IN_TRANSIT_SISTER_CONCERN') {
        playScanBeep(false);
        triggerHaptic(false);
        setFeedbackSuccess(false);
        setLastScannedFeedback(`${code}: Status is ${box.status}`);
        showToast(
          isGerman
            ? `Kiste ist nicht im Transit (Status: ${box.status})`
            : `Box is not in transit to Sister Concern`,
          'error'
        );
        return;
      }

      // Receive directly!
      receiveBoxesAtSisterConcern([box.id], 'Mobile Inward Dock Operator');
      playScanBeep(true);
      triggerHaptic(true);
      setFeedbackSuccess(true);
      setLastScannedFeedback(`✓ Intake Complete: ${box.id}`);
      showToast(
        isGerman
          ? `Wareneingang gebucht: ${box.id} im Lager!`
          : `Intake Complete: ${box.id} in Warehouse!`,
        'success'
      );
    } else {
      // Outward dispatch from sister concern
      if (box.status !== 'AT_SISTER_CONCERN') {
        playScanBeep(false);
        triggerHaptic(false);
        setFeedbackSuccess(false);
        setLastScannedFeedback(`${code}: Not at Sister Concern`);
        showToast(
          isGerman
            ? `Kiste nicht im Lager der Schwestergesellschaft!`
            : `Box not in Sister Concern warehouse!`,
          'error'
        );
        return;
      }

      if (sisterScannedBoxIds.includes(code)) {
        playScanBeep(false);
        triggerHaptic(false);
        setFeedbackSuccess(false);
        setLastScannedFeedback(`${code}: Already added`);
        return;
      }

      playScanBeep(true);
      triggerHaptic(true);
      setFeedbackSuccess(true);
      setLastScannedFeedback(`✓ ${code} (${box.productName})`);
      setSisterScannedBoxIds((prev) => [...prev, code]);
      showToast(isGerman ? `Kiste hinzugefügt: ${code}` : `Box added: ${code}`, 'success');
    }
  };

  // 4. Process Quick Audit Scan
  const processAuditScan = (code: string) => {
    // Check if code is a box
    const box = boxes.find((b) => b.id === code);
    if (box) {
      playScanBeep(true);
      triggerHaptic(true);
      setFeedbackSuccess(true);
      setLastScannedFeedback(`✓ Box Identified: ${code}`);
      setAuditResult({
        type: 'BOX',
        data: box
      });
      return;
    }

    // Check if code is a serial inside any box
    const parentBox = boxes.find((b) => b.itemSerials.includes(code));
    if (parentBox) {
      playScanBeep(true);
      triggerHaptic(true);
      setFeedbackSuccess(true);
      setLastScannedFeedback(`✓ Part Serial Identified: ${code}`);
      setAuditResult({
        type: 'SERIAL',
        serial: code,
        parentBox
      });
      return;
    }

    playScanBeep(false);
    triggerHaptic(false);
    setFeedbackSuccess(false);
    setLastScannedFeedback(`${code}: Not Found in Trace Register`);
    showToast(isGerman ? `Code nicht in Historie gefunden` : `Code not found in trace register`, 'error');
  };

  // Execution: Submit Factory Dispatch from Mobile
  const handleConfirmMobileDispatch = () => {
    if (dispatchBoxIds.length === 0) {
      showToast(isGerman ? 'Keine Kisten gescannt!' : 'No boxes scanned!', 'error');
      return;
    }

    const selectedCust = customers.find((c) => c.id === dispatchCustomerId);
    if (!selectedCust) {
      showToast(isGerman ? 'Kunde auswählen!' : 'Select customer!', 'error');
      return;
    }

    try {
      dispatchBoxesFromFactory({
        invoiceNumber: dispatchInvoice.trim().toUpperCase(),
        dispatchType: selectedCust.isSisterConcern ? 'SISTER_CONCERN' : 'DIRECT_SALE',
        dispatchDate: new Date().toISOString().slice(0, 10),
        customerId: selectedCust.id,
        boxIds: dispatchBoxIds,
        vehicleNumber: 'MOBILE-DOCK-1',
        notes: 'Dispatched via Mobile Scanner Terminal',
        createdBy: 'Mobile Handheld Operator'
      });

      playScanBeep(true);
      triggerHaptic(true);
      showToast(
        isGerman
          ? `Lieferschein ${dispatchInvoice} mit ${dispatchBoxIds.length} Kiste(n) gebucht!`
          : `Dispatch ${dispatchInvoice} (${dispatchBoxIds.length} boxes) confirmed!`,
        'success'
      );

      // Reset
      setDispatchBoxIds([]);
      setDispatchInvoice(`SAP-INV-${Math.floor(10000 + Math.random() * 90000)}`);
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  // Execution: Seal Mother Box from Mobile
  const handleConfirmMobilePack = () => {
    if (packSerials.length === 0) {
      showToast(isGerman ? 'Keine Teile gescannt!' : 'No parts scanned!', 'error');
      return;
    }

    try {
      const newBox = packBox({
        productId: packProductId,
        productionDate: new Date().toISOString().slice(0, 10),
        productionShift: 'Shift A',
        itemSerials: packSerials,
        packedBy: packOperator
      });

      playScanBeep(true);
      triggerHaptic(true);
      showToast(
        isGerman
          ? `Kiste ${newBox.id} versiegelt & im Lager gebucht!`
          : `Mother Box ${newBox.id} sealed & registered!`,
        'success'
      );

      setPackSerials([]);
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  // Execution: Confirm Sister Concern Dispatch
  const handleConfirmMobileSisterDispatch = () => {
    if (sisterScannedBoxIds.length === 0) {
      showToast(isGerman ? 'Keine Kisten gescannt!' : 'No boxes scanned!', 'error');
      return;
    }

    try {
      dispatchBoxesFromSisterConcern({
        scInvoiceNumber: sisterInvoiceNumber,
        dispatchDate: new Date().toISOString().slice(0, 10),
        finalCustomerId: sisterCustomerId,
        boxIds: sisterScannedBoxIds,
        createdBy: 'Mobile Handheld Sister Unit'
      });

      playScanBeep(true);
      triggerHaptic(true);
      showToast(
        isGerman
          ? `Warenausgang ${sisterInvoiceNumber} gebucht!`
          : `Delivery Note ${sisterInvoiceNumber} confirmed!`,
        'success'
      );

      setSisterScannedBoxIds([]);
      setSisterInvoiceNumber(
        `SC-DN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
      );
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="mobile-scanner-terminal-overlay"
      className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-hidden"
    >
      {/* Top Industrial App Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            id="mobile-terminal-back-btn"
            type="button"
            onClick={onClose}
            className="p-2 -ml-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Exit Mobile Mode"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <h1 className="text-sm font-black tracking-wide uppercase text-white flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>{isGerman ? 'Handheld Terminal' : 'Mobile Scanner Terminal'}</span>
              </h1>
            </div>
            <p className="text-[10px] text-slate-400">
              {isGerman ? 'Live-Scan & Sofort-Erfassung' : 'Live Camera & Fast Dock Entry'}
            </p>
          </div>
        </div>

        {/* Quick Camera Hardware Toggles */}
        <div className="flex items-center gap-1.5">
          <button
            id="flip-camera-btn"
            type="button"
            onClick={() => setCameraFacing((prev) => (prev === 'environment' ? 'user' : 'environment'))}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs flex items-center gap-1"
            title="Flip Camera (Front/Rear)"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline text-[10px] font-bold">Flip</span>
          </button>

          <button
            id="toggle-camera-active-btn"
            type="button"
            onClick={() => setIsCameraActive((prev) => !prev)}
            className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
              isCameraActive ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
            title="Toggle Live Camera"
          >
            <Camera className="w-4 h-4" />
            <span className="text-[10px]">{isCameraActive ? 'ON' : 'PAUSED'}</span>
          </button>

          <button
            id="exit-terminal-btn"
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="absolute top-16 left-4 right-4 z-50 flex justify-center pointer-events-none">
          <div
            className={`px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 animate-bounce ${
              toastMessage.type === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-red-600 text-white'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Terminal Station Mode Switcher (Large Finger-Friendly Segmented Tabs) */}
      <div className="bg-slate-900/90 border-b border-slate-800 p-2 overflow-x-auto shrink-0 flex gap-1.5 no-scrollbar">
        <button
          type="button"
          onClick={() => {
            setTerminalMode('dispatch');
            setLastScannedFeedback(null);
          }}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            terminalMode === 'dispatch'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Truck className="w-4 h-4 shrink-0" />
          <span>{isGerman ? '1. Kunden-Versand' : '1. Multi-Box Dispatch'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setTerminalMode('pack');
            setLastScannedFeedback(null);
          }}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            terminalMode === 'pack'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Package className="w-4 h-4 shrink-0" />
          <span>{isGerman ? '2. Kiste packen' : '2. Pack Parts'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setTerminalMode('sister');
            setLastScannedFeedback(null);
          }}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            terminalMode === 'sister'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4 shrink-0" />
          <span>{isGerman ? '3. Schwester-Dock' : '3. Sister Concern'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setTerminalMode('audit');
            setLastScannedFeedback(null);
          }}
          className={`flex-1 min-w-[110px] py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            terminalMode === 'audit'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Search className="w-4 h-4 shrink-0" />
          <span>{isGerman ? '4. Schnell-Audit' : '4. Audit Trace'}</span>
        </button>
      </div>

      {/* Main Body: Split between Viewfinder (Top) & Interactive Form Data (Bottom) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Camera Viewfinder Screen Area */}
        <div className="h-56 sm:h-64 md:h-auto md:w-1/2 bg-black relative flex items-center justify-center overflow-hidden border-b md:border-b-0 md:border-r border-slate-800 shrink-0">
          {isCameraActive ? (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              {/* HTML5 QR Code Mount point */}
              <div id="mobile-live-camera-feed" className="w-full h-full object-cover"></div>

              {/* Scanning Target Reticle & Visual Laser */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-48 h-48 sm:w-56 sm:h-56 border-2 border-emerald-400/60 rounded-2xl relative shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                  {/* Corner Accent brackets */}
                  <span className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-sm"></span>
                  <span className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-sm"></span>
                  <span className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-sm"></span>
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br-sm"></span>

                  {/* Animated laser line */}
                  <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] absolute top-1/2 -translate-y-1/2 animate-pulse"></div>
                </div>
              </div>

              {/* Viewfinder Guidance Label */}
              <div className="absolute bottom-3 left-0 right-0 text-center pointer-events-none">
                <span className="px-3 py-1 bg-black/75 rounded-full text-[11px] font-mono text-emerald-300 backdrop-blur-xs border border-emerald-500/30">
                  {isGerman ? 'QR- / Barcode in den Rahmen halten' : 'Aim camera at Box / Part QR code'}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center space-y-3">
              <Camera className="w-12 h-12 mx-auto text-slate-600" />
              <p className="text-xs text-slate-400">
                {cameraError || (isGerman ? 'Kamera pausiert' : 'Camera is paused')}
              </p>
              <button
                type="button"
                onClick={() => setIsCameraActive(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
              >
                {isGerman ? 'Kamera starten' : 'Start Camera'}
              </button>
            </div>
          )}

          {/* Real-time Scan Result Banner inside Camera View */}
          {lastScannedFeedback && (
            <div
              className={`absolute top-3 left-3 right-3 p-2.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 backdrop-blur-md transition-all shadow-md ${
                feedbackSuccess
                  ? 'bg-emerald-900/90 text-emerald-100 border border-emerald-500'
                  : 'bg-red-900/90 text-red-100 border border-red-500'
              }`}
            >
              {feedbackSuccess ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span className="truncate">{lastScannedFeedback}</span>
            </div>
          )}
        </div>

        {/* Operational Entry Panel & Scanned Batch Items */}
        <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden">
          
          {/* Quick Hardware Wedge / Barcode Typing Bar */}
          <div className="p-3 bg-slate-800/80 border-b border-slate-700/80 flex gap-2 shrink-0">
            <input
              ref={manualInputRef}
              id="mobile-barcode-wedge-input"
              type="text"
              value={manualCodeInput}
              onChange={(e) => setManualCodeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCodeDetected(manualCodeInput);
                  setManualCodeInput('');
                }
              }}
              placeholder={
                isGerman
                  ? 'Barcode-Gun oder Eingabe...'
                  : 'Hardware scanner / barcode wedge input...'
              }
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl font-mono text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
            <button
              type="button"
              onClick={() => {
                handleCodeDetected(manualCodeInput);
                setManualCodeInput('');
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shrink-0"
            >
              {isGerman ? 'Enter' : 'Submit'}
            </button>
          </div>

          {/* Mode-Specific Action Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* 1. DISPATCH MODE PANEL */}
            {terminalMode === 'dispatch' && (
              <div className="space-y-4">
                <div className="bg-slate-800/60 border border-slate-700/70 rounded-2xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">
                      {isGerman ? 'Versand-Parameter' : 'Dispatch Parameters'}
                    </span>
                    <span className="text-[11px] font-mono text-indigo-400">{dispatchInvoice}</span>
                  </div>

                  {/* Customer Selection */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400 font-semibold block">
                      {isGerman ? 'Empfänger auswählen:' : 'Select Recipient:'}
                    </label>
                    <select
                      value={dispatchCustomerId}
                      onChange={(e) => setDispatchCustomerId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-medium text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    >
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.isSisterConcern ? '(Sister Concern)' : '(Direct OEM)'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Scanned Boxes Batch List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200">
                        {isGerman ? 'Gescannte Kisten:' : 'Scanned Boxes for Customer:'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white">
                        {dispatchBoxIds.length}
                      </span>
                    </div>

                    {/* Quick Pack & Add New Box on Mobile */}
                    <button
                      type="button"
                      onClick={() => setIsQuickPackOpen(true)}
                      className="px-2.5 py-1.5 bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isGerman ? '+ Neue Kiste' : '+ New Box'}</span>
                    </button>
                  </div>

                  {dispatchBoxIds.length === 0 ? (
                    <div className="p-8 text-center border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 space-y-2">
                      <Scan className="w-8 h-8 mx-auto text-slate-600" />
                      <p className="text-xs font-semibold text-slate-400">
                        {isGerman
                          ? 'Halten Sie Kisten-QR-Codes nacheinander vor die Kamera'
                          : 'Scan multiple mother boxes in sequence'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {isGerman
                          ? 'Jeder Scan wird sofort mit Signalton hinzugefügt'
                          : 'Each box is verified & added with sound and haptics'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-52 overflow-y-auto">
                      {dispatchBoxIds.map((boxId, index) => {
                        const box = boxes.find((b) => b.id === boxId);
                        return (
                          <div
                            key={boxId}
                            className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-2.5 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-5 h-5 rounded-full bg-indigo-900 text-indigo-200 text-[10px] font-bold flex items-center justify-center">
                                {index + 1}
                              </span>
                              <div>
                                <span className="font-mono font-bold text-xs text-white block">
                                  {boxId}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {box?.productName || 'FG Parts'} · {box?.itemSerials.length || 0} pcs
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setDispatchBoxIds((prev) => prev.filter((id) => id !== boxId))}
                              className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. PACKING MODE PANEL */}
            {terminalMode === 'pack' && (
              <div className="space-y-4">
                <div className="bg-slate-800/60 border border-slate-700/70 rounded-2xl p-3.5 space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400 font-semibold block">
                      {isGerman ? 'Produkt für Kiste wählen:' : 'Select Product for Box:'}
                    </label>
                    <select
                      value={packProductId}
                      onChange={(e) => {
                        setPackProductId(e.target.value);
                        setPackSerials([]);
                      }}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-medium text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.partNumber}) · Std Pack: {p.boxCapacity} pcs
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Progress towards capacity */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-300">
                        {isGerman ? 'Gescannte Teile:' : 'Scanned Parts:'}
                      </span>
                      <span className="font-mono text-blue-400">
                        {packSerials.length} / {packCapacity}
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                      <div
                        className="bg-blue-500 h-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (packSerials.length / packCapacity) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Scanned Serial list */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">
                      {isGerman ? 'Seriennummern in Kiste:' : 'Serials in Current Box:'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const dateCode = new Date().toISOString().slice(2, 10).replace(/-/g, '');
                        const generated: string[] = [];
                        for (let i = 1; i <= packCapacity; i++) {
                          generated.push(`FG-${currentPackProduct.partNumber.slice(0, 5)}-${dateCode}-${String(i).padStart(3, '0')}`);
                        }
                        setPackSerials(generated);
                        playScanBeep(true);
                      }}
                      className="px-2.5 py-1 bg-indigo-900/60 hover:bg-indigo-900 text-indigo-300 border border-indigo-700 rounded-lg text-[10px] font-bold flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      <span>{isGerman ? 'Auto-Füllen' : 'Simulate Fill'}</span>
                    </button>
                  </div>

                  {packSerials.length === 0 ? (
                    <div className="p-6 text-center border-2 border-dashed border-slate-800 rounded-2xl text-slate-500">
                      <p className="text-xs">
                        {isGerman
                          ? 'Scannen Sie Teile-Etiketten, um die Kiste zu füllen'
                          : 'Scan individual finished part QR codes to fill the box'}
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-xl p-2 bg-slate-950 flex flex-wrap gap-1.5">
                      {packSerials.map((s, idx) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-md font-mono text-[10px] text-slate-200 flex items-center gap-1"
                        >
                          <span>{idx + 1}. {s}</span>
                          <button
                            type="button"
                            onClick={() => setPackSerials((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-slate-400 hover:text-red-400 font-bold ml-1"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. SISTER CONCERN MODE PANEL */}
            {terminalMode === 'sister' && (
              <div className="space-y-4">
                {/* Sub-mode toggle: Inward vs Outward */}
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSisterSubMode('inward')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                      sisterSubMode === 'inward'
                        ? 'bg-purple-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {isGerman ? 'Wareneingang (LKW)' : '1. Inward Truck Intake'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSisterSubMode('outward')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                      sisterSubMode === 'outward'
                        ? 'bg-purple-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {isGerman ? 'Warenausgang (Endkunde)' : '2. Outward OEM Dispatch'}
                  </button>
                </div>

                {sisterSubMode === 'inward' ? (
                  <div className="bg-slate-800/60 border border-slate-700/70 rounded-2xl p-4 text-center space-y-2">
                    <Truck className="w-8 h-8 mx-auto text-purple-400" />
                    <h3 className="text-xs font-bold text-white">
                      {isGerman ? 'Transit-Kisten am Tor scannen' : 'Scan Arriving Transit Boxes at Dock'}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {isGerman
                        ? 'Jeder Scan bucht die Mutterkiste sofort automatisch in das Lager der Schwestergesellschaft um.'
                        : 'Each scan automatically updates status from In Transit to In Warehouse of Sister Concern.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400 font-semibold block">
                        {isGerman ? 'Endkunden wählen:' : 'Final OEM Customer:'}
                      </label>
                      <select
                        value={sisterCustomerId}
                        onChange={(e) => setSisterCustomerId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-medium text-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                      >
                        {customers.filter((c) => !c.isSisterConcern).map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-300">
                        {isGerman ? 'Gescannte Kisten für Endkunden:' : 'Scanned Boxes for Final Customer:'} ({sisterScannedBoxIds.length})
                      </span>
                      {sisterScannedBoxIds.length > 0 && (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto">
                          {sisterScannedBoxIds.map((id) => (
                            <div key={id} className="p-2 bg-slate-800 rounded-lg text-xs font-mono flex justify-between">
                              <span>{id}</span>
                              <button
                                type="button"
                                onClick={() => setSisterScannedBoxIds((prev) => prev.filter((b) => b !== id))}
                                className="text-red-400 font-bold"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. AUDIT TRACE PANEL */}
            {terminalMode === 'audit' && (
              <div className="space-y-4">
                {!auditResult ? (
                  <div className="p-8 text-center border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 space-y-2">
                    <Search className="w-8 h-8 mx-auto text-slate-600" />
                    <p className="text-xs font-semibold text-slate-300">
                      {isGerman ? 'Teile- oder Kisten-QR scannen' : 'Scan Any Part or Box QR Code'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {isGerman
                        ? 'Sofortige 4-Stufen-Rückverfolgung, Lieferschein und Chargenprüfung'
                        : 'Instant 4-stage genealogy, dispatch note, and containment status verification'}
                    </p>
                  </div>
                ) : (
                  <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" />
                        <span>{isGerman ? 'Verifiziertes Ergebnis' : 'Verified Trace Result'}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setAuditResult(null)}
                        className="text-[11px] text-slate-400 hover:text-white underline"
                      >
                        {isGerman ? 'Neuer Scan' : 'Clear'}
                      </button>
                    </div>

                    {auditResult.type === 'BOX' && (
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-slate-400 text-[10px]">Mutterkiste:</span>
                          <div className="font-mono font-bold text-white text-sm">{auditResult.data.id}</div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px]">Produkt:</span>
                          <div className="font-bold text-slate-200">
                            {auditResult.data.productName} ({auditResult.data.partNumber})
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px]">Status:</span>
                          <div className="font-semibold text-amber-300">{auditResult.data.status}</div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px]">SAP Rechnung:</span>
                          <div className="font-mono text-slate-200">
                            {auditResult.data.factoryInvoiceNumber || '—'}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px]">Enthaltene Teile ({auditResult.data.itemSerials.length} Stk.):</span>
                          <div className="max-h-24 overflow-y-auto font-mono text-[10px] text-slate-300 bg-slate-950 p-2 rounded-lg">
                            {auditResult.data.itemSerials.join(', ')}
                          </div>
                        </div>
                      </div>
                    )}

                    {auditResult.type === 'SERIAL' && (
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-slate-400 text-[10px]">Teile-Seriennummer:</span>
                          <div className="font-mono font-bold text-emerald-300 text-sm">{auditResult.serial}</div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px]">Zugeordnete Mutterkiste:</span>
                          <div className="font-mono font-bold text-white">{auditResult.parentBox.id}</div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px]">Produkt:</span>
                          <div className="font-bold text-slate-200">{auditResult.parentBox.productName}</div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px]">Aktueller Kistenstatus:</span>
                          <div className="font-semibold text-amber-300">{auditResult.parentBox.status}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sticky Big Bottom Thumb Action Zone (Minimum 52px Touch Targets) */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 shrink-0">
            {terminalMode === 'dispatch' && (
              <button
                id="mobile-confirm-dispatch-btn"
                type="button"
                onClick={handleConfirmMobileDispatch}
                disabled={dispatchBoxIds.length === 0}
                className="w-full min-h-[52px] py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl font-black text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-98"
              >
                <Truck className="w-5 h-5" />
                <span>
                  {isGerman
                    ? `${dispatchBoxIds.length} Kiste(n) jetzt an Kunden versenden`
                    : `Dispatch ${dispatchBoxIds.length} Box(es) to Customer`}
                </span>
              </button>
            )}

            {terminalMode === 'pack' && (
              <button
                id="mobile-confirm-pack-btn"
                type="button"
                onClick={handleConfirmMobilePack}
                disabled={packSerials.length === 0}
                className="w-full min-h-[52px] py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl font-black text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-98"
              >
                <Package className="w-5 h-5" />
                <span>
                  {isGerman
                    ? `Kiste versiegeln (${packSerials.length} Stk.)`
                    : `Seal & Register Mother Box (${packSerials.length} pcs)`}
                </span>
              </button>
            )}

            {terminalMode === 'sister' && sisterSubMode === 'outward' && (
              <button
                id="mobile-confirm-sister-dispatch-btn"
                type="button"
                onClick={handleConfirmMobileSisterDispatch}
                disabled={sisterScannedBoxIds.length === 0}
                className="w-full min-h-[52px] py-3 px-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl font-black text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-98"
              >
                <Building2 className="w-5 h-5" />
                <span>
                  {isGerman
                    ? `${sisterScannedBoxIds.length} Kiste(n) an OEM liefern`
                    : `Deliver ${sisterScannedBoxIds.length} Box(es) to OEM`}
                </span>
              </button>
            )}

            {terminalMode === 'sister' && sisterSubMode === 'inward' && (
              <div className="text-center text-[11px] text-slate-400 font-semibold py-2">
                {isGerman
                  ? '⚡ Sofort-Erfassung aktiv: Kisten werden beim Scannen direkt eingebucht'
                  : '⚡ Real-time intake active: scanning immediately books boxes into warehouse'}
              </div>
            )}

            {terminalMode === 'audit' && (
              <div className="text-center text-[11px] text-slate-400 font-semibold py-2">
                {isGerman
                  ? '🔍 Audit-Modus: Daten werden automatisch beim Zeigen der Kamera geladen'
                  : '🔍 Live Audit: point camera at any label to inspect genealogy'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Pack Modal if user clicks "+ New Box" inside mobile dispatch */}
      <QuickPackBoxModal
        isOpen={isQuickPackOpen}
        onClose={() => setIsQuickPackOpen(false)}
        onBoxCreated={(newBox) => {
          setDispatchBoxIds((prev) => [...prev, newBox.id]);
          showToast(
            isGerman ? `Kiste ${newBox.id} erstellt & ausgewählt!` : `Box ${newBox.id} packed & selected!`,
            'success'
          );
        }}
      />
    </div>
  );
};
