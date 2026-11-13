import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileCheck, ArrowRight, CheckCircle, Clock, Send, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';

export default function EndorsementPipelineDashboard({ currentUser, onOpenBridge, onOpenCulvert }) {
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
      console.error("Failed to load pipeline dossiers:", err);
    } finally {
      setLoading(false);
    }
  };

  const role = currentUser?.role;
  const isAwaitingRole = (item) => {
    if (role === 'FIELD_SE' && item.workflow_status === 'FORWARDED_TO_FIELD_SE') return true;
    if (role === 'FIELD_ACE' && item.workflow_status === 'FORWARDED_TO_FIELD_ACE') return true;
    if (role === 'BMW_ACE' && item.workflow_status === 'FORWARDED_TO_BMW_ACE') return true;
    if (role === 'BDC_SE' && item.workflow_status === 'FORWARDED_TO_BDC_SE') return true;
    if (role === 'SUPREME') return true;
    return false;
  };

  const incomingBridges = bridges.filter(isAwaitingRole).map(b => ({ ...b, type: 'BRIDGE' }));
  const incomingCulverts = culverts.filter(isAwaitingRole).map(c => ({ ...c, type: 'CULVERT' }));
  const totalIncoming = [...incomingBridges, ...incomingCulverts];

  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="pb-3 border-b-2 border-slate-300 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-amber-900 uppercase bg-amber-50 px-2 py-0.5 border border-amber-300" style={{ fontFamily: 'var(--font-mono)' }}>
              Endorsement Pipeline
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Active Stage: {role}
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 mt-1" style={{ fontFamily: 'var(--font-display)' }}>
            Dossier Endorsement & Inter-Wing Routing Console
          </h1>
        </div>

        <div className="text-right">
          <div className="text-3xl font-extrabold text-amber-700" style={{ fontFamily: 'var(--font-display)' }}>
            {totalIncoming.length}
          </div>
          <span className="text-xs font-bold text-slate-600" style={{ fontFamily: 'var(--font-subhead)' }}>Awaiting Your Action</span>
        </div>
      </div>

      {/* Institutional Chain of Command Pipeline (Frosted Glass Panel) */}
      <div className="glass-panel p-4">
        <div className="text-xs font-bold uppercase tracking-wider text-[#00225a] mb-3" style={{ fontFamily: 'var(--font-subhead)' }}>
          Institutional Chain of Command Hierarchy
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
          <div className={`p-3 rounded-xl border transition-all ${
            role === 'FIELD_SE' 
              ? 'border-[#034081] bg-white/95 text-[#00225a] shadow-sm' 
              : 'border-white/60 bg-white/40 text-[#5b6b7a]'
          }`}>
            <div className="text-[10px] font-bold uppercase text-[#034081]" style={{ fontFamily: 'var(--font-caption)' }}>Stage 3</div>
            <div className="font-extrabold text-sm mt-0.5 text-[#001139]" style={{ fontFamily: 'var(--font-display)' }}>Field Circle SE</div>
            <div className="text-[11px] mt-1 text-[#5b6b7a] font-medium" style={{ fontFamily: 'var(--font-body)' }}>Review & Circle Endorsement</div>
          </div>
          <div className={`p-3 rounded-xl border transition-all ${
            role === 'FIELD_ACE' 
              ? 'border-[#034081] bg-white/95 text-[#00225a] shadow-sm' 
              : 'border-white/60 bg-white/40 text-[#5b6b7a]'
          }`}>
            <div className="text-[10px] font-bold uppercase text-[#034081]" style={{ fontFamily: 'var(--font-caption)' }}>Stage 4</div>
            <div className="font-extrabold text-sm mt-0.5 text-[#001139]" style={{ fontFamily: 'var(--font-display)' }}>Field Zone ACE</div>
            <div className="text-[11px] mt-1 text-[#5b6b7a] font-medium" style={{ fontFamily: 'var(--font-body)' }}>Zone Technical Endorsement</div>
          </div>
          <div className={`p-3 rounded-xl border transition-all ${
            role === 'BMW_ACE' 
              ? 'border-[#429afe] bg-white/95 text-[#00225a] shadow-sm' 
              : 'border-white/60 bg-white/40 text-[#5b6b7a]'
          }`}>
            <div className="text-[10px] font-bold uppercase text-[#429afe]" style={{ fontFamily: 'var(--font-caption)' }}>Stage 5</div>
            <div className="font-extrabold text-sm mt-0.5 text-[#001139]" style={{ fontFamily: 'var(--font-display)' }}>BMW Wing ACE</div>
            <div className="text-[11px] mt-1 text-[#5b6b7a] font-medium" style={{ fontFamily: 'var(--font-body)' }}>HQ Cross-Wing Routing</div>
          </div>
          <div className={`p-3 rounded-xl border transition-all ${
            role === 'BDC_SE' 
              ? 'border-[#034081] bg-white/95 text-[#00225a] shadow-sm' 
              : 'border-white/60 bg-white/40 text-[#5b6b7a]'
          }`}>
            <div className="text-[10px] font-bold uppercase text-[#034081]" style={{ fontFamily: 'var(--font-caption)' }}>Stage 6</div>
            <div className="font-extrabold text-sm mt-0.5 text-[#001139]" style={{ fontFamily: 'var(--font-display)' }}>Bridge Design Circle SE</div>
            <div className="text-[11px] mt-1 text-[#5b6b7a] font-medium" style={{ fontFamily: 'var(--font-body)' }}>Assign to Design EE</div>
          </div>
        </div>
      </div>

      {/* Incoming Submissions List (Coherent Glass Panel) */}
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-white/60">
          <span className="text-sm font-bold text-[#001139]" style={{ fontFamily: 'var(--font-subhead)' }}>
            Submissions Awaiting Your Ministerial Endorsement
          </span>
          <span className="text-xs font-bold px-2 py-0.5 text-amber-800" style={{ fontFamily: 'var(--font-caption)' }}>
            {totalIncoming.length} Submissions
          </span>
        </div>

        {totalIncoming.length === 0 ? (
          <div className="py-12 text-center text-[#5b6b7a] text-xs font-medium">
            <CheckCircle className="w-8 h-8 text-[#15db7c] mx-auto mb-2 opacity-80" />
            No incoming dossiers currently pending endorsement at this stage.
          </div>
        ) : (
          <div className="divide-y divide-white/40">
            {totalIncoming.map((item) => (
              <div key={item.code} className="py-3 flex items-center justify-between hover:bg-white/40 px-2 rounded-lg transition-colors">
                <div>
                  <div className="flex items-center space-x-2 font-bold text-xs">
                    <span className={item.type === 'BRIDGE' ? 'text-[#034081]' : 'text-[#8e4b7b]'} style={{ fontFamily: 'var(--font-caption)' }}>{item.code}</span>
                    <span className="text-[#5b6b7a]">•</span>
                    <span className="text-[#001139]" style={{ fontFamily: 'var(--font-display)' }}>{item.bridge_name || item.culvert_name || 'Proposed Structure'}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/70 text-[#00225a] font-semibold border border-white/80 uppercase">{item.type}</span>
                  </div>
                  <div className="text-[11px] text-[#5b6b7a] mt-1">
                    Road: {item.road_name || 'N/A'} • {item.location_chainage_gps_text || item.location_chainage_lrp_gps || 'Chainage not set'}
                  </div>
                </div>
                <button
                  onClick={() => item.type === 'BRIDGE' ? onOpenBridge(item.id) : onOpenCulvert(item.id)}
                  className="btn-festive-blue text-xs font-semibold px-4 py-1.5 cursor-pointer"
                >
                  <span>Review & Endorse</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
