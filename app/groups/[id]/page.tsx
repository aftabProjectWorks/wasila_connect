import React from 'react';

async function fetchGroup(groupId: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/groups/${groupId}`);
  if (!res.ok) throw new Error('Failed to fetch group');
  const json = await res.json();
  return json.data;
}

export default async function GroupPage({ params }: { params: { id: string } }) {
  const group = await fetchGroup(params.id);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold">Group: {group.name}</h1>
      <div className="mt-4 bg-white p-4 rounded shadow">
        <p><strong>Slug:</strong> {group.slug}</p>
        <p><strong>Description:</strong> {group.description || '—'}</p>
      </div>
    </div>
  );
}
