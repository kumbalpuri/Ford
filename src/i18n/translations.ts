export type Language = 'en' | 'de';

export interface Translations {
  // Navigation & Common
  appTitle: string;
  appBadge: string;
  appSubtitle: string;
  masterDataBtn: string;
  languageSelect: string;
  langEn: string;
  langDe: string;
  
  // Workflow strip
  workflowTitle: string;
  step1Short: string;
  step2Short: string;
  step3Short: string;
  step4Short: string;

  // Actor tabs
  actor1Label: string;
  actor1Role: string;
  actor2Label: string;
  actor2Role: string;
  actor3Label: string;
  actor3Role: string;
  actor4Label: string;
  actor4Role: string;

  // Actor 3: Sister Concern (Special focus)
  actor3Badge: string;
  actor3Title: string;
  actor3Subtitle: string;
  actor3HubLocationBadge: string;
  actor3LangIndicator: string;
  actor3ConnectScanner: string;
  actor3Section1Title: string;
  actor3FinalCustomerLabel: string;
  actor3InvoiceNumberLabel: string;
  actor3InvoicePlaceholder: string;
  actor3DispatchDateLabel: string;
  actor3VehicleLabel: string;
  actor3VehiclePlaceholder: string;
  actor3NotesLabel: string;
  actor3NotesPlaceholder: string;
  actor3Section2Title: string;
  actor3BoxesSelectedInfo: string;
  actor3ScanBoxPlaceholder: string;
  actor3AddBoxBtn: string;
  actor3AvailableInventoryTitle: string;
  actor3NoStockMsg: string;
  actor3NoStockSub: string;
  actor3ExecuteDispatchBtn: string;
  actor3RecentDispatchesTitle: string;
  actor3NoDispatchesYet: string;
  actor3ViewPackingListBtn: string;
  actor3BoxAlreadyAdded: string;
  actor3BoxNotFound: string;
  actor3BoxNotAtSisterConcern: string;
  actor3SelectCustomerError: string;
  actor3EnterInvoiceError: string;
  actor3SelectBoxesError: string;

  // Packing list modal & document
  packingListTitle: string;
  packingListSub: string;
  packingListPrintBtn: string;
  packingListCloseBtn: string;
  packingListLangToggle: string;
  packingListLangDe: string;
  packingListLangEn: string;
  packingListLangDual: string;
  docSisterConcernHeader: string;
  docFactoryHeader: string;
  docSisterConcernSub: string;
  docFactorySub: string;
  docOfficialTitle: string;
  docScanVerification: string;
  docConsigneeLabel: string;
  docInvoiceNoLabel: string;
  docDispatchDateLabel: string;
  docDispatchNatureLabel: string;
  docNatureDirect: string;
  docNatureIntercompany: string;
  docNatureSisterConcern: string;
  docVehicleLabel: string;
  docFactoryRefLabel: string;
  docBoxesSerialsTitle: string;
  docBoxesTotalSummary: string;
  docTablePos: string;
  docTableBoxId: string;
  docTableProduct: string;
  docTableQty: string;
  docTableSerials: string;
  docGrandTotal: string;
  docTraceabilityVerified: string;
  docDispatchNotesLabel: string;
  docDefaultNotes: string;
  docPreparedBy: string;
  docAuthStamp: string;
  docFooterNote: string;

  // Actor 1 Packaging
  actor1Badge: string;
  actor1Title: string;
  actor1Subtitle: string;
  actor1SelectProduct: string;
  actor1ProdDate: string;
  actor1ProdShift: string;
  actor1ShiftA: string;
  actor1ShiftB: string;
  actor1ShiftC: string;
  actor1ScanFgSerial: string;
  actor1ScanPlaceholder: string;
  actor1AddSerialBtn: string;
  actor1ConnectScanner: string;
  actor1BoxProgress: string;
  actor1PackedOf: string;
  actor1PackAndGenerateQR: string;
  actor1RecentBoxes: string;
  actor1ViewLabel: string;
  actor1Pieces: string;

  // Actor 2 Factory Dispatch
  actor2Badge: string;
  actor2Title: string;
  actor2Subtitle: string;
  actor2DispatchType: string;
  actor2TypeDirect: string;
  actor2TypeSister: string;
  actor2InvoiceNo: string;
  actor2CustomerRecipient: string;
  actor2SisterConcernHub: string;
  actor2AvailableFactoryStock: string;
  actor2ExecuteDispatch: string;
  actor2RecentFactoryDispatches: string;

