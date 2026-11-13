import React, { useState, useEffect } from 'react';
import { 
  History, 
  RotateCcw, 
  Edit3, 
  CheckCircle, 
  Send, 
  Clock, 
  User, 
  Building, 
  AlertTriangle, 
  ChevronDown, 
  ChevronRight,
  Filter,
  RefreshCw,
  FileText
} from 'lucide-react';
import { api } from '../../services/api';

const FIELD_LABELS = {
  // Bridge fields
  bridge_name: 'Bridge Name',
  zone_id: 'Zone',
  circle_id: 'Circle',
  division_id: 'Division',
  road_id: 'Road',
  road_name: 'Road Name',
  location_chainage_km: 'Chainage (km)',
  location_lat_lng: 'GPS Coordinates (Lat, Lng)',
  channel_width_m: 'River / Channel Width (m)',
  nav_vertical_clearance_m: 'Navigational Vertical Clearance (m)',
  nav_horizontal_clearance_m: 'Navigational Horizontal Clearance (m)',
  nav_clearance_class: 'BIWTA Navigation Class',
  highest_flood_level_hfl: 'Highest Flood Level (HFL m)',
  standard_high_water_level_shwl: 'Standard High Water Level (SHWL m)',
  lowest_water_level_lwl: 'Lowest Water Level (LWL m)',
  design_discharge_cumec: 'Design Discharge (cumec)',
  catchment_area_sq_km: 'Catchment Area (sq km)',
  proposed_bridge_type: 'Proposed Bridge Type',
  proposed_bridge_length_m: 'Proposed Bridge Length (m)',
  proposed_span_arrangement_m: 'Proposed Span Arrangement (m)',
  proposed_carriageway_width_m: 'Proposed Carriageway Width (m)',
  proposed_footpath_width_m: 'Proposed Footpath Width (m)',
  existing_bridge_type: 'Existing Bridge Type',
  existing_bridge_length_m: 'Existing Bridge Length (m)',
  traffic_volume_vpd: 'Traffic Volume (Vehicles/Day)',
  remarks: 'Technical Remarks',

  // Culvert fields
  culvert_name: 'Culvert Name',
  location_chainage_lrp_gps: 'LRP Chainage / GPS',
  structure_condition: 'Structure Condition',
  flash_flood_prone: 'Flash Flood Prone',
  haor_coastal_belt: 'Haor / Coastal Belt Area',
  highest_flood_level_m: 'Highest Flood Level (m)',
  catchment_area_sq_km: 'Catchment Area (sq km)',
  design_discharge_m3s: 'Design Discharge (m³/s)',
  existing_culvert_type: 'Existing Culvert Type',
  existing_no_of_vent: 'Existing No of Vent',
  existing_span_width_m: 'Existing Span Width (m)',
  proposed_culvert_type: 'Proposed Culvert Type',
  proposed_no_of_vent: 'Proposed No of Vent',
  proposed_length_each_vent_m: 'Proposed Length of Each Vent (m)',
  proposed_barrel_width_m: 'Proposed Barrel Width (m)',
  proposed_barrel_height_m: 'Proposed Barrel Height (m)',
  proposed_total_length_m: 'Proposed Total Length (m)',
  proposed_carriage_way_width_m: 'Proposed Carriageway Width (m)',
  linear_waterway_available_m: 'Linear Waterway Available (m)',
};

