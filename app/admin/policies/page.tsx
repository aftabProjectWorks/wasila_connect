import React, { useState, useEffect } from 'react';

export default function PoliciesAdminPage() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [scope, setScope] = useState<'system' | 'group'>('system');
  const [scopeId, setScopeId] = useState('');

  useEffect(() => {
    fetchPolicies();
  }, []);

  async function fetchPolicies() {
    const res = await fetch('/api/policies');
    if (!res.ok) return;
    const json = await res.json();
    setPolicies(json.data || []);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await fetch('/api/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: JSON.parse(value), scope, scope_id: scopeId }),
      });
      setKey('');
      setValue('');
      setScope('system');
      setScopeId('');
      fetchPolicies();
    } catch (err) {
      console.error(err);
      alert('Failed to set policy. Ensure value is valid JSON.');
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold">Policies</h1>
      <div className="mt-4 bg-white p-4 rounded shadow">
        <form onSubmit={submit} className="grid grid-cols-1 gap-2">
          <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="policy key" className="border p-2 rounded" />
          <textarea value={value} onChange={(e) => setValue(e.target.value)} placeholder='value (JSON), e.g. "30" or {"a":1}' className="border p-2 rounded" />
          <div>
            <label className="mr-2">Scope:</label>
            <select value={scope} onChange={(e) => setScope(e.target.value as any)} className="border p-2 rounded">
              <option value="system">system</option>
              <option value="group">group</option>
            </select>
            {scope === 'group' && (
              <input value={scopeId} onChange={(e) => setScopeId(e.target.value)} placeholder="group id" className="ml-2 border p-2 rounded" />
            )}
          </div>
          <button className="mt-2 bg-green-600 text-white py-2 rounded">Set Policy</button>
        </form>
      </div>

      <div className="mt-6">
        <h2 className="text-lg">Active Policies</h2>
        <div className="mt-2 bg-white p-4 rounded shadow">
          {policies.length === 0 ? (
            <p>No policies defined.</p>
          ) : (
            <ul>
              {policies.map((p) => (
                <li key={p.id} className="py-2 border-b">{p.scope}/{p.key} = {JSON.stringify(p.value)}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
