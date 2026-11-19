import React, { useMemo } from 'react';
import { 
  Check, 
  AlertCircle, 
  AlertTriangle,
  Building2, 
  MapPin, 
  Layers, 
  FileCheck2 
} from 'lucide-react';

const STEPS = [
  { stage: 1, key: 'DRAFT_FIELD', title: 'Field Division', role: 'SAE / SDE' },
  { stage: 2, key: 'PENDING_FIELD_EE_AUTH', title: 'EE Authorization', role: 'Field EE / SDE' },
  { stage: 3, key: 'TRANSMITTED_TO_BDD_EE', title: 'Design Division EE', role: 'BDD EE' },
  { stage: 4, key: 'ASSIGNED_TO_BDD_SDE', title: 'Design Preparation', role: 'BDD SDE' },
  { stage: 5, key: 'DESIGN_PREPARED_PENDING_EE', title: 'Design Vetting', role: 'BDD EE' },
  { stage: 6, key: 'DESIGN_APPROVED_COMPLETE', title: 'Delivered to Field EE', role: 'Field EE' },
  { stage: 7, key: 'DISPATCHED_TO_FIELD_SDE', title: 'Field SDE Execution', role: 'Field SDE' }
];

export default function UnifiedSideFlowPanel({
  currentStatus = 'DRAFT_FIELD',
  formData = {},
  structureType = 'bridge',
  activeTab,
  onSelectTab,
  onKeyDownTab,
  tabs = [],
  flaggedTabs = [],
  totalBoreholes = 0,
  attachmentCount = 0,
  vestedDivisionName = null
}) {
  const isReturned = currentStatus === 'RETURNED_FOR_CORRECTION';
  const isDispatched = currentStatus === 'DISPATCHED_TO_FIELD_SDE';
  const isApproved = currentStatus === 'DESIGN_APPROVED_COMPLETE' || isDispatched;
  const isPassedToSde = currentStatus === 'PASS_TO_FIELD_SDE';

  // Compute Current Step in Chain of Command
  const currentIndex = useMemo(() => {
    if (isDispatched) return 6;
    if (currentStatus === 'DESIGN_APPROVED_COMPLETE') return 5;
    if (currentStatus === 'DESIGN_PREPARED_PENDING_EE') return 4;
    if (currentStatus === 'ASSIGNED_TO_BDD_SDE') return 3;
    if (currentStatus === 'TRANSMITTED_TO_BDD_EE') return 2;
    if ([
      'FORWARDED_TO_FIELD_SE', 'FORWARDED_TO_FIELD_ACE',
      'FORWARDED_TO_BMW_ACE', 'FORWARDED_TO_BDC_SE', 'ASSIGNED_TO_BDD_EE'
    ].includes(currentStatus)) {
      return 2;
    }
    if (isPassedToSde || currentStatus === 'PENDING_FIELD_EE_AUTH') return 1;
    return 0;
  }, [currentStatus, isDispatched, isPassedToSde]);

  // Compute Core Parameter Completeness Percentage
  const { percentage, filledCount, totalCount } = useMemo(() => {
    let keyFields = [];
    if (structureType === 'bridge') {
      keyFields = [
        'bridge_name', 'proposed_bridge_type', 'road_id', 'division_id',
        'channel_width_m', 'nav_vertical_clearance_m', 'highest_flood_level_hfl',
        'proposed_bridge_length_m', 'proposed_span_arrangement_m', 'existing_foundation_type'
      ];
    } else {
      keyFields = [
        'culvert_name', 'road_id', 'division_id', 'location_chainage_lrp_gps',
        'highest_flood_level_hfl', 'proposed_culvert_type', 'proposed_barrel_width_m',
        'proposed_barrel_height_m', 'existing_culvert_type'
      ];
    }

    const filled = keyFields.filter(f => {
      const v = formData[f];
      return v !== undefined && v !== null && v !== '';
    }).length;

    const bonusFilled = (attachmentCount > 0 ? 1 : 0) + (totalBoreholes > 0 ? 1 : 0);
    const total = keyFields.length + 2;
    const totalFilled = filled + bonusFilled;
    const pct = Math.min(100, Math.round((totalFilled / (total || 1)) * 100));

    return {
      percentage: pct,
      filledCount: totalFilled,
      totalCount: total
    };
  }, [formData, structureType, attachmentCount, totalBoreholes]);

  const assignedBDD = vestedDivisionName || formData.assigned_bdd_division_name;

  return (
    <div className="glass-panel p-3.5 space-y-3.5 select-none border border-white/60">
      {/* 1. Demand Header & Territorial Deliberation Jurisdiction */}
      <div className="space-y-1.5 pb-2.5 border-b border-slate-300">
        <div className="flex items-center justify-between gap-1.5 flex-wrap">
          <span className="font-bold text-[11px] text-[#00225a] px-2 py-0.5">
            {formData.code || (structureType === 'bridge' ? 'New Bridge Record' : 'New Culvert Record')}
          </span>
          {formData.zone_name && (
            <span className="text-[10.5px] font-semibold text-slate-700 bg-white/70 px-2 py-0.5 rounded flex items-center space-x-1 border border-white/80">
              <MapPin className="w-3 h-3 text-[#034081]" />
              <span className="truncate max-w-[110px]">{formData.zone_name}</span>
            </span>
          )}
        </div>

        {assignedBDD && (
          <div className="text-[11px] font-bold text-[#065f46] bg-[#f0fdf4] px-2.5 py-1 rounded-lg border border-[#10b981]/40 flex items-center space-x-1.5">
            <Building2 className="w-3.5 h-3.5 text-[#10b981] shrink-0" />
            <span className="truncate">Deliberation: {assignedBDD}</span>
          </div>
        )}
      </div>

      {/* 2. Chain of Command Review Flow */}
      <div className="space-y-2 pb-2.5 border-b border-slate-300">
        <div className="flex items-center justify-between text-[11px]">
          <span 
            className="font-extrabold uppercase tracking-wider text-[#00225a]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Review Stage
          </span>
          <span 
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              isDispatched
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : isApproved
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : isReturned
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : structureType === 'culvert'
                ? 'bg-[#8e4b7b]/15 text-[#7a3869] border-[#8e4b7b]/30'
                : 'bg-[#034081]/10 text-[#034081] border-[#034081]/25'
            }`}
            style={{ fontFamily: 'var(--font-caption)' }}
          >
            {isDispatched ? 'Dispatched' : isApproved ? 'Delivered' : isReturned ? 'Returned' : `Stage ${currentIndex + 1} of 7`}
          </span>
        </div>

        {/* Current Active Stage & Officer in Charge */}
        <div className="text-xs">
          <div 
            className="font-bold text-slate-800 leading-snug truncate"
            style={{ fontFamily: 'var(--font-subhead)' }}
          >
            {isDispatched ? 'Dispatched to Field SDE' : isApproved ? 'Approved & Delivered to Field EE' : isReturned ? 'Action Required' : STEPS[currentIndex]?.title}
          </div>
          <div className="text-[11px] text-[#5b6b7a] font-medium truncate">
            {isDispatched
              ? 'Field SDE In-Hand for Construction'
              : isApproved 
              ? 'Field Executive Engineer' 
              : isReturned 
              ? 'Field Technical Revision' 
              : `In Charge: ${STEPS[currentIndex]?.role}`}
          </div>
        </div>

        {/* 7-Tier Pipeline Mini Progression Tracker */}
        <div className="grid grid-cols-7 gap-1 pt-0.5">
          {STEPS.map((step, idx) => {
            const isPassed = !isReturned && ((isDispatched && idx <= 6) || (currentStatus === 'DESIGN_APPROVED_COMPLETE' && idx < 5) || idx < currentIndex);
            const isCurrent = !isReturned && idx === currentIndex;
            const isFlaggedReturn = isReturned && idx === 0;

            return (
              <div
                key={step.stage}
                className={`h-1.5 rounded-full transition-all ${
                  isPassed
                    ? 'bg-[#10b981]'
                    : isCurrent
                    ? (structureType === 'culvert' ? 'bg-[#3699c2]' : 'bg-[#112047]')
                    : isFlaggedReturn
                    ? 'bg-[#ea580c]'
                    : 'bg-white/73 backdrop-blur-md border border-slate-300/63'
                }`}
                title={`Stage ${step.stage}: ${step.title} (${step.role})`}
              />
            );
          })}
        </div>

        {/* Action Alert Banner */}
        {isReturned && (
          <div className="p-2 rounded-lg bg-[#e95a24]/15 border border-[#e95a24]/30 text-[#9a3412] text-[11px] font-semibold flex items-start space-x-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-[#e95a24] shrink-0 mt-0.5" />
            <span>Returned by BDD for technical revision.</span>
          </div>
        )}
        {isPassedToSde && (
          <div className="p-2 rounded-lg bg-sky-50 border border-sky-200 text-[#112047] text-[11px] font-semibold flex items-center space-x-1.5">
            <FileCheck2 className="w-3.5 h-3.5 text-[#112047] shrink-0" />
            <span>Under customary Field SDE verification.</span>
          </div>
        )}
        {isApproved && (
          <div className="p-2 rounded-lg bg-[#15db7c]/15 border border-[#15db7c]/30 text-[#112047] text-[11px] font-semibold flex items-center space-x-1.5">
            <Check className="w-3.5 h-3.5 text-[#15db7c] shrink-0" />
            <span>{isDispatched ? 'Delivered to Field SDE for execution.' : 'Design package delivered to Field EE.'}</span>
          </div>
        )}
      </div>

      {/* 3. Core Parameter Completeness */}
      <div className="space-y-1.5 pb-2.5 border-b border-slate-300">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700 text-[11px]">Core Completeness</span>
          <span 
            className="font-bold text-xs text-[#112047] font-mono tabular-nums font-caption"
          >
            {percentage}%
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-white/73 backdrop-blur-md border border-slate-300/63 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              structureType === 'culvert'
                ? 'bg-gradient-to-r from-[#74bcd8] to-[#3699c2]'
                : 'bg-gradient-to-r from-[#1c508c] to-[#112047]'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="text-[10.5px] text-slate-500 text-right">
          {filledCount} of {totalCount} parameters validated
        </div>
      </div>

      {/* 4. Specification Sections Navigation */}
      <div className="space-y-2">
        <div className="px-1 flex items-center justify-between">
          <span
            className="text-[11px] font-extrabold uppercase tracking-wider text-[#112047]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Specification Sections
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              structureType === 'culvert'
                ? 'bg-[#3699c2]/15 text-[#0e4a63] border-[#3699c2]/30'
                : 'bg-[#112047]/10 text-[#112047] border-[#112047]/20'
            }`}
            style={{ fontFamily: 'var(--font-caption)' }}
          >
            Section {tabs.findIndex((t) => t.id === activeTab) + 1} of {tabs.length}
          </span>
        </div>

        <nav
          className="left-tab-strip"
          role="tablist"
          aria-label="Engineering Specification Sections"
        >
          {tabs.map((tab, idx) => {
            const isActive = activeTab === tab.id;
            const isFlagged = flaggedTabs.includes(tab.id);

            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => onSelectTab(tab.id)}
                onKeyDown={(e) => onKeyDownTab && onKeyDownTab(e, idx)}
                className={`left-tab-item group ${
                  isActive
                    ? structureType === 'culvert'
                      ? 'active-culvert'
                      : 'active-bridge'
                    : ''
                } ${isFlagged ? 'flagged' : ''}`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <span
                    className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[11px] shrink-0 transition-all duration-200 ${
                      isActive
                        ? structureType === 'culvert'
                          ? 'bg-gradient-to-br from-[#74bcd8] to-[#3699c2] text-white shadow-xs scale-105'
                          : 'bg-gradient-to-br from-[#1c508c] to-[#112047] text-white shadow-xs scale-105'
                        : 'bg-[#e9ecf3] text-[#5b6b7a] group-hover:scale-105 group-hover:bg-[#dde2ed]'
                    }`}
                    style={{ fontFamily: 'var(--font-caption)' }}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span
                      className="text-xs font-bold truncate leading-tight"
                      style={{ fontFamily: 'var(--font-subhead)' }}
                    >
                      {tab.title}
                    </span>
                    <span className="text-[10px] text-[#5b6b7a] truncate font-medium">
                      {tab.code || tab.id}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0 ml-1.5">
                  <kbd className="hidden sm:inline text-[9px] px-1 py-0.5 rounded bg-black/5 text-[#5b6b7a] font-mono">
                    Alt+{idx + 1}
                  </kbd>
                  {isFlagged && (
                    <AlertTriangle className="w-3.5 h-3.5 text-[#e95a24]" />
                  )}
                </div>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
