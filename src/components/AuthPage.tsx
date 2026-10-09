import { useState, type FormEvent } from 'react';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth } from '../lib/firebase';

export function AuthPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const signInWithGoogle = async () => {
    setError('');
    setMessage('');
    setBusy(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err) {
      const code = err instanceof FirebaseError ? err.code : undefined;
      if (code === 'auth/popup-closed-by-user') {
        setError('Google sign-in was cancelled.');
      } else {
        console.error('Google authentication failed', err);
        setError(code === 'auth/popup-blocked'
          ? 'Your browser blocked the Google sign-in window. Allow pop-ups and try again.'
          : code === 'auth/operation-not-allowed' || code === 'auth/configuration-not-found'
            ? 'Google sign-in is not enabled for this Firebase project. Enable the Google provider in Firebase Authentication settings.'
            : 'Could not sign in with Google. Check Firebase Authentication settings and try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (err) {
      console.error('Firebase authentication failed', err);
      const code = err instanceof FirebaseError ? err.code : undefined;
      setError(code === 'auth/email-already-in-use'
        ? 'An account already exists for this email. Sign in instead.'
        : code === 'auth/configuration-not-found' || code === 'auth/operation-not-allowed'
          ? 'Email sign-in is not enabled for this Firebase project. Enable Email/Password in Firebase Authentication settings.'
        : code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password'
          ? 'Email or password is incorrect.'
          : code === 'auth/weak-password'
            ? 'Use a password with at least 6 characters.'
            : 'Could not authenticate. Check your connection and Firebase Authentication settings.');
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    setError('');
    setMessage('');
    if (!email.trim()) {
      setError('Enter your email address first.');
      return;
    }
    setBusy(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMessage('Password reset email sent.');
    } catch (err) {
      console.error('Firebase password reset failed', err);
      setError('Could not send a reset email. Check the address and Firebase Authentication settings.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <section className="card w-full max-w-md p-6 sm:p-8">
        <div className="mb-6 text-center">
          <span className="text-4xl">💰</span>
          <h1 className="mt-2 text-2xl font-bold">Wallet Tracker</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {isRegistering ? 'Create an account to securely sync your data.' : 'Sign in to access your wallets and transactions.'}
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-medium">
            Email
            <input
              className="input mt-1"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="block text-sm font-medium">
            Password
            <input
              className="input mt-1"
              type="password"
              autoComplete={isRegistering ? 'new-password' : 'current-password'}
              minLength={6}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          {message && <p role="status" className="text-sm text-green-700 dark:text-green-400">{message}</p>}
          <button className="btn-primary w-full" type="submit" disabled={busy}>
            {busy ? 'Please wait…' : isRegistering ? 'Create account with email' : 'Sign in with email'}
          </button>
        </form>
        <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          OR
          <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        </div>
        <button
          className="btn-ghost w-full"
          onClick={() => void signInWithGoogle()}
          disabled={busy}
          type="button"
        >
          <GoogleIcon />
          Continue with Google
        </button>
        {!isRegistering && (
          <button className="mt-3 w-full text-sm text-brand-600 hover:underline dark:text-brand-400" onClick={resetPassword} disabled={busy}>
            Forgot password?
          </button>
        )}
        <p className="mt-5 text-center text-sm text-slate-600 dark:text-slate-400">
          {isRegistering ? 'Already have an account?' : 'New to Wallet Tracker?'}{' '}
          <button
            className="font-semibold text-brand-600 hover:underline dark:text-brand-400"
            onClick={() => { setError(''); setMessage(''); setIsRegistering((value) => !value); }}
            type="button"
          >
            {isRegistering ? 'Sign in' : 'Create an account'}
          </button>
        </p>
      </section>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" transform="translate(0 4)" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 37.96 46.98 31.82 46.98 24.55Z" />
      <path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.97-6.19Z" transform="translate(.75)" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.44-4.89 2.3-8.18 2.3-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
    </svg>
  );
}
