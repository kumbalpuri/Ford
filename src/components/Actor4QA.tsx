import React, { useState, useMemo } from 'react';
import { useTraceability } from '../context/TraceabilityContext';
import { useLanguage } from '../context/LanguageContext';
import { FGProduct, MotherBox } from '../types';
import { ScannerModal } from './ScannerModal';
import { ContainmentEmailModal } from './ContainmentEmailModal';
import { playScanBeep } from '../utils/qrUtils';
import {
  exportContainmentRecallCSV,
  exportHistoricalContainmentNoticeCSV
} from '../utils/csvExportUtils';
import {
  ShieldAlert,
  Search,
  Scan,
  Calendar,
  AlertTriangle,
  CheckSquare,
  Square,
  Mail,
  FileCheck,
  Building,
  Truck,
  Box,
  Clock,
  Sparkles,
  Info,
  Download,
  FileSpreadsheet
} from 'lucide-react';

export const Actor4QA: React.FC = () => {
  const {
    products,
    customers,
    boxes,
    fgProducts,
    containmentNotices
  } = useTraceability();
  const { t, formatText } = useLanguage();

  // Search mode & inputs
  const [searchMode, setSearchMode] = useState<'scan' | 'daterange'>('scan');
  const [fgQrSearchInput, setFgQrSearchInput] = useState<string>('FG-BRK-20260901-001');
  const [startDate, setStartDate] = useState<string>('2026-09-01');
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [filterProductId, setFilterProductId] = useState<string>('ALL');

  // Execution state
  const [hasExecuted, setHasExecuted] = useState<boolean>(true);
  const [lastExecutedQuery, setLastExecutedQuery] = useState<string>('FG-BRK-20260901-001');

  // Selected items for QA containment notice
  const [selectedSerials, setSelectedSerials] = useState<string[]>([]);

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isContainmentModalOpen, setIsContainmentModalOpen] = useState<boolean>(false);

  // Helper mapping box ID to MotherBox
  const boxMap = useMemo(() => {
    const map = new Map<string, MotherBox>();
    boxes.forEach((b) => map.set(b.id, b));
    return map;
  }, [boxes]);

  // Execute Traceability Search
  const searchResults: FGProduct[] = useMemo(() => {
    if (!hasExecuted) return [];

    if (searchMode === 'scan') {
      const q = fgQrSearchInput.trim().toUpperCase();
      if (!q) return [];
      // Exact match or contains
      return fgProducts.filter(
        (fg) => fg.serialNumber.toUpperCase() === q || fg.boxId?.toUpperCase() === q
      );
    } else {
      // Date range & product filter
      return fgProducts.filter((fg) => {
        const itemDate = fg.productionDate;
        const matchesDate = itemDate >= startDate && itemDate <= endDate;
        const matchesProduct = filterProductId === 'ALL' || fg.productId === filterProductId;
        return matchesDate && matchesProduct;
      });
    }
  }, [hasExecuted, searchMode, fgQrSearchInput, startDate, endDate, filterProductId, fgProducts]);

  // Trigger search execution
  const handleExecute = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    playScanBeep(true);
    setHasExecuted(true);
    setLastExecutedQuery(searchMode === 'scan' ? fgQrSearchInput : `${startDate} to ${endDate}`);
    setSelectedSerials([]);
  };

  // Toggle selection
  const handleToggleSelect = (serial: string) => {
    if (selectedSerials.includes(serial)) {
      setSelectedSerials((prev) => prev.filter((s) => s !== serial));
    } else {
      setSelectedSerials((prev) => [...prev, serial]);
    }
  };

  const handleSelectAll = () => {
    if (selectedSerials.length === searchResults.length) {
      setSelectedSerials([]);
    } else {
      setSelectedSerials(searchResults.map((s) => s.serialNumber));
    }
  };

  // Select all units in the same mother box
  const handleSelectEntireBox = (boxId?: string) => {
    if (!boxId) return;
    const boxSerials = fgProducts.filter((p) => p.boxId === boxId).map((p) => p.serialNumber);
    setSelectedSerials((prev) => Array.from(new Set([...prev, ...boxSerials])));
  };

  const selectedItemsObjects = useMemo(() => {
    return fgProducts.filter((p) => selectedSerials.includes(p.serialNumber));
  }, [fgProducts, selectedSerials]);

  // Export QA Containment Recall results as formatted CSV report
  const handleExportCSV = (targetItems?: FGProduct[]) => {
    const itemsToExport =
      targetItems ||
      (selectedSerials.length > 0 ? selectedItemsObjects : searchResults);

    if (itemsToExport.length === 0) return;

    playScanBeep(true);
    exportContainmentRecallCSV(itemsToExport, boxes, customers, {
      batchName: searchMode === 'scan' ? fgQrSearchInput : `${startDate}_to_${endDate}`,
      defectDescription: 'Suspected Batch Quality Deviation / Burst Test Micro-porosity Defect',
      severity: 'CRITICAL',
      investigatedBy: 'QA Lead Auditor (QMS)',
      quarantineInstructions: 'Immediately segregate and quarantine listed serial numbers in red containment bin. Do not feed into OEM assembly line.',
      filename: `QA_Containment_Recall_Report_${itemsToExport.length}Units.csv`
    });
  };

  const handleExportHistoricalNoticeCSV = (notice: (typeof containmentNotices)[0]) => {
    playScanBeep(true);
    exportHistoricalContainmentNoticeCSV(notice, fgProducts, boxes, customers);
  };

  return (
    <div className="space-y-6">
      {/* Station Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800">
                {t.actor4Badge}
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                {t.actor4Title}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {t.actor4Subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            <Scan className="w-4 h-4" />
            <span>Scan Defective FG QR</span>
          </button>
        </div>
      </div>

      {/* Query Search Card */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Traceability Investigation Criteria
          </h3>

          {/* Switch Mode: By FG QR vs By Date Range */}
          <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-medium">
            <button
              onClick={() => setSearchMode('scan')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                searchMode === 'scan'
                  ? 'bg-white text-red-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.actor4SearchModeSerial}
            </button>
            <button
              onClick={() => setSearchMode('daterange')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                searchMode === 'daterange'
                  ? 'bg-white text-red-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.actor4SearchModeDate}
            </button>
          </div>
        </div>

        <form onSubmit={handleExecute} className="space-y-4">
          {searchMode === 'scan' ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Finished Good Product QR Code / Serial Number *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={fgQrSearchInput}
                    onChange={(e) => setFgQrSearchInput(e.target.value)}
                    placeholder="e.g. FG-BRK-20260901-001 or FG-FP-20260902-101"
                    className="w-full pl-3 pr-28 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                  />
                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setIsScannerOpen(true)}
                      className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[11px] font-medium flex items-center gap-1"
                    >
                      <Scan className="w-3 h-3" />
                      <span>Scan</span>
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Customer shares defective QR code from part stamping or vehicle warranty return.
                </p>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Search className="w-4 h-4" />
                  <span>Execute Trace</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  From Date *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  To Date *
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Filter Product (Optional)
                </label>
                <select
                  value={filterProductId}
                  onChange={(e) => setFilterProductId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                >
                  <option value="ALL">All Automotive Parts</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Search className="w-4 h-4" />
                  <span>Execute Range Search</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Single Item Genealogy Spotlight Card (when 1 item found) */}
      {searchResults.length === 1 && (
        <div className="bg-white rounded-xl p-5 border border-red-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-red-100 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-red-950">
                Complete End-to-End Product Pedigree & Genealogy
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-slate-700">
              Serial: {searchResults[0].serialNumber}
            </span>
          </div>

          {(() => {
            const item = searchResults[0];
            const parentBox = item.boxId ? boxMap.get(item.boxId) : null;
            const finalCustomer = parentBox?.finalCustomerName || parentBox?.initialRecipientName || 'Pending Dispatch';
            const isIntercompany = parentBox?.dispatchType === 'SISTER_CONCERN';

            return (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs pt-1">
                {/* 1. Production */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <div className="flex items-center gap-1.5 text-blue-700 font-bold text-[11px] uppercase">
                    <Box className="w-3.5 h-3.5" /> 1. Production Line
                  </div>
                  <p className="font-bold text-slate-900">{item.productName}</p>
                  <p className="font-mono text-[11px] text-slate-600">{item.partNumber}</p>
                  <div className="pt-1 border-t border-slate-200 text-[10px] text-slate-500">
                    <span>Prod Date: <strong>{item.productionDate}</strong></span>
                    <span className="block">Shift: {item.productionShift}</span>
                  </div>
                </div>

                {/* 2. Box Packaging */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-[11px] uppercase">
                    <Box className="w-3.5 h-3.5" /> 2. Mother Box
                  </div>
                  <p className="font-mono font-bold text-indigo-900">{item.boxId || 'Not Boxed'}</p>
                  <p className="text-[11px] text-slate-600">
                    Capacity: {parentBox?.boxCapacity || 0} pcs ({parentBox?.itemSerials.length || 0} packed)
                  </p>
                  <div className="pt-1 border-t border-slate-200 text-[10px] text-slate-500">
                    <span>Packed on: {parentBox?.packedAt || 'N/A'}</span>
                    <span className="block">By: {parentBox?.packedBy || 'N/A'}</span>
                  </div>
                </div>

                {/* 3. Factory Dispatch */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <div className="flex items-center gap-1.5 text-purple-700 font-bold text-[11px] uppercase">
                    <Truck className="w-3.5 h-3.5" /> 3. Factory Dispatch
                  </div>
                  <p className="font-mono font-bold text-slate-900">
                    {parentBox?.factoryInvoiceNumber || 'Not Dispatched Yet'}
                  </p>
                  <p className="text-[11px] font-semibold text-slate-700 truncate">
                    To: {parentBox?.initialRecipientName || 'In Stock'}
                  </p>
                  <div className="pt-1 border-t border-slate-200 text-[10px] text-slate-500">
                    <span>Nature: {parentBox?.dispatchType === 'SISTER_CONCERN' ? 'Sister Concern Hub' : 'Direct OEM'}</span>
                    <span className="block">Dispatch Date: {parentBox?.factoryDispatchDate || 'N/A'}</span>
                  </div>
                </div>

                {/* 4. Final Customer / Sister Concern */}
                <div className="p-3 bg-red-50/60 rounded-lg border border-red-200 space-y-1">
                  <div className="flex items-center gap-1.5 text-red-700 font-bold text-[11px] uppercase">
                    <Building className="w-3.5 h-3.5" /> 4. Customer Marriage
                  </div>
                  <p className="font-bold text-red-950 truncate">{finalCustomer}</p>
                  {isIntercompany && parentBox?.sisterConcernInvoiceNumber && (
                    <p className="font-mono text-[11px] text-purple-800">
                      SC Inv: {parentBox.sisterConcernInvoiceNumber}
                    </p>
                  )}
                  <div className="pt-1 border-t border-red-200 text-[10px] text-slate-600">
                    <span>Current Status: <strong>{item.status.replace(/_/g, ' ')}</strong></span>
                    {parentBox?.finalCustomerEmail && (
                      <span className="block font-mono truncate">Email: {parentBox.finalCustomerEmail}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Results Table & Containment Selection */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Traceability Records ({searchResults.length} Products Found)
            </h3>
            <p className="text-xs text-slate-500">
              Select suspected serial numbers to trigger automated quality quarantine emails to customers.
            </p>
          </div>

          {/* Bulk Selection Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              disabled={searchResults.length === 0}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              {selectedSerials.length === searchResults.length && searchResults.length > 0 ? (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-red-600" />
                  <span>Deselect All</span>
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5" />
                  <span>Select All ({searchResults.length})</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleExportCSV()}
              disabled={searchResults.length === 0}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
              title="Export product serials, production date, and customer details as formatted CSV report"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>
                {selectedSerials.length > 0
                  ? `Export Selected CSV (${selectedSerials.length})`
                  : `Export Batch CSV (${searchResults.length})`}
              </span>
            </button>

            <button
              onClick={() => setIsContainmentModalOpen(true)}
              disabled={selectedSerials.length === 0}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Send Containment Email ({selectedSerials.length})</span>
            </button>
          </div>
        </div>

        {searchResults.length === 0 ? (
          <div className="p-12 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-2">
            <Search className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-700">No matching Finished Goods found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Please verify the FG QR serial code or adjust the production date range filter above.
            </p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-lg overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[800px]">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedSerials.length === searchResults.length && searchResults.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded text-red-600 cursor-pointer"
                    />
                  </th>
                  <th className="py-2.5 px-3">FG QR Serial Number</th>
                  <th className="py-2.5 px-3">Product Name & Part No</th>
                  <th className="py-2.5 px-3">Prod Date</th>
                  <th className="py-2.5 px-3">Mother Box ID</th>
                  <th className="py-2.5 px-3">Invoice Number(s)</th>
                  <th className="py-2.5 px-3">Dispatched Customer</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Batch Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {searchResults.map((item) => {
                  const isChecked = selectedSerials.includes(item.serialNumber);
                  const parentBox = item.boxId ? boxMap.get(item.boxId) : null;
                  const finalCustomer = parentBox?.finalCustomerName || parentBox?.initialRecipientName || 'In Factory Stock';
                  const isSisterConcernDispatch = parentBox?.dispatchType === 'SISTER_CONCERN';

                  return (
                    <tr
                      key={item.serialNumber}
                      className={`transition-colors ${
                        isChecked ? 'bg-red-50/70 hover:bg-red-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(item.serialNumber)}
                          className="w-4 h-4 rounded text-red-600 cursor-pointer"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {item.serialNumber}
                        {item.isSuspected && (
                          <span className="ml-1.5 px-1.5 py-0.5 bg-red-100 text-red-800 text-[10px] rounded font-semibold">
                            Suspected
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800">{item.productName}</div>
                        <div className="text-[11px] font-mono text-slate-500">{item.partNumber}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                        {item.productionDate}
                        <div className="text-[10px] text-slate-400">{item.productionShift}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-blue-800 font-semibold whitespace-nowrap">
                        {item.boxId || 'Unboxed'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-xs">
                        {parentBox?.factoryInvoiceNumber ? (
                          <div>
                            <span className="font-semibold text-slate-900">{parentBox.factoryInvoiceNumber}</span>
                            {isSisterConcernDispatch && parentBox?.sisterConcernInvoiceNumber && (
                              <div className="text-[10px] text-purple-700 font-semibold">
                                SC: {parentBox.sisterConcernInvoiceNumber}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800">{finalCustomer}</div>
                        {isSisterConcernDispatch && (
                          <span className="text-[10px] text-purple-700 font-medium">
                            Via Sister Hub ({parentBox?.initialRecipientName})
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            item.status === 'PACKED'
                              ? 'bg-amber-100 text-amber-800'
                              : item.status === 'DISPATCHED_DIRECT'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'DISPATCHED_TO_SISTER_CONCERN'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {item.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {item.boxId && (
                          <button
                            onClick={() => handleSelectEntireBox(item.boxId)}
                            className="text-[11px] text-red-600 hover:text-red-800 font-medium hover:underline whitespace-nowrap"
                            title="Select all products packed in this same box"
                          >
                            Select Box
                          </button>
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

      {/* Historical Containment Notices Audit Log */}
      {containmentNotices.length > 0 && (
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Customer Containment Notices Sent ({containmentNotices.length})
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">QMS Audit Trail</span>
          </div>

          <div className="border border-red-200 rounded-lg overflow-x-auto bg-white">
            <table className="w-full text-left text-xs border-collapse min-w-[650px]">
              <thead className="bg-red-50/70 text-red-950 font-semibold border-b border-red-200">
                <tr>
                  <th className="py-2.5 px-3 font-mono">Notice #</th>
                  <th className="py-2.5 px-3">Customer Consignee</th>
                  <th className="py-2.5 px-3 text-center">Severity</th>
                  <th className="py-2.5 px-3">Defect Description</th>
                  <th className="py-2.5 px-3 text-center">Suspected Serials</th>
                  <th className="py-2.5 px-3">Notice Date</th>
                  <th className="py-2.5 px-3 text-right">Audit Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {containmentNotices.map((n) => (
                  <tr key={n.id} className="hover:bg-red-50/30 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-red-950 whitespace-nowrap">
                      {n.noticeNumber}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {n.targetCustomerName}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        n.severity === 'CRITICAL'
                          ? 'bg-red-200 text-red-900 border border-red-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {n.severity}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate italic">
                      {n.defectDescription}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-red-900 whitespace-nowrap">
                      {n.suspectedSerialNumbers.length} units
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                      {n.issueDate}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleExportHistoricalNoticeCSV(n)}
                        className="inline-flex items-center gap-1.5 text-emerald-800 hover:text-emerald-950 font-bold bg-white px-2.5 py-1 rounded-md border border-emerald-300 hover:bg-emerald-50 transition-colors shadow-2xs"
                        title="Export recall notice details, production dates, product serials, and customer details as CSV"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Export CSV</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Scanner modal */}
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(scanned) => {
          setFgQrSearchInput(scanned);
          setSearchMode('scan');
          setTimeout(() => handleExecute(), 200);
        }}
        title="Scan Defective FG Product QR"
        subtitle="Search customer-reported finished good"
        placeholder="FG-BRK-YYYYMMDD-XXX"
        suggestedValues={fgProducts.slice(0, 8).map((f) => f.serialNumber)}
      />

      {/* Automated Containment Email Modal */}
      <ContainmentEmailModal
        isOpen={isContainmentModalOpen}
        onClose={() => setIsContainmentModalOpen(false)}
        selectedItems={selectedItemsObjects}
        boxes={boxes}
        customers={customers}
      />
    </div>
  );
};
