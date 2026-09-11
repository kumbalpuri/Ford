import React, { useState, useEffect, useMemo } from 'react';
import { useTraceability } from '../context/TraceabilityContext';
import { useLanguage } from '../context/LanguageContext';
import { MotherBox, BOX_STATUS_CONFIG } from '../types';
import { ScannerModal } from './ScannerModal';
import { MotherQRLabelModal } from './MotherQRLabelModal';
import { QuickPackBoxModal } from './QuickPackBoxModal';
import { MobileScannerTerminal } from './MobileScannerTerminal';
import {
  generateRealisticFGSerial,
  generateUniqueSerialBatch,
  playScanBeep,
  playCapacityReachedChime
} from '../utils/qrUtils';
import {
  Package,
  Scan,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Plus,
  Trash2,
  Printer,
  Sparkles,
  Layers,
  Clock,
  ArrowRight,
  Tag,
  Barcode,
  CheckCircle,
  HelpCircle,
  FileSpreadsheet,
  Search,
  Warehouse,
  Truck,
  Building2,
  PackagePlus,
  Smartphone
} from 'lucide-react';

export const Actor1Packaging: React.FC = () => {
  const { products, boxes, packBox, recordItemScan } = useTraceability();
  const { t, formatText } = useLanguage();

  // Separate creation view vs history tabular view
  const [viewMode, setViewMode] = useState<'creation' | 'history'>('creation');

  // Tabular status filter
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_WAREHOUSE' | 'IN_TRANSIT' | 'AT_SISTER_CONCERN' | 'DELIVERED'>('ALL');
  const [tableSearchTerm, setTableSearchTerm] = useState<string>('');

  // Selected product & packaging settings
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [productionDate, setProductionDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [productionShift, setProductionShift] = useState<'Shift A' | 'Shift B' | 'Shift C'>('Shift A');
  const [operatorName, setOperatorName] = useState<string>('Operator Suresh K.');


  // Current packing session
  const [scannedSerials, setScannedSerials] = useState<string[]>([]);
  const [manualSerialInput, setManualSerialInput] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [autoOpenModalOnCapacity, setAutoOpenModalOnCapacity] = useState<boolean>(true);

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [lastPackedBox, setLastPackedBox] = useState<MotherBox | null>(null);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [labelModalTab, setLabelModalTab] = useState<'mother' | 'serials' | 'bundle'>('mother');
  const [isQuickPackOpen, setIsQuickPackOpen] = useState(false);
  const [isMobileTerminalOpen, setIsMobileTerminalOpen] = useState(false);

  // Selected product object
  const currentProduct = products.find((p) => p.id === selectedProductId) || products[0];
  const boxCapacity = currentProduct?.boxCapacity || 4;
  const isBoxFull = scannedSerials.length >= boxCapacity;

  // Clear scanned items when product changes if user confirms
  const handleProductChange = (newProdId: string) => {
    if (scannedSerials.length > 0) {
      if (confirm('Changing product will reset the currently scanned items in this box. Continue?')) {
        setScannedSerials([]);
        setSelectedProductId(newProdId);
      }
    } else {
      setSelectedProductId(newProdId);
    }
  };

  // Add a scanned serial
  const handleAddSerial = (rawSerial: string) => {
    const serial = rawSerial.trim().toUpperCase();
    setValidationError(null);

    if (!serial) return;

    if (scannedSerials.includes(serial)) {
      playScanBeep(false);
      setValidationError(`Serial ${serial} already scanned in this current box!`);
      return;
    }

    if (scannedSerials.length >= boxCapacity) {
      playScanBeep(false);
      setValidationError(`Box capacity of ${boxCapacity} units is already reached! Please seal and generate Mother QR.`);
      return;
    }

    const nextSerials = [...scannedSerials, serial];
    setScannedSerials(nextSerials);
    setManualSerialInput('');

    // Record individual scan event to system audit trail
    recordItemScan(serial, currentProduct?.name);

    // Check if box capacity is reached
    if (nextSerials.length === boxCapacity) {
      playCapacityReachedChime();
    } else {
      playScanBeep(true);
    }
  };

  // Simulate quick FG scan
  const handleSimulateScan = () => {
    if (!currentProduct) return;
    const generated = generateRealisticFGSerial(currentProduct.partNumber, productionDate);
    handleAddSerial(generated);
  };

  // Simulate packing an entire box up to capacity in 1 click
  const handleSimulateFillBox = () => {
    if (!currentProduct) return;
    const remaining = boxCapacity - scannedSerials.length;
    if (remaining <= 0) return;

    const batch = generateUniqueSerialBatch(currentProduct.partNumber, productionDate, remaining);
    batch.forEach((sn) => recordItemScan(sn, currentProduct?.name));
    const combined = [...scannedSerials, ...batch];
    setScannedSerials(combined);
    playCapacityReachedChime();
  };

  // Remove single item
  const handleRemoveSerial = (indexToRemove: number) => {
    setScannedSerials((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Seal box & generate Mother QR and produce printable labels
  const handleGenerateMotherQR = (initialTab: 'mother' | 'serials' | 'bundle' = 'mother') => {
    if (scannedSerials.length === 0) {
      setValidationError('Cannot pack an empty box. Scan at least one item.');
      return;
    }

    try {
      const newBox = packBox({
        productId: currentProduct.id,
        productionDate,
        productionShift,
        itemSerials: scannedSerials,
        packedBy: operatorName
      });

      setLastPackedBox(newBox);
      setLabelModalTab(initialTab);
      setIsLabelModalOpen(true);
      setScannedSerials([]);
      setValidationError(null);
    } catch (err: unknown) {
      setValidationError((err as Error).message);
    }
  };

  // Status-based counts
  const statusCounts = useMemo(() => {
    return {
      all: boxes.length,
      inWarehouse: boxes.filter((b) => b.status === 'PACKED_IN_STOCK').length,
      inTransit: boxes.filter((b) => b.status === 'IN_TRANSIT_SISTER_CONCERN').length,
      atSisterConcern: boxes.filter((b) => b.status === 'AT_SISTER_CONCERN').length,
      delivered: boxes.filter(
        (b) => b.status === 'DISPATCHED_DIRECT' || b.status === 'DISPATCHED_FINAL_CUSTOMER'
      ).length
    };
  }, [boxes]);

  // Tabular filtered boxes
  const filteredBoxes = useMemo(() => {
    let list = [...boxes];

    // Filter by status tab
    if (statusFilter === 'IN_WAREHOUSE') {
      list = list.filter((b) => b.status === 'PACKED_IN_STOCK');
    } else if (statusFilter === 'IN_TRANSIT') {
      list = list.filter((b) => b.status === 'IN_TRANSIT_SISTER_CONCERN');
    } else if (statusFilter === 'AT_SISTER_CONCERN') {
      list = list.filter((b) => b.status === 'AT_SISTER_CONCERN');
    } else if (statusFilter === 'DELIVERED') {
      list = list.filter(
        (b) => b.status === 'DISPATCHED_DIRECT' || b.status === 'DISPATCHED_FINAL_CUSTOMER'
      );
    }

    // Search term
    if (tableSearchTerm.trim()) {
      const q = tableSearchTerm.toLowerCase();
      list = list.filter(
        (b) =>
          b.id.toLowerCase().includes(q) ||
          b.productName.toLowerCase().includes(q) ||
          b.partNumber.toLowerCase().includes(q) ||
          (b.factoryInvoiceNumber && b.factoryInvoiceNumber.toLowerCase().includes(q)) ||
          b.itemSerials.some((s) => s.toLowerCase().includes(q))
      );
    }

    return list;
  }, [boxes, statusFilter, tableSearchTerm]);

  const renderStatusBadge = (status: MotherBox['status']) => {
    const config = BOX_STATUS_CONFIG[status];
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${config.badgeClass}`}
      >
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Station Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800">
                {t.actor1Badge}
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                {t.actor1Title}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {t.actor1Subtitle}
            </p>
          </div>
        </div>

        {/* View Switcher & Mobile Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('creation')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'creation'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Packaging & Scanning (Creation View)</span>
            </button>
            <button
              onClick={() => setViewMode('history')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'history'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Box Inventory ({boxes.length}) (Tabular View)</span>
            </button>
          </div>

          {/* Quick Handheld Entry Buttons */}
          <button
            type="button"
            onClick={() => setIsQuickPackOpen(true)}
            className="px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Fast single-screen box creation"
          >
            <PackagePlus className="w-4 h-4 text-blue-600" />
            <span>+ Quick Pack Box</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMobileTerminalOpen(true)}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Handheld scanner terminal"
          >
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>📱 Mobile / Tab Mode</span>
          </button>
        </div>
      </div>


      {/* VIEW 1: CREATION VIEW */}
      {viewMode === 'creation' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Packing Form & Scan Terminal */}
          <div className="lg:col-span-3 space-y-6">
            {/* Master Selection & Production Date Configuration */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t.actor1SelectProduct}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Product dropdown */}
              <div className="md:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">
                  {t.actor1SelectProduct} *
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.partNumber}) — {p.boxCapacity} {t.actor1Pieces}/box
                    </option>
                  ))}
                </select>
              </div>

              {/* Date of Production (Default Today) */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.actor1ProdDate} *</span>
                </label>
                <input
                  type="date"
                  value={productionDate}
                  onChange={(e) => setProductionDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-1 border-t border-slate-100">
              <div>
                <span className="text-slate-400 block text-[11px]">Part Number</span>
                <span className="font-mono font-bold text-slate-800 text-xs">
                  {currentProduct?.partNumber}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Master Box Capacity</span>
                <span className="font-bold text-blue-700 text-xs">
                  {boxCapacity} Units per Box
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Shift & Operator</span>
                <span className="font-medium text-slate-700 text-xs">
                  {productionShift} • {operatorName}
                </span>
              </div>
            </div>
          </div>

          {/* Active Box Packing & Scanner Terminal */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  2. Scan Finished Goods QR Codes into Box
                </h3>
                <p className="text-xs text-slate-600">
                  Scan {boxCapacity} product items to reach packing capacity and trigger Mother QR label generation
                </p>
              </div>

              {/* Progress counter pill */}
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-slate-900">
                    {scannedSerials.length} / {boxCapacity} PCS
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {isBoxFull ? 'Capacity Reached!' : `${boxCapacity - scannedSerials.length} remaining`}
                  </span>
                </div>
                <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isBoxFull ? 'bg-emerald-600' : 'bg-blue-600'
                    }`}
                    style={{ width: `${Math.min(100, (scannedSerials.length / boxCapacity) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Input Bar & Actions */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddSerial(manualSerialInput);
              }}
              className="space-y-3"
            >
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={manualSerialInput}
                    onChange={(e) => setManualSerialInput(e.target.value)}
                    placeholder="Scan product QR or enter serial (e.g. FG-BRK-20260908-014)..."
                    disabled={isBoxFull}
                    className="w-full pl-3 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 font-mono text-slate-900 disabled:opacity-50"
                  />
                  <Scan className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                </div>

                <button
                  type="submit"
                  disabled={!manualSerialInput.trim() || isBoxFull}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold transition-colors shrink-0"
                >
                  Add Scanned Item
                </button>

                <button
                  type="button"
                  onClick={handleSimulateScan}
                  disabled={isBoxFull}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shrink-0"
                  title="Generate realistic test QR scan"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Simulate 1 Scan</span>
                </button>

                {!isBoxFull && (
                  <button
                    type="button"
                    onClick={handleSimulateFillBox}
                    className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors shrink-0"
                    title={`Fill remaining ${boxCapacity - scannedSerials.length} units to hit capacity`}
                  >
                    <span>Fill to Capacity</span>
                  </button>
                )}
              </div>

              {validationError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-800">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}
            </form>

            {/* List of scanned items in this box - Tabular Format */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  Items In Current Box ({scannedSerials.length} of {boxCapacity}):
                </span>
                {scannedSerials.length > 0 && (
                  <span className="text-[11px] text-slate-500 font-mono">
                    Progress: {Math.round((scannedSerials.length / boxCapacity) * 100)}%
                  </span>
                )}
              </div>

              {scannedSerials.length === 0 ? (
                <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400 space-y-1">
                  <Scan className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                  <p className="font-semibold text-slate-600">No items scanned into this box yet</p>
                  <p className="text-[11px] text-slate-400">
                    Use physical USB scanner gun, camera, or click &quot;Simulate 1 Scan&quot; / &quot;Fill to Capacity&quot; to begin.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="py-2 px-3 w-10 text-center">#</th>
                        <th className="py-2 px-3 font-mono">FG QR Serial ID</th>
                        <th className="py-2 px-3">Product Name & Part No</th>
                        <th className="py-2 px-3">Shift</th>
                        <th className="py-2 px-3 text-center">Status</th>
                        <th className="py-2 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {scannedSerials.map((serial, index) => (
                        <tr key={serial} className="hover:bg-blue-50/40 transition-colors">
                          <td className="py-2 px-3 text-center font-bold text-slate-500">{index + 1}</td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-900">{serial}</td>
                          <td className="py-2 px-3">
                            <span className="font-semibold text-slate-800">{currentProduct.name}</span>
                            <span className="text-[11px] text-slate-500 font-mono ml-1.5">({currentProduct.partNumber})</span>
                          </td>
                          <td className="py-2 px-3 text-slate-600">{productionShift}</td>
                          <td className="py-2 px-3 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Verified</span>
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveSerial(index)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                              title="Remove scan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Mother QR & Label Generation Banner Once Capacity is Reached */}
            {isBoxFull ? (
              <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-400 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-in fade-in duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-extrabold text-emerald-950">
                        Box Packing Capacity Reached ({boxCapacity}/{boxCapacity} PCS)!
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-200 text-emerald-900">
                        READY TO PRINT
                      </span>
                    </div>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      Generate box-level Mother QR code and produce printable labels (carton label + unique serial ID stickers).
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleGenerateMotherQR('bundle')}
                    className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all hover:scale-102"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Seal Box & Print All Labels</span>
                  </button>
                </div>
              </div>
            ) : (
              scannedSerials.length > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-500">
                    {boxCapacity - scannedSerials.length} more piece{boxCapacity - scannedSerials.length === 1 ? '' : 's'} required to reach full box capacity.
                  </span>
                  <button
                    onClick={() => handleGenerateMotherQR('mother')}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <span>Seal Partial Box ({scannedSerials.length} Pcs)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    )}

      {/* VIEW 2: TABULAR VIEW (STATUS-BASED) */}
      {viewMode === 'history' && (
        <div className="space-y-4">
          {/* Status Tabs Bar */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Master Box Inventory & Lifecycle Register (Tabular View)
                </h3>
                <p className="text-xs text-slate-500">
                  Categorized strictly by lifecycle status: In Warehouse ➔ In Transit ➔ Sister Concern ➔ Delivered.
                </p>
              </div>

              <button
                onClick={() => setViewMode('creation')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Pack New Box</span>
              </button>
            </div>

            {/* Status Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Boxes ({statusCounts.all})
              </button>
              <button
                onClick={() => setStatusFilter('IN_WAREHOUSE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  statusFilter === 'IN_WAREHOUSE'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                <Warehouse className="w-3.5 h-3.5" />
                <span>In Warehouse ({statusCounts.inWarehouse})</span>
              </button>
              <button
                onClick={() => setStatusFilter('IN_TRANSIT')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  statusFilter === 'IN_TRANSIT'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>In Transit to Sister Concern ({statusCounts.inTransit})</span>
              </button>
              <button
                onClick={() => setStatusFilter('AT_SISTER_CONCERN')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  statusFilter === 'AT_SISTER_CONCERN'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>In Warehouse of Sister Concern ({statusCounts.atSisterConcern})</span>
              </button>
              <button
                onClick={() => setStatusFilter('DELIVERED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  statusFilter === 'DELIVERED'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>In Transit / Delivered to Customer ({statusCounts.delivered})</span>
              </button>
            </div>

            {/* Search within tabular view */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tableSearchTerm}
                onChange={(e) => setTableSearchTerm(e.target.value)}
                placeholder="Search by Box ID, product name, part #, invoice #, or serial number..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Master Tabular View Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[850px]">
                <thead className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4 font-mono">Mother Box QR ID</th>
                    <th className="py-3 px-4">Product Name & Part No</th>
                    <th className="py-3 px-3 text-center">Packed Units</th>
                    <th className="py-3 px-3">Production Date</th>
                    <th className="py-3 px-3">Packaging Shift</th>
                    <th className="py-3 px-4 text-center">Workflow Status</th>
                    <th className="py-3 px-4">Recipient / Invoice</th>
                    <th className="py-3 px-4 text-right">Print Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredBoxes.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Package className="w-8 h-8 text-slate-300" />
                          <p className="font-semibold text-slate-500">No boxes found matching this status.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredBoxes.map((box) => (
                      <tr key={box.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-blue-900 whitespace-nowrap">
                          {box.id}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{box.productName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{box.partNumber}</div>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className="font-extrabold text-slate-900">{box.itemSerials.length}</span>
                          <span className="text-slate-400"> / {box.boxCapacity} pcs</span>
                        </td>
                        <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                          {box.productionDate}
                        </td>
                        <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                          <div>{box.packedBy || 'Line Operator'}</div>
                          <div className="text-[10px] text-slate-400 font-mono">Shift {box.productionShift}</div>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {renderStatusBadge(box.status)}
                        </td>
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                          {box.initialRecipientName ? (
                            <div>
                              <div className="font-semibold text-slate-800 truncate max-w-[150px]">
                                {box.initialRecipientName}
                              </div>
                              <div className="text-[10px] font-mono text-blue-600">
                                {box.factoryInvoiceNumber || 'Direct Transfer'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">In Factory Stock</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setLastPackedBox(box);
                                setLabelModalTab('serials');
                                setIsLabelModalOpen(true);
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors"
                              title="Print individual unit serial stickers"
                            >
                              <Tag className="w-3 h-3 text-slate-500" />
                              <span>Serials</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setLastPackedBox(box);
                                setLabelModalTab('mother');
                                setIsLabelModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[11px] font-bold flex items-center gap-1 transition-colors"
                              title="Print carton exterior & interior labels"
                            >
                              <Printer className="w-3 h-3 text-blue-600" />
                              <span>Mother Label</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>
                Showing <strong>{filteredBoxes.length}</strong> of <strong>{boxes.length}</strong> total mother boxes
              </span>
              <span className="text-[11px] text-slate-400">
                Takwe Plant Packaging Bay 1
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Hardware / Camera Scanner Modal */}
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(text) => handleAddSerial(text)}
        title="Scan FG Product QR Code"
        subtitle={`Pack into current box (${scannedSerials.length}/${boxCapacity} units)`}
        placeholder="FG-BRK-YYYYMMDD-XXX"
        expectedFormat={`e.g. FG-${currentProduct?.partNumber.split('-')[1] || 'PART'}-YYYYMMDD-###`}
      />

      {/* Complete Printable Labels Suite (Mother Box QR + Individual Unique Serial Stickers) */}
      <MotherQRLabelModal
        box={lastPackedBox}
        isOpen={isLabelModalOpen}
        onClose={() => setIsLabelModalOpen(false)}
        defaultTab={labelModalTab}
        shift={productionShift}
      />

      {/* Quick Single-Dialog Mother Box Packing Modal */}
      <QuickPackBoxModal
        isOpen={isQuickPackOpen}
        onClose={() => setIsQuickPackOpen(false)}
        onBoxCreated={(newBox) => {
          setLastPackedBox(newBox);
          setIsLabelModalOpen(true);
        }}
      />

      {/* Handheld Mobile/Tablet Terminal */}
      <MobileScannerTerminal
        isOpen={isMobileTerminalOpen}
        onClose={() => setIsMobileTerminalOpen(false)}
        defaultMode="pack"
      />
    </div>
  );
};
