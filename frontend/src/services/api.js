const API_BASE = '/api';

export const getStoredToken = () => localStorage.getItem('rhd_obddas_token');
export const setStoredToken = (token) => {
  if (token) localStorage.setItem('rhd_obddas_token', token);
  else localStorage.removeItem('rhd_obddas_token');
};

export const getStoredUser = () => {
  const u = localStorage.getItem('rhd_obddas_user');
  return u ? JSON.parse(u) : null;
};
export const setStoredUser = (user) => {
  if (user) localStorage.setItem('rhd_obddas_user', JSON.stringify(user));
  else localStorage.removeItem('rhd_obddas_user');
};

async function request(endpoint, options = {}) {
  const token = getStoredToken();
  const headers = {
    ...(options.headers || {})
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorDetail = `Request failed (${response.status})`;
    try {
      const err = await response.json();
      errorDetail = err.detail || err.message || errorDetail;
    } catch (_) {}
    throw new Error(errorDetail);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  return response;
}

export const api = {
  // --- Auth & Role Switcher ---
  login: async (username, password) => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    setStoredToken(res.access_token);
    setStoredUser(res.user);
    return res;
  },

  switchRole: async (target) => {
    const payload = typeof target === 'string' ? { target_role: target } : target;
    const res = await request('/auth/switch-role', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    setStoredToken(res.access_token);
    setStoredUser(res.user);
    return res;
  },

  getCurrentUser: () => request('/auth/me'),

  // --- Master Data Hierarchy ---
  getZones: () => request('/master/zones'),
  getCircles: (zoneId) => request(`/master/circles${zoneId ? `?zone_id=${zoneId}` : ''}`),
  getDivisions: (circleId) => request(`/master/divisions${circleId ? `?circle_id=${circleId}` : ''}`),
  getMasterDivisions: () => request('/master/divisions'),
  getRoadTypes: () => request('/master/road-types'),
  getRoads: (roadTypeId, divisionId, search) => {
    const params = new URLSearchParams();
    if (roadTypeId) params.append('road_type_id', roadTypeId);
    if (divisionId) params.append('division_id', divisionId);
    if (search) params.append('search', search);
    return request(`/master/roads?${params.toString()}`);
  },
  createZone: (data) => request(`/master/zones?name=${encodeURIComponent(data.name)}&code=${encodeURIComponent(data.code)}`, { method: 'POST' }),
  createCircle: (data) => request(`/master/circles?name=${encodeURIComponent(data.name)}&code=${encodeURIComponent(data.code)}&zone_id=${data.zone_id}`, { method: 'POST' }),
  createDivision: (data) => request(`/master/divisions?name=${encodeURIComponent(data.name)}&code=${encodeURIComponent(data.code)}&circle_id=${data.circle_id}`, { method: 'POST' }),
  createRoad: (data) => request(`/master/roads?road_number=${encodeURIComponent(data.road_number)}&road_name=${encodeURIComponent(data.road_name)}&road_type_id=${data.road_type_id}&division_id=${data.division_id || ''}&length_km=${data.length_km || 0}`, { method: 'POST' }),
  exportHierarchy: () => request('/master/hierarchy-export'),
  importHierarchy: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return request('/master/hierarchy-import', { method: 'POST', body: fd });
  },

  // --- User Management ---
  getUsers: () => request('/master/users'),
  createUser: (userData) => request('/master/users', { method: 'POST', body: JSON.stringify(userData) }),
  updateUser: (userId, userData) => request(`/master/users/${userId}`, { method: 'PUT', body: JSON.stringify(userData) }),

  // --- Bridge Acquisitions ---
  getBridges: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.zone_id) params.append('zone_id', filters.zone_id);
    if (filters.circle_id) params.append('circle_id', filters.circle_id);
    if (filters.division_id) params.append('division_id', filters.division_id);
    if (filters.search) params.append('search', filters.search);
    return request(`/acquisitions/bridge?${params.toString()}`);
  },
  getBridge: (id) => request(`/acquisitions/bridge/${id}`),
  createBridge: (data) => request('/acquisitions/bridge', { method: 'POST', body: JSON.stringify(data) }),
  updateBridge: (id, data) => request(`/acquisitions/bridge/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  transitionBridge: (id, transitionData) => request(`/acquisitions/bridge/${id}/transition`, { method: 'POST', body: JSON.stringify(transitionData) }),
  uploadBridgeAttachment: (id, slotCode, file, demandOfficerType = null) => {
    const fd = new FormData();
    fd.append('slot_code', slotCode);
    if (demandOfficerType) fd.append('demand_officer_type', demandOfficerType);
    fd.append('file', file);
    return request(`/acquisitions/bridge/${id}/upload`, { method: 'POST', body: fd });
  },
  getBridgeAttachments: (id) => request(`/acquisitions/bridge/${id}/attachments`),
  deleteBridgeAttachment: (id, attId) => request(`/acquisitions/bridge/${id}/attachments/${attId}`, { method: 'DELETE' }),
  getBridgeAuditLogs: (id) => request(`/acquisitions/bridge/${id}/audit-logs`),

  // --- Culvert Acquisitions ---
  getCulverts: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.zone_id) params.append('zone_id', filters.zone_id);
    if (filters.circle_id) params.append('circle_id', filters.circle_id);
    if (filters.division_id) params.append('division_id', filters.division_id);
    if (filters.search) params.append('search', filters.search);
    return request(`/acquisitions/culvert?${params.toString()}`);
  },
  getCulvert: (id) => request(`/acquisitions/culvert/${id}`),
  createCulvert: (data) => request('/acquisitions/culvert', { method: 'POST', body: JSON.stringify(data) }),
  updateCulvert: (id, data) => request(`/acquisitions/culvert/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  transitionCulvert: (id, transitionData) => request(`/acquisitions/culvert/${id}/transition`, { method: 'POST', body: JSON.stringify(transitionData) }),
  uploadCulvertAttachment: (id, slotCode, file, demandOfficerType = null) => {
    const fd = new FormData();
    fd.append('slot_code', slotCode);
    if (demandOfficerType) fd.append('demand_officer_type', demandOfficerType);
    fd.append('file', file);
    return request(`/acquisitions/culvert/${id}/upload`, { method: 'POST', body: fd });
  },
  getCulvertAttachments: (id) => request(`/acquisitions/culvert/${id}/attachments`),
  deleteCulvertAttachment: (id, attId) => request(`/acquisitions/culvert/${id}/attachments/${attId}`, { method: 'DELETE' }),
  getCulvertAuditLogs: (id) => request(`/acquisitions/culvert/${id}/audit-logs`),

  // --- Webmap & Borelogs ---
  extractCoordinates: (inputText) => request('/webmap/extract-coordinates', {
    method: 'POST',
    body: JSON.stringify({ input_text: inputText })
  }),
  getBorelogs: (acqType, acqId) => request(`/webmap/borelogs/${acqType}/${acqId}`),
  saveBorelog: (acqType, acqId, data) => request(`/webmap/borelogs/${acqType}/${acqId}`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  syncWebmapBorelog: (payload) => request('/webmap/sync-borelogs', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getWebmapFeaturesGeoJSON: () => request('/webmap/features.geojson'),

  // --- Supreme Operations Console ---
  getSupremeTasks: () => request('/supreme/tasks'),
  runSupremeTask: (taskType, paramsJson = null) => request('/supreme/tasks/run', {
    method: 'POST',
    body: JSON.stringify({ task_type: taskType, params_json: paramsJson })
  }),
  getSupremeAuditLogs: (acquisitionType = null, limit = 100) => {
    const params = new URLSearchParams();
    if (acquisitionType) params.append('acquisition_type', acquisitionType);
    params.append('limit', limit);
    return request(`/supreme/audit-logs?${params.toString()}`);
  },
  overrideSupremeState: (req) => request('/supreme/override-state', {
    method: 'POST',
    body: JSON.stringify(req)
  }),
  getSupremeDesignDivisions: () => request('/supreme/design-divisions'),
  createSupremeDesignDivision: (data) => request('/supreme/design-divisions', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateSupremeDesignDivision: (id, data) => request(`/supreme/design-divisions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deactivateSupremeDesignDivision: (id) => request(`/supreme/design-divisions/${id}`, {
    method: 'DELETE'
  }),

  // --- Design Pipeline & Bottleneck Tracking ---
  getDesignDemands: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.design_state) params.append('design_state', filters.design_state);
    if (filters.design_division_id) params.append('design_division_id', filters.design_division_id);
    if (filters.field_division_id) params.append('field_division_id', filters.field_division_id);
    if (filters.search) params.append('search', filters.search);
    return request(`/pipeline/design-demands?${params.toString()}`);
  },
  updateDesignDemandStatus: (acqType, id, data) => request(`/pipeline/design-demands/${acqType}/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  getPipelineKpiSummary: () => request('/pipeline/kpi-summary'),

  // --- Engineering Exports (PDF / Excel / ZIP) ---
  getExportUrl: (acqType, id, format = 'pdf') => {
    const token = getStoredToken();
    const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
    return `${API_BASE}/acquisitions/${acqType}/${id}/export-${format}${tokenParam}`;
  },
  downloadExport: async (acqType, id, format = 'pdf') => {
    const token = getStoredToken();
    const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
    const res = await fetch(`${API_BASE}/acquisitions/${acqType}/${id}/export-${format}${tokenParam}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      let detail = `Export download failed (${res.status})`;
      try {
        const err = await res.json();
        detail = err.detail || err.message || detail;
      } catch (_) {}
      throw new Error(detail);
    }
    const blob = await res.blob();
    const disposition = res.headers.get('Content-Disposition');
    let filename = `${acqType}_${id}_export.${format === 'excel' ? 'xlsx' : format}`;
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) filename = match[1];
    }
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    return true;
  },

  // --- Network Attached Storage (NAS) & Nextcloud Staging ---
  getNasStatus: () => request('/nas/status'),
  syncAllNasRecords: () => request('/nas/sync-all', { method: 'POST' }),
  getAttachmentDownloadUrl: (attId) => `/api/attachments/${attId}/download`,
  downloadAttachment: async (attId, fallbackFilename = 'attachment.pdf') => {
    const token = getStoredToken();
    const res = await fetch(`/api/attachments/${attId}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      let detail = `Attachment download failed (${res.status})`;
      try {
        const err = await res.json();
        detail = err.detail || err.message || detail;
      } catch (_) {}
      throw new Error(detail);
    }
    const blob = await res.blob();
    const disposition = res.headers.get('Content-Disposition');
    let filename = fallbackFilename;
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) filename = match[1];
    }
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    return true;
  }
};
