import { FGProduct, MotherBox, CustomerMaster, ContainmentNotice } from '../types';

export interface ContainmentExportOptions {
  batchName?: string;
  defectDescription?: string;
  severity?: 'CRITICAL' | 'MAJOR' | 'MODERATE' | string;
  noticeNumber?: string;
  investigatedBy?: string;
  quarantineInstructions?: string;
  filename?: string;
}

/**
 * RFC 4180 compliant CSV cell escaper
 */
export function escapeCSVCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '""';
  }
  const str = String(value);
  // If the cell contains quotes, commas, or line breaks, enclose in quotes and escape internal quotes
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Compile detailed containment recall rows with all product serials,
 * production dates, and full customer & dispatch traceability genealogy.
 */
export function buildContainmentRecallData(
  items: FGProduct[],
  boxes: MotherBox[],
  customers: CustomerMaster[],
  options?: ContainmentExportOptions
) {
  const boxMap = new Map<string, MotherBox>();
  boxes.forEach((b) => boxMap.set(b.id, b));

  const customerMap = new Map<string, CustomerMaster>();
  customers.forEach((c) => {
    customerMap.set(c.id, c);
    customerMap.set(c.name.toLowerCase(), c);
  });

  return items.map((item, index) => {
    const parentBox = item.boxId ? boxMap.get(item.boxId) : undefined;
    const isSisterConcernDispatch = parentBox?.dispatchType === 'SISTER_CONCERN';

    // Determine target customer
    const customerName =
      parentBox?.finalCustomerName ||
      parentBox?.initialRecipientName ||
      (item.status === 'PACKED' ? 'In Factory Stock (Unsold)' : 'Unassigned Customer');

    const customerObj =
      (parentBox?.finalCustomerId && customerMap.get(parentBox.finalCustomerId)) ||
      (parentBox?.initialRecipientId && customerMap.get(parentBox.initialRecipientId)) ||
      customerMap.get(customerName.toLowerCase());

    const customerEmail =
      parentBox?.finalCustomerEmail || customerObj?.email || 'N/A';
    const customerCode = customerObj?.code || 'N/A';
    const customerContact = customerObj?.contactPerson || 'Quality Manager';
    const customerPhone = customerObj?.phone || 'N/A';
    const customerAddress = customerObj?.address
      ? `${customerObj.address}, ${customerObj.city}`
      : 'N/A';

    return {
      index: index + 1,
      serialNumber: item.serialNumber,
      partNumber: item.partNumber,
      productName: item.productName,
      productionDate: item.productionDate,
      productionShift: item.productionShift || 'Shift A',
      motherBoxId: item.boxId || 'UNBOXED',
      boxCapacity: parentBox ? `${parentBox.itemSerials.length}/${parentBox.boxCapacity}` : 'N/A',
      boxPackedAt: parentBox?.packedAt || 'N/A',
      boxPackedBy: parentBox?.packedBy || 'N/A',
      factoryInvoiceNumber: parentBox?.factoryInvoiceNumber || 'PENDING_DISPATCH',
      factoryDispatchDate: parentBox?.factoryDispatchDate || 'N/A',
      dispatchRoute: isSisterConcernDispatch
        ? 'Intercompany (Via Sister Concern Hub)'
        : parentBox?.dispatchType === 'DIRECT_SALE'
        ? 'Direct Factory to OEM'
        : 'In Factory Inventory',
      sisterConcernHub: isSisterConcernDispatch
        ? parentBox?.initialRecipientName || 'Sister Concern Hub'
        : 'N/A',
      sisterConcernInvoiceNumber: parentBox?.sisterConcernInvoiceNumber || 'N/A',
      sisterConcernDispatchDate: parentBox?.sisterConcernDispatchDate || 'N/A',
      customerName,
      customerCode,
      customerEmail,
      customerContact,
      customerPhone,
      customerAddress,
      lifecycleStatus: item.status.replace(/_/g, ' '),
      isSuspected: item.isSuspected ? 'SUSPECTED_RECALL' : 'CONTAINED_IN_BATCH',
      defectReason: options?.defectDescription || 'Batch Quarantine / Suspected Quality Defect',
      severity: options?.severity || 'CRITICAL',
      noticeNumber: options?.noticeNumber || 'QA-RECALL-' + new Date().toISOString().slice(0, 10).replace(/-/g, ''),
      investigatedBy: options?.investigatedBy || 'QA Quality Lead'
    };
  });
}

