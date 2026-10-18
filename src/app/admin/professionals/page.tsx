import { neon } from "@neondatabase/serverless";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import ProfessionalAdminActions from "./ProfessionalAdminActions";

const sql = neon(process.env.DATABASE_URL!);

export default async function AdminProfessionalsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q: qParam, status: statusParam } = await searchParams;
  const q = qParam || "";
  const statusFilter = statusParam || "";

  const pros = q && statusFilter
    ? await sql`
        SELECT p.id, p.name, p.slug, p.city, p.state, p.status, p.tier, p.created_at,
          s.status as sub_status, s.current_period_end
        FROM professionals p
        LEFT JOIN subscriptions s ON s.professional_id = p.id
        WHERE (p.name ILIKE ${'%' + q + '%'} OR p.city ILIKE ${'%' + q + '%'})
          AND p.status = ${statusFilter}
        ORDER BY p.created_at DESC LIMIT 100`
    : q
    ? await sql`
        SELECT p.id, p.name, p.slug, p.city, p.state, p.status, p.tier, p.created_at,
          s.status as sub_status, s.current_period_end
        FROM professionals p
        LEFT JOIN subscriptions s ON s.professional_id = p.id
        WHERE (p.name ILIKE ${'%' + q + '%'} OR p.city ILIKE ${'%' + q + '%'})
        ORDER BY p.created_at DESC LIMIT 100`
    : statusFilter
    ? await sql`
        SELECT p.id, p.name, p.slug, p.city, p.state, p.status, p.tier, p.created_at,
          s.status as sub_status, s.current_period_end
        FROM professionals p
        LEFT JOIN subscriptions s ON s.professional_id = p.id
        WHERE p.status = ${statusFilter}
        ORDER BY p.created_at DESC LIMIT 100`
    : await sql`
        SELECT p.id, p.name, p.slug, p.city, p.state, p.status, p.tier, p.created_at,
          s.status as sub_status, s.current_period_end
        FROM professionals p
        LEFT JOIN subscriptions s ON s.professional_id = p.id
        ORDER BY p.created_at DESC LIMIT 100`;

  const statusColors: Record<string, string> = {
    approved: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    rejected: "bg-red-100 text-red-800",
    suspended: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-serif font-bold">Professionals ({pros.length})</h1>

      {/* Filters */}
      <form className="flex gap-3">
        <input name="q" defaultValue={q} placeholder="Search name or city..." className="flex-1 h-9 px-3 border border-input rounded-md text-sm bg-background" />
        <select name="status" defaultValue={statusFilter} className="h-9 px-3 border border-input rounded-md text-sm bg-background">
          <option value="">All statuses</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
          <option value="suspended">Suspended</option>
        </select>
        <button type="submit" className="h-9 px-4 bg-primary text-primary-foreground rounded-md text-sm">Filter</button>
      </form>

      <div className="space-y-3">
        {pros.map((pro: any) => (
          <Card key={pro.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{pro.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[pro.status]}`}>{pro.status}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted capitalize">{pro.tier}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex gap-3">
                    {pro.city && <span>{pro.city}, {pro.state}</span>}
                    <span>Sub: {pro.sub_status || "none"}</span>
                    <span>Joined {new Date(pro.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <ProfessionalAdminActions professionalId={pro.id} currentStatus={pro.status} slug={pro.slug} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
