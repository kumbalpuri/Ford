import React, { useState } from 'react';
import { useTraceability } from '../context/TraceabilityContext';
import { ProductMaster, CustomerMaster } from '../types';
import { AuditTrail } from './AuditTrail';
import { COMPANY_INFO } from '../constants/company';
import {
  Database,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  Building2,
  Package,
  RotateCcw,
  FileText,
  MapPin,
  Phone,
  Printer
} from 'lucide-react';

interface MasterDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'products' | 'customers' | 'logs';
}

export const MasterDataModal: React.FC<MasterDataModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'products'
}) => {
  const {
    products,
    customers,
    auditLogs,
    addProduct,
    updateProduct,
    deleteProduct,
    addCustomer,
    updateCustomer,
    resetToDefaultData
  } = useTraceability();

  const [activeTab, setActiveTab] = useState<'products' | 'customers' | 'logs'>(defaultTab);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);


  // New product form
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newPartNumber, setNewPartNumber] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Braking Systems');
  const [newBoxCapacity, setNewBoxCapacity] = useState<number>(4);
  const [newWeight, setNewWeight] = useState<number>(2.5);

  // New customer form
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustCode, setNewCustCode] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [isSisterConcern, setIsSisterConcern] = useState(false);

  if (!isOpen) return null;

  const handleSaveNewProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartNumber || !newName || newBoxCapacity <= 0) return;
    addProduct({
      partNumber: newPartNumber.trim().toUpperCase(),
      name: newName.trim(),
      category: newCategory,
      boxCapacity: Number(newBoxCapacity),
      unit: 'Pieces',
      weightKg: Number(newWeight),
      description: 'Precision automotive finished good'
    });
    setNewPartNumber('');
    setNewName('');
    setShowAddProduct(false);
  };

  const handleSaveNewCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustEmail) return;
    addCustomer({
      name: newCustName.trim(),
      code: newCustCode.trim().toUpperCase() || `CUST-${Date.now().toString().slice(-4)}`,
      email: newCustEmail.trim(),
      address: newCustAddress.trim() || 'Industrial Estate, Automotive Corridor',
      city: 'Industrial Hub',
      contactPerson: 'Quality & Inward Logistics',
      phone: '+91 90000 00000',
      isSisterConcern
    });
    setNewCustName('');
    setNewCustCode('');
    setNewCustEmail('');
    setNewCustAddress('');
    setIsSisterConcern(false);
    setShowAddCustomer(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Master Data Administration
              </h3>
              <p className="text-xs text-slate-500">
                Configure finished goods part specifications, box packaging capacities, and customer master
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (confirm('Reset all demo data (products, boxes, dispatches) to factory initial state?')) {
                  resetToDefaultData();
                }
              }}
              title="Reset to factory sample data"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo Data</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-100 px-6 pt-2">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'products'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Product Master & Box Capacity ({products.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'customers'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Customers & Sister Concerns ({customers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'logs'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>System Logs ({auditLogs.length})</span>
          </button>
        </div>


        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'products' ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-600">
                  Each product maintains its designated <strong>Box Capacity</strong> used by Actor 1 for automated Mother QR packaging.
                </p>
                <button
                  onClick={() => setShowAddProduct(!showAddProduct)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddProduct ? 'Close Form' : 'Add New Product'}</span>
                </button>
              </div>

              {/* Add Product Form */}
              {showAddProduct && (
                <form onSubmit={handleSaveNewProduct} className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-lg space-y-3">
                  <h4 className="text-xs font-bold text-indigo-950 uppercase">New Product Specification</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">Part Number *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. AUTO-CLU-900"
                        value={newPartNumber}
                        onChange={(e) => setNewPartNumber(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">Product Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Dual Mass Flywheel Assembly"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">Box Capacity (Pcs) *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="100"
                        value={newBoxCapacity}
                        onChange={(e) => setNewBoxCapacity(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-bold text-indigo-700"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddProduct(false)}
                      className="px-3 py-1 bg-white border border-slate-300 rounded text-xs text-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold"
                    >
                      Save Product
                    </button>
                  </div>
                </form>
              )}

              {/* Products Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Part Number</th>
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-center">Box Capacity</th>
                      <th className="py-2.5 px-3 text-center">Weight</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {products.map((prod) => (
                      <tr key={prod.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{prod.partNumber}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{prod.name}</td>
                        <td className="py-2.5 px-3 text-slate-500">{prod.category}</td>
                        <td className="py-2.5 px-3 text-center">
                          {editingProductId === prod.id ? (
                            <input
                              type="number"
                              min="1"
                              max="100"
                              defaultValue={prod.boxCapacity}
                              onBlur={(e) => {
                                updateProduct(prod.id, { boxCapacity: Number(e.target.value) || 1 });
                                setEditingProductId(null);
                              }}
                              autoFocus
                              className="w-16 text-center border border-indigo-500 rounded p-1 font-bold text-indigo-700 bg-indigo-50"
                            />
                          ) : (
                            <span
                              onClick={() => setEditingProductId(prod.id)}
                              className="inline-block cursor-pointer px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold rounded border border-indigo-200"
                              title="Click to edit box capacity"
                            >
                              {prod.boxCapacity} pcs / box
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-600">{prod.weightKg} kg</td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => setEditingProductId(editingProductId === prod.id ? null : prod.id)}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                            title="Edit capacity"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-600">
                  Customers mapped for Direct OEM dispatch (Actor 2) and Sister Concern intercompany transfer (Actor 3).
                </p>
                <button
                  onClick={() => setShowAddCustomer(!showAddCustomer)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddCustomer ? 'Close Form' : 'Add New Customer'}</span>
                </button>
              </div>

              {/* Add Customer Form */}
              {showAddCustomer && (
                <form onSubmit={handleSaveNewCustomer} className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-lg space-y-3">
                  <h4 className="text-xs font-bold text-indigo-950 uppercase">New Customer Entity</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">Company / Customer Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Tata Motors Passenger Vehicles"
                        value={newCustName}
                        onChange={(e) => setNewCustName(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">Customer Code</label>
                      <input
                        type="text"
                        placeholder="e.g. OEM-TM-05"
                        value={newCustCode}
                        onChange={(e) => setNewCustCode(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">QA / Logistics Email *</label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. quality@tatamotors.com"
                        value={newCustEmail}
                        onChange={(e) => setNewCustEmail(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">Plant Address</label>
                      <input
                        type="text"
                        placeholder="e.g. Pimpri Works, Pune 411018"
                        value={newCustAddress}
                        onChange={(e) => setNewCustAddress(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-4">
                      <input
                        type="checkbox"
                        id="isSisterCheckbox"
                        checked={isSisterConcern}
                        onChange={(e) => setIsSisterConcern(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600"
                      />
                      <label htmlFor="isSisterCheckbox" className="text-xs font-semibold text-slate-800">
                        Is Sister Concern / Internal Hub
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddCustomer(false)}
                      className="px-3 py-1 bg-white border border-slate-300 rounded text-xs text-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold"
                    >
                      Save Customer
                    </button>
                  </div>
                </form>
              )}

              {/* Customers Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Customer / Plant</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">QA Notification Email</th>
                      <th className="py-2.5 px-3">Address</th>
                      <th className="py-2.5 px-3">Contact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {customers.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{c.name}</div>
                          <div className="text-[10px] font-mono text-slate-500">{c.code}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          {c.isSisterConcern ? (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-semibold rounded text-[10px]">
                              Sister Concern (Intercompany)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-semibold rounded text-[10px]">
                              Direct OEM Customer
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">{c.email}</td>
                        <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate">{c.address}</td>
                        <td className="py-2.5 px-3 text-slate-600">{c.contactPerson}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-4">
              <AuditTrail />
            </div>
          )}
        </div>

        {/* Footer & Company Details */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              <strong>{COMPANY_INFO.name}</strong> • {COMPANY_INFO.addressLine1}, {COMPANY_INFO.city}, {COMPANY_INFO.state} {COMPANY_INFO.pincode} • Tel: {COMPANY_INFO.phone}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors shrink-0"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

