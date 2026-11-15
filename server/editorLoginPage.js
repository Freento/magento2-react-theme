/**
 * The sign-in page the editor guard answers /editor with while there is no
 * session. Self-contained on purpose: the editor's own bundle sits behind the
 * same guard, so nothing else can load before the admin has signed in.
 */
export const editorLoginPage = () => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Editor sign-in</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: #f4f5f7; color: #1f2933; font: 14px/1.45 system-ui, -apple-system, "Segoe UI", sans-serif; }
  form { width: 340px; max-width: calc(100vw - 32px); padding: 28px 24px; background: #fff;
    border: 1px solid #dde1e6; border-radius: 8px; box-shadow: 0 6px 24px rgba(15, 76, 92, 0.08); }
  h1 { margin: 0 0 4px; font-size: 18px; }
  p { margin: 0 0 20px; color: #5f6b7a; font-size: 13px; }
  label { display: block; margin-bottom: 14px; font-size: 12.5px; font-weight: 500; }
  [hidden] { display: none; }
  input { display: block; width: 100%; height: 36px; margin-top: 6px; padding: 0 10px; font: inherit;
    border: 1px solid #c9ced6; border-radius: 4px; }
  input:focus { outline: none; border-color: #0f4c5c; box-shadow: 0 0 0 2px rgba(15, 76, 92, 0.15); }
  button { width: 100%; height: 36px; margin-top: 6px; font: inherit; font-weight: 600; color: #fff;
    background: #0f4c5c; border: none; border-radius: 4px; cursor: pointer; }
  button:disabled { opacity: 0.6; cursor: default; }
  .error { min-height: 18px; margin: 12px 0 0; color: #c0392b; font-size: 12.5px; }
</style>
</head>
<body>
<form id="login" novalidate>
  <h1>Content editor</h1>
  <p>Sign in with your Magento admin account.</p>
  <label>User name<input name="username" autocomplete="username" required autofocus></label>
  <label>Password<input name="password" type="password" autocomplete="current-password" required></label>
  <label class="otp" hidden>Code from Google Authenticator<input name="otp" inputmode="numeric" autocomplete="one-time-code" maxlength="8"></label>
  <button type="submit">Sign in</button>
  <div class="error" role="alert"></div>
</form>
<script>
  const form = document.getElementById('login');
  const error = form.querySelector('.error');
  const button = form.querySelector('button');
  const otp = form.querySelector('.otp');
  // A code belongs to the user name and password it was asked for.
  const dropOtp = () => {
    otp.hidden = true;
    form.otp.value = '';
  };
  form.username.addEventListener('input', dropOtp);
  form.password.addEventListener('input', dropOtp);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    error.textContent = '';
    button.disabled = true;
    try {
      const res = await fetch('/api/editor/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username.value,
          password: form.password.value,
          ...(otp.hidden ? {} : { otp: form.otp.value }),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) return window.location.reload();
      error.textContent = data.error || 'Sign-in failed (' + res.status + ')';
      if (data.otpRequired) {
        otp.hidden = false;
        form.otp.value = '';
        form.otp.focus();
      }
    } catch (err) {
      error.textContent = 'Sign-in failed: ' + err.message;
    }
    button.disabled = false;
  });
</script>
</body>
</html>`;
