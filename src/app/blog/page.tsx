import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, HardHat, Home, Search } from "lucide-react";
import { PageHero } from "@/components/page-shell";
import { JsonLd } from "@/components/structured-data";
import { Section } from "@/components/ui";
import { blogPosts, type BlogAudience } from "@/lib/blog-posts";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Fuel, Heating and HVAC Resource Center",
  description: "Practical fuel delivery, heating-oil, property management, off-road diesel, and contractor partnership guides for Lancaster and Central Pennsylvania.",
  path: "/blog"
});

const audienceDetails: Record<BlogAudience, { icon: typeof Building2; description: string }> = {
  Commercial: {
    icon: Building2,
    description: "Fuel-planning guidance for facilities, property portfolios, farms, fleets, and commercial operators."
  },
  Residential: {
    icon: Home,
    description: "Heating-oil and home-comfort guidance for Lancaster-area homeowners."
  },
  Contractors: {
    icon: HardHat,
    description: "Application and capability guidance for independent service companies interested in potential partner review."
  }
};

const audiences: BlogAudience[] = ["Commercial", "Residential", "Contractors"];

export default function BlogIndexPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema(
          [
            { name: "Home", path: "/" },
            { name: "Resource Center", path: "/blog" }
          ],
          "/blog"
        )}
      />
      <PageHero
        body="Use these practical guides to prepare a fuel or heating request, organize commercial sites, compare residential delivery approaches, or submit contractor capabilities for review."
        eyebrow="Conquistador Oil resource center"
        primaryHref="#guides"
        primaryLabel="Browse the Guides"
        secondaryHref="/commercial-quote"
        secondaryLabel="Request Fuel Review"
        title="Fuel, Heating and Contractor Guides for Central Pennsylvania"
      >
        <div className="mt-6 inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white/90">
          <Search size={17} />
          Seven source-backed guides built around real customer and contractor questions
        </div>
      </PageHero>

      <Section id="guides">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-wide text-[#b86a32]">Choose your path</p>
          <h2 className="mt-3 text-3xl font-bold text-[#0b2f4a]">Guidance matched to the decision you are making</h2>
          <p className="mt-4 leading-7 text-[#5c6570]">
            Each guide includes links to government, university, or recognized energy resources, plus a direct next step for the corresponding service or partner application.
          </p>
        </div>

        <div className="mt-10 grid gap-12">
          {audiences.map((audience) => {
            const details = audienceDetails[audience];
            const Icon = details.icon;
            const posts = blogPosts.filter((post) => post.audience === audience);

            return (
              <section aria-labelledby={`${audience.toLowerCase()}-guides`} key={audience}>
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-[#0b2f4a] p-3 text-[#e3b56e]">
                    <Icon aria-hidden="true" size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[#0b2f4a]" id={`${audience.toLowerCase()}-guides`}>{audience} guides</h2>
                    <p className="mt-1 max-w-3xl text-[#5c6570]">{details.description}</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-5 lg:grid-cols-3">
                  {posts.map((post) => (
                    <article className="flex h-full flex-col rounded-xl border border-[#d8c2a6] bg-[#fff9ee] p-6 shadow-sm" key={post.slug}>
                      <div className="text-xs font-bold uppercase tracking-wide text-[#b86a32]">{post.readingMinutes} minute guide</div>
                      <h3 className="mt-3 text-xl font-bold leading-7 text-[#0b2f4a]">
                        <Link className="hover:text-[#b86a32]" href={`/blog/${post.slug}`}>{post.shortTitle}</Link>
                      </h3>
                      <p className="mt-3 flex-1 text-sm leading-6 text-[#5c6570]">{post.excerpt}</p>
                      <Link className="mt-6 inline-flex items-center gap-2 font-bold text-[#0b2f4a] hover:text-[#b86a32]" href={`/blog/${post.slug}`}>
                        Read the guide <ArrowRight size={17} />
                      </Link>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </Section>

      <Section className="pb-20">
        <div className="rounded-xl bg-[#0b2f4a] p-7 text-white md:p-10">
          <p className="text-sm font-bold uppercase tracking-wide text-[#e3b56e]">Need a direct answer?</p>
          <h2 className="mt-3 text-3xl font-bold">Send the location, service type, and best contact information.</h2>
          <p className="mt-4 max-w-3xl leading-7 text-white/78">
            Conquistador Oil reviews heating oil, commercial fuel, HVAC, property account, and contractor partner requests across Lancaster and Central Pennsylvania. Pricing, availability, timing, and contractor approval require human confirmation.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#d6a354] px-5 py-3 text-sm font-bold text-[#101827] hover:bg-[#bd8736]" href="/emergency-service">Request Service</Link>
            <Link className="inline-flex min-h-11 items-center justify-center rounded-md border border-white/25 px-5 py-3 text-sm font-bold text-white hover:bg-white/10" href="/contractor-partner-program">Contractor Application</Link>
          </div>
        </div>
      </Section>
    </>
  );
}
