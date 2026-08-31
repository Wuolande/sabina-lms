"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Calendar,
  Clock,
  Globe,
  Tag,
  FileText,
  Check,
  X,
  AlertCircle,
  TrendingUp,
  Layers,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { adminService } from "@/services/adminService";
import { BlogPost, BlogPostPayload, BLOG_CATEGORIES } from "@/src/modules/blog/types/blogTypes";
import { formatDate } from "@/lib/utils";

const DEFAULT_POST_FORM: BlogPostPayload = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  author: "Sabina Editorial Team",
  authorTitle: "Education Specialist",
  category: "Languages",
  featuredImage: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=1200&q=80",
  readTime: "5 min read",
  tags: ["Education", "Online Tutoring"],
  status: "published",
  isPublished: true,
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
};

export default function AdminBlogManagementPage() {
  const [posts, setPosts] = React.useState<BlogPost[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [savedMessage, setSavedMessage] = React.useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("All");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "published" | "draft">("all");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalPosts, setTotalPosts] = React.useState(0);

  // Modal / Editor State
  const [isEditorOpen, setIsEditorOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState<BlogPostPayload>(DEFAULT_POST_FORM);
  const [tagInput, setTagInput] = React.useState("");
  const [deleteConfirmPost, setDeleteConfirmPost] = React.useState<BlogPost | null>(null);

  const triggerToast = (msg: string) => {
    setSavedMessage(msg);
    setTimeout(() => setSavedMessage(null), 3000);
  };

  const loadBlogs = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getAdminBlogs({
        search: searchQuery.trim() || undefined,
        category: categoryFilter === "All" ? undefined : categoryFilter,
        status: statusFilter === "all" ? undefined : statusFilter,
        page,
        pageSize: 15,
      });

      if (res && res.posts) {
        setPosts(res.posts);
        setTotalPages(res.totalPages || 1);
        setTotalPosts(res.total || 0);
      }
    } catch (err) {
      console.error("[loadBlogs Error]", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, categoryFilter, statusFilter, page]);

  React.useEffect(() => {
    loadBlogs();
  }, [loadBlogs]);

  // Open modal for new article
  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormData(DEFAULT_POST_FORM);
    setTagInput("");
    setIsEditorOpen(true);
  };

  // Open modal for editing existing article
  const handleOpenEditModal = (post: BlogPost) => {
    setEditingId(post.id);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      author: post.author,
      authorTitle: post.authorTitle || "Education Specialist",
      category: post.category,
      featuredImage: post.featuredImage,
      readTime: post.readTime,
      tags: post.tags || [],
      status: post.status,
      isPublished: post.isPublished,
      seoTitle: post.seoTitle || post.title,
      seoDescription: post.seoDescription || post.excerpt,
      seoKeywords: post.seoKeywords || "",
    });
    setTagInput("");
    setIsEditorOpen(true);
  };

  // Auto-generate slug when title changes (if creating new or slug is empty)
  const handleTitleChange = (val: string) => {
    const slug = val
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    setFormData((prev) => ({
      ...prev,
      title: val,
      slug: editingId ? prev.slug : slug,
      seoTitle: prev.seoTitle || val,
    }));
  };

  // Add tag pill
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const cleaned = tagInput.trim().replace(/^#/, "");
      if (cleaned && !formData.tags?.includes(cleaned)) {
        setFormData((prev) => ({
          ...prev,
          tags: [...(prev.tags || []), cleaned],
        }));
        setTagInput("");
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((t) => t !== tagToRemove) || [],
    }));
  };

  // Save / Update Handler
  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      triggerToast("Article title is required");
      return;
    }
    if (!formData.content.trim()) {
      triggerToast("Article content cannot be empty");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const res = await adminService.updateAdminBlog(editingId, formData);
        if (res?.success) {
          triggerToast("Article updated successfully");
          setIsEditorOpen(false);
          loadBlogs();
        }
      } else {
        const res = await adminService.createAdminBlog(formData);
        if (res?.success) {
          triggerToast("New article created and published");
          setIsEditorOpen(false);
          loadBlogs();
        }
      }
    } catch (err: any) {
      triggerToast(err.message || "Failed to save article");
    } finally {
      setSaving(false);
    }
  };

  // 1-Click Quick Toggle Publish
  const handleQuickTogglePublish = async (post: BlogPost) => {
    const newStatus = post.isPublished ? "draft" : "published";
    try {
      await adminService.updateAdminBlog(post.id, {
        isPublished: !post.isPublished,
        status: newStatus,
      });
      triggerToast(`Article ${newStatus === "published" ? "published live" : "moved to drafts"}`);
      loadBlogs();
    } catch (err) {
      triggerToast("Failed to update status");
    }
  };

  // Delete Handler
  const handleDeletePost = async () => {
    if (!deleteConfirmPost) return;
    try {
      await adminService.deleteAdminBlog(deleteConfirmPost.id);
      triggerToast("Article permanently deleted");
      setDeleteConfirmPost(null);
      loadBlogs();
    } catch (err) {
      triggerToast("Failed to delete article");
    }
  };

  const publishedCount = posts.filter((p) => p.isPublished).length;
  const draftCount = posts.filter((p) => !p.isPublished).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* ─── Header & Top Actions ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight font-heading">
              Blog & Learning Hub CMS
            </h1>
            <Badge variant="neutral" size="sm" className="font-bold text-[10px] uppercase">
              Live Editorial Studio
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Author and publish educational articles, language guides, exam tips, and SEO content.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link href="/blog" target="_blank">
            <Button variant="outline" size="sm" className="gap-2 text-xs font-bold border-slate-200">
              <span>View Public Blog</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <Button
            onClick={handleOpenCreateModal}
            size="sm"
            className="bg-[#14209C] hover:bg-[#0e176b] text-white font-bold gap-2 text-xs rounded-xl shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>New Article</span>
          </Button>
        </div>
      </div>

      {/* ─── Toast alert ─── */}
      {savedMessage && (
        <div className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-3 rounded-2xl shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 font-semibold text-sm">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* ─── KPI Ribbon ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Articles</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalPosts}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Published Live</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{publishedCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Drafts</p>
          <p className="text-2xl font-black text-amber-700 mt-1">{draftCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Active Topics</p>
          <p className="text-2xl font-black text-[#14209C] mt-1">{BLOG_CATEGORIES.length - 1}</p>
        </div>
      </div>

      {/* ─── Search & Filtering Toolbar ─── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by title, author, or slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
          >
            <option value="All">All Categories</option>
            {BLOG_CATEGORIES.filter((c) => c !== "All").map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex rounded-xl bg-slate-100 p-1">
            {(["all", "published", "draft"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                  statusFilter === st ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={loadBlogs} disabled={loading} className="border-slate-200">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-[#14209C]" : "text-slate-500"}`} />
          </Button>
        </div>
      </div>

      {/* ─── Articles Table ─── */}
      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-4">Article</th>
                <th className="px-4 py-4">Category</th>
                <th className="px-4 py-4">Author</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Published Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-xs text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin text-[#14209C] mx-auto mb-2" />
                    <span>Loading articles from database...</span>
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-xs text-slate-500">
                    <BookOpen className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-700">No articles found</p>
                    <p className="mt-1">Click &quot;New Article&quot; to publish your first blog post.</p>
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Title & Slug */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                          <Image
                            src={post.featuredImage || "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=400&q=80"}
                            alt={post.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="max-w-md">
                          <p className="font-bold text-slate-900 line-clamp-1 leading-snug">
                            {post.title}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                            /blog/{post.slug}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Badge variant="neutral" size="sm" className="font-bold text-[10px]">
                        {post.category}
                      </Badge>
                    </td>

                    {/* Author */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <p className="text-xs font-semibold text-slate-800">{post.author}</p>
                      <p className="text-[10px] text-slate-400">{post.readTime}</p>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Badge
                        variant={post.isPublished ? "emerald-solid" : "neutral"}
                        size="sm"
                        className="text-[10px] font-bold uppercase"
                      >
                        {post.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </td>

                    {/* Published Date */}
                    <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-500">
                      {post.publishedAt ? formatDate(post.publishedAt) : "—"}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/blog/${post.slug}`} target="_blank">
                          <Button
                            variant="outline"
                            size="sm"
                            title="Preview live"
                            className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 border-slate-200"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </Link>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickTogglePublish(post)}
                          title={post.isPublished ? "Unpublish to draft" : "Publish live"}
                          className={`h-8 px-2.5 text-xs font-bold border-slate-200 ${
                            post.isPublished ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"
                          }`}
                        >
                          {post.isPublished ? "Draft" : "Publish"}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditModal(post)}
                          className="h-8 w-8 p-0 text-slate-600 hover:text-[#14209C] border-slate-200"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteConfirmPost(post)}
                          className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50 hover:border-rose-300 border-slate-200"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200 text-xs">
            <span className="text-slate-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="h-8 text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="h-8 text-xs"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Full-Featured Article Editor Modal ─── */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl space-y-6 my-8 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900 font-heading">
                  {editingId ? "Edit Article" : "Create New Blog Article"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Compose content, set categories, configure SEO tags, and publish to the live Learning Hub.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="text-slate-400 hover:text-slate-600 h-8 w-8 rounded-full flex items-center justify-center hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePost} className="space-y-6">
              
              {/* Title & Slug */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Article Title *
                  </label>
                  <Input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g. 7 Evidence-Based Techniques to Master Any Language"
                    className="text-sm font-semibold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      URL Slug *
                    </label>
                    <Input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="e.g. master-any-language-fast"
                      className="font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
                    >
                      {BLOG_CATEGORIES.filter((c) => c !== "All").map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Author & Read Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Author Name
                  </label>
                  <Input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="e.g. Dr. Elena Rostova"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Author Title / Role
                  </label>
                  <Input
                    type="text"
                    value={formData.authorTitle}
                    onChange={(e) => setFormData({ ...formData, authorTitle: e.target.value })}
                    placeholder="e.g. Senior Linguist & Polyglot"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Read Time
                  </label>
                  <Input
                    type="text"
                    value={formData.readTime}
                    onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                    placeholder="e.g. 6 min read"
                  />
                </div>
              </div>

              {/* Featured Image */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Featured Cover Image URL
                </label>
                <Input
                  type="url"
                  value={formData.featuredImage}
                  onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                  placeholder="https://images.unsplash.com/photo-..."
                />
                {formData.featuredImage && (
                  <div className="relative h-32 w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 mt-2">
                    <Image
                      src={formData.featuredImage}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Excerpt */}
              <div className="pt-2 border-t border-slate-100 space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Article Excerpt / Summary *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="A concise 2-sentence teaser for search engines and card displays..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#14209C] leading-relaxed"
                />
              </div>

              {/* Content Markdown Editor */}
              <div className="pt-2 border-t border-slate-100 space-y-1">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Article Body Content (Markdown Supported) *
                  </label>
                  <span className="text-[10px] text-slate-400">Use ## for Headings, - for bullets</span>
                </div>
                <textarea
                  rows={10}
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="## The Science Behind Language Acquisition&#10;&#10;Write your formatted article here..."
                  className="w-full px-3 py-2.5 text-xs font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#14209C] leading-relaxed"
                />
              </div>

              {/* Tags Editor */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Article Tags (Press Enter or comma to add)
                </label>
                <Input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Type a tag and press Enter (e.g. Spanish, IELTS, Study Tips)..."
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {formData.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-[#14209C] text-xs font-bold"
                    >
                      <span>#{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-slate-400 hover:text-slate-600 ml-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Publishing Status Toggle */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div>
                  <strong className="block text-xs font-bold text-slate-900">
                    Publish Live on Frontend
                  </strong>
                  <p className="text-[11px] text-slate-500">
                    When active, this article is visible on the homepage and `/blog` route.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => {
                      const nextPub = !prev.isPublished;
                      return {
                        ...prev,
                        isPublished: nextPub,
                        status: nextPub ? "published" : "draft",
                      };
                    })
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formData.isPublished ? "bg-emerald-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                      formData.isPublished ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditorOpen(false)}
                  className="rounded-xl font-bold text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-[#14209C] hover:bg-[#0e176b] text-white font-bold rounded-xl text-xs px-6 shadow-xs"
                >
                  {saving ? "Saving Article..." : editingId ? "Update Article" : "Create & Publish"}
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Dialog ─── */}
      {deleteConfirmPost && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-center">
            <div className="h-12 w-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 font-heading">
              Delete Blog Article?
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-900">&quot;{deleteConfirmPost.title}&quot;</strong>? This action is permanent and cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmPost(null)}
                className="rounded-xl font-bold text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeletePost}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs px-5 shadow-xs"
              >
                Yes, Delete Article
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
