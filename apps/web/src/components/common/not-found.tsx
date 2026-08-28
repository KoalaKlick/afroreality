"use client";

import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotFoundComponent() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center font-poppins">
      <div className="space-y-4 max-w-md">
        <div className="space-y-2">
          <h1 className="text-7xl font-extrabold text-emerald-600 dark:text-emerald-500">404</h1>
          <h2 className="text-2xl font-bold text-foreground">Page not found</h2>
          <p className="text-sm text-muted-foreground">
            Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-4">
          <Button variant="outline" onClick={() => window.history.back()} className="gap-2">
            <ArrowLeft className="size-4" /> Go Back
          </Button>
          <Button asChild className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white">
            <Link href="/dashboard">
              <Home className="size-4" /> Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
