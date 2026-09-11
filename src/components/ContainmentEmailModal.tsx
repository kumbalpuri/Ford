import React, { useState } from 'react';
import { FGProduct, MotherBox, CustomerMaster } from '../types';
import { useTraceability } from '../context/TraceabilityContext';
import { exportContainmentRecallCSV } from '../utils/csvExportUtils';
import { Mail, AlertTriangle, ShieldAlert, CheckCircle, X, Send, Copy, Check, FileSpreadsheet, Download } from 'lucide-react';

interface ContainmentEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: FGProduct[];
  boxes: MotherBox[];
  customers: CustomerMaster[];
}

export const ContainmentEmailModal: React.FC<ContainmentEmailModalProps> = ({
  isOpen,
  onClose,
  selectedItems,
  boxes,
  customers
}) => {
  const { sendContainmentNotice } = useTraceability();

  // Find customer target
  const firstItem = selectedItems[0];
  const parentBox = boxes.find((b) => b.id === firstItem?.boxId);

  // If sister concern dispatch, final customer is finalCustomerName
  const targetCustomerName = parentBox?.finalCustomerName || parentBox?.initialRecipientName || 'Customer Quality Assurance';
  const targetCustomer = customers.find(
    (c) => c.name === targetCustomerName || c.id === parentBox?.finalCustomerId || c.id === parentBox?.initialRecipientId
  );
  const targetEmail = parentBox?.finalCustomerEmail || targetCustomer?.email || 'quality@customer-oem.com';

  const [defectDescription, setDefectDescription] = useState(
    'Micro-porosity detected during customer incoming burst testing; suspected batch seal integrity risk.'
  );
  const [severity, setSeverity] = useState<'CRITICAL' | 'MAJOR' | 'MODERATE'>('CRITICAL');
  const [quarantineInstructions, setQuarantineInstructions] = useState(
    '1. Immediately segregate and quarantine the listed serial numbers in red containment bin.\n2. Do not feed into assembly line or ship to dealerships.\n3. Return quarantined parts via authorized reverse logistics challan.\n4. OEM 8D report #8D-2026-QA initiated by supplier quality.'
  );
  const [investigatedBy, setInvestigatedBy] = useState('Dr. Rajesh Verma (Lead QA Auditor)');
  const [isSent, setIsSent] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || selectedItems.length === 0) return null;

  const affectedSerials = selectedItems.map((s) => s.serialNumber);
  const affectedBoxIds = Array.from(new Set(selectedItems.map((s) => s.boxId).filter(Boolean))) as string[];

  const emailSubject = `[URGENT CONTAINMENT] Quality Quarantine Notice: ${firstItem?.productName} - ${affectedSerials.length} Suspected Units`;

  const handleSend = () => {
    sendContainmentNotice({
      defectDescription,
      severity,
      investigatedBy,
      targetCustomerName,
      targetCustomerEmail: targetEmail,
      suspectedSerialNumbers: affectedSerials,
      affectedBoxIds,
      productName: firstItem?.productName || 'Automotive Component',
      partNumber: firstItem?.partNumber || 'AUTO-PART',
      factoryInvoiceNumber: parentBox?.factoryInvoiceNumber,
      quarantineInstructions
    });

    setIsSent(true);
    setTimeout(() => {
      setIsSent(false);
      onClose();
    }, 1800);
  };

  const handleCopy = () => {
    const text = `SUBJECT: ${emailSubject}\nTO: ${targetEmail}\n\nDEAR ${targetCustomerName} QUALITY TEAM,\n\n${defectDescription}\n\nAFFECTED FG SERIAL NUMBERS (${affectedSerials.length}):\n${affectedSerials.join('\n')}\n\nAFFECTED BOXES:\n${affectedBoxIds.join(', ')}\n\nQUARANTINE INSTRUCTIONS:\n${quarantineInstructions}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCSV = () => {
    exportContainmentRecallCSV(selectedItems, boxes, customers, {
      defectDescription,
      severity,
      investigatedBy,
      quarantineInstructions,
      noticeNumber: `QA-RECALL-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
      filename: `QA_Recall_Batch_${selectedItems[0]?.partNumber || 'PART'}_${selectedItems.length}Units.csv`
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-red-200 bg-red-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-600 text-white flex items-center justify-center shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-red-950">
                  Automated Customer Containment Notification
                </h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-200 text-red-900">
                  IATF 16949
                </span>
              </div>
              <p className="text-xs text-red-700">
                Trigger urgent quarantine alert for {affectedSerials.length} suspected Finished Goods units
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content / Email Draft */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {isSent ? (
            <div className="p-8 text-center space-y-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-emerald-900">
                Containment Notice Dispatched Successfully!
              </h4>
              <p className="text-emerald-700 max-w-md mx-auto">
                Electronic quarantine notice sent to <strong>{targetEmail}</strong> for {affectedSerials.length} serial numbers. Audit trail recorded in Quality Management System.
              </p>
            </div>
          ) : (
            <>
              {/* Alert Banner */}
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-2.5 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Suspected Non-Conformance Action</p>
                  <p className="text-[11px] text-amber-800">
                    This notification will alert the customer quality head to freeze stock and isolate suspected lots immediately.
                  </p>
                </div>
              </div>

              {/* Email Fields */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1">
                      Target Customer / OEM:
                    </label>
                    <input
                      type="text"
                      value={targetCustomerName}
                      readOnly
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-semibold text-slate-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1">
                      Recipient Quality Email:
                    </label>
                    <input
                      type="email"
                      value={targetEmail}
                      readOnly
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-mono text-slate-800 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1">
                    Subject Line:
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    readOnly
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-semibold text-red-900 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1">
                      Severity Level:
                    </label>
                    <select
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value as 'CRITICAL' | 'MAJOR' | 'MODERATE')}
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-semibold text-xs"
                    >
                      <option value="CRITICAL">Critical (Safety / Operational Stop)</option>
                      <option value="MAJOR">Major (Performance / Assembly Failure)</option>
                      <option value="MODERATE">Moderate (Cosmetic / Inspection Variance)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1">
                      QA Officer In-Charge:
                    </label>
                    <input
                      type="text"
                      value={investigatedBy}
                      onChange={(e) => setInvestigatedBy(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1">
                    Defect Description & Root Cause Summary:
                  </label>
                  <textarea
                    rows={2}
                    value={defectDescription}
                    onChange={(e) => setDefectDescription(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded p-2 text-xs text-slate-800"
                  />
                </div>

                {/* Suspected QR Serials Summary */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-slate-500 text-[10px] uppercase font-bold">
                      Suspected FG QR Serial Numbers ({affectedSerials.length} Items):
                    </label>
                    <span className="text-[10px] text-slate-500">
                      Boxes: {affectedBoxIds.join(', ')}
                    </span>
                  </div>
                  <div className="bg-white border border-red-200 rounded p-2 max-h-24 overflow-y-auto flex flex-wrap gap-1.5">
                    {affectedSerials.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 bg-red-50 text-red-800 border border-red-200 font-mono text-[10px] font-bold rounded"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1">
                    Quarantine & Containment Instructions:
                  </label>
                  <textarea
                    rows={3}
                    value={quarantineInstructions}
                    onChange={(e) => setQuarantineInstructions(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded p-2 font-mono text-[11px] text-slate-800 leading-relaxed"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!isSent && (
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors font-medium"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Notice Text'}</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-800 rounded-lg transition-colors font-semibold shadow-2xs"
                title="Download formatted CSV report for this containment batch"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                <span>Export Batch CSV</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-3.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-xs transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Containment Email</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
