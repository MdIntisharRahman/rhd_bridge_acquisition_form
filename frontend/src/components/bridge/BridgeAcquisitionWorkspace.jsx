import React, { useState, useEffect, useMemo } from "react";
import gsap from "gsap";
import {
  Save,
  Send,
  ArrowLeft,
  CircleChevronLeft,
  ArrowRight,
  RotateCcw,
  CheckCircle,
  Download,
  Layers,
  AlertTriangle,
  Upload,
  FileText,
  FileCheck,
  ExternalLink,
  MapPin,
  Trash2,
  Lock,
  History,
  Shield
} from "lucide-react";
import { api } from "../../services/api";
import UnifiedSideFlowPanel from "../workflow/UnifiedSideFlowPanel";
import ReturnForCorrectionModal from "../workflow/ReturnForCorrectionModal";
import RhdWebmapBorelogForm from "../borelog/RhdWebmapBorelogForm";
import PreparedDesignPackageCard from "../workflow/PreparedDesignPackageCard";
import DemandPlacementAuditLog from "../workflow/DemandPlacementAuditLog";

const TABS = [
  { id: "TAB-01", title: "Primary", code: "[TAB-01]" },
  { id: "TAB-02", title: "Navigation & Existing", code: "[TAB-02]" },
  { id: "TAB-03", title: "Hydrological", code: "[TAB-03]" },
  { id: "TAB-04", title: "Proposal", code: "[TAB-04]" },
  { id: "TAB-05", title: "Drawings & Reports", code: "[TAB-05]" },
  { id: "TAB-06", title: "Webmap GIS & Borelogs", code: "[TAB-06]" },
  { id: "TAB-07", title: "Prepared Design Deliverables", code: "[TAB-07]" },
  { id: "TAB-08", title: "Audit & Change History", code: "[TAB-08]" },
];

