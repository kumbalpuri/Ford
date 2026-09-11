import React, { useEffect, useState } from 'react';
import { MotherBox } from '../types';
import { COMPANY_INFO } from '../constants/company';
import {
  generateCompleteBoxLabelPackage,
  MotherBoxLabelPackage,
  downloadDataUrlAsFile
} from '../utils/qrUtils';

import {
  Printer,
  Download,
  X,
  CheckCircle,
  Box,
  Tag,
  Layers,
  Sparkles,
  Barcode,
  Calendar,
  User,
  ShieldCheck,
  CheckCircle2,
  FileText
} from 'lucide-react';

interface MotherQRLabelModalProps {
  box: MotherBox | null;
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'mother' | 'serials' | 'bundle';
  shift?: string;
}

export const MotherQRLabelModal: React.FC<MotherQRLabelModalProps> = ({
  box,
  isOpen,
  onClose,
  defaultTab = 'mother',
  shift = 'Shift A'
}) => {
  const [activeTab, setActiveTab] = useState<'mother' | 'serials' | 'bundle'>(defaultTab);
  const [labelPackage, setLabelPackage] = useState<MotherBoxLabelPackage | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Generate complete QR package (Mother QR + All unique serial ID QRs)
  useEffect(() => {
    if (box && isOpen) {
      setIsLoading(true);
      generateCompleteBoxLabelPackage(box, shift)
        .then((pkg) => {
          setLabelPackage(pkg);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('Failed to generate box label package:', err);
          setIsLoading(false);
        });
    } else {
      setLabelPackage(null);
    }
  }, [box, isOpen, shift]);

  // Sync tab if defaultTab changes
  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  if (!isOpen || !box) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadMotherQR = () => {
    if (!labelPackage?.motherQrDataUrl) return;
    downloadDataUrlAsFile(labelPackage.motherQrDataUrl, `${box.id}-MOTHER-QR`);
  };

  const handleDownloadAllSerialQRs = () => {
    if (!labelPackage) return;
    // Download mother QR
    downloadDataUrlAsFile(labelPackage.motherQrDataUrl, `${box.id}-MOTHER-QR`);

    // Download each unit serial QR with slight delay to prevent browser block
    labelPackage.unitLabels.forEach((unit, idx) => {
      setTimeout(() => {
        downloadDataUrlAsFile(unit.qrDataUrl, `${unit.serialNumber}-SERIAL-QR`);
      }, (idx + 1) * 200);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden print:border-none print:shadow-none print:max-w-none print:w-full">
        {/* Header - Hidden during print */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Printable QR Labels & Serial Tags
                </h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Box Complete ({box.itemSerials.length}/{box.boxCapacity} Pcs)
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Box Mother QR: <strong className="font-mono text-slate-800">{box.id}</strong> • {box.productName}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Labels</span>
            </button>

            <div className="relative group">
              <button
                onClick={handleDownloadMotherQR}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                title="Save Mother QR as PNG"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save QR</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Selection Tabs - Hidden during print */}
        <div className="px-6 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 pt-2 print:hidden">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('mother')}
              className={`flex items-center gap-2 py-2.5 px-3 border-b-2 font-bold text-xs transition-all ${
                activeTab === 'mother'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Box className="w-4 h-4" />
              <span>Mother Box Labels (Carton + Inlay)</span>
            </button>

            <button
              onClick={() => setActiveTab('serials')}
              className={`flex items-center gap-2 py-2.5 px-3 border-b-2 font-bold text-xs transition-all ${
                activeTab === 'serials'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>Unit Serial Stickers ({box.itemSerials.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('bundle')}
              className={`flex items-center gap-2 py-2.5 px-3 border-b-2 font-bold text-xs transition-all ${
                activeTab === 'bundle'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Full Print Bundle (Mother + Serials)</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 py-2">
            Standard 2D Barcode (ISO/IEC 18004 • IATF 16949)
          </div>
        </div>

        {/* Modal Body / Printable Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto print:max-h-none print:p-4 print:overflow-visible space-y-6">
          {isLoading ? (
            <div className="p-16 flex flex-col items-center justify-center space-y-3 text-slate-500">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold">Generating high-density QR codes for box and all serial units...</p>
            </div>
          ) : !labelPackage ? (
            <div className="p-12 text-center text-xs text-red-600">Failed to generate label package.</div>
          ) : (
            <>
              {/* TAB 1: MOTHER BOX LABELS */}
              {(activeTab === 'mother' || activeTab === 'bundle') && (
                <div className="space-y-6 print:space-y-6">
                  {/* LABEL 1: EXTERIOR CARTON SHIPPING & TRACEABILITY LABEL */}
                  <div className="border-2 border-slate-900 rounded-xl p-6 bg-white shadow-xs print:border-black print:rounded-none print:shadow-none print-avoid-break">
                    <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2.5 py-1 bg-slate-950 text-white text-xs font-mono font-bold tracking-wider rounded-xs">
                          LABEL 1: EXTERIOR
                        </span>
                        <div>
                          <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight">
                            {COMPANY_INFO.name}
                          </h4>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold">
                            {COMPANY_INFO.addressLine1}, {COMPANY_INFO.city} • Takwe Plant • IATF 16949
                          </span>
                        </div>

                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-extrabold text-slate-900 block">
                          CAPACITY: {box.itemSerials.length} / {box.boxCapacity} UNITS
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                          100% SEALED & VERIFIED
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                      {/* Left: Mother QR Code */}
                      <div className="flex flex-col items-center justify-center p-3 border border-slate-300 rounded-lg bg-slate-50/70">
                        <img
                          src={labelPackage.motherQrDataUrl}
                          alt={`Mother QR Code for ${box.id}`}
                          className="w-44 h-44 object-contain"
                        />
                        <span className="mt-2 font-mono text-xs font-extrabold text-slate-950 tracking-wider">
                          {box.id}
                        </span>
                        <span className="text-[10px] text-slate-500">Scan at Primary Dispatch</span>
                      </div>

                      {/* Right 2 cols: Box & Product Specifications */}
                      <div className="md:col-span-2 space-y-3 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                            Finished Good Description
                          </span>
                          <div className="text-base font-extrabold text-slate-900 leading-tight">
                            {box.productName}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                            <span className="text-[10px] text-slate-500 uppercase font-bold block">
                              Automotive Part Number
                            </span>
                            <div className="font-mono text-sm font-extrabold text-slate-900">
                              {box.partNumber}
                            </div>
                          </div>

                          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                            <span className="text-[10px] text-slate-500 uppercase font-bold block">
                              Box-Level Mother QR ID
                            </span>
                            <div className="font-mono text-sm font-extrabold text-blue-700">
                              {box.id}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2.5 text-[11px] pt-1">
                          <div className="p-2 bg-slate-50/50 rounded border border-slate-200/80">
                            <span className="text-slate-400 block text-[10px]">Production Date</span>
                            <span className="font-bold text-slate-800">{box.productionDate}</span>
                          </div>
                          <div className="p-2 bg-slate-50/50 rounded border border-slate-200/80">
                            <span className="text-slate-400 block text-[10px]">Shift & Timestamp</span>
                            <span className="font-semibold text-slate-800">
                              {shift} • {box.packedAt.slice(11, 16)}
                            </span>
                          </div>
                          <div className="p-2 bg-slate-50/50 rounded border border-slate-200/80">
                            <span className="text-slate-400 block text-[10px]">Packing In-Charge</span>
                            <span className="font-semibold text-slate-800 truncate block">
                              {box.packedBy}
                            </span>
                          </div>
                        </div>

                        {/* Footer certification banner */}
                        <div className="pt-2.5 border-t border-slate-200 flex flex-wrap justify-between items-center text-[10px] text-slate-600 gap-2">
                          <div className="flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span>IATF 16949 Compliant • Affix Securely on Carton Exterior</span>
                          </div>
                          <span className="font-mono font-bold text-slate-900">
                            TOTAL: {box.itemSerials.length} PCS ENCLOSED
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* LABEL 2: INTERIOR CHECKLIST INLAY LABEL */}
                  <div className="border-2 border-dashed border-slate-500 rounded-xl p-6 bg-white shadow-xs print:border-black print:border-solid print:rounded-none print:shadow-none print-avoid-break">
                    <div className="flex items-center justify-between border-b-2 border-slate-800 pb-2.5 mb-3.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-blue-700 text-white text-xs font-mono font-bold tracking-wider rounded-xs">
                          LABEL 2: INSIDE BOX
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 uppercase">
                            Interior Component Traceability Inlay
                          </h4>
                          <span className="text-[10px] text-slate-500">
                            Store directly inside carton with packed automotive components
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-700">
                        Enclosed Serial Register ({box.itemSerials.length} Units)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                      {/* Mini QR Verification */}
                      <div className="flex flex-col items-center justify-center p-2.5 border border-slate-200 rounded-lg bg-slate-50">
                        <img
                          src={labelPackage.motherQrDataUrl}
                          alt={`QR ${box.id}`}
                          className="w-28 h-28 object-contain"
                        />
                        <span className="font-mono text-[10px] font-bold text-slate-700 mt-1">
                          {box.id}
                        </span>
                        <span className="text-[9px] text-slate-400 text-center">
                          Internal Inlay Copy
                        </span>
                      </div>

                      {/* Serialized Item List inside this Mother Box */}
                      <div className="md:col-span-3 space-y-2.5 text-xs">
                        <div className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-200 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">
                              Part Reference
                            </span>
                            <p className="font-bold text-slate-900">{box.productName}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">
                              Part Number
                            </span>
                            <p className="font-mono font-bold text-slate-800">{box.partNumber}</p>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                            Individual Serial Numbers Packed in this Box:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {labelPackage.unitLabels.map((unit) => (
                              <div
                                key={unit.serialNumber}
                                className="flex items-center gap-2 p-1.5 bg-slate-50 rounded border border-slate-200 text-[11px] font-mono text-slate-800"
                              >
                                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[10px] font-bold shrink-0">
                                  {unit.index}
                                </span>
                                <span className="font-bold text-slate-900 truncate">
                                  {unit.serialNumber}
                                </span>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-auto shrink-0" />
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200 flex justify-between text-[10px] text-slate-500">
                          <span>Packed on: <strong>{box.productionDate}</strong></span>
                          <span>Operator: <strong>{box.packedBy}</strong></span>
                          <span>Standard: <strong>IATF 16949 / ISO 9001</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Page break between Mother Carton Label and Individual Serial Stickers in Bundle print */}
              {activeTab === 'bundle' && (
                <div className="print-page-break border-t-2 border-dashed border-slate-200 pt-6">
                  <div className="flex items-center justify-between pb-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <span>Part 2: Individual Unit Serial Labels for this Box</span>
                    <span>{box.itemSerials.length} Pieces Total</span>
                  </div>
                </div>
              )}

              {/* TAB 2: INDIVIDUAL UNIT SERIAL LABELS */}
              {(activeTab === 'serials' || activeTab === 'bundle') && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3 print:hidden">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Tag className="w-4 h-4 text-blue-600" />
                        <span>Individual Finished Goods Serial QR Stickers</span>
                      </h4>
                      <p className="text-xs text-slate-500">
                        Printable adhesive part labels with unique serial IDs to affix onto each automotive component
                      </p>
                    </div>

                    <button
                      onClick={handleDownloadAllSerialQRs}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download All Unit QRs ({labelPackage.unitLabels.length})</span>
                    </button>
                  </div>

                  {/* Serial Sticker Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {labelPackage.unitLabels.map((unit) => (
                      <div
                        key={unit.serialNumber}
                        className="border-2 border-slate-800 rounded-lg p-3 bg-white shadow-xs print:border-black print:rounded-none print:shadow-none print-avoid-break flex gap-3.5 items-center"
                      >
                        {/* 2D QR Code */}
                        <div className="flex flex-col items-center justify-center p-1.5 border border-slate-300 rounded bg-slate-50 shrink-0">
                          <img
                            src={unit.qrDataUrl}
                            alt={`QR for ${unit.serialNumber}`}
                            className="w-24 h-24 object-contain"
                          />
                          <span className="font-mono text-[9px] font-bold text-slate-700 mt-0.5">
                            #{unit.index} of {box.itemSerials.length}
                          </span>
                        </div>

                        {/* Unit Details */}
                        <div className="flex-1 min-w-0 space-y-1 text-xs">
                          <div className="flex items-center justify-between gap-1">
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-[9px] font-bold font-mono">
                              UNIT #{unit.index}
                            </span>
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-300 flex items-center gap-0.5">
                              <CheckCircle className="w-2.5 h-2.5" /> QC PASS
                            </span>
                          </div>

                          <div>
                            <span className="text-[9px] text-slate-400 uppercase font-semibold block">
                              Serial ID
                            </span>
                            <div className="font-mono text-xs font-extrabold text-slate-950 truncate">
                              {unit.serialNumber}
                            </div>
                          </div>

                          <div>
                            <span className="text-[9px] text-slate-400 uppercase font-semibold block">
                              Part No & Name
                            </span>
                            <div className="font-mono text-[11px] font-bold text-slate-800 truncate">
                              {unit.partNumber}
                            </div>
                            <div className="text-[10px] text-slate-600 truncate">
                              {unit.productName}
                            </div>
                          </div>

                          <div className="pt-1 border-t border-slate-200 flex justify-between text-[9px] text-slate-500 font-mono">
                            <span>Date: {unit.productionDate}</span>
                            <span>Box: {unit.boxId}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer - Hidden during print */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-600 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>
              Mother Box ID: <strong className="font-mono text-slate-900">{box.id}</strong> • Encloses {box.itemSerials.length} unique serial IDs
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print {activeTab === 'mother' ? 'Mother Labels' : activeTab === 'serials' ? 'Serial Stickers' : 'All Labels'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
