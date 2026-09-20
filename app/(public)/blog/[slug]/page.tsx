import { notFound } from "next/navigation";
import { serverBlogService } from "@/src/modules/blog/services/blogService";
import { BlogPostDetailClient } from "@/components/blog/BlogPostDetailClient";

export const dynamic = "force-dynamic";

export default async function BlogPostDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!slug) {
    notFound();
  }

  const post = await serverBlogService.getPostBySlug(slug);
  if (!post) {
    notFound();
  }

  const relatedPosts = await serverBlogService.getRelatedPosts(post.category, post.id, 3);

  return (
    <BlogPostDetailClient
      initialPost={post}
      initialRelatedPosts={relatedPosts || []}
      slug={slug}
    />
  );
}