export default function BridgeAcquisitionWorkspace({
  acquisitionId,
  currentUser,
  onBack,
  onSaved,
}) {
  const [activeTab, setActiveTab] = useState("TAB-01");

  // Field division users have fixed jurisdiction (Zone, Circle, Division); Supreme and Webmaster can select freely
  const isFieldUser = Boolean(
    currentUser?.office_division_id &&
    !["SUPREME", "WEBMASTER"].includes(currentUser?.role)
  );
  const isFixedJurisdiction = isFieldUser || Boolean(acquisitionId);

  const [formData, setFormData] = useState({
    proposed_bridge_type: "PC Girder Bridge",
    zone_id: !acquisitionId && isFieldUser ? (currentUser?.office_zone_id || "") : "",
    circle_id: !acquisitionId && isFieldUser ? (currentUser?.office_circle_id || "") : "",
    division_id: !acquisitionId && isFieldUser ? (currentUser?.office_division_id || "") : "",
    road_type_id: 1,
    road_type_others_name: "",
    road_id: "",
    road_name: "",
    road_link_name_no: "",
    location_chainage_gps_text: "",
    location_google_map_link: "",
    location_lat_lng: "",
    bridge_name: "",
    river_channel_name: "",
    channel_width_m: "",
    nav_clearance_authority: "BIWTA",
    nav_clearance_class: "Class-II",
    nav_vertical_clearance_m: 12.2,
    nav_horizontal_clearance_m: 76.22,
    nav_others_note: "",
    existing_bridge_length: "",
    existing_span_arrangement: "",
    reference_datum_type: "MSL",
    reference_benchmark_location: "",
    reference_benchmark_map_link: "",
    reference_benchmark_lat_lng: "",
    existing_mid_span_girder_bottom_rl: "",
    existing_foundation_type: "Pile",
    has_existing_foundation_utility_layout: "No",
    highest_flood_level_hfl: "",
    standard_high_water_level_shwl: "",
    lowest_water_level_lwl: "",
    highest_tide_level_htl: "",
    lowest_tide_level_ltl: "",
    survey_time_water_level: "",
    survey_date: "",
    river_tidal_type: "Not Tidal",
    tidal_dry_season_htl: "",
    tidal_dry_season_ltl: "",
    tidal_rainy_season_htl: "",
    tidal_rainy_season_ltl: "",
    stream_flow_direction: "",
    zero_chainage_reference_point: "",
    zero_chainage_map_link: "",
    zero_chainage_lat_lng: "",
    cross_road_at_approach: "Not Applicable",
    proposed_alignment: "New Alignment",
    proposed_existing_alignment_offset: "At the same alignment",
    electrification_work_required: "No",
    proposed_bridge_length_m: "",
    proposed_span_arrangement_m: "",
    proposed_mid_span_bottom_rl: "",
    pier_protective_work_required: "Not Required",
    proposed_max_height_approach_road: "",
    ancillary_work_required: "",
    remarks: "",
    bms_chainage: "",
    bms_google_map_link: "",
    bms_lat_lng: "",
    total_borehole_count: 0,
  });

  // Field Division Jurisdiction Check:
  // Survey and demand placement inputs are strictly reserved for field personnel belonging to this specific field division (or Supreme/Webmaster)
  const isSupremeOrWebmaster = ["SUPREME", "WEBMASTER"].includes(currentUser?.role);
  const isFieldRole = ["FIELD_SAE", "FIELD_SDE", "FIELD_EE"].includes(currentUser?.role);
  const isSameFieldDivision = Boolean(
    currentUser?.office_division_id &&
    formData?.division_id &&
    Number(currentUser.office_division_id) === Number(formData.division_id)
  );
  const canEditPlacement = isSupremeOrWebmaster || (isFieldRole && (!acquisitionId || isSameFieldDivision));

  const [zones, setZones] = useState([]);
  const [circles, setCircles] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [roadTypes, setRoadTypes] = useState([]);
  const [roads, setRoads] = useState([]);
  const [roadCodeInput, setRoadCodeInput] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState(null);
  const [downloadingExport, setDownloadingExport] = useState(null);
  const [msg, setMsg] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);

  // Demand letter deduplication state
  const [demandOfficerType, setDemandOfficerType] = useState("EE");

  // Export handler with active blob download + authenticated URL fallback
  const handleExport = async (e, format = "pdf") => {
    e.preventDefault();
    if (!acquisitionId) return;
    setDownloadingExport(format);
    try {
      await api.downloadExport("bridge", acquisitionId, format);
      setMsg({ type: "success", text: `${format.toUpperCase()} datasheet downloaded successfully.` });
    } catch (err) {
      console.warn("Direct blob download failed, opening via token URL:", err);
      const url = api.getExportUrl("bridge", acquisitionId, format);
      window.open(url, "_blank");
    } finally {
      setDownloadingExport(null);
    }
  };

  // Road Code & Road Name Auto-Sync from 967 GeoJSON network
  const currentRoad = roads.find((r) => r.id === Number(formData.road_id)) || roads.find((r) => r.road_number && formData.road_name && r.road_name === formData.road_name);
  const currentRoadNumber = currentRoad ? currentRoad.road_number : (roads.find((r) => r.id === Number(formData.road_id))?.road_number || "");

  // Sync roadCodeInput when currentRoad or existing record changes
  useEffect(() => {
    if (currentRoadNumber) {
      setRoadCodeInput(currentRoadNumber);
    }
  }, [currentRoadNumber]);

  // Road filtering by category/type per institutional specification:
  // - National: only N-***
  // - Regional: only R-***
  // - Zilla: only Z-***
  // - Others: other roads / custom entry
  const filteredRoads = useMemo(() => {
    const typeId = Number(formData.road_type_id);
    if (typeId === 1) {
      return roads.filter((r) => r.road_type_id === 1 || (r.road_number && r.road_number.toUpperCase().startsWith("N")));
    }
    if (typeId === 2) {
      return roads.filter((r) => r.road_type_id === 2 || (r.road_number && r.road_number.toUpperCase().startsWith("R")));
    }
    if (typeId === 3) {
      return roads.filter((r) => r.road_type_id === 3 || (r.road_number && r.road_number.toUpperCase().startsWith("Z")));
    }
    if (typeId === 4) {
      return roads.filter((r) => r.road_type_id === 4 || (!r.road_number?.toUpperCase().startsWith("N") && !r.road_number?.toUpperCase().startsWith("R") && !r.road_number?.toUpperCase().startsWith("Z")));
    }
    return roads;
  }, [roads, formData.road_type_id]);

  const handleRoadTypeSelect = (newTypeId) => {
    setFormData((prev) => {
      const next = { ...prev, road_type_id: newTypeId };
      // Check if current selection matches newly chosen road type
      if (currentRoad) {
        const code = (currentRoad.road_number || "").toUpperCase().replace(/[-\s]/g, "");
        const isMatch = (newTypeId === 1 && code.startsWith("N")) ||
                        (newTypeId === 2 && code.startsWith("R")) ||
                        (newTypeId === 3 && code.startsWith("Z")) ||
                        (newTypeId === 4);
        if (!isMatch) {
          next.road_id = null;
          next.road_name = "";
          setRoadCodeInput("");
        }
      } else if (roadCodeInput) {
        const code = roadCodeInput.toUpperCase().replace(/[-\s]/g, "");
        const isMatch = (newTypeId === 1 && code.startsWith("N")) ||
                        (newTypeId === 2 && code.startsWith("R")) ||
                        (newTypeId === 3 && code.startsWith("Z")) ||
                        (newTypeId === 4);
        if (!isMatch) {
          setRoadCodeInput("");
        }
      }
      return next;
    });
  };

  const handleRoadCodeInput = (code) => {
    setRoadCodeInput(code);
    const clean = (code || "").trim().toUpperCase();
    const normalized = clean.replace(/[-\s]/g, "");

    // Synchronize road_type_id from prefix if typed
    let detectedTypeId = formData.road_type_id;
    if (normalized.startsWith("N")) detectedTypeId = 1;
    else if (normalized.startsWith("R")) detectedTypeId = 2;
    else if (formData.road_type_id !== 4 && normalized.startsWith("Z")) detectedTypeId = 3;

    const matched = roads.find((r) => {
      const rClean = (r.road_number || "").toUpperCase();
      const rNorm = rClean.replace(/[-\s]/g, "");
      return rClean === clean || rNorm === normalized;
    });

    if (matched) {
      setFormData((prev) => ({
        ...prev,
        road_id: matched.id,
        road_name: matched.road_name,
        road_type_id: matched.road_type_id || detectedTypeId || prev.road_type_id,
        division_id: prev.division_id || matched.division_id || prev.division_id,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        road_id: null,
        road_type_id: detectedTypeId || prev.road_type_id,
      }));
    }
  };

  const handleRoadNameInput = (name) => {
    const matched = roads.find((r) => (r.road_name || "").toLowerCase() === (name || "").trim().toLowerCase());
    if (matched) {
      setRoadCodeInput(matched.road_number);
      setFormData((prev) => ({
        ...prev,
        road_id: matched.id,
        road_name: matched.road_name,
        road_type_id: matched.road_type_id || prev.road_type_id,
        division_id: prev.division_id || matched.division_id || prev.division_id,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        road_name: name,
      }));
    }
  };

  // Chainage Helper: Parse string e.g. "Ch 194+210" or "194+210" into { km, m }
  const parseChainageValues = (str) => {
    if (!str) return { km: "", m: "" };
    const m = String(str).match(/(?:Ch(?:ainage)?)?\s*([0-9]+)\s*\+\s*([0-9]+(?:\.[0-9]+)?)/i);
    if (m) return { km: m[1], m: m[2] };
    const num = String(str).match(/^([0-9]+)(?:\.([0-9]+))?$/);
    if (num) return { km: num[1], m: num[2] || "" };
    return { km: "", m: "" };
  };

  const handleChainageChange = (newKm, newM) => {
    const kmStr = newKm !== undefined && newKm !== null ? String(newKm).trim() : "";
    const mStr = newM !== undefined && newM !== null ? String(newM).trim() : "";
    
    let composite = "";
    if (kmStr !== "" || mStr !== "") {
      const k = kmStr !== "" ? kmStr : "0";
      const m = mStr !== "" ? mStr : "000";
      composite = `Ch ${k}+${m.padStart(3, "0")}`;
    }
    
    setFormData((prev) => ({
      ...prev,
      chainage_km: kmStr !== "" ? parseFloat(kmStr) : null,
      chainage_m: mStr !== "" ? parseFloat(mStr) : null,
      location_chainage_gps_text: composite,
    }));
  };

  const handleBmsChainageChange = (newKm, newM) => {
    const kmStr = newKm !== undefined && newKm !== null ? String(newKm).trim() : "";
    const mStr = newM !== undefined && newM !== null ? String(newM).trim() : "";
    let composite = "";
    if (kmStr !== "" || mStr !== "") {
      const k = kmStr !== "" ? kmStr : "0";
      const m = mStr !== "" ? mStr : "000";
      composite = `Ch ${k}+${m.padStart(3, "0")}`;
    }
    setFormData((prev) => ({
      ...prev,
      bms_chainage: composite,
      bms_chainage_km: kmStr !== "" ? parseFloat(kmStr) : null,
      bms_chainage_m: mStr !== "" ? parseFloat(mStr) : null,
    }));
  };

  const datum = formData.reference_datum_type || "MSL";

  useEffect(() => {
    loadMasterData();
    if (acquisitionId) {
      loadRecord(acquisitionId);
    } else if (isFieldUser && currentUser?.office_division_id) {
      setFormData((prev) => ({
        ...prev,
        zone_id: currentUser.office_zone_id || prev.zone_id,
        circle_id: currentUser.office_circle_id || prev.circle_id,
        division_id: currentUser.office_division_id || prev.division_id,
      }));
    }
  }, [acquisitionId, currentUser?.office_division_id]);

  const loadMasterData = async () => {
    try {
      const [zList, rtList, rList] = await Promise.all([
        api.getZones(),
        api.getRoadTypes(),
        api.getRoads(),
      ]);
      setZones(zList);
      setRoadTypes(rtList);
      setRoads(rList);

      // Preload circle and division lists for field user jurisdiction
      if (!acquisitionId && isFieldUser) {
        if (currentUser?.office_zone_id) {
          const cList = await api.getCircles(currentUser.office_zone_id);
          setCircles(cList);
        }
        if (currentUser?.office_circle_id) {
          const dList = await api.getDivisions(currentUser.office_circle_id);
          setDivisions(dList);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadRecord = async (id) => {
    try {
      setLoading(true);
      const [record, atts] = await Promise.all([
        api.getBridge(id),
        api.getBridgeAttachments(id),
      ]);
      const parsedCh = parseChainageValues(record.location_chainage_gps_text);
      const parsedBms = parseChainageValues(record.bms_chainage);
      setFormData((prev) => ({
        ...prev,
        ...record,
        chainage_km: record.chainage_km ?? (parsedCh.km !== "" ? parseFloat(parsedCh.km) : null),
        chainage_m: record.chainage_m ?? (parsedCh.m !== "" ? parseFloat(parsedCh.m) : null),
        bms_chainage_km: parsedBms.km !== "" ? parseFloat(parsedBms.km) : null,
        bms_chainage_m: parsedBms.m !== "" ? parseFloat(parsedBms.m) : null,
      }));
      setAttachments(atts);

      // Cascade circles & divisions if zone is set
      if (record.zone_id) {
        const cList = await api.getCircles(record.zone_id);
        setCircles(cList);
      }
      if (record.circle_id) {
        const dList = await api.getDivisions(record.circle_id);
        setDivisions(dList);
      }
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleZoneChange = async (zId) => {
    setFormData((prev) => ({
      ...prev,
      zone_id: zId,
      circle_id: "",
      division_id: "",
    }));
    if (zId) {
      const cList = await api.getCircles(zId);
      setCircles(cList);
    } else {
      setCircles([]);
      setDivisions([]);
    }
  };

  const handleCircleChange = async (cId) => {
    setFormData((prev) => ({ ...prev, circle_id: cId, division_id: "" }));
    if (cId) {
      const dList = await api.getDivisions(cId);
      setDivisions(dList);
    } else {
      setDivisions([]);
    }
  };

  const handleRoadSelect = (rId) => {
    const selected = roads.find((r) => r.id === parseInt(rId));
    setFormData((prev) => ({
      ...prev,
      road_id: rId,
      road_name: selected ? selected.road_name : prev.road_name,
    }));
  };

  // Bidirectional Webmap coordinate parser helper
  const handleCoordinateAutoExtract = async (text, fieldPrefix) => {
    if (!text || text.length < 5) return;
    try {
      const res = await api.extractCoordinates(text);
      if (res.lat && res.lng) {
        if (fieldPrefix === "location") {
          setFormData((prev) => ({
            ...prev,
            location_lat_lng: res.formatted_coords,
            location_chainage_gps_text:
              prev.location_chainage_gps_text || res.chainage || "",
          }));
        } else if (fieldPrefix === "benchmark") {
          setFormData((prev) => ({
            ...prev,
            reference_benchmark_lat_lng: res.formatted_coords,
          }));
        } else if (fieldPrefix === "zero") {
          setFormData((prev) => ({
            ...prev,
            zero_chainage_lat_lng: res.formatted_coords,
          }));
        } else if (fieldPrefix === "bms") {
          setFormData((prev) => ({
            ...prev,
            bms_lat_lng: res.formatted_coords,
            bms_chainage: prev.bms_chainage || res.chainage || "",
          }));
        }
      }
    } catch (err) {
      console.warn("Coordinate extraction error:", err);
    }
  };

  // Navigational Clearance Presets
  const handleNavAuthorityChange = (auth) => {
    let v = formData.nav_vertical_clearance_m;
    let h = formData.nav_horizontal_clearance_m;
    let cls = formData.nav_clearance_class;

    if (auth === "BIWTA") {
      cls = "Class-II";
      v = 12.2;
      h = 76.22;
    } else if (auth === "Railway") {
      cls = "General";
      v = 7.25;
      h = 30.5;
    }
    setFormData((prev) => ({
      ...prev,
      nav_clearance_authority: auth,
      nav_clearance_class: cls,
      nav_vertical_clearance_m: v,
      nav_horizontal_clearance_m: h,
    }));
  };

  const handleNavClassChange = (cls) => {
    let v = formData.nav_vertical_clearance_m;
    let h = formData.nav_horizontal_clearance_m;

    if (formData.nav_clearance_authority === "BIWTA") {
      if (cls === "Class-I") {
        v = 18.3;
        h = 76.22;
      } else if (cls === "Class-II") {
        v = 12.2;
        h = 76.22;
      } else if (cls === "Class-III") {
        v = 7.62;
        h = 30.48;
      } else if (cls === "Class-IV") {
        v = 5.0;
        h = 20.0;
      }
    } else if (formData.nav_clearance_authority === "Railway") {
      if (cls === "General") {
        v = 7.25;
        h = 30.5;
      }
    }
    setFormData((prev) => ({
      ...prev,
      nav_clearance_class: cls,
      nav_vertical_clearance_m: v,
      nav_horizontal_clearance_m: h,
    }));
  };

  // Save Draft
  const handleSaveDraft = async () => {
    if (!canEditPlacement) {
      setMsg({
        type: "error",
        text: `Editing is strictly reserved for personnel inside the ${formData.division_name || 'corresponding'} division.`
      });
      return;
    }
    try {
      setSaving(true);
      setMsg(null);
      const payload = {
        ...formData,
        ...(isFieldUser ? {
          division_id: formData.division_id || currentUser?.office_division_id,
          circle_id: formData.circle_id || currentUser?.office_circle_id,
          zone_id: formData.zone_id || currentUser?.office_zone_id,
        } : {}),
      };
      let res;
      if (acquisitionId) {
        res = await api.updateBridge(acquisitionId, payload);
        setMsg({
          type: "success",
          text: `Dossier ${res.code} updated successfully!`,
        });
      } else {
        res = await api.createBridge(payload);
        setMsg({
          type: "success",
          text: `New Bridge Acquisition ${res.code} created!`,
        });
        if (onSaved) onSaved(res.id);
      }
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  // State Machine Transition
  const handleTransition = async (action, endorsementNote = "") => {
    try {
      setSaving(true);
      const res = await api.transitionBridge(acquisitionId, {
        action,
        endorsement_note:
          endorsementNote || `Transitioned by ${currentUser?.role}`,
      });
      setMsg({
        type: "success",
        text: `Dossier transitioned to [${res.to_status}]`,
      });
      loadRecord(acquisitionId);
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  // File Upload Helper with Automatic Draft Save
  const handleFileUpload = async (slotCode, file, demandType = null) => {
    if (!file) return;
    try {
      setUploadingSlot(slotCode);
      let targetId = acquisitionId;
      if (!targetId) {
        // Auto-create draft on server so user is never blocked
        const payload = {
          ...formData,
          ...(isFieldUser ? {
            division_id: formData.division_id || currentUser?.office_division_id,
            circle_id: formData.circle_id || currentUser?.office_circle_id,
            zone_id: formData.zone_id || currentUser?.office_zone_id,
          } : {}),
        };
        const created = await api.createBridge(payload);
        targetId = created.id;
        setFormData((prev) => ({
          ...prev,
          id: created.id,
          code: created.code,
        }));
        if (onSaved) onSaved(created.id);
      }
      await api.uploadBridgeAttachment(
        targetId,
        slotCode,
        file,
        demandType,
      );
      const atts = await api.getBridgeAttachments(targetId);
      setAttachments(atts);
      setMsg({ type: "success", text: `Document "${file.name}" uploaded successfully!` });
    } catch (err) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleDeleteAttachment = async (attId) => {
    try {
      await api.deleteBridgeAttachment(acquisitionId, attId);
      setAttachments(attachments.filter((a) => a.id !== attId));
    } catch (err) {
      alert(`Delete error: ${err.message}`);
    }
  };

  // Check which demand officers already have attachments (ACE, SE, EE)
  const uploadedDemandTypes = attachments
    .filter((a) => a.slot_code.startsWith("demand_letter"))
    .map((a) => a.demand_officer_type);

  const availableDemandOptions = [
    { type: "EE", label: "Attachment for Executive Engineer (EE)" },
    { type: "SE", label: "Attachment for Superintending Engineer (SE)" },
    { type: "ACE", label: "Attachment for Additional Chief Engineer (ACE)" },
  ].filter((opt) => !uploadedDemandTypes.includes(opt.type));

  const flaggedTabs = formData.flagged_sections_json
    ? JSON.parse(formData.flagged_sections_json)
    : [];

  // High-Speed Keyboard Navigation & Focus Acceleration
  const focusFirstInput = (tabId) => {
    setTimeout(() => {
      const container = document.getElementById(`panel-${tabId}`);
      if (container) {
        const firstInput = container.querySelector(
          'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])',
        );
        if (firstInput) {
          firstInput.focus();
          if (firstInput.select && typeof firstInput.select === "function") {
            firstInput.select();
          }
        }
      }
    }, 20);
  };

  const [tabDirection, setTabDirection] = useState("forward");

  useEffect(() => {
    const formPane = document.getElementById(`panel-${activeTab}`);
    if (formPane) {
      gsap.fromTo(
        formPane,
        { opacity: 0, y: 12, filter: "blur(3px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.32,
          ease: "cubic-bezier(0.16, 1, 0.3, 1)",
          clearProps: "transform,opacity,filter",
        },
      );
    }
  }, []);

  // Direction-Aware Silky Smooth Section Transitions
  const handleSelectTab = (targetTab) => {
    if (targetTab === activeTab) return;

    const curIdx = TABS.findIndex((t) => t.id === activeTab);
    const nextIdx = TABS.findIndex((t) => t.id === targetTab);
    const direction = nextIdx >= curIdx ? "forward" : "backward";
    setTabDirection(direction);

    // Crisp tactile acknowledgment on target tab button
    const tabEl = document.getElementById(`tab-${targetTab}`);
    if (tabEl) {
      gsap.killTweensOf(tabEl);
      gsap.fromTo(
        tabEl,
        { scale: 0.95 },
        { scale: 1, duration: 0.22, ease: "cubic-bezier(0.16, 1, 0.3, 1)" },
      );
    }

    setActiveTab(targetTab);
    focusFirstInput(targetTab);

    // Smooth upward slide from the bottom for incoming engineering specification section
    requestAnimationFrame(() => {
      const formPane = document.getElementById(`panel-${targetTab}`);
      if (formPane) {
        gsap.killTweensOf(formPane);
        gsap.fromTo(
          formPane,
          { opacity: 0, y: 22, x: 0, filter: "blur(4px)" },
          {
            opacity: 1,
            y: 0,
            x: 0,
            filter: "blur(0px)",
            duration: 0.28,
            ease: "cubic-bezier(0.16, 1, 0.3, 1)",
            clearProps: "transform,opacity,filter",
          },
        );
      }
    });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Direct Tab Switching via Alt + 1-6 or Alt + Left/Right
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= TABS.length) {
          e.preventDefault();
          handleSelectTab(TABS[num - 1].id);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          const curIdx = TABS.findIndex((t) => t.id === activeTab);
          const nextIdx = (curIdx + 1) % TABS.length;
          handleSelectTab(TABS[nextIdx].id);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          const curIdx = TABS.findIndex((t) => t.id === activeTab);
          const prevIdx = (curIdx - 1 + TABS.length) % TABS.length;
          handleSelectTab(TABS[prevIdx].id);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab]);

  // Enter Key Advances Focus to Next Form Field
  const handleFormKeyDown = (e) => {
    if (
      e.key === "Enter" &&
      e.target.tagName !== "TEXTAREA" &&
      e.target.type !== "submit"
    ) {
      e.preventDefault();
      const container = document.getElementById(`panel-${activeTab}`);
      if (!container) return;
      const formElements = Array.from(
        container.querySelectorAll(
          'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])',
        ),
      );
      const index = formElements.indexOf(e.target);
      if (index !== -1 && index < formElements.length - 1) {
        const next = formElements[index + 1];
        next.focus();
        if (next.select && typeof next.select === "function") {
          next.select();
        }
      }
    }
  };

  // Tab Strip Arrow Key Navigation
  const handleTabKeyNav = (e, idx) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const nextIdx = (idx + 1) % TABS.length;
      const targetTab = TABS[nextIdx].id;
      handleSelectTab(targetTab);
      document.getElementById(`tab-${targetTab}`)?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prevIdx = (idx - 1 + TABS.length) % TABS.length;
      const targetTab = TABS[prevIdx].id;
      handleSelectTab(targetTab);
      document.getElementById(`tab-${targetTab}`)?.focus();
    }
  };

  return (
    <div className="space-y-4" data-tab-direction={tabDirection}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b-2 border-slate-300 gap-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="rounded-full hover:bg-slate-100/10 hover:scale-110 text-slate-700 transition-colors cursor-pointer"
            title="Back to Registry"
          >
            <CircleChevronLeft className="w-9 h-9" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span
                className="text-xs font-bold text-blue-900 py-0.5"
                style={{ fontFamily: "var(--font-caption)" }}
              >
                {formData.code || "New Bridge Acquisition"}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Status:{" "}
                <b
                  className="text-slate-900"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {formData.workflow_status || "DRAFT_FIELD"}
                </b>
              </span>
            </div>
            <h1
              className="text-lg font-extrabold text-slate-900 mt-0.5"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {formData.bridge_name ||
                "Proposed Bridge Acquisition & Hydraulic Survey"}
            </h1>
          </div>
        </div>

        {/* Global Action Tools */}
        <div className="flex items-center space-x-2 text-xs">
          {acquisitionId && (
            <>
              <a
                href={api.getExportUrl("bridge", acquisitionId, "pdf")}
                onClick={(e) => handleExport(e, "pdf")}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xs bg-white/75 hover:bg-white border border-white/90 text-slate-800 font-semibold flex items-center space-x-1.5 transition-all shadow-xs backdrop-blur-xs cursor-pointer"
                style={{ fontFamily: "var(--font-body)" }}
                title="Download Technical Engineering Datasheet PDF"
              >
                <Download className={`w-3.5 h-3.5 text-[#112047] ${downloadingExport === "pdf" ? "animate-spin" : ""}`} />
                <span>{downloadingExport === "pdf" ? "Exporting..." : "Datasheet PDF"}</span>
              </a>
              <a
                href={api.getExportUrl("bridge", acquisitionId, "excel")}
                onClick={(e) => handleExport(e, "excel")}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xs bg-white/75 hover:bg-white border border-white/90 text-slate-800 font-semibold flex items-center space-x-1.5 transition-all shadow-xs backdrop-blur-xs cursor-pointer"
                style={{ fontFamily: "var(--font-body)" }}
                title="Download Excel Engineering Schedule"
              >
                <Download className={`w-3.5 h-3.5 text-[#087f43] ${downloadingExport === "excel" ? "animate-spin" : ""}`} />
                <span>{downloadingExport === "excel" ? "Exporting..." : "Excel Schedule"}</span>
              </a>
              <a
                href={api.getExportUrl("bridge", acquisitionId, "zip")}
                onClick={(e) => handleExport(e, "zip")}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xs bg-white/75 hover:bg-white border border-white/90 text-slate-800 font-semibold flex items-center space-x-1.5 transition-all shadow-xs backdrop-blur-xs cursor-pointer"
                style={{ fontFamily: "var(--font-body)" }}
                title="Download Complete Technical ZIP Dossier"
              >
                <Download className={`w-3.5 h-3.5 text-amber-700 ${downloadingExport === "zip" ? "animate-spin" : ""}`} />
                <span>{downloadingExport === "zip" ? "Exporting..." : "ZIP Dossier"}</span>
              </a>
            </>
          )}

          {acquisitionId && (
            <button
              type="button"
              onClick={() => setActiveTab("TAB-08")}
              className={`px-3 py-1.5 rounded-xs border text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeTab === "TAB-08"
                  ? "bg-[#112047] text-white border-[#112047]"
                  : "bg-white/75 hover:bg-white text-slate-800 border-white/90"
              }`}
            >
              <History className="w-3.5 h-3.5 text-indigo-600" />
              <span>Change History</span>
            </button>
          )}

          {canEditPlacement ? (
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="btn-festive-blue text-xs font-semibold px-4 py-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? "Saving..." : (acquisitionId ? "Update Placement" : "Save Draft")}</span>
            </button>
          ) : (
            <div
              className="text-xs px-3 py-1.5 rounded-xs bg-slate-200/90 text-slate-700 font-semibold flex items-center space-x-1.5 border border-slate-300"
              title="Editing is reserved for personnel inside the corresponding division"
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Read-Only Jurisdiction</span>
            </div>
          )}
        </div>
      </div>

      {/* Read-Only Notice if user is outside this division */}
      {/* Read-Only Notice if user is outside this division or non-field personnel */}
      {!canEditPlacement && (
        <div className="  text-amber-900 p-3 rounded-xs flex items-center justify-between text-xs font-subhead shadow-xs">
          <div className="flex items-center space-x-2">
            <Shield className="w-7 h-7 text-amber-700 shrink-0" />
            <span>
              <strong>Jurisdiction Notice:</strong> {!acquisitionId
                ? "Originating new bridge acquisition demand placements is strictly reserved for Field Division survey personnel (FIELD_SAE, FIELD_SDE, FIELD_EE). Design Division and review roles cannot originate field survey records."
                : <>Bringing edits to this demand placement is strictly reserved for field personnel inside <strong>{divisions.find((d) => d.id === Number(formData.division_id))?.name || formData.division_name || `Division #${formData.division_id}`}</strong>. Survey data is presented in frozen view-only mode.</>}
            </span>
          </div>
          {acquisitionId && (
            <button
              type="button"
              onClick={() => setActiveTab("TAB-08")}
              className="px-2.5 py-1 rounded bg-amber-200/80 hover:bg-amber-300 text-amber-900 font-bold text-[11px] cursor-pointer ml-3 shrink-0 flex items-center space-x-1"
            >
              <History className="w-3 h-3" />
              <span>View Change Logs</span>
            </button>
          )}
        </div>
      )}

      {msg && (
        <div
          className={`p-3 text-xs flex items-center justify-between border notification-banner-appear ${msg.type === "error" ? "bg-rose-50 text-rose-800 border-rose-300" : "bg-emerald-50 text-emerald-800 border-emerald-300"}`}
        >
          <span style={{ fontFamily: "var(--font-body)" }}>{msg.text}</span>
          <button
            onClick={() => setMsg(null)}
            className="font-bold ml-4 text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Red Alert Banner if Returned for Correction */}
      {formData.workflow_status === "RETURNED_FOR_CORRECTION" && (
        <div className="border border-rose-400 bg-rose-50 p-4 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <div
              className="font-bold text-rose-900 uppercase"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Returned for Correction by Bridge Design Circle
            </div>
            <p className="text-rose-800 mt-1">
              <b>Reviewer Instructions:</b>{" "}
              {formData.return_reason_notes ||
                "Please verify the highlighted sections and re-upload revised reports."}
            </p>
            {flaggedTabs.length > 0 && (
              <div
                className="mt-1 text-xs text-rose-700 font-semibold"
                style={{ fontFamily: "var(--font-caption)" }}
              >
                Flagged Sections: {flaggedTabs.join(", ")}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* 2-COLUMN WORKSPACE FRAME: LEFT FLOW & TABS + RIGHT FORM INPUTS */}
      {/* ====================================================================== */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* LEFT COLUMN: Unified Flow & Specification Navigation Side Panel */}
        <aside className="w-full lg:w-80 xl:w-88 shrink-0 lg:sticky lg:top-20 select-none">
          <UnifiedSideFlowPanel
            currentStatus={formData.workflow_status || "DRAFT_FIELD"}
            formData={formData}
            structureType="bridge"
            activeTab={activeTab}
            onSelectTab={handleSelectTab}
            onKeyDownTab={handleTabKeyNav}
            tabs={TABS}
            flaggedTabs={flaggedTabs}
            totalBoreholes={formData.total_borehole_count || 0}
            attachmentCount={attachments.length}
          />
        </aside>

        {/* RIGHT COLUMN: The Active Tab's Form Inputs Page */}
        <div className="flex-1 min-w-0 w-full" id="workspace-form-pane">
          {/* Read-Only Jurisdiction Frozen Placement Banner */}
          {!canEditPlacement && (
            <div className="p-3 rounded-xs flex items-center justify-between text-xs text-amber-700 shadow-xs mb-4">
              <div className="flex items-center space-x-2">
                <Lock className="w-5 h-5 text-amber-700 shrink-0" />
                <span>
                  <strong>Data Frozen (Read-Only Profile):</strong> {!acquisitionId
                    ? "Field survey placement origination is strictly reserved for Field Division engineers (FIELD_SAE, FIELD_SDE, FIELD_EE)."
                    : <>This demand placement belongs to <strong>{divisions.find((d) => d.id === Number(formData.division_id))?.name || formData.division_name || `Division #${formData.division_id}`}</strong>. All input controls are frozen; engineering specifications are displayed as read-only values.</>}
                </span>
              </div>
              {acquisitionId && (
                <div className="flex items-center space-x-2 shrink-0 ml-3">
                  <button
                    type="button"
                    onClick={(e) => handleExport(e, "pdf")}
                    disabled={downloadingExport === "pdf"}
                    className="px-2.5 py-1 rounded bg-amber-200/90 hover:bg-amber-300 text-amber-900 font-bold text-[11px] cursor-pointer flex items-center space-x-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>{downloadingExport === "pdf" ? "Exporting..." : "Export PDF"}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Division Engineering Inputs Fieldset (Frozen when outside division profile) */}
          <fieldset
            disabled={!canEditPlacement}
            className={`border-0 p-0 m-0 ${!canEditPlacement ? "placement-frozen" : ""}`}
          >
          {/* ====================================================================== */}
          {/* [TAB-01] DEMAND LETTERS & ROAD IDENTIFICATION */}
          {/* ====================================================================== */}
          <div
            id="panel-TAB-01"
            role="tabpanel"
            aria-labelledby="tab-TAB-01"
            className={`space-y-4 ${activeTab === "TAB-01" ? "tab-pane-active" : "hidden"}`}
            onKeyDown={handleFormKeyDown}
          >
            {/* Section: Demand Letters Upload with deduplication */}
            <div className="eng-panel">
              <div className="eng-section-header accent-blue">
                <span>
                  Official Institutional Demand Letters (ACE / SE / EE)
                </span>
                <span className="text-[10px] text-slate-500 font-semibold font-caption">
                  Auto-deduplicated
                </span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={demandOfficerType}
                    onChange={(e) => setDemandOfficerType(e.target.value)}
                    disabled={availableDemandOptions.length === 0}
                    className="p-1.5 border border-slate-300 text-xs bg-white rounded-xs"
                  >
                    {availableDemandOptions.length === 0 ? (
                      <option value="">
                        All Demand Letters Uploaded (EE, SE, ACE)
                      </option>
                    ) : (
                      availableDemandOptions.map((opt) => (
                        <option key={opt.type} value={opt.type}>
                          {opt.label}
                        </option>
                      ))
                    )}
                  </select>

                  {availableDemandOptions.length > 0 && (
                    <label className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center space-x-1 cursor-pointer rounded-xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingSlot === `demand_letter_${demandOfficerType.toLowerCase()}` ? "Uploading..." : "Upload Demand Letter"}</span>
                      <input
                        type="file"
                        onChange={(e) => {
                          if (e.target.files[0]) {
                            handleFileUpload(
                              `demand_letter_${demandOfficerType.toLowerCase()}`,
                              e.target.files[0],
                              demandOfficerType,
                            );
                            e.target.value = "";
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Uploaded Demand Letters List */}
                <div className="divide-y divide-slate-200 border border-slate-400/49 text-xs rounded-xs">
                  {attachments.filter((a) =>
                    a.slot_code.startsWith("demand_letter"),
                  ).length === 0 ? (
                    <div className="p-3 text-slate-500 text-center">
                      No demand letters uploaded yet.
                    </div>
                  ) : (
                    attachments
                      .filter((a) => a.slot_code.startsWith("demand_letter"))
                      .map((att) => (
                        <div
                          key={att.id}
                          className="p-2 flex items-center justify-between hover:bg-slate-50"
                        >
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-sky-700" />
                            <span className="font-bold text-slate-800">
                              [{att.demand_officer_type || "OFFICER"}]
                            </span>
                            <a
                              href={api.getAttachmentDownloadUrl(att.id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sky-700 hover:text-sky-900 hover:underline font-medium"
                              title="Click to view/download"
                            >
                              {att.file_name}
                            </a>
                            <span className="text-slate-400">
                              ({Math.round(att.file_size / 1024)} KB)
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <a
                              href={api.getAttachmentDownloadUrl(att.id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-0.5 text-[11px] font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded border border-sky-200"
                            >
                              View
                            </a>
                            <button
                              type="button"
                              onClick={() => handleDeleteAttachment(att.id)}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Delete attachment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>

            {/* Section: Administrative Hierarchy & Road Information */}
            <div className="eng-panel">
              <div className="eng-section-header accent-blue">
                <span>Primary Bridge Identification & Alignment</span>
                {/* <span
                  className="text-[10px] text-slate-500 font-semibold font-caption"
                >
                  Fields a.1 – 7.1
                </span> */}
              </div>

              <div className="eng-cluster">
                {/* Cluster 1: Primary Asset Landmark */}
                <div className="eng-grid-12">
                  <div className="col-span-12 md:col-span-8 eng-field">
                    <label className="eng-label eng-label-required">
                      Name of the Bridge (Structure)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Kagazpur Major Bridge"
                      value={formData.bridge_name || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          bridge_name: e.target.value,
                        })
                      }
                      className="eng-input eng-input-landmark"
                    />
                  </div>

                  <div className="col-span-12 md:col-span-4 eng-field">
                    <label className="eng-label">Proposed Bridge Type</label>
                    <input
                      type="text"
                      placeholder="e.g. PC Girder / Steel Arch"
                      value={formData.proposed_bridge_type || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          proposed_bridge_type: e.target.value,
                        })
                      }
                      className="eng-input"
                    />
                  </div>

                  <div className="col-span-12 md:col-span-8 eng-field">
                    <label className="eng-label">
                      Name of River / Channel
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Meghna Branch Canal"
                      value={formData.river_channel_name || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          river_channel_name: e.target.value,
                        })
                      }
                      className="eng-input"
                    />
                  </div>

                  {/* <div className="col-span-12 md:col-span-4 eng-field">
                    <label className="eng-label">Width of Channel</label>
                    <div className="eng-input-with-unit">
                      <input
                        type="number"
                        step="0.1"
                        placeholder="65.0"
                        value={formData.channel_width_m || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            channel_width_m: e.target.value
                              ? parseFloat(e.target.value)
                              : "",
                          })
                        }
                        className="eng-input"
                      />
                      <span className="eng-unit-badge unit-m">m</span>
                    </div> 
                  </div> */}
                </div>

                {/* Sub-Separator: Administrative Jurisdiction */}
                <div className="border-t border-slate-200 pt-3">
                  <div
                    className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center justify-between"
                    style={{ fontFamily: "var(--font-subhead)" }}
                  >
                    <span>Administrative Jurisdiction</span>
                    {isFixedJurisdiction && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs text-[11px] font-semibol text-amber-700 border border-slate-300">
                        <Lock className="w-3 h-3 text-amber-700" />
                        Fixed for Division Profile
                      </span>
                    )}
                  </div>
                  <div className="eng-grid-12">
                    <div className="col-span-12 md:col-span-4 eng-field">
                      <label className="eng-label flex items-center justify-between">
                        <span>a.1) Zone</span>
                        {isFixedJurisdiction && <Lock className="w-3 h-3 text-slate-400" />}
                      </label>
                      {isFixedJurisdiction ? (
                        <div className="eng-input bg-slate-100/80 text-slate-800 font-semibold flex items-center border-slate-200 cursor-not-allowed select-none">
                          {zones.find((z) => z.id === (formData.zone_id || currentUser?.office_zone_id))?.name ||
                            currentUser?.office_zone_name ||
                            (formData.zone_id ? `Zone #${formData.zone_id}` : "Assigned Zone")}
                        </div>
                      ) : (
                        <select
                          value={formData.zone_id || ""}
                          onChange={(e) =>
                            handleZoneChange(
                              e.target.value ? parseInt(e.target.value) : "",
                            )
                          }
                          className="eng-input"
                        >
                          <option value="">Select Zone</option>
                          {zones.map((z) => (
                            <option key={z.id} value={z.id}>
                              {z.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="col-span-12 md:col-span-4 eng-field">
                      <label className="eng-label flex items-center justify-between">
                        <span>a.2) Circle</span>
                        {isFixedJurisdiction && <Lock className="w-3 h-3 text-slate-400" />}
                      </label>
                      {isFixedJurisdiction ? (
                        <div className="eng-input bg-slate-100/80 text-slate-800 font-semibold flex items-center border-slate-200 cursor-not-allowed select-none">
                          {circles.find((c) => c.id === (formData.circle_id || currentUser?.office_circle_id))?.name ||
                            currentUser?.office_circle_name ||
                            (formData.circle_id ? `Circle #${formData.circle_id}` : "Assigned Circle")}
                        </div>
                      ) : (
                        <select
                          value={formData.circle_id || ""}
                          onChange={(e) =>
                            handleCircleChange(
                              e.target.value ? parseInt(e.target.value) : "",
                            )
                          }
                          className="eng-input"
                        >
                          <option value="">Select Circle</option>
                          {circles.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="col-span-12 md:col-span-4 eng-field">
                      <label className="eng-label flex items-center justify-between">
                        <span>a.3) Division</span>
                        {isFixedJurisdiction && <Lock className="w-3 h-3 text-slate-400" />}
                      </label>
                      {isFixedJurisdiction ? (
                        <div className="eng-input bg-slate-100/80 text-slate-800 font-semibold flex items-center border-slate-200 cursor-not-allowed select-none">
                          {divisions.find((d) => d.id === (formData.division_id || currentUser?.office_division_id))?.name ||
                            currentUser?.office_division_name ||
                            (formData.division_id ? `Division #${formData.division_id}` : "Assigned Division")}
                        </div>
                      ) : (
                        <select
                          value={formData.division_id || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              division_id: e.target.value
                                ? parseInt(e.target.value)
                                : "",
                            })
                          }
                          className="eng-input"
                        >
                          <option value="">Select Division</option>
                          {divisions.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sub-Separator: Highway & Alignment */}
                <div className="border-t border-slate-200 pt-3">
                  <div
                    className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5"
                    style={{ fontFamily: "var(--font-subhead)" }}
                  >
                    Highway Route & Spatial Chainage
                  </div>
                  <div className="eng-grid-12">
                    <div className="col-span-12 md:col-span-3 eng-field">
                      <label className="eng-label">1) Type of Road</label>
                      <select
                        value={formData.road_type_id || 1}
                        onChange={(e) => handleRoadTypeSelect(parseInt(e.target.value))}
                        className="eng-input"
                      >
                        {roadTypes.map((rt) => (
                          <option key={rt.id} value={rt.id}>
                            {rt.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {formData.road_type_id === 4 && (
                      <div className="col-span-12 md:col-span-3 eng-field">
                        <label className="eng-label">
                          1.1) Road Type Others Name
                        </label>
                        <input
                          type="text"
                          value={formData.road_type_others_name || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              road_type_others_name: e.target.value,
                            })
                          }
                          className="eng-input"
                        />
                      </div>
                    )}

                    <div className="col-span-12 md:col-span-4 eng-field">
                      <div className="flex items-center justify-between mb-1">
                        <label className="eng-label">2) Road Number / Code</label>
                        {currentRoad && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-xs bg-sky-100 text-sky-800 font-bold">
                            {currentRoad.road_type_code === 'N' ? 'National Highway' : currentRoad.road_type_code === 'R' ? 'Regional Highway' : currentRoad.road_type_code === 'Z' ? 'Zilla Road' : 'RHD'}
                          </span>
                        )}
                      </div>
                      {!canEditPlacement ? (
                        <div className="eng-input bg-slate-100/90 text-slate-800 font-bold flex items-center border-slate-200 cursor-default select-text">
                          {roadCodeInput || currentRoadNumber || (formData.road_id ? `Road #${formData.road_id}` : "—")}
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type="text"
                            list="bridge-road-codes-list"
                            placeholder={
                              formData.road_type_id === 1 ? "Select/Type National e.g. N1, N5..." :
                              formData.road_type_id === 2 ? "Select/Type Regional e.g. R140, R160..." :
                              formData.road_type_id === 3 ? "Select/Type Zilla e.g. Z1001, Z1024..." :
                              "Type Road Number / Code..."
                            }
                            value={roadCodeInput || currentRoadNumber}
                            onChange={(e) => handleRoadCodeInput(e.target.value)}
                            className="eng-input font-bold text-sky-900 uppercase"
                          />
                          <datalist id="bridge-road-codes-list">
                            {filteredRoads.map((r) => (
                              <option key={r.id} value={r.road_number}>
                                {r.road_number} — {r.road_name}
                              </option>
                            ))}
                          </datalist>
                        </div>
                      )}
                    </div>

                    <div className="col-span-12 md:col-span-8 eng-field">
                      <label className="eng-label">
                        3) Name of the Road (Auto-Filled from Official RHD GeoJSON Network)
                      </label>
                      {!canEditPlacement ? (
                        <div className="eng-input bg-slate-100/90 text-slate-800 font-semibold flex items-center border-slate-200 cursor-default select-text">
                          {formData.road_name || "—"}
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type="text"
                            list="bridge-road-names-list"
                            placeholder="Type or select official road name..."
                            value={formData.road_name || ""}
                            onChange={(e) => handleRoadNameInput(e.target.value)}
                            className="eng-input bg-slate-50 font-medium"
                          />
                          <datalist id="bridge-road-names-list">
                            {filteredRoads.map((r) => (
                              <option key={r.id} value={r.road_name}>
                                {r.road_number} — {r.road_name}
                              </option>
                            ))}
                          </datalist>
                        </div>
                      )}
                    </div>

                    <div className="col-span-12 md:col-span-4 eng-field">
                      <label className="eng-label">
                        4) Road Link with Link No
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. N1-Link-04"
                        value={formData.road_link_name_no || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            road_link_name_no: e.target.value,
                          })
                        }
                        className="eng-input"
                      />
                    </div>

                    <div className="col-span-12 md:col-span-8 eng-field">
                      <label className="eng-label">
                        5) Road Chainage (Km &amp; Meter)
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 items-center">
                        <div className="chainage chainage-km">
                          <input
                            type="number"
                            step="1"
                            min="0"
                            placeholder="e.g. 194"
                            value={formData.chainage_km !== null && formData.chainage_km !== undefined ? formData.chainage_km : (parseChainageValues(formData.location_chainage_gps_text).km)}
                            onChange={(e) => handleChainageChange(e.target.value, formData.chainage_m !== null && formData.chainage_m !== undefined ? formData.chainage_m : parseChainageValues(formData.location_chainage_gps_text).m)}
                            className="eng-input tabular-nums font-mono"
                          />
                          <span className="text-[10px] text-slate-500 font-bold uppercase block mb-0.5">Km</span>
                        </div>
                        <div className="chainage chainage-m">
                          <input
                            type="number"
                            step="1"
                            min="0"
                            max="999"
                            placeholder="e.g. 210"
                            value={formData.chainage_m !== null && formData.chainage_m !== undefined ? formData.chainage_m : (parseChainageValues(formData.location_chainage_gps_text).m)}
                            onChange={(e) => handleChainageChange(formData.chainage_km !== null && formData.chainage_km !== undefined ? formData.chainage_km : parseChainageValues(formData.location_chainage_gps_text).km, e.target.value)}
                            className="eng-input tabular-nums font-mono"
                          />
                          <span className="text-[10px] text-slate-500 font-bold uppercase block mb-0.5">m</span>
                        </div>
                        <div className="col-span-2 h-full sm:col-span-1">
                          <span className="inline-flex items-center ml-1 px-1 py-1.5 bg-blur-3xl rounded-xs border border-sky-200/25 text-sky-800 font-mono text-xs font-bold w-full justify-center">
                            {formData.location_chainage_gps_text || "Ch 0+000"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-Separator: Geodetic & Coordinate Verification */}
                <div className="border-t border-slate-200 pt-3">
                  <div
                    className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5"
                    style={{ fontFamily: "var(--font-subhead)" }}
                  >
                    Geodetic Coordinates & Webmap Link
                  </div>
                  <div className="eng-grid-12">
                    <div className="col-span-12 md:col-span-8 eng-field">
                      <label className="eng-label">
                        5.1) Webmap / Google Maps Link (Auto-Extract
                        Coordinates)
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="url"
                          placeholder="https://webmap.rhdbridge.com/?lat=23.4567&lng=90.8765 or Google Maps URL"
                          value={formData.location_google_map_link || ""}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              location_google_map_link: e.target.value,
                            });
                            handleCoordinateAutoExtract(
                              e.target.value,
                              "location",
                            );
                          }}
                          className="eng-input text-sky-800"
                        />
                        {formData.location_google_map_link && (
                          <a
                            href={formData.location_google_map_link}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 h-8 bg-slate-100 hover:bg-slate-200 border border-slate-300 flex items-center justify-center shrink-0"
                            title="Open in Webmap"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-slate-700" />
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="col-span-12 md:col-span-4 eng-field">
                      <label className="eng-label">
                        GPS Coordinates (Lat, Long)
                      </label>
                      <input
                        type="text"
                        placeholder="23.456700, 90.876500"
                        value={formData.location_lat_lng || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            location_lat_lng: e.target.value,
                          })
                        }
                        className="eng-input font-bold text-sky-900 tabular-nums"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ====================================================================== */}
          {/* [TAB-02] NAVIGATIONAL CLEARANCE & EXISTING BRIDGE */}
          {/* ====================================================================== */}
          <div
            id="panel-TAB-02"
            role="tabpanel"
            aria-labelledby="tab-TAB-02"
            className={`space-y-4 ${activeTab === "TAB-02" ? "tab-pane-active" : "hidden"}`}
            onKeyDown={handleFormKeyDown}
          >
            <div className="eng-panel">
              <div className="eng-section-header accent-blue">
                <span>Navigational Clearance Envelope</span>
                {/* <span
                  className="text-[10px] text-slate-500 font-semibold font-caption"
                >
                  Field 8
                </span> */}
              </div>
              <div className="eng-cluster">
                <div className="flex flex-wrap items-center gap-6 text-xs">
                  <span
                    className="font-bold text-slate-800"
                    style={{ fontFamily: "var(--font-ui)" }}
                  >
                    Clearance Authority:
                  </span>
                  {["BIWTA", "BWDB", "Local", "Railway", "Others"].map(
                    (auth) => (
                      <label
                        key={auth}
                        className="flex items-center space-x-1.5 cursor-pointer text-slate-700"
                      >
                        <input
                          type="radio"
                          name="nav_authority"
                          checked={formData.nav_clearance_authority === auth}
                          onChange={() => handleNavAuthorityChange(auth)}
                        />
                        <span>{auth}</span>
                      </label>
                    ),
                  )}
                </div>

                {/* Authority presets */}
                {formData.nav_clearance_authority === "BIWTA" && (
                  <div className="p-3 bg-sky-50 border border-sky-200 space-y-2">
                    <span
                      className="font-bold text-sky-900 block text-xs"
                      style={{ fontFamily: "var(--font-subhead)" }}
                    >
                      BIWTA Navigation Class Selector:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {[
                        { cls: "Class-I", v: "18.30m", h: "76.22m" },
                        { cls: "Class-II", v: "12.20m", h: "76.22m" },
                        { cls: "Class-III", v: "7.62m", h: "30.48m" },
                        { cls: "Class-IV", v: "5.00m", h: "20.00m" },
                      ].map((opt) => (
                        <button
                          key={opt.cls}
                          type="button"
                          onClick={() => handleNavClassChange(opt.cls)}
                          className={`nav-preset-btn ${formData.nav_clearance_class === opt.cls ? "active" : ""}`}
                        >
                          <div style={{ fontFamily: "var(--font-ui)" }}>
                            {opt.cls}
                          </div>
                          <div className="text-[10.5px] opacity-80 tabular-nums">
                            V: {opt.v} | H: {opt.h}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {formData.nav_clearance_authority === "Railway" && (
                  <div className="p-3 bg-white/40 border border-white/60 rounded-xl space-y-2 backdrop-blur-xs">
                    <span
                      className="font-bold text-[#112047] block text-xs"
                      style={{ fontFamily: "var(--font-subhead)" }}
                    >
                      Railway Clearance Standard:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleNavClassChange("General")}
                      className="p-2 rounded-xl bg-[#112047] hover:bg-[#112047] text-white text-xs cursor-pointer transition-all shadow-xs"
                      style={{ fontFamily: "var(--font-ui)" }}
                    >
                      Railway General Standard (V: 7.25m, H: 30.50m)
                    </button>
                  </div>
                )}

                <div className="eng-grid-12">
                  <div className="col-span-12 sm:col-span-4 eng-field">
                    <label className="eng-label">Vertical Clearance (m)</label>
                    <div className="eng-input-with-unit">
                      <input
                        type="number"
                        step="0.01"
                        value={formData.nav_vertical_clearance_m || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            nav_vertical_clearance_m: e.target.value
                              ? parseFloat(e.target.value)
                              : "",
                          })
                        }
                        className="eng-input font-bold text-sky-900"
                      />
                      <span className="eng-unit-badge unit-m">m</span>
                    </div>
                  </div>

                  <div className="col-span-12 sm:col-span-4 eng-field">
                    <label className="eng-label">
                      Horizontal Clearance (m)
                    </label>
                    <div className="eng-input-with-unit">
                      <input
                        type="number"
                        step="0.01"
                        value={formData.nav_horizontal_clearance_m || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            nav_horizontal_clearance_m: e.target.value
                              ? parseFloat(e.target.value)
                              : "",
                          })
                        }
                        className="eng-input font-bold text-sky-900"
                      />
                      <span className="eng-unit-badge unit-m">m</span>
                    </div>
                  </div>

                  <div className="col-span-12 sm:col-span-4 eng-field">
                    <label className="eng-label">
                      Navigational Remarks / Notes
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. As per BIWTA circular #..."
                      value={formData.nav_others_note || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          nav_others_note: e.target.value,
                        })
                      }
                      className="eng-input"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Existing Bridge Information & Benchmark Datum */}
            <div className="eng-panel">
              <div className="eng-section-header accent-blue">
                <span>Existing Structure Geometry & Benchmark Datum</span>
                <span
                  className="font-caption font-size-10 font-bold text-[#112047]"
                >
                  Datum: in m {datum}
                </span>
              </div>

              <div className="eng-cluster">
                <div className="eng-grid-12">
                  <div className="col-span-12 md:col-span-4 eng-field">
                    <label className="eng-label">
                      9.1) Length of Existing Bridge
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 45.0m"
                      value={formData.existing_bridge_length || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          existing_bridge_length: e.target.value,
                        })
                      }
                      className="eng-input tabular-nums"
                    />
                  </div>

                  <div className="col-span-12 md:col-span-4 eng-field">
                    <label className="eng-label">
                      9.2) Existing Span Arrangement
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 15m + 15m + 15m"
                      value={formData.existing_span_arrangement || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          existing_span_arrangement: e.target.value,
                        })
                      }
                      className="eng-input tabular-nums"
                    />
                  </div>

                  {/* Reference Datum Selector */}
                  <div className="col-span-12 md:col-span-4 eng-field">
                    <label className="eng-label font-bold text-sky-900">
                      20) Reference Benchmark / Datum Type
                    </label>
                    <select
                      value={formData.reference_datum_type || "MSL"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          reference_datum_type: e.target.value,
                        })
                      }
                      className="eng-input font-bold text-amber-900 bg-amber-50 border-amber-300"
                    >
                      <option value="MSL">MSL (Mean Sea Level)</option>
                      <option value="mPWD">PWD (Public Works Datum)</option>
                      <option value="SOB">SOB (Survey of Bangladesh)</option>
                      <option value="BIWTA">
                        BIWTA (Inland Water Transport Datum)
                      </option>
                      <option value="BWDB">
                        BWDB (Water Development Board)
                      </option>
                      <option value="Local">Local Temporary BM</option>
                      <option value="TBM">TBM</option>
                    </select>
                  </div>

                  <div className="col-span-12 md:col-span-8 eng-field">
                    <label className="eng-label">
                      20.1) Benchmark Location Description
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. BM marked on East Abutment of Existing Bridge (Ch 194+200)"
                      value={formData.reference_benchmark_location || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          reference_benchmark_location: e.target.value,
                        })
                      }
                      className="eng-input font-medium"
                    />
                  </div>

                  <div className="col-span-12 md:col-span-4 eng-field">
                    <label className="eng-label">
                      20.2) Benchmark GPS (Lat, Long)
                    </label>
                    <input
                      type="text"
                      placeholder="23.456650, 90.876480"
                      value={formData.reference_benchmark_lat_lng || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          reference_benchmark_lat_lng: e.target.value,
                        })
                      }
                      className="eng-input tabular-nums"
                    />
                  </div>

                  <div className="col-span-12 md:col-span-4 eng-field">
                    <label className="eng-label">
                      10) Mid-Span Girder Bottom R.L. (Existing)
                    </label>
                    <div className="eng-input-with-unit">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="8.45"
                        value={
                          formData.existing_mid_span_girder_bottom_rl || ""
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            existing_mid_span_girder_bottom_rl: e.target.value
                              ? parseFloat(e.target.value)
                              : "",
                          })
                        }
                        className="eng-input font-bold tabular-nums"
                      />
                      <span className="eng-unit-badge unit-water">
                        m {datum}
                      </span>
                    </div>
                  </div>

                  <div className="col-span-12 md:col-span-4 eng-field">
                    <label className="eng-label">
                      11) Existing Foundation Type
                    </label>
                    <select
                      value={formData.existing_foundation_type || "Pile"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          existing_foundation_type: e.target.value,
                        })
                      }
                      className="eng-input"
                    >
                      <option value="Open Foundation">Open Foundation</option>
                      <option value="Pile">Pile</option>
                      <option value="Well">Well</option>
                      <option value="Shal Balli">Shal Balli</option>
                      <option value="Others">Others</option>
                      <option value="Not Applicable">Not Applicable</option>
                    </select>
                  </div>

                  <div className="col-span-12 md:col-span-4 eng-field">
                    <label className="eng-label">
                      12) Foundation Layout & Utilities
                    </label>
                    <select
                      value={
                        formData.has_existing_foundation_utility_layout || "No"
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          has_existing_foundation_utility_layout:
                            e.target.value,
                        })
                      }
                      className="eng-input"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes (Attachment Required)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ====================================================================== */}
          {/* [TAB-03] HYDROLOGICAL, TIDAL & APPROACH SURVEY DATA */}
          {/* ====================================================================== */}
          <div
            id="panel-TAB-03"
            role="tabpanel"
            aria-labelledby="tab-TAB-03"
            className={`space-y-4 ${activeTab === "TAB-03" ? "tab-pane-active" : "hidden"}`}
            onKeyDown={handleFormKeyDown}
          >
            <div className="eng-panel">
              <div className="eng-section-header accent-blue">
                <span>Hydrological & Tidal Survey Water Levels</span>
                <span className="font-caption font-size-10 font-bold text-[#112047]">
                  Datum: in m {datum}
                </span>
              </div>
              <div className="p-7 grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    13) Highest Flood Level (HFL)
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="7.80"
                      value={formData.highest_flood_level_hfl || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          highest_flood_level_hfl: e.target.value
                            ? parseFloat(e.target.value)
                            : "",
                        })
                      }
                      className="eng-input font-bold text-sky-800"
                    />
                    <span className="ml-2 text-slate-500 whitespace-nowrap">
                      in m {datum}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    14) Standard High Water Level (SHWL)
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="6.90"
                      value={formData.standard_high_water_level_shwl || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          standard_high_water_level_shwl: e.target.value
                            ? parseFloat(e.target.value)
                            : "",
                        })
                      }
                      className="eng-input font-bold text-sky-800"
                    />
                    <span className="ml-2 text-slate-500 whitespace-nowrap">
                      in m {datum}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    15) Lowest Water Level (LWL)
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="2.10"
                      value={formData.lowest_water_level_lwl || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          lowest_water_level_lwl: e.target.value
                            ? parseFloat(e.target.value)
                            : "",
                        })
                      }
                      className="eng-input font-bold text-sky-800"
                    />
                    <span className="ml-2 text-slate-500 whitespace-nowrap">
                      in m {datum}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    15.1) Highest Tide Level (HTL)
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="6.50"
                      value={formData.highest_tide_level_htl || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          highest_tide_level_htl: e.target.value
                            ? parseFloat(e.target.value)
                            : "",
                        })
                      }
                      className="eng-input"
                    />
                    <span className="ml-2 text-slate-500 whitespace-nowrap">
                      in m {datum}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    15.2) Lowest Tide Level (LTL)
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="2.30"
                      value={formData.lowest_tide_level_ltl || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          lowest_tide_level_ltl: e.target.value
                            ? parseFloat(e.target.value)
                            : "",
                        })
                      }
                      className="eng-input"
                    />
                    <span className="ml-2 text-slate-500 whitespace-nowrap">
                      in m {datum}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    16) Water Level at Time of Survey
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="4.20"
                      value={formData.survey_time_water_level || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          survey_time_water_level: e.target.value
                            ? parseFloat(e.target.value)
                            : "",
                        })
                      }
                      className="eng-input"
                    />
                    <span className="ml-2 text-slate-500 whitespace-nowrap">
                      in m {datum}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    17) Survey Date (DD/MM/YYYY)
                  </label>
                  <input
                    type="text"
                    placeholder="15/10/2026"
                    value={formData.survey_date || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, survey_date: e.target.value })
                    }
                    className="eng-input"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    18) Type of River/Channel
                  </label>
                  <select
                    value={formData.river_tidal_type || "Not Tidal"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        river_tidal_type: e.target.value,
                      })
                    }
                    className="eng-input bg-white tabular-nums font-semibold"
                  >
                    <option value="Not Tidal">Not Tidal</option>
                    <option value="Tidal">
                      Tidal (Reveals Seasonal Levels)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    19) Direction of Stream Flow
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. North to South (Downstream)"
                    value={formData.stream_flow_direction || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stream_flow_direction: e.target.value,
                      })
                    }
                    className="eng-input"
                  />
                </div>

                {/* Conditional Seasonal Tidal Levels */}
                {formData.river_tidal_type === "Tidal" && (
                  <div className="md:col-span-3 p-3 bg-amber-50 border border-amber-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-amber-900 mb-1">
                        18.a) Dry Season HTL
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="4.50"
                        value={formData.tidal_dry_season_htl || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            tidal_dry_season_htl: e.target.value
                              ? parseFloat(e.target.value)
                              : "",
                          })
                        }
                        className="eng-input"
                      />
                    </div>
                    <div>
                      <label className="block text-amber-900 mb-1">
                        18.a) Dry Season LTL
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="1.80"
                        value={formData.tidal_dry_season_ltl || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            tidal_dry_season_ltl: e.target.value
                              ? parseFloat(e.target.value)
                              : "",
                          })
                        }
                        className="eng-input "
                      />
                    </div>
                    <div>
                      <label className="block  text-amber-900 mb-1">
                        18.b) Rainy Season HTL
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="6.50"
                        value={formData.tidal_rainy_season_htl || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            tidal_rainy_season_htl: e.target.value
                              ? parseFloat(e.target.value)
                              : "",
                          })
                        }
                        className="eng-input "
                      />
                    </div>
                    <div>
                      <label className="block  text-amber-900 mb-1">
                        18.b) Rainy Season LTL
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="2.30"
                        value={formData.tidal_rainy_season_ltl || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            tidal_rainy_season_ltl: e.target.value
                              ? parseFloat(e.target.value)
                              : "",
                          })
                        }
                        className="eng-input "
                      />
                    </div>
                  </div>
                )}

                
              </div>
            </div>
          </div>

          {/* ====================================================================== */}
          {/* [TAB-04] PROPOSED BRIDGE DESIGN & ANCILLARY WORKS */}
          {/* ====================================================================== */}
          <div
            id="panel-TAB-04"
            role="tabpanel"
            aria-labelledby="tab-TAB-04"
            className={`space-y-4 ${activeTab === "TAB-04" ? "tab-pane-active" : "hidden"}`}
            onKeyDown={handleFormKeyDown}
          >
            <div className="eng-panel">
              <div className="eng-section-header accent-blue">
                <span>
                  Proposed Bridge Structural Geometry & Ancillary Works
                </span>
                <span className="font-caption text-xs font-bold text-[#112047]">
                  Datum: in m {datum}
                </span>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    24) Proposed Alignment of Bridge
                  </label>
                  <select
                    value={formData.proposed_alignment || "New Alignment"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        proposed_alignment: e.target.value,
                      })
                    }
                    className="eng-input bg-white font-semibold"
                  >
                    <option value="New Alignment">New Alignment</option>
                    <option value="For Existing Bridge">For Existing Bridge</option>
                  </select>
                </div>

                {formData.proposed_alignment ==="New Alignment"}
                {formData.proposed_alignment === "For Existing Bridge" && (
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">
                      24.a) Offset for Existing Bridge
                    </label>
                    <select
                      value={
                        formData.proposed_existing_alignment_offset ||
                        "At the same alignment"
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          proposed_existing_alignment_offset: e.target.value,
                        })
                      }
                      className="borelog-input bg-white tabular-nums"
                    >
                      <option value="At the same alignment">
                        At the same alignment
                      </option>
                      <option value="Upstream">Upstream</option>
                      <option value="Downstream">Downstream</option>
                    </select>
                  </div>
                )}


                {/* <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    27) Electrification Work Required?
                  </label>
                  <select
                    value={formData.electrification_work_required || "No"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        electrification_work_required: e.target.value,
                      })
                    }
                    className="borelog-input bg-white tabular-nums"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div> */}

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    28) Proposed Length of Bridge (m)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="65.0"
                    value={formData.proposed_bridge_length_m || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        proposed_bridge_length_m: e.target.value
                          ? parseFloat(e.target.value)
                          : "",
                      })
                    }
                    className="eng-input font-bold text-sky-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    29) Proposed Span Arrangement (m)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 20 + 2x25m + 20"
                    value={formData.proposed_span_arrangement_m || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        proposed_span_arrangement_m: e.target.value,
                      })
                    }
                    className="eng-input font-bold text-sky-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    30) Mid-Span Bottom R.L. (Proposed)
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="10.20"
                      value={formData.proposed_mid_span_bottom_rl || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          proposed_mid_span_bottom_rl: e.target.value
                            ? parseFloat(e.target.value)
                            : "",
                        })
                      }
                      className="eng-input font-bold text-sky-800"
                    />
                    <span className="ml-2 font-mono text-slate-500 whitespace-nowrap">
                      in m {datum}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Requirement of Protective Work
                  </label>
                  {/* <input
                    type="text"
                    placeholder="e.g. Fender piles & stone pitching"
                    value={formData.pier_protective_work_required || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pier_protective_work_required: e.target.value,
                      })
                    }
                    className="eng-input"
                  /> */}
                  <select
                    value={formData.proposed_alignment || "None"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        proposed_alignment: e.target.value,
                      })
                    }
                    className="borelog-input bg-white tabular-nums font-semibold"
                  >
                    <option value="None">None</option>
                    <option value="For Abutment">For Abutment</option>
                    <option value="For Pier">For Pier</option>
                    <option value="For Both">For Both</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Max Height of Approach Road (m)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 3.5m"
                    value={formData.proposed_max_height_approach_road || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        proposed_max_height_approach_road: e.target.value,
                      })
                    }
                    className="eng-input"
                  />
                </div>

                {/* <div className="md:col-span-2">
                  <label className="block text-slate-700 font-medium mb-1">
                    Ancillary Works (Electrification, Bank Protection)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bank revetment 50m U/S & D/S, Solar street lighting"
                    value={formData.ancillary_work_required || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ancillary_work_required: e.target.value,
                      })
                    }
                    className="borelog-input"
                  />
                </div> */}
{/* 
                <div className="md:col-span-3">
                  <label className="block text-slate-700 font-medium mb-1">
                    General Technical Remarks
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Provide technical notes or field design considerations..."
                    value={formData.remarks || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, remarks: e.target.value })
                    }
                    className="eng-input leading-relaxed"
                  />
                </div>
*/}


                {/* BMS Chainage & GPS */}
                {/* <div className="md:col-span-3 border-t border-slate-200 pt-3">
                  <span className="font-mono font-bold text-slate-800 uppercase block mb-2">
                    Bridge Management System (BMS) Verification Coordinates
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">
                        BMS Chainage (Km &amp; Meter)
                      </label>
                      <div className="grid grid-cols-2 gap-1.5 items-center">
                        <div className="chainage chainage-km">
                          <input
                            type="number"
                            step="1"
                            min="0"
                            placeholder="e.g. 194"
                            value={formData.bms_chainage_km !== null && formData.bms_chainage_km !== undefined ? formData.bms_chainage_km : parseChainageValues(formData.bms_chainage).km}
                            onChange={(e) => handleBmsChainageChange(e.target.value, formData.bms_chainage_m !== null && formData.bms_chainage_m !== undefined ? formData.bms_chainage_m : parseChainageValues(formData.bms_chainage).m)}
                            className="eng-input font-mono"
                          />
                          <span className="text-[10px] text-slate-500 font-bold uppercase block mb-0.5">Km</span>
                        </div>
                        <div className="chainage chainage-m">
                          <input
                            type="number"
                            step="1"
                            min="0"
                            max="999"
                            placeholder="e.g. 210"
                            value={formData.bms_chainage_m !== null && formData.bms_chainage_m !== undefined ? formData.bms_chainage_m : parseChainageValues(formData.bms_chainage).m}
                            onChange={(e) => handleBmsChainageChange(formData.bms_chainage_km !== null && formData.bms_chainage_km !== undefined ? formData.bms_chainage_km : parseChainageValues(formData.bms_chainage).km, e.target.value)}
                            className="eng-input"
                          />
                          <span className="text-[10px] text-slate-500 font-bold uppercase block mb-0.5">Meter</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-600 block mt-1">
                        Formatted: <strong>{formData.bms_chainage || "Ch 0+000"}</strong>
                      </span>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">
                        BMS Google Map / Webmap Link
                      </label>
                      <input
                        type="url"
                        placeholder="https://webmap.rhdbridge.com/?lat=..."
                        value={formData.bms_google_map_link || ""}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            bms_google_map_link: e.target.value,
                          });
                          handleCoordinateAutoExtract(e.target.value, "bms");
                        }}
                        className="eng-input text-sky-800"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">
                        BMS Coordinates (Lat, Long)
                      </label>
                      <input
                        type="text"
                        placeholder="23.456700, 90.876500"
                        value={formData.bms_lat_lng || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bms_lat_lng: e.target.value,
                          })
                        }
                        className="eng-input font-bold"
                      />
                    </div>
                  </div>
                </div>
                 */}
              </div>
            </div>
          </div>


          {/* ====================================================================== */}
          {/* [TAB-05] DRAWINGS, REPORTS & SITE PHOTOS */}
          {/* ====================================================================== */}
          <div
            id="panel-TAB-05"
            role="tabpanel"
            aria-labelledby="tab-TAB-05"
            className={`space-y-4 ${activeTab === "TAB-05" ? "tab-pane-active" : "hidden"}`}
            onKeyDown={handleFormKeyDown}
          >
            <div className="eng-panel">
              <div className="eng-section-header accent-blue">
                <span>Engineering Reports & Survey Cross-Section Drawings</span>
              </div>
              <div className="p-7 grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                {/* Field 23: Soil report with sign/seal */}
                <div className="p-3.5 rounded-xs space-y-2">
                  <div className="font-bold text-[#112047]">
                    23) Soil Investigation Report (Signed &amp; Sealed by EE)
                  </div>
                  {canEditPlacement && (
                    <label className="px-3 py-1.5 rounded-xs bg-[#112047] hover:bg-[#112047] text-white text-xs font-semibold inline-flex items-center space-x-1.5 cursor-pointer shadow-xs transition-all">
                      <Upload className="w-3.5 h-3.5 text-cyan-300" />
                      <span>{uploadingSlot === "soil_report" ? "Uploading..." : "Upload Soil Report PDF"}</span>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => {
                          if (e.target.files[0]) {
                            handleFileUpload("soil_report", e.target.files[0]);
                            e.target.value = "";
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                  <div className="space-y-1 text-[11px]">
                    {attachments.filter((a) => a.slot_code === "soil_report").length === 0 && (
                      <div className="text-[11px] text-slate-500 italic py-1">No soil report document attached.</div>
                    )}
                    {attachments
                      .filter((a) => a.slot_code === "soil_report")
                      .map((a) => (
                        <div
                          key={a.id}
                          className="flex justify-between items-center text-slate-800 bg-white/60 backdrop-blur-xs p-1.5 rounded-lg border border-white/80"
                        >
                          <a
                            href={api.getAttachmentDownloadUrl(a.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate max-w-[200px] text-sky-700 hover:underline font-medium"
                            title="Click to view/download"
                          >
                            {a.file_name}
                          </a>
                          <div className="flex items-center space-x-1.5">
                            <a
                              href={api.getAttachmentDownloadUrl(a.id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-1.5 py-0.5 text-[10px] text-sky-700 bg-sky-50 rounded border border-sky-200"
                            >
                              View
                            </a>
                            {canEditPlacement && (
                              <button
                                onClick={() => handleDeleteAttachment(a.id)}
                                className="text-red-600 font-bold hover:text-red-800 cursor-pointer"
                                title="Delete attachment"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Field 25: Site Plan */}
                <div className="p-3.5 rounded-xs space-y-2">
                  <div className="font-bold text-[#112047]">
                    25) Site Plan of Proposed Bridge (Hat-Bazar, Town, GPS)
                  </div>
                  {canEditPlacement && (
                    <label className="px-3 py-1.5 rounded-xs bg-[#112047] hover:bg-[#112047] text-white text-xs font-semibold inline-flex items-center space-x-1.5 cursor-pointer shadow-xs transition-all">
                      <Upload className="w-3.5 h-3.5 text-cyan-300" />
                      <span>{uploadingSlot === "site_plan" ? "Uploading..." : "Upload Site Plan Drawing"}</span>
                      <input
                        type="file"
                        accept=".pdf,.dwg,.dxf,.png,.jpg,.jpeg"
                        onChange={(e) => {
                          if (e.target.files[0]) {
                            handleFileUpload("site_plan", e.target.files[0]);
                            e.target.value = "";
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                  <div className="space-y-1 text-[11px]">
                    {attachments.filter((a) => a.slot_code === "site_plan").length === 0 && (
                      <div className="text-[11px] text-slate-500 italic py-1">No site plan drawing attached.</div>
                    )}
                    {attachments
                      .filter((a) => a.slot_code === "site_plan")
                      .map((a) => (
                        <div
                          key={a.id}
                          className="flex justify-between items-center text-slate-800 bg-white/60 backdrop-blur-xs p-1.5 rounded-lg border border-white/80"
                        >
                          <a
                            href={api.getAttachmentDownloadUrl(a.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate max-w-[200px] text-sky-700 hover:underline font-medium"
                            title="Click to view/download"
                          >
                            {a.file_name}
                          </a>
                          <div className="flex items-center space-x-1.5">
                            <a
                              href={api.getAttachmentDownloadUrl(a.id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-1.5 py-0.5 text-[10px] text-sky-700 bg-sky-50 rounded border border-sky-200"
                            >
                              View
                            </a>
                            {canEditPlacement && (
                              <button
                                onClick={() => handleDeleteAttachment(a.id)}
                                className="text-red-600 font-bold hover:text-red-800 cursor-pointer"
                                title="Delete attachment"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Field 26: Cross Sections */}
                <div className="p-3.5 rounded-xs space-y-2">
                  <div className="font-bold text-[#112047]">
                    26) Cross-Sections (&gt;= 3 Sections: CL, 10m U/S, 10m D/S)
                  </div>
                  {canEditPlacement && (
                    <label className="px-3 py-1.5 rounded-xs bg-[#112047] hover:bg-[#112047] text-white text-xs font-semibold inline-flex items-center space-x-1.5 cursor-pointer shadow-xs transition-all">
                      <Upload className="w-3.5 h-3.5 text-cyan-300" />
                      <span>{uploadingSlot === "cross_section" ? "Uploading..." : "Upload Cross-Sections"}</span>
                      <input
                        type="file"
                        accept=".pdf,.dwg,.dxf,.png,.jpg,.jpeg"
                        onChange={(e) => {
                          if (e.target.files[0]) {
                            handleFileUpload("cross_section", e.target.files[0]);
                            e.target.value = "";
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                  <div className="space-y-1 text-[11px]">
                    {attachments.filter((a) => a.slot_code === "cross_section").length === 0 && (
                      <div className="text-[11px] text-slate-500 italic py-1">No cross-section survey attached.</div>
                    )}
                    {attachments
                      .filter((a) => a.slot_code === "cross_section")
                      .map((a) => (
                        <div
                          key={a.id}
                          className="flex justify-between items-center text-slate-800 bg-white/60 backdrop-blur-xs p-1.5 rounded-lg border border-white/80"
                        >
                          <a
                            href={api.getAttachmentDownloadUrl(a.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate max-w-[200px] text-sky-700 hover:underline font-medium"
                            title="Click to view/download"
                          >
                            {a.file_name}
                          </a>
                          <div className="flex items-center space-x-1.5">
                            <a
                              href={api.getAttachmentDownloadUrl(a.id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-1.5 py-0.5 text-[10px] text-sky-700 bg-sky-50 rounded border border-sky-200"
                            >
                              View
                            </a>
                            {canEditPlacement && (
                              <button
                                onClick={() => handleDeleteAttachment(a.id)}
                                className="text-red-600 font-bold hover:text-red-800 cursor-pointer"
                                title="Delete attachment"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Field 31: Hydro-Morphological Report */}
                <div className="p-3.5 rounded-xs space-y-2">
                  <div className="font-bold text-[#112047]">
                    31) Hydro-Morphological Study Report
                  </div>
                  {canEditPlacement && (
                    <label className="px-3 py-1.5 rounded-xs bg-[#112047] hover:bg-[#112047] text-white text-xs font-semibold inline-flex items-center space-x-1.5 cursor-pointer shadow-xs transition-all">
                      <Upload className="w-3.5 h-3.5 text-cyan-300" />
                      <span>{uploadingSlot === "hydro_morphological" ? "Uploading..." : "Upload Hydro Study"}</span>
                      <input
                        type="file"
                        accept=".pdf,.docx,.doc"
                        onChange={(e) => {
                          if (e.target.files[0]) {
                            handleFileUpload("hydro_morphological", e.target.files[0]);
                            e.target.value = "";
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                  <div className="space-y-1 text-[11px]">
                    {attachments.filter((a) => a.slot_code === "hydro_morphological").length === 0 && (
                      <div className="text-[11px] text-slate-500 italic py-1">No hydro study document attached.</div>
                    )}
                    {attachments
                      .filter((a) => a.slot_code === "hydro_morphological")
                      .map((a) => (
                        <div
                          key={a.id}
                          className="flex justify-between items-center text-slate-800 bg-white/60 backdrop-blur-xs p-1.5 rounded-lg border border-white/80"
                        >
                          <a
                            href={api.getAttachmentDownloadUrl(a.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate max-w-[200px] text-sky-700 hover:underline font-medium"
                            title="Click to view/download"
                          >
                            {a.file_name}
                          </a>
                          <div className="flex items-center space-x-1.5">
                            <a
                              href={api.getAttachmentDownloadUrl(a.id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-1.5 py-0.5 text-[10px] text-sky-700 bg-sky-50 rounded border border-sky-200"
                            >
                              View
                            </a>
                            {canEditPlacement && (
                              <button
                                onClick={() => handleDeleteAttachment(a.id)}
                                className="text-red-600 font-bold hover:text-red-800 cursor-pointer"
                                title="Delete attachment"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Directional Site Photos (East, West, North, South) */}
            <div className="eng-panel">
              <div className="eng-section-header accent-blue">
                <span>
                  Directional Site Location Photographs (East, West, North,
                  South)
                </span>
              </div>
              <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                {["east", "west", "north", "south"].map((dir) => (
                  <div
                    key={dir}
                    className="p-3 rounded-xs text-center space-y-2 "
                  >
                    <span className=" font-bold uppercase text-[#112047] block">
                      {dir} Side View
                    </span>
                    {canEditPlacement && (
                      <label className="w-full py-1.5 rounded-xs bg-transparent hover:bg-slate-200 text-[#112047]  text-[11px] font-semibold border border-slate-500 block cursor-pointer transition-all shadow-xs">
                        <span>Select Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            e.target.files[0] &&
                            handleFileUpload(
                              `site_photo_${dir}`,
                              e.target.files[0],
                            )
                          }
                          className="hidden"
                        />
                      </label>
                    )}
                    {attachments.find(
                      (a) => a.slot_code === `site_photo_${dir}`,
                    ) ? (
                      <div className="text-emerald-700  text-[10px] font-bold bg-emerald-100/80 rounded-md py-0.5 border border-emerald-300">
                        Image Attached ✓
                      </div>
                    ) : (
                      <div className="text-slate-500  text-[10px]">
                        No file attached
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ====================================================================== */}
          {/* [TAB-06] WEBMAP GIS & BORELOG FORM */}
          {/* ====================================================================== */}
          <div
            id="panel-TAB-06"
            role="tabpanel"
            aria-labelledby="tab-TAB-06"
            className={activeTab === "TAB-06" ? "tab-pane-active" : "hidden"}
          >
            <RhdWebmapBorelogForm
              structureCode={formData.code}
              acquisitionType="BRIDGE"
              acquisitionId={acquisitionId}
              totalBoreholes={formData.total_borehole_count}
              readOnly={!canEditPlacement}
              onBoreholeCountChange={(count) =>
                setFormData({ ...formData, total_borehole_count: count })
              }
            />
          </div>
          </fieldset>

          {/* TAB-07: Prepared Design Deliverables Package */}
          <div
            id="panel-TAB-07"
            role="tabpanel"
            aria-labelledby="tab-TAB-07"
            tabIndex={0}
            className={`space-y-6 focus:outline-none ${
              activeTab === "TAB-07" ? "tab-pane-active" : "hidden"
            }`}
          >
            <PreparedDesignPackageCard
              formData={formData}
              setFormData={setFormData}
              attachments={attachments}
              onUpload={handleFileUpload}
              onDeleteAttachment={handleDeleteAttachment}
              uploadingSlot={uploadingSlot}
              currentUser={currentUser}
              structureType="bridge"
              onTransition={handleTransition}
              vestedDivisionName={formData.assigned_bdd_division_name}
            />
          </div>

          {/* TAB-08: Audit & Change History */}
          <div
            id="panel-TAB-08"
            role="tabpanel"
            aria-labelledby="tab-TAB-08"
            tabIndex={0}
            className={`space-y-6 focus:outline-none ${
              activeTab === "TAB-08" ? "tab-pane-active" : "hidden"
            }`}
          >
            <DemandPlacementAuditLog
              acquisitionType="BRIDGE"
              acquisitionId={acquisitionId}
            />
          </div>

          {/* Persistent Bottom Command Strip */}
          <div className="sticky bottom-2 z-30 glass-panel border border-white/80 p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xl backdrop-blur-md rounded-xl mb-2">
            <div className="flex items-center space-x-3 text-xs font-mono">
              <span className="text-slate-600 font-semibold">
                Active Datum:
              </span>
              <span className="px-2.5 py-1 bg-white/60 rounded-xs text-[#112047] font-bold border border-slate-300">
                R.L. in {datum}
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-600 font-semibold">
                Current Stage:
              </span>
              <span className="px-2.5 py-1 bg-[#112047] text-sky-200 rounded-xs font-bold">
                {formData.workflow_status || "DRAFT_FIELD"}
              </span>
            </div>

            {/* Dynamic Role Actions */}
            <div className="flex items-center space-x-2 font-mono text-xs flex-wrap">
              {/* Field SAE / SDE / EE Action */}
              {["DRAFT_FIELD", "RETURNED_FOR_CORRECTION"].includes(
                formData.workflow_status,
              ) && (
                <button
                  type="button"
                  onClick={() =>
                    handleTransition(
                      "FORWARD_TO_EE",
                      "Submitted by Field Officer to Executive Engineer for Authorization",
                    )
                  }
                  className="px-4 py-2 rounded-xl bg-[#1c508c] hover:bg-[#112047] text-white font-bold flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>SUBMIT TO FIELD EE FOR AUTH</span>
                </button>
              )}

              {/* Field EE Authorization & Customary Pass */}
              {formData.workflow_status === "PENDING_FIELD_EE_AUTH" &&
                ["FIELD_EE", "SUPREME"].includes(currentUser?.role) && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowReturnModal(true)}
                      className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>RETURN FOR CORRECTION</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleTransition(
                          "PASS_TO_FIELD_SDE",
                          "Transferred by Field EE to Field SDE for customary verification",
                        )
                      }
                      className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>PASS TO FIELD SDE (CUSTOMARY)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleTransition(
                          "TRANSMIT_TO_DESIGN_EE",
                          "Authorized by Field Division EE and transmitted directly to Bridge Design Division EE",
                        )
                      }
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>TRANSMIT TO BRIDGE DESIGN DIVISION EE</span>
                    </button>
                  </>
                )}

              {/* Field SDE Customary Verification */}
              {formData.workflow_status === "PASS_TO_FIELD_SDE" &&
                ["FIELD_SDE", "FIELD_EE", "SUPREME"].includes(currentUser?.role) && (
                  <>
                    {["FIELD_EE", "SUPREME"].includes(currentUser?.role) && (
                      <button
                        type="button"
                        onClick={() => setShowReturnModal(true)}
                        className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>RETURN FOR CORRECTION</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        handleTransition(
                          "SDE_VERIFY_TO_EE",
                          "Verified by Field SDE and returned to Field EE",
                        )
                      }
                      className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>VERIFY & RETURN TO FIELD EE</span>
                    </button>

                    {["FIELD_EE", "SUPREME"].includes(currentUser?.role) && (
                      <button
                        type="button"
                        onClick={() =>
                          handleTransition(
                            "TRANSMIT_TO_DESIGN_EE",
                            "Transmitted directly to Bridge Design Division EE",
                          )
                        }
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>TRANSMIT TO BRIDGE DESIGN EE</span>
                      </button>
                    )}
                  </>
                )}

              {/* Bridge Design Division EE Assignment to BDD SDE */}
              {["TRANSMITTED_TO_BDD_EE", "ASSIGNED_TO_BDD_EE", "FORWARDED_TO_BDC_SE"].includes(
                formData.workflow_status,
              ) &&
                ["BDD_EE", "SUPREME"].includes(currentUser?.role) && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowReturnModal(true)}
                      className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>RETURN FOR CORRECTION</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleTransition(
                          "ASSIGN_TO_BDD_SDE",
                          "Assigned by BDD EE to Bridge Design SDE for modeling & deliverables",
                        )
                      }
                      className="px-4 py-2 rounded-xl bg-[#112047] hover:bg-[#112047] text-white font-bold flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>ASSIGN TO DESIGN SDE</span>
                    </button>
                  </>
                )}

              {/* Bridge Design SDE: Submit Prepared Design to BDD EE */}
              {formData.workflow_status === "ASSIGNED_TO_BDD_SDE" &&
                ["BDD_SDE", "BDD_EE", "SUPREME"].includes(currentUser?.role) && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowReturnModal(true)}
                      className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>RETURN FOR CORRECTION</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("TAB-07");
                        handleTransition(
                          "SUBMIT_DESIGN_TO_EE",
                          "Prepared design package submitted by BDD SDE to Division EE",
                        );
                      }}
                      className="px-4 py-2 rounded-xl bg-[#1c508c] hover:bg-[#112047] text-white font-bold flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>SUBMIT PREPARED DESIGN TO BDD EE</span>
                    </button>
                  </>
                )}

              {/* BDD EE: Approve Prepared Design & Transmit Directly to Field EE */}
              {formData.workflow_status === "DESIGN_PREPARED_PENDING_EE" &&
                ["BDD_EE", "SUPREME"].includes(currentUser?.role) && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowReturnModal(true)}
                      className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>RETURN FOR CORRECTION</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleTransition(
                          "APPROVE_AND_TRANSMIT",
                          "Prepared design package approved by Bridge Design Division EE and transmitted directly to Field EE",
                        )
                      }
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>APPROVE & TRANSMIT DESIGN TO FIELD EE</span>
                    </button>
                  </>
                )}

              {/* Field EE: Dispatch Approved Package to Field SDE */}
              {formData.workflow_status === "DESIGN_APPROVED_COMPLETE" &&
                ["FIELD_EE", "SUPREME"].includes(currentUser?.role) && (
                  <button
                    type="button"
                    onClick={() =>
                      handleTransition(
                        "DISPATCH_TO_FIELD_SDE",
                        "Design deliverables dispatched by Field Division EE to Field SDE for site execution",
                      )
                    }
                    className="px-4 py-2 rounded-xl bg-[#112047] hover:bg-[#112047] text-white font-bold flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>DISPATCH DESIGN TO FIELD SDE</span>
                  </button>
                )}

              {/* Field SDE Dispatched State Confirmation */}
              {formData.workflow_status === "DISPATCHED_TO_FIELD_SDE" && (
                <div className="flex items-center space-x-2 text-emerald-800 font-bold ">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>DELIVERED TO FIELD SDE - EXECUTION ACTIVE</span>
                </div>
              )}
            </div>
          </div>

          {/* End Right Column #workspace-form-pane & 2-Column Workspace Frame */}
        </div>
      </div>

      {/* Return for Correction Modal */}
      {showReturnModal && (
        <ReturnForCorrectionModal
          item={{ ...formData, type: "BRIDGE", id: acquisitionId }}
          onClose={() => setShowReturnModal(false)}
          onSuccess={() => loadRecord(acquisitionId)}
        />
      )}
    </div>
  );
}