  // Actor 4 QA
  actor4Badge: string;
  actor4Title: string;
  actor4Subtitle: string;
  actor4SearchModeSerial: string;
  actor4SearchModeDate: string;
  actor4SearchBtn: string;
  actor4ExportCSV: string;
  actor4IssueNotice: string;
  actor4AuditTrail: string;

  // Footer
  footerStandard: string;
  footerStatus: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    appTitle: 'AUTOTRACE',
    appBadge: 'Automotive FG Traceability',
    appSubtitle: 'End-to-End Serial & Mother QR Dispatch System',
    masterDataBtn: 'Product & Box Capacity Master',
    languageSelect: 'Language',
    langEn: 'English',
    langDe: 'Deutsch',

    workflowTitle: '4-Actor Automotive Traceability Workflow:',
    step1Short: 'Pack & Mother QR',
    step2Short: 'Factory Dispatch (Direct / Sister)',
    step3Short: 'Sister Unit Customer Dispatch',
    step4Short: 'QA Trace & Recall Notice',

    actor1Label: 'Production & Packaging',
    actor1Role: 'Line Operator',
    actor2Label: 'Factory Dispatch',
    actor2Role: 'Customer Marriage',
    actor3Label: 'Sister Concern Store',
    actor3Role: 'Intercompany Hub',
    actor4Label: 'QA & Traceability',
    actor4Role: 'Suspected Containment',

    // Actor 3: Sister Concern
    actor3Badge: 'ACTOR 3',
    actor3Title: 'Intercompany Sister Concern Dispatch Station',
    actor3Subtitle: 'Dedicated store portal: Receive factory transferred boxes, assign to various final customers, and generate automated packing lists.',
    actor3HubLocationBadge: 'Sister Concern Regional Hub (DE / European Logistics)',
    actor3LangIndicator: 'Sister Concern Portal Language:',
    actor3ConnectScanner: 'Connect / Scan Box',
    actor3Section1Title: '1. Customer Assignment & Sister Concern Invoicing',
    actor3FinalCustomerLabel: 'Assign Final Customer Name *',
    actor3InvoiceNumberLabel: 'Sister Concern Invoice / Delivery Note Number *',
    actor3InvoicePlaceholder: 'e.g. SC-INV-2026-9041',
    actor3DispatchDateLabel: 'Dispatch Date',
    actor3VehicleLabel: 'Vehicle / Transporter',
    actor3VehiclePlaceholder: 'e.g. KA-04-E-7890 or Spedition Müller',
    actor3NotesLabel: 'Dispatch Notes / Consignment Remarks',
    actor3NotesPlaceholder: 'Dispatched from Regional Sister Concern Hub to Final OEM Customer',
    actor3Section2Title: '2. Scan Mother Boxes to Dispatch to this Customer',
    actor3BoxesSelectedInfo: '{count} Boxes Selected ({units} FG Pieces)',
    actor3ScanBoxPlaceholder: 'Scan or type Mother Box ID (e.g. BOX-20260901-...)',
    actor3AddBoxBtn: 'Add Box',
    actor3AvailableInventoryTitle: 'Available Sister Concern Inventory ({count} Boxes in Stock)',
    actor3NoStockMsg: 'No boxes currently in Sister Concern Hub stock.',
    actor3NoStockSub: 'Dispatch boxes from Factory (Actor 2) using "Intercompany Sister Concern Transfer" to populate inventory here.',
    actor3ExecuteDispatchBtn: 'Execute Dispatch & Generate Packing List',
    actor3RecentDispatchesTitle: 'Recent Dispatches from Sister Concern Hub',
    actor3NoDispatchesYet: 'No customer dispatches executed from Sister Concern yet.',
    actor3ViewPackingListBtn: 'View Packing List',
    actor3BoxAlreadyAdded: 'Box {id} is already added to this customer dispatch.',
    actor3BoxNotFound: 'Box "{id}" not found in system.',
    actor3BoxNotAtSisterConcern: 'Box {id} is in status "{status}". Only boxes received at Sister Concern Hub can be dispatched here.',
    actor3SelectCustomerError: 'Please select the final customer for this shipment.',
    actor3EnterInvoiceError: 'Please enter the Sister Concern Invoice / Challan Number.',
    actor3SelectBoxesError: 'Please scan or pick at least one box from Sister Concern stock.',

