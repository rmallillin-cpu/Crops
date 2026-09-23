export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/form/:path*", "/admin/:path*"],
};
