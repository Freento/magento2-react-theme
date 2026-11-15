import { execFile } from 'node:child_process';
import path from 'node:path';
import { logError } from './log.js';

const identityArgs = () => {
  const name = (process.env.GIT_USER_NAME || '').trim();
  const email = (process.env.GIT_USER_EMAIL || '').trim();
  return [
    ...(name ? ['-c', `user.name=${name}`] : []),
    ...(email ? ['-c', `user.email=${email}`] : []),
  ];
};

export function createGit(repoDir) {
  const runGit = (args) =>
    new Promise((resolve) => {
      execFile('git', [...identityArgs(), ...args], { cwd: repoDir, timeout: 30_000 }, (err, stdout, stderr) => {
        resolve({
          code: err ? (err.code ?? 1) : 0,
          stdout: String(stdout || ''),
          stderr: String(stderr || ''),
          error: err?.message || null,
        });
      });
    });

  const logFailure = (step, r) => {
    if (r && r.code !== 0) {
      console.error(`[editor git] ${step} (exit ${r.code}):`, r.stderr || r.error || '');
      logError('git', `${step} failed (exit ${r.code})`, r.stderr || r.error || '');
    }
  };

  const commitPaths = async (files, message) => {
    const relPaths = files.filter(Boolean).map((f) => path.relative(repoDir, f));
    if (relPaths.length === 0) return false;
    try {
      const staged = await runGit(['add', '--', ...relPaths]);
      logFailure('add', staged);
      const status = await runGit(['status', '--porcelain', '--', ...relPaths]);
      logFailure('status', status);
      if (status.stdout.trim().length === 0) return false;
      const commit = await runGit(['commit', '-m', message, '--', ...relPaths]);
      logFailure('commit', commit);
      return commit.code === 0;
    } catch (err) {
      console.error('[editor git]', err.message);
      logError('git', 'commit threw', err);
      return false;
    }
  };

  const syncWithRemote = async () => {
    const rebase = await runGit(['pull', '--rebase', '--autostash']);
    const steps = [{ step: 'pull --rebase', ...rebase }];
    if (rebase.code !== 0) { logError('publish', 'git pull --rebase failed', rebase.stderr || rebase.error); return { ok: false, steps, error: 'pull failed' }; }
    const sent = await runGit(['push']);
    steps.push({ step: 'push', ...sent });
    if (sent.code !== 0) { logError('publish', 'git push failed', sent.stderr || sent.error); return { ok: false, steps, error: 'push failed' }; }
    return { ok: true, steps };
  };

  const stepsToMessage = (steps) =>
    (steps || [])
      .filter((s) => s.code !== 0 || s.stderr)
      .map((s) => `[${s.step}] ${s.stderr || s.error || `exit ${s.code}`}`)
      .join('\n');

  const commitAndPublish = async (files, message) => {
    const committed = await commitPaths(files, message);
    if (!committed) return { committed: false, published: false, publishError: null };
    const result = await syncWithRemote();
    if (result.ok) return { committed: true, published: true, publishError: null };
    return {
      committed: true,
      published: false,
      publishError: stepsToMessage(result.steps) || result.error || 'publish failed',
    };
  };

  return { runGit, commitPaths, syncWithRemote, stepsToMessage, commitAndPublish };
}
