"use client";

import { useState } from 'react';

export default function AssociationAccept({ params }: { params: { id: string } }) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submitOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/associations/${params.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setMessage(json.error || 'Failed to verify OTP');
      } else {
        setMessage('Association verified successfully');
      }
    } catch (err) {
      setMessage(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-12 bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold">Accept Invitation</h2>
      <p className="mt-2 text-sm text-gray-600">Enter the 6-digit OTP you received.</p>
      <form onSubmit={submitOtp} className="mt-4">
        <input
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="w-full border rounded p-2"
          placeholder="123456"
        />
        <button disabled={loading} className="mt-4 w-full bg-blue-600 text-white py-2 rounded">
          {loading ? 'Verifying...' : 'Verify OTP'}
        </button>
      </form>
      {message && <p className="mt-4 text-sm">{message}</p>}
    </div>
  );
}
