import { NextResponse } from 'next/server';
import crypto from 'crypto';
import http from 'http';

// ============================================================================
// Constants — MUST match the pi-ai / OpenAI Codex CLI exactly
// ============================================================================
const CLIENT_ID = 'app_EMoamEEZ73f0CkXaXp7hrann';
const AUTHORIZE_URL = 'https://auth.openai.com/oauth/authorize';
const REDIRECT_URI = 'http://localhost:1455/auth/callback';
const SCOPE = 'openid profile email offline_access';
const HELPER_PORT = 1455;

// ============================================================================
// PKCE helpers — identical to pi-ai/pkce.ts
// ============================================================================
function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

// ============================================================================
// In-memory session store (single server instance)
// ============================================================================
const activeSessions = new Map<string, { codeVerifier: string; createdAt: number }>();

let activeHelper: http.Server | null = null;
let activeHelperTimeout: NodeJS.Timeout | null = null;

function cleanupSessions() {
  const now = Date.now();
  for (const [key, session] of activeSessions) {
    if (now - session.createdAt > 10 * 60 * 1000) activeSessions.delete(key);
  }
}

function shutdownHelper() {
  if (activeHelperTimeout) { clearTimeout(activeHelperTimeout); activeHelperTimeout = null; }
  if (activeHelper) { activeHelper.close(); activeHelper = null; }
}

// ============================================================================
// POST /api/auth/login
// ============================================================================
export async function POST() {
  cleanupSessions();
  
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = crypto.randomBytes(16).toString('hex');
  const mainPort = process.env.PORT || '3000';

  activeSessions.set(state, { codeVerifier, createdAt: Date.now() });

  // Shutdown any existing helper
  shutdownHelper();

  // Start a temporary HTTP server on port 1455 to catch the callback
  try {
    await new Promise<void>((resolve, reject) => {
      const server = http.createServer((req, res) => {
        const url = new URL(req.url || '/', `http://localhost`);
        
        if (url.pathname !== '/auth/callback') {
          res.writeHead(404);
          res.end('Not Found');
          return;
        }

        const code = url.searchParams.get('code');
        const cbState = url.searchParams.get('state');
        const error = url.searchParams.get('error');

        if (error) {
          const desc = url.searchParams.get('error_description') || error;
          res.writeHead(302, { Location: `http://localhost:${mainPort}/?auth_error=${encodeURIComponent(desc)}` });
          res.end();
        } else if (code && cbState) {
          // Redirect to our main app to exchange the code for tokens
          res.writeHead(302, { 
            Location: `http://localhost:${mainPort}/api/auth/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(cbState)}` 
          });
          res.end();
        } else {
          res.writeHead(302, { Location: `http://localhost:${mainPort}/?auth_error=missing_params` });
          res.end();
        }

        setTimeout(() => shutdownHelper(), 1000);
      });

      server.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          reject(new Error('Porta 1455 já está em uso. Feche outras instâncias do Codex CLI ou OpenClaw.'));
        } else {
          reject(err);
        }
      });

      // Bind to 127.0.0.1 (same as pi-ai)
      server.listen(HELPER_PORT, '127.0.0.1', () => {
        activeHelper = server;
        activeHelperTimeout = setTimeout(() => shutdownHelper(), 5 * 60 * 1000);
        resolve();
      });
    });
  } catch (err: unknown) {
    activeSessions.delete(state);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Falha ao iniciar servidor de autenticação' }, { status: 500 });
  }

  // Build the authorization URL — EXACT same parameters as pi-ai/openai-codex.ts
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', CLIENT_ID);
  url.searchParams.set('redirect_uri', REDIRECT_URI);
  url.searchParams.set('scope', SCOPE);
  url.searchParams.set('code_challenge', codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('state', state);
  url.searchParams.set('id_token_add_organizations', 'true');
  url.searchParams.set('codex_cli_simplified_flow', 'true');
  url.searchParams.set('originator', 'pi');

  return NextResponse.json({ url: url.toString() });
}

export { activeSessions };
