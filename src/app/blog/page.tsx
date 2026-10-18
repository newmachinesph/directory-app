import { neon } from "@neondatabase/serverless";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import type { Metadata } from "next";

const sql = neon(process.env.DATABASE_URL!);

export const metadata: Metadata = {
  title: "Blog | BoudoirDirectory",
  description: "Tips, guides, and resources for boudoir photography clients and professionals.",
};

export default async function BlogPage() {
  const posts = await sql`
    SELECT id, title, slug, excerpt, cover_image, author, published_at
    FROM blog_posts WHERE published_at IS NOT NULL
    ORDER BY published_at DESC
  `;

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-serif font-bold mb-3">Blog</h1>
        <p className="text-muted-foreground">Tips, guides, and inspiration for your boudoir journey.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post: any) => (
          <Link key={post.id} href={`/blog/${post.slug}`} className="group">
            <Card className="overflow-hidden hover:shadow-md transition-shadow h-full">
              {post.cover_image && (
                <div className="relative aspect-video overflow-hidden">
                  <Image src={post.cover_image} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              )}
              <CardContent className="p-5 flex flex-col flex-1">
                <h2 className="font-semibold text-lg leading-snug group-hover:text-primary transition-colors mb-2">{post.title}</h2>
                {post.excerpt && <p className="text-sm text-muted-foreground line-clamp-3 flex-1">{post.excerpt}</p>}
                <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                  <span>{post.author}</span>
                  <span>{new Date(post.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
