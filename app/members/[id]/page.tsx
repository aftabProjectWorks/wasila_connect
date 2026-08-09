import React from 'react';

async function fetchMember(memberId: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/members/${memberId}`);
  if (!res.ok) throw new Error('Failed to fetch member');
  const json = await res.json();
  return json.data;
}

export default async function MemberProfilePage({ params }: { params: { id: string } }) {
  const member = await fetchMember(params.id);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold">Member profile</h1>
      <div className="mt-4 bg-white p-4 rounded shadow">
        <p><strong>Name:</strong> {member.full_name || '—'}</p>
        <p><strong>Email:</strong> {member.email || '—'}</p>
        <p><strong>Role:</strong> {member.role}</p>
        <p><strong>Status:</strong> {member.status}</p>
      </div>
    </div>
  );
}
