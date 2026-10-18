import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { professionals, portfolioImages } from "@/db/schema";
import { eq } from "drizzle-orm";

const f = createUploadthing();

export const ourFileRouter = {
  portfolioImage: f({ image: { maxFileSize: "8MB", maxFileCount: 10 } })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user?.id) throw new Error("Unauthorized");

      const [pro] = await db.select({ id: professionals.id, tier: professionals.tier })
        .from(professionals)
        .where(eq(professionals.userId, session.user.id));
      if (!pro) throw new Error("No professional profile found");

      // Check image limit based on tier
      const maxImages = { basic: 10, professional: 30, elite: 999 };
      const currentCount = await db.$count(portfolioImages, eq(portfolioImages.professionalId, pro.id));
      const max = maxImages[pro.tier as keyof typeof maxImages] || 10;
      if (currentCount >= max) {
        throw new Error(`Image limit reached for ${pro.tier} plan (${max} images)`);
      }

      return { professionalId: pro.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Get current max sort order
      const images = await db.select({ sortOrder: portfolioImages.sortOrder })
        .from(portfolioImages)
        .where(eq(portfolioImages.professionalId, metadata.professionalId))
        .orderBy(portfolioImages.sortOrder);
      const maxOrder = images.length > 0 ? Math.max(...images.map(i => i.sortOrder ?? 0)) : -1;

      await db.insert(portfolioImages).values({
        professionalId: metadata.professionalId,
        url: file.ufsUrl,
        caption: file.name.replace(/\.[^/.]+$/, ""),
        sortOrder: maxOrder + 1,
        isApproved: false, // pending admin approval
      });

      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
