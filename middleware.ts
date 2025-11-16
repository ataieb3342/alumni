export { auth as middleware } from "@/lib/auth"

export const config = {
  matcher: [
    '/profil/:path*',
    '/annuaire/:path*',
    '/api/stats/:path*',
    '/api/newsletter/export/:path*',
    '/api/newsletter/sync-drive/:path*',
    '/api/announcements/create/:path*',
    '/api/announcements/:id/delete',
    '/api/profile/update/:path*',
    '/api/user/delete/:path*',
    '/api/user/preferences/:path*',
  ],
}