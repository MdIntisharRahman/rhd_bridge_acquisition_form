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
  CheckCircle,
  Clock,
  FileEdit
} from 'lucide-react';
import { api } from '../../services/api';

export default function BridgeRegistry({ onOpenBridge, onNewBridge }) {
  const [bridges, setBridges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadBridges();
  }, [statusFilter]);

  const loadBridges = async () => {
    try {
      setLoading(true);
      const data = await api.getBridges({
        status: statusFilter || undefined,
        search: search || undefined
      });
      setBridges(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadBridges();
  };

  const metrics = useMemo(() => {
    const total = bridges.length;
    const drafts = bridges.filter(b => b.workflow_status === 'DRAFT_FIELD').length;
    const pending = bridges.filter(b => 
      b.workflow_status?.includes('PENDING') || 
      b.workflow_status?.includes('PASS_TO') || 
      b.workflow_status?.includes('TRANSMITTED') || 
      b.workflow_status?.includes('FORWARDED') || 
      b.workflow_status?.includes('ASSIGNED')
    ).length;
    const approved = bridges.filter(b => ['DESIGN_APPROVED_COMPLETE', 'DISPATCHED_TO_FIELD_SDE'].includes(b.workflow_status)).length;
    return { total, drafts, pending, approved };
  }, [bridges]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT_FIELD':
        return <span className="py-0.5 rounded-full text-[11px] font-semibold text-slate-700" style={{ fontFamily: 'var(--font-caption)' }}>Draft Field</span>;
      case 'PENDING_FIELD_EE_AUTH':
        return <span className="py-0.5 rounded-full text-[11px] font-semibold text-amber-800" style={{ fontFamily: 'var(--font-caption)' }}>Awaiting EE Auth</span>;
      case 'PASS_TO_FIELD_SDE':
        return <span className="py-0.5 rounded-full text-[11px] font-semibold text-sky-800" style={{ fontFamily: 'var(--font-caption)' }}>Field SDE Verification</span>;
      case 'TRANSMITTED_TO_BDD_EE':
        return <span className="py-0.5 rounded-full text-[11px] font-semibold text-indigo-800" style={{ fontFamily: 'var(--font-caption)' }}>Transmitted to BDD EE</span>;
      case 'ASSIGNED_TO_BDD_SDE':
        return <span className="py-0.5 rounded-full text-[11px] font-semibold text-blue-800" style={{ fontFamily: 'var(--font-caption)' }}>Modeling by BDD SDE</span>;
      case 'DESIGN_PREPARED_PENDING_EE':
        return <span className="py-0.5 rounded-full text-[11px] font-semibold text-purple-800" style={{ fontFamily: 'var(--font-caption)' }}>Design Vetting by EE</span>;
      case 'DESIGN_APPROVED_COMPLETE':
        return <span className="py-0.5 rounded-full text-[11px] font-semibold text-emerald-800" style={{ fontFamily: 'var(--font-caption)' }}>Approved & Delivered</span>;
      case 'DISPATCHED_TO_FIELD_SDE':
        return <span className="py-0.5 rounded-full text-[11px] font-semibold text-teal-800" style={{ fontFamily: 'var(--font-caption)' }}>Dispatched to SDE</span>;
      case 'RETURNED_FOR_CORRECTION':
        return <span className="py-0.5 rounded-full text-[11px] font-semibold text-rose-800" style={{ fontFamily: 'var(--font-caption)' }}>Returned</span>;
      default:
        return <span className="py-0.5 rounded-full text-[11px] font-semibold text-slate-700" style={{ fontFamily: 'var(--font-caption)' }}>{status}</span>;
    }
    // Eliminated cards here
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pb-3 border-b-2 border-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-[#112047] uppercase py-0.5 rounded-full font-caption" >
              Bridge Acquisition Registry
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {bridges.length} Structures Registered
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 mt-1" style={{ fontFamily: 'var(--font-display)' }}>
            National Bridge Design Data & Hydraulic Repository
          </h1>
        </div>

        <button
          onClick={onNewBridge}
          className="btn-festive-blue text-xs font-semibold px-4 py-2 transition-colors cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Bridge Acquisition</span>
        </button>
      </div>

      {/* 4-Card Glass Metric Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-panel glass-metric-card p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider" style={{ fontFamily: 'var(--font-caption)' }}>Total Registered</div>
            <div className="text-xl font-extrabold text-[#112047] tabular-nums mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>{metrics.total}</div>
          </div>
          <div className="w-10 h-10 rounded-xs  flex items-center justify-center-metric-icon transition-transform">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel glass-metric-card p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider" style={{ fontFamily: 'var(--font-caption)' }}>Active Drafts</div>
            <div className="text-xl font-extrabold text-[#112047] tabular-nums mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>{metrics.drafts}</div>
          </div>
          <div className="w-10 h-10 rounded-xs  flex items-center justify-center glass-metric-icon transition-transform">
            <FileEdit className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel glass-metric-card p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider" style={{ fontFamily: 'var(--font-caption)' }}>Awaiting Authorization</div>
            <div className="text-xl font-extrabold text-amber-800 tabular-nums mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>{metrics.pending}</div>
          </div>
          <div className="w-10 h-10 rounded-xs 700 flex items-center justify-center glass-metric-icon transition-transform">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel glass-metric-card p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider" style={{ fontFamily: 'var(--font-caption)' }}>Approved Complete</div>
            <div className="text-xl font-extrabold text-[#087f43] tabular-nums mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>{metrics.approved}</div>
          </div>
          <div className="w-10 h-10 rounded-xs 700 flex items-center justify-center glass-metric-icon transition-transform">
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
              placeholder="Search by code (MIS-BRG-...), bridge name, road..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 eng-input text-xs"
              style={{ fontFamily: 'var(--font-body)' }}
            />
          </div>
          <button type="submit" className="btn-festive-blue text-xs font-semibold px-4 py-1.5 cursor-pointer">
            Filter
          </button>
        </form>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-[#112047] font-bold" style={{ fontFamily: 'var(--font-subhead)' }}>Stage:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="p-1.5 eng-input text-xs cursor-pointer"
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
            <thead className="bg-white/40 text-[#112047] text-xs font-bold border-b border-white/60" style={{ fontFamily: 'var(--font-subhead)' }}>
              <tr>
                <th className="p-3">Dossier Code</th>
                <th className="p-3">Bridge Name</th>
                <th className="p-3">Road Identification</th>
                <th className="p-3">Chainage / GPS</th>
                <th className="p-3">River Channel</th>
                <th className="p-3">Status & Holder</th>
                <th className="p-3 text-center">Boreholes</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/40 bg-transparent">
              {bridges.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#5b6b7a] font-medium">
                    No bridge acquisitions match the current filter criteria.
                  </td>
                </tr>
              ) : (
                bridges.map((b) => (
                  <tr key={b.id} className="hover:bg-white/40 transition-colors">
                    {/* Code */}
                    <td className="p-3 font-semibold text-blue-700 whitespace-nowrap">
                      <button
                        onClick={() => onOpenBridge(b.id)}
                        className="hover:underline flex items-center space-x-1 cursor-pointer"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        <span>{b.code}</span>
                      </button>
                    </td>

                    {/* Bridge Name */}
                    <td className="p-3 font-bold text-slate-900 max-w-[200px] truncate" style={{ fontFamily: 'var(--font-display)' }}>
                      {b.bridge_name || 'Unnamed Bridge'}
                      <div className="text-[11px] text-slate-500 font-normal" style={{ fontFamily: 'var(--font-body)' }}>
                        {b.proposed_bridge_type || 'Type not specified'}
                      </div>
                    </td>

                    {/* Road */}
                    <td className="p-3 text-slate-700 max-w-[180px] truncate" style={{ fontFamily: 'var(--font-body)' }}>
                      {b.road_name || 'Road not selected'}
                      <div className="text-[11px] text-slate-400">
                        Link: {b.road_link_name_no || '—'}
                      </div>
                    </td>

                    {/* Location */}
                    <td className="p-3 text-[11px] text-slate-600 max-w-[160px] truncate tabular-nums">
                      {b.location_chainage_gps_text || 'Chainage not set'}
                      {b.location_lat_lng && (
                        <div className="text-[10px] text-slate-500 font-mono">{b.location_lat_lng}</div>
                      )}
                    </td>

                    {/* River / Channel */}
                    <td className="p-3 text-[11px] text-slate-700" style={{ fontFamily: 'var(--font-body)' }}>
                      {b.river_channel_name || '—'}
                      {b.channel_width_m ? ` (${b.channel_width_m}m)` : ''}
                    </td>

                    {/* Status & Current Holder */}
                    <td className="p-3 whitespace-nowrap">
                      <div>{getStatusBadge(b.workflow_status)}</div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Holder: <b className="text-slate-800 font-semibold">{b.current_holder_role}</b>
                      </div>
                    </td>

                    {/* Boreholes */}
                    <td className="p-3 text-center font-bold text-slate-800 tabular-nums">
                      {b.total_borehole_count}
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        {/* Open in Workspace */}
                        <button
                          onClick={() => onOpenBridge(b.id)}
                          className="px-2.5 py-1 rounded-xs text-[#112047] font-semibold flex items-center space-x-1 cursor-pointer table-action-icon"
                          title="Open Form Workspace"
                          style={{ fontFamily: 'var(--font-subhead)' }}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>

                        {/* PDF Datasheet */}
                        <a
                          href={api.getExportUrl('bridge', b.id, 'pdf')}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded-xs hover:text-[#112047] table-action-icon"
                          title="Download Engineering Datasheet PDF"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#112047]" />
                        </a>

                        {/* ZIP Archive */}
                        <a
                          href={api.getExportUrl('bridge', b.id, 'zip')}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded-xs hover:text-[#e95a24] table-action-icon"
                          title="Download Complete Engineering ZIP Dossier"
                        >
                          <FolderArchive className="w-3.5 h-3.5 text-[#e95a24]" />
                        </a>

                        {/* Excel Schedule */}
                        <a
                          href={`/api/acquisitions/bridge/${b.id}/export-excel`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded-xs hover:text-[#112047] table-action-icon"
                          title="Download Tabular Engineering Schedule (Excel)"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-[#15db7c]" />
                        </a>

                        {/* Open in RHD Webmap */}
                        {b.location_lat_lng && (
                          <a
                            href={`https://webmap.rhdbridge.com/?code=${b.code}&lat=${b.location_lat_lng.split(',')[0].trim()}&lng=${b.location_lat_lng.split(',')[1]?.trim()}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded-xs text-[#112047] table-action-icon"
                            title="Open in Live RHD Webmap GIS"
                          >
                            <Globe className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
