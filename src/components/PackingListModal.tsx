import React, { useEffect, useState } from 'react';
import { DispatchBatch, SisterConcernDispatchBatch, MotherBox } from '../types';
import { generateQRDataUrl } from '../utils/qrUtils';
import { useLanguage } from '../context/LanguageContext';
import { COMPANY_INFO } from '../constants/company';
import { Printer, Download, X, FileText, CheckCircle, Truck, Building, Calendar, Languages, Globe } from 'lucide-react';


interface PackingListModalProps {
  dispatch: DispatchBatch | SisterConcernDispatchBatch | null;
  boxes: MotherBox[];
  isOpen: boolean;
  onClose: () => void;
  isSisterConcernDispatch?: boolean;
}

type DocLanguage = 'de' | 'en' | 'dual';

export const PackingListModal: React.FC<PackingListModalProps> = ({
  dispatch,
  boxes,
  isOpen,
  onClose,
  isSisterConcernDispatch = false
}) => {
  const { language } = useLanguage();
  const [manifestQr, setManifestQr] = useState<string>('');
  
  // Default to 'de' if sister concern or global is German, otherwise 'en'
  const [docLang, setDocLang] = useState<DocLanguage>(() => {
    if (isSisterConcernDispatch) return 'de';
    return language === 'de' ? 'de' : 'en';
  });

  useEffect(() => {
    if (isSisterConcernDispatch) {
      setDocLang('de');
    } else if (language === 'de') {
      setDocLang('de');
    } else {
      setDocLang('en');
    }
  }, [isSisterConcernDispatch, language, isOpen]);

  useEffect(() => {
    if (dispatch) {
      const invoiceNo = 'invoiceNumber' in dispatch ? dispatch.invoiceNumber : dispatch.scInvoiceNumber;
      generateQRDataUrl(`PACKING-LIST:${invoiceNo}:${dispatch.dispatchDate}:${dispatch.boxIds.length}-BOXES`)
        .then((url) => setManifestQr(url));
    }
  }, [dispatch]);

  if (!isOpen || !dispatch) return null;

  const invoiceNo = 'invoiceNumber' in dispatch ? dispatch.invoiceNumber : dispatch.scInvoiceNumber;
  const customerName = 'customerName' in dispatch ? dispatch.customerName : dispatch.finalCustomerName;
  const customerAddress = 'customerAddress' in dispatch ? dispatch.customerAddress : dispatch.finalCustomerAddress;
  const customerEmail = 'customerEmail' in dispatch ? dispatch.customerEmail : dispatch.finalCustomerEmail;
  const dispatchType = 'dispatchType' in dispatch ? dispatch.dispatchType : 'SISTER_CONCERN_TO_CUSTOMER';

  const dispatchedBoxes = boxes.filter((b) => dispatch.boxIds.includes(b.id));
  const totalUnits = dispatchedBoxes.reduce((acc, b) => acc + b.itemSerials.length, 0);

  const handlePrint = () => {
    window.print();
  };

  // Document labels based on docLang
  const labels = {
    de: {
      modalTitle: 'Automatisierter Lieferschein / Packliste',
      modalSubtitle: 'Automatisch bei Abschluss des Warenausgangs generiert',
      printBtn: 'Lieferschein drucken',
      companyHeader: isSisterConcernDispatch
        ? 'Schwestergesellschaft Niederlassung Deutschland - Distributionszentrum'
        : COMPANY_INFO.name,
      companySub: isSisterConcernDispatch
        ? 'Logistikzentrum Südwest, Industriestraße 12, 70565 Stuttgart • Konzerninternes Distributionszentrum • IATF 16949 / VDA 6.1'
        : `${COMPANY_INFO.addressLine1}, ${COMPANY_INFO.city}, ${COMPANY_INFO.state} ${COMPANY_INFO.pincode}, ${COMPANY_INFO.country} • Tel: ${COMPANY_INFO.phone} • Fax: ${COMPANY_INFO.fax} • ISO/IATF 16949 Certified Plant`,

      docTitle: 'Offizieller Lieferschein & Rückverfolgbarkeits-Manifest',
      scanVerify: 'Scan zur Echtheitsprüfung',
      consignee: 'Warenempfänger / Kundendaten (OEM):',
      invoiceNo: 'Lieferschein-Nr. / Rechnung:',
      dispatchDate: 'Lieferdatum:',
      nature: 'Versandart:',
      natureDirect: 'Direktlieferung an OEM-Kunden',
      natureIntercompany: 'Konzerninterner Transfer (Werk an Schwesterunternehmen)',
      natureSisterConcern: 'Schwestergesellschaft Warenausgang an Endkunden',
      vehicle: 'Fahrzeug / Spedition:',
      factoryRef: 'Ursprüngliche Werksrechnung:',
      tableTitle: 'Versendete Mutterkisten & FG-QR-Einzelseriennummern',
      tableSummary: `Gesamt: ${dispatchedBoxes.length} Kisten (${totalUnits} Fertigerzeugnisse)`,
      thPos: 'Pos.',
      thBoxId: 'Mutterkisten-QR-ID',
      thProduct: 'Produktbezeichnung & Sachnummer',
      thQty: 'Packmenge',
      thSerials: 'Enthaltene FG-QR-Einzelseriennummern',
      grandTotal: 'Gesamtmenge versendet:',
      verified: '100% lückenlose Rückverfolgbarkeit geprüft (IATF 16949 / VDA)',
      notes: 'Versandhinweise / Speditionsinstruktionen:',
      defaultNotes: 'Präzisions-Automobilteile. Vorsichtig behandeln. Unversehrtheit des Mutter-QR-Siegels bei Anlieferung prüfen.',
      preparedBy: 'Erstellt & Geprüft durch',
      stamp: 'Logistik-Freigabestempel',
      stampValue: 'Qualitäts- & Warenausgangsprüfung',
      footer: 'Offizielles Rückverfolgbarkeits-Dokument • Entspricht VDA 4913 & IATF 16949 Standard',
      close: 'Schließen',
      pieces: 'Stk.',
      prodDate: 'Prod-Datum:'
    },
    en: {
      modalTitle: 'Automated Packing List / Dispatch Challan',
      modalSubtitle: 'Generated automatically upon dispatch completion',
      printBtn: 'Print Packing List',
      companyHeader: isSisterConcernDispatch
        ? 'Sister Concern Hub - Distribution Division'
        : COMPANY_INFO.name,
      companySub: isSisterConcernDispatch
        ? 'Regional Logistics Hub, Stuttgart/Frankfurt • Intercompany Distribution Center'
        : `${COMPANY_INFO.addressLine1}, ${COMPANY_INFO.city}, ${COMPANY_INFO.state} ${COMPANY_INFO.pincode}, ${COMPANY_INFO.country} • Phone: ${COMPANY_INFO.phone} • Fax: ${COMPANY_INFO.fax} • ISO/IATF 16949 Certified Plant`,
      docTitle: 'Official Dispatch Packing List & Traceability Manifest',

      scanVerify: 'Scan for Verification',
      consignee: 'Consignee / Customer Details:',
      invoiceNo: 'Invoice / Challan No:',
      dispatchDate: 'Dispatch Date:',
      nature: 'Dispatch Nature:',
      natureDirect: 'Direct OEM Sale',
      natureIntercompany: 'Intercompany Transfer (Factory to Sister Concern)',
      natureSisterConcern: 'Sister Concern Dispatch to Customer',
      vehicle: 'Vehicle / Transporter:',
      factoryRef: 'Original Factory Invoice Ref:',
      tableTitle: 'Dispatched Boxes & FG QR Code Serial Numbers',
      tableSummary: `Total: ${dispatchedBoxes.length} Boxes (${totalUnits} Finished Goods Units)`,
      thPos: '#',
      thBoxId: 'Mother Box QR ID',
      thProduct: 'Product Description & Part No',
      thQty: 'Packed Qty',
      thSerials: 'Enclosed FG QR Serial Numbers',
      grandTotal: 'Grand Total Units Dispatched:',
      verified: '100% Traceability Verified',
      notes: 'Dispatch Notes / Instructions:',
      defaultNotes: 'Ensure careful handling. Fragile precision automotive components. Check mother QR seal integrity on receipt.',
      preparedBy: 'Prepared & Checked By',
      stamp: 'Authorized Logistics Stamp',
      stampValue: 'Quality & Gate Pass',
      footer: 'Official Traceability Packing List • IATF 16949 Traceability Standard',
      close: 'Close',
      pieces: 'pcs',
      prodDate: 'Prod Date:'
    },
    dual: {
      modalTitle: 'Lieferschein & Packing List (Zweisprachig / Dual)',
      modalSubtitle: 'Bilingual Delivery Note & Dispatch Manifest',
      printBtn: 'Drucken / Print',
      companyHeader: isSisterConcernDispatch
        ? 'Schwestergesellschaft Niederlassung / Sister Concern Hub (DE)'
        : COMPANY_INFO.name,
      companySub: isSisterConcernDispatch
        ? 'Logistikzentrum Stuttgart/Frankfurt • Intercompany Distribution Center • IATF 16949 / VDA 6.1'
        : `${COMPANY_INFO.addressLine1}, ${COMPANY_INFO.city}, ${COMPANY_INFO.state} ${COMPANY_INFO.pincode} • Phone: ${COMPANY_INFO.phone} • IATF 16949 Certified`,
      docTitle: 'Offizieller Lieferschein / Official Dispatch Packing List',

      scanVerify: 'Scan zur Prüfung / Scan for Verification',
      consignee: 'Warenempfänger / Consignee (Customer Details):',
      invoiceNo: 'Lieferschein-Nr. / Invoice No:',
      dispatchDate: 'Lieferdatum / Dispatch Date:',
      nature: 'Versandart / Dispatch Nature:',
      natureDirect: 'Direktlieferung / Direct OEM Sale',
      natureIntercompany: 'Transfer Schwesterunternehmen / Intercompany Transfer',
      natureSisterConcern: 'Schwestergesellschaft Warenausgang / Sister Concern Customer Dispatch',
      vehicle: 'Fahrzeug / Spedition (Vehicle):',
      factoryRef: 'Urspr. Werksrechnung (Factory Ref):',
      tableTitle: 'Versendete Kisten & Seriennummern / Dispatched Boxes & FG Serials',
      tableSummary: `Gesamt / Total: ${dispatchedBoxes.length} Kisten/Boxes (${totalUnits} Stk./Units)`,
      thPos: '#',
      thBoxId: 'Mutterkisten-QR-ID / Box ID',
      thProduct: 'Produkt & Sachnr. / Product & Part No',
      thQty: 'Menge / Qty',
      thSerials: 'FG-Einzelseriennummern / Enclosed FG Serials',
      grandTotal: 'Gesamtmenge / Grand Total Units:',
      verified: '100% Rückverfolgbarkeit geprüft / Traceability Verified',
      notes: 'Versandhinweise / Dispatch Notes:',
      defaultNotes: 'Präzisionsteile / Fragile precision components. Unversehrtheit des Mutter-QR-Siegels prüfen / Check seal on receipt.',
      preparedBy: 'Erstellt & Geprüft durch / Prepared By',
      stamp: 'Logistik-Freigabestempel / Authorized Stamp',
      stampValue: 'Qualitäts- & Warenausgangsprüfung / Quality Release',
      footer: 'IATF 16949 / VDA 4913 Konformes Dokument • Dual Language (DE / EN)',
      close: 'Schließen / Close',
      pieces: 'Stk./pcs',
      prodDate: 'Prod-Datum / Date:'
    }
  }[docLang];

  const getDispatchNatureText = () => {
    if (dispatchType === 'DIRECT_SALE') return labels.natureDirect;
    if (dispatchType === 'SISTER_CONCERN') return labels.natureIntercompany;
    return labels.natureSisterConcern;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden print:border-none print:shadow-none print:max-w-none">
        {/* Header - Hidden on print */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 print:hidden gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-900">
                  {labels.modalTitle}
                </h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800 font-mono">
                  {invoiceNo}
                </span>
                {isSisterConcernDispatch && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                    🇩🇪 Schwestergesellschaft
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {labels.modalSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Document Language Switcher */}
            <div className="flex items-center bg-white border border-slate-300 rounded-lg p-1 text-xs shadow-2xs">
              <span className="text-slate-500 pl-2 pr-1.5 font-medium text-[11px] hidden md:inline">
                Sprache / Lang:
              </span>
              <button
                onClick={() => setDocLang('de')}
                className={`px-2 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 ${
                  docLang === 'de'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Deutscher Lieferschein"
              >
                <span>🇩🇪</span>
                <span>DE</span>
              </button>
              <button
                onClick={() => setDocLang('en')}
                className={`px-2 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 ${
                  docLang === 'en'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="English Packing List"
              >
                <span>🇬🇧</span>
                <span>EN</span>
              </button>
              <button
                onClick={() => setDocLang('dual')}
                className={`px-2 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 ${
                  docLang === 'dual'
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Zweisprachig / Dual Language (DE / EN)"
              >
                <span>🌐</span>
                <span className="hidden sm:inline">Dual</span>
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{labels.printBtn}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Packing List Document */}
        <div className="p-8 max-h-[75vh] overflow-y-auto print:max-h-none print:p-4 space-y-6 text-slate-900 font-sans">
          {/* Document Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 uppercase">
                  {labels.companyHeader}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-xl">
                {labels.companySub}
              </p>
              <div className="inline-block mt-2 px-2.5 py-1 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded-xs">
                {labels.docTitle}
              </div>
            </div>

            <div className="text-right flex flex-col items-end">
              {manifestQr && (
                <img src={manifestQr} alt="Invoice QR" className="w-20 h-20 border border-slate-200 p-1 mb-1" />
              )}
              <span className="text-[10px] font-mono text-slate-500">{labels.scanVerify}</span>
            </div>
          </div>

          {/* Invoice & Consignee Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                {labels.consignee}
              </span>
              <p className="text-sm font-bold text-slate-900">{customerName}</p>
              <p className="text-slate-600 leading-relaxed">{customerAddress}</p>
              {customerEmail && (
                <p className="text-slate-500 font-mono text-[11px]">Email: {customerEmail}</p>
              )}
            </div>

            <div className="space-y-2 border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-6">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400">{labels.invoiceNo}</span>
                  <p className="font-mono font-bold text-slate-900">{invoiceNo}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400">{labels.dispatchDate}</span>
                  <p className="font-semibold text-slate-800">{dispatch.dispatchDate}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400">{labels.nature}</span>
                  <p className="font-semibold text-blue-700">
                    {getDispatchNatureText()}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400">{labels.vehicle}</span>
                  <p className="font-mono font-semibold text-slate-800">{dispatch.vehicleNumber || 'Spedition Dachser / Werk-LKW'}</p>
                </div>
              </div>

              {'factoryInvoiceReference' in dispatch && dispatch.factoryInvoiceReference && (
                <div className="pt-1 border-t border-slate-200">
                  <span className="text-[10px] uppercase font-semibold text-slate-400">{labels.factoryRef}</span>
                  <p className="font-mono text-slate-700">{dispatch.factoryInvoiceReference}</p>
                </div>
              )}
            </div>
          </div>

          {/* Table of Dispatched Boxes and Component Serials */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                {labels.tableTitle}
              </h4>
              <span className="text-xs text-slate-500 font-medium">
                {labels.tableSummary}
              </span>
            </div>

            <div className="border border-slate-300 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 font-semibold">
                    <th className="py-2.5 px-3 w-10 text-center">{labels.thPos}</th>
                    <th className="py-2.5 px-3">{labels.thBoxId}</th>
                    <th className="py-2.5 px-3">{labels.thProduct}</th>
                    <th className="py-2.5 px-3 text-center">{labels.thQty}</th>
                    <th className="py-2.5 px-3">{labels.thSerials}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {dispatchedBoxes.map((b, idx) => (
                    <tr key={b.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono font-bold text-blue-800 whitespace-nowrap">
                        {b.id}
                        <div className="text-[10px] text-slate-500 font-normal">
                          {labels.prodDate} {b.productionDate}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{b.productName}</div>
                        <div className="text-slate-500 font-mono text-[11px]">{b.partNumber}</div>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-800">
                        {b.itemSerials.length} {labels.pieces}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {b.itemSerials.map((s) => (
                            <span
                              key={s}
                              className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px] text-slate-700"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold text-slate-800 border-t border-slate-300">
                    <td colSpan={3} className="py-2.5 px-3 text-right">
                      {labels.grandTotal}
                    </td>
                    <td className="py-2.5 px-3 text-center text-blue-700 font-bold">
                      {totalUnits} {labels.pieces}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-emerald-700 font-semibold">
                      {labels.verified}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notes & Sign-off */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-200 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">{labels.notes}</span>
              <p className="text-slate-600 text-[11px] mt-1 italic">
                {dispatch.notes || labels.defaultNotes}
              </p>
              <p className="text-[10px] text-slate-400 mt-2">
                {labels.preparedBy}: <strong>{dispatch.createdBy}</strong> ({dispatch.dispatchDate})
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="border border-dashed border-slate-300 rounded p-4 flex flex-col justify-between h-24">
                <span className="text-[10px] uppercase text-slate-400">{labels.preparedBy}</span>
                <div className="border-t border-slate-400 pt-1 text-[11px] font-semibold text-slate-700">
                  {dispatch.createdBy}
                </div>
              </div>
              <div className="border border-dashed border-slate-300 rounded p-4 flex flex-col justify-between h-24">
                <span className="text-[10px] uppercase text-slate-400">{labels.stamp}</span>
                <div className="border-t border-slate-400 pt-1 text-[11px] font-semibold text-slate-700">
                  {labels.stampValue}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500 print:hidden">
          <span>{labels.footer}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium transition-colors"
          >
            {labels.close}
          </button>
        </div>
      </div>
    </div>
  );
};
