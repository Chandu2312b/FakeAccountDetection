import React, { useEffect, useState } from 'react';
import { getTopReported } from '../api.js';

export default function ReportForm() {
  const [top, setTop] = useState([]);
  const [showReportForm, setShowReportForm] = useState(false);
  const [formData, setFormData] = useState({
    accountId: '',
    reportedBy: '',
    reason: '',
    priority: 'medium',
    description: '',
    evidence: []
  });
  const [evidenceInput, setEvidenceInput] = useState('');
  const [evidenceType, setEvidenceType] = useState('screenshot_url');
  const [location, setLocation] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  useEffect(() => {
    getTopReported(20).then(setTop);
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Geolocation error:', error);
        }
      );
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addEvidence = () => {
    if (evidenceInput.trim()) {
      setFormData(prev => ({
        ...prev,
        evidence: [...prev.evidence, {
          type: evidenceType,
          content: evidenceInput.trim(),
          url: evidenceType === 'screenshot_url' ? evidenceInput.trim() : undefined
        }]
      }));
      setEvidenceInput('');
    }
  };

  const removeEvidence = (index) => {
    setFormData(prev => ({
      ...prev,
      evidence: prev.evidence.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const response = await fetch('/api/reports/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Geo-Location': location ? JSON.stringify(location) : ''
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        setSubmitMessage('✅ Report submitted successfully! Thank you for helping maintain platform integrity.');
        setFormData({
          accountId: '',
          reportedBy: '',
          reason: '',
          priority: 'medium',
          description: '',
          evidence: []
        });
        setEvidenceInput('');
        // Refresh the top reported list
        getTopReported(20).then(setTop);
      } else {
        setSubmitMessage(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      setSubmitMessage('❌ Failed to submit report. Please try again.');
      console.error('Report submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3>Submit Account Report</h3>
        <button 
          className="btn"
          onClick={() => setShowReportForm(!showReportForm)}
        >
          {showReportForm ? 'View Top Reported' : 'Submit New Report'}
        </button>
      </div>

      {showReportForm ? (
        <div>
          <div style={{ 
            background: '#f8f9fa', 
            padding: '15px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            border: '1px solid #e9ecef'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>Report suspicious accounts or fraudulent behavior</h4>
            <p style={{ margin: '0', color: '#6c757d', fontSize: '14px' }}>
              Help us maintain platform integrity by reporting accounts that violate our community guidelines.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>
            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="accountId" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Account ID *
              </label>
              <input
                type="text"
                id="accountId"
                name="accountId"
                value={formData.accountId}
                onChange={handleInputChange}
                placeholder="@username or account_12345"
                required
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="reportedBy" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Reported By *
              </label>
              <input
                type="text"
                id="reportedBy"
                name="reportedBy"
                value={formData.reportedBy}
                onChange={handleInputChange}
                placeholder="Your username or ID"
                required
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="reason" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Reason *
              </label>
              <select
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                required
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value="">Select a reason:</option>
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

            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="priority" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="description" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Provide detailed information about the suspicious behavior..."
                required
                rows="4"
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Evidence (one per line)
              </label>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <select
                  value={evidenceType}
                  onChange={(e) => setEvidenceType(e.target.value)}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="screenshot_url">Screenshot URL</option>
                  <option value="post_content">Post Content Example</option>
                  <option value="pattern_observation">Pattern Observation</option>
                  <option value="other">Other Supporting Evidence</option>
                </select>
                <input
                  type="text"
                  value={evidenceInput}
                  onChange={(e) => setEvidenceInput(e.target.value)}
                  placeholder="Enter evidence..."
                  style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <button
                  type="button"
                  onClick={addEvidence}
                  style={{ padding: '8px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Add
                </button>
              </div>
              
              {formData.evidence.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <h5 style={{ margin: '0 0 10px 0' }}>Added Evidence:</h5>
                  {formData.evidence.map((evidence, index) => (
                    <div key={index} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '8px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '4px',
                      marginBottom: '5px'
                    }}>
                      <div>
                        <strong>{evidence.type.replace('_', ' ')}:</strong> {evidence.content}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeEvidence(index)}
                        style={{ 
                          background: '#dc3545', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '3px', 
                          padding: '4px 8px',
                          cursor: 'pointer'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {location && (
              <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#e7f3ff', borderRadius: '4px' }}>
                <strong>📍 Live Geo Location:</strong> {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
              </div>
            )}

            <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '4px', border: '1px solid #ffeaa7' }}>
              <p style={{ margin: '0', fontSize: '14px', color: '#856404' }}>
                <strong>⚠️ Warning:</strong> False reports may result in penalties. Please ensure your report is accurate and well-documented.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: isSubmitting ? '#6c757d' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>

            {submitMessage && (
              <div style={{ 
                marginTop: '15px', 
                padding: '10px', 
                borderRadius: '4px',
                backgroundColor: submitMessage.includes('✅') ? '#d4edda' : '#f8d7da',
                border: `1px solid ${submitMessage.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`,
                color: submitMessage.includes('✅') ? '#155724' : '#721c24'
              }}>
                {submitMessage}
              </div>
            )}
          </form>
        </div>
      ) : (
        <div>
          <h4>Top Reported Accounts</h4>
          <table className="table">
            <thead><tr><th>Account</th><th>Reports</th></tr></thead>
            <tbody>
              {top.map(x => (
                <tr key={x.accountId}>
                  <td>{x.accountId}</td>
                  <td>{x.reports}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ color: '#9fb1c1' }}>Upload CSV for bulk audit via backend endpoint <code>/api/upload/csv</code>.</p>
        </div>
      )}
    </div>
  );
}





