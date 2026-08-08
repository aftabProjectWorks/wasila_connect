import Link from 'next/link';

export default function GroupsIndex() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Groups</h2>
        <Link href="/groups/new" className="text-blue-600">Create group</Link>
      </div>
      <div className="mt-6">
        <p className="text-sm text-gray-600">Browse public groups.</p>
        {/* Group list will be fetched from API */}
      </div>
    </div>
  );
}
