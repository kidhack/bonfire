import '@bonfire/ui/styles.css';
import './globals.css';

import type { ReactNode } from 'react';

export const metadata = {
  title: 'Bonfire',
  description: 'Bonfire M0',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="default"
      data-density="comfortable"
      data-motion="normal"
      data-texture="off"
    >
      <body>{children}</body>
    </html>
  );
}