/**
 * Generates formatted CSV string for QA Containment Recall results.
 * Includes executive summary audit banner and comprehensive tabular records.
 */
export function generateContainmentRecallCSV(
  items: FGProduct[],
  boxes: MotherBox[],
  customers: CustomerMaster[],
  options?: ContainmentExportOptions
): string {
  if (items.length === 0) {
    return 'No records selected for containment export.\n';
  }

  const rows = buildContainmentRecallData(items, boxes, customers, options);

  // Extract batch summary details
  const uniqueBoxes = Array.from(new Set(items.map((i) => i.boxId).filter(Boolean)));
  const uniqueCustomers = Array.from(new Set(rows.map((r) => r.customerName)));
  const uniquePartNumbers = Array.from(new Set(items.map((i) => i.partNumber)));
  const dates = items.map((i) => i.productionDate).sort();
  const minDate = dates[0] || 'N/A';
  const maxDate = dates[dates.length - 1] || 'N/A';
  const exportTimestamp = new Date().toISOString();

  // 1. Executive Summary & Audit Metadata Section
  const metadataLines: string[] = [
    [escapeCSVCell('QUALITY ASSURANCE CONTAINMENT & RECALL AUDIT REPORT'), escapeCSVCell('IATF 16949 / ISO 9001:2015')].join(','),
    [escapeCSVCell('Notice / Reference ID:'), escapeCSVCell(options?.noticeNumber || 'QA-RECALL-' + Date.now())].join(','),
    [escapeCSVCell('Generated At (UTC):'), escapeCSVCell(exportTimestamp)].join(','),
    [escapeCSVCell('Investigated By:'), escapeCSVCell(options?.investigatedBy || 'Lead QA Auditor')].join(','),
    [escapeCSVCell('Severity Classification:'), escapeCSVCell(options?.severity || 'CRITICAL')].join(','),
    [escapeCSVCell('Defect Description:'), escapeCSVCell(options?.defectDescription || 'Batch Integrity Quarantine')].join(','),
    [escapeCSVCell('Production Date Span:'), escapeCSVCell(minDate === maxDate ? minDate : `${minDate} to ${maxDate}`)].join(','),
    [escapeCSVCell('Total Serials Recalled:'), escapeCSVCell(items.length)].join(','),
    [escapeCSVCell('Affected Part Numbers:'), escapeCSVCell(uniquePartNumbers.join(', '))].join(','),
    [escapeCSVCell('Affected Mother Boxes:'), escapeCSVCell(uniqueBoxes.join(', ') || 'None')].join(','),
    [escapeCSVCell('Affected Customer Accounts:'), escapeCSVCell(uniqueCustomers.join(', '))].join(','),
    [escapeCSVCell('Quarantine Instructions:'), escapeCSVCell(options?.quarantineInstructions || 'Immediate quarantine in red bin; halt assembly line use')].join(','),
    '' // Blank separator line
  ];

  // 2. Tabular Column Headers
  const columnHeaders = [
    'Record #',
    'Product Serial Number (Unique FG QR)',
    'Automotive Part Number',
    'Product Description',
    'Production Date',
    'Production Shift',
    'Mother Box ID',
    'Box Capacity (Packed/Cap)',
    'Box Packing Timestamp',
    'Box Packed By',
    'Factory Invoice Number',
    'Factory Dispatch Date',
    'Dispatch Route',
    'Sister Concern Hub',
    'Sister Concern Invoice Number',
    'Sister Concern Dispatch Date',
    'Customer Name',
    'Customer OEM Code',
    'Customer QA Email',
    'Customer Contact Person',
    'Customer Phone',
    'Customer Destination Address',
    'Current Lifecycle Status',
    'Recall Risk Classification',
    'Defect Reason',
    'Severity Level',
    'Containment Notice Number',
    'Lead QA Investigator'
  ];

  const headerLine = columnHeaders.map(escapeCSVCell).join(',');

  // 3. Tabular Data Rows
  const dataLines = rows.map((r) => {
    return [
      escapeCSVCell(r.index),
      escapeCSVCell(r.serialNumber),
      escapeCSVCell(r.partNumber),
      escapeCSVCell(r.productName),
      escapeCSVCell(r.productionDate),
      escapeCSVCell(r.productionShift),
      escapeCSVCell(r.motherBoxId),
      escapeCSVCell(r.boxCapacity),
      escapeCSVCell(r.boxPackedAt),
      escapeCSVCell(r.boxPackedBy),
      escapeCSVCell(r.factoryInvoiceNumber),
      escapeCSVCell(r.factoryDispatchDate),
      escapeCSVCell(r.dispatchRoute),
      escapeCSVCell(r.sisterConcernHub),
      escapeCSVCell(r.sisterConcernInvoiceNumber),
      escapeCSVCell(r.sisterConcernDispatchDate),
      escapeCSVCell(r.customerName),
      escapeCSVCell(r.customerCode),
      escapeCSVCell(r.customerEmail),
      escapeCSVCell(r.customerContact),
      escapeCSVCell(r.customerPhone),
      escapeCSVCell(r.customerAddress),
      escapeCSVCell(r.lifecycleStatus),
      escapeCSVCell(r.isSuspected),
      escapeCSVCell(r.defectReason),
      escapeCSVCell(r.severity),
      escapeCSVCell(r.noticeNumber),
      escapeCSVCell(r.investigatedBy)
    ].join(',');
  });

  // Combine with UTF-8 BOM for seamless Microsoft Excel compatibility
  return '\uFEFF' + [...metadataLines, headerLine, ...dataLines].join('\r\n');
}