    // Packing List Modal
    packingListTitle: 'Automated Packing List / Dispatch Challan',
    packingListSub: 'Generated automatically upon dispatch completion',
    packingListPrintBtn: 'Print Packing List',
    packingListCloseBtn: 'Close',
    packingListLangToggle: 'Document Language:',
    packingListLangDe: 'German (DE)',
    packingListLangEn: 'English (EN)',
    packingListLangDual: 'Dual (DE / EN)',
    docSisterConcernHeader: 'Sister Concern Hub - Distribution Division',
    docFactoryHeader: 'Automotive Components Manufacturing Ltd.',
    docSisterConcernSub: 'Logistics Center & Regional Hub • Intercompany Distribution Hub • IATF 16949 / VDA 6.1',
    docFactorySub: 'Central Automotive Plant, Industrial Area Phase II • ISO/IATF 16949 Certified Plant',
    docOfficialTitle: 'Official Dispatch Packing List & Traceability Manifest',
    docScanVerification: 'Scan for Verification',
    docConsigneeLabel: 'Consignee / Customer Details:',
    docInvoiceNoLabel: 'Invoice / Challan No:',
    docDispatchDateLabel: 'Dispatch Date:',
    docDispatchNatureLabel: 'Dispatch Nature:',
    docNatureDirect: 'Direct OEM Sale',
    docNatureIntercompany: 'Intercompany Transfer (Factory to Sister Concern)',
    docNatureSisterConcern: 'Sister Concern Dispatch to Customer',
    docVehicleLabel: 'Vehicle / Transporter:',
    docFactoryRefLabel: 'Original Factory Invoice Ref:',
    docBoxesSerialsTitle: 'Dispatched Boxes & FG QR Code Serial Numbers',
    docBoxesTotalSummary: 'Total: {boxes} Boxes ({units} Finished Goods Units)',
    docTablePos: '#',
    docTableBoxId: 'Mother Box QR ID',
    docTableProduct: 'Product Description & Part No',
    docTableQty: 'Packed Qty',
    docTableSerials: 'Enclosed FG QR Serial Numbers',
    docGrandTotal: 'Grand Total Units Dispatched:',
    docTraceabilityVerified: '100% Traceability Verified',
    docDispatchNotesLabel: 'Dispatch Notes / Instructions:',
    docDefaultNotes: 'Ensure careful handling. Fragile precision automotive components. Check mother QR seal integrity on receipt.',
    docPreparedBy: 'Prepared & Checked By',
    docAuthStamp: 'Authorized Logistics Stamp',
    docFooterNote: 'Official Traceability Packing List • IATF 16949 Traceability Standard',

    // Actor 1
    actor1Badge: 'ACTOR 1',
    actor1Title: 'Production Line Packaging & Mother QR Station',
    actor1Subtitle: 'Scan individual finished goods (FG) QR serials into standard mother boxes, then generate and print unique Mother QR labels.',
    actor1SelectProduct: 'Select Product to Pack',
    actor1ProdDate: 'Production Date',
    actor1ProdShift: 'Production Shift',
    actor1ShiftA: 'Shift A (Morning)',
    actor1ShiftB: 'Shift B (Afternoon)',
    actor1ShiftC: 'Shift C (Night)',
    actor1ScanFgSerial: 'Scan / Enter FG QR Serial Number',
    actor1ScanPlaceholder: 'Scan FG QR code (e.g. FG-BRK-20260908-001)',
    actor1AddSerialBtn: 'Add Serial',
    actor1ConnectScanner: 'Connect Camera Scanner',
    actor1BoxProgress: 'Mother Box Filling Progress',
    actor1PackedOf: '{packed} of {capacity} items scanned',
    actor1PackAndGenerateQR: 'Pack Box & Generate Mother QR Label',
    actor1RecentBoxes: 'Recently Packed Mother Boxes',
    actor1ViewLabel: 'View Label',
    actor1Pieces: 'pieces',

    // Actor 2
    actor2Badge: 'ACTOR 2',
    actor2Title: 'Factory Dispatch & Customer Marriage Station',
    actor2Subtitle: 'Select whether to dispatch directly to OEM customers or transfer to the Regional Sister Concern Hub.',
    actor2DispatchType: 'Dispatch Destination Type',
    actor2TypeDirect: 'Direct OEM Customer Sale',
    actor2TypeSister: 'Intercompany Sister Concern Hub Transfer',
    actor2InvoiceNo: 'Factory Invoice / Challan Number',
    actor2CustomerRecipient: 'Customer / Recipient',
    actor2SisterConcernHub: 'Sister Concern Logistics Hub',
    actor2AvailableFactoryStock: 'Available Factory Stock (Packed & Ready)',
    actor2ExecuteDispatch: 'Execute Factory Dispatch & Generate Packing List',
    actor2RecentFactoryDispatches: 'Recent Factory Dispatches',

