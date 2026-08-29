"use client";

import Link from "next/link";
import { useState } from "react";

import { FpsCounter } from "@/components/fps-counter";
import { PlayDebugSubnav } from "@/components/game/play-debug-toolbar";
import { PlayPerfToggles } from "@/components/game/play-perf-toggles";
import { LoginForm } from "@/components/login-form";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function FloatingNav() {
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <nav className="pointer-events-none fixed inset-x-0 top-0 z-50 flex flex-col items-center pt-4">
      <div className="pointer-events-auto flex w-full max-w-5xl items-center justify-between gap-3 bg-transparent px-3 py-2">
        <div className="flex items-baseline gap-3 px-2">
          <Link href="/">
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)] sm:text-3xl">
              td-like
            </h1>
          </Link>
          <FpsCounter />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/10 hover:text-white"
            onClick={() => setLoginOpen(true)}
          >
            Log in
          </Button>
          <Link
            href="/signup"
            className={buttonVariants({
              className: "bg-white text-black hover:bg-white/90",
            })}
          >
            Sign up
          </Link>
        </div>
      </div>

      <PlayDebugSubnav />
      <PlayPerfToggles />

      {loginOpen ? (
        <div className="pointer-events-auto fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm">
          <Card className="w-full max-w-sm shadow-2xl">
            <CardHeader>
              <CardTitle>Sign in</CardTitle>
              <CardDescription>
                Use your email and password to enter the game.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm />
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="ml-auto"
                onClick={() => setLoginOpen(false)}
              >
                Close
              </Button>
            </CardFooter>
          </Card>
        </div>
      ) : null}
    </nav>
  );
}
