import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const destination = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://fextiva.com";
  redirect(destination);
}

