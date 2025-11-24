import axios from "axios";

const API_BASE_URL = "http://192.168.3.116:5075/api";

function buildRequestBody(filters = {}) {
  return {
    fromDate: filters.fromDate || null,
    toDate: filters.toDate || null,
    month: filters.month || null,
    year: filters.year || null,
    verticals: filters.verticals || [],
    bdNames: filters.bdNames || [],
    clientNames: filters.clientNames || [],
    labs: filters.labNames || [],
    dateField: filters.dateField || "inqDate",
    excludeVerticals: filters.excludeVerticals,
    excludeBds: filters.excludeBds,
    excludeClients: filters.excludeClients,
    excludeLabs: filters.excludeLabs
  };
}

// ===================================================================
// ======================== BD PROJECTIONS ============================
// ===================================================================

export async function getAllBdProjection(filter = {}) {
  console.log("PROJECTION",filter)
  const response = await axios.post(
    `${API_BASE_URL}/projections/get`,
    filter,
    { headers: { "Content-Type": "application/json" } }
  );
  return response.data;
}

export async function createBdProjection(body = {}) {
  console.log(body)
  const response = await axios.post(
    `${API_BASE_URL}/projections/create`,
    body,
    { headers: { "Content-Type": "application/json" } }
  );
  return response.data;
}

export async function updateBdProjection(id, body = {}) {
  console.log(id, body)
  const response = await axios.put(
    `${API_BASE_URL}/projections/update/${id}`,
    body,
    { headers: { "Content-Type": "application/json" } }
  );
  return response.data;
}

export async function deleteBdProjection(id) {
  console.log(id)
  const response = await axios.delete(
    `${API_BASE_URL}/projections/delete/${id}`,
    { headers: { "Content-Type": "application/json" } }
  );
  return response.data;
}

export async function getBdProjectionById(id) {
  console.log(filter)
  const response = await axios.get(`${API_BASE_URL}/projections/get/${id}`, {
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
}

// ===================================================================
// ========================== BD TARGETS ==============================
// ===================================================================

export async function getAllBdTargets(filter = {}) {
  console.log("TARGETS",filter)
  const response = await axios.post(
    `${API_BASE_URL}/target/get`,
    filter,
    { headers: { "Content-Type": "application/json" } }
  );
  return response.data;
}

export async function createBdTarget(body = {}) {
  console.log(body)
  const response = await axios.post(
    `${API_BASE_URL}/target/create`,
    body,
    { headers: { "Content-Type": "application/json" } }
  );
  return response.data;
}

export async function updateBdTarget(id, body = {}) {
  console.log(id, body)
  const response = await axios.put(
    `${API_BASE_URL}/target/update/${id}`,
    body,
    { headers: { "Content-Type": "application/json" } }
  );
  return response.data;
}

export async function deleteBdTarget(id) {
  console.log(id)
  const response = await axios.delete(
    `${API_BASE_URL}/target/delete/${id}`,
    { headers: { "Content-Type": "application/json" } }
  );
  return response.data;
}

export async function getBdTargetById(id) {
  const response = await axios.get(`${API_BASE_URL}/target/get/${id}`, {
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
}

export async function getAssociateClients(bdCode) {
  const response = await axios.get(`${API_BASE_URL}/projections/clients/get/${bdCode}`, {
    headers: { "Content-Type": "application/json" },
  });
  console.log("assoc-clients", bdCode, response.data)
  return response.data;
}

// ===================================================================
// ======================== LAB & BUSINESS ============================
// ===================================================================

export async function getSampleOverview(filters = {}) {
  const body = buildRequestBody(filters);
  const response = await axios.post(
    `${API_BASE_URL}/lab/sample-overview`,
    body,
    { headers: { "Content-Type": "application/json" } }
  );
  return response.data;
}

export async function getLabSummaries(filters = {}) {
  const body = buildRequestBody(filters);
  const response = await axios.post(`${API_BASE_URL}/lab/summaries`, body, {
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
}

export async function getSampleSummaries(filters = {}) {
  const body = buildRequestBody(filters);
  const response = await axios.post(`${API_BASE_URL}/lab/samples`, body, {
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
}

export async function getSampleDetailsByRegNo(regNo) {
  const response = await axios.post(
    `${API_BASE_URL}/lab/sample-details`,
    regNo,
    { headers: { "Content-Type": "application/json" } }
  );
  return response.data;
}

export async function getLabNames(filters = {}) {
  const body = buildRequestBody(filters);
  const response = await axios.post(`${API_BASE_URL}/lab/names`, body, {
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
}

export async function getBdBusinessSummary(filters = {}) {
  const body = buildRequestBody(filters);
  const response = await axios.post(
    `${API_BASE_URL}/business/bd-business-overview`,
    body,
    { headers: { "Content-Type": "application/json" } }
  );
  return response.data;
}

export async function getMtoMBusinessComparison(filters = {}) {
  console.log(filters);
  const response = await axios.post(
    `${API_BASE_URL}/business/bd-business-comparison`,
    filters,
    { headers: { "Content-Type": "application/json" } }
  );
  return response.data;
}

// ===================================================================
// ============================ INQUIRIES =============================
// ===================================================================

export async function getInquiries(filters = {}) {
  console.log(filters)
  const body = buildRequestBody(filters);
  const response = await axios.post(`${API_BASE_URL}/inquiries`, body, {
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
}

export async function getProjections(filters = {}) {
  const body = buildRequestBody(filters);
  const response = await axios.post(`${API_BASE_URL}/projections`, body, {
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
}

export async function getVerticals(filters = {}) {
  const body = buildRequestBody(filters);
  const response = await axios.post(`${API_BASE_URL}/inquiries/verticals`, body, {
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
}

export async function getBdNames(filters = {}) {
  const body = buildRequestBody(filters);
  const response = await axios.post(`${API_BASE_URL}/inquiries/bdnames`, body, {
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
}

export async function getClientNames(filters = {}) {
  const body = buildRequestBody(filters);
  const response = await axios.post(`${API_BASE_URL}/inquiries/clientnames`, body, {
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
}

export async function login(filters = {}) {
  console.log(filters)
  const response = await axios.post(`${API_BASE_URL}/auth/login`, filters, {
    headers: { "Content-Type": "application/json" },
  });
  console.log(response.data)
  return response.data;
}

// ===================================================================
// ============================ QUOTATIONS =============================
// ===================================================================

export async function getPendingQuotations(filters = {}) {
  console.log(filters)
  const response = await axios.post(`${API_BASE_URL}/quotations/pending`, filters, {
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
}

export async function updateQuotationStatus(quotNo, isLive, closingRemarks) {

  let body = { quotNo: quotNo, isLive: isLive, closingRemarks: closingRemarks}

  const response = await axios.patch(`${API_BASE_URL}/quotations/update-status`, body, {
    headers: { "Content-Type": "application/json" },
  });

  return response.data;
}

