"use client";

import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import { useEffect, useState } from 'react';
import { Button, Input } from '@bonfire/ui';

type SessionUser = {
  id: string;
  email: string;
  displayName: string;
};

export function AuthPanel() {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);

  async function refreshSession() {
    const res = await fetch('/api/auth/session');
    const data = await res.json();
    setSessionUser(data.user);
  }

  useEffect(() => {
    refreshSession().catch(() => undefined);
  }, []);

  async function handleRegister() {
    setStatus(null);
    const payload = {
      email: sessionUser?.email ?? email,
      displayName: sessionUser?.displayName ?? displayName,
    };
    const optionsRes = await fetch('/api/auth/register/options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!optionsRes.ok) {
      setStatus((await optionsRes.json()).error ?? 'Failed to start registration');
      return;
    }
    const options = await optionsRes.json();
    const response = await startRegistration(options);
    const verifyRes = await fetch('/api/auth/register/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: payload.email, response }),
    });
    if (!verifyRes.ok) {
      setStatus((await verifyRes.json()).error ?? 'Registration failed');
      return;
    }
    await refreshSession();
    setStatus('Passkey registered.');
  }

  async function handleAuthenticate() {
    setStatus(null);
    const optionsRes = await fetch('/api/auth/authenticate/options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!optionsRes.ok) {
      setStatus((await optionsRes.json()).error ?? 'Failed to start authentication');
      return;
    }
    const options = await optionsRes.json();
    const response = await startAuthentication(options);
    const verifyRes = await fetch('/api/auth/authenticate/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, response }),
    });
    if (!verifyRes.ok) {
      setStatus((await verifyRes.json()).error ?? 'Authentication failed');
      return;
    }
    await refreshSession();
    setStatus('Signed in.');
  }

  async function handleGenerateBackupCodes() {
    setStatus(null);
    const res = await fetch('/api/auth/backup-codes', { method: 'POST' });
    if (!res.ok) {
      setStatus((await res.json()).error ?? 'Failed to generate backup codes');
      return;
    }
    const data = await res.json();
    setCodes(data.codes);
    setStatus('Backup codes generated. Store them safely.');
  }

  async function handleRedeemBackupCode() {
    setStatus(null);
    const res = await fetch('/api/auth/backup-codes/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code: backupCode }),
    });
    if (!res.ok) {
      setStatus((await res.json()).error ?? 'Failed to redeem backup code');
      return;
    }
    await refreshSession();
    setStatus('Backup code redeemed. You are signed in.');
  }

  async function handleSignOut() {
    await fetch('/api/auth/sign-out', { method: 'POST' });
    setSessionUser(null);
    setStatus('Signed out.');
  }

  return (
    <section style={{ display: 'grid', gap: '16px' }}>
      <h2 style={{ fontSize: '18px' }}>Passkey Auth (M0)</h2>
      <div style={{ display: 'grid', gap: '8px' }}>
        <Input
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Input
          placeholder="Display name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
        />
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <Button variant="primary" onClick={handleRegister}>
          {sessionUser ? 'Add passkey' : 'Register passkey'}
        </Button>
        <Button onClick={handleAuthenticate}>Sign in</Button>
        <Button variant="ghost" onClick={handleSignOut}>
          Sign out
        </Button>
      </div>
      <div style={{ display: 'grid', gap: '8px' }}>
        <Input
          placeholder="Backup code"
          value={backupCode}
          onChange={(event) => setBackupCode(event.target.value)}
        />
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button onClick={handleRedeemBackupCode}>Use backup code</Button>
          <Button variant="ghost" onClick={handleGenerateBackupCodes}>
            Generate backup codes
          </Button>
        </div>
      </div>
      {sessionUser && (
        <p style={{ color: 'var(--color-text-muted)' }}>
          Signed in as {sessionUser.displayName} ({sessionUser.email})
        </p>
      )}
      {status && <p>{status}</p>}
      {codes && (
        <div style={{ display: 'grid', gap: '4px' }}>
          <p>Backup codes:</p>
          <code style={{ whiteSpace: 'pre-wrap' }}>{codes.join('\n')}</code>
        </div>
      )}
    </section>
  );
}
