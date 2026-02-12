import { getCurrentUserProfile } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import OnboardingClient from "./OnboardingClient";

export default async function OnboardingPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  // If already completed onboarding, redirect to dashboard
  if (profile.onboardingCompleted) {
    redirect("/dashboard");
  }

  return <OnboardingClient />;
}
