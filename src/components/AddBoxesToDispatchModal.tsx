import React, { useState } from 'react';
import { useTraceability } from '../context/TraceabilityContext';
import { useLanguage } from '../context/LanguageContext';
import { DispatchBatch, SisterConcernDispatchBatch, MotherBox } from '../types';
import { playScanBeep } from '../utils/qrUtils';
import {
  X,
  PlusCircle,
  PackagePlus,
  Truck,
  CheckCircle2,
  AlertCircle,
  Scan,
  Package,
  CheckSquare,
  Square
} from 'lucide-react';
import { QuickPackBoxModal } from './QuickPackBoxModal';
import { ScannerModal } from './ScannerModal';

interface AddBoxesToDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  factoryDispatch?: DispatchBatch | null;
  scDispatch?: SisterConcernDispatchBatch | null;
  onSuccess?: () => void;
}

export const AddBoxesToDispatchModal: React.FC<AddBoxesToDispatchModalProps> = ({
  isOpen,
  onClose,
  factoryDispatch,
  scDispatch,
  onSuccess
}) => {
  const {
    boxes,
    addBoxesToDispatchBatch,
    addBoxesToSisterConcernDispatch
  } = useTraceability();
  const { isGerman } = useLanguage();

  const [selectedBoxIds, setSelectedBoxIds] = useState<string[]>([]);
  const [scanInput, setScanInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isQuickPackOpen, setIsQuickPackOpen] = useState<boolean>(false);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);

  if (!isOpen || (!factoryDispatch && !scDispatch)) return null;

  const isFactory = !!factoryDispatch;
  const targetInvoice = isFactory ? factoryDispatch!.invoiceNumber : scDispatch!.scInvoiceNumber;
  const targetCustomer = isFactory ? factoryDispatch!.customerName : scDispatch!.finalCustomerName;
  const currentBoxIds = isFactory ? factoryDispatch!.boxIds : scDispatch!.boxIds;

  // Available boxes that can be added
  // For Factory: must be PACKED_IN_STOCK and not already in this dispatch
  // For Sister Concern: must be AT_SISTER_CONCERN and not already in this dispatch
  const availableBoxes = boxes.filter((b) => {
    if (currentBoxIds.includes(b.id)) return false;
    if (isFactory) {
      return b.status === 'PACKED_IN_STOCK';
    } else {
      return b.status === 'AT_SISTER_CONCERN';
    }
  });

  const selectedBoxes = boxes.filter((b) => selectedBoxIds.includes(b.id));
  const newUnitsCount = selectedBoxes.reduce((acc, b) => acc + b.itemSerials.length, 0);

  const toggleSelectBox = (boxId: string) => {
    setErrorMessage(null);
    if (selectedBoxIds.includes(boxId)) {
      setSelectedBoxIds((prev) => prev.filter((id) => id !== boxId));
    } else {
      setSelectedBoxIds((prev) => [...prev, boxId]);
    }
  };

  const handleScanBox = (rawId: string) => {
    const boxId = rawId.trim().toUpperCase();
    setErrorMessage(null);
    if (!boxId) return;

    if (currentBoxIds.includes(boxId)) {
      playScanBeep(false);
      setErrorMessage(
        isGerman
          ? `Kiste "${boxId}" ist bereits in diesem Lieferschein enthalten.`
          : `Box "${boxId}" is already in this dispatch batch.`
      );
      return;
    }

    if (selectedBoxIds.includes(boxId)) {
      playScanBeep(false);
      setErrorMessage(
        isGerman
          ? `Kiste "${boxId}" ist bereits ausgewählt.`
          : `Box "${boxId}" is already selected.`
      );
      return;
    }

    const box = boxes.find((b) => b.id === boxId);
    if (!box) {
      playScanBeep(false);
      setErrorMessage(
        isGerman
          ? `Kiste "${boxId}" im System nicht gefunden.`
          : `Box "${boxId}" not found in system.`
      );
      return;
    }

    if (isFactory && box.status !== 'PACKED_IN_STOCK') {
      playScanBeep(false);
      setErrorMessage(
        isGerman
          ? `Kiste befindet sich nicht im Werk-Lager (Status: ${box.status}).`
          : `Box is not in factory warehouse (status: ${box.status}).`
      );
      return;
    }

    if (!isFactory && box.status !== 'AT_SISTER_CONCERN') {
      playScanBeep(false);
      setErrorMessage(
        isGerman
          ? `Kiste befindet sich nicht im Lager der Schwestergesellschaft (Status: ${box.status}).`
          : `Box is not in Sister Concern warehouse (status: ${box.status}).`
      );
      return;
    }

    playScanBeep(true);
    setSelectedBoxIds((prev) => [...prev, boxId]);
    setScanInput('');
  };

  const handleAppendConfirm = () => {
    setErrorMessage(null);
    if (selectedBoxIds.length === 0) {
      setErrorMessage(
        isGerman
          ? 'Bitte wählen oder scannen Sie mindestens 1 Kiste aus.'
          : 'Please select or scan at least one box to append.'
      );
      return;
    }

    try {
      if (isFactory && factoryDispatch) {
        addBoxesToDispatchBatch({
          dispatchId: factoryDispatch.id,
          boxIds: selectedBoxIds,
          addedBy: 'Dispatch Officer'
        });
      } else if (!isFactory && scDispatch) {
        addBoxesToSisterConcernDispatch({
          scDispatchId: scDispatch.id,
          boxIds: selectedBoxIds,
          addedBy: 'Sister Unit Store Person'
        });
      }

      playScanBeep(true);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMessage((err as Error).message);
    }
  };

  const handleNewBoxPacked = (newBox: MotherBox) => {
    setSelectedBoxIds((prev) => [...prev, newBox.id]);
  };

  return (
    <div
      id="add-boxes-to-dispatch-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full my-6 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {isGerman
                  ? `Kisten zu Lieferschein ${targetInvoice} hinzufügen`
                  : `Add More Boxes to Dispatch ${targetInvoice}`}
              </h2>
              <p className="text-xs text-slate-400">
                {isGerman
                  ? `Empfänger: ${targetCustomer} · Aktuell: ${currentBoxIds.length} Kisten`
                  : `Customer: ${targetCustomer} · Current: ${currentBoxIds.length} boxes`}
              </p>
            </div>
          </div>
          <button
            id="close-add-boxes-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quick Scan Input & Quick Pack Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1 flex gap-1.5">
              <input
                id="add-boxes-scan-input"
                type="text"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleScanBox(scanInput);
                  }
                }}
                placeholder={
                  isGerman
                    ? 'Kisten-ID scannen (z.B. BOX-2026...)...'
                    : 'Scan or type Mother Box ID...'
                }
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
              <button
                id="add-boxes-scan-btn"
                type="button"
                onClick={() => handleScanBox(scanInput)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold"
              >
                {isGerman ? 'Scan' : 'Add'}
              </button>
              <button
                id="add-boxes-camera-btn"
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-bold flex items-center gap-1"
                title="Open Camera Scanner"
              >
                <Scan className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isGerman ? 'Kamera' : 'Camera'}</span>
              </button>
            </div>

            {/* If Factory, allow packing a brand new box on the fly! */}
            {isFactory && (
              <button
                id="open-quick-pack-from-append-btn"
                type="button"
                onClick={() => setIsQuickPackOpen(true)}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors shrink-0"
              >
                <PackagePlus className="w-3.5 h-3.5" />
                <span>{isGerman ? '+ Neue Kiste packen' : '+ Quick Pack New Box'}</span>
              </button>
            )}
          </div>

          {/* Current Selection summary */}
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-bold text-indigo-950 block">
                {isGerman ? 'Neu hinzuzufügende Kisten:' : 'Boxes being appended:'} {selectedBoxIds.length}
              </span>
              <span className="text-[11px] text-indigo-700">
                {isGerman ? 'Zusätzliche Einheiten:' : 'Additional units:'} +{newUnitsCount} pcs
                (Total nach Update: {currentBoxIds.length + selectedBoxIds.length} Kisten)
              </span>
            </div>
            {selectedBoxIds.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedBoxIds([])}
                className="text-[11px] text-indigo-700 hover:text-indigo-900 font-bold underline"
              >
                {isGerman ? 'Auswahl aufheben' : 'Clear selection'}
              </button>
            )}
          </div>

          {/* Available Boxes Selection List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-slate-600">
              <span className="font-bold text-slate-800">
                {isGerman ? 'Verfügbare Kisten im Lager' : 'Available Warehouse Boxes'} ({availableBoxes.length})
              </span>
              {availableBoxes.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const allIds = availableBoxes.map((b) => b.id);
                    setSelectedBoxIds(allIds);
                  }}
                  className="text-indigo-600 hover:underline font-semibold text-[11px]"
                >
                  {isGerman ? 'Alle verfügbaren auswählen' : 'Select All Available'}
                </button>
              )}
            </div>

            {availableBoxes.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400 space-y-2">
                <Package className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-semibold text-slate-600">
                  {isGerman
                    ? 'Keine weiteren Kisten im Lager verfügbar.'
                    : 'No additional boxes currently available in warehouse.'}
                </p>
                {isFactory && (
                  <button
                    type="button"
                    onClick={() => setIsQuickPackOpen(true)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold inline-flex items-center gap-1 text-xs"
                  >
                    <PackagePlus className="w-3.5 h-3.5" />
                    <span>{isGerman ? 'Jetzt neue Kiste verpacken' : 'Pack a New Box Now'}</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                {availableBoxes.map((box) => {
                  const isChecked = selectedBoxIds.includes(box.id);
                  return (
                    <div
                      key={box.id}
                      onClick={() => toggleSelectBox(box.id)}
                      className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                        isChecked ? 'bg-indigo-50/50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="text-indigo-600 focus:outline-hidden"
                          aria-label="Toggle select box"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </button>
                        <div>
                          <div className="font-mono font-bold text-slate-900">{box.id}</div>
                          <div className="text-[11px] text-slate-500">
                            {box.productName} ({box.partNumber})
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-800">
                          {box.itemSerials.length} pcs
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          {box.productionDate}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            id="cancel-add-boxes-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg font-bold transition-colors"
          >
            {isGerman ? 'Abbrechen' : 'Cancel'}
          </button>
          <button
            id="confirm-add-boxes-btn"
            type="button"
            onClick={handleAppendConfirm}
            disabled={selectedBoxIds.length === 0}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-bold flex items-center gap-2 shadow-xs transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {isGerman
                ? `${selectedBoxIds.length} Kiste(n) zu ${targetInvoice} hinzufügen`
                : `Append ${selectedBoxIds.length} Box(es) to ${targetInvoice}`}
            </span>
          </button>
        </div>
      </div>

      {/* Quick Pack Modal if needed */}
      <QuickPackBoxModal
        isOpen={isQuickPackOpen}
        onClose={() => setIsQuickPackOpen(false)}
        onBoxCreated={handleNewBoxPacked}
      />

      {/* Barcode Scanner Modal */}
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(code) => handleScanBox(code)}
        title={isGerman ? 'Mutterkiste einscannen' : 'Scan Mother Box'}
        subtitle={isGerman ? 'Scannen Sie Kisten-QRs zum Hinzufügen' : 'Scan box QR to append to dispatch'}
      />
    </div>
  );
};
