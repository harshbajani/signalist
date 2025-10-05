import {NextRequest, NextResponse} from 'next/server';
import {getSessionCookie} from "better-auth/cookies";
import {updateUserLastVisit} from "@/lib/actions/user.actions";
import {getAuth} from "@/lib/better-auth/auth";

export async function middleware(request: NextRequest) {
    const sessionCookie = getSessionCookie(request);

    // Check cookie presence - prevents obviously unauthorized users
    if (!sessionCookie) {
        return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    // Track user activity (throttled to avoid database spam)
    // Only track on main page visits, not on API calls or assets
    const shouldTrackVisit = (
        !request.nextUrl.pathname.startsWith('/api') &&
        !request.nextUrl.pathname.startsWith('/_next') &&
        request.method === 'GET'
    );

    // Track user activity (throttled approach)
    if (shouldTrackVisit && sessionCookie) {
        try {
            const lastTrackedCookie = request.cookies.get('lastVisitTracked')?.value;
            const today = new Date().toDateString();
            
            // Only update once per day per user to avoid database spam
            if (lastTrackedCookie !== today) {
                // Get user session using Better Auth
                const auth = await getAuth();
                const session = await auth.api.getSession({
                    headers: request.headers
                });
                
                if (session && session.user && session.user.email) {
                    // Update user's last visit in background (non-blocking)
                    updateUserLastVisit(session.user.email).catch(err => {
                        console.error('Failed to update user last visit:', err);
                    });
                    
                    // Set response with updated cookie to throttle future updates
                    const response = NextResponse.next();
                    response.cookies.set('lastVisitTracked', today, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'lax',
                        maxAge: 60 * 60 * 24 // 24 hours
                    });
                    return response;
                }
            }
        } catch (err) {
            // If session retrieval fails, continue without tracking
            console.error('Error tracking user visit:', err);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|sign-in|sign-up|assets).*)',
    ],
};