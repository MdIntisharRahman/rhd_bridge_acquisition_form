import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  FileText, 
  FolderArchive, 
  FileSpreadsheet, 
  Plus, 
  Eye, 
  Globe,
  Layers,
  FileEdit,
  Clock,
  CheckCircle
} from 'lucide-react';
import { api } from '../../services/api';

export default function CulvertRegistry({ onOpenCulvert, onNewCulvert }) {
  const [culverts, setCulverts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadCulverts();
  }, [statusFilter]);

  const loadCulverts = async () => {
    try {
      setLoading(true);
      const data = await api.getCulverts({
        status: statusFilter || undefined,
        search: search || undefined
      });
      setCulverts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadCulverts();
  };

  const metrics = useMemo(() => {
    const total = culverts.length;
    const drafts = culverts.filter(c => c.workflow_status === 'DRAFT_FIELD').length;
    const pending = culverts.filter(c => 
      c.workflow_status?.includes('PENDING') || 
      c.workflow_status?.includes('PASS_TO') || 
      c.workflow_status?.includes('TRANSMITTED') || 
      c.workflow_status?.includes('FORWARDED') || 
      c.workflow_status?.includes('ASSIGNED')
    ).length;
    const approved = culverts.filter(c => ['DESIGN_APPROVED_COMPLETE', 'DISPATCHED_TO_FIELD_SDE'].includes(c.workflow_status)).length;
    return { total, drafts, pending, approved };
  }, [culverts]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT_FIELD':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold text-slate-700" style={{ fontFamily: 'var(--font-caption)' }}>Draft Field</span>;
      case 'PENDING_FIELD_EE_AUTH':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold text-amber-800" style={{ fontFamily: 'var(--font-caption)' }}>Awaiting EE Auth</span>;
      case 'PASS_TO_FIELD_SDE':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold text-sky-800" style={{ fontFamily: 'var(--font-caption)' }}>Field SDE Verification</span>;
      case 'TRANSMITTED_TO_BDD_EE':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold text-indigo-800" style={{ fontFamily: 'var(--font-caption)' }}>Transmitted to BDD EE</span>;
      case 'ASSIGNED_TO_BDD_SDE':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold text-blue-800" style={{ fontFamily: 'var(--font-caption)' }}>Modeling by BDD SDE</span>;
      case 'DESIGN_PREPARED_PENDING_EE':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold text-sky-800" style={{ fontFamily: 'var(--font-caption)' }}>Design Vetting by EE</span>;
      case 'DESIGN_APPROVED_COMPLETE':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold text-emerald-800" style={{ fontFamily: 'var(--font-caption)' }}>Approved & Delivered</span>;
      case 'DISPATCHED_TO_FIELD_SDE':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold text-teal-800" style={{ fontFamily: 'var(--font-caption)' }}>Dispatched to SDE</span>;
      case 'RETURNED_FOR_CORRECTION':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold text-rose-800" style={{ fontFamily: 'var(--font-caption)' }}>Returned</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold text-[#1c508c]" style={{ fontFamily: 'var(--font-caption)' }}>{status}</span>;
    }
    // Eliminated cards here
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pb-3 border-b-2 border-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-[#1c508c] uppercase py-0.5 rounded-full font-caption">
              Culvert Acquisition Registry
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {culverts.length} Structures Registered
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 mt-1" style={{ fontFamily: 'var(--font-display)' }}>
            National Culvert Cross-Drainage Data Repository
          </h1>
        </div>

        <button
          onClick={onNewCulvert}
          className="btn-festive-culvert text-xs font-semibold px-4 py-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Culvert Acquisition</span>
        </button>
      </div>

      {/* 4- Glass Metric Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-panel glass-metric-card p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider" style={{ fontFamily: 'var(--font-caption)' }}>Total Registered</div>
            <div className="text-xl font-extrabold text-[#001139] tabular-nums mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>{metrics.total}</div>
          </div>
          {/* # Do NOT INTRODUCE CARDS HERE NO NO NO */}
          <div className="w-10 h-10 text-[#1c508c] flex items-center justify-center metric-icon transition-transform">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel glass-metric-card p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider" style={{ fontFamily: 'var(--font-caption)' }}>Active Drafts</div>
            <div className="text-xl font-extrabold text-[#1c508c] tabular-nums mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>{metrics.drafts}</div>
          </div>
          {/* # Do NOT INTRODUCE CARDS HERE NO NO NO */}
          <div className="w-10 h-10 text-[#1c508c] flex items-center justify-center glass-metric-icon transition-transform">
            <FileEdit className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel glass-metric-card p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider" style={{ fontFamily: 'var(--font-caption)' }}>Awaiting Authorization</div>
            <div className="text-xl font-extrabold text-amber-800 tabular-nums mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>{metrics.pending}</div>
          </div>
          {/* # Do NOT INTRODUCE CARDS HERE NO NO NO */}
          <div className="w-10 h-10 text-amber-700 flex items-center justify-center glass-metric-icon transition-transform">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel glass-metric-card p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider" style={{ fontFamily: 'var(--font-caption)' }}>Approved Complete</div>
            <div className="text-xl font-extrabold text-[#087f43] tabular-nums mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>{metrics.approved}</div>
          </div>
          {/* # Do NOT INTRODUCE CARDS HERE NO NO NO */}
          <div className="w-10 h-10 text-emerald-700 flex items-center justify-center glass-metric-icon transition-transform">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar (Coherent Glass Panel Strip) */}
      <div className="glass-panel p-3.5 flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[#5b6b7a] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by code (MIS-CLV-...), culvert name, road..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 eng-input eng-input-culvert text-xs"
              style={{ fontFamily: 'var(--font-body)' }}
            />
          </div>
          <button type="submit" className="btn-festive-culvert text-xs font-semibold px-4 py-1.5 cursor-pointer">
            Filter
          </button>
        </form>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-[#0f2d52] font-bold" style={{ fontFamily: 'var(--font-subhead)' }}>Stage:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="p-1.5 eng-input eng-input-culvert text-xs cursor-pointer"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            <option value="">All Stages</option>
            <option value="DRAFT_FIELD">Draft Field (SAE)</option>
            <option value="PENDING_FIELD_EE_AUTH">Awaiting Field EE Authorization</option>
            <option value="PASS_TO_FIELD_SDE">Customary SDE Verification</option>
            <option value="TRANSMITTED_TO_BDD_EE">Transmitted to Design Division EE</option>
            <option value="ASSIGNED_TO_BDD_SDE">Design Modeling by BDD SDE</option>
            <option value="DESIGN_PREPARED_PENDING_EE">Prepared Design Vetting by EE</option>
            <option value="DESIGN_APPROVED_COMPLETE">Approved & Transmitted to Field EE</option>
            <option value="DISPATCHED_TO_FIELD_SDE">Dispatched to Field SDE</option>
            <option value="RETURNED_FOR_CORRECTION">Returned for Correction</option>
          </select>
        </div>
      </div>

      {/* Flat High-Density Technical Table in Coherent Glass Panel */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-white/40 text-[#001139] text-xs font-bold border-b border-white/60" style={{ fontFamily: 'var(--font-subhead)' }}>
              <tr>
                <th className="p-3">Dossier Code</th>
                <th className="p-3">Culvert Name</th>
                <th className="p-3">Road Identification</th>
                <th className="p-3">Chainage / GPS</th>
                <th className="p-3">Proposed Span & Size</th>
                <th className="p-3">Status & Holder</th>
                <th className="p-3 text-center">Boreholes</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/40 bg-transparent">
              {culverts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#5b6b7a] font-medium">
                    No culvert acquisitions match the current filter criteria.
                  </td>
                </tr>
              ) : (
                culverts.map((c) => {
                  const lengthVal = c.proposed_total_length_m || c.proposed_other_length_m || c.total_length_m || c.proposed_culvert_length_m;
                  const ventsVal = c.proposed_no_of_vent || c.no_of_vent || c.proposed_number_of_vent;

                  return (
                    <tr key={c.id} className="hover:bg-white/40 transition-colors">
                      {/* Code */}
                      <td className="p-3 font-semibold text-[#1c508c] whitespace-nowrap">
                        <button
                          onClick={() => onOpenCulvert(c.id)}
                          className="hover:underline flex items-center space-x-1 cursor-pointer"
                          style={{ fontFamily: 'var(--font-mono)' }}
                        >
                          <span>{c.code}</span>
                        </button>
                      </td>

                      {/* Culvert Name */}
                      <td className="p-3 font-bold text-slate-900 max-w-[200px] truncate" style={{ fontFamily: 'var(--font-display)' }}>
                        {c.culvert_name || 'Unnamed Culvert'}
                        <div className="text-[11px] text-slate-500 font-normal" style={{ fontFamily: 'var(--font-body)' }}>
                          {c.proposed_culvert_category || c.proposed_new_sub_type || c.existing_culvert_type || 'Culvert'}
                        </div>
                      </td>

                      {/* Road */}
                      <td className="p-3 text-slate-700 max-w-[180px] truncate" style={{ fontFamily: 'var(--font-body)' }}>
                        {c.road_name || 'Road not selected'}
                        <div className="text-[11px] text-slate-400">
                          Link: {c.road_link_name_no || '—'}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="p-3 text-[11px] text-slate-600 max-w-[160px] truncate tabular-nums">
                        {c.location_chainage_lrp_gps || c.location_chainage_gps_text || 'Chainage not set'}
                        {c.location_lat_lng && (
                          <div className="text-[10px] text-slate-500 font-mono">{c.location_lat_lng}</div>
                        )}
                      </td>

                      {/* Proposed Geometry */}
                      <td className="p-3 text-[11px] text-slate-700 tabular-nums" style={{ fontFamily: 'var(--font-body)' }}>
                        {lengthVal ? `${lengthVal}m total` : '—'}
                        {ventsVal ? ` (${ventsVal} Vent${ventsVal > 1 ? 's' : ''})` : ''}
                      </td>

                      {/* Status & Current Holder */}
                      <td className="p-3 whitespace-nowrap">
                        <div>{getStatusBadge(c.workflow_status)}</div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          Holder: <b className="text-slate-800 font-semibold">{c.current_holder_role}</b>
                        </div>
                      </td>

                      {/* Boreholes */}
                      <td className="p-3 text-center font-bold text-slate-800 tabular-nums">
                        {c.total_borehole_count || 0}
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Open in Workspace */}
                          <button
                            onClick={() => onOpenCulvert(c.id)}
                            className="px-2.5 py-1 rounded-xs text-[#0f2d52] font-semibold flex items-center space-x-1 cursor-pointer table-action-icon"
                            title="Open Form Workspace"
                            style={{ fontFamily: 'var(--font-subhead)' }}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>

                          {/* PDF Datasheet */}
                          <a
                            href={api.getExportUrl('culvert', c.id, 'pdf')}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded-xs text-[#1c508c] table-action-icon"
                            title="Download Engineering Datasheet PDF"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#1c508c]" />
                          </a>

                          {/* ZIP Archive */}
                          <a
                            href={api.getExportUrl('culvert', c.id, 'zip')}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded-xs text-[#e95a24] table-action-icon"
                            title="Download Complete Engineering ZIP Dossier"
                          >
                            <FolderArchive className="w-3.5 h-3.5 text-[#e95a24]" />
                          </a>

                          {/* Excel Schedule */}
                          <a
                            href={api.getExportUrl('culvert', c.id, 'excel')}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded-xs text-[#00225a] table-action-icon"
                            title="Download Tabular Engineering Schedule (Excel)"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-[#15db7c]" />
                          </a>

                          {/* Open in RHD Webmap */}
                          {c.location_lat_lng && (
                            <a
                              href={`https://webmap.rhdbridge.com/?code=${c.code}&lat=${c.location_lat_lng.split(',')[0].trim()}&lng=${c.location_lat_lng.split(',')[1]?.trim()}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded-lg text-[#034081] table-action-icon"
                              title="Open in Live RHD Webmap GIS"
                            >
                              <Globe className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
