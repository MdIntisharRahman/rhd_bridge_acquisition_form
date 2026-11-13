import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Play, 
  RotateCcw, 
  ShieldAlert, 
  Database, 
  RefreshCw, 
  Trash2, 
  Cpu, 
  FileCheck2, 
  Plus, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  Building2, 
  Users 
} from 'lucide-react';
import { api } from '../../services/api';

export default function SupremeOperationsConsole({ currentUser }) {
  const [tasks, setTasks] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [designDivisions, setDesignDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningType, setRunningType] = useState(null);
  const [msg, setMsg] = useState(null);

  // Design Division Provisioning Modal State
  const [provisionModalOpen, setProvisionModalOpen] = useState(false);
  const [editingDivision, setEditingDivision] = useState(null);
  const [divForm, setDivForm] = useState({
    name: '',
    code: '',
    ee_name: '',
    contact_email: '',
    contact_phone: '',
    create_login_account: true
  });

  // Universal State Override Form State
  const [overrideForm, setOverrideForm] = useState({
    acquisition_type: 'BRIDGE',
    acquisition_id: '',
    target_status: 'DRAFT_FIELD',
    target_holder_role: 'FIELD_SAE',
    override_reason: ''
  });

  useEffect(() => {
    loadSupremeData();
  }, []);

  const loadSupremeData = async () => {
    try {
      setLoading(true);
      const [tasksRes, logsRes, divRes] = await Promise.all([
        api.getSupremeTasks(),
        api.getSupremeAuditLogs(null, 50),
        api.getSupremeDesignDivisions()
      ]);
      setTasks(tasksRes);
      setAuditLogs(logsRes);
      setDesignDivisions(divRes);
    } catch (err) {
      console.error("Failed to load Supreme console data:", err);
      setMsg({ type: 'error', text: `Failed to load sovereign state: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const triggerTask = async (taskType) => {
    try {
      setRunningType(taskType);
      await api.runSupremeTask(taskType);
      setMsg({ type: 'success', text: `Background task "${taskType}" dispatched to autonomous worker pool.` });
      setTimeout(loadSupremeData, 1000);
    } catch (err) {
      setMsg({ type: 'error', text: `Task dispatch failed: ${err.message}` });
    } finally {
      setRunningType(null);
    }
  };

  const handleOverride = async (e) => {
    e.preventDefault();
    if (!window.confirm("WARNING: Sovereign override bypasses constitutional checks. Are you sure?")) {
      return;
    }
    try {
      const res = await api.overrideSupremeState({
        acquisition_type: overrideForm.acquisition_type,
        acquisition_id: parseInt(overrideForm.acquisition_id),
        target_status: overrideForm.target_status,
        target_holder_role: overrideForm.target_holder_role,
        override_reason: overrideForm.override_reason
      });
      setMsg({ type: 'success', text: res.message });
      setOverrideForm({
        acquisition_type: 'BRIDGE',
        acquisition_id: '',
        target_status: 'DRAFT_FIELD',
        target_holder_role: 'FIELD_SAE',
        override_reason: ''
      });
      loadSupremeData();
    } catch (err) {
      setMsg({ type: 'error', text: `Override failed: ${err.message}` });
    }
  };

  const openProvisionModal = (div = null) => {
    if (div) {
      setEditingDivision(div);
      setDivForm({
        name: div.name,
        code: div.code,
        ee_name: div.ee_name || '',
        contact_email: div.contact_email || '',
        contact_phone: div.contact_phone || '',
        create_login_account: false
      });
    } else {
      setEditingDivision(null);
      const nextNum = designDivisions.length + 1;
      setDivForm({
        name: `Bridge Design Division-${nextNum}`,
        code: `BDD-0${nextNum}`,
        ee_name: '',
        contact_email: `ee.bdd${nextNum}@rhd.gov.bd`,
        contact_phone: '+880-1711-000000',
        create_login_account: true
      });
    }
    setProvisionModalOpen(true);
  };

  const handleSaveDivision = async (e) => {
    e.preventDefault();
    try {
      if (editingDivision) {
        await api.updateSupremeDesignDivision(editingDivision.id, {
          name: divForm.name,
          code: divForm.code,
          ee_name: divForm.ee_name,
          contact_email: divForm.contact_email,
          contact_phone: divForm.contact_phone
        });
        setMsg({ type: 'success', text: `Design Division "${divForm.name}" updated successfully.` });
      } else {
        const res = await api.createSupremeDesignDivision(divForm);
        setMsg({ type: 'success', text: `New Design Division "${res.name}" created with login account "${res.ee_username || 'bdd_ee'}"!` });
      }
      setProvisionModalOpen(false);
      loadSupremeData();
    } catch (err) {
      alert(`Error saving design division: ${err.message}`);
    }
  };

  const handleToggleDivisionActive = async (div) => {
    try {
      await api.updateSupremeDesignDivision(div.id, { is_active: !div.is_active });
      loadSupremeData();
    } catch (err) {
      alert(`Error updating status: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sovereign Header */}
      <div className="bg-gradient-to-r from-slate-900 via-[#00225a] to-[#1e1b4b] border border-white/20 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-sky-400" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-sky-400">
              SUPREME SOVEREIGN COMMAND
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-950/80 text-sky-300 border border-sky-800">
              CONSTITUTIONAL SINGLETON
            </span>
          </div>
          <h1 className="text-xl font-black text-white mt-1" style={{ fontFamily: 'var(--font-display)' }}>
            System Orchestration, Design Division Provisioning & Sovereign Override
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Dynamic control for design divisions expansion, background tasks, and emergency state reconciliation.
          </p>
        </div>

        <button
          onClick={loadSupremeData}
          disabled={loading}
          className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold rounded-xl flex items-center space-x-2 border border-white/20 cursor-pointer shadow-sm transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-sky-300 ${loading ? 'animate-spin' : ''}`} />
          <span>REFRESH STATE</span>
        </button>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl text-xs font-mono flex items-center justify-between border ${
          msg.type === 'error' ? 'bg-red-50 text-red-800 border-red-300' : 'bg-emerald-50 text-emerald-800 border-emerald-300'
        }`}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} className="font-bold ml-4 cursor-pointer">✕</button>
        </div>
      )}

      {/* SECTION: Dynamic Design Divisions Management */}
      <div className="glass-panel p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-[#034081]" />
              <h2 className="text-base font-black text-[#001139]" style={{ fontFamily: 'var(--font-display)' }}>
                Design Divisions Directory & Provisioning
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Manage existing Bridge Design Divisions (BDD-1, 2, 3...) or provision new divisions dynamically as capacity expands.
            </p>
          </div>

          <button
            onClick={() => openProvisionModal(null)}
            className="btn-festive-blue text-xs font-bold px-3.5 py-2 flex items-center space-x-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Provision New Design Division</span>
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-[#00225a] font-bold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">Division Code</th>
                <th className="py-2.5 px-3">Division Name</th>
                <th className="py-2.5 px-3">Parent Circle</th>
                <th className="py-2.5 px-3">Executive Engineer</th>
                <th className="py-2.5 px-3">Official Email / Phone</th>
                <th className="py-2.5 px-3 text-center">Active Demands</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {designDivisions.map((div) => (
                <tr key={div.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-[#034081]">{div.code}</td>
                  <td className="py-3 px-3 font-bold text-slate-900">{div.name}</td>
                  <td className="py-3 px-3 text-slate-600">{div.circle_name}</td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-800">{div.ee_name || "Assigned EE"}</div>
                    {div.ee_username && (
                      <div className="text-[10px] text-slate-500 font-mono">User: {div.ee_username}</div>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <div className="text-slate-800">{div.contact_email || "—"}</div>
                    <div className="text-slate-500 text-[10.5px]">{div.contact_phone || ""}</div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                      {div.assigned_bridge_count + div.assigned_culvert_count} Dossiers
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    {div.is_active ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        ACTIVE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        INACTIVE
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => openProvisionModal(div)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        title="Edit Division Details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleDivisionActive(div)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          div.is_active ? 'text-amber-700 hover:bg-amber-50' : 'text-emerald-700 hover:bg-emerald-50'
                        }`}
                        title={div.is_active ? "Deactivate division" : "Activate division"}
                      >
                        {div.is_active ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Background Task Runners Panel */}
      <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
          <span className="font-bold text-[#001139] text-sm" style={{ fontFamily: 'var(--font-display)' }}>
            Supreme Background Task Orchestrator
          </span>
          <span className="text-xs text-[#034081] font-bold font-mono">5 Autonomous Workers</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Worker 1: DB Backup */}
          <div className="border border-slate-200 bg-slate-50 p-3.5 rounded-xl flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-slate-900">
                <Database className="w-4 h-4 text-sky-600" />
                <span>POSTGRES BACKUP</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Generates full JSON database snapshot in /backups folder.
              </p>
            </div>
            <button
              onClick={() => triggerTask('DB_BACKUP')}
              disabled={runningType === 'DB_BACKUP'}
              className="w-full py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              {runningType === 'DB_BACKUP' ? 'Running...' : 'Execute Backup'}
            </button>
          </div>

          {/* Worker 2: Webmap Sync */}
          <div className="border border-slate-200 bg-slate-50 p-3.5 rounded-xl flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-slate-900">
                <RefreshCw className="w-4 h-4 text-emerald-600" />
                <span>WEBMAP GIS SYNC</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Broadcasts active structures to https://webmap.rhdbridge.com.
              </p>
            </div>
            <button
              onClick={() => triggerTask('WEBMAP_SYNC')}
              disabled={runningType === 'WEBMAP_SYNC'}
              className="w-full py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-mono text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              {runningType === 'WEBMAP_SYNC' ? 'Syncing...' : 'Sync Webmap'}
            </button>
          </div>

          {/* Worker 3: JSON Re-sync */}
          <div className="border border-slate-200 bg-slate-50 p-3.5 rounded-xl flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-slate-900">
                <FileCheck2 className="w-4 h-4 text-amber-600" />
                <span>JSON SEED RESYNC</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Re-seeds master tables from rhd_master_hierarchy_seed.json.
              </p>
            </div>
            <button
              onClick={() => triggerTask('JSON_RESYNC')}
              disabled={runningType === 'JSON_RESYNC'}
              className="w-full py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-mono text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              {runningType === 'JSON_RESYNC' ? 'Running...' : 'Re-sync JSON'}
            </button>
          </div>

          {/* Worker 4: Orphan Cleanup */}
          <div className="border border-slate-200 bg-slate-50 p-3.5 rounded-xl flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-slate-900">
                <Trash2 className="w-4 h-4 text-red-600" />
                <span>ORPHAN CLEANUP</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Purges unreferenced physical files from /backend/uploads.
              </p>
            </div>
            <button
              onClick={() => triggerTask('ORPHAN_CLEANUP')}
              disabled={runningType === 'ORPHAN_CLEANUP'}
              className="w-full py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white font-mono text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              {runningType === 'ORPHAN_CLEANUP' ? 'Cleaning...' : 'Purge Orphans'}
            </button>
          </div>

          {/* Worker 5: Batch Rebuild */}
          <div className="border border-slate-200 bg-slate-50 p-3.5 rounded-xl flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-slate-900">
                <Cpu className="w-4 h-4 text-slate-700" />
                <span>BATCH DOSSIER REBUILD</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Validates and pre-caches PDF & ZIP dossiers across records.
              </p>
            </div>
            <button
              onClick={() => triggerTask('BATCH_REBUILD')}
              disabled={runningType === 'BATCH_REBUILD'}
              className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-mono text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              {runningType === 'BATCH_REBUILD' ? 'Rebuilding...' : 'Rebuild All'}
            </button>
          </div>
        </div>
      </div>

      {/* Split Grid: Recent Tasks & Universal Emergency Override */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Background Task Log */}
        <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
            <span className="font-bold text-[#001139] text-sm">Background Task Execution Logs</span>
            <span className="font-mono text-xs font-bold text-[#034081]">{tasks.length} Recorded</span>
          </div>
          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto font-mono text-xs">
            {tasks.length === 0 ? (
              <div className="py-8 text-center text-slate-500">No background tasks recorded yet.</div>
            ) : (
              tasks.map((t) => (
                <div key={t.id} className="py-2.5 px-2 flex items-center justify-between hover:bg-slate-50 rounded-lg transition-colors">
                  <div>
                    <div className="font-bold text-[#001139]">{t.task_type}</div>
                    <div className="text-[10px] text-slate-600 font-sans">
                      Started: {new Date(t.started_at).toLocaleTimeString()}
                      {t.result_json && ` | Result: ${t.result_json.substring(0, 45)}...`}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                    t.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                    t.status === 'RUNNING' ? 'bg-sky-100 text-sky-800 border border-sky-300' :
                    'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {t.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Universal State Override Form */}
        <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
            <span className="flex items-center space-x-2 font-bold text-[#001139] text-sm">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Supreme Universal State Override</span>
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-300 font-mono">
              EMERGENCY SOVEREIGN
            </span>
          </div>

          <form onSubmit={handleOverride} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-mono text-[#00225a] font-semibold mb-1">Acquisition Type</label>
                <select
                  value={overrideForm.acquisition_type}
                  onChange={e => setOverrideForm({ ...overrideForm, acquisition_type: e.target.value })}
                  className="input-festive w-full p-2 font-mono text-xs"
                >
                  <option value="BRIDGE">BRIDGE</option>
                  <option value="CULVERT">CULVERT</option>
                </select>
              </div>
              <div>
                <label className="block font-mono text-[#00225a] font-semibold mb-1">Acquisition ID #</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={overrideForm.acquisition_id}
                  onChange={e => setOverrideForm({ ...overrideForm, acquisition_id: e.target.value })}
                  className="input-festive w-full p-2 font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-mono text-[#00225a] font-semibold mb-1">Target Status</label>
                <select
                  value={overrideForm.target_status}
                  onChange={e => setOverrideForm({ ...overrideForm, target_status: e.target.value })}
                  className="input-festive w-full p-2 font-mono text-xs font-bold text-slate-900"
                >
                  <option value="DRAFT_FIELD">DRAFT_FIELD</option>
                  <option value="PENDING_FIELD_EE_AUTH">PENDING_FIELD_EE_AUTH</option>
                  <option value="FORWARDED_TO_FIELD_SE">FORWARDED_TO_FIELD_SE</option>
                  <option value="FORWARDED_TO_FIELD_ACE">FORWARDED_TO_FIELD_ACE</option>
                  <option value="FORWARDED_TO_BMW_ACE">FORWARDED_TO_BMW_ACE</option>
                  <option value="FORWARDED_TO_BDC_SE">FORWARDED_TO_BDC_SE</option>
                  <option value="ASSIGNED_TO_BDD_EE">ASSIGNED_TO_BDD_EE</option>
                  <option value="ASSIGNED_TO_BDD_SDE">ASSIGNED_TO_BDD_SDE</option>
                  <option value="RETURNED_FOR_CORRECTION">RETURNED_FOR_CORRECTION</option>
                  <option value="DESIGN_APPROVED_COMPLETE">DESIGN_APPROVED_COMPLETE</option>
                </select>
              </div>
              <div>
                <label className="block font-mono text-[#00225a] font-semibold mb-1">Target Holder Role</label>
                <input
                  type="text"
                  value={overrideForm.target_holder_role}
                  onChange={e => setOverrideForm({ ...overrideForm, target_holder_role: e.target.value })}
                  className="input-festive w-full p-2 font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-[#00225a] font-semibold mb-1">Official Override Reason (Logged Immutably)</label>
              <textarea
                rows={2}
                required
                value={overrideForm.override_reason}
                onChange={e => setOverrideForm({ ...overrideForm, override_reason: e.target.value })}
                className="input-festive w-full p-2 text-xs resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#034081] hover:bg-[#022b57] text-white font-mono font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              EXECUTE SUPREME OVERRIDE
            </button>
          </form>
        </div>
      </div>

      {/* Immutable Global Audit Trail Inspector */}
      <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
          <span className="font-bold text-[#001139] text-sm">System-Wide Immutable Workflow Audit Trail</span>
          <span className="font-mono text-xs text-[#034081] font-bold">{auditLogs.length} Transitions</span>
        </div>
        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-100 font-mono text-[11px] uppercase border-b border-slate-200 sticky top-0 text-[#00225a]">
              <tr>
                <th className="py-2 px-3">Timestamp</th>
                <th className="py-2 px-3">Type / ID</th>
                <th className="py-2 px-3">Action</th>
                <th className="py-2 px-3">Officer / Role</th>
                <th className="py-2 px-3">Transition</th>
                <th className="py-2 px-3">Endorsement Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2 px-3 font-bold text-[#001139]">
                    {log.acquisition_type} #{log.acquisition_id}
                  </td>
                  <td className="py-2 px-3 text-sky-800 font-semibold">{log.action}</td>
                  <td className="py-2 px-3 font-sans">
                    {log.actor_name} <span className="text-slate-500">({log.actor_role})</span>
                  </td>
                  <td className="py-2 px-3 text-slate-700 whitespace-nowrap">
                    {log.from_status} → <span className="font-bold text-[#001139]">{log.to_status}</span>
                  </td>
                  <td className="py-2 px-3 font-sans text-slate-800">{log.endorsement_note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision / Edit Design Division Modal */}
      {provisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 modal-appear">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                {editingDivision ? "Edit Design Division" : "Provision New Design Division"}
              </h3>
              <button
                onClick={() => setProvisionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDivision} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Division Name</label>
                <input
                  type="text"
                  required
                  value={divForm.name}
                  onChange={e => setDivForm({ ...divForm, name: e.target.value })}
                  placeholder="e.g. Bridge Design Division-4"
                  className="input-festive w-full p-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Division Short Code</label>
                <input
                  type="text"
                  required
                  value={divForm.code}
                  onChange={e => setDivForm({ ...divForm, code: e.target.value })}
                  placeholder="e.g. BDD-04"
                  className="input-festive w-full p-2 text-xs font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Executive Engineer in Charge</label>
                <input
                  type="text"
                  value={divForm.ee_name}
                  onChange={e => setDivForm({ ...divForm, ee_name: e.target.value })}
                  placeholder="e.g. Engr. Mohammad Rafiqul Islam"
                  className="input-festive w-full p-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={divForm.contact_email}
                    onChange={e => setDivForm({ ...divForm, contact_email: e.target.value })}
                    placeholder="ee.bdd4@rhd.gov.bd"
                    className="input-festive w-full p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={divForm.contact_phone}
                    onChange={e => setDivForm({ ...divForm, contact_phone: e.target.value })}
                    placeholder="+880-1711-XXXXXX"
                    className="input-festive w-full p-2 text-xs"
                  />
                </div>
              </div>

              {!editingDivision && (
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="auto_account"
                    checked={divForm.create_login_account}
                    onChange={e => setDivForm({ ...divForm, create_login_account: e.target.checked })}
                    className="rounded border-slate-300 text-[#034081]"
                  />
                  <label htmlFor="auto_account" className="text-slate-700 cursor-pointer">
                    Auto-generate institutional BDD_EE login account (password: <code>rhd123</code>)
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setProvisionModalOpen(false)}
                  className="btn-neutral text-xs px-3.5 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-festive-blue text-xs font-bold px-4 py-2"
                >
                  {editingDivision ? "Save Changes" : "Create Design Division"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
