import { NextRequest, NextResponse } from 'next/server';
import { activeSessions } from '../login/route';

const CLIENT_ID = 'app_EMoamEEZ73f0CkXaXp7hrann';
const TOKEN_URL = 'https://auth.openai.com/oauth/token';
const REDIRECT_URI = 'http://localhost:1455/auth/callback';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');

  if (!code || !state) {
    return NextResponse.redirect(new URL('/?auth_error=missing_params', req.url));
  }

  // Find the PKCE session
  const session = activeSessions.get(state);
  if (!session) {
    return NextResponse.redirect(new URL('/?auth_error=invalid_state', req.url));
  }

  // Clean up the session
  activeSessions.delete(state);

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        code,
        redirect_uri: REDIRECT_URI,
        code_verifier: session.codeVerifier,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const contentType = tokenResponse.headers.get('content-type') || '';
      let errMsg = 'token_exchange_failed';
      
      if (contentType.includes('application/json')) {
        const errData = await tokenResponse.json();
        errMsg = errData.error_description || errData.error || errMsg;
      } else {
        const text = await tokenResponse.text();
        // Check for Cloudflare block
        if (text.includes('Just a moment') || text.includes('cf_chl')) {
          errMsg = 'Cloudflare bloqueou a requisição. Tente novamente em alguns segundos.';
        }
      }
      
      console.error('Token exchange failed:', errMsg);
      return NextResponse.redirect(new URL(`/?auth_error=${encodeURIComponent(errMsg)}`, req.url));
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    if (!access_token) {
      return NextResponse.redirect(new URL('/?auth_error=no_access_token', req.url));
    }

    // Redirect to the app with tokens stored in cookies
    const response = NextResponse.redirect(new URL('/?auth_success=true', req.url));

    response.cookies.set('chatgpt_access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: expires_in || 3600,
    });

    if (refresh_token) {
      response.cookies.set('chatgpt_refresh_token', refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
      });
    }

    const expiresAt = Date.now() + (expires_in || 3600) * 1000;
    response.cookies.set('chatgpt_expires_at', String(expiresAt), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: expires_in || 3600,
    });

    return response;

  } catch (err: unknown) {
    console.error('OAuth callback error:', err);
    return NextResponse.redirect(new URL('/?auth_error=network_error', req.url));
  }
}
