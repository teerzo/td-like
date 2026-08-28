"use client";

import Link from "next/link";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function HomeMenu() {
  const [optionsOpen, setOptionsOpen] = useState(false);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <p className="text-sm tracking-[0.2em] text-white/70 uppercase">
          td-like
        </p>
        <h1 className="font-heading text-5xl font-medium tracking-tight text-white drop-shadow-sm">
          Tower Defense
        </h1>
      </div>
      <div className="pointer-events-auto flex flex-col gap-3 sm:flex-row">
        <Link
          href="/play"
          className={buttonVariants({ size: "lg", className: "min-w-36" })}
        >
          Play
        </Link>
        <Button
          size="lg"
          variant="outline"
          className="min-w-36"
          onClick={() => setOptionsOpen(true)}
        >
          Options
        </Button>
      </div>
      {optionsOpen ? (
        <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-black/40 p-6">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Options</CardTitle>
              <CardDescription>
                Graphics and audio settings will live here.
              </CardDescription>
            </CardHeader>
            <CardContent />
            <CardFooter>
              <Button
                variant="outline"
                className="ml-auto"
                onClick={() => setOptionsOpen(false)}
              >
                Close
              </Button>
            </CardFooter>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
