import { neon } from "@neondatabase/serverless";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar } from "lucide-react";
import ApplicationActions from "./ApplicationActions";

const sql = neon(process.env.DATABASE_URL!);

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusParam } = await searchParams;
  const status = statusParam || "pending";

  const applications = await sql`
    SELECT
      a.id as app_id, a.status as app_status, a.notes, a.created_at,
      p.id, p.name, p.slug, p.city, p.state, p.bio, p.tier,
      p.contact_email, p.profile_completeness,
      (SELECT json_agg(json_build_object('id', c.id, 'name', c.name))
       FROM categories c JOIN professional_categories pc ON pc.category_id = c.id WHERE pc.professional_id = p.id) as categories,
      (SELECT COUNT(*)::int FROM portfolio_images pi WHERE pi.professional_id = p.id) as image_count
    FROM applications a
    JOIN professionals p ON p.id = a.professional_id
    WHERE a.status = ${status}
    ORDER BY a.created_at DESC
  `;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif font-bold">Applications</h1>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2">
        {["pending", "approved", "rejected"].map((s) => (
          <a key={s} href={`/admin/applications?status=${s}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${status === s ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}>
            {s}
          </a>
        ))}
      </div>

      {applications.length === 0 ? (
        <p className="text-muted-foreground text-sm">No {status} applications.</p>
      ) : (
        <div className="space-y-4">
          {applications.map((app: any) => (
            <Card key={app.app_id}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{app.name}</h3>
                      <Badge variant="outline" className="capitalize">{app.tier}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
                      {app.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{app.city}, {app.state}</span>}
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(app.created_at).toLocaleDateString()}</span>
                      <span>{app.image_count} images</span>
                      <span>{app.profile_completeness}% complete</span>
                    </div>
                    {app.bio && <p className="text-sm text-muted-foreground line-clamp-2">{app.bio}</p>}
                    {app.categories && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {app.categories.map((cat: any) => (
                          <span key={cat.id} className="text-xs px-2 py-0.5 bg-muted rounded-full">{cat.name}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  {status === "pending" && (
                    <ApplicationActions professionalId={app.id} applicationId={app.app_id} />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
