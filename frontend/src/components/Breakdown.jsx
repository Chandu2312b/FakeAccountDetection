import React from 'react';

export default function Breakdown({ data }) {
  const { reasonCodes = [], evidence = {} } = data || {};
  const items = Object.entries(evidence);

  return (
    <div className="panel" style={{ marginTop: 12 }}>
      <h4>Risk Breakdown</h4>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {reasonCodes.map((r, i) => (
          <span key={i} className="badge suspicious">{r}</span>
        ))}
        {reasonCodes.length === 0 && <span className="badge safe">No risk rules triggered</span>}
      </div>
      {items.length > 0 && (
        <table className="table" style={{ marginTop: 12 }}>
          <thead><tr><th>Evidence</th><th>Value</th></tr></thead>
          <tbody>
            {items.map(([k, v]) => (
              <tr key={k}>
                <td>{k}</td>
                <td>{String(v)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}







