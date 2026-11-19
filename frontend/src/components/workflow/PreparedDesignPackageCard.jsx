import React, { useState } from 'react';
import { 
  FileText, 
  UploadCloud, 
  CheckCircle2, 
  Download, 
  Trash2, 
  Building2, 
  Clock, 
  ShieldCheck, 
  FileCode, 
  Send, 
  FileSpreadsheet, 
  Layers, 
  ArrowRight,
  AlertCircle,
  HardHat,
  Compass,
  PackageCheck
} from 'lucide-react';

const SLOTS = [
  {
    code: 'prepared_design_drawing',
    title: 'Approved Structural & Hydraulic CAD Drawings',
    description: 'General arrangement, pier/abutment details, girder profile, slab reinforcement (.dwg, .dxf, .pdf)',
    accept: '.dwg,.dxf,.pdf,.png,.jpg',
    icon: FileCode,
    color: 'text-indigo-600',
    bgBadge: 'bg-indigo-50 border-indigo-200 text-indigo-700'
  },
  {
    code: 'prepared_design_report',
    title: 'Design Calculation Sheet & Hydraulic Clearance',
    description: 'Structural analysis model, pile foundation bearing capacity, scour depth & HFL clearance report (.pdf, .xlsx)',
    accept: '.pdf,.xlsx,.xls,.docx',
    icon: FileText,
    color: 'text-sky-600',
    bgBadge: 'bg-sky-50 border-sky-200 text-sky-700'
  },
  {
    code: 'prepared_design_boq',
    title: 'Bill of Quantities (BOQ) & Official Cost Estimate',
    description: 'Itemized quantities, scheduled rates, material breakdown and division estimate sheet (.xlsx, .pdf)',
    accept: '.xlsx,.xls,.pdf',
    icon: FileSpreadsheet,
    color: 'text-emerald-600',
    bgBadge: 'bg-emerald-50 border-emerald-200 text-emerald-800'
  }
];

