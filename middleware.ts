import { NextRequest, NextResponse } from 'next/server';
import { fetchAuthSession } from 'aws-amplify/auth/server';
import { runWithAmplifyServerContext } from '@/utils/amplifyServerUtils';

const protectedRoutes = ["/stock"];
const publicRoutes = ['/', '/login', '/signup']; // Add all your public routes

export default async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const path = request.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  const isPublicRoute = publicRoutes.includes(path);

  // Debug logs
  console.log('Middleware triggered for path:', path);

  try {
    const authenticated = await runWithAmplifyServerContext({
      nextServerContext: { request, response },
      operation: async (context: any) => {
        try {
          const session = await fetchAuthSession(context, {});
          const isAuth = !!session.tokens?.accessToken && 
                        session.tokens.accessToken.toString().length > 0;
          console.log('Auth check result:', isAuth);
          return isAuth;
        } catch (err) {
          console.log('Auth error:', err);
          return false;
        }
      }
    });

    console.log('Final authenticated status:', authenticated);

    // Redirect unauthenticated users from protected routes
    if (isProtectedRoute && !authenticated) {
      console.log('Redirecting to / (protected route, not authenticated)');
      return NextResponse.redirect(new URL('/', request.nextUrl));
    }

    // Redirect authenticated users from public routes to stock
    if (isPublicRoute && authenticated && path !== '/stock') {
      console.log('Redirecting to /stock (authenticated on public route)');
      return NextResponse.redirect(new URL('/stock', request.nextUrl));
    }

  } catch (error) {
    console.log('Middleware error:', error);
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL('/', request.nextUrl));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};