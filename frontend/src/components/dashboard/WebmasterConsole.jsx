import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Upload, 
  Download, 
  Plus, 
  Users, 
  Layers, 
  Check, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { api } from '../../services/api';

export default function WebmasterConsole({ currentUser }) {
  const [activeTab, setActiveTab] = useState('hierarchy'); // hierarchy or users
  const [zones, setZones] = useState([]);
  const [roads, setRoads] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  // Modals state
  const [showAddRoad, setShowAddRoad] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newRoad, setNewRoad] = useState({ road_number: '', road_name: '', road_type_id: 1, length_km: 0 });
  const [newUser, setNewUser] = useState({ username: '', full_name: '', email: '', role: 'FIELD_SAE', password: 'rhd123', designation: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [z, r, u] = await Promise.all([
        api.getZones(),
        api.getRoads(),
        api.getUsers()
      ]);
      setZones(z);
      setRoads(r);
      setUsers(u);
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleExportJSON = async () => {
    try {
      const data = await api.exportHierarchy();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'rhd_master_hierarchy_seed.json';
      a.click();
      setMsg({ type: 'success', text: 'Hierarchy exported as rhd_master_hierarchy_seed.json' });
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  const handleImportJSON = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await api.importHierarchy(file);
      setMsg({ type: 'success', text: 'Hierarchy JSON imported and merged successfully!' });
      loadData();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  const handleCreateRoad = async (e) => {
    e.preventDefault();
    try {
      await api.createRoad(newRoad);
      setShowAddRoad(false);
      setNewRoad({ road_number: '', road_name: '', road_type_id: 1, length_km: 0 });
      setMsg({ type: 'success', text: `Road ${newRoad.road_number} created successfully!` });
      loadData();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.createUser(newUser);
      setShowAddUser(false);
      setNewUser({ username: '', full_name: '', email: '', role: 'FIELD_SAE', password: 'rhd123', designation: '' });
      setMsg({ type: 'success', text: `User ${newUser.username} registered successfully!` });
      loadData();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="pb-3 border-b border-slate-300 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold text-cyan-800 uppercase bg-cyan-100 px-2 py-0.5 border border-cyan-300">
              [MST-01] CENTRAL WEBMASTER OPERATIONS
            </span>
            <span className="text-xs font-mono text-slate-500">
              RHD Master Hierarchy & System Directory
            </span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 mt-1">
            Zones, Circles, Divisions, Roads & User Postings Governance
          </h1>
        </div>

        {/* Global JSON Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportJSON}
            className="px-3.5 py-1.5 rounded-xl bg-white/70 hover:bg-[#00225a] text-[#00225a] hover:text-white font-mono text-xs font-semibold flex items-center space-x-1.5 border border-white/90 shadow-xs transition-all cursor-pointer backdrop-blur-xs"
          >
            <Download className="w-3.5 h-3.5 text-[#01c1f2]" />
            <span>EXPORT SEED JSON</span>
          </button>

          <label className="btn-festive-teal font-mono text-xs font-semibold px-3.5 py-1.5 cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>IMPORT JSON</span>
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>
        </div>
      </div>

      {msg && (
        <div className={`p-3 text-xs font-mono flex items-center justify-between border ${msg.type === 'error' ? 'bg-red-50 text-red-800 border-red-300' : 'bg-emerald-50 text-emerald-800 border-emerald-300'}`}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} className="font-bold ml-4">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl glass-panel font-mono text-xs">
        <button
          onClick={() => setActiveTab('hierarchy')}
          className={`px-4 py-2 font-bold rounded-xl flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'hierarchy'
              ? 'bg-white/80 shadow-xs text-[#01c1f2] border border-white/80'
              : 'text-[#00225a] hover:bg-white/40'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-[#01c1f2]" />
          <span>[TAB-01] RHD HIERARCHY & ROADS ({zones.length} Zones, {roads.length} Roads)</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-bold rounded-xl flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'bg-white/80 shadow-xs text-[#01c1f2] border border-white/80'
              : 'text-[#00225a] hover:bg-white/40'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-[#01c1f2]" />
          <span>[TAB-02] USER & OFFICE POSTINGS ({users.length} Users)</span>
        </button>
      </div>

      {/* Tab 1: Hierarchy */}
      {activeTab === 'hierarchy' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm text-[#001139]">
              11 Official Zones & Operational Road Divisions
            </h3>
            <button
              onClick={() => setShowAddRoad(true)}
              className="px-3 py-1.5 rounded-xl bg-[#00225a] hover:bg-[#034081] text-white font-mono text-xs flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-300" />
              <span>Add Road</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {zones.map((z) => (
              <div key={z.code} className="eng-panel p-3.5 space-y-2">
                <div className="font-mono text-xs font-bold text-[#034081] pb-1.5 border-b border-white/60 flex items-center justify-between">
                  <span>{z.name}</span>
                  <span className="text-[10px] text-slate-500 font-normal">({z.code})</span>
                </div>
                <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {z.circles?.map((c) => (
                    <div key={c.code} className="text-[11px] pl-2 border-l-2 border-[#01c1f2]/60">
                      <div className="font-semibold text-[#001139] truncate">{c.name}</div>
                      <div className="text-[10px] font-mono text-slate-600 pl-1">
                        {c.divisions?.map(d => d.name).join(', ') || 'No divisions'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Roads Table */}
          <div className="eng-panel mt-6">
            <div className="eng-section-header accent-teal flex items-center justify-between">
              <span>RHD Network Road Master Registry</span>
              <span className="font-mono text-xs font-bold text-[#034081]">{roads.length} Roads Indexed</span>
            </div>
            <div className="max-h-80 overflow-y-auto p-1">
              <table className="w-full text-xs text-left">
                <thead className="bg-white/60 backdrop-blur-md font-mono text-[11px] uppercase border-b border-white/60 sticky top-0 text-[#00225a]">
                  <tr>
                    <th className="p-2 border-r border-white/60">Road Number</th>
                    <th className="p-2 border-r border-white/60">Road Name</th>
                    <th className="p-2 border-r border-white/60">Length (km)</th>
                    <th className="p-2">Type ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/40 font-mono">
                  {roads.slice(0, 50).map((r) => (
                    <tr key={r.id} className="hover:bg-white/40 transition-colors">
                      <td className="p-2 font-bold text-sky-800 border-r border-white/40">{r.road_number}</td>
                      <td className="p-2 font-sans border-r border-white/40 text-[#001139]">{r.road_name}</td>
                      <td className="p-2 border-r border-white/40 text-slate-700">{r.length_km} km</td>
                      <td className="p-2 text-slate-700">{r.road_type_id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Users */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm text-[#001139]">
              Active Institutional User Accounts (Strict Singleton Supreme Enforced)
            </h3>
            <button
              onClick={() => setShowAddUser(true)}
              className="px-3 py-1.5 rounded-xl bg-[#00225a] hover:bg-[#034081] text-white font-mono text-xs flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-300" />
              <span>Add User</span>
            </button>
          </div>

          <div className="eng-panel">
            <div className="eng-section-header accent-teal flex items-center justify-between">
              <span>Authorized System Accounts</span>
              <span className="font-mono text-xs font-bold text-[#034081]">{users.length} Users</span>
            </div>
            <div className="max-h-80 overflow-y-auto p-1">
              <table className="w-full text-xs text-left">
                <thead className="bg-white/60 backdrop-blur-md font-mono text-[11px] uppercase border-b border-white/60 sticky top-0 text-[#00225a]">
                  <tr>
                    <th className="p-2 border-r border-white/60">Username</th>
                    <th className="p-2 border-r border-white/60">Full Name</th>
                    <th className="p-2 border-r border-white/60">Governance Role</th>
                    <th className="p-2 border-r border-white/60">Official Designation</th>
                    <th className="p-2 border-r border-white/60">Email</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/40 font-mono">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-white/40 transition-colors">
                      <td className="p-2 font-bold text-[#001139] border-r border-white/40">{u.username}</td>
                      <td className="p-2 font-sans font-medium border-r border-white/40 text-slate-800">{u.full_name}</td>
                      <td className="p-2 border-r border-white/40">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                          u.role === 'SUPREME' ? 'bg-purple-100 text-purple-900 border border-purple-300' :
                          u.role === 'WEBMASTER' ? 'bg-cyan-100 text-cyan-900 border border-cyan-300' :
                          u.role.startsWith('BDD') ? 'bg-sky-100 text-sky-900 border border-sky-300' :
                          'bg-white/60 text-slate-800 border border-white/80'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-2 font-sans border-r border-white/40 text-slate-700">{u.designation || '—'}</td>
                      <td className="p-2 border-r border-white/40 text-slate-600">{u.email}</td>
                      <td className="p-2">
                        <span className="text-emerald-700 font-bold bg-emerald-100/80 border border-emerald-300 px-2 py-0.5 rounded-md text-[10px]">ACTIVE</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Road Modal */}
      {showAddRoad && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 modal-backdrop-appear">
          <div className="eng-panel p-6 max-w-md w-full shadow-2xl modal-dialog-appear">
            <h3 className="font-bold text-sm text-[#001139] font-mono uppercase pb-2 border-b border-white/60 mb-4">
              Add New Road to RHD Network
            </h3>
            <form onSubmit={handleCreateRoad} className="space-y-3 text-xs">
              <div>
                <label className="block font-mono text-[#00225a] font-semibold mb-1">Road Number (e.g. N1, R110, Z1031)</label>
                <input
                  type="text"
                  required
                  value={newRoad.road_number}
                  onChange={e => setNewRoad({ ...newRoad, road_number: e.target.value })}
                  className="eng-input w-full p-2 font-mono text-xs"
                />
              </div>
              <div>
                <label className="block font-mono text-[#00225a] font-semibold mb-1">Official Road Name</label>
                <input
                  type="text"
                  required
                  value={newRoad.road_name}
                  onChange={e => setNewRoad({ ...newRoad, road_name: e.target.value })}
                  className="eng-input w-full p-2 text-xs"
                />
              </div>
              <div>
                <label className="block font-mono text-[#00225a] font-semibold mb-1">Road Type ID (1: National, 2: Regional, 3: Zilla, 4: Others)</label>
                <input
                  type="number"
                  min="1"
                  max="4"
                  value={newRoad.road_type_id}
                  onChange={e => setNewRoad({ ...newRoad, road_type_id: parseInt(e.target.value) })}
                  className="eng-input w-full p-2 font-mono text-xs"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-3 border-t border-white/60">
                <button
                  type="button"
                  onClick={() => setShowAddRoad(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-white/60 hover:bg-white text-slate-700 font-mono border border-white/80 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#034081] hover:bg-[#00225a] text-white font-mono font-bold shadow-xs transition-all cursor-pointer"
                >
                  Save Road
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 modal-backdrop-appear">
          <div className="eng-panel p-6 max-w-md w-full shadow-2xl modal-dialog-appear">
            <h3 className="font-bold text-sm text-[#001139] font-mono uppercase pb-2 border-b border-white/60 mb-4">
              Register Authorized Official Account
            </h3>
            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-mono text-[#00225a] font-semibold mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={newUser.username}
                  onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                  className="eng-input w-full p-2 font-mono text-xs"
                />
              </div>
              <div>
                <label className="block font-mono text-[#00225a] font-semibold mb-1">Full Officer Name</label>
                <input
                  type="text"
                  required
                  value={newUser.full_name}
                  onChange={e => setNewUser({ ...newUser, full_name: e.target.value })}
                  className="eng-input w-full p-2 text-xs"
                />
              </div>
              <div>
                <label className="block font-mono text-[#00225a] font-semibold mb-1">Official Designation</label>
                <input
                  type="text"
                  placeholder="e.g. Sub-Assistant Engineer, Dhaka Road Division"
                  value={newUser.designation}
                  onChange={e => setNewUser({ ...newUser, designation: e.target.value })}
                  className="eng-input w-full p-2 text-xs"
                />
              </div>
              <div>
                <label className="block font-mono text-[#00225a] font-semibold mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  className="eng-input w-full p-2 font-mono text-xs"
                />
              </div>
              <div>
                <label className="block font-mono text-[#00225a] font-semibold mb-1">RHD Institutional Role</label>
                <select
                  value={newUser.role}
                  onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                  className="eng-input w-full p-2 font-mono text-xs"
                >
                  <option value="FIELD_SAE">FIELD_SAE (Sub-Assistant Engineer)</option>
                  <option value="FIELD_SDE">FIELD_SDE (Sub-Divisional Engineer)</option>
                  <option value="FIELD_EE">FIELD_EE (Executive Engineer)</option>
                  <option value="FIELD_SE">FIELD_SE (Superintending Engineer)</option>
                  <option value="FIELD_ACE">FIELD_ACE (Zone Additional Chief)</option>
                  <option value="BMW_ACE">BMW_ACE (Bridge Mgmt Wing Additional Chief)</option>
                  <option value="BDC_SE">BDC_SE (Bridge Design Circle Superintending)</option>
                  <option value="BDD_EE">BDD_EE (Bridge Design Division EE)</option>
                  <option value="BDD_SDE">BDD_SDE (Bridge Design Division SDE)</option>
                  <option value="WEBMASTER">WEBMASTER (System Master)</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-3 border-t border-white/60">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-white/60 hover:bg-white text-slate-700 font-mono border border-white/80 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#034081] hover:bg-[#00225a] text-white font-mono font-bold shadow-xs transition-all cursor-pointer"
                >
                  Register Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
