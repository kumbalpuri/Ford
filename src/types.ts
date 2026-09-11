export interface ProductMaster {
  id: string;
  partNumber: string;
  name: string;
  category: string;
  boxCapacity: number;
  unit: string;
  weightKg: number;
  description: string;
}

export interface CustomerMaster {
  id: string;
  name: string;
  code: string;
  email: string;
  address: string;
  city: string;
  contactPerson: string;
  phone: string;
  isSisterConcern?: boolean;
}

export type FGProductStatus = 'PACKED' | 'DISPATCHED_DIRECT' | 'DISPATCHED_TO_SISTER_CONCERN' | 'DELIVERED_TO_CUSTOMER' | 'QUARANTINED';

export interface FGProduct {
  serialNumber: string; // Unique QR code on product
  productId: string;
  productName: string;
  partNumber: string;
  productionDate: string; // YYYY-MM-DD
  productionShift: 'Shift A' | 'Shift B' | 'Shift C';
  boxId?: string; // Mother QR Box ID
  scannedAt: string;
  status: FGProductStatus;
  isSuspected?: boolean;
}

export type BoxStatus = 'PACKED_IN_STOCK' | 'DISPATCHED_DIRECT' | 'IN_TRANSIT_SISTER_CONCERN' | 'AT_SISTER_CONCERN' | 'DISPATCHED_FINAL_CUSTOMER';

export interface MotherBox {
  id: string; // Mother QR code: e.g. "BOX-20260908-BRK-001"
  productId: string;
  productName: string;
  partNumber: string;
  boxCapacity: number;
  productionDate: string;
  packedAt: string;
  packedBy: string;
  itemSerials: string[]; // List of FG QR codes in this box
  status: BoxStatus;
  
  // Factory Dispatch Details (Actor 2)
  dispatchType?: 'DIRECT_SALE' | 'SISTER_CONCERN';
  factoryInvoiceNumber?: string;
  factoryDispatchDate?: string;
  initialRecipientId?: string;
  initialRecipientName?: string;
  
  // Sister Concern Dispatch Details (Actor 3)
  sisterConcernInvoiceNumber?: string;
  sisterConcernDispatchDate?: string;
  finalCustomerId?: string;
  finalCustomerName?: string;
  finalCustomerEmail?: string;
}

export interface DispatchBatch {
  id: string;
  invoiceNumber: string;
  dispatchType: 'DIRECT_SALE' | 'SISTER_CONCERN';
  dispatchDate: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerAddress: string;
  boxIds: string[];
  vehicleNumber?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface SisterConcernDispatchBatch {
  id: string;
  scInvoiceNumber: string;
  factoryInvoiceReference?: string;
  dispatchDate: string;
  finalCustomerId: string;
  finalCustomerName: string;
  finalCustomerEmail: string;
  finalCustomerAddress: string;
  boxIds: string[];
  vehicleNumber?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface ContainmentNotice {
  id: string;
  noticeNumber: string;
  issueDate: string;
  defectDescription: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MODERATE';
  investigatedBy: string;
  targetCustomerName: string;
  targetCustomerEmail: string;
  suspectedSerialNumbers: string[];
  affectedBoxIds: string[];
  productName: string;
  partNumber: string;
  factoryInvoiceNumber?: string;
  quarantineInstructions: string;
  status: 'SENT' | 'ACKNOWLEDGED';
}

export type AuditActionType =
  | 'BOX_PACKED'
  | 'ITEM_SCANNED'
  | 'FACTORY_DISPATCH_DIRECT'
  | 'FACTORY_DISPATCH_INTERCOMPANY'
  | 'DISPATCH_BOXES_ADDED'
  | 'SISTER_CONCERN_RECEIVED'
  | 'SISTER_CONCERN_DISPATCH'
  | 'SC_DISPATCH_BOXES_ADDED'
  | 'QA_CONTAINMENT_ISSUED'
  | 'PRODUCT_CREATED'
  | 'PRODUCT_UPDATED'
  | 'PRODUCT_DELETED'
  | 'CUSTOMER_CREATED'
  | 'CUSTOMER_UPDATED'
  | 'SYSTEM_RESET';

export interface AuditLogEntry {
  id: string;
  timestamp: string; // Formatted 'YYYY-MM-DD HH:mm:ss'
  actionType: AuditActionType;
  actionTitle: string;
  actor: string;
  stage: 'STATION_1_PACKAGING' | 'STATION_2_FACTORY_DISPATCH' | 'STATION_3_SISTER_CONCERN' | 'STATION_4_QA_RECALL' | 'MASTER_DATA';
  stageName: string;
  entityId: string;
  entityType: 'BOX' | 'DISPATCH' | 'SC_DISPATCH' | 'NOTICE' | 'PRODUCT' | 'CUSTOMER' | 'SYSTEM' | 'ITEM';
  description: string;
  statusAfter: string;
  details?: Record<string, any>;
  location?: string;
}

export const BOX_STATUS_CONFIG: Record<
  BoxStatus,
  {
    label: string;
    labelEn: string;
    labelDe: string;
    shortLabel: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    badgeClass: string;
    stageIndex: number;
    stageDescription: string;
  }
> = {
  PACKED_IN_STOCK: {
    label: 'In Warehouse',
    labelEn: 'In Warehouse',
    labelDe: 'Im Werk-Lager',
    shortLabel: 'In Warehouse',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-800',
    badgeBorder: 'border-emerald-200',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    stageIndex: 1,
    stageDescription: '1st Status: Scanned & stored in Factory Warehouse'
  },
  DISPATCHED_DIRECT: {
    label: 'In Transit / Delivered to Customer',
    labelEn: 'In Transit / Delivered to Customer',
    labelDe: 'Im Transit / An OEM-Kunden geliefert',
    shortLabel: 'In Transit / Delivered',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-800',
    badgeBorder: 'border-blue-200',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
    stageIndex: 2,
    stageDescription: '2nd Status (Direct Sale): Dispatched directly to OEM customer'
  },
  IN_TRANSIT_SISTER_CONCERN: {
    label: 'In Transit',
    labelEn: 'In Transit',
    labelDe: 'Im Transit (zur Schwestergesellschaft)',
    shortLabel: 'In Transit',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    stageIndex: 2,
    stageDescription: 'Intercompany Stage 1: In transit from factory to Sister Concern'
  },
  AT_SISTER_CONCERN: {
    label: 'In Warehouse of Sister Concern',
    labelEn: 'In Warehouse of Sister Concern',
    labelDe: 'Im Lager der Schwestergesellschaft',
    shortLabel: 'In Warehouse of Sister Concern',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-800',
    badgeBorder: 'border-purple-200',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
    stageIndex: 3,
    stageDescription: 'Intercompany Stage 2: Scanned & received in Sister Concern Warehouse'
  },
  DISPATCHED_FINAL_CUSTOMER: {
    label: 'In Transit / Delivered to Customer',
    labelEn: 'In Transit / Delivered to Customer',
    labelDe: 'Im Transit / Geliefert an Endkunden',
    shortLabel: 'In Transit / Delivered',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-800',
    badgeBorder: 'border-indigo-200',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    stageIndex: 4,
    stageDescription: 'Intercompany Stage 3: Dispatched from Sister Concern to Final Customer'
  }
};

export type ActiveActor = 'actor1' | 'actor2' | 'actor3' | 'actor4' | 'master' | 'dashboard';

