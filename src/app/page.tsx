import { redirect } from "next/navigation";
import { getSessionContext } from "@/data/context";

export default async function Home() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  if (ctx.role === "STAFF" || ctx.role === "STAFF_ADMIN") redirect("/staff/queue");
  redirect("/dashboard");
}
