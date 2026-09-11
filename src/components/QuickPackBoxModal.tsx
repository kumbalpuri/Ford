import React, { useState } from 'react';
import { useTraceability } from '../context/TraceabilityContext';
import { useLanguage } from '../context/LanguageContext';
import { MotherBox } from '../types';
import { playScanBeep } from '../utils/qrUtils';
import {
  X,
  PackagePlus,
  Sparkles,
  Scan,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Plus
} from 'lucide-react';
import { ScannerModal } from './ScannerModal';

interface QuickPackBoxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBoxCreated: (newBox: MotherBox) => void;
  initialProductId?: string;
}

export const QuickPackBoxModal: React.FC<QuickPackBoxModalProps> = ({
  isOpen,
  onClose,
  onBoxCreated,
  initialProductId
}) => {
  const { products, packBox } = useTraceability();
  const { isGerman } = useLanguage();

  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProductId || (products[0]?.id || '')
  );
  const [productionDate, setProductionDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [productionShift, setProductionShift] = useState<'Shift A' | 'Shift B' | 'Shift C'>('Shift A');
  const [packedBy, setPackedBy] = useState<string>('Station Operator');
  const [serials, setSerials] = useState<string[]>([]);
  const [manualSerialInput, setManualSerialInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentProduct = products.find((p) => p.id === selectedProductId) || products[0];
  const capacity = currentProduct ? currentProduct.boxCapacity : 10;
  const isFull = serials.length >= capacity;

  // Auto-generate batch serial numbers according to part number
  const handleAutoGenerateSerials = () => {
    if (!currentProduct) return;
    setErrorMessage(null);
    const dateCode = productionDate.replace(/-/g, '').slice(2);
    const prefix = currentProduct.partNumber.replace(/[^A-Z0-9]/gi, '').slice(0, 5).toUpperCase();
    const shiftCode = productionShift === 'Shift A' ? 'A' : productionShift === 'Shift B' ? 'B' : 'C';
    const timestamp = Date.now().toString().slice(-4);

    const generated: string[] = [];
    for (let i = 1; i <= capacity; i++) {
      const seq = String(i).padStart(3, '0');
      generated.push(`FG-${prefix}-${dateCode}-${shiftCode}${timestamp}-${seq}`);
    }

    playScanBeep(true);
    setSerials(generated);
  };

  // Add individual serial
  const handleAddSerial = (rawSerial: string) => {
    const serial = rawSerial.trim().toUpperCase();
    setErrorMessage(null);
    if (!serial) return;

    if (serials.includes(serial)) {
      playScanBeep(false);
      setErrorMessage(
        isGerman
          ? `Seriennummer "${serial}" ist bereits in dieser Kiste vorhanden.`
          : `Serial "${serial}" already scanned into this box.`
      );
      return;
    }

    if (serials.length >= capacity) {
      playScanBeep(false);
      setErrorMessage(
        isGerman
          ? `Kistenkapazität (${capacity} Stk.) bereits erreicht.`
          : `Box capacity (${capacity} units) already reached.`
      );
      return;
    }

    playScanBeep(true);
    setSerials((prev) => [...prev, serial]);
    setManualSerialInput('');
  };

  // Remove individual serial
  const handleRemoveSerial = (indexToRemove: number) => {
    setSerials((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Execute packing and sealing
  const handlePackAndSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!currentProduct) {
      setErrorMessage(isGerman ? 'Bitte wählen Sie ein Produkt.' : 'Please select a product.');
      return;
    }

    if (serials.length === 0) {
      setErrorMessage(
        isGerman
          ? 'Bitte scannen oder generieren Sie mindestens 1 Teil.'
          : 'Please scan or generate at least 1 finished good serial.'
      );
      return;
    }

    try {
      const newBox = packBox({
        productId: currentProduct.id,
        productionDate,
        productionShift,
        itemSerials: serials,
        packedBy: packedBy.trim() || 'Station Operator'
      });

      playScanBeep(true);
      onBoxCreated(newBox);
      onClose();
    } catch (err: unknown) {
      setErrorMessage((err as Error).message);
    }
  };

  return (
    <div
      id="quick-pack-box-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full my-6 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {isGerman ? 'Neue Mutterkiste schnell verpacken' : 'Quick Pack & Seal New Mother Box'}
              </h2>
              <p className="text-xs text-slate-400">
                {isGerman
                  ? 'Erstellen Sie eine verpackte Kiste direkt für den Versand'
                  : 'Pack items & register a new mother box directly for immediate dispatch'}
              </p>
            </div>
          </div>
          <button
            id="close-quick-pack-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handlePackAndSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Product Selection */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 block">
              {isGerman ? 'Produkt / Sachnummer:' : 'Product / Part Number:'}
            </label>
            <select
              id="quick-pack-product-select"
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                setSerials([]);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.partNumber}) — Std Pack: {p.boxCapacity} pcs
                </option>
              ))}
            </select>
          </div>

          {/* Date, Shift, Operator in responsive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{isGerman ? 'Fertigungsdatum' : 'Prod Date'}</span>
              </label>
              <input
                id="quick-pack-date-input"
                type="date"
                value={productionDate}
                onChange={(e) => setProductionDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{isGerman ? 'Schicht' : 'Shift'}</span>
              </label>
              <select
                id="quick-pack-shift-select"
                value={productionShift}
                onChange={(e) => setProductionShift(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              >
                <option value="Shift A">Shift A (Morning)</option>
                <option value="Shift B">Shift B (Evening)</option>
                <option value="Shift C">Shift C (Night)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>{isGerman ? 'Bediener' : 'Operator'}</span>
              </label>
              <input
                id="quick-pack-operator-input"
                type="text"
                value={packedBy}
                onChange={(e) => setPackedBy(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Serials Fill Station */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">
                  {isGerman ? 'Teile-Seriennummern' : 'Finished Goods Serials'}
                </span>
                <span className="text-[11px] text-slate-500">
                  {isGerman ? 'Gescannte Teile:' : 'Scanned items:'} {serials.length} / {capacity}
                </span>
              </div>

              {/* 1-Click Auto Generate Serials */}
              <button
                id="quick-pack-auto-gen-btn"
                type="button"
                onClick={handleAutoGenerateSerials}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>{isGerman ? 'Auto-Serien generieren' : 'Auto-Fill Serials'}</span>
              </button>
            </div>

            {/* Capacity Progress Bar */}
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isFull ? 'bg-emerald-500' : 'bg-blue-600'
                }`}
                style={{ width: `${Math.min(100, (serials.length / capacity) * 100)}%` }}
              />
            </div>

            {/* Scan or Type Individual Serial */}
            <div className="flex gap-2">
              <input
                id="quick-pack-serial-input"
                type="text"
                value={manualSerialInput}
                onChange={(e) => setManualSerialInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSerial(manualSerialInput);
                  }
                }}
                disabled={isFull}
                placeholder={
                  isFull
                    ? (isGerman ? 'Kiste voll' : 'Box full')
                    : (isGerman ? 'Teilenummer scannen / eingeben...' : 'Scan / enter FG serial number...')
                }
                className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden disabled:bg-slate-100"
              />
              <button
                id="quick-pack-add-serial-btn"
                type="button"
                onClick={() => handleAddSerial(manualSerialInput)}
                disabled={isFull || !manualSerialInput.trim()}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-lg font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isGerman ? 'Hinzufügen' : 'Add'}</span>
              </button>
              <button
                id="quick-pack-scan-btn"
                type="button"
                onClick={() => setIsScannerOpen(true)}
                disabled={isFull}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 text-blue-700 border border-blue-200 rounded-lg font-bold flex items-center gap-1"
              >
                <Scan className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isGerman ? 'Kamera' : 'Scan'}</span>
              </button>
            </div>

            {/* List of scanned serial tags */}
            {serials.length > 0 && (
              <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-white flex flex-wrap gap-1.5">
                {serials.map((s, idx) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md font-mono text-[10px] text-slate-700"
                  >
                    <span>{idx + 1}. {s}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSerial(idx)}
                      className="text-slate-400 hover:text-red-600 font-bold ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              id="quick-pack-cancel-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition-colors"
            >
              {isGerman ? 'Abbrechen' : 'Cancel'}
            </button>
            <button
              id="quick-pack-submit-btn"
              type="submit"
              disabled={serials.length === 0}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-bold flex items-center gap-2 shadow-xs transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isGerman
                  ? `Kiste versiegeln & hinzufügen (${serials.length} Stk.)`
                  : `Seal & Add Box (${serials.length} pcs)`}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* Scanner Modal for Camera */}
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(code) => handleAddSerial(code)}
        title={isGerman ? 'Teile-Barcode scannen' : 'Scan Part QR / Barcode'}
        subtitle={isGerman ? 'Scannen Sie Seriennummern für diese Kiste' : 'Scan serial numbers for this mother box'}
      />
    </div>
  );
};
