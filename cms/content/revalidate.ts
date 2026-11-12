/** Refresh cached public pages after an edit in the admin, so changes show at once. */
export async function refreshSite(paths: string[]) {
  try {
    const { revalidatePath } = await import("next/cache");
    for (const p of paths) revalidatePath(p, p === "/" ? "layout" : "page");
  } catch {
    // Outside a Next.js request (e.g. the Payload CLI): nothing is cached, nothing to do.
  }
}
