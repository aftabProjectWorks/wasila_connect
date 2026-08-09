import React, { useState } from 'react';

export default function LedgerAdminPage() {
  const [accountId, setAccountId] = useState('');
  const [result, setResult] = useState<any>(null);

  async function verify() {
    setResult(null);
    const res = await fetch('/api/ledger/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account_id: accountId }),
    });
    const json = await res.json();
    setResult(json);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold">Ledger Admin</h1>
      <div className="mt-4 bg-white p-4 rounded shadow">
        <p>Verify account balance by recalculating entries.</p>
        <div className="mt-2">
          <input value={accountId} onChange={(e) => setAccountId(e.target.value)} placeholder="account id" className="border p-2 rounded w-full" />
          <button onClick={verify} className="mt-2 bg-blue-600 text-white py-2 rounded">Verify</button>
        </div>
        {result && (
          <div className="mt-4">
            <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
