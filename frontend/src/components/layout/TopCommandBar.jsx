import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronDown, 
  Check, 
  Globe, 
  PanelLeftClose, 
  PanelLeftOpen, 
  UserCog,
  Search 
} from 'lucide-react';
import { api } from '../../services/api';

const ROLES = [
  // 1. Constitutional Authority & Webmaster
  { key: 'SUPREME', username: 'supreme', label: 'Supreme Authority', group: 'Constitutional Audit & System Control', badgeColor: 'bg-[#112047]' },
  { key: 'WEBMASTER', username: 'webmaster', label: 'Central Webmaster', group: 'Senior System Analyst', badgeColor: 'bg-[#1c508c]' },

  // 2. Bridge Management Wing & Design Circle Leadership
  { key: 'BMW_ACE', username: 'bmw_ace', label: 'Bridge Management ACE', group: 'Additional Chief Engineer, BMW', badgeColor: 'bg-[#1c508c]' },
  { key: 'BDC_SE', username: 'bdc_se', label: 'Bridge Design Circle SE', group: 'Superintending Engineer, BDC', badgeColor: 'bg-[#1c508c]' },

  // 3. Bridge Design Divisions
  { key: 'BDD_EE_1', username: 'bdd_ee_1', label: 'Design Division-1 EE', group: 'Dhaka, Mymensingh, Rangpur', badgeColor: 'bg-[#1c508c]' },
  { key: 'BDD_EE_2', username: 'bdd_ee_2', label: 'Design Division-2 EE', group: 'Sylhet, Cumilla, Chattogram', badgeColor: 'bg-[#1c508c]' },
  { key: 'BDD_EE_3', username: 'bdd_ee_3', label: 'Design Division-3 EE', group: 'Khulna, Barishal, Rajshahi', badgeColor: 'bg-[#1c508c]' },
  { key: 'BDD_SDE', username: 'bdd_sde_1', label: 'Bridge Design SDE', group: 'Structural & Hydraulic Modeling', badgeColor: 'bg-[#1c508c]' },

  // 4. Field Hierarchy (Demonstration Corridor: Dhaka Zone)
  { key: 'FIELD_ACE', username: 'field_ace', label: 'Dhaka Zone ACE', group: 'Additional Chief Engineer, Dhaka Zone', badgeColor: 'bg-[#1e7e61]' },
  { key: 'FIELD_SE', username: 'field_se', label: 'Dhaka Circle SE', group: 'Superintending Engineer, Dhaka Circle', badgeColor: 'bg-[#1e7e61]' },
  { key: 'FIELD_EE', username: 'field_ee', label: 'Dhaka Division EE', group: 'Executive Engineer, Dhaka Road Div', badgeColor: 'bg-[#1e7e61]' },
  { key: 'FIELD_SDE', username: 'field_sde', label: 'Dhaka Sub-Div SDE', group: 'Sub-Divisional Engineer, Dhaka Sub-Div-1', badgeColor: 'bg-[#1e7e61]' },
  { key: 'FIELD_SAE', username: 'field_sae', label: 'Dhaka Section SAE', group: 'Sub-Assistant Engineer, Survey Team', badgeColor: 'bg-[#1e7e61]' },
];

