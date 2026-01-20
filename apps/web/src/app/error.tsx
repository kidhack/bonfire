"use client";

import { useEffect } from 'react';

import { captureError } from '@/lib/error';

export default function ErrorPage({ error }: { error: Error }) {
  useEffect(() => {
    captureError(error);
  }, [error]);

  return (
    <main style={{ padding: '32px' }}>
      <h1>Something went wrong</h1>
      <p>Please try again.</p>
    </main>
  );
}
