import { neon } from "@neondatabase/serverless";
import BlogEditor from "../BlogEditor";

const sql = neon(process.env.DATABASE_URL!);

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [post] = await sql`SELECT * FROM blog_posts WHERE id = ${id}` as any[];
  return <BlogEditor initialPost={post} />;
}
