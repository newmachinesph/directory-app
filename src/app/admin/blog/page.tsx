import { neon } from "@neondatabase/serverless";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import BlogPostActions from "./BlogPostActions";

const sql = neon(process.env.DATABASE_URL!);

export default async function AdminBlogPage() {
  const posts = await sql`
    SELECT id, title, slug, excerpt, published_at, created_at, author
    FROM blog_posts ORDER BY created_at DESC
  `;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif font-bold">Blog Posts</h1>
        <Link href="/admin/blog/new"><Button size="sm">+ New Post</Button></Link>
      </div>
      <div className="space-y-3">
        {posts.map((post: any) => (
          <Card key={post.id}>
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{post.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${post.published_at ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"}`}>
                    {post.published_at ? "Published" : "Draft"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{post.excerpt}</p>
              </div>
              <BlogPostActions postId={post.id} published={!!post.published_at} slug={post.slug} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
