import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/memoriali",
  "/inviti",
  "/notifiche",
  "/profilo",
  "/impostazioni",
  "/memoriale/crea",
];

// Routes that are always accessible (API, static assets)
const alwaysAccessible = [
  "/_next",
  "/api",
  "/favicon",
  "/images",
  "/fonts",
];

function nextWithPathname(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = nextWithPathname(request);

  // Check if route is always accessible early
  if (alwaysAccessible.some((route) => pathname.startsWith(route))) {
    return response;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  // Without Supabase env vars, skip auth proxy so the site still loads
  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response = nextWithPathname(request);
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: "", ...options });
        response = nextWithPathname(request);
        response.cookies.set({ name, value: "", ...options });
      },
    },
  });

  // Refresh session if it exists
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users from auth pages
  if ((pathname === "/login" || pathname === "/registrati") && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Check memorial access permissions for /memoriale/[slug]/* routes
  if (pathname.startsWith("/memoriale/") && !pathname.startsWith("/memoriale/crea")) {
    // Memorial pages handle their own access control via RLS and server components
    // This proxy just ensures auth state is refreshed
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot|mp4|webm)$).*)",
  ],
};
