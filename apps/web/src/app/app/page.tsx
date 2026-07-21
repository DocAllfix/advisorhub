import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

import { PannelloStudio } from "./pannello-studio";

export default async function AppPage() {
  const sessione = await auth.api.getSession({ headers: await headers() });
  if (!sessione) redirect("/login");

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-12">
      <PannelloStudio />
    </main>
  );
}
