import React, { useState, useEffect } from 'react';
import { scanAccount, getReportCount, submitReport, mlPredict, mlScan, mlTrain, mlHealth } from '../api.js';
import Breakdown from './Breakdown.jsx';

export default function ScanForm() {
  const [form, setForm] = useState({
    Social_Media_Handles: '',
    accountId: '',
    follower_count: '',
    following_count: '',
    posts_count: '',
    account_age_days: '',
    Bio: '',
    sample_post: ''
  });
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [reportCount, setReportCount] = useState(0);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportForm, setReportForm] = useState({
    reportedBy: '',
    reason: '',
    priority: 'medium',
    description: '',
    evidence: []
  });
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportMessage, setReportMessage] = useState('');
  const [ml, setMl] = useState({ ok: false, model: false });
  const [scanSocial, setScanSocial] = useState({ platform: 'twitter', username: '' });
  const [mlResult, setMlResult] = useState(null);

  useEffect(() => {
    mlHealth().then(setMl).catch(() => setMl({ ok: false, model: false }));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const payload = {};
      for (const k of Object.keys(form)) {
        if (form[k] !== '') payload[k] = isNaN(form[k]) ? form[k] : Number(form[k]);
      }
      const res = await scanAccount(payload);
      setResult(res);
      
      // Fetch report count for this account
      if (res.success && res.account.accountId) {
        try {
          const reportData = await getReportCount(res.account.accountId);
          setReportCount(reportData.reportCount);
        } catch (error) {
          console.warn('Failed to fetch report count:', error);
          setReportCount(0);
        }
      }
      
      // Show success message
      if (res.success) {
        alert(`✅ Account scanned successfully!\n\nAccount: ${res.account.accountId}\nTrust Score: ${res.account.trustScore}%\nRisk Category: ${res.account.riskCategory}\n\nData saved to MongoDB Atlas database.`);
      }
    } catch (error) {
      alert(`❌ Scan failed: ${error.message}`);
    } finally {
      setBusy(false);
    }
  };

  const runMlPredict = async () => {
    setBusy(true);
    setMlResult(null);
    try {
      const payload = {};
      for (const k of Object.keys(form)) {
        if (form[k] !== '') payload[k] = isNaN(form[k]) ? form[k] : Number(form[k]);
      }
      const res = await mlPredict(payload);
      setMlResult(res);
    } catch (e) {
      alert(`ML predict failed: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const runMlScan = async () => {
    if (!scanSocial.username) return alert('Enter a username');
    setBusy(true);
    setMlResult(null);
    try {
      const res = await mlScan(scanSocial.platform, scanSocial.username);
      setMlResult(res);
    } catch (e) {
      alert(`ML scan failed: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const triggerTrain = async () => {
    setBusy(true);
    try {
      const res = await mlTrain();
      alert(`Model trained. AUC: ${res?.metrics?.roc_auc ?? 'n/a'}`);
      const h = await mlHealth();
      setMl(h);
    } catch (e) {
      alert(`Training failed: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!result?.account?.accountId) return;
    
    setIsSubmittingReport(true);
    setReportMessage('');

    try {
      const reportData = {
        accountId: result.account.accountId,
        ...reportForm
      };

      const response = await submitReport(reportData);

      if (response.success) {
        setReportMessage('✅ Report submitted successfully!');
        setReportForm({
          reportedBy: '',
          reason: '',
          priority: 'medium',
          description: '',
          evidence: []
        });
        setShowReportForm(false);
        
        // Refresh report count
        try {
          const reportData = await getReportCount(result.account.accountId);
          setReportCount(reportData.reportCount);
        } catch (error) {
          console.warn('Failed to refresh report count:', error);
        }
      } else {
        setReportMessage(`❌ Error: ${response.error}`);
      }
    } catch (error) {
      setReportMessage('❌ Failed to submit report. Please try again.');
      console.error('Report submission error:', error);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleReportInputChange = (e) => {
    const { name, value } = e.target;
    setReportForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="panel">
      <h3>Manual Scan</h3>
      <form onSubmit={submit}>
        <div className="input-row">


         <label>Social_Media_Handles
  <select
    value={form.Social_Media_Handles}
    onChange={e => setForm({ ...form, Social_Media_Handles: e.target.value })}
  >
    <option value="">Select Platform</option>
    <option value="Instagram">Instagram</option>
    <option value="Twitter">Twitter</option>
    <option value="Facebook">Facebook</option>
    <option value="Others">Others</option>

  </select>
</label>






          <label>Account ID
            <input value={form.accountId} onChange={e => setForm({ ...form, accountId: e.target.value })} placeholder="e.g. user_1" />
          </label>
          <label>Follower Count
            <input type="number" value={form.follower_count} onChange={e => setForm({ ...form, follower_count: e.target.value })} />
          </label>
          <label>Following Count
            <input type="number" value={form.following_count} onChange={e => setForm({ ...form, following_count: e.target.value })} />
          </label>
          <label>Posts Count
            <input type="number" value={form.posts_count} onChange={e => setForm({ ...form, posts_count: e.target.value })} />
          </label>
          <label>Account Age (days)
            <input type="number" value={form.account_age_days} onChange={e => setForm({ ...form, account_age_days: e.target.value })} />
          </label>

            <label>Bio
            <input value={form.Bio} placeholder='Enter bio ' onChange={e => setForm({ ...form, Bio: e.target.value })} />
          </label>




          <label>Sample Post
            <input value={form.sample_post} onChange={e => setForm({ ...form, sample_post: e.target.value })} placeholder="Text snippet" />
          </label>
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button type="submit" disabled={busy}>{busy ? 'Scanning...' : 'Scan'}</button>
          <button type="button" className="secondary" onClick={() => setForm({ accountId: '', follower_count: '', following_count: '', posts_count: '', account_age_days: '',Bio: '', sample_post: '' })}>Clear</button>
          <button type="button" className="secondary" onClick={runMlPredict} disabled={busy}>ML Predict</button>
          <button type="button" className="secondary" onClick={triggerTrain} disabled={busy || ml.model}>Train Model</button>
        </div>
      </form>

      <div style={{ marginTop: 16 }}>
        <h4>Social Media Scan (Twitter/X)</h4>
        <div className="input-row">
          <label>Platform
            <select value={scanSocial.platform} onChange={e => setScanSocial({ ...scanSocial, platform: e.target.value })}>
              <option value="twitter">Twitter</option>
              <option value="x">X</option>
            </select>
          </label>
          <label>Username
            <input value={scanSocial.username} onChange={e => setScanSocial({ ...scanSocial, username: e.target.value })} placeholder="e.g. nasa" />
          </label>
          <button type="button" onClick={runMlScan} disabled={busy}>Scan Username</button>
        </div>
      </div>

      {result && result.success && (
        <div style={{ marginTop: 18, padding: '1rem', backgroundColor: '#1f2937', borderRadius: '8px' }}>
          <h4>✅ Scan Result - Data Saved to Database</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <p><strong>Account ID:</strong> {result.account.accountId}</p>
              <p><strong>Username:</strong> {result.account.username || 'N/A'}</p>
              <p><strong>Trust Score:</strong> 
                <span style={{ 
                  color: result.account.trustScore >= 80 ? '#10b981' : 
                         result.account.trustScore >= 50 ? '#f59e0b' : '#ef4444',
                  fontWeight: 'bold',
                  marginLeft: '0.5rem'
                }}>
                  {result.account.trustScore}%
                </span>
              </p>
              <p><strong>Risk Category:</strong> 
                <span className={`badge ${result.account.riskCategory === 'High Risk' ? 'high' : result.account.riskCategory === 'Suspicious' ? 'suspicious' : 'safe'}`}>
                  {result.account.riskCategory}
                </span>
              </p>
            </div>
            <div>
              <p><strong>Followers:</strong> {result.account.followerCount?.toLocaleString() || 0}</p>
              <p><strong>Following:</strong> {result.account.followingCount?.toLocaleString() || 0}</p>
              <p><strong>Posts:</strong> {result.account.postsCount || 0}</p>
              <p><strong>Account Age:</strong> {result.account.accountAgeDays || 0} days</p>
              <p><strong>Reports:</strong> 
                <span style={{ 
                  color: reportCount > 0 ? '#ef4444' : '#10b981',
                  fontWeight: 'bold',
                  marginLeft: '0.5rem'
                }}>
                  {reportCount} {reportCount === 1 ? 'report' : 'reports'}
                </span>
              </p>
            </div>
          </div>
          
          {result.account.reasonCodes && result.account.reasonCodes.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <h5>Risk Reasons:</h5>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {result.account.reasonCodes.map((reason, index) => (
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

          <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#065f46', borderRadius: '4px' }}>
            <p style={{ margin: 0, color: '#10b981', fontWeight: 'bold' }}>
              🎉 Account data successfully saved to MongoDB Atlas database!
            </p>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#a7f3d0' }}>
              Total scans for this account: {result.account.totalScans}
            </p>
          </div>

          {/* Report Section */}
          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#1f2937', borderRadius: '8px', border: '1px solid #374151' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h4 style={{ margin: 0, color: '#f9fafb' }}>🚨 Report This Account</h4>
              <button
                type="button"
                onClick={() => setShowReportForm(!showReportForm)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: showReportForm ? '#6b7280' : '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {showReportForm ? 'Cancel Report' : 'Report Account'}
              </button>
            </div>

            {showReportForm && (
              <form onSubmit={handleReportSubmit} style={{ maxWidth: '100%' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#f9fafb', fontWeight: 'bold' }}>
                      Reported By *
                    </label>
                    <input
                      type="text"
                      name="reportedBy"
                      value={reportForm.reportedBy}
                      onChange={handleReportInputChange}
                      placeholder="Your username or ID"
                      required
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #374151', backgroundColor: '#1f2937', color: '#f9fafb' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#f9fafb', fontWeight: 'bold' }}>
                      Reason *
                    </label>
                    <select
                      name="reason"
                      value={reportForm.reason}
                      onChange={handleReportInputChange}
                      required
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #374151', backgroundColor: '#1f2937', color: '#f9fafb' }}
                    >
                      <option value="">Select a reason</option>
                      <option value="spam content">Spam Content</option>
                      <option value="bot-like behaviour">Bot-like Behaviour</option>
                      <option value="fake-followers">Fake Followers</option>
                      <option value="impersonation">Impersonation</option>
                      <option value="harassment">Harassment</option>
                      <option value="suspicious activity">Suspicious Activity</option>
                      <option value="misleading behaviour">Misleading Behaviour</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#f9fafb', fontWeight: 'bold' }}>
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={reportForm.priority}
                    onChange={handleReportInputChange}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #374151', backgroundColor: '#1f2937', color: '#f9fafb' }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#f9fafb', fontWeight: 'bold' }}>
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={reportForm.description}
                    onChange={handleReportInputChange}
                    placeholder="Provide detailed information about the suspicious behavior..."
                    required
                    rows="3"
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #374151', backgroundColor: '#1f2937', color: '#f9fafb', resize: 'vertical' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingReport}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: isSubmittingReport ? '#6b7280' : '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isSubmittingReport ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {isSubmittingReport ? 'Submitting Report...' : 'Submit Report'}
                </button>

                {reportMessage && (
                  <div style={{ 
                    marginTop: '1rem', 
                    padding: '0.75rem', 
                    borderRadius: '4px',
                    backgroundColor: reportMessage.includes('✅') ? '#065f46' : '#7f1d1d',
                    border: `1px solid ${reportMessage.includes('✅') ? '#10b981' : '#dc2626'}`,
                    color: reportMessage.includes('✅') ? '#10b981' : '#fca5a5'
                  }}>
                    {reportMessage}
                  </div>
                )}
              </form>
            )}
          </div>
          
          <Breakdown data={result.account} />
        </div>
      )}

      {mlResult && (
        <div style={{ marginTop: 18, padding: '1rem', backgroundColor: '#111827', borderRadius: '8px' }}>
          <h4>🤖 ML Result</h4>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(mlResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}




