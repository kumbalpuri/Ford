import React, { useState, useMemo } from 'react';
import { useTraceability } from '../context/TraceabilityContext';
import { AuditLogEntry, AuditActionType } from '../types';
import {
  FileText,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  ShieldCheck,
  Clock,
  User,
  Box,
  Truck,
  Building2,
  AlertTriangle,
  RefreshCw,
  Tag,
  CheckCircle2,
  Database
} from 'lucide-react';

type SortField = 'timestamp' | 'actionTitle' | 'actor' | 'entityId' | 'stageName' | 'statusAfter';
type SortDirection = 'asc' | 'desc';

export const AuditTrail: React.FC = () => {
  const { auditLogs } = useTraceability();

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStage, setSelectedStage] = useState<string>('ALL');
  const [selectedActionType, setSelectedActionType] = useState<string>('ALL');

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Toggle sort handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filtered & sorted logs
  const processedLogs = useMemo(() => {
    let list = [...auditLogs];

    // Filter by stage
    if (selectedStage !== 'ALL') {
      list = list.filter((l) => l.stage === selectedStage);
    }

    // Filter by action type
    if (selectedActionType !== 'ALL') {
      list = list.filter((l) => l.actionType === selectedActionType);
    }

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (l) =>
          l.entityId.toLowerCase().includes(q) ||
          l.actionTitle.toLowerCase().includes(q) ||
          l.actor.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.statusAfter.toLowerCase().includes(q) ||
          (l.location && l.location.toLowerCase().includes(q))
      );
    }

    // Sort
    list.sort((a, b) => {
      const valA = (a[sortField] || '').toString().toLowerCase();
      const valB = (b[sortField] || '').toString().toLowerCase();

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [auditLogs, selectedStage, selectedActionType, searchTerm, sortField, sortDirection]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: auditLogs.length,
      packaging: auditLogs.filter((l) => l.stage === 'STATION_1_PACKAGING').length,
      factoryDispatch: auditLogs.filter((l) => l.stage === 'STATION_2_FACTORY_DISPATCH').length,
      sisterConcern: auditLogs.filter((l) => l.stage === 'STATION_3_SISTER_CONCERN').length,
      qaRecall: auditLogs.filter((l) => l.stage === 'STATION_4_QA_RECALL').length
    };
  }, [auditLogs]);

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Log ID',
      'Timestamp (UTC+5:30)',
      'Stage',
      'Event Action',
      'Entity ID',
      'Entity Type',
      'Performed By (User/Station)',
      'Status Transition',
      'Location / Plant',
      'Audit Description'
    ];

    const rows = processedLogs.map((l) => [
      l.id,
      l.timestamp,
      `"${l.stageName}"`,
      `"${l.actionTitle}"`,
      `"${l.entityId}"`,
      l.entityType,
      `"${l.actor}"`,
      `"${l.statusAfter}"`,
      `"${l.location || 'Takwe Plant'}"`,
      `"${l.description.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `KSPG-IATF16949-AuditTrail-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for action badge styling
  const getActionBadge = (actionType: AuditActionType) => {
    switch (actionType) {
      case 'BOX_PACKED':
        return {
          icon: <Box className="w-3 h-3 text-emerald-600" />,
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200'
        };
      case 'ITEM_SCANNED':
        return {
          icon: <Tag className="w-3 h-3 text-teal-600" />,
          bg: 'bg-teal-50 text-teal-800 border-teal-200'
        };
      case 'FACTORY_DISPATCH_DIRECT':
        return {
          icon: <Truck className="w-3 h-3 text-blue-600" />,
          bg: 'bg-blue-50 text-blue-800 border-blue-200'
        };
      case 'FACTORY_DISPATCH_INTERCOMPANY':
        return {
          icon: <Truck className="w-3 h-3 text-amber-600" />,
          bg: 'bg-amber-50 text-amber-800 border-amber-200'
        };
      case 'SISTER_CONCERN_RECEIVED':
        return {
          icon: <Building2 className="w-3 h-3 text-purple-600" />,
          bg: 'bg-purple-50 text-purple-800 border-purple-200'
        };
      case 'SISTER_CONCERN_DISPATCH':
        return {
          icon: <Truck className="w-3 h-3 text-indigo-600" />,
          bg: 'bg-indigo-50 text-indigo-800 border-indigo-200'
        };
      case 'QA_CONTAINMENT_ISSUED':
        return {
          icon: <AlertTriangle className="w-3 h-3 text-rose-600" />,
          bg: 'bg-rose-50 text-rose-800 border-rose-200'
        };
      default:
        return {
          icon: <Database className="w-3 h-3 text-slate-600" />,
          bg: 'bg-slate-100 text-slate-700 border-slate-200'
        };
    }
  };

  // Status after badge styling
  const getStatusAfterBadge = (status: string) => {
    if (status.includes('In Warehouse of Sister Concern')) {
      return 'bg-purple-50 text-purple-800 border-purple-200';
    }
    if (status.includes('In Warehouse')) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
    if (status.includes('In Transit') || status.includes('Delivered')) {
      return 'bg-blue-50 text-blue-800 border-blue-200';
    }
    if (status.includes('Quarantined')) {
      return 'bg-rose-50 text-rose-800 border-rose-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Compliance Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 rounded-xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold tracking-tight uppercase flex items-center gap-2">
              <span>IATF 16949 / ISO 9001 System Audit Trail</span>
              <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded font-mono">
                COMPLIANT
              </span>
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Immutable digital ledger of all workflow actions, package scans, and dispatch lifecycle transitions
            </p>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Audit Log (CSV)</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-[11px] text-slate-500 font-medium block">Total Logged Events</span>
          <span className="text-lg font-extrabold text-slate-900 mt-0.5 block">{stats.total}</span>
        </div>
        <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-lg">
          <span className="text-[11px] text-emerald-700 font-medium block">Packaging Events</span>
          <span className="text-lg font-extrabold text-emerald-900 mt-0.5 block">{stats.packaging}</span>
        </div>
        <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-lg">
          <span className="text-[11px] text-blue-700 font-medium block">Factory Dispatches</span>
          <span className="text-lg font-extrabold text-blue-900 mt-0.5 block">{stats.factoryDispatch}</span>
        </div>
        <div className="p-3 bg-purple-50/60 border border-purple-200/80 rounded-lg">
          <span className="text-[11px] text-purple-700 font-medium block">Sister Concern Events</span>
          <span className="text-lg font-extrabold text-purple-900 mt-0.5 block">{stats.sisterConcern}</span>
        </div>
        <div className="p-3 bg-rose-50/60 border border-rose-200/80 rounded-lg col-span-2 sm:col-span-1">
          <span className="text-[11px] text-rose-700 font-medium block">QA Containments</span>
          <span className="text-lg font-extrabold text-rose-900 mt-0.5 block">{stats.qaRecall}</span>
        </div>
      </div>

      {/* Controls & Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Box ID, Invoice #, user, description, or status..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium focus:outline-hidden"
            >
              <option value="ALL">All Stations / Stages</option>
              <option value="STATION_1_PACKAGING">Station 1: Packaging</option>
              <option value="STATION_2_FACTORY_DISPATCH">Station 2: Factory Dispatch</option>
              <option value="STATION_3_SISTER_CONCERN">Station 3: Sister Concern</option>
              <option value="STATION_4_QA_RECALL">Station 4: QA Containment</option>
              <option value="MASTER_DATA">Master Data</option>
            </select>
          </div>

          <select
            value={selectedActionType}
            onChange={(e) => setSelectedActionType(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium focus:outline-hidden"
          >
            <option value="ALL">All Action Types</option>
            <option value="BOX_PACKED">Mother Box Packaged</option>
            <option value="ITEM_SCANNED">Finished Good Item Scanned</option>
            <option value="FACTORY_DISPATCH_DIRECT">Factory Direct Sale</option>
            <option value="FACTORY_DISPATCH_INTERCOMPANY">Factory Intercompany Dispatch</option>
            <option value="SISTER_CONCERN_RECEIVED">Sister Concern Intake Scan</option>
            <option value="SISTER_CONCERN_DISPATCH">Sister Concern Outbound OEM</option>
            <option value="QA_CONTAINMENT_ISSUED">QA Containment Notice</option>
            <option value="PRODUCT_CREATED">Product Master Added</option>
            <option value="CUSTOMER_CREATED">Customer Master Added</option>
          </select>

          {(searchTerm || selectedStage !== 'ALL' || selectedActionType !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedStage('ALL');
                setSelectedActionType('ALL');
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 hover:underline"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Sortable Audit Trail Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100/80 sticky top-0 z-10 border-b border-slate-200 text-slate-700 uppercase font-bold tracking-wider text-[11px]">
              <tr>
                <th
                  onClick={() => handleSort('timestamp')}
                  className="px-4 py-3 cursor-pointer hover:bg-slate-200/70 transition-colors whitespace-nowrap select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Timestamp</span>
                    {sortField === 'timestamp' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('actionTitle')}
                  className="px-4 py-3 cursor-pointer hover:bg-slate-200/70 transition-colors whitespace-nowrap select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Event Action</span>
                    {sortField === 'actionTitle' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('stageName')}
                  className="px-3 py-3 cursor-pointer hover:bg-slate-200/70 transition-colors whitespace-nowrap select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Station / Stage</span>
                    {sortField === 'stageName' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('entityId')}
                  className="px-4 py-3 cursor-pointer hover:bg-slate-200/70 transition-colors whitespace-nowrap select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Reference ID</span>
                    {sortField === 'entityId' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3">Description & Workflow Details</th>
                <th
                  onClick={() => handleSort('statusAfter')}
                  className="px-3 py-3 cursor-pointer hover:bg-slate-200/70 transition-colors whitespace-nowrap select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status Transition</span>
                    {sortField === 'statusAfter' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('actor')}
                  className="px-3 py-3 cursor-pointer hover:bg-slate-200/70 transition-colors whitespace-nowrap select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Operator / User</span>
                    {sortField === 'actor' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {processedLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileText className="w-8 h-8 text-slate-300" />
                      <p className="font-medium text-slate-500">No audit log records match the current filters.</p>
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedStage('ALL');
                          setSelectedActionType('ALL');
                        }}
                        className="text-blue-600 underline font-semibold text-xs"
                      >
                        Reset filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                processedLogs.map((log) => {
                  const badge = getActionBadge(log.actionType);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Timestamp */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono text-slate-700 text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{log.timestamp}</span>
                        </div>
                      </td>

                      {/* Event Action */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${badge.bg}`}
                        >
                          {badge.icon}
                          <span>{log.actionTitle}</span>
                        </span>
                      </td>

                      {/* Stage */}
                      <td className="px-3 py-3 whitespace-nowrap text-slate-600 font-medium">
                        {log.stageName}
                      </td>

                      {/* Reference ID */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {log.entityId}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="px-4 py-3 text-slate-700 max-w-sm">
                        <p className="leading-snug text-xs">{log.description}</p>
                        {log.location && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            📍 {log.location}
                          </span>
                        )}
                      </td>

                      {/* Status Transition */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${getStatusAfterBadge(
                            log.statusAfter
                          )}`}
                        >
                          {log.statusAfter}
                        </span>
                      </td>

                      {/* Operator / User */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[130px]">{log.actor}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
          <span>
            Showing <strong>{processedLogs.length}</strong> of <strong>{auditLogs.length}</strong> recorded audit events
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            Plant ID: Takwe-IN • Traceability Architecture v2.4
          </span>
        </div>
      </div>
    </div>
  );
};