    // Actor 4
    actor4Badge: 'ACTOR 4',
    actor4Title: 'QA Containment & Traceability Investigation',
    actor4Subtitle: 'Search any individual FG serial number or batch date to retrieve complete parent box, factory dispatch, and intercompany customer genealogy.',
    actor4SearchModeSerial: 'Search by FG QR Serial',
    actor4SearchModeDate: 'Search by Production Date Range',
    actor4SearchBtn: 'Investigate Traceability',
    actor4ExportCSV: 'Export CSV Report',
    actor4IssueNotice: 'Issue Containment Notice',
    actor4AuditTrail: 'Historical Containment Notices (Audit Trail)',

    // Footer
    footerStandard: 'Automotive Finished Goods QR Traceability System • IATF 16949 Compliant',
    footerStatus: 'System Online • Dual Language (EN / DE) Enabled'
  },
  de: {
    appTitle: 'AUTOTRACE',
    appBadge: 'Automobil-Rückverfolgbarkeit (FG)',
    appSubtitle: 'End-to-End Seriennummern- & Umkarton-QR-Versandsystem',
    masterDataBtn: 'Stammdaten: Produkte & Gebindegrößen',
    languageSelect: 'Sprache',
    langEn: 'English',
    langDe: 'Deutsch',

    workflowTitle: '4-Akteure Automobil-Rückverfolgbarkeits-Workflow:',
    step1Short: 'Verpackung & Umkarton-QR',
    step2Short: 'Werksausgang (Direkt / Schwesterunternehmen)',
    step3Short: 'Schwestergesellschaft Warenausgang',
    step4Short: 'QS-Rückverfolgbarkeit & Sperrung',

    actor1Label: 'Produktion & Verpackung',
    actor1Role: 'Linienbediener',
    actor2Label: 'Werksausgang & Versand',
    actor2Role: 'Kundenzuordnung',
    actor3Label: 'Schwesterunternehmen Hub',
    actor3Role: 'Konzerninternes Zwischenlager',
    actor4Label: 'Qualitätssicherung (QS)',
    actor4Role: 'Chargensperrung & Rückruf',

    // Actor 3: Sister Concern (German focus)
    actor3Badge: 'AKTEUR 3',
    actor3Title: 'Konzerninternes Zwischenlager & Auslieferungsstation',
    actor3Subtitle: 'Zentrales Portal der Schwestergesellschaft: Eingang von Werkslieferungen verwalten, an Endabnehmer (OEM) zuweisen und automatisierte Lieferscheine/Packlisten erstellen.',
    actor3HubLocationBadge: 'Schwestergesellschaft Regional-Hub (Niederlassung Deutschland / EU-Logistik)',
    actor3LangIndicator: 'Sprache für Schwesterunternehmen:',
    actor3ConnectScanner: 'Kamera-Scanner verbinden / Scannen',
    actor3Section1Title: '1. Kundenzuweisung & Ausgangsrechnung / Lieferschein',
    actor3FinalCustomerLabel: 'Endkunden zuweisen (OEM) *',
    actor3InvoiceNumberLabel: 'Lieferschein- / Ausgangsrechnungs-Nr. der Schwestergesellschaft *',
    actor3InvoicePlaceholder: 'z.B. SC-INV-2026-9041 oder LS-DE-8821',
    actor3DispatchDateLabel: 'Auslieferungsdatum',
    actor3VehicleLabel: 'Fahrzeug / Spedition',
    actor3VehiclePlaceholder: 'z.B. Spedition Dachser, LKW-S-4890',
    actor3NotesLabel: 'Versandhinweise / Speditionsbemerkungen',
    actor3NotesPlaceholder: 'Warenausgang aus regionalem Schwestergesellschafts-Hub an Endabnehmer (OEM)',
    actor3Section2Title: '2. Mutterkisten (Umkartons) für diesen Kunden scannen',
    actor3BoxesSelectedInfo: '{count} Kisten ausgewählt ({units} Fertigerzeugnisse)',
    actor3ScanBoxPlaceholder: 'Mutterkisten-ID scannen oder eingeben (z.B. BOX-20260901-...)',
    actor3AddBoxBtn: 'Kiste hinzufügen',
    actor3AvailableInventoryTitle: 'Verfügbarer Lagerbestand im Schwesterunternehmen ({count} Kisten am Lager)',
    actor3NoStockMsg: 'Aktuell keine Kisten im Lager der Schwestergesellschaft vorhanden.',
    actor3NoStockSub: 'Versenden Sie Kisten aus dem Werk (Akteur 2) mit der Option "Transfer an Schwesterunternehmen", um den Bestand hier aufzubauen.',
    actor3ExecuteDispatchBtn: 'Warenausgang buchen & Lieferschein erstellen',
    actor3RecentDispatchesTitle: 'Kürzliche Warenausgänge der Schwestergesellschaft',
    actor3NoDispatchesYet: 'Bisher wurden keine Warenausgänge aus dem Schwesterunternehmen gebucht.',
    actor3ViewPackingListBtn: 'Lieferschein / Packliste anzeigen',
    actor3BoxAlreadyAdded: 'Kiste {id} wurde dieser Sendung bereits hinzugefügt.',
    actor3BoxNotFound: 'Kiste "{id}" im System nicht gefunden.',
    actor3BoxNotAtSisterConcern: 'Kiste {id} hat den Status "{status}". Nur Kisten im Lager der Schwestergesellschaft können hier versendet werden.',
    actor3SelectCustomerError: 'Bitte wählen Sie den Endkunden (OEM) für diese Lieferung aus.',
    actor3EnterInvoiceError: 'Bitte geben Sie die Lieferschein-/Rechnungsnummer der Schwestergesellschaft ein.',
    actor3SelectBoxesError: 'Bitte wählen oder scannen Sie mindestens eine Mutterkiste aus dem Lagerbestand.',

    // Packing List Modal
    packingListTitle: 'Automatisierter Lieferschein / Packliste',
    packingListSub: 'Automatisch bei Abschluss des Warenausgangs generiert',
    packingListPrintBtn: 'Packliste drucken',
    packingListCloseBtn: 'Schließen',
    packingListLangToggle: 'Dokumentensprache:',
    packingListLangDe: 'Deutsch (DE)',
    packingListLangEn: 'Englisch (EN)',
    packingListLangDual: 'Zweisprachig (DE / EN)',
    docSisterConcernHeader: 'Schwestergesellschaft Niederlassung Deutschland - Distributionszentrum',
    docFactoryHeader: 'Automotive Komponenten Fertigungswerk GmbH',
    docSisterConcernSub: 'Logistikzentrum Südwest, Industriestraße 12, 70565 Stuttgart • Konzerninternes Distributionszentrum • IATF 16949 / VDA 6.1',
    docFactorySub: 'Zentralwerk für Präzisions-Automobilkomponenten • ISO/IATF 16949 zertifiziertes Werk',
    docOfficialTitle: 'Offizielle Packliste & Rückverfolgbarkeits-Manifest / Dispatch Packing List',
    docScanVerification: 'Scan zur Echtheitsprüfung',
    docConsigneeLabel: 'Warenempfänger / Kundendaten (Consignee):',
    docInvoiceNoLabel: 'Lieferschein-Nr. / Rechnung (Invoice No):',
    docDispatchDateLabel: 'Auslieferungsdatum (Dispatch Date):',
    docDispatchNatureLabel: 'Versandart (Dispatch Nature):',
    docNatureDirect: 'Direktlieferung an OEM-Kunden',
    docNatureIntercompany: 'Konzerninterner Transfer (Werk an Schwesterunternehmen)',
    docNatureSisterConcern: 'Schwestergesellschaft Warenausgang an Endkunden (OEM)',
    docVehicleLabel: 'Fahrzeug / Spedition (Transporter):',
    docFactoryRefLabel: 'Ursprüngliche Werksrechnung (Factory Ref):',
    docBoxesSerialsTitle: 'Versendete Mutterkisten & FG-QR-Einzelseriennummern',
    docBoxesTotalSummary: 'Gesamt: {boxes} Kisten ({units} Fertigerzeugnisse)',
    docTablePos: 'Pos.',
    docTableBoxId: 'Mutterkisten-QR-ID (Box ID)',
    docTableProduct: 'Produktbezeichnung & Sachnummer (Part No)',
    docTableQty: 'Menge (Qty)',
    docTableSerials: 'Enthaltene FG-Einzelseriennummern (QR Serials)',
    docGrandTotal: 'Gesamtmenge versendet (Total Units):',
    docTraceabilityVerified: '100% lückenlose Rückverfolgbarkeit geprüft (IATF 16949)',
    docDispatchNotesLabel: 'Versandhinweise / Instruktionen (Dispatch Notes):',
    docDefaultNotes: 'Präzisions-Automobilteile. Vorsichtig behandeln. Unversehrtheit des Mutter-QR-Siegels bei Anlieferung prüfen.',
    docPreparedBy: 'Erstellt & Geprüft durch (Prepared By)',
    docAuthStamp: 'Logistik-Freigabestempel (Authorized Stamp)',
    docFooterNote: 'Offizielles Rückverfolgbarkeits-Dokument • Entspricht VDA 4913 & IATF 16949 Standard',

    // Actor 1
    actor1Badge: 'AKTEUR 1',
    actor1Title: 'Produktionslinie: Verpackung & Mutter-QR-Station',
    actor1Subtitle: 'Scannen Sie fertige Bauteile (FG) in standardisierte Mutterkisten ein und drucken Sie den Mutter-QR-Aufkleber nach Erreichen der Sollkapazität.',
    actor1SelectProduct: 'Zu verpackendes Produkt auswählen',
    actor1ProdDate: 'Produktionsdatum',
    actor1ProdShift: 'Produktionsschicht',
    actor1ShiftA: 'Frühschicht (Schicht A)',
    actor1ShiftB: 'Spätschicht (Schicht B)',
    actor1ShiftC: 'Nachtschicht (Schicht C)',
    actor1ScanFgSerial: 'FG-QR-Seriennummer scannen / eingeben',
    actor1ScanPlaceholder: 'FG-QR-Code scannen (z.B. FG-BRK-20260908-001)',
    actor1AddSerialBtn: 'Seriennr. hinzufügen',
    actor1ConnectScanner: 'Kamera-Scanner verbinden',
    actor1BoxProgress: 'Befüllungsgrad der Mutterkiste',
    actor1PackedOf: '{packed} von {capacity} Artikeln gescannt',
    actor1PackAndGenerateQR: 'Kiste abschließen & Mutter-QR generieren',
    actor1RecentBoxes: 'Kürzlich gepackte Mutterkisten',
    actor1ViewLabel: 'Etikett anzeigen',
    actor1Pieces: 'Stück',

    // Actor 2
    actor2Badge: 'AKTEUR 2',
    actor2Title: 'Werksausgang & Versandstation',
    actor2Subtitle: 'Wählen Sie, ob direkt an OEM-Kunden versendet wird oder ein konzerninterner Transfer an die Schwestergesellschaft erfolgt.',
    actor2DispatchType: 'Versandziel-Typ',
    actor2TypeDirect: 'Direktverkauf an OEM-Kunden',
    actor2TypeSister: 'Konzerninterner Transfer (an Schwestergesellschaft)',
    actor2InvoiceNo: 'Werks-Lieferschein- / Rechnungsnummer',
    actor2CustomerRecipient: 'Kunde / Empfänger',
    actor2SisterConcernHub: 'Logistik-Hub der Schwestergesellschaft',
    actor2AvailableFactoryStock: 'Verfügbarer Werksbestand (Verpackt & Versandbereit)',
    actor2ExecuteDispatch: 'Werksausgang buchen & Lieferschein erstellen',
    actor2RecentFactoryDispatches: 'Kürzliche Werksausgänge',

    // Actor 4
    actor4Badge: 'AKTEUR 4',
    actor4Title: 'QS-Chargenrückverfolgung & Sperrmanagement',
    actor4Subtitle: 'Suchen Sie nach einer einzelnen Seriennummer oder einem Produktionszeitraum, um den gesamten Weg über Werksausgang, Schwesterunternehmen und Kunde nachzuvollziehen.',
    actor4SearchModeSerial: 'Suche nach FG-Seriennummer',
    actor4SearchModeDate: 'Suche nach Produktionsdatum',
    actor4SearchBtn: 'Rückverfolgung starten',
    actor4ExportCSV: 'CSV-Prüfbericht exportieren',
    actor4IssueNotice: 'Sperrmitteilung / Rückruf versenden',
    actor4AuditTrail: 'Historische Sperrmitteilungen (Audit-Trail)',

    // Footer
    footerStandard: 'Automobil-Rückverfolgbarkeitssystem für Fertigerzeugnisse • IATF 16949 / VDA 6.1 konform',
    footerStatus: 'System bereit • Zweisprachig (Deutsch / Englisch) aktiv'
  }
};
