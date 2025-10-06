import React, { useState, useEffect } from 'react';
import { getAllAccounts, getAccountScanHistory } from '../api.js';

export default function AccountsList() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    riskCategory: '',
    minTrustScore: '',
    maxTrustScore: ''
  });
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);

  const loadAccounts = async (pageNum = 1, filterData = filters) => {
    try {
      setLoading(true);
      const response = await getAllAccounts(pageNum, 20, filterData);
      setAccounts(response.accounts);
      setTotalPages(response.pagination.pages);
      setPage(response.pagination.page);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadScanHistory = async (accountId) => {
    try {
      const response = await getAccountScanHistory(accountId, 5);
      setScanHistory(response.scanHistory);
    } catch (err) {
      console.error('Failed to load scan history:', err);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    loadAccounts(1, newFilters);
  };

  const handleAccountClick = (account) => {
    setSelectedAccount(account);
    loadScanHistory(account.accountId);
  };

  const getRiskColor = (riskCategory) => {
    switch (riskCategory) {
      case 'Safe': return '#10b981';
      case 'Suspicious': return '#f59e0b';
      case 'High Risk': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && accounts.length === 0) {
    return (
      <div className="panel">
        <h3>Loading accounts...</h3>
        <div className="loading">⏳</div>
      </div>
    );
  }

  return (
    <div className="grid-2">
      <div className="panel" style={{ gridColumn: '1 / -1' }}>
        <h3>Database Accounts ({accounts.length} total)</h3>
        
        {/* Filters */}
        <div className="filters" style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <select 
            value={filters.riskCategory} 
            onChange={(e) => handleFilterChange('riskCategory', e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #374151' }}
          >
            <option value="">All Risk Categories</option>
            <option value="Safe">Safe</option>
            <option value="Suspicious">Suspicious</option>
            <option value="High Risk">High Risk</option>
          </select>
          
          <input
            type="number"
            placeholder="Min Trust Score"
            value={filters.minTrustScore}
            onChange={(e) => handleFilterChange('minTrustScore', e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #374151', width: '120px' }}
          />
          
          <input
            type="number"
            placeholder="Max Trust Score"
            value={filters.maxTrustScore}
            onChange={(e) => handleFilterChange('maxTrustScore', e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #374151', width: '120px' }}
          />
          
          <button 
            onClick={() => loadAccounts(1, filters)}
            style={{ padding: '0.5rem 1rem', borderRadius: '4px', backgroundColor: '#3b82f6', color: 'white', border: 'none' }}
          >
            Refresh
          </button>
        </div>

        {error && (
          <div style={{ color: '#ef4444', marginBottom: '1rem' }}>
            Error: {error}
          </div>
        )}

        {/* Accounts Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Trust Score</th>
                <th>Risk Category</th>
                <th>Followers</th>
                <th>Posts</th>
                <th>Account Age</th>
                <th>Last Scanned</th>
                <th>Total Scans</th>
                <th>Reports</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.accountId}>
                  <td>
                    <strong>{account.username || account.accountId}</strong>
                  </td>
                  <td>
                    <span style={{ 
                      color: account.trustScore >= 80 ? '#10b981' : 
                             account.trustScore >= 50 ? '#f59e0b' : '#ef4444',
                      fontWeight: 'bold'
                    }}>
                      {account.trustScore}%
                    </span>
                  </td>
                  <td>
                    <span style={{ 
                      color: getRiskColor(account.riskCategory),
                      fontWeight: 'bold'
                    }}>
                      {account.riskCategory}
                    </span>
                  </td>
                  <td>{account.followerCount?.toLocaleString() || 0}</td>
                  <td>{account.postsCount || 0}</td>
                  <td>{account.accountAgeDays || 0} days</td>
                  <td>{formatDate(account.lastScannedAt)}</td>
                  <td>{account.totalScans || 0}</td>
                  <td>
                    <span style={{ 
                      color: account.reportCount > 0 ? '#ef4444' : '#10b981',
                      fontWeight: 'bold'
                    }}>
                      {account.reportCount || 0}
                    </span>
                  </td>
                  <td>
                    <button 
                      onClick={() => handleAccountClick(account)}
                      style={{ 
                        padding: '0.25rem 0.5rem', 
                        fontSize: '0.8rem',
                        backgroundColor: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
            <button 
              onClick={() => loadAccounts(page - 1, filters)}
              disabled={page <= 1}
              style={{ 
                padding: '0.5rem 1rem', 
                backgroundColor: page <= 1 ? '#374151' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: page <= 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Previous
            </button>
            <span style={{ padding: '0.5rem', color: '#9ca3af' }}>
              Page {page} of {totalPages}
            </span>
            <button 
              onClick={() => loadAccounts(page + 1, filters)}
              disabled={page >= totalPages}
              style={{ 
                padding: '0.5rem 1rem', 
                backgroundColor: page >= totalPages ? '#374151' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Account Details Modal */}
      {selectedAccount && (
        <div className="panel" style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
          <h3>Account Details: {selectedAccount.username || selectedAccount.accountId}</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <h4>Basic Information</h4>
              <p><strong>Account ID:</strong> {selectedAccount.accountId}</p>
              <p><strong>Username:</strong> {selectedAccount.username || 'N/A'}</p>
              <p><strong>Trust Score:</strong> {selectedAccount.trustScore}%</p>
              <p><strong>Risk Category:</strong> 
                <span style={{ color: getRiskColor(selectedAccount.riskCategory), marginLeft: '0.5rem' }}>
                  {selectedAccount.riskCategory}
                </span>
              </p>
            </div>
            <div>
              <h4>Statistics</h4>
              <p><strong>Followers:</strong> {selectedAccount.followerCount?.toLocaleString() || 0}</p>
              <p><strong>Following:</strong> {selectedAccount.followingCount?.toLocaleString() || 0}</p>
              <p><strong>Posts:</strong> {selectedAccount.postsCount || 0}</p>
              <p><strong>Account Age:</strong> {selectedAccount.accountAgeDays || 0} days</p>
              <p><strong>Reports:</strong> 
                <span style={{ 
                  color: selectedAccount.reportCount > 0 ? '#ef4444' : '#10b981',
                  fontWeight: 'bold',
                  marginLeft: '0.5rem'
                }}>
                  {selectedAccount.reportCount || 0} {selectedAccount.reportCount === 1 ? 'report' : 'reports'}
                </span>
              </p>
            </div>
          </div>

          {selectedAccount.reasonCodes && selectedAccount.reasonCodes.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <h4>Risk Reasons</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {selectedAccount.reasonCodes.map((reason, index) => (
                  <span 
                    key={index}
                    style={{ 
                      padding: '0.25rem 0.5rem', 
                      backgroundColor: '#374151', 
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '0.8rem'
                    }}
                  >
                    {reason}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4>Recent Scan History</h4>
            {scanHistory.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Scan Date</th>
                      <th>Scan Type</th>
                      <th>Trust Score</th>
                      <th>Risk Category</th>
                      <th>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scanHistory.map((scan, index) => (
                      <tr key={index}>
                        <td>{formatDate(scan.scannedAt)}</td>
                        <td>{scan.scanType}</td>
                        <td>{scan.computedResult?.trustScore || 'N/A'}%</td>
                        <td>
                          <span style={{ color: getRiskColor(scan.computedResult?.riskCategory) }}>
                            {scan.computedResult?.riskCategory || 'N/A'}
                          </span>
                        </td>
                        <td>{scan.scannerInfo?.source || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No scan history available</p>
            )}
          </div>

          <button 
            onClick={() => setSelectedAccount(null)}
            style={{ 
              marginTop: '1rem',
              padding: '0.5rem 1rem', 
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Close Details
          </button>
        </div>
      )}
    </div>
  );
}

