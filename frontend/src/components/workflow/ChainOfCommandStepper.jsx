import React from 'react';
import { Check, AlertCircle, FileCheck } from 'lucide-react';

const STEPS = [
  { stage: 1, key: 'DRAFT_FIELD', title: 'Field Acquisition', role: 'Field SAE / SDE' },
  { stage: 2, key: 'PENDING_FIELD_EE_AUTH', title: 'Field EE Authorization', role: 'Field EE / SDE' },
  { stage: 3, key: 'TRANSMITTED_TO_BDD_EE', title: 'Design Division EE', role: 'BDD-1/2/3 EE' },
  { stage: 4, key: 'ASSIGNED_TO_BDD_SDE', title: 'Design Preparation', role: 'BDD SDE' },
  { stage: 5, key: 'DESIGN_PREPARED_PENDING_EE', title: 'Design Vetting', role: 'BDD EE' },
  { stage: 6, key: 'DESIGN_APPROVED_COMPLETE', title: 'Delivered to Field EE', role: 'Field EE' },
  { stage: 7, key: 'DISPATCHED_TO_FIELD_SDE', title: 'Field SDE Execution', role: 'Field SDE' }
];

export default function ChainOfCommandStepper({ currentStatus }) {
  const isReturned = currentStatus === 'RETURNED_FOR_CORRECTION';
  const isDispatched = currentStatus === 'DISPATCHED_TO_FIELD_SDE';
  const isApproved = currentStatus === 'DESIGN_APPROVED_COMPLETE' || isDispatched;
  const isPassedToSde = currentStatus === 'PASS_TO_FIELD_SDE';

  const getCurrentStepIndex = () => {
    if (isDispatched) return 6;
    if (currentStatus === 'DESIGN_APPROVED_COMPLETE') return 5;
    if (currentStatus === 'DESIGN_PREPARED_PENDING_EE') return 4;
    if (currentStatus === 'ASSIGNED_TO_BDD_SDE') return 3;
    if (currentStatus === 'TRANSMITTED_TO_BDD_EE') return 2;
    // Map legacy forward states cleanly to Stage 3
    if ([
      'FORWARDED_TO_FIELD_SE', 'FORWARDED_TO_FIELD_ACE',
      'FORWARDED_TO_BMW_ACE', 'FORWARDED_TO_BDC_SE', 'ASSIGNED_TO_BDD_EE'
    ].includes(currentStatus)) {
      return 2;
    }
    if (isPassedToSde || currentStatus === 'PENDING_FIELD_EE_AUTH') return 1;
    return 0;
  };

  const currentIndex = getCurrentStepIndex();

  return (
    <div className="glass-panel p-3.5 my-3">
      {/* Return or Approved Notification Banner */}
      {isReturned && (
        <div className="mb-3 px-3 py-2 rounded-xl bg-[#e95a24]/15 border border-[#e95a24]/30 text-[#9a3412] text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-[#e95a24] shrink-0" />
            <span style={{ fontFamily: 'var(--font-subhead)' }}>Returned to Field Division for Technical Correction</span>
          </div>
          <span className="text-[11px] bg-[#e95a24] text-white px-2 py-0.5 rounded font-bold uppercase" style={{ fontFamily: 'var(--font-caption)' }}>
            Action Required
          </span>
        </div>
      )}
      {isPassedToSde && (
        <div className="mb-3 px-3 py-2 rounded-xl bg-sky-50 border border-sky-200 text-[#034081] text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileCheck className="w-4 h-4 text-[#034081] shrink-0" />
            <span style={{ fontFamily: 'var(--font-subhead)' }}>Customary Review: Transferred to Field Sub-Divisional Engineer for verification before EE peer transmission</span>
          </div>
          <span className="text-[10px] bg-[#034081] text-white px-2 py-0.5 rounded font-bold uppercase" style={{ fontFamily: 'var(--font-caption)' }}>
            Field SDE Verification
          </span>
        </div>
      )}
      {isApproved && (
        <div className="mb-3 px-3 py-2 rounded-xl bg-[#15db7c]/15 border border-[#15db7c]/30 text-[#00225a] text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-[#15db7c] shrink-0" />
            <span style={{ fontFamily: 'var(--font-subhead)' }}>
              {isDispatched 
                ? 'Design Package Dispatched to Field SDE for Construction Supervision' 
                : 'Approved Design Package Delivered to Field Executive Engineer'}
            </span>
          </div>
          <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider" style={{ fontFamily: 'var(--font-caption)' }}>
            {isDispatched ? 'Field SDE In-Hand' : 'Ready for SDE Dispatch'}
          </span>
        </div>
      )}

      {/* Streamlined Peer EE-to-EE Pipeline Track */}
      <div className="pipeline-track rounded-none overflow-hidden border border-white/60">
        {STEPS.map((step, idx) => {
          const isPassed = !isReturned && ((isDispatched && idx <= 6) || (currentStatus === 'DESIGN_APPROVED_COMPLETE' && idx < 5) || idx < currentIndex);
          const isCurrent = !isReturned && idx === currentIndex;
          const isFlaggedReturn = isReturned && idx === 0;
          const stateClass = isPassed ? 'passed' : isCurrent ? 'current' : isFlaggedReturn ? 'returned' : 'upcoming';

          return (
            <div
              key={step.stage}
              className={`pipeline-segment ${stateClass}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded tracking-tight ${
                    isPassed
                      ? 'bg-[#15db7c]/20 text-[#00225a]'
                      : isCurrent
                      ? 'bg-[#034081] text-white'
                      : isFlaggedReturn
                      ? 'bg-[#e95a24]/20 text-[#9a3412]'
                      : 'bg-white/60 text-[#5b6b7a]'
                  }`}
                  style={{ fontFamily: 'var(--font-caption)' }}
                >
                  Stage {step.stage}
                </span>

                {isPassed && <Check className="w-3.5 h-3.5 text-[#15db7c] shrink-0" />}
                {isCurrent && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full bg-[#429afe] rounded-full opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 bg-[#034081] rounded-full"></span>
                  </span>
                )}
                {isFlaggedReturn && (
                  <AlertCircle className="w-3.5 h-3.5 text-[#e95a24] shrink-0" />
                )}
              </div>

              <div
                className="segment-title text-xs leading-snug truncate"
                style={{ fontFamily: 'var(--font-display)' }}
                title={step.title}
              >
                {step.title}
              </div>

              <div
                className="text-[10.5px] text-[#5b6b7a] truncate mt-1 font-medium"
                style={{ fontFamily: 'var(--font-subhead)' }}
                title={step.role}
              >
                {step.role}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
