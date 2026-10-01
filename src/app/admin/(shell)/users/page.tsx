import { listUsers } from "@/server/services/user.service";
import { getSessionUser } from "@/server/auth";
import { UsersManager } from "@/components/admin/users-manager";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const [users, me] = await Promise.all([listUsers(), getSessionUser()]);
  return <UsersManager initial={JSON.parse(JSON.stringify(users))} currentUserId={me?.id ?? ""} />;
}
