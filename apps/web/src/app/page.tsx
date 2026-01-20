import { AuthPanel } from '@/components/auth-panel';
import { DemoPanel } from '@/components/demo-panel';

export default function HomePage() {
  return (
    <main
      style={{
        display: 'grid',
        gap: '32px',
        padding: '32px',
        maxWidth: '960px',
        margin: '0 auto',
      }}
    >
      <header>
        <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Bonfire M0</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Foundations + design system demo with passkey auth.
        </p>
      </header>
      <DemoPanel />
      <AuthPanel />
    </main>
  );
}