export default function TopCommandBar({ 
  currentUser, 
  onRoleSwitched, 
  sidebarOpen, 
  onToggleSidebar,
  backdropMode = 'gradient',
  onBackdropModeChange
}) {
  const [switching, setSwitching] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [switcherTab, setSwitcherTab] = useState('roles'); // 'roles' or 'divisions'
  const [divisionList, setDivisionList] = useState([]);
  const [divisionSearch, setDivisionSearch] = useState('');
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (menuOpen && divisionList.length === 0) {
      loadDivisions();
    }
  }, [menuOpen]);

  const loadDivisions = async () => {
    try {
      const res = await api.getMasterDivisions();
      setDivisionList(res);
    } catch (err) {
      console.warn("Could not load divisions for switcher:", err);
    }
  };

  const handleRoleSelect = async (roleItem) => {
    try {
      setSwitching(true);
      setMenuOpen(false);
      const payload = roleItem.username ? { target_username: roleItem.username } : { target_role: roleItem.key };
      const res = await api.switchRole(payload);
      if (onRoleSwitched) onRoleSwitched(res.user);
    } catch (err) {
      alert(`Role switch error: ${err.message}`);
    } finally {
      setSwitching(false);
    }
  };

  const handleDivisionSelect = async (div, targetRole = null) => {
    try {
      setSwitching(true);
      setMenuOpen(false);
      const isDesign = div.name?.includes('Design') || div.code?.startsWith('BDD');
      const roleToRequest = targetRole || (isDesign ? 'BDD_EE' : 'FIELD_EE');
      const res = await api.switchRole({ 
        target_division_id: div.id,
        target_role: roleToRequest
      });
      if (onRoleSwitched) onRoleSwitched(res.user);
    } catch (err) {
      alert(`Division switch error: ${err.message}`);
    } finally {
      setSwitching(false);
    }
  };

  const isDivisionAccount = currentUser?.username?.startsWith('ee_') || 
                            currentUser?.username?.startsWith('sde_') || 
                            currentUser?.username?.startsWith('div_');
  const currentRoleMeta = ROLES.find(r => r.username === currentUser?.username || r.key === currentUser?.role) || ROLES[ROLES.length - 1];

  const filteredDivisions = divisionList.filter(d => 
    d.name.toLowerCase().includes(divisionSearch.toLowerCase()) ||
    d.code.toLowerCase().includes(divisionSearch.toLowerCase())
  );

  return (
    <header className="glass-header !shadow-none !border-none h-16 px-4 sm:px-6 flex items-center justify-between select-none z-30 sticky top-0 bg-white/85 backdrop-blur-md border-b border-[#cadbe7]/70">
          {/* Brand & System Title with Authentic RHD Logo */}
          <div className="flex items-center space-x-3">
            {/* Collapsible Sidebar Toggle Button */}
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="p-2 rounded-xl bg-white/80 hover:bg-white text-[#112047] border border-[#cadbe7] shadow-xs hover:shadow-sm transition-all cursor-pointer flex items-center justify-center shrink-0"
                title={sidebarOpen ? "Hide navigation sidebar (Ctrl+B)" : "Open navigation sidebar (Ctrl+B)"}
                aria-label="Toggle Sidebar"
              >
                {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
              </button>
            )}

            <div className="relative w-9 h-9 flex items-center justify-center p-0.5 shrink-0">
              <img 
                src="/RHD_Logo_512.png" 
                alt="RHD Logo" 
                className="w-full h-full object-contain drop-shadow-2xs"
                onError={(e) => { e.currentTarget.src = '/RHD_Logo.png'; }}
              />
              <span 
                className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#1e7e61] ring-2 ring-white animate-pulse shadow-xs" 
                title="Institutional Gateway Live & Synced"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-[#112047]" style={{ fontFamily: 'var(--font-display)' }}>
                  RHD DESC
                </span>
                <span className="text-[#cadbe7]">|</span>
                <span className="text-xs text-[#1c508c] font-extrabold px-1.5 py-0.5 tracking-wider hidden sm:inline" style={{ fontFamily: 'var(--font-subhead)' }}>
                  Data Exchange System for Coordination
                </span>
              </div>
              <span className="text-[10.5px] text-[#536b82] font-medium hidden md:inline">
                Bridge Design Circle • Roads and Highways Department
              </span>
            </div>
          </div>

          {/* Right Command Utilities */}
          <div className="flex items-center space-x-2 sm:space-x-3 text-xs">
            {/* Live Webmap Portal External Button */}
            <a
              href="https://webmap.rhdbridge.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-festive-blue text-xs font-semibold px-3 py-1.5"
              title="Open national GIS webmap portal in new tab"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Webmap</span>
            </a>

            {/* Role & Division Switcher Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                disabled={switching}
                className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xs bg-white/90 hover:bg-white text-[#112047] border border-[#cadbe7] transition-all cursor-pointer shadow-xs hover:shadow-sm active:scale-98"
              >
                <UserCog className="w-3.5 h-3.5 text-[#1c508c]" />
                <div className="flex flex-col text-right">
                  <span className="font-bold text-xs" style={{ fontFamily: 'var(--font-body)' }}>
                    {isDivisionAccount ? `${currentUser.full_name}` : currentRoleMeta.label}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-[#1c508c] transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} />
              </button>

              {menuOpen && (
                <div 
                  className="absolute right-0 top-full mt-2 w-88 sm:w-92 bg-white/95 backdrop-blur-3xl border border-[#cadbe7] rounded-2xl p-3 z-50 shadow-2xl dropdown-appear select-auto"
                  style={{
                    boxShadow: '0 28px 65px -12px rgba(17, 32, 71, 0.22), 0 12px 28px -6px rgba(17, 32, 71, 0.12), inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.95)'
                  }}
                >
                  {/* Header with Switcher Tabs: Roles vs 68 Divisions */}
                  <div className="px-1 pt-0.5 pb-2.5 border-b border-[#cadbe7]/80">
                    <div className="text-[11px] font-bold text-[#112047] uppercase tracking-wider mb-2" style={{ fontFamily: 'var(--font-caption)' }}>
                      Institutional Profile Switcher
                    </div>
                    <div className="grid grid-cols-2 gap-1 bg-[#e7f0f5] p-1 rounded-xs border border-[#cadbe7]/50">
                      <button
                        type="button"
                        onClick={() => setSwitcherTab('roles')}
                        className={`py-1.5 rounded-xs text-xs font-bold transition-all cursor-pointer ${
                          switcherTab === 'roles' ? 'bg-[#1c508c] text-white shadow-xs' : 'text-[#536b82] hover:text-[#112047] hover:bg-white/60'
                        }`}
                      >
                        Hierarchy ({ROLES.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSwitcherTab('divisions')}
                        className={`py-1.5 rounded-xs text-xs font-bold transition-all cursor-pointer ${
                          switcherTab === 'divisions' ? 'bg-[#1c508c] text-white shadow-xs' : 'text-[#536b82] hover:text-[#112047] hover:bg-white/60'
                        }`}
                      >
                        Field Divisions ({divisionList.length || 68})
                      </button>
                    </div>
                  </div>

                  {/* Tab 1: Roles List */}
                  {switcherTab === 'roles' && (
                    <div className="max-h-84 overflow-y-auto py-1.5 space-y-0.5 divide-y divide-[#cadbe7]/30">
                      {ROLES.map((role) => {
                        const isActive = (currentUser?.username === role.username || currentUser?.role === role.key) && !isDivisionAccount;
                        return (
                          <button
                            key={role.key}
                            onClick={() => handleRoleSelect(role)}
                            className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs transition-all duration-150 cursor-pointer rounded-xl hover:translate-x-0.5 ${
                              isActive
                                ? 'bg-[#e7f0f5] text-[#1c508c] font-bold border border-[#1c508c]/35'
                                : 'hover:bg-[#e7f0f5]/60 text-[#112047]'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <div className={`w-2.5 h-2.5 rounded-full ${role.badgeColor} shrink-0`}></div>
                              <div className="min-w-0">
                                <div className="font-bold text-[#112047] truncate" style={{ fontFamily: 'var(--font-subhead)' }}>{role.label}</div>
                                <div className="text-[10px] text-[#536b82] font-medium truncate">{role.group}</div>
                              </div>
                            </div>
                            {isActive && <Check className="w-4 h-4 text-[#1c508c] shrink-0 ml-2" />}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Tab 2: All 75 Division Institutional Accounts */}
                  {switcherTab === 'divisions' && (
                    <div className="py-1">
                      <div className="p-1">
                        <div className="relative">
                          <input
                            type="text"
                            value={divisionSearch}
                            onChange={e => setDivisionSearch(e.target.value)}
                            placeholder="Search division (e.g. Dhaka, Comilla)..."
                            className="eng-input text-xs py-1.5 pl-9! pr-2 w-full bg-slate-50 focus:bg-white rounded-lg transition-all"
                            autoFocus
                          />
                          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>

                      <div className="max-h-72 overflow-y-auto space-y-0.5 divide-y divide-slate-100 mt-1">
                        {filteredDivisions.length === 0 ? (
                          <div className="p-4 text-center text-slate-500 text-xs font-medium">No divisions found matching "{divisionSearch}".</div>
                        ) : (
                          filteredDivisions.map(div => {
                            const isThisDivision = currentUser?.office_division_id === div.id;
                            const isEE = isThisDivision && (currentUser?.role === 'FIELD_EE' || currentUser?.role === 'BDD_EE');
                            const isSDE = isThisDivision && (currentUser?.role === 'FIELD_SDE' || currentUser?.role === 'BDD_SDE');
                            const isDesign = div.name?.includes('Design') || div.code?.startsWith('BDD');

                            return (
                              <div
                                key={div.id}
                                className={`px-3 py-2 flex items-center justify-between text-xs transition-all duration-150 rounded-xl hover:translate-x-0.5 ${
                                  isThisDivision
                                    ? 'bg-blue-50/70 border border-blue-200/90'
                                    : 'hover:bg-slate-50 text-slate-900'
                                }`}
                              >
                                <div 
                                  className="min-w-0 pr-2 cursor-pointer flex-1"
                                  onClick={() => handleDivisionSelect(div, isDesign ? 'BDD_EE' : 'FIELD_EE')}
                                  title={`Click to login as EE (${div.name})`}
                                >
                                  <div className="font-bold text-slate-900 truncate">{div.name}</div>
                                  <div className="text-[10px] text-slate-500 font-mono truncate">
                                    Code: {div.code}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDivisionSelect(div, isDesign ? 'BDD_EE' : 'FIELD_EE');
                                    }}
                                    className={`px-2 py-0.5 text-[10.5px] font-bold rounded-md border transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                                      isEE
                                        ? 'bg-[#1c508c] text-white border-[#112047] shadow-xs ring-1 ring-blue-300'
                                        : 'bg-white hover:bg-[#e7f0f5] text-[#1c508c] border-[#cadbe7]'
                                    }`}
                                    title={`Login as Executive Engineer (${div.name})`}
                                  >
                                    EE
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDivisionSelect(div, isDesign ? 'BDD_SDE' : 'FIELD_SDE');
                                    }}
                                    className={`px-2 py-0.5 text-[10.5px] font-bold rounded-md border transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                                      isSDE
                                        ? 'bg-[#1e7e61] text-white border-[#134e40] shadow-xs ring-1 ring-emerald-300'
                                        : 'bg-white hover:bg-emerald-50 text-[#1e7e61] border-[#cadbe7]'
                                    }`}
                                    title={`Login as Sub-Divisional Engineer (${div.name})`}
                                  >
                                    SDE
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                      <div className="p-2 border-t border-slate-200 text-[10.5px] text-slate-600 bg-slate-50 rounded-b-xl text-center font-mono">
                        Default institutional password: <code className="bg-slate-200 px-1 rounded font-bold text-slate-800">rhd123</code> • Dual EE & SDE provisioned
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Continuous Chroma Horizon Bar (Background Palette, Left-to-Right, No Halo) */}
          <div className="continuous-chroma-bar" aria-hidden="true" />
        </header>
  )}