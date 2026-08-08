import { createServiceSupabase } from '../../lib/supabaseClient';

export default async function GroupPage({ params }: { params: { slug: string } }) {
  const supabase = createServiceSupabase();
  const { data: group } = await supabase.from('groups').select('*').eq('slug', params.slug).limit(1).maybeSingle();

  if (!group) return (<div>Group not found</div>);

  return (
    <div>
      <h2 className="text-xl font-semibold">{group.name}</h2>
      <p className="mt-2 text-sm text-gray-600">{group.description}</p>
      <div className="mt-4 bg-white p-4 rounded shadow">
        <h3 className="font-medium">Members</h3>
        <p className="mt-2 text-sm text-gray-500">Member list and roles</p>
      </div>
    </div>
  );
}
