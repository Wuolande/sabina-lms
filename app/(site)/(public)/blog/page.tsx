import { serverBlogService } from "@/src/modules/blog/services/blogService";
import { BlogListingClient } from "@/components/blog/BlogListingClient";

export const dynamic = "force-dynamic";

export default async function BlogListingPage() {
  let initialPosts: any[] = [];
  let initialTotalPages = 1;
  let initialTotalPosts = 0;

  try {
    const res = await serverBlogService.getPublishedPosts({ page: 1, pageSize: 9 });
    if (res && res.posts) {
      initialPosts = res.posts;
      initialTotalPages = res.totalPages || 1;
      initialTotalPosts = res.total || 0;
    }
  } catch (err) {
    console.error("[BlogListingPage] SSR load error:", err);
  }

  return (
    <BlogListingClient
      initialPosts={initialPosts}
      initialTotalPages={initialTotalPages}
      initialTotalPosts={initialTotalPosts}
    />
  );
}
