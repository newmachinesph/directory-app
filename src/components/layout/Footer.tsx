import Link from "next/link";
import { Camera } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-serif text-lg font-semibold mb-3">
              <Camera className="h-4 w-4 text-primary" />
              BoudoirDirectory
            </Link>
            <p className="text-sm text-muted-foreground">The leading directory for vetted boudoir photographers and supporting professionals.</p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Discover</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/search" className="hover:text-foreground">Browse All</Link></li>
              <li><Link href="/categories/boudoir-photographer" className="hover:text-foreground">Photographers</Link></li>
              <li><Link href="/categories/makeup-artist" className="hover:text-foreground">Makeup Artists</Link></li>
              <li><Link href="/categories/hair-stylist" className="hover:text-foreground">Hair Stylists</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Cities</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/cities/new-york" className="hover:text-foreground">New York</Link></li>
              <li><Link href="/cities/los-angeles" className="hover:text-foreground">Los Angeles</Link></li>
              <li><Link href="/cities/chicago" className="hover:text-foreground">Chicago</Link></li>
              <li><Link href="/cities/miami" className="hover:text-foreground">Miami</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Professionals</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/join" className="hover:text-foreground">Join Directory</Link></li>
              <li><Link href="/pricing" className="hover:text-foreground">Pricing</Link></li>
              <li><Link href="/dashboard" className="hover:text-foreground">Dashboard</Link></li>
              <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© 2026 BoudoirDirectory. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
