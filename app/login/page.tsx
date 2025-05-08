import { LoginForm } from "@/components/login-form";
import { BarChart } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | GatherIn",
  description: "Log in to your GatherIn account",
};

export default function LoginPage() {
  return (
    <div className="w-full flex min-h-screen flex-col items-center justify-center p-4 bg-muted/40">
      <div className="mb-6 flex flex-col items-center text-center">
        <BarChart className="h-10 w-10 mb-2" />
        <h1 className="text-3xl font-bold">GatherIn</h1>
        <p className="text-muted-foreground">
          Track, analyze, and stay informed about investment opportunities
        </p>
      </div>
      <LoginForm />
    </div>
  );
}