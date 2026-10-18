"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Menu, X, Camera } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const role = (session?.user as any)?.role;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-serif text-xl font-semibold">
          <Camera className="h-5 w-5 text-primary" />
          <span>BoudoirDirectory</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/search" className="text-muted-foreground hover:text-foreground transition-colors">Browse</Link>
          <Link href="/categories/boudoir-photographer" className="text-muted-foreground hover:text-foreground transition-colors">Photographers</Link>
          <Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors">Blog</Link>
          <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">For Professionals</Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {session ? (
            <>
              {role === "admin" ? (
                <Link href="/admin"><Button variant="ghost" size="sm">Admin Panel</Button></Link>
              ) : (
                <Link href="/dashboard"><Button variant="ghost" size="sm">Dashboard</Button></Link>
              )}
              <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>Sign Out</Button>
            </>
          ) : (
            <>
              <Link href="/signin"><Button variant="ghost" size="sm">Sign In</Button></Link>
              <Link href="/join"><Button size="sm">Join Directory</Button></Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t bg-background px-4 py-4 space-y-3">
          <Link href="/search" className="block text-sm py-2" onClick={() => setMenuOpen(false)}>Browse Professionals</Link>
          <Link href="/categories/boudoir-photographer" className="block text-sm py-2" onClick={() => setMenuOpen(false)}>Photographers</Link>
          <Link href="/blog" className="block text-sm py-2" onClick={() => setMenuOpen(false)}>Blog</Link>
          <div className="pt-2 border-t space-y-2">
            {session ? (
              <>
                <Link href={role === "admin" ? "/admin" : "/dashboard"} onClick={() => setMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">Dashboard</Button>
                </Link>
                <Button variant="ghost" size="sm" className="w-full" onClick={() => signOut({ callbackUrl: "/" })}>Sign Out</Button>
              </>
            ) : (
              <>
                <Link href="/signin" onClick={() => setMenuOpen(false)}><Button variant="outline" size="sm" className="w-full">Sign In</Button></Link>
                <Link href="/join" onClick={() => setMenuOpen(false)}><Button size="sm" className="w-full">Join Directory</Button></Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
