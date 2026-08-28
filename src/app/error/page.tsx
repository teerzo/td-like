import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default async function ErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="font-heading text-2xl font-medium">Something went wrong</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        {message ?? "An unexpected error occurred."}
      </p>
      <Link href="/" className={buttonVariants()}>
        Back home
      </Link>
    </main>
  );
}
