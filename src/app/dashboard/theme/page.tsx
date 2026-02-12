import { redirect } from "next/navigation";

// Redirect old theme URL to the merged settings page
export default function ThemePage() {
  redirect("/dashboard/settings");
}
