import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, CheckCircle2, Clock3, ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import { FAQSection } from "@/components/page-shell";
import { JsonLd } from "@/components/structured-data";
import { ButtonLink, Section } from "@/components/ui";
import { blogPosts, getBlogPost, getRelatedBlogPosts } from "@/lib/blog-posts";
import { articleSchema, breadcrumbSchema, faqSchema, pageMetadata } from "@/lib/seo";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return {};
  }

  return pageMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`
  });
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(`${date}T00:00:00Z`));
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  const path = `/blog/${post.slug}`;
  const relatedPosts = getRelatedBlogPosts(post);

  return (
    <>
      <JsonLd
        data={[
          articleSchema({
            title: post.title,
            description: post.description,
            path,
            publishedAt: post.publishedAt,
            updatedAt: post.updatedAt
          }),
          faqSchema(post.faqs, path),
          breadcrumbSchema(
            [
              { name: "Home", path: "/" },
              { name: "Resource Center", path: "/blog" },
              { name: post.shortTitle, path }
            ],
            path
          )
        ]}
      />

      <header className="hero-texture text-white">
        <Section className="py-12 md:py-16">
          <Link className="inline-flex items-center gap-2 text-sm font-bold text-[#e3b56e] hover:text-white" href="/blog">
            <ArrowLeft size={17} /> Back to resource center
          </Link>
          <div className="mt-8 max-w-4xl">
            <p className="text-sm font-bold uppercase tracking-wide text-[#e3b56e]">{post.audience} guide</p>
            <h1 className="mt-4 text-4xl font-bold leading-tight md:text-6xl">{post.title}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-white/84">{post.description}</p>
            <div className="mt-7 flex flex-wrap gap-3 text-sm font-semibold text-white/88">
              <span className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-3 py-2">
                <CalendarDays size={16} /> Updated {formatDate(post.updatedAt)}
              </span>
              <span className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-3 py-2">
                <Clock3 size={16} /> {post.readingMinutes} minute read
              </span>
              <span className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-3 py-2">
                <BookOpen size={16} /> Reviewed sources included
              </span>
            </div>
          </div>
        </Section>
      </header>

      <Section className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_310px] lg:items-start">
        <article className="min-w-0">
          <div className="rounded-xl border border-[#d8c2a6] bg-[#fff9ee] p-6 text-lg leading-8 text-[#263544] shadow-sm md:p-8">
            {post.intro.map((paragraph) => <p className="mt-4 first:mt-0" key={paragraph}>{paragraph}</p>)}
          </div>

          <div className="mt-10 grid gap-10">
            {post.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-3xl font-bold leading-tight text-[#0b2f4a]">{section.heading}</h2>
                <div className="mt-4 grid gap-4 text-[1.03rem] leading-8 text-[#394957]">
                  {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </div>
                {section.bullets && (
                  <ul className="mt-5 grid gap-3 rounded-xl border border-[#d8c2a6] bg-white p-5 md:grid-cols-2">
                    {section.bullets.map((bullet) => (
                      <li className="flex gap-3 leading-7 text-[#263544]" key={bullet}>
                        <CheckCircle2 className="mt-1 shrink-0 text-[#b86a32]" size={19} />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          <section className="mt-12 rounded-xl border border-[#d8c2a6] bg-[#fff9ee] p-6 md:p-8">
            <p className="text-sm font-bold uppercase tracking-wide text-[#b86a32]">Sources and further reading</p>
            <h2 className="mt-3 text-2xl font-bold text-[#0b2f4a]">Reputable resources used for this guide</h2>
            <p className="mt-3 leading-7 text-[#5c6570]">
              External resources are provided for education and verification. They do not replace legal, tax, safety, code, equipment, or professional advice for a specific property or operation.
            </p>
            <ul className="mt-5 grid gap-3">
              {post.sources.map((source) => (
                <li key={source.url}>
                  <a className="flex items-start justify-between gap-3 rounded-lg border border-[#d8c2a6] bg-white p-4 text-[#0b2f4a] transition hover:border-[#b86a32]" href={source.url} rel="noreferrer" target="_blank">
                    <span><strong>{source.publisher}:</strong> {source.label}</span>
                    <ExternalLink className="mt-1 shrink-0" size={17} />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </article>

        <aside className="grid gap-5 lg:sticky lg:top-28">
          <div className="rounded-xl bg-[#0b2f4a] p-6 text-white shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-[#e3b56e]">{post.cta.eyebrow}</p>
            <h2 className="mt-3 text-2xl font-bold">{post.cta.title}</h2>
            <p className="mt-3 text-sm leading-6 text-white/78">{post.cta.body}</p>
            <div className="mt-5 grid gap-3">
              <ButtonLink href={post.cta.href}>{post.cta.label}</ButtonLink>
              <ButtonLink href={post.cta.secondaryHref} variant="secondary">{post.cta.secondaryLabel}</ButtonLink>
            </div>
          </div>

          <div className="rounded-xl border border-[#d8c2a6] bg-white p-6">
            <p className="text-xs font-bold uppercase tracking-wide text-[#b86a32]">Related services</p>
            <div className="mt-4 grid gap-3">
              {post.relatedLinks.map((link) => (
                <Link className="flex items-center justify-between gap-3 font-bold text-[#0b2f4a] hover:text-[#b86a32]" href={link.href} key={link.href}>
                  {link.label} <ArrowRight className="shrink-0" size={17} />
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </Section>

      <Section className="pt-2">
        <div className="max-w-4xl">
          <p className="text-sm font-bold uppercase tracking-wide text-[#b86a32]">Common questions</p>
          <h2 className="mt-3 text-3xl font-bold text-[#0b2f4a]">Frequently asked questions</h2>
          <div className="mt-6"><FAQSection items={post.faqs} /></div>
        </div>
      </Section>

      <Section className="pb-20">
        <p className="text-sm font-bold uppercase tracking-wide text-[#b86a32]">Keep reading</p>
        <h2 className="mt-3 text-3xl font-bold text-[#0b2f4a]">Related guides</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {relatedPosts.map((related) => (
            <article className="flex h-full flex-col rounded-xl border border-[#d8c2a6] bg-[#fff9ee] p-5" key={related.slug}>
              <p className="text-xs font-bold uppercase tracking-wide text-[#b86a32]">{related.audience}</p>
              <h3 className="mt-3 text-lg font-bold leading-6 text-[#0b2f4a]">{related.shortTitle}</h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-[#5c6570]">{related.excerpt}</p>
              <Link className="mt-5 inline-flex items-center gap-2 font-bold text-[#0b2f4a] hover:text-[#b86a32]" href={`/blog/${related.slug}`}>
                Read guide <ArrowRight size={17} />
              </Link>
            </article>
          ))}
        </div>
      </Section>
    </>
  );
}
