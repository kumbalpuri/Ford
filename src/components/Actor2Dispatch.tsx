import React, { useState } from 'react';
import { useTraceability } from '../context/TraceabilityContext';
import { useLanguage } from '../context/LanguageContext';
import { MotherBox, DispatchBatch, BOX_STATUS_CONFIG, BoxStatus } from '../types';
import { ScannerModal } from './ScannerModal';
import { PackingListModal } from './PackingListModal';
import { QuickPackBoxModal } from './QuickPackBoxModal';
import { AddBoxesToDispatchModal } from './AddBoxesToDispatchModal';
import { MobileScannerTerminal } from './MobileScannerTerminal';
import { playScanBeep } from '../utils/qrUtils';
import {
  Truck,
  Scan,
  CheckCircle,
  AlertCircle,
  FileText,
  Building,
  Calendar,
  Layers,
  FileCheck,
  Printer,
  Plus,
  ArrowRight,
  Sparkles,
  Table,
  Filter,
  Search,
  CheckCircle2,
  Boxes,
  Send,
  PlusCircle,
  PackagePlus,
  Smartphone
} from 'lucide-react';

export const Actor2Dispatch: React.FC = () => {
  const {
    boxes,
    customers,
    dispatches,
    dispatchBoxesFromFactory
  } = useTraceability();
  const { t, formatText, isGerman } = useLanguage();

  // View Mode: 'creation' vs 'history' (status-based tabular view)
  const [viewMode, setViewMode] = useState<'creation' | 'history'>('creation');

  // Modals for Quick Packing, Appending Boxes, & Mobile Scan Terminal
  const [isQuickPackOpen, setIsQuickPackOpen] = useState(false);
  const [targetAppendDispatch, setTargetAppendDispatch] = useState<DispatchBatch | null>(null);
  const [isMobileTerminalOpen, setIsMobileTerminalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_WAREHOUSE' | 'IN_TRANSIT' | 'DELIVERED'>('ALL');
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Dispatch parameters
  const [dispatchType, setDispatchType] = useState<'DIRECT_SALE' | 'SISTER_CONCERN'>('DIRECT_SALE');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(() => {
    const defaultCust = customers.find((c) => !c.isSisterConcern);
    return defaultCust?.id || customers[0]?.id || '';
  });
  const [invoiceNumber, setInvoiceNumber] = useState<string>('SAP-INV-99210');
  const [dispatchDate, setDispatchDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [vehicleNumber, setVehicleNumber] = useState<string>('MH-12-RN-8822');
  const [notes, setNotes] = useState<string>('OEM Scheduled Dispatch. Handle with care.');

  // Scanned / Selected boxes in this dispatch marriage
  const [selectedBoxIds, setSelectedBoxIds] = useState<string[]>([]);
  const [boxScanInput, setBoxScanInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [generatedDispatch, setGeneratedDispatch] = useState<DispatchBatch | null>(null);
  const [isPackingListOpen, setIsPackingListOpen] = useState(false);

  // Filter customers based on dispatch scenario
  const availableRecipients = customers.filter((c) =>
    dispatchType === 'DIRECT_SALE' ? !c.isSisterConcern : c.isSisterConcern
  );

  // Ready boxes in factory stock
  const readyBoxes = boxes.filter((b) => b.status === 'PACKED_IN_STOCK');
  const selectedBoxes = boxes.filter((b) => selectedBoxIds.includes(b.id));
  const totalUnitsInDispatch = selectedBoxes.reduce((acc, b) => acc + b.itemSerials.length, 0);

  // Status counts for tabular history
  const inWarehouseCount = boxes.filter((b) => b.status === 'PACKED_IN_STOCK').length;
  const inTransitCount = boxes.filter((b) => b.status === 'IN_TRANSIT_SISTER_CONCERN').length;
  const deliveredCount = boxes.filter((b) => b.status === 'DISPATCHED_DIRECT' || b.status === 'DISPATCHED_FINAL_CUSTOMER').length;

  // Filtered boxes for status-based tabular view
  const filteredBoxes = boxes.filter((box) => {
    if (statusFilter === 'IN_WAREHOUSE' && box.status !== 'PACKED_IN_STOCK') return false;
    if (statusFilter === 'IN_TRANSIT' && box.status !== 'IN_TRANSIT_SISTER_CONCERN') return false;
    if (statusFilter === 'DELIVERED' && box.status !== 'DISPATCHED_DIRECT' && box.status !== 'DISPATCHED_FINAL_CUSTOMER') return false;

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const matchId = box.id.toLowerCase().includes(q);
      const matchProd = box.productName.toLowerCase().includes(q) || box.partNumber.toLowerCase().includes(q);
      const matchInv = box.factoryInvoiceNumber?.toLowerCase().includes(q);
      const matchCust = box.initialRecipientName?.toLowerCase().includes(q);
      if (!matchId && !matchProd && !matchInv && !matchCust) return false;
    }
    return true;
  });

  // Handle Box Scan
  const handleScanBox = (rawBoxId: string) => {
    const boxId = rawBoxId.trim().toUpperCase();
    setErrorMessage(null);

    if (!boxId) return;

    if (selectedBoxIds.includes(boxId)) {
      playScanBeep(false);
      setErrorMessage(`Box ${boxId} is already added to this dispatch batch.`);
      return;
    }

    const box = boxes.find((b) => b.id === boxId);
    if (!box) {
      playScanBeep(false);
      setErrorMessage(`Mother Box "${boxId}" not found in system.`);
      return;
    }

    if (box.status !== 'PACKED_IN_STOCK') {
      playScanBeep(false);
      setErrorMessage(
        `Box ${boxId} is already in status "${box.status.replace(/_/g, ' ')}" and cannot be dispatched again.`
      );
      return;
    }

    playScanBeep(true);
    setSelectedBoxIds((prev) => [...prev, boxId]);
    setBoxScanInput('');
  };

  const handleToggleBoxSelection = (boxId: string) => {
    if (selectedBoxIds.includes(boxId)) {
      setSelectedBoxIds((prev) => prev.filter((id) => id !== boxId));
    } else {
      setSelectedBoxIds((prev) => [...prev, boxId]);
    }
  };

  // Execute Dispatch Marriage & Auto-generate Packing List
  const handleExecuteDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedCustomerId) {
      setErrorMessage('Please select a customer or sister concern.');
      return;
    }

    if (!invoiceNumber.trim()) {
      setErrorMessage('Please enter the SAP Invoice Number.');
      return;
    }

    if (selectedBoxIds.length === 0) {
      setErrorMessage('Please scan or select at least one box for dispatch marriage.');
      return;
    }

    try {
      const dispatch = dispatchBoxesFromFactory({
        invoiceNumber: invoiceNumber.trim().toUpperCase(),
        dispatchType,
        dispatchDate,
        customerId: selectedCustomerId,
        boxIds: selectedBoxIds,
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        notes,
        createdBy: 'Dispatch Person (Actor 2)'
      });

      setGeneratedDispatch(dispatch);
      setIsPackingListOpen(true);
      setSelectedBoxIds([]);
      // Prepare next invoice number
      setInvoiceNumber(`SAP-INV-${Math.floor(10000 + Math.random() * 90000)}`);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Station Header with View Mode Switcher */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-800">
                {t.actor2Badge}
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                {t.actor2Title}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {t.actor2Subtitle}
            </p>
          </div>
        </div>

        {/* View Mode Toggle: Creation vs Tabular History */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center gap-1">
            <button
              onClick={() => setViewMode('creation')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'creation'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isGerman ? 'Versand erstellen' : 'Create Dispatch'}</span>
            </button>
            <button
              onClick={() => setViewMode('history')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'history'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>{isGerman ? 'Status-Tabelle & Historie' : 'Status Tabular View'}</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-100 text-indigo-800">
                {boxes.length}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsMobileTerminalOpen(true)}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Handheld mobile scanner terminal"
          >
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>📱 Mobile / Tab Mode</span>
          </button>

          {viewMode === 'creation' && (
            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
            >
              <Scan className="w-4 h-4" />
              <span>Connect / Scan Mother Box</span>
            </button>
          )}
        </div>
      </div>

      {viewMode === 'creation' && (
        <div className="space-y-6">

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Dispatch Marriage Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleExecuteDispatch} className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-5">
            {/* Scenario Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                1. {t.actor2DispatchType}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setDispatchType('DIRECT_SALE');
                    const directCust = customers.find((c) => !c.isSisterConcern);
                    if (directCust) setSelectedCustomerId(directCust.id);
                  }}
                  className={`p-3 rounded-lg border text-left flex items-start gap-3 transition-all ${
                    dispatchType === 'DIRECT_SALE'
                      ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    dispatchType === 'DIRECT_SALE' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      {t.actor2TypeDirect}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Dispatched directly to OEM / Customer. Traceability lifecycle completes here.
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDispatchType('SISTER_CONCERN');
                    const scCust = customers.find((c) => c.isSisterConcern);
                    if (scCust) setSelectedCustomerId(scCust.id);
                  }}
                  className={`p-3 rounded-lg border text-left flex items-start gap-3 transition-all ${
                    dispatchType === 'SISTER_CONCERN'
                      ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    dispatchType === 'SISTER_CONCERN' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      {t.actor2TypeSister}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Transfer to German Sister Hub (Horizon Auto Sister Concern GmbH) for regional customer distribution.
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Marriage Fields: Customer & SAP Invoice */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                2. Customer & Invoicing Data
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {dispatchType === 'DIRECT_SALE' ? 'Direct OEM Customer *' : 'Sister Concern Unit / Plant *'}
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    {availableRecipients.length > 0 ? (
                      availableRecipients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.city})
                        </option>
                      ))
                    ) : (
                      <option value="">No matching recipients found in master</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    SAP Invoice Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="e.g. SAP-INV-99042"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Dispatch Date
                  </label>
                  <input
                    type="date"
                    value={dispatchDate}
                    onChange={(e) => setDispatchDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Vehicle Number / Transporter
                  </label>
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    placeholder="e.g. MH-12-RN-8822"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Mother Box Scanning Buffer */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  3. Scan Mother Boxes for this Invoice
                </label>
                <span className="text-xs font-mono font-bold text-indigo-700">
                  {selectedBoxIds.length} Boxes Selected ({totalUnitsInDispatch} Total FG Units)
                </span>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={boxScanInput}
                    onChange={(e) => setBoxScanInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleScanBox(boxScanInput);
                      }
                    }}
                    placeholder="Scan Mother Box QR (e.g. BOX-20260908-ALT-004) and press Enter..."
                    className="w-full pl-3 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900"
                  />
                  <Scan className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                </div>
                <button
                  type="button"
                  onClick={() => handleScanBox(boxScanInput)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shrink-0"
                >
                  Add Box
                </button>
              </div>

              {errorMessage && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-800">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Selected boxes table for this dispatch - Tabular Format */}
              {selectedBoxes.length > 0 ? (
                <div className="border border-indigo-200 rounded-lg overflow-hidden space-y-2 bg-indigo-50/20 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-indigo-950 uppercase">
                      Boxes Married to Current Dispatch ({selectedBoxes.length}):
                    </span>
                    <span className="text-[11px] font-mono text-indigo-700 font-bold">
                      {totalUnitsInDispatch} Total FG Units
                    </span>
                  </div>
                  <div className="border border-indigo-200 rounded-lg overflow-x-auto bg-white max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                      <thead className="bg-indigo-50/70 text-indigo-900 font-semibold border-b border-indigo-200 sticky top-0 z-10">
                        <tr>
                          <th className="py-2 px-3 w-10 text-center">#</th>
                          <th className="py-2 px-3 font-mono">Mother Box ID</th>
                          <th className="py-2 px-3">Product Name & Part No</th>
                          <th className="py-2 px-3 text-center">Qty (Pcs)</th>
                          <th className="py-2 px-3">Production Date</th>
                          <th className="py-2 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-indigo-100">
                        {selectedBoxes.map((box, index) => (
                          <tr key={box.id} className="hover:bg-indigo-50/40 transition-colors">
                            <td className="py-2 px-3 text-center font-bold text-slate-500">{index + 1}</td>
                            <td className="py-2 px-3 font-mono font-bold text-indigo-950">{box.id}</td>
                            <td className="py-2 px-3">
                              <span className="font-semibold text-slate-800">{box.productName}</span>
                              <span className="text-[11px] text-slate-500 font-mono ml-1.5">({box.partNumber})</span>
                            </td>
                            <td className="py-2 px-3 text-center font-bold text-indigo-800">{box.itemSerials.length}</td>
                            <td className="py-2 px-3 text-slate-600">{box.productionDate}</td>
                            <td className="py-2 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleToggleBoxSelection(box.id)}
                                className="text-xs text-red-600 hover:text-red-800 font-semibold hover:underline"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  No boxes added yet. Scan Mother QR above or check boxes from the available inventory table below.
                </p>
              )}
            </div>

            {/* Submission */}
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={selectedBoxIds.length === 0}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold shadow-md flex items-center gap-2 transition-colors"
              >
                <FileCheck className="w-4 h-4" />
                <span>Complete Marriage & Generate Auto Packing List PDF</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right / Bottom Column: Factory Stock & Dispatches in High-Density Tabular Format */}
        <div className="space-y-6">
          {/* Factory In-Stock Mother Boxes Table */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <span>Ready in Factory Stock</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    {readyBoxes.length} Available
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Select available boxes to marry with current invoice or scan barcode.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickPackOpen(true)}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors shadow-2xs"
                  title="Pack a new mother box on the fly"
                >
                  <PackagePlus className="w-3.5 h-3.5" />
                  <span>+ Quick Pack Box</span>
                </button>

                {readyBoxes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedBoxIds.length === readyBoxes.length) {
                        setSelectedBoxIds([]);
                      } else {
                        setSelectedBoxIds(readyBoxes.map(b => b.id));
                      }
                    }}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold transition-colors"
                  >
                    {selectedBoxIds.length === readyBoxes.length ? 'Deselect All' : `Select All (${readyBoxes.length})`}
                  </button>
                )}
              </div>
            </div>

            {readyBoxes.length === 0 ? (
              <div className="p-8 border-2 border-dashed border-slate-200 rounded-lg text-center text-xs text-slate-400 space-y-2">
                <p className="font-semibold text-slate-600">No boxes currently in factory stock</p>
                <p>Pack new finished goods boxes right now without switching tabs:</p>
                <button
                  type="button"
                  onClick={() => setIsQuickPackOpen(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-xs"
                >
                  <PackagePlus className="w-3.5 h-3.5" />
                  <span>Pack New Mother Box Now</span>
                </button>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[550px]">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">Select</th>
                      <th className="py-2.5 px-3 font-mono">Mother Box QR ID</th>
                      <th className="py-2.5 px-3">Product Name & Part No</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3">Packed Date</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {readyBoxes.map((box) => {
                      const isSelected = selectedBoxIds.includes(box.id);
                      return (
                        <tr
                          key={box.id}
                          onClick={() => handleToggleBoxSelection(box.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-indigo-50/80 hover:bg-indigo-50 font-medium' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 rounded text-indigo-600 pointer-events-none"
                            />
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {box.id}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-800">{box.productName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{box.partNumber}</div>
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-800 whitespace-nowrap">
                            {box.itemSerials.length} pcs
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                            {box.productionDate}
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <span
                              className={`text-[11px] font-bold ${
                                isSelected ? 'text-red-600 hover:text-red-800' : 'text-indigo-600 hover:text-indigo-800'
                              }`}
                            >
                              {isSelected ? 'Remove' : '+ Add Box'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Factory Dispatches Log - Tabular Format */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <span>Recent Factory Dispatches</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                  {dispatches.length} Logs
                </span>
              </h3>
              <span className="text-[11px] text-slate-400">SAP & Marriage Audit</span>
            </div>

            {dispatches.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4">
                No factory dispatches created yet.
              </p>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[620px]">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 font-mono">Invoice / Challan #</th>
                      <th className="py-2.5 px-3">Customer / Consignee</th>
                      <th className="py-2.5 px-3">Dispatch Nature</th>
                      <th className="py-2.5 px-3 text-center">Boxes</th>
                      <th className="py-2.5 px-3 text-center">Total Units</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Vehicle #</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {dispatches.map((disp) => (
                      <tr key={disp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-950 whitespace-nowrap">
                          {disp.invoiceNumber}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {disp.customerName}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            disp.dispatchType === 'DIRECT_SALE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {disp.dispatchType === 'DIRECT_SALE' ? 'Direct OEM Sale' : 'Sister Concern Hub'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-800 whitespace-nowrap">
                          {disp.boxIds.length} bxs
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-indigo-700 whitespace-nowrap">
                          {disp.boxIds.reduce((acc, id) => {
                            const b = boxes.find(bx => bx.id === id);
                            return acc + (b ? b.itemSerials.length : 0);
                          }, 0)} pcs
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                          {disp.dispatchDate}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {disp.vehicleNumber || 'Standard Freight'}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setTargetAppendDispatch(disp)}
                              className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 rounded text-[11px] font-bold flex items-center gap-1 transition-colors"
                              title="Append additional boxes to this dispatch invoice"
                            >
                              <PlusCircle className="w-3 h-3 text-indigo-600" />
                              <span>+ Add Boxes</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setGeneratedDispatch(disp);
                                setIsPackingListOpen(true);
                              }}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-[11px] font-bold flex items-center gap-1 transition-colors"
                            >
                              <Printer className="w-3 h-3 text-indigo-600" />
                              <span>Packing List</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
      )}

      {/* VIEW MODE 2: TABULAR HISTORY VIEW (STATUS-BASED) */}
      {viewMode === 'history' && (
        <div className="space-y-6">
          {/* Status-Based Filtering Bar */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Table className="w-4 h-4 text-indigo-600" />
                  <span>{isGerman ? 'Status-basierte Tabellenansicht' : 'Status-Based Tabular Traceability View'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Workflow: 1. In Warehouse &rarr; 2. In Transit / Delivered to Customer (Direct Sale) | Intercompany: In Transit &rarr; In Sister Concern Warehouse &rarr; In Transit / Delivered to Customer
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search Box ID, invoice, part #..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-2 flex-wrap border-t border-slate-100 pt-3">
              <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                <span>Filter Status:</span>
              </span>

              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Boxes ({boxes.length})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('IN_WAREHOUSE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  statusFilter === 'IN_WAREHOUSE'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>1st Status: In Warehouse ({inWarehouseCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('IN_TRANSIT')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  statusFilter === 'IN_TRANSIT'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Intercompany: In Transit ({inTransitCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('DELIVERED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  statusFilter === 'DELIVERED'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>2nd Status: Delivered / Final Customer ({deliveredCount})</span>
              </button>
            </div>
          </div>

          {/* Mother Boxes Tabular View */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <span>Mother Boxes Traceability Register</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                    {filteredBoxes.length} Boxes Listed
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  KSPG Automotive India Pvt. Ltd. (Takwe Plant) &bull; Live Status Audit
                </p>
              </div>

              <button
                type="button"
                onClick={() => setViewMode('creation')}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Dispatch Batch</span>
              </button>
            </div>

            {filteredBoxes.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-8">
                No boxes match the selected status filter.
              </p>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[860px]">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 font-mono">Box QR ID</th>
                      <th className="py-2.5 px-3">Part Details</th>
                      <th className="py-2.5 px-3 text-center">Items</th>
                      <th className="py-2.5 px-3">Pack Date</th>
                      <th className="py-2.5 px-3">Current Status</th>
                      <th className="py-2.5 px-3">Current Location</th>
                      <th className="py-2.5 px-3 font-mono">Invoice / Challan</th>
                      <th className="py-2.5 px-3">Recipient</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {filteredBoxes.map((box) => {
                      const statusConf = BOX_STATUS_CONFIG[box.status];
                      return (
                        <tr key={box.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-indigo-950 whitespace-nowrap">
                            {box.id}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-900">{box.productName}</div>
                            <div className="text-[10px] font-mono text-slate-500">PN: {box.partNumber}</div>
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-800 whitespace-nowrap">
                            {box.itemSerials.length} / {box.capacity}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                            {box.productionDate}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1.5 ${statusConf.badgeBg} ${statusConf.badgeText} ${statusConf.badgeBorder}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              <span>{statusConf.labelEn}</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                            {box.status === 'PACKED_IN_STOCK' ? (
                              <span className="text-emerald-700 font-medium">Takwe Warehouse</span>
                            ) : box.status === 'IN_TRANSIT_SISTER_CONCERN' ? (
                              <span className="text-amber-700 font-medium">In Transit (to Sister Concern)</span>
                            ) : box.status === 'RECEIVED_AT_SISTER_CONCERN' ? (
                              <span className="text-purple-700 font-medium">Sister Concern Warehouse</span>
                            ) : (
                              <span className="text-blue-700 font-medium">Delivered to Customer</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                            {box.factoryInvoiceNumber || (
                              <span className="text-slate-400 italic">Unassigned</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                            {box.initialRecipientName || (
                              <span className="text-slate-400 italic">Takwe Stock</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            {box.status === 'PACKED_IN_STOCK' ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setViewMode('creation');
                                  if (!selectedBoxIds.includes(box.id)) {
                                    setSelectedBoxIds((prev) => [...prev, box.id]);
                                  }
                                }}
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-[11px] font-bold transition-colors"
                              >
                                + Dispatch
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Dispatched</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Historical Dispatches Tabular View */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <span>Dispatch Batches & SAP Marriage History</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                  {dispatches.length} Batches
                </span>
              </h3>
              <span className="text-[11px] text-slate-400">VDA-Compliant Packing Logs</span>
            </div>

            {dispatches.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">
                No dispatch batches logged yet.
              </p>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 font-mono">Invoice / Challan #</th>
                      <th className="py-2.5 px-3">Consignee</th>
                      <th className="py-2.5 px-3">Dispatch Nature</th>
                      <th className="py-2.5 px-3 text-center">Boxes</th>
                      <th className="py-2.5 px-3 text-center">Total Units</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Vehicle #</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {dispatches.map((disp) => (
                      <tr key={disp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-950 whitespace-nowrap">
                          {disp.invoiceNumber}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {disp.customerName}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            disp.dispatchType === 'DIRECT_SALE'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {disp.dispatchType === 'DIRECT_SALE' ? 'Direct OEM Sale' : 'Sister Concern Hub'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-800 whitespace-nowrap">
                          {disp.boxIds.length} bxs
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-indigo-700 whitespace-nowrap">
                          {disp.boxIds.reduce((acc, id) => {
                            const b = boxes.find((bx) => bx.id === id);
                            return acc + (b ? b.itemSerials.length : 0);
                          }, 0)} pcs
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                          {disp.dispatchDate}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {disp.vehicleNumber || 'Standard Freight'}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setGeneratedDispatch(disp);
                              setIsPackingListOpen(true);
                            }}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-[11px] font-bold inline-flex items-center gap-1 transition-colors"
                          >
                            <Printer className="w-3 h-3 text-indigo-600" />
                            <span>Packing List</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Barcode / QR Scanner Modal */}
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(boxId) => handleScanBox(boxId)}
        title="Scan Mother Box QR Code"
        subtitle="For dispatch marriage with customer and SAP invoice"
        placeholder="BOX-YYYYMMDD-PART-XXX"
        suggestedValues={readyBoxes.map((b) => b.id)}
      />

      {/* Automated Packing List PDF / Print Modal */}
      <PackingListModal
        dispatch={generatedDispatch}
        boxes={boxes}
        isOpen={isPackingListOpen}
        onClose={() => setIsPackingListOpen(false)}
        isSisterConcernDispatch={false}
      />

      {/* Add More Boxes to Existing Dispatch Batch Modal */}
      <AddBoxesToDispatchModal
        isOpen={!!targetAppendDispatch}
        onClose={() => setTargetAppendDispatch(null)}
        factoryDispatch={targetAppendDispatch}
      />

      {/* Quick Single-Dialog Mother Box Packing Modal */}
      <QuickPackBoxModal
        isOpen={isQuickPackOpen}
        onClose={() => setIsQuickPackOpen(false)}
        onBoxCreated={(newBox) => {
          setSelectedBoxIds((prev) => [...prev, newBox.id]);
        }}
      />

      {/* Handheld Mobile Scanner Terminal */}
      <MobileScannerTerminal
        isOpen={isMobileTerminalOpen}
        onClose={() => setIsMobileTerminalOpen(false)}
        defaultMode="dispatch"
      />
    </div>
  );
};
