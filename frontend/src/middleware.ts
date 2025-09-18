import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  
  // Redirect authenticated users away from login page
  if (pathname === "/login" && req.auth) {
    return NextResponse.redirect(new URL("/", req.url))
  }
  
  // Add any protected routes here
  // const protectedRoutes = ["/dashboard", "/profile", "/mysettings"]
  // if (protectedRoutes.some(route => pathname.startsWith(route)) && !req.auth) {
  //   return NextResponse.redirect(new URL("/login", req.url))
  // }
  
  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}