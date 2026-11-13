import React from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  FolderKanban, 
  Database, 
  Terminal, 
  PlusCircle,
  Compass,
  PanelLeftClose,
  Activity,
  Sparkles,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export default function TechnicalSidebar({ activeView, setActiveView, currentUser, onClose }) {
  const isSupreme = currentUser?.role === 'SUPREME';
  const isWebmaster = isSupreme || currentUser?.role === 'WEBMASTER';

  const navItems = [
    {
      id: 'dashboard',
      label: 'Portal Dashboard',
      icon: LayoutDashboard,
      activeColor: 'bg-gradient-to-r from-[#034081] to-[#00225a] text-white shadow-md shadow-[#034081]/30',
      iconColor: 'text-[#034081]',
      hoverBg: 'hover:bg-[#034081]/8'
    },
    {
      id: 'bridges',
      label: 'Bridge Registry',
      icon: FolderKanban,
      activeColor: 'bg-gradient-to-r from-[#034081] to-[#2563eb] text-white shadow-md shadow-[#2563eb]/30',
      iconColor: 'text-[#429afe]',
      hoverBg: 'hover:bg-[#034081]/8'
    },
    {
      id: 'culverts',
      label: 'Culvert Registry',
      icon: Layers,
      activeColor: 'bg-gradient-to-r from-[#7a3869] to-[#8e4b7b] text-white shadow-md shadow-[#8e4b7b]/30',
      iconColor: 'text-[#8e4b7b]',
      hoverBg: 'hover:bg-[#8e4b7b]/10'
    },
    {
      id: 'pipeline',
      label: 'Design Bottleneck Matrix',
      icon: Activity,
      activeColor: 'bg-gradient-to-r from-[#c43e0e] to-[#e95a24] text-white shadow-md shadow-[#e95a24]/30',
      iconColor: 'text-[#e95a24]',
      badge: 'Live',
      hoverBg: 'hover:bg-[#e95a24]/10'
    },
    {
      id: 'new_bridge',
      label: 'New Bridge Acquisition',
      icon: PlusCircle,
      activeColor: 'bg-gradient-to-r from-[#087f43] to-[#0eb865] text-white shadow-md shadow-[#0eb865]/30',
      iconColor: 'text-[#15db7c]',
      badge: 'Acquire',
      hoverBg: 'hover:bg-[#0eb865]/10'
    },
    {
      id: 'new_culvert',
      label: 'New Culvert Acquisition',
      icon: PlusCircle,
      activeColor: 'bg-gradient-to-r from-[#7a3869] to-[#8e4b7b] text-white shadow-md shadow-[#8e4b7b]/30',
      iconColor: 'text-[#8e4b7b]',
      badge: 'Acquire',
      hoverBg: 'hover:bg-[#8e4b7b]/10'
    }
  ];

  if (isWebmaster) {
    navItems.push({
      id: 'webmaster',
      label: 'Webmaster Console',
      icon: Database,
      activeColor: 'bg-gradient-to-r from-[#034081] to-[#01c1f2] text-white shadow-md shadow-[#01c1f2]/30',
      iconColor: 'text-[#01c1f2]',
      hoverBg: 'hover:bg-[#01c1f2]/10'
    });
  }

  if (isSupreme) {
    navItems.push({
      id: 'supreme',
      label: 'Supreme Operations',
      icon: Terminal,
      activeColor: 'bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white shadow-md shadow-[#7c3aed]/30',
      iconColor: 'text-[#7c3aed]',
      hoverBg: 'hover:bg-[#7c3aed]/10'
    });
  }

  return (
    <aside className="relative w-64 h-full bg-white/80 backdrop-blur-3xl border-r border-white/90 flex flex-col justify-between shrink-0 select-none shadow-[6px_0_32px_-12px_rgba(0,34,90,0.09)] overflow-hidden">
      {/* Comforting Ambient Breathing Background Aurora */}
      <div className="comforting-aurora" aria-hidden="true" />
      <div className="comforting-aurora-secondary" aria-hidden="true" />

      <div className="relative z-10 flex flex-col h-[calc(100%-80px)]">
        {/* Header with Sanctuary Badge */}
        <div className="relative group/header px-4 pt-3.5 pb-3 border-b border-[#00225a]/10 flex items-center justify-between bg-gradient-to-r from-white/75 via-white/60 to-white/75 backdrop-blur-2xl">
          {/* Subtle Chroma Underline Accent */}
          {/* <div className="continuous-chroma-bar !top-auto !bottom-0 !h-[1.5px] opacity-50" aria-hidden="true" /> */}

          <div className="flex items-center space-x-2.5">
            {/* Architectural RHD Crest Badge */}
            <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-[#034081] via-[#023166] to-[#001f54] text-white flex items-center justify-center font-black text-xs shadow-md shadow-[#034081]/25 border border-white/30 group-hover/header:scale-105 transition-transform duration-300">
              <span style={{ fontFamily: 'var(--font-display)' }} className="tracking-tighter text-white font-extrabold text-[11px]">
                RHD
              </span>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#15db7c] ring-2 ring-white comfort-status-pulse" />
            </div>

            <div className="flex flex-col">
              <span className="text-xs font-black tracking-tight uppercase text-[#001139]" style={{ fontFamily: 'var(--font-display)' }}>
                Technical Console
              </span>
              <div className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
                <span className="text-[9px] font-semibold tracking-wider text-[#5b6b7a]" style={{ fontFamily: 'var(--font-caption)' }}>
                  Registries & Views
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[#5b6b7a] hover:text-[#00225a] hover:bg-white/80 transition-all duration-200 cursor-pointer hover:shadow-2xs active:scale-95 group/btn"
                title="Collapse sidebar (Ctrl+B)"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="w-4 h-4 transition-transform duration-200 group-hover/btn:-translate-x-0.5" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Item List with Staggered Visual Flow */}
        <nav className="p-3 space-y-1.5 overflow-y-auto flex-1 custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`relative w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between text-xs font-semibold transition-all duration-300 cursor-pointer group border ${
                  isActive
                    ? 'bg-gradient-to-r from-[#034081] via-[#023166] to-[#001f54] text-white shadow-lg shadow-[#034081]/25 border-white/20'
                    : 'border-transparent text-[#00225a] hover:bg-white/85 hover:text-[#001139] hover:shadow-2xs hover:translate-x-1'
                }`}
                style={{ fontFamily: 'var(--font-subhead)' }}
              >
                {/* {isActive && (
                  <span className="absolute left-1 top-2 bottom-2 w-1 rounded-full bg-gradient-to-b from-[#38bdf8] to-[#15db7c] shadow-[0_0_8px_#38bdf8]" />
                )} */}
                <div className="flex items-center space-x-2.5">
                  <div className={`p-1 rounded-lg ${isActive ? 'bg-white/15' : 'bg-[#00225a]/5 group-hover:bg-[#034081]/10'} transition-colors`}>
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : item.iconColor}`} />
                  </div>
                  <span className="truncate">{item.label}</span>
                </div>
                {/* {isActive ? (
                  <ChevronRight className="w-3.5 h-3.5 text-[#38bdf8] opacity-80" />
                ) : item.badge ? (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider bg-[#15db7c]/20 text-[#00225a] border border-[#15db7c]/40" style={{ fontFamily: 'var(--font-caption)' }}>
                    {item.badge}
                  </span>
                ) : null} */}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Information Footer Strip (Floating Frosted Glass Sanctuary Card) */}
      <div className="relative z-10 p-2.5 m-2.5 rounded-xl bg-white/75 backdrop-blur-md border border-white/90 shadow-xs flex items-center space-x-2.5 transition-all duration-300 hover:bg-white/95">
        <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-[#034081] to-[#00225a] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ring-2 ring-[#429afe]/20" style={{ fontFamily: 'var(--font-display)' }}>
          {currentUser?.full_name ? currentUser.full_name.substring(0, 2).toUpperCase() : 'RH'}
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#15db7c] ring-1 ring-white comfort-status-pulse" />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-xs font-bold text-[#001139] truncate" style={{ fontFamily: 'var(--font-subhead)' }}>
            {currentUser?.full_name || 'RHD Engineer'}
          </span>
          <span className="text-[10px] text-[#5b6b7a] truncate font-medium" style={{ fontFamily: 'var(--font-body)' }}>
            {currentUser?.designation || currentUser?.role || 'Field Engineer'}
          </span>
        </div>
      </div>
    </aside>
  );
}
