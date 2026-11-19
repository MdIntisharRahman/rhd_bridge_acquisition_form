import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  RotateCcw, 
  Construction, 
  Check, 
  MapPin, 
  Building2 
} from 'lucide-react';
import { api } from '../../services/api';

const JURISDICTION_INFO = {
  1: {
    title: "Bridge Design Division-1 (BDD-1)",
    zones: ["Dhaka Zone", "Mymensingh Zone", "Rangpur Zone"],
    // description: "Vested with structural & hydraulic designs for Dhaka, Mymensingh, and Rangpur Zones."
  },
  2: {
    title: "Bridge Design Division-2 (BDD-2)",
    zones: ["Sylhet Zone", "Comilla Zone", "Chattogram Zone"],
    // description: "Vested with structural & hydraulic designs for Sylhet, Comilla, and Chittagong Zones."
  },
  3: {
    title: "Bridge Design Division-3 (BDD-3)",
    zones: ["Khulna Zone", "Barishal Zone", "Rajshahi Zone", "Gopalganj Zone"],
    // description: "Vested with structural & hydraulic designs for Khulna, Barishal, Rajshahi, and Gopalganj Zones."
  }
};

export default function ReviewerWorkbenchDashboard({ currentUser, onOpenBridge, onOpenCulvert, onOpenReturnModal }) {
  const [bridges, setBridges] = useState([]);
  const [culverts, setCulverts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scopeFilter, setScopeFilter] = useState('vested'); // 'vested' or 'all'

  // Identify user's division number (1, 2, 3 or custom)
  const username = currentUser?.username?.toLowerCase() || '';
  const divId = currentUser?.office_division_id;
  let userBddNumber = 1;
  if (username.includes('2') || divId === 73) userBddNumber = 2;
  else if (username.includes('3') || divId === 74) userBddNumber = 3;
  else if (username.includes('1') || divId === 72) userBddNumber = 1;

  const currentJurisdiction = JURISDICTION_INFO[userBddNumber] || JURISDICTION_INFO[1];

  useEffect(() => {
    loadReviewDossiers();
  }, [currentUser]);

  const loadReviewDossiers = async () => {
    try {
      setLoading(true);
      const [brg, clv] = await Promise.all([
        api.getBridges(),
        api.getCulverts()
      ]);
      setBridges(brg);
      setCulverts(clv);
    } catch (err) {
      console.error("Failed to load review dossiers:", err);
    } finally {
      setLoading(false);
    }
  };

  const DESIGN_ACTIVE_STATES = [
    'TRANSMITTED_TO_BDD_EE',
    'ASSIGNED_TO_BDD_SDE',
    'DESIGN_PREPARED_PENDING_EE',
    'ASSIGNED_TO_BDD_EE',
    'FORWARDED_TO_BDC_SE'
  ];

  const allAssignedDossiers = [
    ...bridges.filter(b => DESIGN_ACTIVE_STATES.includes(b.workflow_status)).map(b => ({ ...b, type: 'BRIDGE' })),
    ...culverts.filter(c => DESIGN_ACTIVE_STATES.includes(c.workflow_status)).map(c => ({ ...c, type: 'CULVERT' }))
  ];

  // Filter according to territorial duty distribution:
  // If 'vested', filter items whose assigned_bdd_division_id matches user's division OR whose zone matches user's duty zones
  const assignedToDesign = allAssignedDossiers.filter(item => {
    if (scopeFilter === 'all') return true;
    if (item.assigned_bdd_division_id && divId) {
      return item.assigned_bdd_division_id === divId;
    }
    // Fallback match on zone name
    const itemZone = item.zone_name || '';
    return currentJurisdiction.zones.some(z => itemZone.toLowerCase().includes(z.toLowerCase().replace(' zone', '')));
  });

  const approvedComplete = [
    ...bridges.filter(b => ['DESIGN_APPROVED_COMPLETE', 'DISPATCHED_TO_FIELD_SDE'].includes(b.workflow_status)).map(b => ({ ...b, type: 'BRIDGE' })),
    ...culverts.filter(c => ['DESIGN_APPROVED_COMPLETE', 'DISPATCHED_TO_FIELD_SDE'].includes(c.workflow_status)).map(c => ({ ...c, type: 'CULVERT' }))
  ];

  const handleApprove = async (item) => {
    if (!window.confirm(`Approve prepared design deliverables and transmit directly to Field EE for ${item.code}?`)) return;
    try {
      if (item.type === 'BRIDGE') {
        await api.transitionBridge(item.id, {
          action: 'APPROVE_AND_TRANSMIT',
          endorsement_note: 'Prepared design drawings, calculation report, and BOQ approved and transmitted to Field EE.'
        });
      } else {
        await api.transitionCulvert(item.id, {
          action: 'APPROVE_AND_TRANSMIT',
          endorsement_note: 'Culvert hydraulic and structural design deliverables approved and transmitted to Field EE.'
        });
      }
      loadReviewDossiers();
    } catch (err) {
      alert(`Approval error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Scope */}
      <div className="glass-panel p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-[#034081] uppercase py-0.5 " style={{ fontFamily: 'var(--font-caption)' }}>
              {currentJurisdiction.title}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {currentUser?.designation || 'Bridge Design Engineering Staff'}
            </span>
          </div>
          <h1 className="text-xl font-black text-[#001139] mt-1.5" style={{ fontFamily: 'var(--font-display)' }}>
            Design Deliberation, Structural Scrutiny & Sign-Off
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            {currentJurisdiction.description}
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <div className="text-right">
            <div className="text-2xl font-black text-[#034081]" style={{ fontFamily: 'var(--font-display)' }}>
              {assignedToDesign.length}
            </div>
            <span className="text-[11px] font-bold text-slate-500">Under Deliberation</span>
          </div>
          <div className="h-8 w-px bg-slate-300"></div>
          <div className="text-right">
            <div className="text-2xl font-black text-[#087f43]" style={{ fontFamily: 'var(--font-display)' }}>
              {approvedComplete.length}
            </div>
            <span className="text-[11px] font-bold text-slate-500">Approved</span>
          </div>
        </div>
      </div>

      {/* Jurisdiction Duty Scope Banner */}
      <div className="glass-panel p-4 bg-sky-50/40 border-sky-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <Building2 className="w-4 h-4 text-[#034081] shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-[#00225a]">Territorial Deliberation Jurisdiction: </span>
            <span className="text-slate-700">
              Demands from {currentJurisdiction.zones.join(', ')} automatically arrive for this division's deliberation.
            </span>
          </div>
        </div>

        {/* Scope Toggle: Vested vs All */}
        <div className="flex items-center space-x-1 bg-white p-1 rounded-xs border border-sky-200 shrink-0">
          <button
            onClick={() => setScopeFilter('vested')}
            className={`px-3 py-1 rounded-xs text-xs font-bold transition-all cursor-pointer ${
              scopeFilter === 'vested'
                ? 'bg-[#034081] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Vested Demands ({assignedToDesign.length})
          </button>
          <button
            onClick={() => setScopeFilter('all')}
            className={`px-3 py-1 rounded-xs text-xs font-bold transition-all cursor-pointer ${
              scopeFilter === 'all'
                ? 'bg-[#034081] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Circle Dossiers ({allAssignedDossiers.length})
          </button>
        </div>
      </div>

      {/* Active Deliberation Table */}
      <div className="glass-panel p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
          <span className="text-sm font-bold text-[#001139]" style={{ fontFamily: 'var(--font-display)' }}>
            Dossiers Queued for Engineering Deliberation & Design Scrutiny
          </span>
          <span className="text-xs font-bold px-2.5 py-0.5  text-[#034081]"> 
          {/* Eliminated the stupid card here. */}
            {assignedToDesign.length} Dossiers
          </span>
        </div>

        {assignedToDesign.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs font-medium">
            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            No dossiers currently queued for deliberation in this territorial jurisdiction.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {assignedToDesign.map((item) => (
              <div key={`${item.type}_${item.id}`} className="py-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition-colors">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`font-mono font-bold ${item.type === 'CULVERT' ? 'text-[#8e4b7b]' : 'text-[#034081]'}`}>
                      {item.code}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="font-bold text-[#001139] text-sm" style={{ fontFamily: 'var(--font-display)' }}>
                      {item.bridge_name || item.culvert_name || 'Proposed Structure'}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                      item.type === 'CULVERT' 
                        ? 'bg-[#8e4b7b]/15 text-[#7a3869] border-[#8e4b7b]/30' 
                        : 'bg-[#034081]/10 text-[#034081] border-[#034081]/25'
                    }`}>
                      {item.type}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 font-bold border border-sky-200">
                      {item.workflow_status.replace(/_/g, ' ')}
                    </span>
                    {item.zone_name && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200 flex items-center space-x-1">
                        <MapPin className="w-2.5 h-2.5" />
                        <span>{item.zone_name}</span>
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Road: <span className="font-semibold text-slate-800">{item.road_name || 'N/A'}</span> • 
                    Chainage: <span className="font-mono font-semibold text-sky-900">
                      {item.chainage_km !== null && item.chainage_km !== undefined ? `Ch ${item.chainage_km}+${item.chainage_m || 0}` : (item.location_chainage_gps_text || item.location_chainage_lrp_gps || 'Ch not set')}
                    </span>
                    {item.division_name && (
                      <span> • Originating Division: <span className="font-semibold text-slate-800">{item.division_name}</span></span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-xs shrink-0">
                  <button
                    onClick={() => item.type === 'BRIDGE' ? onOpenBridge(item.id) : onOpenCulvert(item.id)}
                    className="px-3 py-1.5 rounded-xs bg-white/80 hover:bg-[#034081] text-[#00225a] hover:text-white border border-[#00225a] font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs table-action-icon"
                  >
                    <Construction className="w-3.5 h-3.5" />
                    <span>Deliberate & Scrutinize</span>
                  </button>

                  <button
                    onClick={() => onOpenReturnModal(item)}
                    className="btn-festive-orange text-xs font-bold px-3 py-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Return</span>
                  </button>

                  <button
                    onClick={() => handleApprove(item)}
                    className="btn-festive-green text-xs font-bold px-3 py-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
