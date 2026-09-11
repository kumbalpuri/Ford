import { ProductMaster, CustomerMaster, MotherBox, FGProduct, DispatchBatch, SisterConcernDispatchBatch } from './types';

export const INITIAL_PRODUCTS: ProductMaster[] = [
  {
    id: 'PROD-001',
    partNumber: 'AUTO-BRK-402',
    name: 'Disc Brake Caliper Assembly - Front LH',
    category: 'Braking Systems',
    boxCapacity: 4,
    unit: 'Pieces',
    weightKg: 3.4,
    description: 'High-performance hydraulic disc brake caliper with composite piston'
  },
  {
    id: 'PROD-002',
    partNumber: 'AUTO-FP-108',
    name: 'High Pressure Electronic Fuel Pump 12V',
    category: 'Fuel Systems',
    boxCapacity: 2,
    unit: 'Pieces',
    weightKg: 1.8,
    description: 'Direct injection electric fuel pump module with integrated filter'
  },
  {
    id: 'PROD-003',
    partNumber: 'AUTO-STR-890',
    name: 'Forged Steering Knuckle Hub Assembly',
    category: 'Steering & Suspension',
    boxCapacity: 6,
    unit: 'Pieces',
    weightKg: 5.2,
    description: 'Precision machined alloy steel knuckle for front passenger axle'
  },
  {
    id: 'PROD-004',
    partNumber: 'AUTO-ALT-550',
    name: 'Heavy Duty Alternator 14V 120A',
    category: 'Electricals',
    boxCapacity: 2,
    unit: 'Pieces',
    weightKg: 6.5,
    description: 'Brushless dual-internal-fan alternator for commercial automotive'
  },
  {
    id: 'PROD-005',
    partNumber: 'AUTO-TC-330',
    name: 'Electronic Turbocharger Actuator VNT',
    category: 'Powertrain',
    boxCapacity: 5,
    unit: 'Pieces',
    weightKg: 1.1,
    description: 'Stepper motor driven smart electronic boost control actuator'
  }
];

export const INITIAL_CUSTOMERS: CustomerMaster[] = [
  {
    id: 'CUST-001',
    name: 'Apex Motors OEM Plant (Pune)',
    code: 'OEM-APEX-01',
    email: 'qa.logistics@apexmotors.example.com',
    address: 'Plot 45, MIDC Industrial Area, Chakan, Pune 410501',
    city: 'Pune',
    contactPerson: 'Rajesh Sharma (Head of Incoming QA)',
    phone: '+91 98230 11223',
    isSisterConcern: false
  },
  {
    id: 'CUST-002',
    name: 'Bharat Dynamics Commercial Vehicles',
    code: 'OEM-BDCV-02',
    email: 'receipts.inward@bharatdynamics.example.com',
    address: 'Sector 8, Auto Corridor, Sriperumbudur, Tamil Nadu 602105',
    city: 'Chennai',
    contactPerson: 'Anand Krishnan (Plant QA Manager)',
    phone: '+91 94440 98765',
    isSisterConcern: false
  },
  {
    id: 'CUST-003',
    name: 'Horizon Auto Sister Concern GmbH (Stuttgart & Intercompany Hub)',
    code: 'SIS-DE-01',
    email: 'logistik.stuttgart@horizon-sisterconcern.de',
    address: 'Industriestraße 12, 70565 Stuttgart, Deutschland',
    city: 'Stuttgart',
    contactPerson: 'Klaus Weber (Leiter Warenausgang & Logistik)',
    phone: '+49 711 4902-880',
    isSisterConcern: true
  },
  {
    id: 'CUST-004',
    name: 'Nexus Auto Tier-1 Assembly (Bengaluru)',
    code: 'OEM-NX-04',
    email: 'supplychain@nexusauto.example.com',
    address: 'Peenya 4th Phase, Bengaluru, Karnataka 560058',
    city: 'Bengaluru',
    contactPerson: 'Vikram Mehta (Quality Assurance)',
    phone: '+91 98450 76543',
    isSisterConcern: false
  },
  {
    id: 'CUST-005',
    name: 'Bavaria OEM Automobilwerk (München / Dingolfing)',
    code: 'OEM-BAV-05',
    email: 'wareneingang.qs@bavaria-oem.de',
    address: 'Werksallee 1, 84130 Dingolfing / München, Deutschland',
    city: 'München',
    contactPerson: 'Dr. Stefan Schneider (Leiter Wareneingangs-QS)',
    phone: '+49 89 382-0199',
    isSisterConcern: false
  }
];

