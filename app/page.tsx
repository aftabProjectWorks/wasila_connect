export default function Home() {
  return (
    <div className="py-12">
      <h2 className="text-2xl font-semibold">Welcome to Wasila</h2>
      <p className="mt-4 text-gray-600">A community and group management platform.</p>
      <div className="mt-6">
        <a href="/auth/login" className="inline-block bg-blue-600 text-white px-4 py-2 rounded">
          Get started
        </a>
      </div>
    </div>
  );
}
