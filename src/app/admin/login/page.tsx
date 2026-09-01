import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/auth";
import { databaseConfigured } from "@/server/db";
import { countAdmins } from "@/server/services/user.service";
import { LoginForm } from "@/components/admin/login-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sign in — nlogn admin",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  if (databaseConfigured && (await getSessionUser())) redirect("/admin");

  // A database with no accounts means nobody has run the seed yet; say so
  // rather than letting someone guess at credentials that do not exist.
  const admins = await countAdmins();

  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-4 py-10">
      <LoginForm configured={databaseConfigured} hasAdmins={admins > 0} />
    </div>
  );
}