export const INITIAL_PRODUCTS_FG: FGProduct[] = [
  // Box 1 items (Direct Sale to Apex Motors)
  {
    serialNumber: 'FG-BRK-20260901-001',
    productId: 'PROD-001',
    productName: 'Disc Brake Caliper Assembly - Front LH',
    partNumber: 'AUTO-BRK-402',
    productionDate: '2026-09-01',
    productionShift: 'Shift A',
    boxId: 'BOX-20260901-BRK-001',
    scannedAt: '2026-09-01 09:14:20',
    status: 'DISPATCHED_DIRECT'
  },
  {
    serialNumber: 'FG-BRK-20260901-002',
    productId: 'PROD-001',
    productName: 'Disc Brake Caliper Assembly - Front LH',
    partNumber: 'AUTO-BRK-402',
    productionDate: '2026-09-01',
    productionShift: 'Shift A',
    boxId: 'BOX-20260901-BRK-001',
    scannedAt: '2026-09-01 09:15:02',
    status: 'DISPATCHED_DIRECT'
  },
  {
    serialNumber: 'FG-BRK-20260901-003',
    productId: 'PROD-001',
    productName: 'Disc Brake Caliper Assembly - Front LH',
    partNumber: 'AUTO-BRK-402',
    productionDate: '2026-09-01',
    productionShift: 'Shift A',
    boxId: 'BOX-20260901-BRK-001',
    scannedAt: '2026-09-01 09:15:45',
    status: 'DISPATCHED_DIRECT'
  },
  {
    serialNumber: 'FG-BRK-20260901-004',
    productId: 'PROD-001',
    productName: 'Disc Brake Caliper Assembly - Front LH',
    partNumber: 'AUTO-BRK-402',
    productionDate: '2026-09-01',
    productionShift: 'Shift A',
    boxId: 'BOX-20260901-BRK-001',
    scannedAt: '2026-09-01 09:16:10',
    status: 'DISPATCHED_DIRECT'
  },

  // Box 2 items (Dispatched to Sister Concern -> Final Customer Nexus Auto)
  {
    serialNumber: 'FG-FP-20260902-101',
    productId: 'PROD-002',
    productName: 'High Pressure Electronic Fuel Pump 12V',
    partNumber: 'AUTO-FP-108',
    productionDate: '2026-09-02',
    productionShift: 'Shift B',
    boxId: 'BOX-20260902-FP-002',
    scannedAt: '2026-09-02 14:10:10',
    status: 'DELIVERED_TO_CUSTOMER'
  },
  {
    serialNumber: 'FG-FP-20260902-102',
    productId: 'PROD-002',
    productName: 'High Pressure Electronic Fuel Pump 12V',
    partNumber: 'AUTO-FP-108',
    productionDate: '2026-09-02',
    productionShift: 'Shift B',
    boxId: 'BOX-20260902-FP-002',
    scannedAt: '2026-09-02 14:10:55',
    status: 'DELIVERED_TO_CUSTOMER'
  },

  // Box 3 items (At Sister Concern, awaiting final customer dispatch)
  {
    serialNumber: 'FG-TC-20260903-201',
    productId: 'PROD-005',
    productName: 'Electronic Turbocharger Actuator VNT',
    partNumber: 'AUTO-TC-330',
    productionDate: '2026-09-03',
    productionShift: 'Shift A',
    boxId: 'BOX-20260903-TC-003',
    scannedAt: '2026-09-03 10:20:00',
    status: 'DISPATCHED_TO_SISTER_CONCERN'
  },
  {
    serialNumber: 'FG-TC-20260903-202',
    productId: 'PROD-005',
    productName: 'Electronic Turbocharger Actuator VNT',
    partNumber: 'AUTO-TC-330',
    productionDate: '2026-09-03',
    productionShift: 'Shift A',
    boxId: 'BOX-20260903-TC-003',
    scannedAt: '2026-09-03 10:20:30',
    status: 'DISPATCHED_TO_SISTER_CONCERN'
  },
  {
    serialNumber: 'FG-TC-20260903-203',
    productId: 'PROD-005',
    productName: 'Electronic Turbocharger Actuator VNT',
    partNumber: 'AUTO-TC-330',
    productionDate: '2026-09-03',
    productionShift: 'Shift A',
    boxId: 'BOX-20260903-TC-003',
    scannedAt: '2026-09-03 10:21:05',
    status: 'DISPATCHED_TO_SISTER_CONCERN'
  },
  {
    serialNumber: 'FG-TC-20260903-204',
    productId: 'PROD-005',
    productName: 'Electronic Turbocharger Actuator VNT',
    partNumber: 'AUTO-TC-330',
    productionDate: '2026-09-03',
    productionShift: 'Shift A',
    boxId: 'BOX-20260903-TC-003',
    scannedAt: '2026-09-03 10:21:40',
    status: 'DISPATCHED_TO_SISTER_CONCERN'
  },
  {
    serialNumber: 'FG-TC-20260903-205',
    productId: 'PROD-005',
    productName: 'Electronic Turbocharger Actuator VNT',
    partNumber: 'AUTO-TC-330',
    productionDate: '2026-09-03',
    productionShift: 'Shift A',
    boxId: 'BOX-20260903-TC-003',
    scannedAt: '2026-09-03 10:22:15',
    status: 'DISPATCHED_TO_SISTER_CONCERN'
  },

  // Box 4 items (Ready in stock, awaiting Actor 2 dispatch)
  {
    serialNumber: 'FG-ALT-20260908-301',
    productId: 'PROD-004',
    productName: 'Heavy Duty Alternator 14V 120A',
    partNumber: 'AUTO-ALT-550',
    productionDate: '2026-09-08',
    productionShift: 'Shift A',
    boxId: 'BOX-20260908-ALT-004',
    scannedAt: '2026-09-08 07:45:10',
    status: 'PACKED'
  },
  {
    serialNumber: 'FG-ALT-20260908-302',
    productId: 'PROD-004',
    productName: 'Heavy Duty Alternator 14V 120A',
    partNumber: 'AUTO-ALT-550',
    productionDate: '2026-09-08',
    productionShift: 'Shift A',
    boxId: 'BOX-20260908-ALT-004',
    scannedAt: '2026-09-08 07:46:00',
    status: 'PACKED'
  }
];

