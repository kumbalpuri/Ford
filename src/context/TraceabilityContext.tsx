import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ProductMaster,
  CustomerMaster,
  MotherBox,
  FGProduct,
  DispatchBatch,
  SisterConcernDispatchBatch,
  ContainmentNotice,
  ActiveActor,
  AuditLogEntry,
  AuditActionType
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  INITIAL_PRODUCTS_FG,
  INITIAL_BOXES,
  INITIAL_DISPATCHES,
  INITIAL_SC_DISPATCHES,
  INITIAL_AUDIT_LOGS
} from '../mockData';

interface TraceabilityContextType {
  products: ProductMaster[];
  customers: CustomerMaster[];
  boxes: MotherBox[];
  fgProducts: FGProduct[];
  dispatches: DispatchBatch[];
  scDispatches: SisterConcernDispatchBatch[];
  containmentNotices: ContainmentNotice[];
  auditLogs: AuditLogEntry[];
  activeActor: ActiveActor;
  setActiveActor: (actor: ActiveActor) => void;
  
  // Audit Trail action logger
  addAuditLog: (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => void;
  recordItemScan: (serialNumber: string, productName?: string) => void;

  // Actor 1 actions
  packBox: (data: {
    productId: string;
    productionDate: string;
    productionShift: 'Shift A' | 'Shift B' | 'Shift C';
    itemSerials: string[];
    packedBy: string;
  }) => MotherBox;
  
  // Actor 2 actions
  dispatchBoxesFromFactory: (data: {
    invoiceNumber: string;
    dispatchType: 'DIRECT_SALE' | 'SISTER_CONCERN';
    dispatchDate: string;
    customerId: string;
    boxIds: string[];
    vehicleNumber?: string;
    notes?: string;
    createdBy: string;
  }) => DispatchBatch;
  addBoxesToDispatchBatch: (data: {
    dispatchId: string;
    boxIds: string[];
    addedBy?: string;
  }) => DispatchBatch;
  
  // Actor 3 actions
  receiveBoxesAtSisterConcern: (boxIds: string[], scannedBy?: string) => void;
  dispatchBoxesFromSisterConcern: (data: {
    scInvoiceNumber: string;
    dispatchDate: string;
    finalCustomerId: string;
    boxIds: string[];
    vehicleNumber?: string;
    notes?: string;
    createdBy: string;
  }) => SisterConcernDispatchBatch;
  addBoxesToSisterConcernDispatch: (data: {
    scDispatchId: string;
    boxIds: string[];
    addedBy?: string;
  }) => SisterConcernDispatchBatch;
  
  // Actor 4 actions
  sendContainmentNotice: (data: {
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
  }) => ContainmentNotice;
  
  // Master actions
  addProduct: (product: Omit<ProductMaster, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<ProductMaster>) => void;
  deleteProduct: (id: string) => void;
  addCustomer: (customer: Omit<CustomerMaster, 'id'>) => void;
  updateCustomer: (id: string, updates: Partial<CustomerMaster>) => void;
  resetToDefaultData: () => void;
}

const TraceabilityContext = createContext<TraceabilityContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'auto_traceability_v1_';

export const TraceabilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeActor, setActiveActor] = useState<ActiveActor>('actor1');

  const [products, setProducts] = useState<ProductMaster[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}products`);
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [customers, setCustomers] = useState<CustomerMaster[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}customers`);
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [boxes, setBoxes] = useState<MotherBox[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}boxes`);
    return saved ? JSON.parse(saved) : INITIAL_BOXES;
  });

  const [fgProducts, setFgProducts] = useState<FGProduct[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}fg`);
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS_FG;
  });

  const [dispatches, setDispatches] = useState<DispatchBatch[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}dispatches`);
    return saved ? JSON.parse(saved) : INITIAL_DISPATCHES;
  });

  const [scDispatches, setScDispatches] = useState<SisterConcernDispatchBatch[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}sc_dispatches`);
    return saved ? JSON.parse(saved) : INITIAL_SC_DISPATCHES;
  });

  const [containmentNotices, setContainmentNotices] = useState<ContainmentNotice[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}notices`);
    return saved ? JSON.parse(saved) : [];
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}audit_logs`);
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}products`, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}customers`, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}boxes`, JSON.stringify(boxes));
  }, [boxes]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}fg`, JSON.stringify(fgProducts));
  }, [fgProducts]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}dispatches`, JSON.stringify(dispatches));
  }, [dispatches]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}sc_dispatches`, JSON.stringify(scDispatches));
  }, [scDispatches]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}notices`, JSON.stringify(containmentNotices));
  }, [containmentNotices]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}audit_logs`, JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Append new audit trail record
  const addAuditLog = (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `AUD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`,
      timestamp: formattedDate
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  // Record individual item barcode scan event
  const recordItemScan = (serialNumber: string, productName?: string) => {
    addAuditLog({
      actionType: 'ITEM_SCANNED',
      actionTitle: 'Finished Good Serial Scanned',
      actor: 'Packaging Operator',
      stage: 'STATION_1_PACKAGING',
      stageName: 'Station 1: Packaging',
      entityId: serialNumber,
      entityType: 'ITEM',
      description: `Individual serial ${serialNumber} scanned & validated for packaging${productName ? ` (${productName})` : ''}.`,
      statusAfter: 'Scanned / Pre-Pack',
      location: 'Takwe Packaging Station 1'
    });
  };

  // Actor 1: Pack Box & Generate Mother QR code
  const packBox = ({
    productId,
    productionDate,
    productionShift,
    itemSerials,
    packedBy
  }: {
    productId: string;
    productionDate: string;
    productionShift: 'Shift A' | 'Shift B' | 'Shift C';
    itemSerials: string[];
    packedBy: string;
  }): MotherBox => {
    const product = products.find((p) => p.id === productId);
    if (!product) throw new Error('Product not found in master');

    const cleanDate = productionDate.replace(/-/g, '');
    const prefix = product.partNumber.split('-')[1] || 'PART';
    const seq = String(boxes.length + 1).padStart(3, '0');
    const motherBoxId = `BOX-${cleanDate}-${prefix}-${seq}`;

    const newBox: MotherBox = {
      id: motherBoxId,
      productId: product.id,
      productName: product.name,
      partNumber: product.partNumber,
      boxCapacity: product.boxCapacity,
      productionDate,
      packedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      packedBy: packedBy || 'Assembly Operator 1',
      itemSerials,
      status: 'PACKED_IN_STOCK'
    };

    // Update FG items
    const newFgItems: FGProduct[] = itemSerials.map((serial) => {
      const existing = fgProducts.find((f) => f.serialNumber === serial);
      if (existing) {
        return {
          ...existing,
          boxId: motherBoxId,
          productionDate,
          productionShift,
          status: 'PACKED' as const
        };
      }
      return {
        serialNumber: serial,
        productId: product.id,
        productName: product.name,
        partNumber: product.partNumber,
        productionDate,
        productionShift,
        boxId: motherBoxId,
        scannedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
        status: 'PACKED' as const
      };
    });

    const otherFg = fgProducts.filter((f) => !itemSerials.includes(f.serialNumber));
    setFgProducts([...otherFg, ...newFgItems]);
    setBoxes((prev) => [newBox, ...prev]);

    // Log to Audit Trail
    addAuditLog({
      actionType: 'BOX_PACKED',
      actionTitle: 'Mother Box Sealed & Packaged',
      actor: packedBy || 'Assembly Operator 1',
      stage: 'STATION_1_PACKAGING',
      stageName: 'Station 1: Packaging',
      entityId: motherBoxId,
      entityType: 'BOX',
      description: `Mother Box ${motherBoxId} packaged with ${itemSerials.length} FG items (${product.name}, ${product.partNumber}). Ready in factory warehouse.`,
      statusAfter: 'In Warehouse',
      location: 'Takwe Assembly & Packaging Line'
    });

    return newBox;
  };

  // Actor 2: Factory Dispatch (Direct Sale vs Sister Concern)
  const dispatchBoxesFromFactory = ({
    invoiceNumber,
    dispatchType,
    dispatchDate,
    customerId,
    boxIds,
    vehicleNumber,
    notes,
    createdBy
  }: {
    invoiceNumber: string;
    dispatchType: 'DIRECT_SALE' | 'SISTER_CONCERN';
    dispatchDate: string;
    customerId: string;
    boxIds: string[];
    vehicleNumber?: string;
    notes?: string;
    createdBy: string;
  }): DispatchBatch => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) throw new Error('Customer / Sister unit not found');

    const dispatchId = `DISP-${String(dispatches.length + 1).padStart(3, '0')}`;
    const newDispatch: DispatchBatch = {
      id: dispatchId,
      invoiceNumber,
      dispatchType,
      dispatchDate,
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerAddress: customer.address,
      boxIds,
      vehicleNumber,
      notes,
      createdBy: createdBy || 'Dispatch Officer',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };

    // User Rule:
    // "First status after scanning will be in warehouse, second status will be In Transist / deliver to customer for direct sale.
    // For intercompany it will be In Transit / In warehouse of sister concern after scanning by sister concern it will be in transist or deliver to cstomer."
    const targetStatus = dispatchType === 'DIRECT_SALE' ? 'DISPATCHED_DIRECT' : 'IN_TRANSIT_SISTER_CONCERN';
    const fgStatus = dispatchType === 'DIRECT_SALE' ? 'DISPATCHED_DIRECT' : 'DISPATCHED_TO_SISTER_CONCERN';

    setBoxes((prev) =>
      prev.map((b) => {
        if (boxIds.includes(b.id)) {
          return {
            ...b,
            status: targetStatus,
            dispatchType,
            factoryInvoiceNumber: invoiceNumber,
            factoryDispatchDate: dispatchDate,
            initialRecipientId: customer.id,
            initialRecipientName: customer.name
          };
        }
        return b;
      })
    );

    // Update FG items
    setFgProducts((prev) =>
      prev.map((item) => {
        if (item.boxId && boxIds.includes(item.boxId)) {
          return {
            ...item,
            status: fgStatus
          };
        }
        return item;
      })
    );

    setDispatches((prev) => [newDispatch, ...prev]);

    // Log to Audit Trail
    if (dispatchType === 'DIRECT_SALE') {
      addAuditLog({
        actionType: 'FACTORY_DISPATCH_DIRECT',
        actionTitle: 'Factory Direct OEM Dispatch',
        actor: createdBy || 'Dispatch Officer',
        stage: 'STATION_2_FACTORY_DISPATCH',
        stageName: 'Station 2: Factory Dispatch',
        entityId: invoiceNumber,
        entityType: 'DISPATCH',
        description: `Direct OEM dispatch confirmed under SAP Invoice ${invoiceNumber} to ${customer.name}. ${boxIds.length} mother boxes (${boxIds.join(', ')}). Vehicle: ${vehicleNumber || 'N/A'}.`,
        statusAfter: 'In Transit / Delivered to Customer',
        location: 'Takwe Factory Outbound Bay'
      });
    } else {
      addAuditLog({
        actionType: 'FACTORY_DISPATCH_INTERCOMPANY',
        actionTitle: 'Intercompany Dispatch to Sister Concern',
        actor: createdBy || 'Dispatch Officer',
        stage: 'STATION_2_FACTORY_DISPATCH',
        stageName: 'Station 2: Factory Dispatch',
        entityId: invoiceNumber,
        entityType: 'DISPATCH',
        description: `Intercompany dispatch under SAP Invoice ${invoiceNumber} shipped to ${customer.name}. ${boxIds.length} mother boxes now in transit. Vehicle: ${vehicleNumber || 'N/A'}.`,
        statusAfter: 'In Transit',
        location: 'Takwe Factory Outbound Bay'
      });
    }

    return newDispatch;
  };

  // Actor 2: Add additional boxes to an existing factory dispatch
  const addBoxesToDispatchBatch = ({
    dispatchId,
    boxIds,
    addedBy
  }: {
    dispatchId: string;
    boxIds: string[];
    addedBy?: string;
  }): DispatchBatch => {
    const existing = dispatches.find((d) => d.id === dispatchId || d.invoiceNumber === dispatchId);
    if (!existing) throw new Error('Dispatch batch not found');

    const newBoxIds = boxIds.filter((id) => !existing.boxIds.includes(id));
    if (newBoxIds.length === 0) return existing;

    const targetStatus = existing.dispatchType === 'DIRECT_SALE' ? 'DISPATCHED_DIRECT' : 'IN_TRANSIT_SISTER_CONCERN';
    const fgStatus = existing.dispatchType === 'DIRECT_SALE' ? 'DISPATCHED_DIRECT' : 'DISPATCHED_TO_SISTER_CONCERN';

    // Update newly added boxes
    setBoxes((prev) =>
      prev.map((b) => {
        if (newBoxIds.includes(b.id)) {
          return {
            ...b,
            status: targetStatus,
            dispatchType: existing.dispatchType,
            factoryInvoiceNumber: existing.invoiceNumber,
            factoryDispatchDate: existing.dispatchDate,
            initialRecipientId: existing.customerId,
            initialRecipientName: existing.customerName
          };
        }
        return b;
      })
    );

    // Update FG items
    setFgProducts((prev) =>
      prev.map((item) => {
        if (item.boxId && newBoxIds.includes(item.boxId)) {
          return {
            ...item,
            status: fgStatus
          };
        }
        return item;
      })
    );

    const updatedBatch: DispatchBatch = {
      ...existing,
      boxIds: [...existing.boxIds, ...newBoxIds]
    };

    setDispatches((prev) => prev.map((d) => (d.id === existing.id ? updatedBatch : d)));

    addAuditLog({
      actionType: 'DISPATCH_BOXES_ADDED',
      actionTitle: 'Additional Boxes Appended to Dispatch',
      actor: addedBy || 'Dispatch Officer',
      stage: 'STATION_2_FACTORY_DISPATCH',
      stageName: 'Station 2: Factory Dispatch',
      entityId: existing.invoiceNumber,
      entityType: 'DISPATCH',
      description: `${newBoxIds.length} additional mother boxes (${newBoxIds.join(', ')}) appended to SAP Invoice ${existing.invoiceNumber} for ${existing.customerName}. Total boxes now: ${updatedBatch.boxIds.length}.`,
      statusAfter: targetStatus === 'DISPATCHED_DIRECT' ? 'In Transit / Delivered to Customer' : 'In Transit',
      location: 'Takwe Factory Outbound Bay'
    });

    return updatedBatch;
  };

  // Actor 3: Receive arriving boxes at Sister Concern (moves from IN_TRANSIT_SISTER_CONCERN -> AT_SISTER_CONCERN)
  const receiveBoxesAtSisterConcern = (boxIds: string[], scannedBy: string = 'Sister Unit Inward Receiver') => {
    setBoxes((prev) =>
      prev.map((b) => {
        if (boxIds.includes(b.id)) {
          return {
            ...b,
            status: 'AT_SISTER_CONCERN'
          };
        }
        return b;
      })
    );

    boxIds.forEach((boxId) => {
      addAuditLog({
        actionType: 'SISTER_CONCERN_RECEIVED',
        actionTitle: 'Sister Concern Intake Scan Confirmed',
        actor: scannedBy,
        stage: 'STATION_3_SISTER_CONCERN',
        stageName: 'Station 3: Sister Concern Hub',
        entityId: boxId,
        entityType: 'BOX',
        description: `Mother Box ${boxId} verified & intake-scanned at Sister Concern warehouse dock. Moved to Sister Concern stock.`,
        statusAfter: 'In Warehouse of Sister Concern',
        location: 'Sister Concern Regional Distribution Center'
      });
    });
  };

  // Actor 3: Sister Concern Dispatch to Final Customer
  const dispatchBoxesFromSisterConcern = ({
    scInvoiceNumber,
    dispatchDate,
    finalCustomerId,
    boxIds,
    vehicleNumber,
    notes,
    createdBy
  }: {
    scInvoiceNumber: string;
    dispatchDate: string;
    finalCustomerId: string;
    boxIds: string[];
    vehicleNumber?: string;
    notes?: string;
    createdBy: string;
  }): SisterConcernDispatchBatch => {
    const finalCustomer = customers.find((c) => c.id === finalCustomerId);
    if (!finalCustomer) throw new Error('Final customer not found');

    const scDispatchId = `SCDISP-${String(scDispatches.length + 1).padStart(3, '0')}`;
    
    // Find factory invoice reference from first box
    const firstBox = boxes.find((b) => boxIds.includes(b.id));

    const newScDispatch: SisterConcernDispatchBatch = {
      id: scDispatchId,
      scInvoiceNumber,
      factoryInvoiceReference: firstBox?.factoryInvoiceNumber || 'N/A',
      dispatchDate,
      finalCustomerId: finalCustomer.id,
      finalCustomerName: finalCustomer.name,
      finalCustomerEmail: finalCustomer.email,
      finalCustomerAddress: finalCustomer.address,
      boxIds,
      vehicleNumber,
      notes,
      createdBy: createdBy || 'Sister Unit Store Person',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };

    // Update box statuses to DISPATCHED_FINAL_CUSTOMER
    setBoxes((prev) =>
      prev.map((b) => {
        if (boxIds.includes(b.id)) {
          return {
            ...b,
            status: 'DISPATCHED_FINAL_CUSTOMER',
            sisterConcernInvoiceNumber: scInvoiceNumber,
            sisterConcernDispatchDate: dispatchDate,
            finalCustomerId: finalCustomer.id,
            finalCustomerName: finalCustomer.name,
            finalCustomerEmail: finalCustomer.email
          };
        }
        return b;
      })
    );

    // Update FG products status to DELIVERED_TO_CUSTOMER
    setFgProducts((prev) =>
      prev.map((item) => {
        if (item.boxId && boxIds.includes(item.boxId)) {
          return {
            ...item,
            status: 'DELIVERED_TO_CUSTOMER'
          };
        }
        return item;
      })
    );

    setScDispatches((prev) => [newScDispatch, ...prev]);

    // Log to Audit Trail
    addAuditLog({
      actionType: 'SISTER_CONCERN_DISPATCH',
      actionTitle: 'Sister Concern Outbound OEM Dispatch',
      actor: createdBy || 'Sister Unit Store Person',
      stage: 'STATION_3_SISTER_CONCERN',
      stageName: 'Station 3: Sister Concern Hub',
      entityId: scInvoiceNumber,
      entityType: 'SC_DISPATCH',
      description: `Dispatched from Sister Concern to Final OEM Customer ${finalCustomer.name} under SC Delivery Note ${scInvoiceNumber}. ${boxIds.length} boxes (${boxIds.join(', ')}). Vehicle: ${vehicleNumber || 'N/A'}.`,
      statusAfter: 'In Transit / Delivered to Customer',
      location: 'Sister Concern Outbound Dock'
    });

    return newScDispatch;
  };

  // Actor 3: Add additional boxes to an existing Sister Concern delivery note
  const addBoxesToSisterConcernDispatch = ({
    scDispatchId,
    boxIds,
    addedBy
  }: {
    scDispatchId: string;
    boxIds: string[];
    addedBy?: string;
  }): SisterConcernDispatchBatch => {
    const existing = scDispatches.find((d) => d.id === scDispatchId || d.scInvoiceNumber === scDispatchId);
    if (!existing) throw new Error('Sister concern dispatch not found');

    const newBoxIds = boxIds.filter((id) => !existing.boxIds.includes(id));
    if (newBoxIds.length === 0) return existing;

    setBoxes((prev) =>
      prev.map((b) => {
        if (newBoxIds.includes(b.id)) {
          return {
            ...b,
            status: 'DISPATCHED_FINAL_CUSTOMER',
            sisterConcernInvoiceNumber: existing.scInvoiceNumber,
            sisterConcernDispatchDate: existing.dispatchDate,
            finalCustomerId: existing.finalCustomerId,
            finalCustomerName: existing.finalCustomerName,
            finalCustomerEmail: existing.finalCustomerEmail
          };
        }
        return b;
      })
    );

    setFgProducts((prev) =>
      prev.map((item) => {
        if (item.boxId && newBoxIds.includes(item.boxId)) {
          return {
            ...item,
            status: 'DELIVERED_TO_CUSTOMER'
          };
        }
        return item;
      })
    );

    const updatedBatch: SisterConcernDispatchBatch = {
      ...existing,
      boxIds: [...existing.boxIds, ...newBoxIds]
    };

    setScDispatches((prev) => prev.map((d) => (d.id === existing.id ? updatedBatch : d)));

    addAuditLog({
      actionType: 'SC_DISPATCH_BOXES_ADDED',
      actionTitle: 'Additional Boxes Appended to SC Delivery Note',
      actor: addedBy || 'Sister Unit Store Person',
      stage: 'STATION_3_SISTER_CONCERN',
      stageName: 'Station 3: Sister Concern Hub',
      entityId: existing.scInvoiceNumber,
      entityType: 'SC_DISPATCH',
      description: `${newBoxIds.length} additional mother boxes (${newBoxIds.join(', ')}) appended to Sister Concern Delivery Note ${existing.scInvoiceNumber} for ${existing.finalCustomerName}. Total boxes now: ${updatedBatch.boxIds.length}.`,
      statusAfter: 'In Transit / Delivered to Customer',
      location: 'Sister Concern Outbound Dock'
    });

    return updatedBatch;
  };

  // Actor 4: Send Containment Notice
  const sendContainmentNotice = (data: {
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
  }): ContainmentNotice => {
    const noticeNumber = `CN-QA-${new Date().getFullYear()}-${String(containmentNotices.length + 1).padStart(3, '0')}`;
    const newNotice: ContainmentNotice = {
      id: `NOT-${Date.now()}`,
      noticeNumber,
      issueDate: new Date().toISOString().replace('T', ' ').slice(0, 19),
      defectDescription: data.defectDescription,
      severity: data.severity,
      investigatedBy: data.investigatedBy || 'QA Head',
      targetCustomerName: data.targetCustomerName,
      targetCustomerEmail: data.targetCustomerEmail,
      suspectedSerialNumbers: data.suspectedSerialNumbers,
      affectedBoxIds: data.affectedBoxIds,
      productName: data.productName,
      partNumber: data.partNumber,
      factoryInvoiceNumber: data.factoryInvoiceNumber,
      quarantineInstructions: data.quarantineInstructions,
      status: 'SENT'
    };

    // Mark suspected items
    setFgProducts((prev) =>
      prev.map((item) => {
        if (data.suspectedSerialNumbers.includes(item.serialNumber)) {
          return {
            ...item,
            isSuspected: true
          };
        }
        return item;
      })
    );

    setContainmentNotices((prev) => [newNotice, ...prev]);

    // Log to Audit Trail
    addAuditLog({
      actionType: 'QA_CONTAINMENT_ISSUED',
      actionTitle: `Quality Containment Notice Dispatched (${data.severity})`,
      actor: data.investigatedBy || 'QA Head',
      stage: 'STATION_4_QA_RECALL',
      stageName: 'Station 4: QA Containment',
      entityId: noticeNumber,
      entityType: 'NOTICE',
      description: `Containment notice ${noticeNumber} transmitted to ${data.targetCustomerName} for ${data.suspectedSerialNumbers.length} suspected serial numbers. Defect: ${data.defectDescription}`,
      statusAfter: 'Quarantined / Notice Sent',
      location: 'Quality Assurance Department'
    });

    return newNotice;
  };

  // Master product CRUD
  const addProduct = (product: Omit<ProductMaster, 'id'>) => {
    const newProd: ProductMaster = {
      ...product,
      id: `PROD-${String(products.length + 1).padStart(3, '0')}`
    };
    setProducts((prev) => [...prev, newProd]);
    addAuditLog({
      actionType: 'PRODUCT_CREATED',
      actionTitle: 'Master Product Specification Added',
      actor: 'Master Data Administrator',
      stage: 'MASTER_DATA',
      stageName: 'Master Data',
      entityId: newProd.id,
      entityType: 'PRODUCT',
      description: `Added new finished good: ${newProd.name} (${newProd.partNumber}) with box capacity ${newProd.boxCapacity}.`,
      statusAfter: 'Active in Master',
      location: 'Central ERP Master Data'
    });
  };

  const updateProduct = (id: string, updates: Partial<ProductMaster>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    addAuditLog({
      actionType: 'PRODUCT_UPDATED',
      actionTitle: 'Master Product Specification Updated',
      actor: 'Master Data Administrator',
      stage: 'MASTER_DATA',
      stageName: 'Master Data',
      entityId: id,
      entityType: 'PRODUCT',
      description: `Updated master product specification for ID ${id}.`,
      statusAfter: 'Updated in Master',
      location: 'Central ERP Master Data'
    });
  };

  const deleteProduct = (id: string) => {
    const prod = products.find((p) => p.id === id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    addAuditLog({
      actionType: 'PRODUCT_DELETED',
      actionTitle: 'Master Product Specification Removed',
      actor: 'Master Data Administrator',
      stage: 'MASTER_DATA',
      stageName: 'Master Data',
      entityId: id,
      entityType: 'PRODUCT',
      description: `Removed finished good specification: ${prod?.name || id}.`,
      statusAfter: 'Archived / Inactive',
      location: 'Central ERP Master Data'
    });
  };

  // Customer CRUD
  const addCustomer = (customer: Omit<CustomerMaster, 'id'>) => {
    const newCust: CustomerMaster = {
      ...customer,
      id: `CUST-${String(customers.length + 1).padStart(3, '0')}`
    };
    setCustomers((prev) => [...prev, newCust]);
    addAuditLog({
      actionType: 'CUSTOMER_CREATED',
      actionTitle: 'Customer / Sister Unit Added',
      actor: 'Master Data Administrator',
      stage: 'MASTER_DATA',
      stageName: 'Master Data',
      entityId: newCust.id,
      entityType: 'CUSTOMER',
      description: `Registered partner: ${newCust.name} (${newCust.isSisterConcern ? 'Sister Concern Logistics Hub' : 'Direct OEM Customer'}).`,
      statusAfter: 'Active Partner',
      location: 'Central ERP Master Data'
    });
  };

  const updateCustomer = (id: string, updates: Partial<CustomerMaster>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    addAuditLog({
      actionType: 'CUSTOMER_UPDATED',
      actionTitle: 'Customer / Sister Unit Record Updated',
      actor: 'Master Data Administrator',
      stage: 'MASTER_DATA',
      stageName: 'Master Data',
      entityId: id,
      entityType: 'CUSTOMER',
      description: `Updated customer profile details for ${id}.`,
      statusAfter: 'Active Partner',
      location: 'Central ERP Master Data'
    });
  };

  const resetToDefaultData = () => {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}products`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}customers`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}boxes`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}fg`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}dispatches`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}sc_dispatches`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}notices`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}audit_logs`);

    setProducts(INITIAL_PRODUCTS);
    setCustomers(INITIAL_CUSTOMERS);
    setBoxes(INITIAL_BOXES);
    setFgProducts(INITIAL_PRODUCTS_FG);
    setDispatches(INITIAL_DISPATCHES);
    setScDispatches(INITIAL_SC_DISPATCHES);
    setContainmentNotices([]);
    setAuditLogs(INITIAL_AUDIT_LOGS);
  };

  return (
    <TraceabilityContext.Provider
      value={{
        products,
        customers,
        boxes,
        fgProducts,
        dispatches,
        scDispatches,
        containmentNotices,
        auditLogs,
        activeActor,
        setActiveActor,
        addAuditLog,
        recordItemScan,
        packBox,
        dispatchBoxesFromFactory,
        addBoxesToDispatchBatch,
        receiveBoxesAtSisterConcern,
        dispatchBoxesFromSisterConcern,
        addBoxesToSisterConcernDispatch,
        sendContainmentNotice,
        addProduct,
        updateProduct,
        deleteProduct,
        addCustomer,
        updateCustomer,
        resetToDefaultData
      }}
    >
      {children}
    </TraceabilityContext.Provider>
  );
};

export const useTraceability = () => {
  const context = useContext(TraceabilityContext);
  if (!context) {
    throw new Error('useTraceability must be used within a TraceabilityProvider');
  }
  return context;
};

