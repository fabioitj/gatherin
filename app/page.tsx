import { Button } from "@/components/ui/button";
import { BarChart } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "GatherIn - Investment Assistance Platform",
  description: "Track, analyze, and stay informed about investment opportunities",
};

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col w-full justify-center">
      <header className="flex justify-center border-b bg-background z-10">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart className="h-6 w-6" />
            <span className="font-bold text-xl">GatherIn</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/signup">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>
      
      <main className="flex-1 justify-center">
        <section className="flex justify-center py-20 md:py-32 bg-background">
          <div className="container flex flex-col items-center text-center">
            <div className="space-y-4 max-w-3xl">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Your Intelligent Investment Assistant
              </h1>
              <p className="text-xl text-muted-foreground">
                Stay informed and make better investment decisions with personalized news and alerts.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                <Link href="/signup">
                  <Button size="lg" className="w-full sm:w-auto">
                    Get Started
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Login
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
        
        <section className="flex justify-center py-16 bg-muted/40">
          <div className="container">
            <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-background p-6 rounded-lg shadow-sm">
                <div className="mb-4 p-2 bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center">
                  <BarChart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Curated News</h3>
                <p className="text-muted-foreground">
                  Browse and filter news relevant to your investment interests from trusted sources.
                </p>
              </div>
              
              <div className="bg-background p-6 rounded-lg shadow-sm">
                <div className="mb-4 p-2 bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Custom Alerts</h3>
                <p className="text-muted-foreground">
                  Stay informed with personalized alerts for keywords and sectors you care about.
                </p>
              </div>
              
              <div className="bg-background p-6 rounded-lg shadow-sm">
                <div className="mb-4 p-2 bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center">
                  <BookmarkIcon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Save Favorites</h3>
                <p className="text-muted-foreground">
                  Bookmark important news articles to revisit them later or share with others.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="flex justify-center border-t py-6 md:py-0">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 md:h-16">
          <div className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            <p className="text-sm text-muted-foreground">
              &copy; 2025 GatherIn. All rights reserved.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
              Login
            </Link>
            <Link href="/signup" className="text-sm text-muted-foreground hover:text-foreground">
              Sign Up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Add missing imports
import { Bell, BookmarkIcon } from "lucide-react";