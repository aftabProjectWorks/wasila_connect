import React from 'react';

async function fetchReport() {
  const res = await fetch('/api/transactions/report');
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
}

export default async function AdminPage() {
  const report = await fetchReport();

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <div className="mt-6">
        <h2 className="text-lg font-medium">Recent Transactions</h2>
        <div className="mt-2 bg-white p-4 rounded shadow">
          {report.length === 0 ? (
            <p>No transactions found.</p>
          ) : (
            <table className="w-full text-sm table-fixed">
              <thead>
                <tr>
                  <th className="w-1/3 text-left">Reference</th>
                  <th className="w-1/6 text-left">Amount</th>
                  <th className="w-1/6 text-left">Status</th>
                  <th className="w-1/3 text-left">Created At</th>
                </tr>
              </thead>
              <tbody>
                {report.map((t: any) => (
                  <tr key={t.id}>
                    <td className="truncate">{t.reference}</td>
                    <td>{t.amount} {t.currency}</td>
                    <td>{t.status}</td>
                    <td>{new Date(t.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