/**
 * Client-side file downloader for CSV strings
 */
export function downloadCSVFile(csvContent: string, defaultFilename: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', defaultFilename.endsWith('.csv') ? defaultFilename : `${defaultFilename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export QA Containment Recall results directly to formatted CSV file
 */
export function exportContainmentRecallCSV(
  items: FGProduct[],
  boxes: MotherBox[],
  customers: CustomerMaster[],
  options?: ContainmentExportOptions
): void {
  const csvText = generateContainmentRecallCSV(items, boxes, customers, options);

  const cleanDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const cleanPart = items[0]?.partNumber?.replace(/[^a-zA-Z0-9]/g, '_') || 'BATCH';
  const defaultFilename =
    options?.filename || `QA_Containment_Recall_Report_${cleanPart}_${cleanDate}_${items.length}Units.csv`;

  downloadCSVFile(csvText, defaultFilename);
}

/**
 * Export a historical ContainmentNotice directly to formatted CSV
 */
export function exportHistoricalContainmentNoticeCSV(
  notice: ContainmentNotice,
  fgProducts: FGProduct[],
  boxes: MotherBox[],
  customers: CustomerMaster[]
): void {
  // Find all FG products associated with this notice
  const matchedItems = fgProducts.filter((p) =>
    notice.suspectedSerialNumbers.includes(p.serialNumber)
  );

  // If some are not in fgProducts list, synthesize fallback objects
  const finalItems: FGProduct[] = notice.suspectedSerialNumbers.map((serial) => {
    const existing = matchedItems.find((m) => m.serialNumber === serial);
    if (existing) return existing;

    const parentBox = boxes.find((b) => b.itemSerials.includes(serial));
    return {
      serialNumber: serial,
      productId: parentBox?.productId || 'P-UNKNOWN',
      productName: notice.productName,
      partNumber: notice.partNumber,
      productionDate: notice.issueDate,
      productionShift: 'Shift A',
      boxId: parentBox?.id || notice.affectedBoxIds[0],
      scannedAt: notice.issueDate,
      status: 'QUARANTINED',
      isSuspected: true
    };
  });

  exportContainmentRecallCSV(finalItems, boxes, customers, {
    noticeNumber: notice.noticeNumber,
    defectDescription: notice.defectDescription,
    severity: notice.severity,
    investigatedBy: notice.investigatedBy,
    quarantineInstructions: notice.quarantineInstructions,
    filename: `QA_Recall_Report_${notice.noticeNumber}_${notice.suspectedSerialNumbers.length}Units.csv`
  });
}
