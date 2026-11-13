import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  PlayCircle,
  Search,
  Filter,
  RefreshCw,
  Layers,
  Edit3,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { api } from "../../services/api";

const BOTTLENECK_PRESETS = [
  "Awaiting Hydrological Study / HFL Clearance (BWDB / IWTA)",
  "Awaiting Land Acquisition & Right of Way Confirmation (DC Office)",
  "Awaiting Additional Soil Investigation / Borehole Verification",
  "Geometric Alignment / Bypass Query from Field Division",
  "Navigational Clearance Awaited (BIWTA / Ministry)",
  "Railway Span / Crossing Clearance Awaited",
  "Administrative / Budgetary Clarification from Ministry",
  "Other / Pending Special Technical Committee Review",
];

export default function DesignPipelineDashboard({
  currentUser,
  onOpenBridge,
  onOpenCulvert,
}) {
  const [demands, setDemands] = useState([]);
  const [kpi, setKpi] = useState({
    total_demands: 0,
    running_count: 0,
    suspended_count: 0,
    sent_count: 0,
  });
  const [designDivisions, setDesignDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterState, setFilterState] = useState("ALL");
  const [filterDivision, setFilterDivision] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Update Status Modal State
  const [selectedItem, setSelectedItem] = useState(null);
  const [newState, setNewState] = useState("RUNNING");
  const [bottleneckReason, setBottleneckReason] = useState(
    BOTTLENECK_PRESETS[0],
  );
  const [bottleneckNotes, setBottleneckNotes] = useState("");
  const [updating, setUpdating] = useState(false);
  const [msg, setMsg] = useState(null);

  const canUpdateStatus = [
    "BDD_EE",
    "BDD_SDE",
    "SUPREME",
    "WEBMASTER",
  ].includes(currentUser?.role);

  const isHeadquarters = ["SUPREME", "WEBMASTER", "BDD_EE"].includes(
    currentUser?.role,
  );

  useEffect(() => {
    loadPipelineData();
    loadDesignDivisions();
  }, [filterState, filterDivision]);

  const loadDesignDivisions = async () => {
    try {
      const res = await api.getMasterDivisions();
      // Filter divisions under BDC or with Design in name
      const bddList = res.filter(
        (d) =>
          d.name.toLowerCase().includes("design") || d.code.startsWith("BDD"),
      );
      setDesignDivisions(bddList);
    } catch (err) {
      console.warn("Could not load design divisions:", err);
    }
  };

  const loadPipelineData = async () => {
    try {
      setLoading(true);
      const [itemsRes, kpiRes] = await Promise.all([
        api.getDesignDemands({
          design_state: filterState !== "ALL" ? filterState : undefined,
          design_division_id: filterDivision || undefined,
          search: searchQuery || undefined,
        }),
        api.getPipelineKpiSummary(),
      ]);
      setDemands(itemsRes);
      setKpi(kpiRes);
    } catch (err) {
      console.error("Failed to load design pipeline:", err);
      setMsg({
        type: "error",
        text: `Failed to load pipeline: ${err.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadPipelineData();
  };

  const openUpdateModal = (item) => {
    setSelectedItem(item);
    setNewState(item.design_execution_state || "RUNNING");
    setBottleneckReason(item.bottleneck_reason || BOTTLENECK_PRESETS[0]);
    setBottleneckNotes(item.bottleneck_notes || "");
  };

  const submitStatusUpdate = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      setUpdating(true);
      await api.updateDesignDemandStatus(
        selectedItem.acquisition_type.toLowerCase(),
        selectedItem.id,
        {
          design_execution_state: newState,
          bottleneck_reason: newState === "SUSPENDED" ? bottleneckReason : null,
          bottleneck_notes: newState === "SUSPENDED" ? bottleneckNotes : null,
        },
      );
      setMsg({
        type: "success",
        text: `Status for ${selectedItem.code} updated successfully!`,
      });
      setSelectedItem(null);
      loadPipelineData();
    } catch (err) {
      alert(`Update error: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Precision Header */}
      <div className="glass-panel p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span
                className="text-xs font-bold tracking-wider uppercase text-[#034081]"
                style={{ fontFamily: "var(--font-caption)" }}
              >
                RHD Design Wing Command & Control
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-100 text-[#034081]">
                {isHeadquarters
                  ? "National Full View"
                  : `${currentUser?.designation || currentUser?.role}`}
              </span>
            </div>
            <h1
              className="text-2xl font-black text-[#001139] mt-1"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Design Demands & Bottleneck Control Matrix
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Unified real-time tracking for active design calculations,
              suspended dossiers awaiting instructions, and dispatched packages
              across all divisions.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={loadPipelineData}
              disabled={loading}
              className="btn-festive-blue text-xs font-semibold px-3 py-2 flex items-center space-x-2 cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Status Message */}
        {msg && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs font-medium flex items-center justify-between ${
              msg.type === "error"
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-emerald-50 text-emerald-800 border border-emerald-200"
            }`}
          >
            <span>{msg.text}</span>
            <button
              onClick={() => setMsg(null)}
              className="font-bold underline ml-4 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Executive KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-200">
          <div className="glass-panel glass-metric-card cursor-default p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total Demands
              </div>
              <div className="text-2xl font-black text-slate-800 mt-1">
                {kpi.total_demands}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Bridges & Culverts registered
              </div>
            </div>
            <div className="w-10 h-10 rounded-xs  flex items-center justify-center glass-metric-icon transition-transform">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-panel glass-metric-card cursor-default bg-sky-50/50 border-sky-200/80 p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-sky-700 flex items-center space-x-1">
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Design Running</span>
              </div>
              <div className="text-2xl font-black text-sky-900 mt-1">
                {kpi.running_count}
              </div>
              <div className="text-[11px] text-sky-700 mt-0.5">
                Currently under calculation
              </div>
            </div>
            <div className="w-10 h-10 rounded-xs flex items-center justify-center metric-icon transition-transform">
              <PlayCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-panel glass-metric-card cursor-default bg-amber-50/50 border-amber-300/80 p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center space-x-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Suspended (Bottleneck)</span>
              </div>
              <div className="text-2xl font-black text-amber-900 mt-1">
                {kpi.suspended_count}
              </div>
              <div className="text-[11px] text-amber-700 mt-0.5">
                Awaiting instructions / clearances
              </div>
            </div>
            <div className="w-10 h-10 rounded-xs  flex items-center justify-center glass-metric-icon transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-panel glass-metric-card cursor-default bg-emerald-50/50 border-emerald-200/80 p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Design Sent</span>
              </div>
              <div className="text-2xl font-black text-emerald-900 mt-1">
                {kpi.sent_count}
              </div>
              <div className="text-[11px] text-emerald-700 mt-0.5">
                Approved & dispatched packages
              </div>
            </div>
            <div className="w-10 h-10 rounded-xs  flex items-center justify-center glass-metric-icon transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Control Toolbar */}
      <div className="glass-panel p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-600 flex items-center space-x-1 mr-1">
            <Filter className="w-3.5 h-3.5 text-[#034081]" />
            <span>State:</span>
          </span>

          {[
            { key: "ALL", label: "All Demands" },
            { key: "RUNNING", label: "Running (In Progress)" },
            { key: "SUSPENDED", label: "Suspended (Bottlenecks)" },
            { key: "SENT", label: "Design Sent" },
            { key: "NOT_STARTED", label: "Queued" },
          ].map((st) => (
            <button
              key={st.key}
              onClick={() => setFilterState(st.key)}
              className={`px-3 py-1.5 border border-slate-700  rounded-xs text-xs font-bold transition-all cursor-pointer ${
                filterState === st.key
                  ? "bg-cyan-500/77 shadow-xs"
                  : "bg-transparent hover:bg-amber-500"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          {/* Design Division selector for Headquarters and BDD */}
          <select
            value={filterDivision}
            onChange={(e) => setFilterDivision(e.target.value)}
            className="input-festive text-xs py-1.5 px-3 min-w-[180px]"
          >
            <option value="">All Design Divisions</option>
            {designDivisions.map((div) => (
              <option key={div.id} value={div.id}>
                {div.name}
              </option>
            ))}
          </select>

          {/* Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="relative min-w-[200px]"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code, road, reason..."
              className="input-festive text-xs py-1.5 pl-8 pr-3 w-full"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </form>
        </div>
      </div>

      {/* Main Demands & Bottleneck Control Table */}
      <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-[#00225a] font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Demand Code & Structure</th>
                <th className="py-3 px-3">Location & Chainage</th>
                <th className="py-3 px-3">Field Division</th>
                <th className="py-3 px-3">Assigned Design Div</th>
                <th className="py-3 px-3">Workflow Stage</th>
                <th className="py-3 px-3">Design Execution State</th>
                <th className="py-3 px-4 min-w-[220px]">
                  Bottleneck / Awaiting Instructions
                </th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="8"
                    className="py-12 text-center text-slate-500 font-medium"
                  >
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-600 mb-2" />
                    Loading design matrix and bottleneck status...
                  </td>
                </tr>
              ) : demands.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    No bridge or culvert demands match the selected criteria.
                  </td>
                </tr>
              ) : (
                demands.map((item) => {
                  const isBridge = item.acquisition_type === "BRIDGE";
                  const isSuspended =
                    item.design_execution_state === "SUSPENDED";
                  const isRunning = item.design_execution_state === "RUNNING";
                  const isSent = item.design_execution_state === "SENT";

                  return (
                    <tr
                      key={`${item.acquisition_type}_${item.id}`}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSuspended ? "bg-amber-50/30" : ""
                      }`}
                    >
                      {/* 1. Demand Code & Structure */}
                      <td className="py-3.5 px-4 font-mono font-medium">
                        <div className="inline-flex items-center space-x-1.5">
                          {/* <span
                            className={`h-full px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              isBridge
                                ? "bg-sky-100 text-sky-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {item.acquisition_type}
                          </span> */}
                          <span className="font-bold text-[#001139]">
                            {item.code}
                          </span>
                        </div>
                        <div
                          className="font-sans font-bold text-slate-800 mt-1 line-clamp-1"
                          title={item.structure_name}
                        >
                          {item.structure_name}
                        </div>
                        <div className="font-sans text-[11px] text-slate-500">
                          {item.structure_type || "Standard Structure"}
                        </div>
                      </td>

                      {/* 2. Road & Chainage (Km + Meter) */}
                      <td className="py-3 px-3">
                        <div
                          className="font-medium text-slate-800 line-clamp-1"
                          title={item.road_name}
                        >
                          {item.road_name || "Unassigned Road"}
                        </div>
                        {item.chainage_km !== null &&
                        item.chainage_km !== undefined ? (
                          <div className="mt-1 font-mono text-[11px] font-bold text-[#034081] bg-sky-50 px-2 py-0.5 rounded inline-block">
                            Ch {item.chainage_km}+{item.chainage_m || 0}
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {item.location_chainage_gps_text ||
                              "Ch not specified"}
                          </div>
                        )}
                      </td>

                      {/* 3. Field Division */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">
                          {item.division_name || "Headquarters"}
                        </div>
                        {item.zone_name ? (
                          <div className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded inline-block mt-0.5 border border-emerald-200">
                            {item.zone_name}
                          </div>
                        ) : (
                          <div className="text-[10.5px] text-slate-500">
                            {item.circle_name || ""}
                          </div>
                        )}
                      </td>

                      {/* 4. Assigned Design Division & Engineer */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#001139]">
                          {item.assigned_bdd_division_name || (
                            <span className="text-slate-400 font-normal italic">
                              Unassigned BDD
                            </span>
                          )}
                        </div>
                        {item.assigned_bdd_sde_name && (
                          <div className="text-[11px] text-sky-700 font-medium">
                            SDE: {item.assigned_bdd_sde_name}
                          </div>
                        )}
                      </td>

                      {/* 5. Workflow Stage */}
                      <td className="py-3 px-3">
                        <span className="px-2 py-1 rounded-md text-[10.5px] font-bold text-slate-700 inline-block">
                          {/* Eliminated the card here. */}
                          {item.workflow_status.replace(/_/g, " ")}
                        </span>
                      </td>

                      {/* 6. Design Execution State */}
                      <td className="py-3 px-3">
                        {isSuspended && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 font-bold text-xs text-amber-900">
                            <AlertTriangle className="w-5 h-5 text-amber-700" />
                            <span>SUSPENDED</span>
                          </span>
                        )}
                        {isRunning && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 font-bold text-xs text-sky-900">
                            <PlayCircle className="w-5 h-5 text-sky-700" />
                            <span>RUNNING</span>
                          </span>
                        )}
                        {isSent && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 font-bold text-xs text-emerald-900">
                            <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                            <span>DESIGN SENT</span>
                          </span>
                        )}
                        {!isSuspended && !isRunning && !isSent && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 font-bold text-xs text-slate-700">
                            <Clock className="w-5 h-5 text-slate-500" />
                            <span>QUEUED</span>
                          </span>
                        )}
                      </td>

                      {/* 7. Bottleneck / Awaiting Instructions */}
                      <td className="py-3 px-4">
                        {isSuspended ? (
                          <div className="space-y-1">
                            <div className="font-bold text-amber-900 text-xs flex items-center space-x-1">
                              <ShieldAlert className="w-3 h-3 text-amber-700 shrink-0" />
                              <span
                                className="line-clamp-1"
                                title={item.bottleneck_reason}
                              >
                                {item.bottleneck_reason ||
                                  "Bottleneck Encountered"}
                              </span>
                            </div>
                            {item.bottleneck_notes && (
                              <div
                                className="text-[11px] text-slate-700 bg-white/80 p-1.5 rounded border border-amber-200 line-clamp-2"
                                title={item.bottleneck_notes}
                              >
                                <span className="font-semibold text-slate-900">
                                  Awaiting:{" "}
                                </span>
                                {item.bottleneck_notes}
                              </div>
                            )}
                            {item.bottleneck_updated_at && (
                              <div className="text-[10px] text-slate-400">
                                Suspended on{" "}
                                {new Date(
                                  item.bottleneck_updated_at,
                                ).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ) : isRunning ? (
                          <div className="text-slate-600 text-xs font-medium">
                            Design calculations and structural checks actively
                            progressing.
                          </div>
                        ) : isSent ? (
                          <div className="text-emerald-700 text-xs font-semibold">
                            Full approved engineering package sent to field
                            division.
                          </div>
                        ) : (
                          <div className="text-slate-400 text-xs italic">
                            Awaiting assignment or initial review by Bridge
                            Design Circle.
                          </div>
                        )}
                      </td>

                      {/* 8. Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {canUpdateStatus && (
                            <button
                              onClick={() => openUpdateModal(item)}
                              className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:border-[#034081] text-[#034081] hover:bg-sky-50 text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1 shadow-2xs table-action-icon"
                              title="Update design state and bottleneck status"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Update</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              if (isBridge && onOpenBridge)
                                onOpenBridge(item.id);
                              if (!isBridge && onOpenCulvert)
                                onOpenCulvert(item.id);
                            }}
                            className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer table-action-icon"
                            title="Open Dossier Workspace"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
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

      {/* Update Design Status & Bottleneck Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 modal-appear">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700 font-mono">
                  {selectedItem.code} • {selectedItem.acquisition_type}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  Update Design Execution State
                </h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={submitStatusUpdate}
              className="space-y-4 mt-4 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Design Execution State
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "RUNNING", label: "Running", color: "sky" },
                    {
                      key: "SUSPENDED",
                      label: "Suspended (Bottleneck)",
                      color: "amber",
                    },
                    { key: "SENT", label: "Design Sent", color: "emerald" },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setNewState(opt.key)}
                      className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                        newState === opt.key
                          ? `bg-${opt.color}-500 text-white border-${opt.color}-600 shadow-xs`
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional Bottleneck Fields */}
              {newState === "SUSPENDED" && (
                <div className="space-y-3 bg-amber-50/50 p-3.5 rounded-xl border border-amber-200">
                  <div>
                    <label className="block font-bold text-amber-900 mb-1">
                      Bottleneck Category
                    </label>
                    <select
                      value={bottleneckReason}
                      onChange={(e) => setBottleneckReason(e.target.value)}
                      className="input-festive text-xs w-full py-1.5"
                    >
                      {BOTTLENECK_PRESETS.map((p, idx) => (
                        <option key={idx} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-amber-900 mb-1">
                      Awaiting Instructions / Reason Details
                    </label>
                    <textarea
                      rows={3}
                      value={bottleneckNotes}
                      onChange={(e) => setBottleneckNotes(e.target.value)}
                      placeholder="Specify what exact instruction, clearance, or test data is awaited..."
                      className="input-festive text-xs w-full py-1.5 resize-none"
                      required
                    />
                    <p className="text-[10px] text-amber-800 mt-1">
                      This information will be presented directly in the matrix
                      to all Executive Engineers and the Chief Engineer.
                    </p>
                  </div>
                </div>
              )}

              {newState === "SENT" && (
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-emerald-800 text-xs">
                  Marking this design as <strong>SENT</strong> indicates that
                  all detailed structural drawings, soil reports, and
                  calculation sheets have been verified and dispatched to the
                  field division.
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="btn-neutral text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="btn-festive-blue text-xs font-bold px-4 py-2"
                >
                  {updating ? "Saving..." : "Save State Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