export default function PreparedDesignPackageCard({
  formData = {},
  setFormData,
  attachments = [],
  onUpload,
  onDeleteAttachment,
  uploadingSlot,
  currentUser,
  structureType = 'bridge', // 'bridge' or 'culvert'
  onTransition,
  vestedDivisionName = null
}) {
  const [editingNotes, setEditingNotes] = useState(false);
  const [tempNotes, setTempNotes] = useState(formData.prepared_design_notes || '');

  const userRole = currentUser?.role || 'FIELD_SAE';
  const status = formData.workflow_status || 'DRAFT_FIELD';

  const isBddSde = userRole === 'BDD_SDE';
  const isBddEe = userRole === 'BDD_EE';
  const isFieldEe = userRole === 'FIELD_EE';
  const isFieldSde = userRole === 'FIELD_SDE';
  const isSupreme = userRole === 'SUPREME' || userRole === 'WEBMASTER';

  const canUploadDeliverables = isBddSde || isBddEe || isSupreme;
  const canEditNotes = isBddSde || isBddEe || isSupreme;

  const isDeliveredToField = ['DESIGN_APPROVED_COMPLETE', 'DISPATCHED_TO_FIELD_SDE'].includes(status);
  const isDispatchedToSde = status === 'DISPATCHED_TO_FIELD_SDE';
  const isPendingEeApproval = status === 'DESIGN_PREPARED_PENDING_EE';
  const isUnderBddPreparation = ['TRANSMITTED_TO_BDD_EE', 'ASSIGNED_TO_BDD_SDE', 'DESIGN_PREPARED_PENDING_EE'].includes(status);

  // Filter attachments for design deliverable slots
  const getDeliverables = (slotCode) => attachments.filter(a => a.slot_code === slotCode);

  const totalDeliverablesCount = SLOTS.reduce((acc, slot) => acc + getDeliverables(slot.code).length, 0);

  const handleSaveNotes = () => {
    if (setFormData) {
      setFormData(prev => ({
        ...prev,
        prepared_design_notes: tempNotes
      }));
    }
    setEditingNotes(false);
  };

  const accentColor = structureType === 'culvert' ? '#1c508c' : '#112047';

  return (
    <div className="glass-panel p-5 space-y-5 border border-white/70 shadow-sm relative overflow-hidden">
      {/* Decorative Ribbon Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3.5 border-b border-white/60 gap-3">
        <div className="flex items-center space-x-3">
          <div 
            className="w-10 h-10 flex items-center justify-center shrink-0"
          >
            <PackageCheck className="w-7 h-7" style={{ color: accentColor }} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-extrabold text-[#001139]" style={{ fontFamily: 'var(--font-display)' }}>
                Prepared Design Package & Deliverables
              </h2>
              <span className="text-[11px] rounded-xs font-bold px-2 py-0.5 text-slate-700 border-l-4 border-1 border-slate-300 shadow-2xs font-mono">
                {structureType === 'bridge' ? 'BDD / BRG-PKG' : 'BDD / CLV-PKG'}
              </span>
            </div>
            <p className="text-xs text-[#5b6b7a] font-medium mt-0.5" style={{ fontFamily: 'var(--font-subhead)' }}>
              Structural and hydraulic deliverables prepared by Bridge Design SDE and exchanged between Field & Design Division EEs
            </p>
          </div>
        </div>

        {/* State Badge */}
        <div className="flex items-center space-x-2 text-xs font-bold px-3 py-1 rounded-xs text-slate-700 border border-slate-300">
          {isDispatchedToSde ? (
            <span className="flex items-center space-x-1.5">
              <HardHat className="w-5 h-5 mr-2" />
              <span className="text-teal-800">In-Hand: Field SDE</span>
            </span>
          ) : isDeliveredToField ? (
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="text-indigo-700">Delivered to Field EE</span>
            </span>
          ) : isPendingEeApproval ? (
            <span className="flex items-center space-x-1.5">
              <Clock className="w-5 h-5 mr-2" />
              <span className="text-amber-600">BDD EE Vetting Active</span>
            </span>
          ) : isUnderBddPreparation ? (
            <span className="flex items-center space-x-1.5">
              <Compass className="w-5 h-5 mr-2" />
              <span className="text-fuchsia-700">Design Modeling Active</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1.5">
              <Layers className="w-5 h-5 mr-2" />
              <span>Awaiting Field Transmission</span>
            </span>
          )}
        </div>
      </div>

      {/* Deliberation Office & Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 rounded-xs border border-slate-300 backdrop-blur-md">
          <div className="text-[10.5px] font-bold text-slate-700/87 uppercase tracking-wider flex items-center space-x-1">
            <Building2 className="w-5 h-5 text-[#034081] mr-1.75" />
            <span>Design Division in Charge</span>
          </div>
          <div className="text-xs font-extrabold text-mist-800/87 mt-1  font-subhead truncate">
            {vestedDivisionName || formData.assigned_bdd_division_name || 'BDD-1/2/3'}
          </div>
        </div>

        <div className="p-3 rounded-xs border border-slate-300 backdrop-blur-md">
          <div className="text-[10.5px] font-bold text-slate-700/87 uppercase tracking-wider flex items-center space-x-1">
            <ShieldCheck className="w-5 h-5 text-emerald-800 mr-1.75" />
            <span>Exchange Milestone</span>
          </div>
          <div className="text-xs font-extrabold text-mist-800/87 mt-1 font-subhead">
            {formData.prepared_design_approved_at 
              ? `Approved: ${new Date(formData.prepared_design_approved_at).toLocaleDateString()}`
              : formData.prepared_design_attached_at
              ? `Attached: ${new Date(formData.prepared_design_attached_at).toLocaleDateString()}`
              : 'Pending Preparation'}
          </div>
        </div>

        <div className="p-3 rounded-xs border border-slate-300 backdrop-blur-md">
          <div className="text-[10.5px] font-bold text-slate-700/87 uppercase tracking-wider flex items-center space-x-1">
            <Layers className="w-5 h-5 text-[#429afe] mr-1.75" />
            <span>Attached Deliverables</span>
          </div>
          <div className="text-xs font-bold text-mist-800/87 mt-1 font-subhead">
            {totalDeliverablesCount} Document File(s) Registered
          </div>
        </div>
      </div>

      {/* Technical Design Notes Section */}
      <div className="p-4 rounded-xs border backdrop-blur-md border-white/90 space-y-2">
        <div className="flex items-center justify-between ">
          <span className="text-xs font-extrabold text-[#001139] uppercase tracking-wider" style={{ fontFamily: 'var(--font-subhead)' }}>
            Technical Design Notes & Structural Specifications
          </span>
          {canEditNotes && !editingNotes && (
            <button
              type="button"
              onClick={() => {
                setTempNotes(formData.prepared_design_notes || '');
                setEditingNotes(true);
              }}
              className="text-[11px] font-bold text-[#034081] hover:underline cursor-pointer"
            >
              {formData.prepared_design_notes ? 'Edit Notes' : '+ Add Design Notes'}
            </button>
          )}
        </div>

        {editingNotes ? (
          <div className="space-y-2 border border-mist-800/87">
            <textarea
              rows={4}
              value={tempNotes}
              onChange={(e) => setTempNotes(e.target.value)}
              placeholder="Enter structural analysis parameters, recommended span arrangement, pile depths, foundation bearing capacity, live load standard (e.g. AASHTO HL-93), hydraulic clear waterway, and BOQ estimates..."
              className={structureType === 'culvert' ? 'input-festive-plum w-full text-xs p-2.5 leading-relaxed' : 'input-festive w-full text-xs p-2.5 leading-relaxed'}
            />
            <div className="flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setEditingNotes(false)}
                className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNotes}
                className="btn-festive-blue text-xs font-semibold px-3 py-1 cursor-pointer"
              >
                Save Notes
              </button>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-700 bg-white/50 p-3 rounded-lg border border-slate-300 min-h-[50px] whitespace-pre-wrap leading-relaxed">
            {formData.prepared_design_notes || (
              <span className="text-slate-400 italic">
                No technical design notes have been recorded yet. Bridge Design Division engineers will input the structural parameters upon completing the model.
              </span>
            )}
          </div>
        )}
      </div>

      {/* Deliverable File Slots */}
      <div className="space-y-3">
        <div className="text-xs font-extrabold text-[#001139] uppercase tracking-wider font-subhead">
          Design Deliverables & Approved Artifacts
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {SLOTS.map((slot) => {
            const slotFiles = getDeliverables(slot.code);
            const Icon = slot.icon;
            const isSlotUploading = uploadingSlot === slot.code;

            return (
              <div
                key={slot.code}
                className="p-3.5 rounded-xl   backdrop-blur-md  border border-slate-300 shadow-2xs flex flex-col justify-between space-y-3 hover:bg-white/85 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`p-1.5 shrink-0 ${slot.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-[#001139] leading-snug font-subhead">
                        {slot.title}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#5b6b7a] mt-1.5 leading-snug">
                    {slot.description}
                  </p>
                </div>

                {/* Uploaded Files in this slot */}
                <div className="space-y-1.5 pt-1 border-t border-slate-300">
                  {slotFiles.length === 0 ? (
                    <div className="text-[11px] text-slate-400 italic py-1">
                      No document attached yet.
                    </div>
                  ) : (
                    slotFiles.map((file) => (
                      <div
                        key={file.id}
                        className="p-1.5 rounded-lg bg-white/90 border border-slate-200/80 flex items-center justify-between text-xs gap-1.5"
                      >
                        <div className="flex items-center space-x-1.5 min-w-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-semibold text-slate-800 truncate text-[11px]" title={file.original_filename}>
                            {file.original_filename}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1 shrink-0">
                          {file.file_url && (
                            <a
                              href={file.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-[#034081] hover:bg-sky-50 rounded"
                              title="Download / View"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {canUploadDeliverables && onDeleteAttachment && (
                            <button
                              type="button"
                              onClick={() => onDeleteAttachment(file.id)}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                              title="Delete file"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}

                  {/* Upload Trigger (BDD SDE / BDD EE / Supreme) */}
                  {canUploadDeliverables && onUpload && (
                    <label className="mt-1.5 inline-flex items-center justify-center space-x-1.5 w-full py-1.5 px-2.5 rounded-lg border border-dashed border-[#429afe]/60 bg-sky-50/50 hover:bg-sky-50 text-[#034081] text-[11px] font-bold cursor-pointer transition-colors">
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>{isSlotUploading ? 'Uploading...' : `+ Upload ${slot.code.replace('prepared_design_', '').toUpperCase()}`}</span>
                      <input
                        type="file"
                        accept={slot.accept}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            onUpload(slot.code, e.target.files[0]);
                            e.target.value = '';
                          }
                        }}
                        disabled={isSlotUploading}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SDE <-> EE <-> Field EE <-> Field SDE Exchange Action Strips */}
      <div className="pt-2 border-t border-white/60">
        {/* 1. BDD SDE Action: Submit Prepared Design to BDD EE */}
        {isBddSde && status === 'ASSIGNED_TO_BDD_SDE' && onTransition && (
          <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-[#034081]" style={{ fontFamily: 'var(--font-subhead)' }}>
                Design Deliverables Ready for Executive Engineer Vetting
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                Attach drawings, calculation reports, and BOQ above, then submit to your Division EE.
              </div>
            </div>
            <button
              type="button"
              onClick={() => onTransition('SUBMIT_DESIGN_TO_EE', 'Prepared design package submitted by BDD SDE to Division EE for vetting')}
              className="btn-festive-blue text-xs font-bold px-4 py-2 cursor-pointer shrink-0 flex items-center space-x-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Prepared Design to EE</span>
            </button>
          </div>
        )}

        {/* 2. BDD EE Action: Approve & Transmit Directly to Field EE */}
        {isBddEe && ['DESIGN_PREPARED_PENDING_EE', 'ASSIGNED_TO_BDD_SDE'].includes(status) && onTransition && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-emerald-900" style={{ fontFamily: 'var(--font-subhead)' }}>
                Design Package Vetted & Ready for Direct Peer Transmission to Field EE
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                Approving this deliverable package delivers it directly into the Field Executive Engineer's workbench.
              </div>
            </div>
            <button
              type="button"
              onClick={() => onTransition('APPROVE_AND_TRANSMIT', 'Design package approved by Bridge Design Division EE and transmitted directly to Field EE')}
              className="btn-festive-green text-xs font-bold px-4 py-2 cursor-pointer shrink-0 flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approve & Transmit Design to Field EE</span>
            </button>
          </div>
        )}

        {/* 3. Field EE Action: Dispatch Approved Package to Field SDE */}
        {isFieldEe && status === 'DESIGN_APPROVED_COMPLETE' && onTransition && (
          <div className="p-3 rounded-xl bg-[#034081]/10 border border-[#034081]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-[#00225a]" style={{ fontFamily: 'var(--font-subhead)' }}>
                Approved Design Deliverables in Hand
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                Design package has arrived from Bridge Design Division EE. Dispatch to your Sub-Divisional Engineer for site execution and construction supervision.
              </div>
            </div>
            <button
              type="button"
              onClick={() => onTransition('DISPATCH_TO_FIELD_SDE', 'Design deliverables dispatched by Field EE to Field SDE for site execution')}
              className="btn-festive-blue text-xs font-bold px-4 py-2 cursor-pointer shrink-0 flex items-center space-x-1.5"
            >
              <HardHat className="w-3.5 h-3.5" />
              <span>Dispatch Package to Field SDE</span>
            </button>
          </div>
        )}

        {/* 4. Field SDE Confirmation Notice */}
        {isFieldSde && isDispatchedToSde && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center space-x-2.5 text-xs text-emerald-900 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Design package received from Field Division EE. You are authorized to proceed with construction supervision according to the approved CAD drawings and BOQ.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}