export const INITIAL_BOXES: MotherBox[] = [
  {
    id: 'BOX-20260901-BRK-001',
    productId: 'PROD-001',
    productName: 'Disc Brake Caliper Assembly - Front LH',
    partNumber: 'AUTO-BRK-402',
    boxCapacity: 4,
    productionDate: '2026-09-01',
    packedAt: '2026-09-01 09:16:15',
    packedBy: 'Operator Suresh K.',
    itemSerials: [
      'FG-BRK-20260901-001',
      'FG-BRK-20260901-002',
      'FG-BRK-20260901-003',
      'FG-BRK-20260901-004'
    ],
    status: 'DISPATCHED_DIRECT',
    dispatchType: 'DIRECT_SALE',
    factoryInvoiceNumber: 'SAP-INV-98102',
    factoryDispatchDate: '2026-09-01',
    initialRecipientId: 'CUST-001',
    initialRecipientName: 'Apex Motors OEM Plant (Pune)'
  },
  {
    id: 'BOX-20260902-FP-002',
    productId: 'PROD-002',
    productName: 'High Pressure Electronic Fuel Pump 12V',
    partNumber: 'AUTO-FP-108',
    boxCapacity: 2,
    productionDate: '2026-09-02',
    packedAt: '2026-09-02 14:11:00',
    packedBy: 'Operator Ramesh P.',
    itemSerials: [
      'FG-FP-20260902-101',
      'FG-FP-20260902-102'
    ],
    status: 'DISPATCHED_FINAL_CUSTOMER',
    dispatchType: 'SISTER_CONCERN',
    factoryInvoiceNumber: 'SAP-IC-77401',
    factoryDispatchDate: '2026-09-02',
    initialRecipientId: 'CUST-003',
    initialRecipientName: 'Horizon Auto Logistics & Sister Unit (Ahmedabad)',
    sisterConcernInvoiceNumber: 'SC-INV-2026-8802',
    sisterConcernDispatchDate: '2026-09-04',
    finalCustomerId: 'CUST-004',
    finalCustomerName: 'Nexus Auto Tier-1 Assembly (Bengaluru)',
    finalCustomerEmail: 'supplychain@nexusauto.example.com'
  },
  {
    id: 'BOX-20260903-TC-003',
    productId: 'PROD-005',
    productName: 'Electronic Turbocharger Actuator VNT',
    partNumber: 'AUTO-TC-330',
    boxCapacity: 5,
    productionDate: '2026-09-03',
    packedAt: '2026-09-03 10:22:20',
    packedBy: 'Operator Amit M.',
    itemSerials: [
      'FG-TC-20260903-201',
      'FG-TC-20260903-202',
      'FG-TC-20260903-203',
      'FG-TC-20260903-204',
      'FG-TC-20260903-205'
    ],
    status: 'AT_SISTER_CONCERN',
    dispatchType: 'SISTER_CONCERN',
    factoryInvoiceNumber: 'SAP-IC-77402',
    factoryDispatchDate: '2026-09-03',
    initialRecipientId: 'CUST-003',
    initialRecipientName: 'Horizon Auto Logistics & Sister Unit (Ahmedabad)'
  },
  {
    id: 'BOX-20260907-STR-005',
    productId: 'PROD-003',
    productName: 'Forged Steering Knuckle Hub Assembly',
    partNumber: 'AUTO-STR-890',
    boxCapacity: 6,
    productionDate: '2026-09-07',
    packedAt: '2026-09-07 16:30:00',
    packedBy: 'Operator Suresh K.',
    itemSerials: [
      'FG-STR-20260907-401',
      'FG-STR-20260907-402',
      'FG-STR-20260907-403',
      'FG-STR-20260907-404',
      'FG-STR-20260907-405',
      'FG-STR-20260907-406'
    ],
    status: 'IN_TRANSIT_SISTER_CONCERN',
    dispatchType: 'SISTER_CONCERN',
    factoryInvoiceNumber: 'SAP-IC-77405',
    factoryDispatchDate: '2026-09-07',
    initialRecipientId: 'CUST-003',
    initialRecipientName: 'Horizon Auto Logistics & Sister Unit (Ahmedabad)'
  },
  {
    id: 'BOX-20260908-ALT-004',
    productId: 'PROD-004',
    productName: 'Heavy Duty Alternator 14V 120A',
    partNumber: 'AUTO-ALT-550',
    boxCapacity: 2,
    productionDate: '2026-09-08',
    packedAt: '2026-09-08 07:46:10',
    packedBy: 'Operator Dinesh G.',
    itemSerials: [
      'FG-ALT-20260908-301',
      'FG-ALT-20260908-302'
    ],
    status: 'PACKED_IN_STOCK'
  }
];

