import React, { useState } from 'react';
import { RotateCcw, AlertTriangle, X } from 'lucide-react';
import { api } from '../../services/api';

const SECTION_CHECKBOXES_BRIDGE = [
  { id: 'TAB-01', label: '[TAB-01] Administrative Hierarchy, Road Name & River Channel Width' },
  { id: 'TAB-02', label: '[TAB-02] Navigational Clearance Class & Existing Bridge Datum RL' },
  { id: 'TAB-03', label: '[TAB-03] Hydrological Levels (HFL, SHWL, LWL, Tidal HTL/LTL) & Survey Date' },
  { id: 'TAB-04', label: '[TAB-04] Proposed Bridge Alignment, Length, Span & Pier Protection' },
  { id: 'TAB-05', label: '[TAB-05] Soil Investigation Report (EE Signed) & Cross-Section Drawings' },
  { id: 'TAB-06', label: '[TAB-06] Geotechnical Borehole Logs (SPT Blows, Strata, Lab Parameters)' }
];

const SECTION_CHECKBOXES_CULVERT = [
  { id: 'CLV-TAB-01', label: '[CLV-01] Culvert Location, LRP Chainage & Flash Flood / Haor Context' },
  { id: 'CLV-TAB-02', label: '[CLV-02] Benchmark Datum, Channel Cross-Section & Hydrological Levels' },
  { id: 'CLV-TAB-03', label: '[CLV-03] Existing Culvert Geometry (Vents, Slab/Wall Thicknesses, Scour)' },
  { id: 'CLV-TAB-04', label: '[CLV-04] Proposed Culvert Alignment, Box Dimensions & Carriage Width' },
  { id: 'CLV-TAB-05', label: '[CLV-05] Site Photos (East/West/North/South) & Soil Investigation Report' },
  { id: 'CLV-TAB-06', label: '[CLV-06] Geotechnical Borehole Logs & Webmap Coordinate Sync' }
];

export default function ReturnForCorrectionModal({ item, onClose, onSuccess }) {
  const isBridge = item.type === 'BRIDGE' || item.code.includes('BRG');
  const sections = isBridge ? SECTION_CHECKBOXES_BRIDGE : SECTION_CHECKBOXES_CULVERT;

  const [selectedTabs, setSelectedTabs] = useState([]);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const toggleTab = (tabId) => {
    if (selectedTabs.includes(tabId)) {
      setSelectedTabs(selectedTabs.filter(t => t !== tabId));
    } else {
      setSelectedTabs([...selectedTabs, tabId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedTabs.length === 0) {
      setError('Please flag at least one tab or section requiring field re-verification.');
      return;
    }
    if (!remarks.trim()) {
      setError('Please provide technical remarks and instructions for the Field Division.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const req = {
        action: 'RETURN',
        return_reason: remarks,
        endorsement_note: remarks,
        flagged_sections: selectedTabs
      };

      if (isBridge) {
        await api.transitionBridge(item.id, req);
      } else {
        await api.transitionCulvert(item.id, req);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 modal-backdrop-appear">
      <div className="eng-panel p-0 max-w-lg w-full overflow-hidden shadow-2xl modal-dialog-appear border border-red-500/40">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-700 via-rose-600 to-red-700 backdrop-blur-md text-white p-3.5 flex items-center justify-between font-mono shadow-xs">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider">
            <RotateCcw className="w-4 h-4" />
            <span>RETURN DOSSIER FOR CORRECTION // {item.code}</span>
          </div>
          <button onClick={onClose} className="text-white hover:opacity-80 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 bg-red-500/20 border border-red-400 text-red-900 rounded-xl font-mono text-[11px] flex items-center space-x-2 backdrop-blur-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block font-mono font-bold text-[#001139] uppercase text-[11px] mb-1.5">
              Select Specific Tabs / Sections Requiring Field Correction:
            </label>
            <div className="space-y-1.5 border border-white/60 p-3 rounded-xl bg-white/40 max-h-48 overflow-y-auto backdrop-blur-xs">
              {sections.map(s => {
                const checked = selectedTabs.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className={`flex items-start space-x-2 p-1.5 rounded-lg cursor-pointer font-mono text-[11px] transition-colors ${
                      checked ? 'return-item-checked' : 'return-item-unchecked'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleTab(s.id)}
                      className="mt-0.5 rounded-xs"
                    />
                    <span>{s.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block font-mono font-bold text-[#001139] uppercase text-[11px] mb-1.5">
              Technical Review Remarks & Specific Field Instructions:
            </label>
            <textarea
              rows={4}
              required
              placeholder="Detail the technical discrepancies found (e.g. HFL does not match BIWTA navigation clearance table; EE signature missing on Soil Investigation Report page 3; Zero Chainage reference datum requires re-survey)..."
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              className="eng-input w-full p-2.5 text-xs font-sans leading-relaxed"
            />
          </div>

          <div className="bg-white/40 backdrop-blur-xs p-3 rounded-xl border border-white/60 text-[11px] font-mono text-slate-700">
            <b className="text-[#00225a]">Target Routing:</b> This action will route the dossier back to the Field Division Sub-Assistant Engineer / Sub-Divisional Engineer, lock design approval, and display a Crimson alert flag on the selected tabs.
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-2 border-t border-white/60">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-white/60 hover:bg-white text-slate-700 font-mono text-xs font-semibold border border-white/80 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-festive-orange text-xs font-bold px-4 py-2 cursor-pointer shadow-md"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{submitting ? 'Routing Dossier...' : 'Confirm Return for Correction'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
