import React, { useState, useEffect, useMemo } from 'react';
import gsap from 'gsap';
import { 
  Save, 
  Send, 
  CircleChevronLeft, 
  RotateCcw, 
  CheckCircle, 
  Download, 
  Layers, 
  AlertTriangle, 
  Upload, 
  FileText, 
  FileCheck,
  ExternalLink,
  Trash2,
  Lock,
  History
} from 'lucide-react';
import { api } from '../../services/api';
import UnifiedSideFlowPanel from '../workflow/UnifiedSideFlowPanel';
import ReturnForCorrectionModal from '../workflow/ReturnForCorrectionModal';
import RhdWebmapBorelogForm from '../borelog/RhdWebmapBorelogForm';
import PreparedDesignPackageCard from '../workflow/PreparedDesignPackageCard';
import DemandPlacementAuditLog from '../workflow/DemandPlacementAuditLog';

const CLV_TABS = [
  { id: 'CLV-TAB-01', title: '1. Location & Flood/Haor Context', code: '[CLV-01]' },
  { id: 'CLV-TAB-02', title: '2. Benchmark & Hydrology', code: '[CLV-02]' },
  { id: 'CLV-TAB-03', title: '3. Existing Culvert Geometry', code: '[CLV-03]' },
  { id: 'CLV-TAB-04', title: '4. Proposed Culvert Geometry', code: '[CLV-04]' },
  { id: 'CLV-TAB-05', title: '5. Photos & Extension Diagrams', code: '[CLV-05]' },
  { id: 'CLV-TAB-06', title: '6. Webmap GIS & Borelogs', code: '[CLV-06]' },
  { id: 'CLV-TAB-07', title: '7. Prepared Design Deliverables', code: '[CLV-07]' },
  { id: 'CLV-TAB-08', title: '8. Audit & Change History', code: '[CLV-08]' }
];

