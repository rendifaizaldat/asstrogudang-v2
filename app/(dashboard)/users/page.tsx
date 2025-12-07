// app/(dashboard)/users/page.tsx
import { getUsers } from "./actions";
import UserList from "@/components/users/UserList";
import UserHeader from "@/components/users/UserHeader"; // Kita buat inline component kecil

export const dynamic = "force-dynamic";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<any>;
}) {
  const params = await searchParams;
  const search = params.search || "";

  // Fetch Data
  const users = await getUsers(search);

  return (
    <div className="space-y-6">
      <UserHeader total={users.length} />

      {/* Search Bar Sederhana (Bisa diganti Smart Search nanti) */}
      <form className="flex gap-2">
        <input
          name="search"
          defaultValue={search}
          placeholder="Cari nama, email, atau outlet..."
          className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm text-slate-700"
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white px-6 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
        >
          Cari
        </button>
      </form>

      <UserList users={users} />
    </div>
  );
}