function formatFieldName(rawKey) {
  if (FIELD_LABELS[rawKey]) return FIELD_LABELS[rawKey];
  return rawKey
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function DemandPlacementAuditLog({ acquisitionType = 'BRIDGE', acquisitionId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL'); // 'ALL', 'RETURNS', 'EDITS', 'TRANSITIONS'
  const [expandedDiffs, setExpandedDiffs] = useState({});

  useEffect(() => {
    if (acquisitionId) {
      loadLogs();
    }
  }, [acquisitionType, acquisitionId]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = acquisitionType === 'BRIDGE'
        ? await api.getBridgeAuditLogs(acquisitionId)
        : await api.getCulvertAuditLogs(acquisitionId);
      setLogs(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Failed to load demand placement audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleDiff = (id) => {
    setExpandedDiffs((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Classify event categories
  const returnsCount = logs.filter(
    (l) => l.action.includes('RETURN') || l.to_status === 'RETURNED_FOR_CORRECTION'
  ).length;
  const editsCount = logs.filter((l) => l.action === 'PLACEMENT_EDITED').length;

  const filteredLogs = logs.filter((log) => {
    if (filterType === 'RETURNS') {
      return log.action.includes('RETURN') || log.to_status === 'RETURNED_FOR_CORRECTION';
    }
    if (filterType === 'EDITS') {
      return log.action === 'PLACEMENT_EDITED';
    }
    if (filterType === 'TRANSITIONS') {
      return log.action !== 'PLACEMENT_EDITED' && !log.action.includes('RETURN');
    }
    return true;
  });

  const parseJsonSafe = (raw) => {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Control Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 p-3 bg-white/80 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center space-x-2">
          <History className="w-4 h-4 text-[#034081]" />
          <span className="font-mono text-xs font-bold text-[#00225a] uppercase tracking-wide">
            Demand Placement Activity & Change History
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
            {logs.length} Total Records
          </span>
        </div>

        <div className="flex items-center space-x-1.5 flex-wrap">
          {/* Quick Filter Pills */}
          <button
            type="button"
            onClick={() => setFilterType('ALL')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono transition-all cursor-pointer ${
              filterType === 'ALL'
                ? 'bg-[#034081] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            All ({logs.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterType('RETURNS')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono transition-all cursor-pointer flex items-center space-x-1 ${
              filterType === 'RETURNS'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
            }`}
          >
            <RotateCcw className="w-3 h-3" />
            <span>Returns ({returnsCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterType('EDITS')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono transition-all cursor-pointer flex items-center space-x-1 ${
              filterType === 'EDITS'
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
            }`}
          >
            <Edit3 className="w-3 h-3" />
            <span>Edits ({editsCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterType('TRANSITIONS')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono transition-all cursor-pointer flex items-center space-x-1 ${
              filterType === 'TRANSITIONS'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
            }`}
          >
            <Send className="w-3 h-3" />
            <span>Workflow</span>
          </button>

          <button
            type="button"
            onClick={loadLogs}
            disabled={loading}
            title="Refresh logs"
            className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer ml-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Logs Timeline */}
      {loading ? (
        <div className="p-8 text-center text-slate-500 font-mono text-xs flex items-center justify-center space-x-2">
          <RefreshCw className="w-4 h-4 animate-spin text-[#034081]" />
          <span>Retrieving immutable demand placement logs...</span>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="p-8 text-center bg-white/60 rounded-xl border border-slate-200/80 text-slate-500 font-mono text-xs">
          No log events found matching the selected filter criteria.
        </div>
      ) : (
        <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200 before:pointer-events-none">
          {filteredLogs.map((log, index) => {
            const isReturn = log.action.includes('RETURN') || log.to_status === 'RETURNED_FOR_CORRECTION';
            const isEdit = log.action === 'PLACEMENT_EDITED';
            const isInitial = log.action === 'INITIAL_SUBMISSION';
            const isApproval = log.action.includes('APPROVE') || log.to_status === 'DESIGN_APPROVED_COMPLETE';

            const diffData = isEdit ? parseJsonSafe(log.flagged_sections_json) : null;
            const flaggedSections = isReturn ? parseJsonSafe(log.flagged_sections_json) : null;
            const isExpanded = Boolean(expandedDiffs[log.id]);

            return (
              <div
                key={log.id || index}
                className={`relative pl-8 transition-all ${
                  isReturn
                    ? 'border-l-4 border-l-rose-500'
                    : isEdit
                    ? 'border-l-4 border-l-indigo-500'
                    : isApproval
                    ? 'border-l-4 border-l-emerald-500'
                    : 'border-l-4 border-l-sky-500'
                }`}
              >
                {/* Node icon */}
                <div
                  className={`absolute left-1 top-3 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center border-2 shadow-xs ${
                    isReturn
                      ? 'bg-rose-500 border-white text-white'
                      : isEdit
                      ? 'bg-indigo-600 border-white text-white'
                      : isApproval
                      ? 'bg-emerald-600 border-white text-white'
                      : 'bg-[#034081] border-white text-white'
                  }`}
                >
                  {isReturn ? (
                    <RotateCcw className="w-3 h-3" />
                  ) : isEdit ? (
                    <Edit3 className="w-3 h-3" />
                  ) : isApproval ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <Send className="w-3 h-3" />
                  )}
                </div>

                {/* Card Container */}
                <div
                  className={`rounded-xl border p-3.5 transition-all shadow-xs ${
                    isReturn
                      ? 'bg-rose-50/70 border-rose-200'
                      : isEdit
                      ? 'bg-indigo-50/50 border-indigo-200'
                      : isApproval
                      ? 'bg-emerald-50/60 border-emerald-200'
                      : 'bg-white/90 border-slate-200'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between flex-wrap gap-1.5 pb-2 border-b border-slate-200/80">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isReturn
                            ? 'bg-rose-600 text-white'
                            : isEdit
                            ? 'bg-indigo-600 text-white'
                            : isApproval
                            ? 'bg-emerald-700 text-white'
                            : 'bg-[#034081] text-white'
                        }`}
                      >
                        {isReturn
                          ? 'Dossier Returned'
                          : isEdit
                          ? 'Demand Placement Edited'
                          : isInitial
                          ? 'Initial Placement Created'
                          : log.action.replace(/_/g, ' ')}
                      </span>

                      <span className="text-[11px] font-bold text-slate-800">
                        {log.from_status !== log.to_status ? (
                          <span className="font-mono text-[10.5px]">
                            {log.from_status} &rarr;{' '}
                            <span className="text-[#034081] font-bold">{log.to_status}</span>
                          </span>
                        ) : (
                          <span className="font-mono text-[10.5px] text-slate-600">
                            Status: {log.to_status}
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5 text-slate-500 font-mono text-[11px]">
                      <Clock className="w-3 h-3" />
                      <span>
                        {new Date(log.timestamp).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Actor & Jurisdiction */}
                  <div className="py-2 flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-[10px]">
                        <User className="w-3 h-3" />
                      </div>
                      <span className="font-bold text-slate-900">{log.actor_name || 'System Operator'}</span>
                      <span className="text-[10.5px] font-mono px-1.5 py-0.2 rounded bg-slate-200/80 text-slate-700 font-semibold">
                        {log.actor_role}
                      </span>
                    </div>

                    {log.actor_office && (
                      <div className="flex items-center space-x-1 text-slate-600 text-[11px] font-medium">
                        <Building className="w-3 h-3 text-slate-400" />
                        <span>{log.actor_office}</span>
                      </div>
                    )}
                  </div>

                  {/* Endorsement Note / Reason */}
                  {log.endorsement_note && (
                    <div
                      className={`p-2.5 rounded-lg text-xs font-medium mt-1 leading-relaxed ${
                        isReturn
                          ? 'bg-rose-100/80 border border-rose-300 text-rose-950 font-semibold'
                          : 'bg-white/80 border border-slate-200 text-slate-800'
                      }`}
                    >
                      {isReturn && (
                        <div className="text-[10.5px] font-mono font-bold text-rose-700 uppercase mb-1 flex items-center space-x-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Return Reason & Field Revision Directive:</span>
                        </div>
                      )}
                      <span>{log.endorsement_note}</span>
                    </div>
                  )}

                  {/* Returned Flagged Sections Pills */}
                  {isReturn && Array.isArray(flaggedSections) && flaggedSections.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-rose-200/60">
                      <div className="text-[10px] font-mono font-bold text-rose-800 uppercase mb-1">
                        Flagged Sections Requiring Correction:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {flaggedSections.map((sec, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-2 py-0.5 rounded-md bg-rose-200/90 text-rose-900 font-mono text-[10.5px] font-bold border border-rose-300 flex items-center space-x-1"
                          >
                            <AlertTriangle className="w-2.5 h-2.5" />
                            <span>{sec}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Placement Edit Field-by-Field Diff Inspector */}
                  {isEdit && diffData && Object.keys(diffData).length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-indigo-200/60">
                      <button
                        type="button"
                        onClick={() => toggleDiff(log.id)}
                        className="flex items-center space-x-1 text-[11px] font-mono font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {isExpanded ? 'Hide' : 'Inspect'} {Object.keys(diffData).length} Field Changes
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="mt-2 overflow-x-auto rounded-lg border border-indigo-200 bg-white/95">
                          <table className="w-full text-left border-collapse font-mono text-[11px]">
                            <thead>
                              <tr className="bg-indigo-100/60 text-indigo-900 border-b border-indigo-200">
                                <th className="p-2 font-bold">Parameter / Field</th>
                                <th className="p-2 font-bold text-rose-700">Previous Value</th>
                                <th className="p-2 font-bold text-emerald-700">Updated Value</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-indigo-100">
                              {Object.entries(diffData).map(([fieldName, values]) => (
                                <tr key={fieldName} className="hover:bg-slate-50/80">
                                  <td className="p-2 font-semibold text-slate-800">
                                    {formatFieldName(fieldName)}
                                    <span className="block text-[9.5px] text-slate-400 font-normal">
                                      {fieldName}
                                    </span>
                                  </td>
                                  <td className="p-2 text-rose-800 bg-rose-50/40 line-through">
                                    {values.old !== null && values.old !== undefined
                                      ? String(values.old)
                                      : '<empty>'}
                                  </td>
                                  <td className="p-2 text-emerald-800 bg-emerald-50/40 font-bold">
                                    {values.new !== null && values.new !== undefined
                                      ? String(values.new)
                                      : '<empty>'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
