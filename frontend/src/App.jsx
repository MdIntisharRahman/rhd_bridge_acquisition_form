import React, { useState, useEffect } from 'react';
import { api, getStoredUser, getStoredToken } from './services/api';
import TopCommandBar from './components/layout/TopCommandBar';
import TechnicalSidebar from './components/layout/TechnicalSidebar';
import FieldDivisionDashboard from './components/dashboard/FieldDivisionDashboard';
import ReviewerWorkbenchDashboard from './components/dashboard/ReviewerWorkbenchDashboard';
import WebmasterConsole from './components/dashboard/WebmasterConsole';
import SupremeOperationsConsole from './components/dashboard/SupremeOperationsConsole';
import BridgeRegistry from './components/registries/BridgeRegistry';
import CulvertRegistry from './components/registries/CulvertRegistry';
import BridgeAcquisitionWorkspace from './components/bridge/BridgeAcquisitionWorkspace';
import CulvertAcquisitionWorkspace from './components/culvert/CulvertAcquisitionWorkspace';
import DesignPipelineDashboard from './components/pipeline/DesignPipelineDashboard';
import ReturnForCorrectionModal from './components/workflow/ReturnForCorrectionModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedAcquisitionId, setSelectedAcquisitionId] = useState(null);
  const [returnModalItem, setReturnModalItem] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    return localStorage.getItem('rhd_sidebar_open') !== 'false';
  });
  const [backdropMode, setBackdropMode] = useState(() => {
    return localStorage.getItem('rhd_backdrop_mode') || 'gradient';
  });

  const toggleSidebar = () => {
    setSidebarOpen(prev => {
      const next = !prev;
      localStorage.setItem('rhd_sidebar_open', String(next));
      return next;
    });
  };

  const handleBackdropModeChange = (mode) => {
    setBackdropMode(mode);
    localStorage.setItem('rhd_backdrop_mode', mode);
  };

  useEffect(() => {
    initAuth();

    // Ctrl+B Keyboard Shortcut to Toggle Sidebar
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const initAuth = async () => {
    try {
      const stored = getStoredUser();
      const token = getStoredToken();
      if (stored && token) {
        setCurrentUser(stored);
      } else {
        // Auto authenticate as default Field SAE demo account
        const res = await api.switchRole('FIELD_SAE');
        setCurrentUser(res.user);
      }
    } catch (err) {
      console.warn("Initial authentication fallback:", err);
      // Fallback mock user if backend is spinning up
      setCurrentUser({
        id: 3,
        username: 'field_sae',
        full_name: 'Md. Tareq Hasan',
        role: 'FIELD_SAE',
        designation: 'Sub-Assistant Engineer, Dhaka Road Division'
      });
    } finally {
      setInitializing(false);
    }
  };

  const handleRoleSwitched = (user) => {
    setCurrentUser(user);
    // Return to appropriate dashboard
    setActiveView('dashboard');
    setSelectedAcquisitionId(null);
  };

  const openBridgeWorkspace = (id = null) => {
    setSelectedAcquisitionId(id);
    setActiveView(id ? 'edit_bridge' : 'new_bridge');
  };

  const openCulvertWorkspace = (id = null) => {
    setSelectedAcquisitionId(id);
    setActiveView(id ? 'edit_culvert' : 'new_culvert');
  };

  // Render Role-Appropriate Dashboard
  const renderDashboard = () => {
    const role = currentUser?.role || 'FIELD_SAE';

    if (role === 'SUPREME') {
      return <SupremeOperationsConsole currentUser={currentUser} />;
    }
    if (role === 'WEBMASTER') {
      return <WebmasterConsole currentUser={currentUser} />;
    }
    if (['BDD_EE', 'BDD_SDE'].includes(role)) {
      return (
        <ReviewerWorkbenchDashboard
          currentUser={currentUser}
          onOpenBridge={openBridgeWorkspace}
          onOpenCulvert={openCulvertWorkspace}
          onOpenReturnModal={item => setReturnModalItem(item)}
        />
      );
    }
    // Default: Field Division (SAE / SDE / EE)
    return (
      <FieldDivisionDashboard
        currentUser={currentUser}
        onOpenBridge={openBridgeWorkspace}
        onOpenCulvert={openCulvertWorkspace}
        onNewBridge={() => openBridgeWorkspace(null)}
        onNewCulvert={() => openCulvertWorkspace(null)}
      />
    );
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-slate-700">
        <div className="w-16 h-16 bg-white border border-slate-300 p-1 flex items-center justify-center mb-4">
          <img 
            src="/RHD_Logo.png" 
            alt="RHD Logo" 
            className="w-full h-full object-contain"
            onError={(e) => { e.currentTarget.src = '/RHD_Logo.png'; }}
          />
        </div>
        <div className="text-lg font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>
          RHD ADDS
        </div>
        <div className="text-xs text-slate-600 mt-1 font-semibold" style={{ fontFamily: 'var(--font-subhead)' }}>
          Automated Design Data System • Initializing Workspace...
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col text-[#00225a] font-sans relative overflow-x-hidden"
    >
      {/* Background Image Under Whitish Thin Layer & Refined Engineering Gradient */}
      <div className="ambient-canvas-wrapper">
        <div className="ambient-photo-base" />
        <div className="ambient-veil" />
        <div className="ambient-gradient-base" />
        <div className="ambient-orb ambient-orb-1" />
        <div className="ambient-orb ambient-orb-2" />
        <div className="ambient-orb ambient-orb-3" />
      </div>

      {/* Top Precision Command Bar with Sidebar & Backdrop Toggles */}
      <TopCommandBar
        currentUser={currentUser}
        onRoleSwitched={handleRoleSwitched}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={toggleSidebar}
        backdropMode={backdropMode}
        onBackdropModeChange={handleBackdropModeChange}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Collapsible Technical Sidebar */}
        <div 
          className={`transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shrink-0 z-20 overflow-hidden flex flex-col ${
            sidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 pointer-events-none'
          }`}
        >
          <TechnicalSidebar
            activeView={activeView}
            setActiveView={view => {
              setActiveView(view);
              if (view === 'new_bridge') openBridgeWorkspace(null);
              if (view === 'new_culvert') openCulvertWorkspace(null);
            }}
            currentUser={currentUser}
            onClose={toggleSidebar}
          />
        </div>

        {/* Content Pane */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto view-appear" key={activeView}>
            {activeView === 'dashboard' && renderDashboard()}
            {activeView === 'bridges' && (
              <BridgeRegistry
                onOpenBridge={openBridgeWorkspace}
                onNewBridge={() => openBridgeWorkspace(null)}
              />
            )}
            {activeView === 'culverts' && (
              <CulvertRegistry
                onOpenCulvert={openCulvertWorkspace}
                onNewCulvert={() => openCulvertWorkspace(null)}
              />
            )}
            {activeView === 'pipeline' && (
              <DesignPipelineDashboard
                currentUser={currentUser}
                onOpenBridge={openBridgeWorkspace}
                onOpenCulvert={openCulvertWorkspace}
              />
            )}
            {(activeView === 'new_bridge' || activeView === 'edit_bridge') && (
              <BridgeAcquisitionWorkspace
                acquisitionId={selectedAcquisitionId}
                currentUser={currentUser}
                onBack={() => setActiveView('bridges')}
                onSaved={newId => setSelectedAcquisitionId(newId)}
              />
            )}
            {(activeView === 'new_culvert' || activeView === 'edit_culvert') && (
              <CulvertAcquisitionWorkspace
                acquisitionId={selectedAcquisitionId}
                currentUser={currentUser}
                onBack={() => setActiveView('culverts')}
                onSaved={newId => setSelectedAcquisitionId(newId)}
              />
            )}
            {activeView === 'webmaster' && <WebmasterConsole currentUser={currentUser} />}
            {activeView === 'supreme' && <SupremeOperationsConsole currentUser={currentUser} />}
          </div>
        </main>
      </div>

      {/* Global Return for Correction Modal */}
      {returnModalItem && (
        <ReturnForCorrectionModal
          item={returnModalItem}
          onClose={() => setReturnModalItem(null)}
          onSuccess={() => {
            setActiveView('dashboard');
          }}
        />
      )}
    </div>
  );
}
