const API_BASE = import.meta?.env?.VITE_API_BASE || '';

export async function scanAccount(payload) {
  const res = await fetch(`${API_BASE}/api/accounts/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Scan failed');
  return res.json();
}

export async function getDaily(days = 30) {
  const res = await fetch(`${API_BASE}/api/analytics/daily?days=${days}`);
  return res.json();
}

export async function getTopReported(limit = 10) {
  const res = await fetch(`${API_BASE}/api/analytics/top-reported?limit=${limit}`);
  return res.json();
}

export async function getGeo() {
  const res = await fetch(`${API_BASE}/api/analytics/geo`);
  return res.json();
}

export async function getFlags() {
  const res = await fetch(`${API_BASE}/api/admin/flags`);
  return res.json();
}

export async function flagAction(id, action) {
  const res = await fetch(`${API_BASE}/api/admin/flags/${id}/actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action })
  });
  return res.json();
}

// New API functions for database integration
export async function getAllAccounts(page = 1, limit = 20, filters = {}) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...filters
  });
  
  const res = await fetch(`${API_BASE}/api/accounts?${params}`);
  if (!res.ok) throw new Error('Failed to fetch accounts');
  return res.json();
}

export async function getAccountById(accountId) {
  const res = await fetch(`${API_BASE}/api/accounts/${accountId}`);
  if (!res.ok) throw new Error('Failed to fetch account');
  return res.json();
}

export async function getAccountScanHistory(accountId, limit = 10, offset = 0) {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString()
  });
  
  const res = await fetch(`${API_BASE}/api/accounts/${accountId}/scans?${params}`);
  if (!res.ok) throw new Error('Failed to fetch scan history');
  return res.json();
}

export async function getAnalyticsData() {
  const res = await fetch(`${API_BASE}/api/analytics/summary`);
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

export async function getReportCount(accountId) {
  const res = await fetch(`${API_BASE}/api/reports/count/${accountId}`);
  if (!res.ok) throw new Error('Failed to fetch report count');
  return res.json();
}


// ML endpoints
export async function mlHealth() {
  const res = await fetch(`${API_BASE}/api/ml/health`);
  if (!res.ok) throw new Error('ML health failed');
  return res.json();
}

export async function mlTrain() {
  const res = await fetch(`${API_BASE}/api/ml/train`, { method: 'POST' });
  if (!res.ok) throw new Error('ML train failed');
  return res.json();
}

export async function mlPredict(payload) {
  const res = await fetch(`${API_BASE}/api/ml/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('ML predict failed');
  return res.json();
}

export async function mlScan(platform, username) {
  const res = await fetch(`${API_BASE}/api/ml/scan/${encodeURIComponent(platform)}/${encodeURIComponent(username)}`);
  if (!res.ok) throw new Error('ML scan failed');
  return res.json();
}

export async function submitReport(reportData) {
  const res = await fetch(`${API_BASE}/api/reports/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reportData)
  });
  if (!res.ok) throw new Error('Failed to submit report');
  return res.json();
}




