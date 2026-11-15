import {useEffect, useRef, useState} from 'react';
import {UI} from './Icon.jsx';

// The storefront's editor guard marks "sign in again" refusals with this
// header; any other 403 is a real refusal and goes back to the caller as is.
const AUTH_REQUIRED_HEADER = 'X-Editor-Auth';
const GUARDED = ['/api/editor', '/api/render'];

let pendingLogin = null;
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn(pendingLogin));

const isGuardedUrl = (input) => {
    try {
        const url = new URL(typeof input === 'string' ? input : input.url, window.location.href);
        return url.origin === window.location.origin && GUARDED.some((p) => url.pathname.startsWith(p));
    } catch {
        return false;
    }
};

// One prompt for every request that ran into the expired session: they all
// wait on the same promise and are retried once it resolves.
const askToSignIn = () => {
    if (!pendingLogin) {
        let settle;
        const promise = new Promise((resolve) => {
            settle = resolve;
        });
        pendingLogin = {
            promise,
            settle: (ok) => {
                pendingLogin = null;
                notify();
                settle(ok);
            },
        };
        notify();
    }
    return pendingLogin.promise;
};

/**
 * Wraps window.fetch so a request refused because the editor session ended
 * opens the sign-in dialog and is sent again after the admin signs in. Nothing
 * the admin was editing is lost: the page never reloads.
 */
export function installSessionFetch() {
    if (typeof window === 'undefined' || window.__editorSessionFetch) return;
    window.__editorSessionFetch = true;
    const original = window.fetch.bind(window);
    window.fetch = async (input, init) => {
        const res = await original(input, init);
        if (res.status !== 403 || res.headers.get(AUTH_REQUIRED_HEADER) !== 'required') return res;
        if (!isGuardedUrl(input)) return res;
        const signedIn = await askToSignIn();
        return signedIn ? original(input, init) : res;
    };
}

/** The signed-in admin, or null while the guard is off or still loading. */
export function useEditorUser() {
    const [user, setUser] = useState(null);
    useEffect(() => {
        const load = () => {
            fetch('/api/editor/me', {cache: 'no-store'})
                .then((r) => (r.ok ? r.json() : null))
                .then((data) => setUser(data?.username ? data : null))
                .catch(() => setUser(null));
        };
        load();
        listeners.add(load);
        return () => listeners.delete(load);
    }, []);
    return user;
}

export async function signOut() {
    await fetch('/api/editor/logout', {method: 'POST'}).catch(() => {});
    window.location.reload();
}

const fieldCls =
    'block w-full h-8 mt-1.5 px-2.5 text-[13px] [font-family:inherit] text-ed-text bg-ed-surface ' +
    'border border-solid border-ed-border rounded focus:outline-none focus:border-ed-primary';
const btnCls =
    'h-8 px-4 text-[12.5px] font-medium rounded [font-family:inherit] cursor-pointer border border-solid ' +
    'disabled:opacity-60 disabled:cursor-default';

/** The sign-in dialog shown over the editor when the session ends mid-work. */
export function SessionLoginModal() {
    const [open, setOpen] = useState(false);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [needsOtp, setNeedsOtp] = useState(false);
    const formRef = useRef(null);

    useEffect(() => {
        const sync = (pending) => setOpen(!!pending);
        listeners.add(sync);
        return () => listeners.delete(sync);
    }, []);

    useEffect(() => {
        if (open) formRef.current?.username?.focus();
        else {
            setError('');
            setNeedsOtp(false);
        }
    }, [open]);

    useEffect(() => {
        if (needsOtp) formRef.current?.otp?.focus();
    }, [needsOtp]);

    if (!open) return null;

    const submit = async (e) => {
        e.preventDefault();
        const form = formRef.current;
        setBusy(true);
        setError('');
        try {
            const res = await fetch('/api/editor/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    username: form.username.value,
                    password: form.password.value,
                    ...(needsOtp ? {otp: form.otp.value} : {}),
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                pendingLogin?.settle(true);
            } else {
                setError(data.error || `Sign-in failed (${res.status})`);
                if (data.otpRequired) {
                    if (form.otp) form.otp.value = '';
                    setNeedsOtp(true);
                }
            }
        } catch (err) {
            setError(`Sign-in failed: ${err.message}`);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="session-login-overlay fixed inset-0 z-[300] bg-[rgba(0,0,0,0.4)] flex items-center justify-center">
            <form
                ref={formRef}
                onSubmit={submit}
                noValidate
                role="dialog"
                aria-modal="true"
                aria-label="Sign in again"
                className="session-login w-[360px] max-w-[calc(100vw-48px)] px-6 py-5 bg-ed-surface border border-solid border-ed-border rounded-lg shadow-ed-pop text-left"
            >
                <div className="text-[15px] font-semibold text-ed-text mb-1">Sign in again</div>
                <div className="text-[12.5px] text-ed-text-muted mb-4">
                    Your admin session has ended. Your changes are kept and will be sent once you sign in.
                </div>
                <label className="block mb-3 text-[12px] font-medium text-ed-text">
                    User name
                    <input name="username" autoComplete="username" className={fieldCls}
                           onChange={() => setNeedsOtp(false)}/>
                </label>
                <label className="block mb-3 text-[12px] font-medium text-ed-text">
                    Password
                    <input name="password" type="password" autoComplete="current-password" className={fieldCls}
                           onChange={() => setNeedsOtp(false)}/>
                </label>
                {needsOtp && (
                    <label className="block mb-3 text-[12px] font-medium text-ed-text">
                        Code from Google Authenticator
                        <input name="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={8} className={fieldCls}/>
                    </label>
                )}
                <div className="min-h-[18px] mb-3 text-[12px] text-ed-danger" role="alert">{error}</div>
                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        className={`${btnCls} bg-ed-surface text-ed-text border-ed-border`}
                        onClick={() => pendingLogin?.settle(false)}
                        disabled={busy}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className={`${btnCls} bg-ed-primary border-ed-primary text-white`}
                        disabled={busy}
                    >
                        <span className="inline-flex items-center gap-1.5">
                            <UI.User size={14} strokeWidth={2}/>
                            {busy ? 'Signing in…' : 'Sign in'}
                        </span>
                    </button>
                </div>
            </form>
        </div>
    );
}
