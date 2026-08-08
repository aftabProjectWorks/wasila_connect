export default function AdminPage() {
  return (
    <div>
      <h2 className="text-xl font-semibold">Admin Dashboard</h2>
      <p className="mt-2 text-sm text-gray-600">Manage members, groups, policies, and financials.</p>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-medium">Members</h3>
          <p className="mt-2 text-sm text-gray-500">View and manage registered members.</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-medium">Groups</h3>
          <p className="mt-2 text-sm text-gray-500">Create and manage groups and leads.</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-medium">Financials</h3>
          <p className="mt-2 text-sm text-gray-500">View ledger and transactions.</p>
        </div>
      </div>
    </div>
  );
}
