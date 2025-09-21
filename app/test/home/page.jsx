'use client';

import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();


  if (status === "loading") {
    return (
      <div className="flex justify-content-center">
        <ProgressSpinner />
      </div>
    );
  }

  // If the user is authenticated redirect to `/profile`
  if (session) {
    router.push("/test/profile");
    return null;
  }

  return (
    <div className="flex align-items-center justify-content-center min-h-screen">
      <div className="flex flex-column align-items-center gap-4">
        <span className="text-xl">You are not authenticated.</span>
        <Button
          label="Sign in"
          severity="info"
          onClick={() => signIn(undefined, { callbackUrl: "/test/profile" })}
        />
      </div>
    </div>
  );
}
