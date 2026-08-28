import Link from "next/link";

import { SignupForm } from "@/components/signup-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SignupPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6 pt-24">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>
            You will need to confirm your email before signing in.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <SignupForm />
          <Link
            href="/"
            className="text-sm text-muted-foreground underline underline-offset-4"
          >
            Back home
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
