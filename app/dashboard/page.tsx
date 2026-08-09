import Link from 'next/link';

export default function MemberDashboard() {
  return (
    <div>
      <h2 className="text-xl font-semibold">Member Dashboard</h2>
      <p className="mt-2 text-sm text-gray-600">Overview of your groups, cards, activity and recent transactions.</p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-medium">Groups</h3>
          <p className="mt-2 text-sm text-gray-500">View and manage your groups.</p>
          <div className="mt-3">
            <Link href="/groups" className="text-blue-600">View groups</Link>
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-medium">Cards</h3>
          <p className="mt-2 text-sm text-gray-500">Your card templates and issued cards.</p>
          <div className="mt-3">
            <Link href="/cards" className="text-blue-600">View cards</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
