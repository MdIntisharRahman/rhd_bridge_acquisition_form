import React, { useState, useEffect } from 'react';
import { 
  FileEdit, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  ArrowRight, 
  Plus, 
  CircleArrowRight, 
  FolderKanban, 
  ArrowBigRightIcon,
  ArrowBigRightDashIcon,
  InspectIcon
} from 'lucide-react';
import { api } from '../../services/api';

export default function FieldDivisionDashboard({ currentUser, onOpenBridge, onOpenCulvert, onNewBridge, onNewCulvert }) {
  const [bridges, setBridges] = useState([]);
  const [culverts, setCulverts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDossiers();
  }, [currentUser]);

  const loadDossiers = async () => {
    try {
      setLoading(true);
      const [brg, clv] = await Promise.all([
        api.getBridges(),
        api.getCulverts()
      ]);
      setBridges(brg);
      setCulverts(clv);
    } catch (err) {
      console.error("Failed to load dossiers:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter queues
  const drafts = [...bridges.filter(b => b.workflow_status === 'DRAFT_FIELD').map(b => ({ ...b, type: 'BRIDGE' })),
                  ...culverts.filter(c => c.workflow_status === 'DRAFT_FIELD').map(c => ({ ...c, type: 'CULVERT' }))];

  const pendingEE = [...bridges.filter(b => ['PENDING_FIELD_EE_AUTH', 'PASS_TO_FIELD_SDE'].includes(b.workflow_status)).map(b => ({ ...b, type: 'BRIDGE' })),
                     ...culverts.filter(c => ['PENDING_FIELD_EE_AUTH', 'PASS_TO_FIELD_SDE'].includes(c.workflow_status)).map(c => ({ ...c, type: 'CULVERT' }))];

  const returned = [...bridges.filter(b => b.workflow_status === 'RETURNED_FOR_CORRECTION').map(b => ({ ...b, type: 'BRIDGE' })),
                    ...culverts.filter(c => c.workflow_status === 'RETURNED_FOR_CORRECTION').map(c => ({ ...c, type: 'CULVERT' }))];

  const designStates = ['TRANSMITTED_TO_BDD_EE', 'ASSIGNED_TO_BDD_SDE', 'DESIGN_PREPARED_PENDING_EE'];
  const activeInPipeline = [...bridges.filter(b => designStates.includes(b.workflow_status)).map(b => ({ ...b, type: 'BRIDGE' })),
                            ...culverts.filter(c => designStates.includes(c.workflow_status)).map(c => ({ ...c, type: 'CULVERT' }))];

  const deliveredPackages = [...bridges.filter(b => ['DESIGN_APPROVED_COMPLETE', 'DISPATCHED_TO_FIELD_SDE'].includes(b.workflow_status)).map(b => ({ ...b, type: 'BRIDGE' })),
                             ...culverts.filter(c => ['DESIGN_APPROVED_COMPLETE', 'DISPATCHED_TO_FIELD_SDE'].includes(c.workflow_status)).map(c => ({ ...c, type: 'CULVERT' }))];

  const approvedCount = deliveredPackages.length;

  return (
    <div className="space-y-5">
      {/* Title & Action Strip */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b-2 border-slate-300">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-blue-800 uppercase py-0.5" style={{ fontFamily: 'var(--font-body-spesh)' }}>
              Field Division Workbench
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {currentUser?.designation || 'Field Division Office'}
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 mt-1" style={{ fontFamily: 'var(--font-display)' }}>
            Bridge & Culvert Data Acquisition Management Console
          </h1>
        </div>

        <div className="flex items-center space-x-2 mt-3 sm:mt-0">
          <button
            onClick={onNewBridge}
            className="btn-festive-blue text-xs font-semibold px-4 py-2 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Bridge</span>
          </button>
          <button
            onClick={onNewCulvert}
            className="btn-festive-culvert text-xs font-semibold px-4 py-2 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Culvert</span>
          </button>
        </div>
      </div>

      {/* Returned For Correction Banner (if any) */}
      {returned.length > 0 && (
        <div className="glass-panel p-4 border border-rose-300 bg-rose-50/40">
          <div className="flex items-center space-x-2 text-rose-900 font-bold text-xs uppercase mb-2.5" style={{ fontFamily: 'var(--font-subhead)' }}>
            <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
            <span>Action Required: {returned.length} Structure(s) Returned for Correction</span>
          </div>
          <div className="space-y-2">
            {returned.map((item) => (
              <div key={item.code} className="p-3 rounded-xl bg-white/60 border border-white/80 flex items-center justify-between text-xs backdrop-blur-md">
                <div>
                  <div className="font-bold flex items-center space-x-2">
                    <span className={item.type === 'BRIDGE' ? 'text-[#034081]' : 'text-[#8e4b7b]'} style={{ fontFamily: 'var(--font-caption)' }}>
                      {item.code}
                    </span>
                    <span className="text-[#5b6b7a]">•</span>
                    <span className="text-[#001139]">{item.bridge_name || item.culvert_name}</span>
                  </div>
                  <div className="text-[#5b6b7a] mt-0.5 text-[11px]">
                    Reason: <i>{item.return_reason_notes || 'Revision requested by Bridge Design Circle'}</i>
                  </div>
                </div>
                <button
                  onClick={() => item.type === 'BRIDGE' ? onOpenBridge(item.id) : onOpenCulvert(item.id)}
                  className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center space-x-1 cursor-pointer transition-colors shadow-xs table-action-icon"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  <span>Edit Correction</span>
                  <CircleArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metrics Track (Unified Glass Panels with Jewel Badges) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-panel glass-metric-card cursor-default p-4 flex items-center justify-between">
          <div>
            <div className="text-2xl font-extrabold text-slate-600 tabular-nums" style={{ fontFamily: 'var(--font-display)' }}>
              {drafts.length}
            </div>
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wide mt-0.5" style={{ fontFamily: 'var(--font-subhead)' }}>
              Drafts In Prep
            </div>
            <div className="text-[11px] text-slate-600 mt-0.5 font-medium">
              Field SAE / SDE Entry
            </div>
          </div>
          <div className="w-10 h-10 text-slate-600 flex items-center justify-center glass-metric-icon transition-transform">
            <FileEdit className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel glass-metric-card cursor-default p-4 flex items-center justify-between">
          <div>
            <div className="text-2xl font-extrabold text-amber-700 tabular-nums" style={{ fontFamily: 'var(--font-display)' }}>
              {pendingEE.length}
            </div>
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wide mt-0.5" style={{ fontFamily: 'var(--font-subhead)' }}>
              Awaiting EE Auth
            </div>
            <div className="text-[11px] text-amber-700 mt-0.5 font-medium">
              Ready for Authorization
            </div>
          </div>
          <div className="w-10 h-10 text-amber-700 flex items-center justify-center glass-metric-icon transition-transform">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel glass-metric-card cursor-default p-4 flex items-center justify-between">
          <div>
            <div className="text-2xl font-extrabold text-shadow-blue-950 tabular-nums" style={{ fontFamily: 'var(--font-display)' }}>
              {activeInPipeline.length}
            </div>
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wide mt-0.5" style={{ fontFamily: 'var(--font-subhead)' }}>
              With Design Division
            </div>
            <div className="text-[11px] text-shadow-blue-950 mt-0.5 font-medium">
              BDD-1/2/3 EE & SDE Modeling
            </div>
          </div>
          <div className="w-10 h-10 text-shadow-blue-950 flex items-center justify-center glass-metric-icon transition-transform">
            <FolderKanban className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel glass-metric-card cursor-default p-4 flex items-center justify-between">
          <div>
            <div className="text-2xl font-extrabold text-[#087f43] tabular-nums" style={{ fontFamily: 'var(--font-display)' }}>
              {approvedCount}
            </div>
            <div className="text-xs font-bold text-[#00225a] uppercase tracking-wide mt-0.5" style={{ fontFamily: 'var(--font-subhead)' }}>
              Delivered / Dispatched
            </div>
            <div className="text-[11px] text-emerald-700 mt-0.5 font-medium">
              Ready for Field Execution
            </div>
          </div>
          <div className="w-10 h-10 text-emerald-700 flex items-center justify-center glass-metric-icon transition-transform">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Queues Split Grids (Unified Glass Panels) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Queue 1: Pending Field EE Review / Authorization */}
        <div className="glass-panel p-4">
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-sky-200/25">
            <span className="text-sm font-bold text-[#001139]" style={{ fontFamily: 'var(--font-subhead)' }}>
              Awaiting Field Division EE Authorization
            </span>
            <span className="text-xs font-bold px-2 py-0.5 text-amber-800" style={{ fontFamily: 'var(--font-caption)' }}>
              {pendingEE.length}
            </span>
          </div>
          <div className="divide-y divide-white/40 min-h-[160px]">
            {pendingEE.length === 0 ? (
              <div className="py-10 text-center text-xs text-[#5b6b7a] font-medium">
                No acquisitions currently awaiting Field EE authorization.
              </div>
            ) : (
              pendingEE.map((item) => (
                <div key={item.code} className="py-2.5 flex items-center justify-between text-xs hover:bg-white/40 px-2 rounded-lg transition-colors">
                  <div>
                    <div className="flex items-center space-x-2 font-bold">
                      <span className={item.type === 'BRIDGE' ? 'text-[#034081]' : 'text-[#8e4b7b]'} style={{ fontFamily: 'var(--font-caption)' }}>
                        {item.code}
                      </span>
                      <span className="text-[#5b6b7a]">•</span>
                      <span className="text-[#001139] truncate max-w-[220px]">
                        {item.bridge_name || item.culvert_name || item.road_name}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#5b6b7a] mt-0.5 tabular-nums">
                      {item.location_chainage_gps_text || item.location_chainage_lrp_gps || 'Chainage not set'}
                    </div>
                  </div>
                  <button
                    onClick={() => item.type === 'BRIDGE' ? onOpenBridge(item.id) : onOpenCulvert(item.id)}
                    className="px-3 py-1 rounded-xs bg-[#429afe]/15 text-[#034081] hover:bg-[#034081] hover:text-white font-semibold flex items-center space-x-1 border border-[#429afe]/40 transition-colors cursor-pointer shadow-xs"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    <span>Inspect</span>
                    <InspectIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Queue 2: Active Drafts */}
        <div className="glass-panel p-4">
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-white/60">
            <span className="text-sm font-bold text-[#001139]" style={{ fontFamily: 'var(--font-subhead)' }}>
              Active Field Division Drafts
            </span>
            <span className="text-xs font-bold px-2 py-0.5 text-[#034081]" style={{ fontFamily: 'var(--font-caption)' }}>
              {drafts.length}
            </span>
          </div>
          <div className="divide-y divide-white/40 min-h-[160px]">
            {drafts.length === 0 ? (
              <div className="py-10 text-center text-xs text-[#5b6b7a] font-medium">
                No active drafts currently in preparation.
              </div>
            ) : (
              drafts.map((item) => (
                <div key={item.code} className="py-2.5 flex items-center justify-between text-xs hover:bg-white/50 px-2 rounded-lg transition-colors">
                  <div>
                    <div className="flex items-center space-x-2 font-bold">
                      <span className={item.type === 'BRIDGE' ? 'text-[#034081]' : 'text-[#8e4b7b]'} style={{ fontFamily: 'var(--font-caption)' }}>
                        {item.code}
                      </span>
                      <span className="text-[#5b6b7a]">•</span>
                      <span className="text-[#001139] truncate max-w-[220px]">
                        {item.bridge_name || item.culvert_name || 'New Structure Draft'}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#5b6b7a] mt-0.5 tabular-nums">
                      {item.location_chainage_gps_text || item.location_chainage_lrp_gps || 'Chainage not set'}
                    </div>
                  </div>
                  <button
                    onClick={() => item.type === 'BRIDGE' ? onOpenBridge(item.id) : onOpenCulvert(item.id)}
                    className="px-3 py-1 rounded-xs bg-[#429afe]/15 text-[#034081] hover:bg-[#034081] hover:text-white font-semibold flex items-center space-x-1 border border-[#429afe]/40 transition-colors cursor-pointer shadow-xs"
                    style={{ fontFamily: 'var(--font-subhead)' }}
                  >
                    <span>Resume</span>
                    <ArrowBigRightDashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
