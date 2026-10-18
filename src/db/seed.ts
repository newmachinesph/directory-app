import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { sql, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
dotenv.config();

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient, { schema });

const {
  users, professionals, categories, professionalCategories,
  portfolioImages, subscriptions, reviews, applications, blogPosts,
} = schema;

const CITIES = [
  { city: "New York", state: "NY", zip: "10001", lat: 40.7128, lng: -74.0060 },
  { city: "Los Angeles", state: "CA", zip: "90001", lat: 34.0522, lng: -118.2437 },
  { city: "Chicago", state: "IL", zip: "60601", lat: 41.8781, lng: -87.6298 },
  { city: "Houston", state: "TX", zip: "77001", lat: 29.7604, lng: -95.3698 },
  { city: "Dallas", state: "TX", zip: "75201", lat: 32.7767, lng: -96.7970 },
  { city: "Atlanta", state: "GA", zip: "30301", lat: 33.7490, lng: -84.3880 },
  { city: "Miami", state: "FL", zip: "33101", lat: 25.7617, lng: -80.1918 },
  { city: "Baton Rouge", state: "LA", zip: "70801", lat: 30.4515, lng: -91.1871 },
  { city: "Nashville", state: "TN", zip: "37201", lat: 36.1627, lng: -86.7816 },
  { city: "Denver", state: "CO", zip: "80201", lat: 39.7392, lng: -104.9903 },
];

const PROFESSIONAL_NAMES = [
  "Velvet Rose Boudoir", "Studio Noir Photography", "Sarah Thompson Photography",
  "The Intimate Frame", "Lace & Light Studio", "Golden Hour Boudoir",
  "Midnight Muse Photography", "Silk & Shadow Studio", "Belle Époque Boudoir",
  "Crimson Lens Studio", "Aurora Boudoir Co", "Whisper & Light Photography",
  "The Boudoir Collective", "Sable Studio", "Ivory & Ink Photography",
  "Luna Rose Boudoir", "Noir & Nude Studio", "The Velvet Room",
  "Ember Light Photography", "Magnolia Boudoir Studio", "Scarlett Frame Co",
  "The Opulent Lens", "Blossom & Bare Studio", "Diamond Dusk Photography",
  "The Intimate Gallery", "Raven Photography Studio", "Seraphina Boudoir",
  "Fleur Noire Studio", "Luxe Lens Boudoir", "Gossamer Light Photography",
  "Obsidian Studio", "Pearl & Petal Boudoir", "Copper Hour Photography",
  "The Allure Studio", "Halo Light Boudoir", "Jasmine & Co Photography",
  "Studio Glow Boudoir", "Celeste Photography", "The Boudoir Suite",
  "Amara Light Studio", "Onyx Frame Photography", "Rose Gold Boudoir",
  "The Sultry Frame", "Dusk & Dawn Photography", "Studio Reverie",
  "Bare Beauty Photography", "The Lux Boudoir", "Siren Photography Co",
  "Penumbra Studio", "Veritas Boudoir Photography",
];

const BIOS = [
  "Specializing in empowering boudoir photography that celebrates every body. With over 8 years of experience, I create a safe, comfortable space for every client to shine.",
  "Award-winning photographer focused on intimate portraiture. My studio is a judgment-free zone where confidence is born and beauty is celebrated.",
  "Luxury boudoir photography in the heart of the city. Every session is tailored to highlight your unique beauty and capture your authentic self.",
  "I believe every person deserves to see themselves as the work of art they truly are. Let's create stunning images together that you'll treasure forever.",
  "Fine art boudoir photography with a cinematic touch. I specialize in creating editorial-quality images that tell your story with elegance and grace.",
  "My philosophy: every session should feel like a day at the spa. Relaxed, pampered, and leaving with images that take your breath away.",
  "Transformative boudoir experiences for women of all shapes, sizes, and backgrounds. Your comfort and confidence are my top priorities.",
  "Studio and lifestyle boudoir photographer with a passion for natural light and authentic moments. Let's capture the real you.",
];

const REVIEW_BODIES = [
  "Absolutely amazing experience! I felt so comfortable and the photos turned out stunning. Would 100% recommend to anyone considering a boudoir session.",
  "I was so nervous going in but the photographer made me feel completely at ease. The final images exceeded every expectation I had. A truly transformative experience.",
  "Professional, talented, and incredibly kind. I've never felt more beautiful in my life. The photos are works of art.",
  "The best decision I ever made for myself. The whole experience was empowering and the results are breathtaking. Already planning my next session!",
  "From the first consultation to receiving my final gallery, every step was perfect. I cannot recommend this studio highly enough.",
  "I gifted this session to myself for my birthday and it was the best gift I've ever given myself. Absolutely stunning work.",
];

