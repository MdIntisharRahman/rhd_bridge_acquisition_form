import React, { useState, useEffect } from 'react';
import { Layers, Plus, Trash2, RefreshCw, ExternalLink, Save, CheckCircle, MapPin } from 'lucide-react';
import { api } from '../../services/api';
import './RhdWebmapBorelogForm.css';

const USCS_CLASSES = [
  'GW', 'GP', 'GM', 'GC', 'SW', 'SP', 'SM', 'SC',
  'ML', 'CL', 'OL', 'MH', 'CH', 'OH', 'Pt',
  'GW-GM', 'GW-GC', 'GP-GM', 'GP-GC', 'SW-SM', 'SW-SC', 'SP-SM', 'SP-SC', 'GC-GM', 'SC-SM', 'CL-ML'
];

export default function RhdWebmapBorelogForm({ 
  structureCode, 
  acquisitionType, 
  acquisitionId,
  totalBoreholes = 0,
  onBoreholeCountChange 
}) {
  const [bhCount, setBhCount] = useState(totalBoreholes || 0);
  const [activeBhIndex, setActiveBhIndex] = useState(1);
  const [boreholeData, setBoreholeData] = useState({});
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState(null);

  const parseChainage = (str) => {
    if (!str) return { km: "", m: "" };
    const m = String(str).match(/(?:Ch(?:ainage)?)?\s*([0-9]+)\s*\+\s*([0-9]+(?:\.[0-9]+)?)/i);
    if (m) return { km: m[1], m: m[2] };
    const num = String(str).match(/^([0-9]+)(?:\.([0-9]+))?$/);
    if (num) return { km: num[1], m: num[2] || "" };
    return { km: "", m: "" };
  };

  useEffect(() => {
    if (acquisitionId) {
      loadBoreholes();
    }
  }, [acquisitionId, acquisitionType]);

  const loadBoreholes = async () => {
    try {
      const logs = await api.getBorelogs(acquisitionType, acquisitionId);
      const dataMap = {};
      logs.forEach(l => {
        dataMap[l.borehole_no] = {
          ...l,
          strata: l.strata_json ? JSON.parse(l.strata_json) : [],
          spt: l.spt_json ? JSON.parse(l.spt_json) : [],
          samples: l.sample_json ? JSON.parse(l.sample_json) : [],
          lab: l.lab_json ? JSON.parse(l.lab_json) : {}
        };
      });
      setBoreholeData(dataMap);
      if (logs.length > 0 && bhCount < logs.length) {
        setBhCount(logs.length);
        if (onBoreholeCountChange) onBoreholeCountChange(logs.length);
      }
    } catch (err) {
      console.error("Error loading borehole logs:", err);
    }
  };

  const handleCountChange = (newCount) => {
    const val = Math.max(0, Math.min(40, parseInt(newCount) || 0));
    setBhCount(val);
    if (onBoreholeCountChange) onBoreholeCountChange(val);
    if (activeBhIndex > val && val > 0) setActiveBhIndex(1);
  };

  const currentBh = boreholeData[activeBhIndex] || {
    borehole_no: activeBhIndex,
    borehole_uid: `${structureCode || 'STR'}-BH-${activeBhIndex}-PAC0E9-${Date.now().toString(36)}`,
    chainage: '',
    lat: '',
    lng: '',
    ground_bed_rl: '',
    water_table_depth: '',
    remarks: '',
    strata: [
      { top: 0.0, bottom: 1.5, uscs_class: 'CL', description: 'Brownish silty clay with sand traces' }
    ],
    spt: [
      { depth: 1.5, b150: 3, b300: 5, b450: 7, n_value: 12 }
    ],
    samples: [
      { depth: 1.5, type: 'SPT', recovery_pct: 85, rqd_pct: 0 }
    ],
    lab: { liquid_limit: 38, plastic_limit: 22, moisture_pct: 24 }
  };

  const updateCurrentBh = (field, value) => {
    setBoreholeData(prev => ({
      ...prev,
      [activeBhIndex]: {
        ...currentBh,
        [field]: value
      }
    }));
  };

  // Dynamic Strata Rows
  const addStrataRow = () => {
    const current = currentBh.strata || [];
    const lastBottom = current.length > 0 ? current[current.length - 1].bottom : 0.0;
    const nextBottom = (parseFloat(lastBottom) + 2.0).toFixed(1);
    const newStrata = [
      ...current,
      { top: lastBottom, bottom: nextBottom, uscs_class: 'SM', description: 'Grey fine silty sand' }
    ];
    updateCurrentBh('strata', newStrata);
  };

  const updateStrataRow = (idx, field, val) => {
    const current = [...(currentBh.strata || [])];
    current[idx][field] = val;
    updateCurrentBh('strata', current);
  };

  const removeStrataRow = (idx) => {
    const current = (currentBh.strata || []).filter((_, i) => i !== idx);
    updateCurrentBh('strata', current);
  };

  // Dynamic SPT Rows
  const addSptRow = () => {
    const current = currentBh.spt || [];
    const lastDepth = current.length > 0 ? current[current.length - 1].depth : 0.0;
    const nextDepth = (parseFloat(lastDepth) + 1.5).toFixed(1);
    const newSpt = [
      ...current,
      { depth: nextDepth, b150: 4, b300: 6, b450: 9, n_value: 15 }
    ];
    updateCurrentBh('spt', newSpt);
  };

  const updateSptRow = (idx, field, val) => {
    const current = [...(currentBh.spt || [])];
    current[idx][field] = val;
    // Auto calculate N-value = b300 + b450
    if (field === 'b300' || field === 'b450') {
      const b2 = parseInt(field === 'b300' ? val : current[idx].b300) || 0;
      const b3 = parseInt(field === 'b450' ? val : current[idx].b450) || 0;
      current[idx].n_value = b2 + b3;
    }
    updateCurrentBh('spt', current);
  };

  const removeSptRow = (idx) => {
    const current = (currentBh.spt || []).filter((_, i) => i !== idx);
    updateCurrentBh('spt', current);
  };

  // Save borehole to RHD ADDS DB
  const handleSaveBorehole = async () => {
    if (!acquisitionId) {
      alert("Please save the acquisition draft first before recording borehole logs.");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        acquisition_type: acquisitionType,
        acquisition_id: acquisitionId,
        borehole_no: activeBhIndex,
        borehole_uid: currentBh.borehole_uid,
        chainage: currentBh.chainage,
        lat: parseFloat(currentBh.lat) || null,
        lng: parseFloat(currentBh.lng) || null,
        ground_bed_rl: parseFloat(currentBh.ground_bed_rl) || null,
        water_table_depth: parseFloat(currentBh.water_table_depth) || null,
        remarks: currentBh.remarks,
        strata_json: JSON.stringify(currentBh.strata || []),
        spt_json: JSON.stringify(currentBh.spt || []),
        sample_json: JSON.stringify(currentBh.samples || []),
        lab_json: JSON.stringify(currentBh.lab || {})
      };

      await api.saveBorelog(acquisitionType, acquisitionId, payload);
      setMsg({ type: 'success', text: `Borehole BH-${activeBhIndex} saved to RHD ADDS database!` });
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  // Sync with https://webmap.rhdbridge.com
  const handleSyncToWebmap = async () => {
    try {
      setSyncing(true);
      const syncPayload = {
        structure_code: structureCode,
        borehole_no: activeBhIndex,
        borehole_uid: currentBh.borehole_uid,
        chainage: currentBh.chainage,
        lat: parseFloat(currentBh.lat) || 23.7,
        lng: parseFloat(currentBh.lng) || 90.4,
        ground_rl: parseFloat(currentBh.ground_bed_rl) || 0,
        water_table: parseFloat(currentBh.water_table_depth) || 0,
        remarks: currentBh.remarks,
        strata: currentBh.strata || [],
        spt: currentBh.spt || [],
        samples: currentBh.samples || [],
        lab: currentBh.lab || {}
      };

      const res = await api.syncWebmapBorelog(syncPayload);
      setMsg({ type: 'success', text: `Borehole synchronized with https://webmap.rhdbridge.com! UID: ${currentBh.borehole_uid}` });
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Controller Header */}
      <div className="eng-panel p-3.5 flex flex-wrap items-center justify-between gap-3 text-[#001139]">
        <div className="flex items-center space-x-3">
          <div className="bg-[#034081] px-2 py-1 text-white font-bold text-xs rounded-md" style={{ fontFamily: 'var(--font-caption)' }}>
            BH-GIS
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#001139]" style={{ fontFamily: 'var(--font-display)' }}>
              Webmap GIS & Borehole Integration Module
            </div>
            <div className="text-[11px] text-[#5b6b7a]" style={{ fontFamily: 'var(--font-caption)' }}>
              Ecosystem Data Contract with <a href="https://webmap.rhdbridge.com" target="_blank" rel="noreferrer" className="text-[#034081] font-bold hover:underline">webmap.rhdbridge.com</a>
            </div>
          </div>
        </div>

        {/* Counter (0 to 40) */}
        <div className="flex items-center space-x-2 text-xs" style={{ fontFamily: 'var(--font-ui)' }}>
          <span className="text-[#5b6b7a] font-semibold">Total Boreholes (0-40):</span>
          <input
            type="number"
            min="0"
            max="40"
            value={bhCount}
            onChange={e => handleCountChange(e.target.value)}
            className="w-16 p-1 text-center font-bold text-[#034081] outline-none tabular-nums"
          />
        </div>
      </div>

      {msg && (
        <div className={`p-2.5 text-xs flex items-center justify-between border ${msg.type === 'error' ? 'bg-red-50 text-red-800 border-red-300' : 'bg-emerald-50 text-emerald-800 border-emerald-300'}`} style={{ fontFamily: 'var(--font-body)' }}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} className="font-bold ml-4">✕</button>
        </div>
      )}

      {bhCount === 0 ? (
        <div className="eng-panel p-8 text-center text-xs text-[#5b6b7a]" style={{ fontFamily: 'var(--font-body)' }}>
          No boreholes specified for this structure. Increase the borehole counter (e.g., 2, 4, 8) to enter geotechnical stratum and SPT blow counts.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Fluid Borehole Selectors (BH-01, BH-02...) */}
          <div className="fluid-tab-strip select-none mb-3">
            {Array.from({ length: bhCount }, (_, i) => i + 1).map(num => (
              <button
                key={num}
                type="button"
                onClick={() => setActiveBhIndex(num)}
                className={`fluid-tab-item ${activeBhIndex === num ? 'active' : ''}`}
              >
                <span className="fluid-tab-badge">
                  {num < 10 ? `0${num}` : num}
                </span>
                <span>Borehole {num}</span>
              </button>
            ))}
          </div>

          {/* Active Borehole Metadata */}
          <div className="eng-panel p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Borehole UID (56-char RHD Standard)</label>
                <input
                  type="text"
                  readOnly
                  value={currentBh.borehole_uid || ''}
                  className="borelog-input font-mono text-[11px] bg-slate-100 text-slate-600"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Borehole Chainage (Km &amp; Meter)</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block mb-0.5">Km</span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      placeholder="e.g. 194"
                      value={parseChainage(currentBh.chainage).km}
                      onChange={e => {
                        const m = parseChainage(currentBh.chainage).m;
                        const composite = (e.target.value !== '' || m !== '') ? `Ch ${e.target.value || 0}+${String(m || 0).padStart(3, '0')}` : '';
                        updateCurrentBh('chainage', composite);
                      }}
                      className="borelog-input font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block mb-0.5">Meter (m)</span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="999"
                      placeholder="e.g. 215"
                      value={parseChainage(currentBh.chainage).m}
                      onChange={e => {
                        const km = parseChainage(currentBh.chainage).km;
                        const composite = (km !== '' || e.target.value !== '') ? `Ch ${km || 0}+${String(e.target.value || 0).padStart(3, '0')}` : '';
                        updateCurrentBh('chainage', composite);
                      }}
                      className="borelog-input font-mono"
                    />
                  </div>
                </div>
                <span className="text-[10px] font-mono text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 inline-block mt-1">
                  {currentBh.chainage || "Ch 0+000"}
                </span>
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Ground / Bed R.L. (m Datum)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 5.45"
                  value={currentBh.ground_bed_rl || ''}
                  onChange={e => updateCurrentBh('ground_bed_rl', e.target.value)}
                  className="borelog-input tabular-nums"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Water Table Depth (m)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 1.80"
                  value={currentBh.water_table_depth || ''}
                  onChange={e => updateCurrentBh('water_table_depth', e.target.value)}
                  className="borelog-input tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Borehole GPS Latitude</label>
                <input
                  type="number"
                  step="0.000001"
                  placeholder="23.456700"
                  value={currentBh.lat || ''}
                  onChange={e => updateCurrentBh('lat', e.target.value)}
                  className="borelog-input tabular-nums"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Borehole GPS Longitude</label>
                <input
                  type="number"
                  step="0.000001"
                  placeholder="90.876500"
                  value={currentBh.lng || ''}
                  onChange={e => updateCurrentBh('lng', e.target.value)}
                  className="borelog-input tabular-nums"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Geotechnical Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Hard clay stratum encountered at 18.5m"
                  value={currentBh.remarks || ''}
                  onChange={e => updateCurrentBh('remarks', e.target.value)}
                  className="borelog-input font-mono"
                />
              </div>
            </div>
          </div>

          {/* Sub-Section 1: Soil Stratum Table */}
          <div className="eng-panel">
            <div className="eng-section-header accent-teal flex items-center justify-between">
              <span>Soil Stratum Layers (USCS / AASHTO Classification)</span>
              <button
                type="button"
                onClick={addStrataRow}
                className="px-2.5 py-1 bg-[#01c1f2] hover:bg-[#034081] text-[#001139] hover:text-white font-bold text-[10px] rounded-xs transition-colors cursor-pointer"
              >
                + ADD STRATUM LAYER
              </button>
            </div>
            <table className="borelog-table">
              <thead>
                <tr>
                  <th style={{ width: '12%' }}>Top Depth (m)</th>
                  <th style={{ width: '12%' }}>Bottom Depth (m)</th>
                  <th style={{ width: '18%' }}>USCS Class</th>
                  <th>Visual Soil Description</th>
                  <th style={{ width: '8%', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {(currentBh.strata || []).map((row, idx) => (
                  <tr key={idx}>
                    <td>
                      <input
                        type="number"
                        step="0.1"
                        value={row.top}
                        onChange={e => updateStrataRow(idx, 'top', e.target.value)}
                        className="borelog-input text-center"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.1"
                        value={row.bottom}
                        onChange={e => updateStrataRow(idx, 'bottom', e.target.value)}
                        className="borelog-input text-center"
                      />
                    </td>
                    <td>
                      <select
                        value={row.uscs_class}
                        onChange={e => updateStrataRow(idx, 'uscs_class', e.target.value)}
                        className="borelog-input font-bold text-[#034081]"
                      >
                        {USCS_CLASSES.map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        value={row.description}
                        onChange={e => updateStrataRow(idx, 'description', e.target.value)}
                        className="borelog-input"
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => removeStrataRow(idx)}
                        className="action-pill-btn action-pill-btn-danger"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sub-Section 2: SPT Blow Counts & N-Values */}
          <div className="eng-panel">
            <div className="eng-section-header accent-teal flex items-center justify-between">
              <span>Standard Penetration Test (SPT) Blow Counts</span>
              <button
                type="button"
                onClick={addSptRow}
                className="px-2.5 py-1 bg-[#01c1f2] hover:bg-[#034081] text-[#001139] hover:text-white font-bold text-[10px] rounded-xs transition-colors cursor-pointer"
              >
                + ADD SPT TEST
              </button>
            </div>
            <table className="borelog-table">
              <thead>
                <tr>
                  <th style={{ width: '15%' }}>Depth (m)</th>
                  <th style={{ width: '18%' }}>Blows (0–150 mm)</th>
                  <th style={{ width: '18%' }}>Blows (150–300 mm)</th>
                  <th style={{ width: '18%' }}>Blows (300–450 mm)</th>
                  <th style={{ width: '18%' }}>N-Value (N₂ + N₃)</th>
                  <th style={{ width: '8%', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {(currentBh.spt || []).map((row, idx) => (
                  <tr key={idx}>
                    <td>
                      <input
                        type="number"
                        step="0.5"
                        value={row.depth}
                        onChange={e => updateSptRow(idx, 'depth', e.target.value)}
                        className="borelog-input text-center"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={row.b150}
                        onChange={e => updateSptRow(idx, 'b150', e.target.value)}
                        className="borelog-input text-center"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={row.b300}
                        onChange={e => updateSptRow(idx, 'b300', e.target.value)}
                        className="borelog-input text-center font-bold"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={row.b450}
                        onChange={e => updateSptRow(idx, 'b450', e.target.value)}
                        className="borelog-input text-center font-bold"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        readOnly
                        value={row.n_value}
                        className="borelog-input text-center font-bold bg-amber-50 text-amber-900"
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => removeSptRow(idx)}
                        className="action-pill-btn action-pill-btn-danger"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Action Strip: Save & Webmap Sync */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 glass-panel border border-white/80 rounded-2xl font-mono text-xs shadow-md backdrop-blur-md">
            <div className="flex items-center space-x-2 text-slate-700">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold">Ready for RHD Geotechnical & Substructure Analysis</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleSaveBorehole}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-[#00225a] hover:bg-[#034081] text-white font-bold flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-sky-300" />
                <span>{saving ? 'Saving...' : `Save BH-${activeBhIndex} to Dossier`}</span>
              </button>

              <button
                type="button"
                onClick={handleSyncToWebmap}
                disabled={syncing}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-200 ${syncing ? 'animate-spin' : ''}`} />
                <span>Sync with Webmap (webmap.rhdbridge.com)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