export const INITIAL_DISPATCHES: DispatchBatch[] = [
  {
    id: 'DISP-001',
    invoiceNumber: 'SAP-INV-98102',
    dispatchType: 'DIRECT_SALE',
    dispatchDate: '2026-09-01',
    customerId: 'CUST-001',
    customerName: 'Apex Motors OEM Plant (Pune)',
    customerEmail: 'qa.logistics@apexmotors.example.com',
    customerAddress: 'Plot 45, MIDC Industrial Area, Chakan, Pune 410501',
    boxIds: ['BOX-20260901-BRK-001'],
    vehicleNumber: 'MH-12-RN-4890',
    notes: 'Direct OEM delivery for Line 2 Braking module assembly',
    createdBy: 'Dispatch Supervisor Manoj',
    createdAt: '2026-09-01 11:30:00'
  },
  {
    id: 'DISP-002',
    invoiceNumber: 'SAP-IC-77401',
    dispatchType: 'SISTER_CONCERN',
    dispatchDate: '2026-09-02',
    customerId: 'CUST-003',
    customerName: 'Horizon Auto Logistics & Sister Unit (Ahmedabad)',
    customerEmail: 'hub.dispatch@horizon-sisterunit.example.com',
    customerAddress: 'Sanand Industrial Estate, GIDC Phase II, Ahmedabad 382110',
    boxIds: ['BOX-20260902-FP-002', 'BOX-20260903-TC-003'],
    vehicleNumber: 'GJ-01-CV-7821',
    notes: 'Intercompany stock transfer for Western/Southern regional distribution',
    createdBy: 'Dispatch Supervisor Manoj',
    createdAt: '2026-09-03 12:00:00'
  },
  {
    id: 'DISP-003',
    invoiceNumber: 'SAP-IC-77405',
    dispatchType: 'SISTER_CONCERN',
    dispatchDate: '2026-09-07',
    customerId: 'CUST-003',
    customerName: 'Horizon Auto Logistics & Sister Unit (Ahmedabad)',
    customerEmail: 'hub.dispatch@horizon-sisterunit.example.com',
    customerAddress: 'Sanand Industrial Estate, GIDC Phase II, Ahmedabad 382110',
    boxIds: ['BOX-20260907-STR-005'],
    vehicleNumber: 'MH-12-TR-9002',
    notes: 'Intercompany dispatch in transit. Awaiting arrival scan at Sister Concern.',
    createdBy: 'Dispatch Supervisor Manoj',
    createdAt: '2026-09-07 17:00:00'
  }
];

