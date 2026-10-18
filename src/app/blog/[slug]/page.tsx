import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { neon } from "@neondatabase/serverless";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

const sql = neon(process.env.DATABASE_URL!);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [post] = await sql`SELECT title, excerpt FROM blog_posts WHERE slug = ${slug} AND published_at IS NOT NULL` as any[];
  if (!post) return { title: "Not Found" };
  return { title: `${post.title} | BoudoirDirectory Blog`, description: post.excerpt };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post] = await sql`SELECT * FROM blog_posts WHERE slug = ${slug} AND published_at IS NOT NULL` as any[];
  if (!post) notFound();

  const related = await sql`
    SELECT title, slug, cover_image FROM blog_posts
    WHERE published_at IS NOT NULL AND id != ${post.id}
    ORDER BY published_at DESC LIMIT 3
  ` as any[];

  return (
    <article className="container mx-auto px-4 py-12 max-w-3xl">
      <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Blog
      </Link>

      {post.cover_image && (
        <div className="relative aspect-video rounded-xl overflow-hidden mb-8">
          <Image src={post.cover_image} alt={post.title} fill className="object-cover" priority />
        </div>
      )}

      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-serif font-bold leading-tight mb-4">{post.title}</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>By {post.author || "The Directory Team"}</span>
          <span>·</span>
          <time>{new Date(post.published_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</time>
        </div>
      </header>

      <div className="prose prose-gray max-w-none">
        {post.body.split("\n\n").map((para: string, i: number) => {
          if (para.startsWith("## ")) {
            return <h2 key={i} className="text-2xl font-serif font-semibold mt-8 mb-4">{para.slice(3)}</h2>;
          }
          if (para.startsWith("# ")) {
            return <h1 key={i} className="text-3xl font-serif font-bold mt-8 mb-4">{para.slice(2)}</h1>;
          }
          return <p key={i} className="mb-4 leading-relaxed text-muted-foreground">{para}</p>;
        })}
      </div>

      {related.length > 0 && (
        <div className="mt-16 pt-8 border-t">
          <h3 className="text-xl font-serif font-semibold mb-6">More from the Blog</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {related.map((p: any) => (
              <Link key={p.slug} href={`/blog/${p.slug}`} className="group">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted mb-2">
                  {p.cover_image && <Image src={p.cover_image} alt={p.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />}
                </div>
                <p className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2">{p.title}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
