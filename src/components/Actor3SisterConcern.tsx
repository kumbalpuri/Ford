import React, { useState } from 'react';
import { useTraceability } from '../context/TraceabilityContext';
import { useLanguage } from '../context/LanguageContext';
import { MotherBox, SisterConcernDispatchBatch, BOX_STATUS_CONFIG } from '../types';
import { ScannerModal } from './ScannerModal';
import { PackingListModal } from './PackingListModal';
import { AddBoxesToDispatchModal } from './AddBoxesToDispatchModal';
import { MobileScannerTerminal } from './MobileScannerTerminal';
import { playScanBeep } from '../utils/qrUtils';
import {
  Building2,
  Scan,
  CheckCircle,
  AlertCircle,
  FileText,
  Printer,
  FileCheck,
  Calendar,
  Layers,
  Building,
  User,
  Package,
  Globe,
  Languages,
  Truck,
  ShieldCheck,
  Table,
  Filter,
  Search,
  ArrowDownToLine,
  Send,
  Plus,
  PlusCircle,
  Smartphone
} from 'lucide-react';

export const Actor3SisterConcern: React.FC = () => {
  const {
    boxes,
    customers,
    scDispatches,
    dispatchBoxesFromSisterConcern,
    receiveBoxesAtSisterConcern
  } = useTraceability();

  const { language, setLanguage, t, formatText, isGerman } = useLanguage();

  // Modals for Appending Boxes and Mobile Handheld Terminal
  const [targetAppendScDispatch, setTargetAppendScDispatch] = useState<SisterConcernDispatchBatch | null>(null);
  const [isMobileTerminalOpen, setIsMobileTerminalOpen] = useState(false);

  // View Mode: creation vs history tabular view
  const [viewMode, setViewMode] = useState<'creation' | 'history'>('creation');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_TRANSIT' | 'IN_WAREHOUSE' | 'DELIVERED'>('ALL');
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Inventory in transit and at Sister Concern
  const inTransitBoxes = boxes.filter((b) => b.status === 'IN_TRANSIT_SISTER_CONCERN');
  const availableSisterConcernBoxes = boxes.filter((b) => b.status === 'AT_SISTER_CONCERN');
  const scDeliveredBoxes = boxes.filter((b) => b.status === 'DISPATCHED_FINAL_CUSTOMER');

  // Customer targets (Direct customers, excluding sister concern themselves)
  const finalCustomers = customers.filter((c) => !c.isSisterConcern);

  // Dispatch parameters
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(finalCustomers[0]?.id || '');
  const [scInvoiceNumber, setScInvoiceNumber] = useState<string>('SC-INV-2026-9901');
  const [dispatchDate, setDispatchDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [vehicleNumber, setVehicleNumber] = useState<string>('KA-04-E-7890');
  const [notes, setNotes] = useState<string>(
    isGerman
      ? 'Warenausgang aus regionalem Distributionszentrum der Schwestergesellschaft an OEM-Endkunden'
      : 'Dispatched from Regional Sister Concern Hub to Final OEM Customer'
  );

  // Selected boxes to dispatch
  const [selectedBoxIds, setSelectedBoxIds] = useState<string[]>([]);
  const [boxScanInput, setBoxScanInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [generatedDispatch, setGeneratedDispatch] = useState<SisterConcernDispatchBatch | null>(null);
  const [isPackingListOpen, setIsPackingListOpen] = useState(false);

  const selectedBoxes = boxes.filter((b) => selectedBoxIds.includes(b.id));
  const totalUnits = selectedBoxes.reduce((acc, b) => acc + b.itemSerials.length, 0);

  // Intercompany related boxes
  const intercompanyBoxes = boxes.filter(
    (b) =>
      b.dispatchType === 'SISTER_CONCERN' ||
      b.status === 'IN_TRANSIT_SISTER_CONCERN' ||
      b.status === 'AT_SISTER_CONCERN' ||
      b.status === 'DISPATCHED_FINAL_CUSTOMER'
  );

  // Filtered list for tabular history view
  const displayBoxes = intercompanyBoxes.length > 0 ? intercompanyBoxes : boxes;
  const filteredBoxes = displayBoxes.filter((box) => {
    if (statusFilter === 'IN_TRANSIT' && box.status !== 'IN_TRANSIT_SISTER_CONCERN') return false;
    if (statusFilter === 'IN_WAREHOUSE' && box.status !== 'AT_SISTER_CONCERN') return false;
    if (statusFilter === 'DELIVERED' && box.status !== 'DISPATCHED_FINAL_CUSTOMER') return false;

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const matchId = box.id.toLowerCase().includes(q);
      const matchProd = box.productName.toLowerCase().includes(q) || box.partNumber.toLowerCase().includes(q);
      const matchInv = box.factoryInvoiceNumber?.toLowerCase().includes(q);
      if (!matchId && !matchProd && !matchInv) return false;
    }
    return true;
  });

  // Handle Sister Concern Inward Intake Scan (Moves In Transit -> In Warehouse of Sister Concern)
  const handleIntakeReceiveBox = (boxId: string) => {
    receiveBoxesAtSisterConcern([boxId], isGerman ? 'Wareneingang Schwestergesellschaft' : 'Sister Concern Inward Store');
    playScanBeep(true);
  };

  // Handle Box Scan
  const handleScanBox = (rawBoxId: string) => {
    const boxId = rawBoxId.trim().toUpperCase();
    setErrorMessage(null);

    if (!boxId) return;

    const box = boxes.find((b) => b.id === boxId);
    if (!box) {
      playScanBeep(false);
      setErrorMessage(formatText(t.actor3BoxNotFound, { id: boxId }));
      return;
    }

    // If box is in transit to Sister Concern, scanning it receives it into Sister Concern Warehouse
    if (box.status === 'IN_TRANSIT_SISTER_CONCERN') {
      handleIntakeReceiveBox(boxId);
      setBoxScanInput('');
      return;
    }

    if (box.status !== 'AT_SISTER_CONCERN') {
      playScanBeep(false);
      setErrorMessage(formatText(t.actor3BoxNotAtSisterConcern, { id: boxId, status: box.status.replace(/_/g, ' ') }));
      return;
    }

    if (selectedBoxIds.includes(boxId)) {
      playScanBeep(false);
      setErrorMessage(formatText(t.actor3BoxAlreadyAdded, { id: boxId }));
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

  // Submit dispatch
  const handleExecuteDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedCustomerId) {
      setErrorMessage(t.actor3SelectCustomerError);
      return;
    }

    if (!scInvoiceNumber.trim()) {
      setErrorMessage(t.actor3EnterInvoiceError);
      return;
    }

    if (selectedBoxIds.length === 0) {
      setErrorMessage(t.actor3SelectBoxesError);
      return;
    }

    try {
      const dispatch = dispatchBoxesFromSisterConcern({
        scInvoiceNumber: scInvoiceNumber.trim().toUpperCase(),
        dispatchDate,
        finalCustomerId: selectedCustomerId,
        boxIds: selectedBoxIds,
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        notes,
        createdBy: isGerman
          ? 'Logistikleiter Schwestergesellschaft (DE-Hub)'
          : 'Sister Concern Store Person (Actor 3)'
      });

      setGeneratedDispatch(dispatch);
      setIsPackingListOpen(true);
      setSelectedBoxIds([]);
      setScInvoiceNumber(`SC-INV-2026-${Math.floor(1000 + Math.random() * 9000)}`);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Station Header with German / Sister Concern Focus */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800">
                {t.actor3Badge}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                <span>🇩🇪</span>
                <span>DE-Hub / Schwestergesellschaft</span>
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                {t.actor3Title}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {t.actor3Subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View Mode Toggle */}
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center gap-1">
            <button
              onClick={() => setViewMode('creation')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'creation'
                  ? 'bg-white text-purple-700 shadow-xs border border-slate-200'
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
                  ? 'bg-white text-purple-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>{isGerman ? 'Status-Tabelle' : 'Status Tabular View'}</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-800">
                {displayBoxes.length}
              </span>
            </button>
          </div>

          {/* Quick Dual Language Toggle specifically highlighted for Sister Concern */}
          <div className="flex items-center bg-purple-50 border border-purple-200 rounded-lg p-1 text-xs">
            <span className="text-purple-900 font-semibold px-2 flex items-center gap-1 text-[11px]">
              <Languages className="w-3.5 h-3.5 text-purple-700" />
              <span className="hidden sm:inline">{t.actor3LangIndicator}</span>
            </span>
            <button
              onClick={() => setLanguage('de')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 ${
                language === 'de'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-purple-800 hover:bg-purple-100'
              }`}
              title="Auf Deutsch umschalten (Speziell für Schwestergesellschaft)"
            >
              <span>🇩🇪 Deutsch</span>
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 ${
                language === 'en'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-purple-800 hover:bg-purple-100'
              }`}
              title="Switch to English"
            >
              <span>🇬🇧 English</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsMobileTerminalOpen(true)}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Handheld mobile scanner terminal"
          >
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>{isGerman ? '📱 Mobil / Tablet Modus' : '📱 Mobile / Tab Mode'}</span>
          </button>

          {viewMode === 'creation' && (
            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors shrink-0"
            >
              <Scan className="w-4 h-4" />
              <span>{t.actor3ConnectScanner}</span>
            </button>
          )}
        </div>
      </div>

      {viewMode === 'creation' && (
        <div className="space-y-6">

      {/* German Logistics Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-xl p-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wide text-amber-300">
                {isGerman ? 'Niederlassung Deutschland • Logistik- & Distributionszentrum' : 'Sister Concern Regional Hub (DE / European Logistics)'}
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                VDA 4913 / IATF 16949
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {isGerman
                ? 'Lückenlose Rückverfolgbarkeit für Zwischenlagerung, Neu-Kommissionierung und Kundenauslieferung an Automobil-Erstausrüster (OEM).'
                : 'Automated intercompany store: Inward factory reception, OEM consignment assignment, and German/English packing list generation.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs shrink-0 self-end sm:self-center">
          <span className="text-slate-300 text-[11px]">
            {isGerman ? 'Aktiver Bestand:' : 'Hub Stock:'}
          </span>
          <span className="px-2 py-1 bg-white/20 text-white font-mono font-bold rounded">
            {availableSisterConcernBoxes.length} {isGerman ? 'Mutterkisten' : 'Boxes'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Sister Concern Customer Dispatch Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleExecuteDispatch} className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <span>{t.actor3Section1Title}</span>
              {isGerman && (
                <span className="text-[10px] font-normal text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                  (Lieferschein nach VDA-Standard)
                </span>
              )}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t.actor3FinalCustomerLabel}
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                >
                  {finalCustomers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t.actor3InvoiceNumberLabel}
                </label>
                <input
                  type="text"
                  required
                  value={scInvoiceNumber}
                  onChange={(e) => setScInvoiceNumber(e.target.value)}
                  placeholder={t.actor3InvoicePlaceholder}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t.actor3DispatchDateLabel}
                </label>
                <input
                  type="date"
                  value={dispatchDate}
                  onChange={(e) => setDispatchDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t.actor3VehicleLabel}
                </label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder={t.actor3VehiclePlaceholder}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  {t.actor3NotesLabel}
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t.actor3NotesPlaceholder}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Mother Box Scanning & Selection */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  {t.actor3Section2Title}
                </label>
                <span className="text-xs font-mono font-bold text-purple-700">
                  {formatText(t.actor3BoxesSelectedInfo, {
                    count: selectedBoxIds.length,
                    units: totalUnits
                  })}
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
                    placeholder={t.actor3ScanBoxPlaceholder}
                    className="w-full pl-3 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-purple-500 font-mono text-slate-900"
                  />
                  <Scan className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                </div>
                <button
                  type="button"
                  onClick={() => handleScanBox(boxScanInput)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-colors shrink-0"
                >
                  {t.actor3AddBoxBtn}
                </button>
              </div>

              {errorMessage && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-800">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Selected boxes table - Tabular Format */}
              {selectedBoxes.length > 0 ? (
                <div className="border border-purple-200 rounded-lg overflow-hidden space-y-2 bg-purple-50/20 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-purple-950 uppercase">
                      {isGerman
                        ? `Für Endkunden-Warenausgang ausgewählte Kisten (${selectedBoxes.length}):`
                        : `Boxes Ready for Final Customer Dispatch (${selectedBoxes.length}):`}
                    </span>
                    <span className="text-[11px] font-mono text-purple-800 font-bold">
                      {totalUnits} {isGerman ? 'Stück Gesamt' : 'Total Units'}
                    </span>
                  </div>
                  <div className="border border-purple-200 rounded-lg overflow-x-auto bg-white max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                      <thead className="bg-purple-50/70 text-purple-900 font-semibold border-b border-purple-200 sticky top-0 z-10">
                        <tr>
                          <th className="py-2 px-3 w-10 text-center">#</th>
                          <th className="py-2 px-3 font-mono">
                            {isGerman ? 'Mutterkisten-ID' : 'Mother Box ID'}
                          </th>
                          <th className="py-2 px-3">
                            {isGerman ? 'Produkt & Sachnr.' : 'Product & Part No'}
                          </th>
                          <th className="py-2 px-3 text-center">
                            {isGerman ? 'Menge' : 'Qty'}
                          </th>
                          <th className="py-2 px-3">
                            {isGerman ? 'Werksrechnung' : 'Factory Ref'}
                          </th>
                          <th className="py-2 px-3 text-right">
                            {isGerman ? 'Aktion' : 'Action'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-100">
                        {selectedBoxes.map((box, index) => (
                          <tr key={box.id} className="hover:bg-purple-50/40 transition-colors">
                            <td className="py-2 px-3 text-center font-bold text-slate-500">{index + 1}</td>
                            <td className="py-2 px-3 font-mono font-bold text-purple-950">{box.id}</td>
                            <td className="py-2 px-3">
                              <span className="font-semibold text-slate-800">{box.productName}</span>
                              <span className="text-[11px] text-slate-500 font-mono ml-1.5">({box.partNumber})</span>
                            </td>
                            <td className="py-2 px-3 text-center font-bold text-purple-800">
                              {box.itemSerials.length} {isGerman ? 'Stk.' : 'pcs'}
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-600">
                              {box.factoryInvoiceNumber || 'DIRECT'}
                            </td>
                            <td className="py-2 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleToggleBoxSelection(box.id)}
                                className="text-xs text-red-600 hover:text-red-800 font-semibold hover:underline"
                              >
                                {isGerman ? 'Entfernen' : 'Remove'}
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
                  {isGerman
                    ? 'Scannen Sie eine Mutterkiste oder wählen Sie diese aus dem Lagerbestand unten aus.'
                    : 'Scan Mother Box or select from Sister Concern Inventory below.'}
                </p>
              )}
            </div>

            {/* Submit */}
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={selectedBoxIds.length === 0}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold shadow-md flex items-center gap-2 transition-colors"
              >
                <FileCheck className="w-4 h-4" />
                <span>{t.actor3ExecuteDispatchBtn}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right / Bottom Column: Sister Concern Stock & Historical SC Dispatches Tabular Format */}
        <div className="space-y-6">
          {/* Sister Concern Stock Table */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <span>
                    {isGerman ? 'Lagerbestand Schwestergesellschaft' : 'Sister Concern Inventory'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                    {availableSisterConcernBoxes.length} {isGerman ? 'Kisten' : 'Boxes'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  {isGerman
                    ? 'Aus dem Werk eingegangene Ware für deutsche & europäische Kunden'
                    : 'Factory delivered goods staged for European OEM dispatches.'}
                </p>
              </div>

              {availableSisterConcernBoxes.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (selectedBoxIds.length === availableSisterConcernBoxes.length) {
                      setSelectedBoxIds([]);
                    } else {
                      setSelectedBoxIds(availableSisterConcernBoxes.map(b => b.id));
                    }
                  }}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold transition-colors"
                >
                  {selectedBoxIds.length === availableSisterConcernBoxes.length
                    ? (isGerman ? 'Alle abwählen' : 'Deselect All')
                    : (isGerman ? `Alle auswählen (${availableSisterConcernBoxes.length})` : `Select All (${availableSisterConcernBoxes.length})`)}
                </button>
              )}
            </div>

            {availableSisterConcernBoxes.length === 0 ? (
              <div className="p-8 border-2 border-dashed border-slate-200 rounded-lg text-center text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-slate-600">{t.actor3NoStockMsg}</p>
                <p>{t.actor3NoStockSub}</p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[550px]">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">
                        {isGerman ? 'Auswahl' : 'Select'}
                      </th>
                      <th className="py-2.5 px-3 font-mono">
                        {isGerman ? 'Mutterkisten-ID' : 'Mother Box ID'}
                      </th>
                      <th className="py-2.5 px-3">
                        {isGerman ? 'Produktbezeichnung & Sachnr.' : 'Product & Part No'}
                      </th>
                      <th className="py-2.5 px-3 text-center">
                        {isGerman ? 'Menge' : 'Qty'}
                      </th>
                      <th className="py-2.5 px-3">
                        {isGerman ? 'Werksrechnung' : 'Factory Ref'}
                      </th>
                      <th className="py-2.5 px-3 text-right">
                        {isGerman ? 'Aktion' : 'Action'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {availableSisterConcernBoxes.map((box) => {
                      const isSelected = selectedBoxIds.includes(box.id);
                      return (
                        <tr
                          key={box.id}
                          onClick={() => handleToggleBoxSelection(box.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-purple-50/80 hover:bg-purple-50 font-medium' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 rounded text-purple-600 pointer-events-none"
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
                            {box.itemSerials.length} {isGerman ? 'Stk.' : 'pcs'}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                            {box.factoryInvoiceNumber || 'INV-FACTORY'}
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <span
                              className={`text-[11px] font-bold ${
                                isSelected ? 'text-red-600 hover:text-red-800' : 'text-purple-600 hover:text-purple-800'
                              }`}
                            >
                              {isSelected ? (isGerman ? 'Entfernen' : 'Remove') : (isGerman ? '+ Auswählen' : '+ Add Box')}
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

          {/* Sister Concern Historical Dispatches - Tabular Format */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <span>
                  {isGerman
                    ? `Warenausgänge der Schwestergesellschaft`
                    : `Dispatches from Sister Concern`}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                  {scDispatches.length} Logs
                </span>
              </h3>
              <span className="text-[11px] text-slate-400">
                {isGerman ? 'VDA 4912 / 4939 Archiv' : 'VDA Audit Trail'}
              </span>
            </div>

            {scDispatches.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4">
                {t.actor3NoDispatchesYet}
              </p>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[620px]">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 font-mono">
                        {isGerman ? 'Lieferschein-Nr.' : 'Delivery Note #'}
                      </th>
                      <th className="py-2.5 px-3">
                        {isGerman ? 'Endkunde / Empfänger' : 'Final OEM Customer'}
                      </th>
                      <th className="py-2.5 px-3 text-center">
                        {isGerman ? 'Kisten' : 'Boxes'}
                      </th>
                      <th className="py-2.5 px-3 text-center">
                        {isGerman ? 'Gesamtmenge' : 'Total Units'}
                      </th>
                      <th className="py-2.5 px-3">
                        {isGerman ? 'Versanddatum' : 'Dispatch Date'}
                      </th>
                      <th className="py-2.5 px-3">
                        {isGerman ? 'Spedition / LKW' : 'Vehicle'}
                      </th>
                      <th className="py-2.5 px-3 text-right">
                        {isGerman ? 'Aktionen' : 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {scDispatches.map((disp) => (
                      <tr key={disp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-purple-950 whitespace-nowrap">
                          {disp.scInvoiceNumber}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {disp.finalCustomerName}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-800 whitespace-nowrap">
                          {disp.boxIds.length} {isGerman ? 'Kisten' : 'bxs'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-purple-700 whitespace-nowrap">
                          {disp.boxIds.reduce((acc, id) => {
                            const b = boxes.find(bx => bx.id === id);
                            return acc + (b ? b.itemSerials.length : 0);
                          }, 0)} {isGerman ? 'Stk.' : 'pcs'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                          {disp.dispatchDate}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {disp.vehicleNumber || (isGerman ? 'Spedition Schenker' : 'Standard')}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setTargetAppendScDispatch(disp)}
                              className="px-2 py-1 bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 border border-slate-200 rounded text-[11px] font-bold flex items-center gap-1 transition-colors"
                              title={isGerman ? 'Weitere Kisten zu diesem Lieferschein hinzufügen' : 'Add more boxes to this delivery note'}
                            >
                              <PlusCircle className="w-3 h-3 text-purple-600" />
                              <span>{isGerman ? '+ Kisten' : '+ Add Boxes'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setGeneratedDispatch(disp);
                                setIsPackingListOpen(true);
                              }}
                              className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded text-[11px] font-bold flex items-center gap-1 transition-colors"
                            >
                              <Printer className="w-3 h-3 text-purple-600" />
                              <span>{t.actor3ViewPackingListBtn}</span>
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

      {/* History / Status Tabular View */}
      {viewMode === 'history' && (
        <div className="space-y-6">
          {/* Status-Based Filtering Header */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Table className="w-4 h-4 text-purple-600" />
                  <span>
                    {isGerman
                      ? 'Status-Register der Schwestergesellschaft (Tabellenansicht)'
                      : 'Sister Concern Status Register (Tabular View)'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isGerman
                    ? 'Lückenlose Übersicht nach Status: Im Transit → Im Lager der Schwestergesellschaft → Im Transit / Beim Kunden'
                    : 'End-to-end status progression: In Transit → In Warehouse of Sister Concern → In Transit / Delivered to Customer'}
                </p>
              </div>

              {/* Search input */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder={isGerman ? 'Kisten-ID, Sachnr., Rechnung...' : 'Search Box ID, Part, Invoice...'}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500 font-semibold mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                <span>{isGerman ? 'Status-Filter:' : 'Filter Status:'}</span>
              </span>

              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  statusFilter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {isGerman ? 'Alle anzeigen' : 'All Boxes'} ({displayBoxes.length})
              </button>

              <button
                onClick={() => setStatusFilter('IN_TRANSIT')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  statusFilter === 'IN_TRANSIT'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>{isGerman ? '1. Im Transit vom Werk' : '1. In Transit from Factory'}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === 'IN_TRANSIT' ? 'bg-amber-700 text-white' : 'bg-amber-200 text-amber-900'}`}>
                  {inTransitBoxes.length}
                </span>
              </button>

              <button
                onClick={() => setStatusFilter('IN_WAREHOUSE')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  statusFilter === 'IN_WAREHOUSE'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>{isGerman ? '2. Im Lager der Schwestergesellschaft' : '2. In Warehouse of Sister Concern'}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === 'IN_WAREHOUSE' ? 'bg-purple-700 text-white' : 'bg-purple-200 text-purple-900'}`}>
                  {availableSisterConcernBoxes.length}
                </span>
              </button>

              <button
                onClick={() => setStatusFilter('DELIVERED')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  statusFilter === 'DELIVERED'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{isGerman ? '3. Im Transit / Beim Kunden' : '3. In Transit / Delivered to Customer'}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === 'DELIVERED' ? 'bg-emerald-700 text-white' : 'bg-emerald-200 text-emerald-900'}`}>
                  {scDeliveredBoxes.length}
                </span>
              </button>
            </div>
          </div>

          {/* Tabular Register */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="text-xs font-bold text-slate-700">
                {isGerman ? 'Mutterkisten-Register nach aktuellem Status' : 'Mother Box Register by Status'}
                <span className="ml-2 font-normal text-slate-500">
                  ({filteredBoxes.length} {filteredBoxes.length === 1 ? 'box' : 'boxes'} {isGerman ? 'gefunden' : 'found'})
                </span>
              </div>
            </div>

            {filteredBoxes.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                <p className="font-semibold text-slate-600">
                  {isGerman ? 'Keine Kisten für diesen Status-Filter gefunden' : 'No boxes found for this status filter'}
                </p>
                <p>
                  {isGerman
                    ? 'Wählen Sie einen anderen Filter oder scannen Sie Ware aus dem Werk ein.'
                    : 'Select a different filter or scan goods arriving from the factory.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[760px]">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3 font-mono">{isGerman ? 'Mutterkisten-ID' : 'Mother Box ID'}</th>
                      <th className="py-2.5 px-3">{isGerman ? 'Produkt & Sachnr.' : 'Product & Part No'}</th>
                      <th className="py-2.5 px-3 text-center">{isGerman ? 'Menge' : 'Qty'}</th>
                      <th className="py-2.5 px-3">{isGerman ? 'Aktueller Status' : 'Current Status'}</th>
                      <th className="py-2.5 px-3">{isGerman ? 'Standort' : 'Location'}</th>
                      <th className="py-2.5 px-3 font-mono">{isGerman ? 'Werksrechnung' : 'Factory SAP Ref'}</th>
                      <th className="py-2.5 px-3 text-right">{isGerman ? 'Aktion' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {filteredBoxes.map((box, index) => {
                      const cfg = BOX_STATUS_CONFIG[box.status];
                      return (
                        <tr key={box.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 text-center font-bold text-slate-400">{index + 1}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-purple-950 whitespace-nowrap">
                            {box.id}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-800">{box.productName}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{box.partNumber}</div>
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-800 whitespace-nowrap">
                            {box.itemSerials.length} {isGerman ? 'Stk.' : 'pcs'}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${cfg.badgeClass}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              <span>{isGerman ? cfg.labelDe : cfg.labelEn}</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 text-[11px] whitespace-nowrap">
                            {box.status === 'IN_TRANSIT_SISTER_CONCERN' && (
                              <span className="text-amber-700 font-semibold flex items-center gap-1">
                                <Truck className="w-3 h-3" />
                                <span>{isGerman ? 'Auf dem Weg zum DE-Hub' : 'En Route to Sister Hub'}</span>
                              </span>
                            )}
                            {box.status === 'AT_SISTER_CONCERN' && (
                              <span className="text-purple-700 font-semibold flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                <span>{isGerman ? 'Lager Schwestergesellschaft' : 'In Sister Concern Store'}</span>
                              </span>
                            )}
                            {box.status === 'DISPATCHED_FINAL_CUSTOMER' && (
                              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                <span>{isGerman ? 'Zugestellt / Beim Endkunden' : 'Delivered to Final OEM'}</span>
                              </span>
                            )}
                            {box.status === 'PACKED_IN_STOCK' && (
                              <span className="text-blue-700 font-semibold">
                                Takwe Factory Warehouse
                              </span>
                            )}
                            {box.status === 'DISPATCHED_DIRECT' && (
                              <span className="text-teal-700 font-semibold">
                                Direct Customer Transit
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                            {box.factoryInvoiceNumber || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            {box.status === 'IN_TRANSIT_SISTER_CONCERN' && (
                              <button
                                type="button"
                                onClick={() => handleIntakeReceiveBox(box.id)}
                                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-bold flex items-center gap-1 shadow-xs ml-auto transition-colors"
                              >
                                <ArrowDownToLine className="w-3 h-3" />
                                <span>{isGerman ? 'Einscannen (Lager)' : 'Intake Scan'}</span>
                              </button>
                            )}

                            {box.status === 'AT_SISTER_CONCERN' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setViewMode('creation');
                                  if (!selectedBoxIds.includes(box.id)) {
                                    setSelectedBoxIds((prev) => [...prev, box.id]);
                                  }
                                }}
                                className="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded text-[11px] font-bold flex items-center gap-1 ml-auto transition-colors"
                              >
                                <Send className="w-3 h-3" />
                                <span>{isGerman ? 'Zum Versand' : 'Dispatch'}</span>
                              </button>
                            )}

                            {box.status === 'DISPATCHED_FINAL_CUSTOMER' && (
                              <span className="text-[11px] text-emerald-700 font-semibold">
                                {isGerman ? 'Erledigt' : 'Dispatched'}
                              </span>
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

          {/* Historical Dispatches table in tabular history view */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <span>
                  {isGerman
                    ? `Archiv der Warenausgänge (Lieferscheine)`
                    : `Sister Concern Dispatch Delivery Notes`}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                  {scDispatches.length} Logs
                </span>
              </h3>
              <span className="text-[11px] text-slate-400">
                {isGerman ? 'VDA 4912 / 4939' : 'VDA Delivery Records'}
              </span>
            </div>

            {scDispatches.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4">
                {t.actor3NoDispatchesYet}
              </p>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[620px]">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 font-mono">
                        {isGerman ? 'Lieferschein-Nr.' : 'Delivery Note #'}
                      </th>
                      <th className="py-2.5 px-3">
                        {isGerman ? 'Endkunde / Empfänger' : 'Final OEM Customer'}
                      </th>
                      <th className="py-2.5 px-3 text-center">
                        {isGerman ? 'Kisten' : 'Boxes'}
                      </th>
                      <th className="py-2.5 px-3 text-center">
                        {isGerman ? 'Gesamtmenge' : 'Total Units'}
                      </th>
                      <th className="py-2.5 px-3">
                        {isGerman ? 'Versanddatum' : 'Dispatch Date'}
                      </th>
                      <th className="py-2.5 px-3">
                        {isGerman ? 'Spedition / LKW' : 'Vehicle'}
                      </th>
                      <th className="py-2.5 px-3 text-right">
                        {isGerman ? 'Aktionen' : 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {scDispatches.map((disp) => (
                      <tr key={disp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-purple-950 whitespace-nowrap">
                          {disp.scInvoiceNumber}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {disp.finalCustomerName}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-800 whitespace-nowrap">
                          {disp.boxIds.length} {isGerman ? 'Kisten' : 'bxs'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-purple-700 whitespace-nowrap">
                          {disp.boxIds.reduce((acc, id) => {
                            const b = boxes.find(bx => bx.id === id);
                            return acc + (b ? b.itemSerials.length : 0);
                          }, 0)} {isGerman ? 'Stk.' : 'pcs'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                          {disp.dispatchDate}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {disp.vehicleNumber || (isGerman ? 'Spedition Schenker' : 'Standard')}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setTargetAppendScDispatch(disp)}
                              className="px-2 py-1 bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 border border-slate-200 rounded text-[11px] font-bold flex items-center gap-1 transition-colors"
                              title={isGerman ? 'Weitere Kisten zu diesem Lieferschein hinzufügen' : 'Add more boxes to this delivery note'}
                            >
                              <PlusCircle className="w-3 h-3 text-purple-600" />
                              <span>{isGerman ? '+ Kisten' : '+ Add Boxes'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setGeneratedDispatch(disp);
                                setIsPackingListOpen(true);
                              }}
                              className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded text-[11px] font-bold flex items-center gap-1 transition-colors"
                            >
                              <Printer className="w-3 h-3 text-purple-600" />
                              <span>{t.actor3ViewPackingListBtn}</span>
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
      )}

      {/* Barcode Scanner Modal */}
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(boxId) => handleScanBox(boxId)}
        title={isGerman ? 'Mutterkisten-QR-Code scannen' : 'Scan Mother Box QR Code'}
        subtitle={isGerman ? 'Warenausgang der Schwestergesellschaft an Endabnehmer' : 'Sister concern store dispatch to final customer'}
        placeholder="BOX-YYYYMMDD-PART-XXX"
        suggestedValues={availableSisterConcernBoxes.map((b) => b.id)}
      />

      {/* Automated Packing List Modal / Document */}
      <PackingListModal
        dispatch={generatedDispatch}
        boxes={boxes}
        isOpen={isPackingListOpen}
        onClose={() => setIsPackingListOpen(false)}
        isSisterConcernDispatch={true}
      />

      {/* Add Boxes to Existing Sister Concern Dispatch Modal */}
      <AddBoxesToDispatchModal
        isOpen={!!targetAppendScDispatch}
        onClose={() => setTargetAppendScDispatch(null)}
        scDispatch={targetAppendScDispatch}
      />

      {/* Handheld Mobile / Tablet Terminal */}
      <MobileScannerTerminal
        isOpen={isMobileTerminalOpen}
        onClose={() => setIsMobileTerminalOpen(false)}
        defaultMode="sister"
      />
    </div>
  );
};
