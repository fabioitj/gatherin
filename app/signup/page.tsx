import { SignupForm } from "@/components/signup-form";
import { BarChart } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | GatherIn",
  description: "Create a new GatherIn account",
};

export default function SignupPage() {
  return (
    <div className="w-full flex min-h-screen flex-col items-center justify-center p-4 bg-muted/40">
      <div className="mb-6 flex flex-col items-center text-center">
        <BarChart className="h-10 w-10 mb-2" />
        <h1 className="text-3xl font-bold">GatherIn</h1>
        <p className="text-muted-foreground">
          Track, analyze, and stay informed about investment opportunities
        </p>
      </div>
      <SignupForm />
    </div>
  );
}