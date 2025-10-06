import React, { useEffect, useState } from 'react';
import { getFlags, flagAction } from '../api.js';

export default function AdminPanel() {
  const [flags, setFlags] = useState([]);
  const [busy, setBusy] = useState(null);

  const refresh = async () => {
    const data = await getFlags();
    setFlags(data);
  };

  useEffect(() => {
    refresh();
  }, []);

  const act = async (id, action) => {
    setBusy(id + action);
    await flagAction(id, action);
    await refresh();
    setBusy(null);
  };

  return (
    <div className="panel">
      <h3>Admin Flags</h3>
      <table className="table">
        <thead>
          <tr><th>Account</th><th>Status</th><th>Reasons</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {flags.map(f => (
            <tr key={f._id}>
              <td>{f.accountId}</td>
              <td>{f.status}</td>
              <td style={{ maxWidth: 380 }}>{(f.reasons || []).join(', ')}</td>
              <td style={{ display: 'flex', gap: 6 }}>
                <button disabled={busy===f._id+'ban'} onClick={() => act(f._id, 'ban')}>Ban</button>
                <button className="secondary" disabled={busy===f._id+'restore'} onClick={() => act(f._id, 'restore')}>Restore</button>
                <button className="secondary" disabled={busy===f._id+'ignore'} onClick={() => act(f._id, 'ignore')}>Ignore</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ color: '#9fb1c1' }}>Click an action to update status. Use the export endpoint for takedown JSON: <code>/api/admin/flags/:id/export</code></p>
    </div>
  );
}







