import React, { useState } from 'react';
import { TraceabilityProvider, useTraceability } from './context/TraceabilityContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Sidebar } from './components/Sidebar';
import { Actor1Packaging } from './components/Actor1Packaging';
import { Actor2Dispatch } from './components/Actor2Dispatch';
import { Actor3SisterConcern } from './components/Actor3SisterConcern';
import { Actor4QA } from './components/Actor4QA';
import { Dashboard } from './components/Dashboard';
import { MasterDataModal } from './components/MasterDataModal';
import { MobileScannerTerminal } from './components/MobileScannerTerminal';
import {
  Package,
  Truck,
  Building2,
  ShieldAlert,
  ArrowRight,
  Info,
  CheckCircle2,
  Database,
  Menu,
  Globe,
  Layers,
  ChevronRight,
  Smartphone,
  LayoutDashboard
} from 'lucide-react';

const MainContent: React.FC = () => {
  const { activeActor, setActiveActor } = useTraceability();
  const { t, language, setLanguage, isGerman } = useLanguage();
  const [isMasterDataOpen, setIsMasterDataOpen] = useState(false);
  const [masterDataTab, setMasterDataTab] = useState<'products' | 'customers' | 'logs'>('products');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isGlobalMobileScannerOpen, setIsGlobalMobileScannerOpen] = useState(false);

  const handleOpenMasterData = (tab: 'products' | 'customers' | 'logs' = 'products') => {
    setMasterDataTab(tab);
    setIsMasterDataOpen(true);
  };

  const activeActorNames = {
    actor1: { name: t.actor1Label, role: t.actor1Role, step: '1' },
    actor2: { name: t.actor2Label, role: t.actor2Role, step: '2' },
    actor3: { name: t.actor3Label, role: t.actor3Role, step: '3' },
    actor4: { name: t.actor4Label, role: t.actor4Role, step: '4' },
    dashboard: { name: isGerman ? 'Dashboard' : 'Dashboard', role: 'KPI Overview', step: '0' },
  };

  const currentStation = activeActorNames[activeActor];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex font-sans antialiased">
      {/* Left-Hand Auto-Collapsible Sidebar */}
      <Sidebar
        onOpenMasterData={handleOpenMasterData}
        onOpenMobileTerminal={() => setIsGlobalMobileScannerOpen(true)}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Layout Area on the Right */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Top Header & Breadcrumb Bar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
          <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            
            {/* Mobile Sidebar Toggle & Station Breadcrumb */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setIsMobileOpen(true)}
                className="lg:hidden p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                aria-label="Open Sidebar Menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 text-xs truncate">
                <span className="text-slate-400 font-medium hidden sm:inline">
                  {isGerman ? 'Automobil Rückverfolgbarkeit' : 'Traceability Hub'}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 hidden sm:inline" />
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                    {currentStation.step}
                  </span>
                  <span className="font-bold text-slate-900 text-sm truncate">
                    {currentStation.name}
                  </span>
                  <span className="text-slate-500 text-xs hidden md:inline">
                    ({currentStation.role})
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Header Controls & Language Switcher */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Handheld Mobile / Tablet Terminal Button */}
              <button
                type="button"
                onClick={() => setIsGlobalMobileScannerOpen(true)}
                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                title="Handheld mobile barcode/QR scanner terminal"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">📱 Mobile / Tab Mode</span>
                <span className="sm:hidden">📱 Scan</span>
              </button>

              {/* Quick Master Data trigger */}
              <button
                type="button"
                onClick={() => setIsMasterDataOpen(true)}
                className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors hidden sm:flex"
                title={t.masterDataBtn}
              >
                <Database className="w-3.5 h-3.5 text-indigo-600" />
                <span>{t.masterDataBtn}</span>
              </button>

              {/* Language Pill Switcher */}
              <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-2 py-0.5 rounded transition-all flex items-center gap-1 ${
                    language === 'en'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>🇬🇧</span>
                  <span className="hidden sm:inline">EN</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('de')}
                  className={`px-2 py-0.5 rounded transition-all flex items-center gap-1 ${
                    language === 'de'
                      ? 'bg-white text-amber-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Auf Deutsch umschalten (Speziell für Schwestergesellschaft)"
                >
                  <span>🇩🇪</span>
                  <span className="hidden sm:inline">DE</span>
                </button>
              </div>
            </div>
          </div>

          {/* Workflow Pipeline Guidance Strip */}
          <div className="bg-slate-50/80 border-t border-slate-200/80 px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-600 text-[11px]">
                <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="font-semibold text-slate-800">{t.workflowTitle}</span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => setActiveActor('actor1')}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
                    activeActor === 'actor1'
                      ? 'bg-blue-600 text-white font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-bold">1</span>
                  <span>{t.step1Short}</span>
                </button>

                <ArrowRight className="w-3 h-3 text-slate-300" />

                <button
                  type="button"
                  onClick={() => setActiveActor('actor2')}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
                    activeActor === 'actor2'
                      ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-bold">2</span>
                  <span>{t.step2Short}</span>
                </button>

                <ArrowRight className="w-3 h-3 text-slate-300" />

                <button
                  type="button"
                  onClick={() => setActiveActor('actor3')}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
                    activeActor === 'actor3'
                      ? 'bg-purple-600 text-white font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-bold">3</span>
                  <span>{t.step3Short}</span>
                </button>

                <ArrowRight className="w-3 h-3 text-slate-300" />

                <button
                  type="button"
                  onClick={() => setActiveActor('actor4')}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
                    activeActor === 'actor4'
                      ? 'bg-red-600 text-white font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-bold">4</span>
                  <span>{t.step4Short}</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Workspace Body */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeActor === 'actor1' && <Actor1Packaging />}
          {activeActor === 'actor2' && <Actor2Dispatch />}
          {activeActor === 'actor3' && <Actor3SisterConcern />}
          {activeActor === 'actor4' && <Actor4QA />}
          {activeActor === 'dashboard' && <Dashboard />}
        </main>

        {/* Industrial Compliance Footer */}
        <footer className="bg-white border-t border-slate-200 py-4 text-xs text-slate-500 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{t.footerStandard}</span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <button
                type="button"
                onClick={() => setIsMasterDataOpen(true)}
                className="text-blue-600 hover:underline flex items-center gap-1"
              >
                <Database className="w-3 h-3" />
                <span>{t.masterDataBtn}</span>
              </button>
              <span className="text-slate-400">{t.footerStatus}</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Master Data Modal */}
      <MasterDataModal
        key={masterDataTab}
        isOpen={isMasterDataOpen}
        onClose={() => setIsMasterDataOpen(false)}
        defaultTab={masterDataTab}
      />

      {/* Global Handheld Scanner / Mobile Terminal */}
      <MobileScannerTerminal
        isOpen={isGlobalMobileScannerOpen}
        onClose={() => setIsGlobalMobileScannerOpen(false)}
        defaultMode={
          activeActor === 'actor1'
            ? 'pack'
            : activeActor === 'actor3'
            ? 'sister'
            : activeActor === 'actor4'
            ? 'audit'
            : 'dispatch'
        }
      />
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <TraceabilityProvider>
        <MainContent />
      </TraceabilityProvider>
    </LanguageProvider>
  );
}
