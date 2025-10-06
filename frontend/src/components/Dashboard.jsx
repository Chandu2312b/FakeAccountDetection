import React, { useEffect, useState } from 'react';
import { getDaily, getTopReported, getAnalyticsData } from '../api.js';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

export default function Dashboard() {
  const [daily, setDaily] = useState([]);
  const [topReported, setTopReported] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [dailyData, topReportedData, analyticsData] = await Promise.all([
        getDaily(30), 
        getTopReported(10),
        getAnalyticsData()
      ]);
      setDaily(dailyData);
      setTopReported(topReportedData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const riskCategoryData = analytics ? [
    { name: 'Safe', value: analytics.accounts.safe, color: '#10b981' },
    { name: 'Suspicious', value: analytics.accounts.suspicious, color: '#f59e0b' },
    { name: 'High Risk', value: analytics.accounts.highRisk, color: '#ef4444' }
  ] : [];

  const countryData = analytics ? analytics.topCountries.slice(0, 8) : [];

  if (loading) {
    return (
      <div className="grid-2">
        <div className="panel" style={{ gridColumn: '1 / -1' }}>
          <h3>Loading Dashboard...</h3>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '2rem' }}>⏳</div>
            <p>Loading data from MongoDB Atlas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid-2">
      {/* Summary Cards */}
      <div className="panel" style={{ gridColumn: '1 / -1' }}>
        <h3>Database Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: '#1f2937', borderRadius: '8px', textAlign: 'center' }}>
            <h4 style={{ color: '#10b981', margin: '0 0 0.5rem 0' }}>Total Accounts</h4>
            <p style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold' }}>{analytics?.accounts.total || 0}</p>
          </div>
          <div style={{ padding: '1rem', backgroundColor: '#1f2937', borderRadius: '8px', textAlign: 'center' }}>
            <h4 style={{ color: '#10b981', margin: '0 0 0.5rem 0' }}>Safe Accounts</h4>
            <p style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold' }}>{analytics?.accounts.safe || 0}</p>
          </div>
          <div style={{ padding: '1rem', backgroundColor: '#1f2937', borderRadius: '8px', textAlign: 'center' }}>
            <h4 style={{ color: '#f59e0b', margin: '0 0 0.5rem 0' }}>Suspicious</h4>
            <p style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold' }}>{analytics?.accounts.suspicious || 0}</p>
          </div>
          <div style={{ padding: '1rem', backgroundColor: '#1f2937', borderRadius: '8px', textAlign: 'center' }}>
            <h4 style={{ color: '#ef4444', margin: '0 0 0.5rem 0' }}>High Risk</h4>
            <p style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold' }}>{analytics?.accounts.highRisk || 0}</p>
          </div>
          <div style={{ padding: '1rem', backgroundColor: '#1f2937', borderRadius: '8px', textAlign: 'center' }}>
            <h4 style={{ color: '#3b82f6', margin: '0 0 0.5rem 0' }}>Total Scans</h4>
            <p style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold' }}>{analytics?.scans.total || 0}</p>
          </div>
          <div style={{ padding: '1rem', backgroundColor: '#1f2937', borderRadius: '8px', textAlign: 'center' }}>
            <h4 style={{ color: '#8b5cf6', margin: '0 0 0.5rem 0' }}>Recent Scans</h4>
            <p style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold' }}>{analytics?.scans.recent || 0}</p>
          </div>
        </div>
      </div>

      {/* Risk Category Distribution */}
      <div className="panel">
        <h3>Risk Category Distribution</h3>
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie 
                data={riskCategoryData} 
                dataKey="value" 
                nameKey="name" 
                outerRadius={90} 
                label={({ name, value }) => `${name}: ${value}`}
              >
                {riskCategoryData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Countries */}
      <div className="panel">
        <h3>Top Countries by Activity</h3>
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={countryData}>
              <CartesianGrid stroke="#1f2937" />
              <XAxis dataKey="country" stroke="#9fb1c1" angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#9fb1c1" />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Detection Chart */}
      <div className="panel">
        <h3>Fake accounts detected per day</h3>
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <LineChart data={daily}>
              <CartesianGrid stroke="#1f2937" />
              <XAxis dataKey="date" stroke="#9fb1c1" />
              <YAxis stroke="#9fb1c1" />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#4cc9f0" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Most Reported Accounts */}
      <div className="panel">
        <h3>Most reported accounts</h3>
        <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
          <table className="table">
            <thead>
              <tr><th>Account</th><th>Reports</th></tr>
            </thead>
            <tbody>
              {topReported.map((r) => (
                <tr key={r.accountId}>
                  <td>{r.accountId}</td>
                  <td>{r.reports}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="panel" style={{ gridColumn: '1 / -1' }}>
        <button 
          onClick={loadDashboardData}
          style={{ 
            padding: '0.75rem 1.5rem', 
            backgroundColor: '#3b82f6', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold'
          }}
        >
          🔄 Refresh Dashboard Data
        </button>
      </div>
    </div>
  );
}