export const INITIAL_SC_DISPATCHES: SisterConcernDispatchBatch[] = [
  {
    id: 'SCDISP-001',
    scInvoiceNumber: 'SC-INV-2026-8802',
    factoryInvoiceReference: 'SAP-IC-77401',
    dispatchDate: '2026-09-04',
    finalCustomerId: 'CUST-004',
    finalCustomerName: 'Nexus Auto Tier-1 Assembly (Bengaluru)',
    finalCustomerEmail: 'supplychain@nexusauto.example.com',
    finalCustomerAddress: 'Peenya 4th Phase, Bengaluru, Karnataka 560058',
    boxIds: ['BOX-20260902-FP-002'],
    vehicleNumber: 'KA-04-E-3399',
    notes: 'Dispatched from Sister Concern Ahmedabad Hub to Bengaluru OEM',
    createdBy: 'Store In-charge Karan Patel',
    createdAt: '2026-09-04 15:45:00'
  }
];

export const INITIAL_AUDIT_LOGS = [
  {
    id: 'AUD-001',
    timestamp: '2026-09-01 09:16:15',
    actionType: 'BOX_PACKED' as const,
    actionTitle: 'Mother Box Sealed & Packaged',
    actor: 'Operator Suresh K.',
    stage: 'STATION_1_PACKAGING' as const,
    stageName: 'Station 1: Packaging',
    entityId: 'BOX-20260901-BRK-001',
    entityType: 'BOX' as const,
    description: 'Mother Box BOX-20260901-BRK-001 packed with 4 FG units of Disc Brake Caliper Assembly (AUTO-BRK-402).',
    statusAfter: 'In Warehouse',
    location: 'Takwe Plant Line 1'
  },
  {
    id: 'AUD-002',
    timestamp: '2026-09-01 11:30:00',
    actionType: 'FACTORY_DISPATCH_DIRECT' as const,
    actionTitle: 'Factory Direct OEM Dispatch',
    actor: 'Dispatch Supervisor Manoj',
    stage: 'STATION_2_FACTORY_DISPATCH' as const,
    stageName: 'Station 2: Factory Dispatch',
    entityId: 'SAP-INV-98102',
    entityType: 'DISPATCH' as const,
    description: 'Direct OEM dispatch confirmed under SAP Invoice SAP-INV-98102 to Apex Motors OEM Plant (Pune). Vehicle: MH-12-RN-4890.',
    statusAfter: 'In Transit / Delivered to Customer',
    location: 'Takwe Plant Outbound Dock'
  },
  {
    id: 'AUD-003',
    timestamp: '2026-09-02 14:11:00',
    actionType: 'BOX_PACKED' as const,
    actionTitle: 'Mother Box Sealed & Packaged',
    actor: 'Operator Ramesh P.',
    stage: 'STATION_1_PACKAGING' as const,
    stageName: 'Station 1: Packaging',
    entityId: 'BOX-20260902-FP-002',
    entityType: 'BOX' as const,
    description: 'Mother Box BOX-20260902-FP-002 packed with 2 FG units of High Pressure Electronic Fuel Pump 12V (AUTO-FP-108).',
    statusAfter: 'In Warehouse',
    location: 'Takwe Plant Line 2'
  },
  {
    id: 'AUD-004',
    timestamp: '2026-09-03 10:22:20',
    actionType: 'BOX_PACKED' as const,
    actionTitle: 'Mother Box Sealed & Packaged',
    actor: 'Operator Amit M.',
    stage: 'STATION_1_PACKAGING' as const,
    stageName: 'Station 1: Packaging',
    entityId: 'BOX-20260903-TC-003',
    entityType: 'BOX' as const,
    description: 'Mother Box BOX-20260903-TC-003 packed with 5 FG units of Electronic Turbocharger Actuator (AUTO-TC-330).',
    statusAfter: 'In Warehouse',
    location: 'Takwe Plant Line 3'
  },
  {
    id: 'AUD-005',
    timestamp: '2026-09-03 12:00:00',
    actionType: 'FACTORY_DISPATCH_INTERCOMPANY' as const,
    actionTitle: 'Intercompany Dispatch to Sister Concern',
    actor: 'Dispatch Supervisor Manoj',
    stage: 'STATION_2_FACTORY_DISPATCH' as const,
    stageName: 'Station 2: Factory Dispatch',
    entityId: 'SAP-IC-77401',
    entityType: 'DISPATCH' as const,
    description: 'Intercompany transfer confirmed under SAP Invoice SAP-IC-77401 to Sister Concern (Ahmedabad Hub). 2 Mother boxes dispatched.',
    statusAfter: 'In Transit',
    location: 'Takwe Plant Outbound Dock'
  },
  {
    id: 'AUD-006',
    timestamp: '2026-09-03 18:40:00',
    actionType: 'SISTER_CONCERN_RECEIVED' as const,
    actionTitle: 'Intake Scanned at Sister Concern',
    actor: 'Store In-charge Karan Patel',
    stage: 'STATION_3_SISTER_CONCERN' as const,
    stageName: 'Station 3: Sister Concern',
    entityId: 'BOX-20260903-TC-003',
    entityType: 'BOX' as const,
    description: 'Mother Box BOX-20260903-TC-003 scanned upon arrival at Sister Concern distribution warehouse.',
    statusAfter: 'In Warehouse of Sister Concern',
    location: 'Sister Concern Ahmedabad Hub'
  },
  {
    id: 'AUD-007',
    timestamp: '2026-09-04 15:45:00',
    actionType: 'SISTER_CONCERN_DISPATCH' as const,
    actionTitle: 'Outbound Dispatch to OEM Customer',
    actor: 'Store In-charge Karan Patel',
    stage: 'STATION_3_SISTER_CONCERN' as const,
    stageName: 'Station 3: Sister Concern',
    entityId: 'SC-INV-2026-8802',
    entityType: 'SC_DISPATCH' as const,
    description: 'Sister Concern delivery note SC-INV-2026-8802 confirmed to Nexus Auto Tier-1 Assembly (Bengaluru).',
    statusAfter: 'In Transit / Delivered to Customer',
    location: 'Sister Concern Ahmedabad Hub'
  },
  {
    id: 'AUD-008',
    timestamp: '2026-09-07 17:00:00',
    actionType: 'FACTORY_DISPATCH_INTERCOMPANY' as const,
    actionTitle: 'Intercompany Dispatch in Transit',
    actor: 'Dispatch Supervisor Manoj',
    stage: 'STATION_2_FACTORY_DISPATCH' as const,
    stageName: 'Station 2: Factory Dispatch',
    entityId: 'SAP-IC-77405',
    entityType: 'DISPATCH' as const,
    description: 'Intercompany shipment under Invoice SAP-IC-77405 dispatched in truck MH-12-TR-9002. Currently in transit.',
    statusAfter: 'In Transit',
    location: 'Takwe Plant Outbound Dock'
  },
  {
    id: 'AUD-009',
    timestamp: '2026-09-08 07:46:10',
    actionType: 'BOX_PACKED' as const,
    actionTitle: 'Mother Box Sealed & Packaged',
    actor: 'Operator Dinesh G.',
    stage: 'STATION_1_PACKAGING' as const,
    stageName: 'Station 1: Packaging',
    entityId: 'BOX-20260908-ALT-004',
    entityType: 'BOX' as const,
    description: 'Mother Box BOX-20260908-ALT-004 packed with 2 FG units of Heavy Duty Alternator (AUTO-ALT-550). Stored in factory stock.',
    statusAfter: 'In Warehouse',
    location: 'Takwe Plant Line 1'
  }
];