async function cleanDatabase() {
  // Clean in dependency order
  await db.delete(reviews);
  await db.delete(applications);
  await db.delete(portfolioImages);
  await db.delete(professionalCategories);
  await db.delete(subscriptions);
  await db.delete(blogPosts);
  await db.delete(professionals);
  await db.delete(categories);
  await db.delete(users);
  console.log("Database cleaned.");
}

async function seed() {
  console.log("🌱 Starting seed...");

  await cleanDatabase();

  // Admin user
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) throw new Error("ADMIN_PASSWORD must be set to seed the admin user");
  const adminHash = await bcrypt.hash(adminPassword, 12);
  const [adminUser] = await db.insert(users).values({
    email: process.env.ADMIN_EMAIL ?? "admin@example.com",
    passwordHash: adminHash,
    role: "admin",
  }).returning();
  console.log("✅ Admin user created");

  // Categories
  const categoryData = [
    { name: "Boudoir Photographer", slug: "boudoir-photographer", description: "Professional boudoir and intimate portraiture photographers", icon: "camera", sortOrder: 1 },
    { name: "Makeup Artist", slug: "makeup-artist", description: "Professional makeup artists for boudoir sessions", icon: "sparkles", sortOrder: 2 },
    { name: "Hair Stylist", slug: "hair-stylist", description: "Professional hair stylists for photoshoots", icon: "scissors", sortOrder: 3 },
    { name: "Wardrobe Stylist", slug: "wardrobe-stylist", description: "Wardrobe and lingerie styling specialists", icon: "shirt", sortOrder: 4 },
    { name: "Lingerie Boutique", slug: "lingerie-boutique", description: "Luxury lingerie retailers and boutiques", icon: "heart", sortOrder: 5 },
    { name: "Body Painter", slug: "body-painter", description: "Professional body painting artists", icon: "palette", sortOrder: 6 },
    { name: "Photo Retoucher", slug: "photo-retoucher", description: "Post-processing and retouching specialists", icon: "image", sortOrder: 7 },
    { name: "Photography Studio", slug: "photography-studio", description: "Rentable studio spaces for shoots", icon: "building", sortOrder: 8 },
  ];

  const insertedCategories = await db.insert(categories).values(categoryData).returning();
  console.log(`✅ ${insertedCategories.length} categories created`);

  // 50 approved professionals
  for (let i = 0; i < 50; i++) {
    const cityData = CITIES[i % CITIES.length];
    const name = PROFESSIONAL_NAMES[i];
    // Create unique slug
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const slug = `${baseSlug}-${i}`;
    const tier = i < 10 ? "elite" : i < 25 ? "professional" : "basic";
    const latJitter = (Math.random() - 0.5) * 0.15;
    const lngJitter = (Math.random() - 0.5) * 0.15;
    const lat = cityData.lat + latJitter;
    const lng = cityData.lng + lngJitter;

    const proHash = await bcrypt.hash("Pro123!", 10);
    const [user] = await db.insert(users).values({
      email: `pro${i}@example.com`,
      passwordHash: proHash,
      role: "professional",
    }).returning();

    const [pro] = await db.insert(professionals).values({
      userId: user.id,
      name,
      slug,
      bio: BIOS[i % BIOS.length],
      specialties: i % 3 === 0
        ? "Boudoir, Intimate Portraiture, Empowerment Photography"
        : i % 3 === 1
        ? "Fine Art Boudoir, Editorial, Lifestyle"
        : "Luxury Boudoir, Bridal Boudoir, Maternity",
      contactEmail: `contact@${baseSlug.replace(/-/g, "")}.com`,
      contactPhone: `(${500 + i}) ${200 + i}-${1000 + i}`,
      website: `https://www.${baseSlug.replace(/-/g, "")}.com`,
      city: cityData.city,
      state: cityData.state,
      zip: cityData.zip,
      country: "US",
      latitude: lat,
      longitude: lng,
      serviceRadiusMiles: [25, 50, 75, 100][i % 4],
      status: "approved",
      tier: tier as "basic" | "professional" | "elite",
      profileCompleteness: 85 + (i % 15),
    }).returning();

    // Update PostGIS location
    await sqlClient`
      UPDATE professionals
      SET location = ST_MakePoint(${lng}, ${lat})::geography
      WHERE id = ${pro.id}
    `;

    // Update search_vector
    await sqlClient`
      UPDATE professionals
      SET search_vector = to_tsvector('english', ${name} || ' ' || ${BIOS[i % BIOS.length]} || ' ' || ${cityData.city} || ' ' || ${cityData.state})
      WHERE id = ${pro.id}
    `;

    // Active subscription
    await db.insert(subscriptions).values({
      professionalId: pro.id,
      status: "active",
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    // Portfolio images (picsum with consistent seeds)
    const imageCount = 4 + (i % 5);
    for (let j = 0; j < imageCount; j++) {
      await db.insert(portfolioImages).values({
        professionalId: pro.id,
        url: `https://picsum.photos/seed/${baseSlug}-${j}/800/1000`,
        caption: [`Empowerment session`, `Studio shoot`, `Natural light`, `Glamour session`, `Editorial series`][j % 5],
        sortOrder: j,
        isApproved: true,
      });
    }

    // Categories (2 per professional, primary is boudoir-photographer for most)
    const cat1 = insertedCategories[i % insertedCategories.length];
    const cat2 = insertedCategories[(i + 2) % insertedCategories.length];
    await db.insert(professionalCategories).values([
      { professionalId: pro.id, categoryId: cat1.id },
    ]);
    if (cat1.id !== cat2.id) {
      await db.insert(professionalCategories).values([
        { professionalId: pro.id, categoryId: cat2.id },
      ]);
    }

    // Reviews (approved)
    const reviewCount = 2 + (i % 4);
    const reviewerNames = ["Emily R.", "Jessica M.", "Amanda K.", "Sarah L.", "Nicole T.", "Lauren B.", "Melissa W.", "Rachel H."];
    for (let k = 0; k < reviewCount; k++) {
      await db.insert(reviews).values({
        professionalId: pro.id,
        reviewerName: reviewerNames[(i + k) % reviewerNames.length],
        reviewerEmail: `reviewer${i}${k}@example.com`,
        rating: k % 5 === 0 ? 4 : 5,
        body: REVIEW_BODIES[(i + k) % REVIEW_BODIES.length],
        isApproved: true,
      });
    }

    if (i % 10 === 0) console.log(`  Created professional ${i + 1}/50: ${name}`);
  }
  console.log("✅ 50 approved professionals created");

  // 10 pending applications
  for (let i = 50; i < 60; i++) {
    const cityData = CITIES[i % CITIES.length];
    const name = `${["Studio", "Photography", "Boudoir"][i % 3]} ${["Azure", "Crimson", "Silver", "Onyx", "Pearl"][i % 5]} ${["Co", "Studio", "Photography", "Arts"][i % 4]}`;
    const slug = `pending-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${i}`;

    const pendHash = await bcrypt.hash("Pro123!", 10);
    const [user] = await db.insert(users).values({
      email: `pending${i}@example.com`,
      passwordHash: pendHash,
      role: "professional",
    }).returning();

    const [pro] = await db.insert(professionals).values({
      userId: user.id,
      name,
      slug,
      bio: BIOS[i % BIOS.length],
      city: cityData.city,
      state: cityData.state,
      zip: cityData.zip,
      latitude: cityData.lat,
      longitude: cityData.lng,
      status: "pending",
      tier: "basic",
      profileCompleteness: 60 + (i % 30),
    }).returning();

    // Portfolio images for pending
    for (let j = 0; j < 3; j++) {
      await db.insert(portfolioImages).values({
        professionalId: pro.id,
        url: `https://picsum.photos/seed/pending-${i}-${j}/800/1000`,
        caption: `Portfolio ${j + 1}`,
        sortOrder: j,
        isApproved: false,
      });
    }

    await db.insert(applications).values({
      professionalId: pro.id,
      status: "pending",
    });
  }
  console.log("✅ 10 pending applications created");

  // Blog posts
  const blogData = [
    {
      title: "How to Prepare for Your First Boudoir Session",
      slug: "how-to-prepare-first-boudoir-session",
      excerpt: "Everything you need to know before stepping in front of the camera for your first boudoir photoshoot.",
      body: `A boudoir session is one of the most empowering experiences you can give yourself. Whether you're doing it as a gift, to celebrate a milestone, or simply for yourself, preparation is key to making the most of your time with your photographer.\n\n## Choose Your Wardrobe Thoughtfully\n\nBring 3-5 outfits that make you feel confident and beautiful. Mix lingerie with casual pieces — an oversized sweater, a silk robe, or even just a great pair of jeans can create stunning images.\n\n## Book Hair and Makeup\n\nMost boudoir photographers recommend professional hair and makeup for your session. It's not about changing how you look — it's about feeling polished and camera-ready so you can focus on having fun.\n\n## Get Plenty of Rest\n\nYour skin and eyes will thank you. Try to get at least 8 hours of sleep the night before your session and stay well hydrated in the days leading up to it.\n\n## Trust Your Photographer\n\nYou've vetted them for a reason. Your photographer has done this hundreds of times and knows exactly how to make you look and feel amazing. Surrender to the process and enjoy every moment.`,
      author: "The Directory Team",
      publishedAt: new Date("2026-01-15"),
      coverImage: "https://picsum.photos/seed/blog-1/1200/600",
    },
    {
      title: "Top Boudoir Photographers in New York City",
      slug: "top-boudoir-photographers-new-york-city",
      excerpt: "Find the best vetted boudoir photographers New York City has to offer, from luxury studios to intimate home studios.",
      body: `New York City is home to some of the world's most talented boudoir photographers. Whether you're looking for a luxury studio experience in Manhattan or a more intimate session in Brooklyn, the city has something for everyone.\n\n## What Makes NYC Boudoir Unique\n\nNew York photographers bring an editorial sensibility to their work — expect bold lighting, cinematic compositions, and images that look like they belong in a magazine. The energy of the city infuses every shoot.\n\n## Questions to Ask Before Booking\n\nAlways review a photographer's full portfolio, read reviews, and schedule a consultation before committing. The right photographer will make you feel comfortable and excited, not pressured.`,
      author: "The Directory Team",
      publishedAt: new Date("2026-02-01"),
      coverImage: "https://picsum.photos/seed/blog-2/1200/600",
    },
    {
      title: "What to Wear for a Boudoir Shoot",
      slug: "what-to-wear-boudoir-shoot",
      excerpt: "A complete guide to choosing outfits, lingerie, and accessories that photograph beautifully.",
      body: `Choosing the right wardrobe can make or break your boudoir session. The goal is to choose pieces that make you feel confident, comfortable, and like the most elevated version of yourself.\n\n## The Foundation: Lingerie\n\nInvest in at least one great lingerie set. It doesn't need to be expensive — what matters is fit and how it makes you feel. Bring options in different styles: romantic lace, sleek satin, bold colors.\n\n## Layering Pieces\n\nSome of the most stunning boudoir images incorporate layering: a sheer robe over lingerie, a button-down shirt half-open, a men's dress shirt. These add dimension and variety to your gallery.\n\n## Accessories Matter\n\nHeels elongate the legs and add polish. Jewelry should be meaningful to you. A great pair of earrings or a delicate necklace can elevate a simple look dramatically.`,
      author: "The Directory Team",
      publishedAt: new Date("2026-02-20"),
      coverImage: "https://picsum.photos/seed/blog-3/1200/600",
    },
    {
      title: "The Rise of Empowerment Photography",
      slug: "rise-of-empowerment-photography",
      excerpt: "How boudoir photography transformed from taboo to one of the most empowering experiences women are giving themselves.",
      body: `Over the past decade, boudoir photography has undergone a remarkable transformation. What was once considered risqué or niche has become a mainstream celebration of self-love, body positivity, and feminine power.\n\n## A Shift in Perspective\n\nModern boudoir photography is not about performing for someone else. It's about seeing yourself through a new lens — literally and figuratively. Women of all ages, shapes, sizes, and backgrounds are discovering that a boudoir session can be one of the most affirming experiences of their lives.\n\n## The Community Effect\n\nSocial media has played a significant role in normalizing boudoir photography. Women sharing their experiences (though rarely the images themselves) has created a community of support and encouragement that makes more women willing to take the leap.`,
      author: "The Directory Team",
      publishedAt: new Date("2026-03-05"),
      coverImage: "https://picsum.photos/seed/blog-4/1200/600",
    },
    {
      title: "How to Choose the Right Boudoir Photographer",
      slug: "how-to-choose-right-boudoir-photographer",
      excerpt: "Key questions to ask, red flags to watch for, and how to find the photographer who is right for you.",
      body: `Choosing a boudoir photographer is a deeply personal decision. You'll be vulnerable in ways that require complete trust. Here's how to make sure you choose someone who deserves that trust.\n\n## Review Their Portfolio Critically\n\nDoes their work look consistent, or do some images look significantly better than others? Can you see a range of body types and skin tones represented? A good boudoir photographer makes everyone look stunning.\n\n## Read Real Reviews\n\nLook for reviews that talk about the experience, not just the final images. How did the photographer make the client feel? Were they patient? Did they provide clear guidance during the shoot?\n\n## Schedule a Consultation\n\nAny serious photographer will offer a free consultation. This is your chance to assess chemistry, ask questions about their process, and determine if you feel safe and comfortable with them.`,
      author: "The Directory Team",
      publishedAt: new Date("2026-03-12"),
      coverImage: "https://picsum.photos/seed/blog-5/1200/600",
    },
  ];

  await db.insert(blogPosts).values(blogData);
  console.log("✅ 5 blog posts created");

  console.log("\n🎉 Seed complete!");
  console.log(`   Admin: ${process.env.ADMIN_EMAIL ?? "admin@example.com"} (password from ADMIN_PASSWORD)`);
  console.log("   Professionals: pro0@example.com through pro49@example.com / Pro123!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
