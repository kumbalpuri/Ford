import React, { useState, useEffect } from 'react';
import { useTraceability } from '../context/TraceabilityContext';
import { useLanguage } from '../context/LanguageContext';
import { ActiveActor } from '../types';
import { COMPANY_INFO } from '../constants/company';
import {
  Package,
  Truck,
  Building2,
  ShieldAlert,
  Database,
  ChevronLeft,
  ChevronRight,
  Barcode,
  Globe,
  Pin,
  PinOff,
  Layers,
  CheckCircle2,
  Menu,
  X,
  Sparkles,
  Info,
  FileText,
  MapPin,
  ClipboardList,
  Smartphone,
  LayoutDashboard
} from 'lucide-react';

interface SidebarProps {
  onOpenMasterData: (tab?: 'products' | 'customers' | 'logs') => void;
  onOpenMobileTerminal?: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenMasterData,
  onOpenMobileTerminal,
  isMobileOpen,
  setIsMobileOpen
}) => {
  const {
    activeActor,
    setActiveActor,
    boxes,
    containmentNotices,
    auditLogs
  } = useTraceability();

  const { language, setLanguage, t, isGerman } = useLanguage();

  // Auto-collapsible sidebar: defaults to auto-collapsed (collapsed = true, expands on hover)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('autotrace_sidebar_collapsed');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // Auto-collapse mode: when true, hovering temporarily expands the sidebar
  const [autoCollapseOnHover, setAutoCollapseOnHover] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // When auto-collapse mode is active and sidebar is collapsed, hovering expands it
  const isExpanded = !isCollapsed || (autoCollapseOnHover && isHovered);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    try {
      localStorage.setItem('autotrace_sidebar_collapsed', JSON.stringify(next));
    } catch {}
  };

  const packedReadyBoxes = boxes.filter((b) => b.status === 'PACKED_IN_STOCK').length;
  const sisterConcernBoxes = boxes.filter((b) => b.status === 'AT_SISTER_CONCERN').length;
  const inTransitBoxes = boxes.filter((b) => b.status === 'IN_TRANSIT_SISTER_CONCERN').length;
  const dispatchedBoxes = boxes.filter((b) => b.status === 'DISPATCHED_DIRECT' || b.status === 'DISPATCHED_FINAL_CUSTOMER').length;

  const navItems: {
    id: ActiveActor;
    label: string;
    actorNum: string;
    role: string;
    icon: React.ReactNode;
    color: string;
    badge?: number;
    description: string;
  }[] = [
    {
      id: 'actor1',
      label: t.actor1Label,
      actorNum: '1',
      role: t.actor1Role,
      icon: <Package className="w-5 h-5" />,
      color: 'blue',
      badge: packedReadyBoxes > 0 ? packedReadyBoxes : undefined,
      description: isGerman ? 'FG-Serienscan & Kisten-Aggregation' : 'FG QR Scan & Box Aggregation'
    },
    {
      id: 'actor2',
      label: t.actor2Label,
      actorNum: '2',
      role: t.actor2Role,
      icon: <Truck className="w-5 h-5" />,
      color: 'indigo',
      badge: packedReadyBoxes > 0 ? packedReadyBoxes : undefined,
      description: isGerman ? 'SAP-Rechnung & Warenausgang' : 'SAP Invoice & Customer Marriage'
    },
    {
      id: 'actor3',
      label: t.actor3Label,
      actorNum: '3',
      role: t.actor3Role,
      icon: <Building2 className="w-5 h-5" />,
      color: 'purple',
      badge: sisterConcernBoxes > 0 ? sisterConcernBoxes : undefined,
      description: isGerman ? 'Konzernintern & DE-Regionalhub' : 'Intercompany Hub (DE-Stuttgart)'
    },
    {
      id: 'actor4',
      label: t.actor4Label,
      actorNum: '4',
      role: t.actor4Role,
      icon: <ShieldAlert className="w-5 h-5" />,
      color: 'red',
      badge: containmentNotices.length > 0 ? containmentNotices.length : undefined,
      description: isGerman ? 'Rückverfolgung & Quarantäne' : 'Genealogy & Containment'
    },
    {
      id: 'dashboard',
      label: isGerman ? 'Dashboard' : 'Dashboard',
      actorNum: '0',
      role: 'KPI',
      icon: <LayoutDashboard className="w-5 h-5" />,
      color: 'slate',
      description: isGerman ? 'KPI-Übersicht' : 'Key Performance Indicators'
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Main Left-Hand Sidebar Container */}
      <aside
        onMouseEnter={() => {
          if (isCollapsed && autoCollapseOnHover) {
            setIsHovered(true);
          }
        }}
        onMouseLeave={() => {
          if (isCollapsed && autoCollapseOnHover) {
            setIsHovered(false);
          }
        }}
        className={`fixed top-0 bottom-0 left-0 z-40 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 transition-all duration-300 ease-in-out shadow-xl lg:static lg:shadow-none ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${
          isExpanded ? 'w-72' : 'w-[72px]'
        }`}
      >
        {/* Top Brand Header */}
        <div className="h-16 flex items-center justify-between px-3.5 border-b border-slate-800 shrink-0 bg-slate-950/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shrink-0">
              <Barcode className="w-6 h-6" />
            </div>

            {isExpanded && (
              <div className="min-w-0 animate-in fade-in duration-200">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm tracking-tight text-white uppercase truncate">
                    AUTOTRACE
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    VDA / IATF
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {isGerman ? 'Automobil Rückverfolgung' : 'FG Traceability System'}
                </p>
              </div>
            )}
          </div>

          {/* Desktop Collapse / Expand Toggle Button */}
          <div className="hidden lg:flex items-center gap-1">
            <button
              onClick={toggleCollapse}
              title={isCollapsed ? (isGerman ? 'Seitenleiste fixieren / erweitern' : 'Expand sidebar') : (isGerman ? 'Seitenleiste minimieren' : 'Collapse sidebar')}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors border border-slate-700/60 shadow-xs"
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Nav Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
          
          {/* Main Actors Section */}
          <div className="space-y-1.5">
            {isExpanded && (
              <div className="px-3 pb-1 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {isGerman ? 'Arbeitsstationen / Akteure' : 'Traceability Actors'}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  4 Stages
                </span>
              </div>
            )}

            <nav className="space-y-1" aria-label="Workflow Stations">
              {navItems.map((item) => {
                const isActive = activeActor === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveActor(item.id);
                      setIsMobileOpen(false);
                    }}
                    title={`${item.label} (${item.role})`}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all relative group ${
                      isActive
                        ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/20'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/90'
                    }`}
                  >
                    {/* Icon with colored badge */}
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                        isActive
                          ? 'bg-white/20 text-white shadow-xs'
                          : 'bg-slate-800/90 text-slate-300 group-hover:bg-slate-700'
                      }`}
                    >
                      {item.icon}
                    </div>

                    {/* Actor Details (when expanded) */}
                    {isExpanded ? (
                      <div className="min-w-0 flex-1 leading-tight">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                            {isGerman ? `Station ${item.actorNum}` : `Actor ${item.actorNum}`}
                          </span>
                          {typeof item.badge === 'number' && (
                            <span
                              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isActive
                                  ? 'bg-white text-blue-700'
                                  : 'bg-slate-800 text-blue-400 border border-slate-700'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold truncate mt-0.5">{item.label}</p>
                        <p className="text-[10px] opacity-70 truncate">{item.description}</p>
                      </div>
                    ) : (
                      /* Badge overlay when collapsed */
                      typeof item.badge === 'number' && (
                        <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[9px] font-bold shadow-xs">
                          {item.badge}
                        </span>
                      )
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Handheld Scanner / Mobile Terminal */}
          {onOpenMobileTerminal && (
            <div className="pt-2 border-t border-slate-800/80">
              <button
                onClick={() => {
                  onOpenMobileTerminal();
                  setIsMobileOpen(false);
                }}
                title={isGerman ? 'Handheld / Tablet Barcode-Terminal öffnen' : 'Open Handheld / Tablet Scanner Terminal'}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 hover:text-emerald-100 transition-colors group relative"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                </div>

                {isExpanded && (
                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-emerald-200 group-hover:text-white">
                        {isGerman ? '📱 Mobil-Terminal' : '📱 Mobile / Tab Mode'}
                      </p>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/30 text-emerald-300 border border-emerald-400/40">
                        SCAN
                      </span>
                    </div>
                    <p className="text-[10px] text-emerald-300/80 truncate">
                      {isGerman ? 'Direkter Barcode-Scan vor Ort' : 'Touchscreen direct scanning'}
                    </p>
                  </div>
                )}
              </button>
            </div>
          )}

          {/* Master Data Administration Menu */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
            {isExpanded && (
              <div className="px-3 pb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {isGerman ? 'Stammdaten & Konfiguration' : 'Master Data & Specs'}
                </span>
              </div>
            )}

            <button
              onClick={() => {
                onOpenMasterData('products');
                setIsMobileOpen(false);
              }}
              title={t.masterDataBtn}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-slate-300 hover:text-white hover:bg-slate-800/90 transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Database className="w-5 h-5" />
              </div>

              {isExpanded && (
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="text-xs font-bold text-slate-200 group-hover:text-white">
                    {t.masterDataBtn}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {isGerman ? 'Kistenkapazität & Kundenstamm' : 'Box Capacities & OEM Master'}
                  </p>
                </div>
              )}
            </button>

            {/* Direct System Logs / Audit Trail Menu */}
            <button
              onClick={() => {
                onOpenMasterData('logs');
                setIsMobileOpen(false);
              }}
              title="System Logs & Traceability Audit Trail"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-slate-300 hover:text-white hover:bg-slate-800/90 transition-colors group relative"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>

              {isExpanded ? (
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-bold text-slate-200 group-hover:text-white">
                      {isGerman ? 'System-Protokolle' : 'System Logs & Audit'}
                    </p>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {auditLogs.length}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">
                    {isGerman ? 'Audit-Trail nach VDA/IATF' : 'Chronological Action Trail'}
                  </p>
                </div>
              ) : (
                auditLogs.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold shadow-xs">
                    {auditLogs.length > 99 ? '99+' : auditLogs.length}
                  </span>
                )
              )}
            </button>
          </div>

          {/* Language Selector Menu */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            {isExpanded && (
              <div className="px-3 flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isGerman ? 'Sprache / Language' : 'System Language'}</span>
                </span>
              </div>
            )}

            {isExpanded ? (
              <div className="grid grid-cols-2 gap-1.5 px-2 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-2.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    language === 'en'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>🇬🇧</span>
                  <span>English</span>
                </button>
                <button
                  onClick={() => setLanguage('de')}
                  className={`px-2.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    language === 'de'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Auf Deutsch umschalten (Speziell für Schwestergesellschaft)"
                >
                  <span>🇩🇪</span>
                  <span>Deutsch</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => setLanguage(language === 'en' ? 'de' : 'en')}
                  title={`Current: ${language.toUpperCase()} - Click to switch`}
                  className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold flex items-center justify-center text-slate-200 border border-slate-700"
                >
                  {language === 'en' ? '🇬🇧' : '🇩🇪'}
                </button>
              </div>
            )}
          </div>

          {/* Tabular Live Inventory Summary Strip in Sidebar */}
          {isExpanded && (
            <div className="pt-2 border-t border-slate-800/80 px-2 space-y-2">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 px-1">
                <span>{isGerman ? 'Status-Übersicht (Bestand)' : 'Inventory by Status'}</span>
                <span className="text-emerald-400 flex items-center gap-1 font-mono text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 text-xs font-mono">
                <table className="w-full text-[11px]">
                  <tbody>
                    <tr className="border-b border-slate-800/60">
                      <td className="text-slate-400 py-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>{isGerman ? '1. Im Werk-Lager' : '1. In Warehouse'}:</span>
                      </td>
                      <td className="text-right font-bold text-emerald-400">{packedReadyBoxes} bxs</td>
                    </tr>
                    <tr className="border-b border-slate-800/60">
                      <td className="text-slate-400 py-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span>{isGerman ? '2. Im Transit (Hub)' : '2. In Transit (Hub)'}:</span>
                      </td>
                      <td className="text-right font-bold text-amber-400">{inTransitBoxes} bxs</td>
                    </tr>
                    <tr className="border-b border-slate-800/60">
                      <td className="text-slate-400 py-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                        <span>{isGerman ? '3. Im Schwester-Lager' : '3. At Sister Hub'}:</span>
                      </td>
                      <td className="text-right font-bold text-purple-400">{sisterConcernBoxes} bxs</td>
                    </tr>
                    <tr>
                      <td className="text-slate-400 py-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <span>{isGerman ? '4. Ausgeliefert' : '4. Delivered'}:</span>
                      </td>
                      <td className="text-right font-bold text-blue-400">{dispatchedBoxes} bxs</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Plant Location Pill */}
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-lg p-2 text-[10px] text-slate-400 space-y-0.5">
                <div className="flex items-center gap-1 text-slate-300 font-semibold truncate">
                  <MapPin className="w-3 h-3 text-blue-400 shrink-0" />
                  <span className="truncate">{COMPANY_INFO.name}</span>
                </div>
                <p className="text-slate-500 truncate text-[9px]">
                  Takwe, Pune • {COMPANY_INFO.countryCode}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Pin & Status Bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400 shrink-0">
          {isExpanded ? (
            <>
              <div className="flex items-center gap-2 min-w-0 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate">IATF 16949 / VDA</span>
              </div>

              {/* Pin / Auto-collapse toggle button */}
              <button
                onClick={() => setAutoCollapseOnHover(!autoCollapseOnHover)}
                title={
                  autoCollapseOnHover
                    ? (isGerman ? 'Auto-Einklappen: Aktiviert (Erweitert bei Maus-Hover)' : 'Auto-collapse on hover: ON')
                    : (isGerman ? 'Auto-Einklappen: Deaktiviert' : 'Auto-collapse on hover: OFF')
                }
                className={`p-1.5 rounded-lg border text-[10px] flex items-center gap-1 transition-colors ${
                  autoCollapseOnHover
                    ? 'bg-blue-950/80 border-blue-500/50 text-blue-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {autoCollapseOnHover ? <Pin className="w-3 h-3" /> : <PinOff className="w-3 h-3" />}
                <span className="text-[10px] hidden sm:inline">
                  {autoCollapseOnHover ? (isGerman ? 'Auto-Klapp' : 'Auto') : (isGerman ? 'Fixiert' : 'Pinned')}
                </span>
              </button>
            </>
          ) : (
            <div className="w-full flex justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="System Online & Certified" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