export default function CulvertAcquisitionWorkspace({
  acquisitionId,
  currentUser,
  onBack,
  onSaved
}) {
  const [activeTab, setActiveTab] = useState('CLV-TAB-01');

  // Field division users have fixed jurisdiction (Zone, Circle, Division); Supreme and Webmaster can select freely
  const isFieldUser = Boolean(
    currentUser?.office_division_id &&
    !['SUPREME', 'WEBMASTER'].includes(currentUser?.role)
  );
  const isFixedJurisdiction = isFieldUser || Boolean(acquisitionId);

  const [formData, setFormData] = useState({
    zone_id: !acquisitionId && isFieldUser ? (currentUser?.office_zone_id || '') : '',
    circle_id: !acquisitionId && isFieldUser ? (currentUser?.office_circle_id || '') : '',
    division_id: !acquisitionId && isFieldUser ? (currentUser?.office_division_id || '') : '',
    road_type_id: 1,
    road_type_others_name: '',
    road_id: '',
    road_name: '',
    culvert_name: '',
    location_chainage_lrp_gps: '',
    location_google_map_link: '',
    location_lat_lng: '',
    is_flash_flood_prone: 'No',
    flash_flood_description: '',
    is_haor_area: 'No',
    is_tidal_area: 'No',
    reference_datum_type: 'MSL',
    reference_benchmark_location: '',
    reference_benchmark_map_link: '',
    reference_benchmark_lat_lng: '',
    cross_road_at_approach: 'Not Applicable',
    nav_clearance_required: 'No',
    highest_flood_level_hfl: '',
    lowest_water_level_lwl: '',
    standard_high_water_level_shwl: '',
    highest_tide_level_htl: '',
    lowest_tide_level_ltl: '',
    existing_culvert_type: 'Rectangular Culvert',
    no_of_vent: 2,
    length_of_each_vent_m: 3.5,
    total_length_m: 7.0,
    height_m: 2.5,
    width_m: 7.5,
    top_slab_thickness_mm: 300,
    side_wall_thickness_mm: 350,
    bottom_slab_thickness_mm: 350,
    existing_structure_condition: '',
    foundation_condition: '',
    existing_remarks: '',
    pipe_outer_dia_m: '',
    pipe_thickness_mm: '',
    pipe_length_m: '',
    pipe_remarks: '',
    slab_thickness_mm: '',
    slab_length_m: '',
    slab_width_m: '',
    slab_remarks: '',
    arch_length_m: '',
    arch_width_m: '',
    arch_dia_m: '',
    arch_thickness_mm: '',
    arch_remarks: '',
    other_length_m: '',
    other_width_m: '',
    other_remarks: '',
    existing_culvert_general_note: '',
    proposed_alignment: 'New Alignment',
    proposed_existing_alignment_offset: 'At the same alignment',
    proposed_culvert_category: 'New Culvert',
    proposed_new_sub_type: 'Rectangular Box Culvert',
    proposed_no_of_vent: 3,
    proposed_length_each_vent_m: 4.5,
    proposed_total_length_m: 13.5,
    proposed_clear_height_m: 3.0,
    proposed_clear_width_m: 13.5,
    proposed_remarks: '',
    proposed_other_length_m: '',
    proposed_other_width_m: '',
    proposed_carriage_width_m: '',
    proposed_widening_side: 'Both Side',
    proposed_extension_carriage_width_m: '',
    proposed_widening_remarks: '',
    total_borehole_count: 0
  });

  // Field Division Jurisdiction Check:
  // Survey and demand placement inputs are strictly reserved for field personnel belonging to this specific field division (or Supreme/Webmaster)
  const isSupremeOrWebmaster = ['SUPREME', 'WEBMASTER'].includes(currentUser?.role);
  const isFieldRole = ['FIELD_SAE', 'FIELD_SDE', 'FIELD_EE'].includes(currentUser?.role);
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
  const [roadCodeInput, setRoadCodeInput] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState(null);
  const [downloadingExport, setDownloadingExport] = useState(null);
  const [msg, setMsg] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);

  const [demandOfficerType, setDemandOfficerType] = useState('EE');

  // Export handler with active blob download + authenticated URL fallback
  const handleExport = async (e, format = 'pdf') => {
    e.preventDefault();
    if (!acquisitionId) return;
    setDownloadingExport(format);
    try {
      await api.downloadExport('culvert', acquisitionId, format);
      setMsg({ type: 'success', text: `${format.toUpperCase()} datasheet downloaded successfully.` });
    } catch (err) {
      console.warn('Direct blob download failed, opening via token URL:', err);
      const url = api.getExportUrl('culvert', acquisitionId, format);
      window.open(url, '_blank');
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
      location_chainage_lrp_gps: composite,
    }));
  };

  const datum = formData.reference_datum_type || 'MSL';

  useEffect(() => {
    loadMasterData();
    if (acquisitionId) {
      loadRecord(acquisitionId);
    } else if (isFieldUser && currentUser?.office_division_id) {
      setFormData(prev => ({
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
        api.getRoads()
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
      const [record, atts] = await Promise.all([
        api.getCulvert(id),
        api.getCulvertAttachments(id)
      ]);
      const parsedCh = parseChainageValues(record.location_chainage_lrp_gps);
      setFormData(prev => ({
        ...prev,
        ...record,
        chainage_km: record.chainage_km ?? (parsedCh.km !== "" ? parseFloat(parsedCh.km) : null),
        chainage_m: record.chainage_m ?? (parsedCh.m !== "" ? parseFloat(parsedCh.m) : null),
      }));
      setAttachments(atts);

      if (record.zone_id) {
        const cList = await api.getCircles(record.zone_id);
        setCircles(cList);
      }
      if (record.circle_id) {
        const dList = await api.getDivisions(record.circle_id);
        setDivisions(dList);
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  const handleZoneChange = async (zId) => {
    setFormData(prev => ({ ...prev, zone_id: zId, circle_id: '', division_id: '' }));
    if (zId) {
      const cList = await api.getCircles(zId);
      setCircles(cList);
    } else {
      setCircles([]);
      setDivisions([]);
    }
  };

  const handleCircleChange = async (cId) => {
    setFormData(prev => ({ ...prev, circle_id: cId, division_id: '' }));
    if (cId) {
      const dList = await api.getDivisions(cId);
      setDivisions(dList);
    } else {
      setDivisions([]);
    }
  };

  const handleRoadSelect = (rId) => {
    const selected = roads.find(r => r.id === parseInt(rId));
    setFormData(prev => ({
      ...prev,
      road_id: rId,
      road_name: selected ? selected.road_name : prev.road_name
    }));
  };

  // Auto-calculation for Rectangular Culvert Total Length
  const handleExistingVentChange = (field, val) => {
    const nextVal = val === '' ? '' : parseFloat(val);
    const updated = { ...formData, [field]: nextVal };
    if (field === 'no_of_vent' || field === 'length_of_each_vent_m') {
      const n = field === 'no_of_vent' ? parseInt(nextVal) || 0 : parseInt(formData.no_of_vent) || 0;
      const l = field === 'length_of_each_vent_m' ? parseFloat(nextVal) || 0 : parseFloat(formData.length_of_each_vent_m) || 0;
      updated.total_length_m = Math.round(n * l * 100) / 100;
    }
    setFormData(updated);
  };

  // Auto-calculation for Proposed Box Culvert Total Length
  const handleProposedVentChange = (field, val) => {
    const nextVal = val === '' ? '' : parseFloat(val);
    const updated = { ...formData, [field]: nextVal };
    if (field === 'proposed_no_of_vent' || field === 'proposed_length_each_vent_m') {
      const n = field === 'proposed_no_of_vent' ? parseInt(nextVal) || 0 : parseInt(formData.proposed_no_of_vent) || 0;
      const l = field === 'proposed_length_each_vent_m' ? parseFloat(nextVal) || 0 : parseFloat(formData.proposed_length_each_vent_m) || 0;
      updated.proposed_total_length_m = Math.round(n * l * 100) / 100;
    }
    setFormData(updated);
  };

  const handleSaveDraft = async () => {
    if (!canEditPlacement) {
      setMsg({
        type: 'error',
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
        } : {})
      };
      let res;
      if (acquisitionId) {
        res = await api.updateCulvert(acquisitionId, payload);
        setMsg({ type: 'success', text: `Culvert Dossier ${res.code} updated!` });
      } else {
        res = await api.createCulvert(payload);
        setMsg({ type: 'success', text: `New Culvert Acquisition ${res.code} created!` });
        if (onSaved) onSaved(res.id);
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleTransition = async (action, endorsementNote = '') => {
    try {
      setSaving(true);
      const res = await api.transitionCulvert(acquisitionId, {
        action,
        endorsement_note: endorsementNote || `Transitioned by ${currentUser?.role}`
      });
      setMsg({ type: 'success', text: `Dossier transitioned to [${res.to_status}]` });
      loadRecord(acquisitionId);
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (slotCode, file, demandType = null) => {
    if (!file) return;
    try {
      setUploadingSlot(slotCode);
      let targetId = acquisitionId;
      if (!targetId) {
        // Auto-save draft on server so user is never blocked
        const payload = {
          ...formData,
          ...(isFieldUser ? {
            division_id: formData.division_id || currentUser?.office_division_id,
            circle_id: formData.circle_id || currentUser?.office_circle_id,
            zone_id: formData.zone_id || currentUser?.office_zone_id,
          } : {})
        };
        const created = await api.createCulvert(payload);
        targetId = created.id;
        setFormData(prev => ({
          ...prev,
          id: created.id,
          code: created.code,
        }));
        if (onSaved) onSaved(created.id);
      }
      await api.uploadCulvertAttachment(targetId, slotCode, file, demandType);
      const atts = await api.getCulvertAttachments(targetId);
      setAttachments(atts);
      setMsg({ type: 'success', text: `Document "${file.name}" uploaded successfully!` });
    } catch (err) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleDeleteAttachment = async (attId) => {
    try {
      await api.deleteCulvertAttachment(acquisitionId, attId);
      setAttachments(attachments.filter(a => a.id !== attId));
    } catch (err) {
      alert(`Delete error: ${err.message}`);
    }
  };

  const uploadedDemandTypes = attachments
    .filter(a => a.slot_code.startsWith('demand_letter'))
    .map(a => a.demand_officer_type);

  const availableDemandOptions = [
    { type: 'EE', label: 'Attachment for Executive Engineer (EE)' },
    { type: 'SE', label: 'Attachment for Superintending Engineer (SE)' },
    { type: 'ACE', label: 'Attachment for Additional Chief Engineer (ACE)' }
  ].filter(opt => !uploadedDemandTypes.includes(opt.type));

  const flaggedTabs = formData.flagged_sections_json ? JSON.parse(formData.flagged_sections_json) : [];

  // High-Speed Keyboard Navigation & Focus Acceleration
  const focusFirstInput = (tabId) => {
    setTimeout(() => {
      const container = document.getElementById(`panel-${tabId}`);
      if (container) {
        const firstInput = container.querySelector('input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])');
        if (firstInput) {
          firstInput.focus();
          if (firstInput.select && typeof firstInput.select === 'function') {
            firstInput.select();
          }
        }
      }
    }, 20);
  };

  const [tabDirection, setTabDirection] = useState('forward');

  useEffect(() => {
    const formPane = document.getElementById(`panel-${activeTab}`);
    if (formPane) {
      gsap.fromTo(
        formPane,
        { opacity: 0, y: 12, filter: 'blur(3px)' },
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.32,
          ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
          clearProps: 'transform,opacity,filter',
        }
      );
    }
  }, []);

  // Direction-Aware Silky Smooth Section Transitions
  const handleSelectTab = (targetTab) => {
    if (targetTab === activeTab) return;

    const curIdx = CLV_TABS.findIndex((t) => t.id === activeTab);
    const nextIdx = CLV_TABS.findIndex((t) => t.id === targetTab);
    const direction = nextIdx >= curIdx ? 'forward' : 'backward';
    setTabDirection(direction);

    // Crisp tactile acknowledgment on target tab button
    const tabEl = document.getElementById(`tab-${targetTab}`);
    if (tabEl) {
      gsap.killTweensOf(tabEl);
      gsap.fromTo(
        tabEl,
        { scale: 0.95 },
        { scale: 1, duration: 0.22, ease: 'cubic-bezier(0.16, 1, 0.3, 1)' }
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
          { opacity: 0, y: 22, x: 0, filter: 'blur(4px)' },
          {
            opacity: 1,
            y: 0,
            x: 0,
            filter: 'blur(0px)',
            duration: 0.28,
            ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
            clearProps: 'transform,opacity,filter',
          }
        );
      }
    });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Direct Tab Switching via Alt + 1-6 or Alt + Left/Right
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= CLV_TABS.length) {
          e.preventDefault();
          handleSelectTab(CLV_TABS[num - 1].id);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          const curIdx = CLV_TABS.findIndex(t => t.id === activeTab);
          const nextIdx = (curIdx + 1) % CLV_TABS.length;
          handleSelectTab(CLV_TABS[nextIdx].id);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          const curIdx = CLV_TABS.findIndex(t => t.id === activeTab);
          const prevIdx = (curIdx - 1 + CLV_TABS.length) % CLV_TABS.length;
          handleSelectTab(CLV_TABS[prevIdx].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  // Enter Key Advances Focus to Next Form Field
  const handleFormKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.type !== 'submit') {
      e.preventDefault();
      const container = document.getElementById(`panel-${activeTab}`);
      if (!container) return;
      const formElements = Array.from(
        container.querySelectorAll('input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])')
      );
      const index = formElements.indexOf(e.target);
      if (index !== -1 && index < formElements.length - 1) {
        const next = formElements[index + 1];
        next.focus();
        if (next.select && typeof next.select === 'function') {
          next.select();
        }
      }
    }
  };

  // Tab Strip Arrow Key Navigation
  const handleTabKeyNav = (e, idx) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIdx = (idx + 1) % CLV_TABS.length;
      const targetTab = CLV_TABS[nextIdx].id;
      handleSelectTab(targetTab);
      document.getElementById(`tab-${targetTab}`)?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIdx = (idx - 1 + CLV_TABS.length) % CLV_TABS.length;
      const targetTab = CLV_TABS[prevIdx].id;
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
              <span className="text-xs font-bold text-[#4a1e46] py-0.5" style={{ fontFamily: 'var(--font-caption)' }}>
                {formData.code || 'New Culvert Acquisition'}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Status: <b className="text-slate-900" style={{ fontFamily: 'var(--font-body)' }}>{formData.workflow_status || 'DRAFT_FIELD'}</b>
              </span>
            </div>
            <h1 className="text-lg font-extrabold text-slate-900 mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>
              {formData.culvert_name || 'Proposed Culvert Cross-Drainage Acquisition'}
            </h1>
          </div>
        </div>

        {/* Global Action Tools */}
        <div className="flex items-center space-x-2 text-xs">
          {acquisitionId && (
            <>
              <a
                href={api.getExportUrl('culvert', acquisitionId, 'pdf')}
                onClick={(e) => handleExport(e, 'pdf')}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                style={{ fontFamily: 'var(--font-body)' }}
                title="Download Culvert Technical Datasheet PDF"
              >
                <Download className={`w-3.5 h-3.5 text-[#8e4b7b] ${downloadingExport === 'pdf' ? 'animate-spin' : ''}`} />
                <span>{downloadingExport === 'pdf' ? 'Exporting...' : 'Datasheet PDF'}</span>
              </a>
              <a
                href={api.getExportUrl('culvert', acquisitionId, 'excel')}
                onClick={(e) => handleExport(e, 'excel')}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                style={{ fontFamily: 'var(--font-body)' }}
                title="Download Culvert Excel Schedule"
              >
                <Download className={`w-3.5 h-3.5 text-emerald-700 ${downloadingExport === 'excel' ? 'animate-spin' : ''}`} />
                <span>{downloadingExport === 'excel' ? 'Exporting...' : 'Excel Schedule'}</span>
              </a>
              <a
                href={api.getExportUrl('culvert', acquisitionId, 'zip')}
                onClick={(e) => handleExport(e, 'zip')}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                style={{ fontFamily: 'var(--font-body)' }}
                title="Download Complete Culvert ZIP Dossier"
              >
                <Download className={`w-3.5 h-3.5 text-amber-700 ${downloadingExport === 'zip' ? 'animate-spin' : ''}`} />
                <span>{downloadingExport === 'zip' ? 'Exporting...' : 'ZIP Dossier'}</span>
              </a>
            </>
          )}

          {acquisitionId && (
            <button
              type="button"
              onClick={() => setActiveTab('CLV-TAB-08')}
              className={`px-3 py-1.5 rounded-xs border text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeTab === 'CLV-TAB-08'
                  ? 'bg-[#7a3869] text-white border-[#7a3869]'
                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
              }`}
            >
              <History className="w-3.5 h-3.5 text-[#8e4b7b]" />
              <span>Change History</span>
            </button>
          )}

          {canEditPlacement ? (
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="btn-festive-plum text-xs font-semibold px-4 py-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : (acquisitionId ? 'Update Placement' : 'Save Draft')}</span>
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

      {/* Read-Only Notice if user is outside this division or non-field personnel */}
      {!canEditPlacement && (
        <div className="border border-amber-300 bg-amber-50/90 text-amber-900 p-3 rounded-xl flex items-center justify-between text-xs font-mono shadow-xs">
          <div className="flex items-center space-x-2">
            <Lock className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>Jurisdiction Notice:</strong> {!acquisitionId
                ? "Originating new culvert acquisition demand placements is strictly reserved for Field Division survey personnel (FIELD_SAE, FIELD_SDE, FIELD_EE). Design Division and review roles cannot originate field survey records."
                : <>Bringing edits to this demand placement is strictly reserved for field personnel inside <strong>{divisions.find((d) => d.id === Number(formData.division_id))?.name || formData.division_name || `Division #${formData.division_id}`}</strong>. Survey data is presented in frozen view-only mode.</>}
            </span>
          </div>
          {acquisitionId && (
            <button
              type="button"
              onClick={() => setActiveTab('CLV-TAB-08')}
              className="px-2.5 py-1 rounded bg-amber-200/80 hover:bg-amber-300 text-amber-900 font-bold text-[11px] cursor-pointer ml-3 shrink-0 flex items-center space-x-1"
            >
              <History className="w-3 h-3" />
              <span>View Change Logs</span>
            </button>
          )}
        </div>
      )}

      {msg && (
        <div className={`p-3 text-xs flex items-center justify-between border notification-banner-appear ${msg.type === 'error' ? 'bg-rose-50 text-rose-800 border-rose-300' : 'bg-emerald-50 text-emerald-800 border-emerald-300'}`}>
          <span style={{ fontFamily: 'var(--font-body)' }}>{msg.text}</span>
          <button onClick={() => setMsg(null)} className="font-bold ml-4 text-slate-500 hover:text-slate-800 cursor-pointer">✕</button>
        </div>
      )}

      {/* Red Alert Banner if Returned for Correction */}
      {formData.workflow_status === 'RETURNED_FOR_CORRECTION' && (
        <div className="border border-rose-400 bg-rose-50 p-4 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <div className="font-bold text-rose-900 uppercase" style={{ fontFamily: 'var(--font-body)' }}>
              Returned for Correction by Bridge Design Circle
            </div>
            <p className="text-rose-800 mt-1">
              <b>Reviewer Instructions:</b> {formData.return_reason_notes || 'Please re-verify culvert geometry and plane table survey.'}
            </p>
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
            currentStatus={formData.workflow_status || 'DRAFT_FIELD'}
            formData={formData}
            structureType="culvert"
            activeTab={activeTab}
            onSelectTab={handleSelectTab}
            onKeyDownTab={handleTabKeyNav}
            tabs={CLV_TABS}
            flaggedTabs={flaggedTabs}
            totalBoreholes={formData.total_boreholes_count || 0}
            attachmentCount={attachments.length}
          />
        </aside>

        {/* RIGHT COLUMN: The Active Tab's Form Inputs Page */}
        <div className="flex-1 min-w-0 w-full" id="culvert-workspace-form-pane">
          {/* Read-Only Jurisdiction Frozen Placement Banner */}
          {!canEditPlacement && (
            <div className="p-3 bg-amber-50/90 border border-amber-300 rounded-xl flex items-center justify-between text-xs text-amber-900 font-mono shadow-xs mb-4">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-amber-700 shrink-0" />
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
                    onClick={(e) => handleExport(e, 'pdf')}
                    disabled={downloadingExport === 'pdf'}
                    className="px-2.5 py-1 rounded bg-amber-200/90 hover:bg-amber-300 text-amber-900 font-bold text-[11px] cursor-pointer flex items-center space-x-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>{downloadingExport === 'pdf' ? 'Exporting...' : 'Export PDF'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Division Engineering Inputs Fieldset (Frozen when outside division profile) */}
          <fieldset
            disabled={!canEditPlacement}
            className={`border-0 p-0 m-0 ${!canEditPlacement ? 'placement-frozen' : ''}`}
          >
          {/* ====================================================================== */}
          {/* [CLV-TAB-01] DEMAND LETTER, HIERARCHY & FLOOD/HAOR CONTEXT */}
          {/* ====================================================================== */}
          <div
            id="panel-CLV-TAB-01"
            role="tabpanel"
            aria-labelledby="tab-CLV-TAB-01"
            className={`space-y-4 ${activeTab === 'CLV-TAB-01' ? 'tab-pane-active' : 'hidden'}`}
            onKeyDown={handleFormKeyDown}
          >
          <div className="eng-panel">
            <div className="eng-section-header accent-plum">
              <span>Culvert Administrative Hierarchy & Road Alignment</span>
              {/* <span className="text-[10px] text-slate-400 font-semibold" style={{ fontFamily: 'var(--font-caption)' }}>
                Fields a.1 – h
              </span> */}
            </div>

            <div className="eng-cluster">
              {/* Primary Landmark */}
              <div className="eng-grid-12">
                <div className="col-span-12 md:col-span-6 eng-field">
                  <label className="eng-label eng-label-required">Culvert Name / Structure Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Demra Irrigation Culvert"
                    value={formData.culvert_name || ''}
                    onChange={e => setFormData({ ...formData, culvert_name: e.target.value })}
                    className="eng-input eng-input-landmark"
                  />
                </div>

                <div className="col-span-12 md:col-span-6 eng-field">
                  <label className="eng-label">Road Chainage (Km &amp; Meter)</label>
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
                            {formData.location_chainage_lrp_gps || "Ch 0+000"} Km
                          </span>
                        </div>
                      </div>
                  {/* <span className="text-[10px] font-mono text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 inline-block mt-1">
                    {formData.location_chainage_lrp_gps || "Ch 0+000"}
                  </span> */}
                </div>
              </div>

              {/* Administrative Jurisdiction */}
              <div className="border-t border-slate-200 pt-3">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center justify-between" style={{ fontFamily: 'var(--font-subhead)' }}>
                  <span>Administrative Jurisdiction</span>
                  {isFixedJurisdiction && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs text-[11px] font-semibold text-amber-700 border border-slate-300">
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
                        {zones.find(z => z.id === (formData.zone_id || currentUser?.office_zone_id))?.name ||
                          currentUser?.office_zone_name ||
                          (formData.zone_id ? `Zone #${formData.zone_id}` : 'Assigned Zone')}
                      </div>
                    ) : (
                      <select
                        value={formData.zone_id || ''}
                        onChange={e => handleZoneChange(e.target.value ? parseInt(e.target.value) : '')}
                        className="eng-input"
                      >
                        <option value="">Select Zone</option>
                        {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
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
                        {circles.find(c => c.id === (formData.circle_id || currentUser?.office_circle_id))?.name ||
                          currentUser?.office_circle_name ||
                          (formData.circle_id ? `Circle #${formData.circle_id}` : 'Assigned Circle')}
                      </div>
                    ) : (
                      <select
                        value={formData.circle_id || ''}
                        onChange={e => handleCircleChange(e.target.value ? parseInt(e.target.value) : '')}
                        className="eng-input"
                      >
                        <option value="">Select Circle</option>
                        {circles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
                        {divisions.find(d => d.id === (formData.division_id || currentUser?.office_division_id))?.name ||
                          currentUser?.office_division_name ||
                          (formData.division_id ? `Division #${formData.division_id}` : 'Assigned Division')}
                      </div>
                    ) : (
                      <select
                        value={formData.division_id || ''}
                        onChange={e => setFormData({ ...formData, division_id: e.target.value ? parseInt(e.target.value) : '' })}
                        className="eng-input"
                      >
                        <option value="">Select Division</option>
                        {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    )}
                  </div>
                </div>
              </div>

              {/* Highway Route */}
              <div className="border-t border-slate-200 pt-3">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5" style={{ fontFamily: 'var(--font-subhead)' }}>
                  Highway Route & Road Classification
                </div>
                <div className="eng-grid-12">
                  <div className="col-span-12 md:col-span-4 eng-field">
                    <label className="eng-label">b.1) Type of Road</label>
                    <select
                      value={formData.road_type_id || 1}
                      onChange={e => handleRoadTypeSelect(parseInt(e.target.value))}
                      className="eng-input"
                    >
                      {roadTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
                    </select>
                  </div>

                  {formData.road_type_id === 4 && (
                    <div className="col-span-12 md:col-span-4 eng-field">
                      <label className="eng-label">b.1.1) Road Type Others Name</label>
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
                      <label className="eng-label">b.2) Road Number / Code</label>
                      {currentRoad && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-100 text-[#4a1e46] font-bold">
                          {currentRoad.road_type_code === 'N' ? 'National Highway' : currentRoad.road_type_code === 'R' ? 'Regional Highway' : currentRoad.road_type_code === 'Z' ? 'Zilla Road' : 'RHD'}
                        </span>
                      )}
                    </div>
                    {!canEditPlacement ? (
                      <div className="eng-input bg-slate-100/90 text-slate-800 font-bold flex items-center border-slate-200 cursor-default select-text">
                        {roadCodeInput || currentRoadNumber || (formData.road_id ? `Road #${formData.road_id}` : '—')}
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="text"
                          list="culvert-road-codes-list"
                          placeholder={
                            formData.road_type_id === 1 ? "Select/Type National e.g. N1, N5..." :
                            formData.road_type_id === 2 ? "Select/Type Regional e.g. R140, R160..." :
                            formData.road_type_id === 3 ? "Select/Type Zilla e.g. Z1001, Z1024..." :
                            "Type Road Number / Code..."
                          }
                          value={roadCodeInput || currentRoadNumber}
                          onChange={(e) => handleRoadCodeInput(e.target.value)}
                          className="eng-input font-bold text-[#4a1e46] uppercase"
                        />
                        <datalist id="culvert-road-codes-list">
                          {filteredRoads.map((r) => (
                            <option key={r.id} value={r.road_number}>
                              {r.road_number} — {r.road_name}
                            </option>
                          ))}
                        </datalist>
                      </div>
                    )}
                  </div>

                  <div className="col-span-12 md:col-span-4 eng-field">
                    <label className="eng-label">b.3) Name of the Road (Auto-Filled from Official RHD GeoJSON Network)</label>
                    {!canEditPlacement ? (
                      <div className="eng-input bg-slate-100/90 text-slate-800 font-semibold flex items-center border-slate-200 cursor-default select-text">
                        {formData.road_name || '—'}
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="text"
                          list="culvert-road-names-list"
                          placeholder="Type or select official road name..."
                          value={formData.road_name || ''}
                          onChange={(e) => handleRoadNameInput(e.target.value)}
                          className="eng-input bg-slate-50 font-medium"
                        />
                        <datalist id="culvert-road-names-list">
                          {filteredRoads.map((r) => (
                            <option key={r.id} value={r.road_name}>
                              {r.road_number} — {r.road_name}
                            </option>
                          ))}
                        </datalist>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Environmental Context Flags */}
              <div className="border-t border-slate-200 pt-3">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5" style={{ fontFamily: 'var(--font-subhead)' }}>
                  Environmental & Terrain Vulnerability
                </div>
                <div className="eng-grid-12">
                  <div className="col-span-12 sm:col-span-4 eng-field">
                    <label className="eng-label font-bold text-slate-800">f) Flash Flood-Prone Area?</label>
                    <select
                      value={formData.is_flash_flood_prone || 'No'}
                      onChange={e => setFormData({ ...formData, is_flash_flood_prone: e.target.value })}
                      className="eng-input font-semibold"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes (Describe below)</option>
                    </select>
                  </div>

                  <div className="col-span-12 sm:col-span-4 eng-field">
                    <label className="eng-label font-bold text-slate-800">g) Haor Area?</label>
                    <select
                      value={formData.is_haor_area || 'No'}
                      onChange={e => setFormData({ ...formData, is_haor_area: e.target.value })}
                      className="eng-input font-semibold"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>

                  <div className="col-span-12 sm:col-span-4 eng-field">
                    <label className="eng-label font-bold text-slate-800">h) Tidal Area?</label>
                    <select
                      value={formData.is_tidal_area || 'No'}
                      onChange={e => setFormData({ ...formData, is_tidal_area: e.target.value })}
                      className="eng-input font-semibold"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>

                  {formData.is_flash_flood_prone === 'Yes' && (
                    <div className="col-span-12 eng-field">
                      <label className="eng-label text-rose-800">f.1) Describe Nature of Flash Flood (Velocity, Sediment, Peak Duration)</label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Rapid mountain runoff during pre-monsoon with high sediment discharge..."
                        value={formData.flash_flood_description || ''}
                        onChange={e => setFormData({ ...formData, flash_flood_description: e.target.value })}
                        className="eng-input h-auto py-2 border-rose-300"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* ====================================================================== */}
      {/* [CLV-TAB-02] BENCHMARK, PLANE TABLE & HYDROLOGY */}
      {/* ====================================================================== */}
      <div
        id="panel-CLV-TAB-02"
        role="tabpanel"
        aria-labelledby="tab-CLV-TAB-02"
        className={`space-y-4 ${activeTab === 'CLV-TAB-02' ? 'tab-pane-active' : 'hidden'}`}
        onKeyDown={handleFormKeyDown}
      >
          <div className="eng-panel">
            <div className="eng-section-header accent-plum">
              <span>Culvert Benchmark Datum & Hydrological Survey Levels</span>
              <span className="font-caption text-xs font-semibold text-[#8e4b7b]">Datum: in m {datum}</span>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-mono font-bold text-[#4a1e46] mb-1">2.1) Reference Benchmark / Datum Type</label>
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

              <div className="md:col-span-2">
                <label className="block text-slate-700 font-medium mb-1">2.2) Location of Benchmark</label>
                <input
                  type="text"
                  placeholder="e.g. TBM on concrete guide post at Ch 12+400"
                  value={formData.reference_benchmark_location || ''}
                  onChange={e => setFormData({ ...formData, reference_benchmark_location: e.target.value })}
                  className="eng-input"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">6.1) Highest Flood Level (HFL)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="5.80"
                    value={formData.highest_flood_level_hfl || ''}
                    onChange={e => setFormData({ ...formData, highest_flood_level_hfl: e.target.value ? parseFloat(e.target.value) : '' })}
                    className="eng-input font-mono font-bold text-[#4a1e46]"
                  />
                  <span className="ml-2 font-mono text-slate-500 whitespace-nowrap">in m {datum}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">6.2) Lowest Water Level (LWL)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="1.20"
                    value={formData.lowest_water_level_lwl || ''}
                    onChange={e => setFormData({ ...formData, lowest_water_level_lwl: e.target.value ? parseFloat(e.target.value) : '' })}
                    className="eng-input font-mono font-bold text-[#4a1e46]"
                  />
                  <span className="ml-2 font-mono text-slate-500 whitespace-nowrap">in m {datum}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">6.3) Standard High Water Level (SHWL)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="5.10"
                    value={formData.standard_high_water_level_shwl || ''}
                    onChange={e => setFormData({ ...formData, standard_high_water_level_shwl: e.target.value ? parseFloat(e.target.value) : '' })}
                    className="eng-input font-mono font-bold text-[#4a1e46]"
                  />
                  <span className="ml-2 font-mono text-slate-500 whitespace-nowrap">in m {datum}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">6.4) Highest Tide Level (HTL)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="4.90"
                    value={formData.highest_tide_level_htl || ''}
                    onChange={e => setFormData({ ...formData, highest_tide_level_htl: e.target.value ? parseFloat(e.target.value) : '' })}
                    className="eng-input font-mono"
                  />
                  <span className="ml-2 font-mono text-slate-500 whitespace-nowrap">in m {datum}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">6.5) Lowest Tide Level (LTL)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="1.50"
                    value={formData.lowest_tide_level_ltl || ''}
                    onChange={e => setFormData({ ...formData, lowest_tide_level_ltl: e.target.value ? parseFloat(e.target.value) : '' })}
                    className="eng-input font-mono"
                  />
                  <span className="ml-2 font-mono text-slate-500 whitespace-nowrap">in m {datum}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">5) Navigational Clearance Required?</label>
                <select
                  value={formData.nav_clearance_required || 'No'}
                  onChange={e => setFormData({ ...formData, nav_clearance_required: e.target.value })}
                  className="eng-input tabular-nums"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes (Attachment Required)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

      {/* ====================================================================== */}
      {/* [CLV-TAB-03] EXISTING CULVERT GEOMETRY & CONDITION */}
      {/* ====================================================================== */}
      <div
        id="panel-CLV-TAB-03"
        role="tabpanel"
        aria-labelledby="tab-CLV-TAB-03"
        className={`space-y-4 ${activeTab === 'CLV-TAB-03' ? 'tab-pane-active' : 'hidden'}`}
        onKeyDown={handleFormKeyDown}
      >
          <div className="eng-panel">
            <div className="eng-section-header accent-plum">
              <span>Section 7: Existing Culvert Structure Geometry & Structural Condition</span>
            </div>
            <div className="p-4 space-y-4 text-xs">
              {/* Type Radio */}
              <div className="flex flex-wrap items-center gap-6 font-mono">
                <span className="font-bold text-[#001139]">Existing Culvert Type:</span>
                {['Rectangular Culvert', 'Pipe Culvert', 'Slab Culvert', 'Arch Culvert', 'Other', 'None'].map(type => (
                  <label key={type} className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="existing_culvert_type"
                      checked={formData.existing_culvert_type === type}
                      onChange={() => setFormData({ ...formData, existing_culvert_type: type })}
                    />
                    <span className="text-[#00225a] font-medium">{type}</span>
                  </label>
                ))}
              </div>

              {/* Conditional Rectangular Culvert Inputs */}
              {formData.existing_culvert_type === 'Rectangular Culvert' && (
                <div className="p-3.5 bg-white/40 border border-white/60 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 backdrop-blur-xs">
                  <div>
                    <label className="eng-label mb-1">No. of Vent</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.no_of_vent || ''}
                      onChange={e => handleExistingVentChange('no_of_vent', e.target.value)}
                      className="eng-input eng-input-plum font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="eng-label mb-1">Length of Each Vent (m)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.length_of_each_vent_m || ''}
                      onChange={e => handleExistingVentChange('length_of_each_vent_m', e.target.value)}
                      className="eng-input eng-input-plum font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="eng-label font-bold text-[#4a1e46] mb-1">Total Length (Auto-Calculated)</label>
                    <input
                      type="number"
                      readOnly
                      value={formData.total_length_m || ''}
                      className="eng-input font-mono font-bold bg-white/60 text-[#4a1e46] border-white/80"
                    />
                  </div>
                  <div>
                    <label className="eng-label mb-1">Clear Height (m)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.height_m || ''}
                      onChange={e => setFormData({ ...formData, height_m: e.target.value ? parseFloat(e.target.value) : '' })}
                      className="eng-input eng-input-plum font-mono"
                    />
                  </div>
                  <div>
                    <label className="eng-label mb-1">Clear Width (m)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.width_m || ''}
                      onChange={e => setFormData({ ...formData, width_m: e.target.value ? parseFloat(e.target.value) : '' })}
                      className="eng-input eng-input-plum font-mono"
                    />
                  </div>
                  <div>
                    <label className="eng-label mb-1">Top Slab Thickness (mm)</label>
                    <input
                      type="number"
                      value={formData.top_slab_thickness_mm || ''}
                      onChange={e => setFormData({ ...formData, top_slab_thickness_mm: e.target.value ? parseFloat(e.target.value) : '' })}
                      className="eng-input eng-input-plum font-mono"
                    />
                  </div>
                  <div>
                    <label className="eng-label mb-1">Side Wall Thickness (mm)</label>
                    <input
                      type="number"
                      value={formData.side_wall_thickness_mm || ''}
                      onChange={e => setFormData({ ...formData, side_wall_thickness_mm: e.target.value ? parseFloat(e.target.value) : '' })}
                      className="eng-input eng-input-plum font-mono"
                    />
                  </div>
                  <div>
                    <label className="eng-label mb-1">Bottom Slab Thickness (mm)</label>
                    <input
                      type="number"
                      value={formData.bottom_slab_thickness_mm || ''}
                      onChange={e => setFormData({ ...formData, bottom_slab_thickness_mm: e.target.value ? parseFloat(e.target.value) : '' })}
                      className="eng-input eng-input-plum font-mono"
                    />
                  </div>
                  <div>
                    <label className="eng-label mb-1">Structure Condition</label>
                    <input
                      type="text"
                      placeholder="e.g. Severely distressed top slab"
                      value={formData.existing_structure_condition || ''}
                      onChange={e => setFormData({ ...formData, existing_structure_condition: e.target.value })}
                      className="eng-input eng-input-plum"
                    />
                  </div>
                </div>
              )}

              {/* Conditional Pipe Culvert Inputs */}
              {formData.existing_culvert_type === 'Pipe Culvert' && (
                <div className="p-3.5 bg-white/40 border border-white/60 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 backdrop-blur-xs">
                  <div>
                    <label className="eng-label mb-1">Pipe Outer Dia (m)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.pipe_outer_dia_m || ''}
                      onChange={e => setFormData({ ...formData, pipe_outer_dia_m: e.target.value ? parseFloat(e.target.value) : '' })}
                      className="eng-input eng-input-plum font-mono"
                    />
                  </div>
                  <div>
                    <label className="eng-label mb-1">Thickness of Pipe (mm)</label>
                    <input
                      type="number"
                      value={formData.pipe_thickness_mm || ''}
                      onChange={e => setFormData({ ...formData, pipe_thickness_mm: e.target.value ? parseFloat(e.target.value) : '' })}
                      className="eng-input eng-input-plum font-mono"
                    />
                  </div>
                  <div>
                    <label className="eng-label mb-1">Pipe Length (m)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.pipe_length_m || ''}
                      onChange={e => setFormData({ ...formData, pipe_length_m: e.target.value ? parseFloat(e.target.value) : '' })}
                      className="eng-input eng-input-plum font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="eng-label mb-1">(c) General Remarks for Existing Structure</label>
                <textarea
                  rows={2}
                  value={formData.existing_culvert_general_note || ''}
                  onChange={e => setFormData({ ...formData, existing_culvert_general_note: e.target.value })}
                  className="eng-input eng-input-plum h-auto py-2 leading-relaxed"
                />
              </div>
            </div>
          </div>
        </div>

      {/* ====================================================================== */}
      {/* [CLV-TAB-04] PROPOSED CULVERT ALIGNMENT & GEOMETRY */}
      {/* ====================================================================== */}
      <div
        id="panel-CLV-TAB-04"
        role="tabpanel"
        aria-labelledby="tab-CLV-TAB-04"
        className={`space-y-4 ${activeTab === 'CLV-TAB-04' ? 'tab-pane-active' : 'hidden'}`}
        onKeyDown={handleFormKeyDown}
      >
          <div className="eng-panel">
            <div className="eng-section-header accent-plum">
              <span>Section 8: Proposed Culvert Alignment & Structural Sizing</span>
            </div>
            <div className="p-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="eng-label mb-1">8) Alignment of Proposed Culvert</label>
                  <select
                    value={formData.proposed_alignment || 'New Alignment'}
                    onChange={e => setFormData({ ...formData, proposed_alignment: e.target.value })}
                    className="eng-input eng-input-plum tabular-nums font-bold"
                  >
                    <option value="New Alignment">New Alignment</option>
                    <option value="For Existing Culvert">For Existing Culvert</option>
                  </select>
                </div>

                <div>
                  <label className="eng-label mb-1">Proposed Culvert Scope Category</label>
                  <select
                    value={formData.proposed_culvert_category || 'New Culvert'}
                    onChange={e => setFormData({ ...formData, proposed_culvert_category: e.target.value })}
                    className="eng-input eng-input-plum tabular-nums font-bold text-[#4a1e46]"
                  >
                    <option value="New Culvert">New Culvert</option>
                    <option value="Widening Culvert">Widening Culvert</option>
                    <option value="Not Applicable">Not Applicable</option>
                  </select>
                </div>
              </div>

              {/* Sub-form: New Culvert */}
              {formData.proposed_culvert_category === 'New Culvert' && (
                <div className="p-3.5 bg-white/40 border border-white/60 rounded-xl space-y-3 backdrop-blur-xs">
                  <span className="font-mono font-bold text-[#4a1e46] block">
                    New Culvert Dimensioning (Rectangular Box Culvert vs Other):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="eng-label mb-1">Proposed No. of Vent</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.proposed_no_of_vent || ''}
                        onChange={e => handleProposedVentChange('proposed_no_of_vent', e.target.value)}
                        className="eng-input eng-input-plum font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="eng-label mb-1">Clear / Vent Length (m)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.proposed_length_each_vent_m || ''}
                        onChange={e => handleProposedVentChange('proposed_length_each_vent_m', e.target.value)}
                        className="eng-input eng-input-plum font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="eng-label font-bold text-[#4a1e46] mb-1">Proposed Total Length (m)</label>
                      <input
                        type="number"
                        readOnly
                        value={formData.proposed_total_length_m || ''}
                        className="eng-input font-mono font-bold bg-white/60 text-[#4a1e46] border-white/80"
                      />
                    </div>
                    <div>
                      <label className="eng-label mb-1">Clear Height (m)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.proposed_clear_height_m || ''}
                        onChange={e => setFormData({ ...formData, proposed_clear_height_m: e.target.value ? parseFloat(e.target.value) : '' })}
                        className="eng-input eng-input-plum font-mono"
                      />
                    </div>
                    <div>
                      <label className="eng-label mb-1">Clear Width (m)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.proposed_clear_width_m || ''}
                        onChange={e => setFormData({ ...formData, proposed_clear_width_m: e.target.value ? parseFloat(e.target.value) : '' })}
                        className="eng-input eng-input-plum font-mono"
                      />
                    </div>
                    <div>
                      <label className="eng-label mb-1">Proposed Culvert Remarks</label>
                      <input
                        type="text"
                        placeholder="e.g. RCC Box Culvert with drop wall"
                        value={formData.proposed_remarks || ''}
                        onChange={e => setFormData({ ...formData, proposed_remarks: e.target.value })}
                        className="eng-input eng-input-plum"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-form: Widening Culvert */}
              {formData.proposed_culvert_category === 'Widening Culvert' && (
                <div className="p-3.5 bg-white/40 border border-white/60 rounded-xl space-y-3 backdrop-blur-xs">
                  <span className="font-mono font-bold text-[#4a1e46] block">
                    Culvert Widening Specification:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="eng-label mb-1">Widening Side</label>
                      <select
                        value={formData.proposed_widening_side || 'Both Side'}
                        onChange={e => setFormData({ ...formData, proposed_widening_side: e.target.value })}
                        className="eng-input eng-input-plum tabular-nums"
                      >
                        <option value="Upstream Side">Upstream Side</option>
                        <option value="Downstream Side">Downstream Side</option>
                        <option value="Both Side">Both Side</option>
                      </select>
                    </div>
                    <div>
                      <label className="eng-label mb-1">Extension Carriage Width (m)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 3.65"
                        value={formData.proposed_extension_carriage_width_m || ''}
                        onChange={e => setFormData({ ...formData, proposed_extension_carriage_width_m: e.target.value ? parseFloat(e.target.value) : '' })}
                        className="eng-input eng-input-plum font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      {/* ====================================================================== */}
      {/* [CLV-TAB-05] PHOTOS, DRAWINGS & DEMAND LETTERS */}
      {/* ====================================================================== */}
      <div
        id="panel-CLV-TAB-05"
        role="tabpanel"
        aria-labelledby="tab-CLV-TAB-05"
        className={`space-y-4 ${activeTab === 'CLV-TAB-05' ? 'tab-pane-active' : 'hidden'}`}
        onKeyDown={handleFormKeyDown}
      >
          {/* Section 1: Demand Letters */}
          <div className="eng-panel">
            <div className="eng-section-header accent-plum">
              <span>Official Institutional Demand Letters (ACE / SE / EE)</span>
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
                    <option value="">All Demand Letters Uploaded (EE, SE, ACE)</option>
                  ) : (
                    availableDemandOptions.map((opt) => (
                      <option key={opt.type} value={opt.type}>
                        {opt.label}
                      </option>
                    ))
                  )}
                </select>

                {canEditPlacement && availableDemandOptions.length > 0 && (
                  <label className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center space-x-1 cursor-pointer rounded-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingSlot === `demand_letter_${demandOfficerType.toLowerCase()}` ? 'Uploading...' : 'Upload Demand Letter'}</span>
                    <input
                      type="file"
                      onChange={(e) => {
                        if (e.target.files[0]) {
                          handleFileUpload(
                            `demand_letter_${demandOfficerType.toLowerCase()}`,
                            e.target.files[0],
                            demandOfficerType,
                          );
                          e.target.value = '';
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Uploaded Demand Letters List */}
              <div className="divide-y divide-slate-200 border border-slate-300 rounded-xs text-xs">
                {attachments.filter((a) => a.slot_code.startsWith('demand_letter')).length === 0 ? (
                  <div className="p-3 text-slate-500 text-center">
                    No demand letters uploaded yet.
                  </div>
                ) : (
                  attachments
                    .filter((a) => a.slot_code.startsWith('demand_letter'))
                    .map((att) => (
                      <div
                        key={att.id}
                        className="p-2 flex items-center justify-between hover:bg-slate-50"
                      >
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-sky-700" />
                          <span className="font-bold text-slate-800">
                            [{att.demand_officer_type || 'OFFICER'}]
                          </span>
                          <a
                            href={`/uploads/${att.stored_file_name}`}
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
                            href={`/uploads/${att.stored_file_name}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-0.5 text-[11px] font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded border border-sky-200"
                          >
                            View
                          </a>
                          {canEditPlacement && (
                            <button
                              type="button"
                              onClick={() => handleDeleteAttachment(att.id)}
                              className="text-red-600 hover:text-red-800 p-1 cursor-pointer"
                              title="Delete attachment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Technical Reports & Drawings */}
          <div className="eng-panel">
            <div className="eng-section-header accent-plum">
              <span>Culvert Soil Reports &amp; Cross-Section Drawings</span>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Site Plan */}
              <div className="p-3.5 rounded-xs space-y-2">
                <div className="font-bold text-[#001139]">
                  Site Plan / Catchment Map
                </div>
                {canEditPlacement && (
                  <label className="px-3 py-1.5 rounded-xs bg-[#00225a] hover:bg-[#034081] text-white text-xs font-semibold inline-flex items-center space-x-1.5 cursor-pointer shadow-xs transition-all">
                    <Upload className="w-3.5 h-3.5 text-cyan-300" />
                    <span>{uploadingSlot === 'site_plan' ? 'Uploading...' : 'Upload Site Plan'}</span>
                    <input
                      type="file"
                      accept=".pdf,.dwg,.dxf,.png,.jpg,.jpeg"
                      onChange={(e) => {
                        if (e.target.files[0]) {
                          handleFileUpload('site_plan', e.target.files[0]);
                          e.target.value = '';
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                )}
                <div className="space-y-1 text-[11px]">
                  {attachments.filter((a) => a.slot_code === 'site_plan').length === 0 && (
                    <div className="text-[11px] text-slate-500 italic py-1">No site plan attached.</div>
                  )}
                  {attachments.filter((a) => a.slot_code === 'site_plan').map((a) => (
                    <div key={a.id} className="flex justify-between items-center text-slate-800 bg-white/60 p-1.5 rounded-lg border border-white/80">
                      <a href={`/uploads/${a.stored_file_name}`} target="_blank" rel="noopener noreferrer" className="truncate max-w-[150px] text-sky-700 hover:underline font-medium">
                        {a.file_name}
                      </a>
                      <div className="flex items-center space-x-1">
                        <a href={`/uploads/${a.stored_file_name}`} target="_blank" rel="noopener noreferrer" className="px-1.5 py-0.5 text-[10px] text-sky-700 bg-sky-50 rounded border border-sky-200">View</a>
                        {canEditPlacement && (
                          <button onClick={() => handleDeleteAttachment(a.id)} className="text-red-600 font-bold hover:text-red-800 cursor-pointer">✕</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cross Section */}
              <div className="p-3.5 rounded-xs space-y-2">
                <div className="font-bold text-[#001139]">
                  Cross-Sections / Barrel Layout
                </div>
                {canEditPlacement && (
                  <label className="px-3 py-1.5 rounded-xs bg-[#00225a] hover:bg-[#034081] text-white text-xs font-semibold inline-flex items-center space-x-1.5 cursor-pointer shadow-xs transition-all">
                    <Upload className="w-3.5 h-3.5 text-cyan-300" />
                    <span>{uploadingSlot === 'cross_section' ? 'Uploading...' : 'Upload Cross-Section'}</span>
                    <input
                      type="file"
                      accept=".pdf,.dwg,.dxf,.png,.jpg,.jpeg"
                      onChange={(e) => {
                        if (e.target.files[0]) {
                          handleFileUpload('cross_section', e.target.files[0]);
                          e.target.value = '';
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                )}
                <div className="space-y-1 text-[11px]">
                  {attachments.filter((a) => a.slot_code === 'cross_section').length === 0 && (
                    <div className="text-[11px] text-slate-500 italic py-1">No cross-section attached.</div>
                  )}
                  {attachments.filter((a) => a.slot_code === 'cross_section').map((a) => (
                    <div key={a.id} className="flex justify-between items-center text-slate-800 bg-white/60 p-1.5 rounded-lg border border-white/80">
                      <a href={`/uploads/${a.stored_file_name}`} target="_blank" rel="noopener noreferrer" className="truncate max-w-[150px] text-sky-700 hover:underline font-medium">
                        {a.file_name}
                      </a>
                      <div className="flex items-center space-x-1">
                        <a href={`/uploads/${a.stored_file_name}`} target="_blank" rel="noopener noreferrer" className="px-1.5 py-0.5 text-[10px] text-sky-700 bg-sky-50 rounded border border-sky-200">View</a>
                        {canEditPlacement && (
                          <button onClick={() => handleDeleteAttachment(a.id)} className="text-red-600 font-bold hover:text-red-800 cursor-pointer">✕</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Directional Photos */}
          <div className="eng-panel">
            <div className="eng-section-header accent-plum">
              <span>Proposed Culvert Site Photos & Directional Diagrams</span>
            </div>
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {['East', 'West', 'North', 'South'].map(dir => (
                <div key={dir} className=" rounded-xs text-center space-y-2 ">
                  <span className="font-bold uppercase text-[#001139] block">
                    {dir} Direction Photo
                  </span>
                  {canEditPlacement && (
                    <label className="w-full py-1.5 rounded-xs bg-transparent hover:bg-slate-200 text-[#00225a]  text-[11px] font-semibold border border-slate-500 block cursor-pointer transition-all shadow-xs">
                      <span>{uploadingSlot === `clv_photo_${dir.toLowerCase()}` ? 'Uploading...' : 'Select Image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          if (e.target.files[0]) {
                            handleFileUpload(`clv_photo_${dir.toLowerCase()}`, e.target.files[0]);
                            e.target.value = '';
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                  {attachments.find(a => a.slot_code === `clv_photo_${dir.toLowerCase()}`) ? (
                    <div className="space-y-1">
                      <div className="text-emerald-700 font-mono text-[10px] font-bold bg-emerald-100/80 rounded-md py-0.5 border border-emerald-300">Image Attached ✓</div>
                      <div className="flex items-center justify-center space-x-2 text-[10px]">
                        <a
                          href={`/uploads/${attachments.find(a => a.slot_code === `clv_photo_${dir.toLowerCase()}`).stored_file_name}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-700 hover:underline"
                        >
                          View
                        </a>
                        {canEditPlacement && (
                          <button
                            type="button"
                            onClick={() => handleDeleteAttachment(attachments.find(a => a.slot_code === `clv_photo_${dir.toLowerCase()}`).id)}
                            className="text-red-500 hover:text-red-700 cursor-pointer"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-500 text-[10px]">No file attached</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

      {/* ====================================================================== */}
      {/* [CLV-TAB-06] WEBMAP GIS & BORELOGS */}
      {/* ====================================================================== */}
      <div
        id="panel-CLV-TAB-06"
        role="tabpanel"
        aria-labelledby="tab-CLV-TAB-06"
        className={activeTab === 'CLV-TAB-06' ? 'tab-pane-active' : 'hidden'}
      >
        <RhdWebmapBorelogForm
          structureCode={formData.code}
          acquisitionType="CULVERT"
          acquisitionId={acquisitionId}
          totalBoreholes={formData.total_borehole_count}
          readOnly={!canEditPlacement}
          onBoreholeCountChange={count => setFormData({ ...formData, total_borehole_count: count })}
        />
      </div>
      </fieldset>

      {/* CLV-TAB-07: Prepared Design Deliverables Package */}
      <div
        id="panel-CLV-TAB-07"
        role="tabpanel"
        aria-labelledby="tab-CLV-TAB-07"
        tabIndex={0}
        className={`space-y-6 focus:outline-none ${activeTab === 'CLV-TAB-07' ? 'tab-pane-active' : 'hidden'}`}
      >
        <PreparedDesignPackageCard
          formData={formData}
          setFormData={setFormData}
          attachments={attachments}
          onUpload={handleFileUpload}
          onDeleteAttachment={handleDeleteAttachment}
          uploadingSlot={uploadingSlot}
          currentUser={currentUser}
          structureType="culvert"
          onTransition={handleTransition}
          vestedDivisionName={formData.assigned_bdd_division_name}
        />
      </div>

      {/* CLV-TAB-08: Audit & Change History */}
      <div
        id="panel-CLV-TAB-08"
        role="tabpanel"
        aria-labelledby="tab-CLV-TAB-08"
        tabIndex={0}
        className={`space-y-6 focus:outline-none ${activeTab === 'CLV-TAB-08' ? 'tab-pane-active' : 'hidden'}`}
      >
        <DemandPlacementAuditLog
          acquisitionType="CULVERT"
          acquisitionId={acquisitionId}
        />
      </div>

      {/* Bottom Command Strip */}
      <div className="sticky bottom-2 z-30 glass-panel border border-white/80 p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xl backdrop-blur-md rounded-2xl mb-2">
        <div className="flex items-center space-x-3 text-xs font-mono">
          <span className="text-slate-600 font-semibold">Active Datum:</span>
          <span className="px-2.5 py-1 bg-white/60 rounded-xs text-[#8e4b7b] font-bold border border-slate-300">
            R.L. in {datum}
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-600 font-semibold">Current Stage:</span>
          <span className="px-2.5 py-1 bg-[#7a3869] text-white rounded-xs font-bold">
            {formData.workflow_status || 'DRAFT_FIELD'}
          </span>
        </div>

        {/* Dynamic Actions */}
        <div className="flex items-center space-x-2 font-mono text-xs flex-wrap">
          {/* Field SAE / SDE / EE Action */}
          {['DRAFT_FIELD', 'RETURNED_FOR_CORRECTION'].includes(formData.workflow_status) && (
            <button
              type="button"
              onClick={() => handleTransition('FORWARD_TO_EE', 'Submitted to Executive Engineer for Authorization')}
              className="px-4 py-2 rounded-xl bg-[#7a3869] hover:bg-[#632854] text-white font-bold flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>SUBMIT TO FIELD EE FOR AUTH</span>
            </button>
          )}

          {/* Field EE Authorization & Customary Pass */}
          {formData.workflow_status === 'PENDING_FIELD_EE_AUTH' &&
            ['FIELD_EE', 'SUPREME'].includes(currentUser?.role) && (
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
                      'PASS_TO_FIELD_SDE',
                      'Transferred by Field EE to Field SDE for customary verification',
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
                      'TRANSMIT_TO_DESIGN_EE',
                      'Authorized by Field Division EE and transmitted directly to Bridge Design Division EE',
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
          {formData.workflow_status === 'PASS_TO_FIELD_SDE' &&
            ['FIELD_SDE', 'FIELD_EE', 'SUPREME'].includes(currentUser?.role) && (
              <>
                {['FIELD_EE', 'SUPREME'].includes(currentUser?.role) && (
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
                      'SDE_VERIFY_TO_EE',
                      'Verified by Field SDE and returned to Field EE',
                    )
                  }
                  className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>VERIFY & RETURN TO FIELD EE</span>
                </button>

                {['FIELD_EE', 'SUPREME'].includes(currentUser?.role) && (
                  <button
                    type="button"
                    onClick={() =>
                      handleTransition(
                        'TRANSMIT_TO_DESIGN_EE',
                        'Transmitted directly to Bridge Design Division EE',
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
          {['TRANSMITTED_TO_BDD_EE', 'ASSIGNED_TO_BDD_EE', 'FORWARDED_TO_BDC_SE'].includes(
            formData.workflow_status,
          ) &&
            ['BDD_EE', 'SUPREME'].includes(currentUser?.role) && (
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
                      'ASSIGN_TO_BDD_SDE',
                      'Assigned by BDD EE to Bridge Design SDE for modeling & deliverables',
                    )
                  }
                  className="px-4 py-2 rounded-xl bg-[#034081] hover:bg-[#00225a] text-white font-bold flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ASSIGN TO DESIGN SDE</span>
                </button>
              </>
            )}

          {/* Bridge Design SDE: Submit Prepared Design to BDD EE */}
          {formData.workflow_status === 'ASSIGNED_TO_BDD_SDE' &&
            ['BDD_SDE', 'BDD_EE', 'SUPREME'].includes(currentUser?.role) && (
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
                    setActiveTab('CLV-TAB-07');
                    handleTransition(
                      'SUBMIT_DESIGN_TO_EE',
                      'Prepared culvert design package submitted by BDD SDE to Division EE',
                    );
                  }}
                  className="px-4 py-2 rounded-xl bg-[#7a3869] hover:bg-[#632854] text-white font-bold flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>SUBMIT PREPARED DESIGN TO BDD EE</span>
                </button>
              </>
            )}

          {/* BDD EE: Approve Prepared Design & Transmit Directly to Field EE */}
          {formData.workflow_status === 'DESIGN_PREPARED_PENDING_EE' &&
            ['BDD_EE', 'SUPREME'].includes(currentUser?.role) && (
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
                      'APPROVE_AND_TRANSMIT',
                      'Culvert design deliverables approved by Bridge Design Division EE and transmitted directly to Field EE',
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
          {formData.workflow_status === 'DESIGN_APPROVED_COMPLETE' &&
            ['FIELD_EE', 'SUPREME'].includes(currentUser?.role) && (
              <button
                type="button"
                onClick={() =>
                  handleTransition(
                    'DISPATCH_TO_FIELD_SDE',
                    'Culvert design deliverables dispatched by Field Division EE to Field SDE for site execution',
                  )
                }
                className="px-4 py-2 rounded-xl bg-[#7a3869] hover:bg-[#632854] text-white font-bold flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>DISPATCH DESIGN TO FIELD SDE</span>
              </button>
            )}

          {/* Field SDE Dispatched State Confirmation */}
          {formData.workflow_status === 'DISPATCHED_TO_FIELD_SDE' && (
            <div className="flex items-center space-x-2 text-emerald-800 font-bold">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>DELIVERED TO FIELD SDE - EXECUTION ACTIVE</span>
            </div>
          )}
        </div>
      </div>

      {/* End Right Column #culvert-workspace-form-pane & 2-Column Workspace Frame */}
        </div>
      </div>

      {showReturnModal && (
        <ReturnForCorrectionModal
          item={{ ...formData, type: 'CULVERT', id: acquisitionId }}
          onClose={() => setShowReturnModal(false)}
          onSuccess={() => loadRecord(acquisitionId)}
        />
      )}
    </div>
  );
}
