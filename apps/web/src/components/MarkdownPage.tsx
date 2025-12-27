import React, { useMemo } from "react";
import { marked } from "marked";

import { Container } from "@/components/Container";
import { SiteLayout } from "@/components/SiteLayout";

interface MarkdownPageProps {
  title: string;
  markdown: string;
}

export function MarkdownPage({ title, markdown }: MarkdownPageProps) {
  const html = useMemo(() => {
    return marked.parse(markdown, { gfm: true }) as string;
  }, [markdown]);

  return (
    <SiteLayout title={title}>
      <Container className="py-12">
        <article
          className="prose prose-invert max-w-none prose-a:text-teal-300 prose-a:no-underline hover:prose-a:underline prose-hr:border-white/10"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </Container>
    </SiteLayout>
  );
}
