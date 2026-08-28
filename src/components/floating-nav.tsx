import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export function FloatingNav() {
  return (
    <nav className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center p-4">
      <div className="pointer-events-auto flex w-full max-w-5xl items-center justify-between gap-3 rounded-xl border border-white/15 bg-background/70 px-3 py-2 shadow-lg backdrop-blur-md">
        <Link href="/" className="px-2 font-heading text-sm font-medium tracking-tight">
          td-like
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className={buttonVariants({ variant: "ghost" })}
          >
            Log in
          </Link>
          <Link href="/signup" className={buttonVariants()}>
            Sign up
          </Link>
        </div>
      </div>
    </nav>
  );
}
