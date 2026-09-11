import React from 'react';
import { useTraceability } from '../context/TraceabilityContext';
import { useLanguage } from '../context/LanguageContext';
import { ActiveActor } from '../types';
import {
  Package,
  Truck,
  Building2,
  ShieldAlert,
  Database,
  Layers,
  Sparkles,
  Barcode,
  Globe
} from 'lucide-react';

interface NavbarProps {
  onOpenMasterData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMasterData }) => {
  const {
    activeActor,
    setActiveActor,
    boxes,
    containmentNotices
  } = useTraceability();

  const { language, setLanguage, t } = useLanguage();

  const packedReadyBoxes = boxes.filter((b) => b.status === 'PACKED_IN_STOCK').length;
  const sisterConcernBoxes = boxes.filter((b) => b.status === 'AT_SISTER_CONCERN').length;

  const navItems: { id: ActiveActor; label: string; actorNum: string; role: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'actor1',
      label: t.actor1Label,
      actorNum: 'Actor 1',
      role: t.actor1Role,
      icon: <Package className="w-4 h-4" />
    },
    {
      id: 'actor2',
      label: t.actor2Label,
      actorNum: 'Actor 2',
      role: t.actor2Role,
      icon: <Truck className="w-4 h-4" />,
      badge: packedReadyBoxes > 0 ? packedReadyBoxes : undefined
    },
    {
      id: 'actor3',
      label: t.actor3Label,
      actorNum: 'Actor 3',
      role: t.actor3Role,
      icon: <Building2 className="w-4 h-4" />,
      badge: sisterConcernBoxes > 0 ? sisterConcernBoxes : undefined
    },
    {
      id: 'actor4',
      label: t.actor4Label,
      actorNum: 'Actor 4',
      role: t.actor4Role,
      icon: <ShieldAlert className="w-4 h-4" />,
      badge: containmentNotices.length > 0 ? containmentNotices.length : undefined
    }
  ];

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
              <Barcode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">
                  {t.appTitle}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {t.appBadge}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Right Actions: Language Switcher & Master Data */}
          <div className="flex items-center gap-3">
            {/* Dual Language Selector Toggle */}
            <div className="flex items-center bg-slate-800/90 p-1 rounded-lg border border-slate-700">
              <span className="text-slate-400 pl-2 pr-1.5 flex items-center gap-1 text-[11px] font-semibold hidden sm:flex">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.languageSelect}:</span>
              </span>

              <button
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
                  language === 'en'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-750'
                }`}
                title="Switch to English"
              >
                <span>🇬🇧</span>
                <span>EN</span>
              </button>

              <button
                onClick={() => setLanguage('de')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
                  language === 'de'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-750'
                }`}
                title="Auf Deutsch umschalten (Speziell für Schwestergesellschaft)"
              >
                <span>🇩🇪</span>
                <span>DE</span>
              </button>
            </div>

            {/* Master Data button */}
            <button
              onClick={onOpenMasterData}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors shadow-xs"
            >
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden md:inline">{t.masterDataBtn}</span>
              <span className="md:hidden">Master Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Actor Tab Switcher */}
      <div className="bg-slate-950/80 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none" aria-label="Actors">
            {navItems.map((item) => {
              const isActive = activeActor === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveActor(item.id)}
                  className={`flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-xs transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80 font-medium'
                  }`}
                >
                  <span className={`p-1 rounded ${isActive ? 'bg-white/20' : 'bg-slate-800 text-slate-400'}`}>
                    {item.icon}
                  </span>
                  <div className="text-left leading-tight">
                    <span className="text-[10px] uppercase font-bold tracking-wider block opacity-75">
                      {item.actorNum}
                    </span>
                    <span>{item.label}</span>
                  </div>

                  {typeof item.badge === 'number' && (
                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white text-blue-700' : 'bg-slate-800 text-blue-400 border border-slate-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
