"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Ban,
  Eye,
  GraduationCap,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/Table";
import { useModal } from "@/components/ui/modal-context";
import { adminService } from "@/services/adminService";
import { UserListItem } from "@/src/modules/users/domain/types";
import { formatDate } from "@/lib/utils";

const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const router = useRouter();
  const { confirm, prompt, toast } = useModal();

  const [users, setUsers] = React.useState<UserListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string>("ALL");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);

  // Create User Modal State
  const [isAddUserOpen, setIsAddUserOpen] = React.useState(false);
  const [newEmail, setNewEmail] = React.useState("");
  const [newName, setNewName] = React.useState("");
  const [newCountry, setNewCountry] = React.useState("United States");
  const [newRole, setNewRole] = React.useState<"STUDENT" | "TUTOR" | "ADMIN">("STUDENT");
  const [creatingUser, setCreatingUser] = React.useState(false);

  // Debounce search
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  React.useEffect(() => {
    setPage(1);
  }, [roleFilter, statusFilter, debouncedSearch]);

  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getUsers({
        role: roleFilter,
        status: statusFilter,
        search: debouncedSearch || undefined,
        page,
        limit: PAGE_SIZE,
      });
      setUsers(data);
      setTotal(data.length);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", message: "Failed to load user directory.", variant: "danger" });
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter, debouncedSearch, page]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newName.trim()) return;

    setCreatingUser(true);
    const ok = await adminService.createUser({
      email: newEmail.trim(),
      displayName: newName.trim(),
      country: newCountry.trim(),
      roles: [newRole],
    });
    setCreatingUser(false);

    if (ok) {
      toast({
        title: "User Created",
        message: `${newName} added successfully with role ${newRole}.`,
        variant: "success",
      });
      setIsAddUserOpen(false);
      setNewEmail("");
      setNewName("");
      fetchUsers();
    } else {
      toast({ title: "Error", message: "Failed to create user account.", variant: "danger" });
    }
  };

  const handleSuspend = async (user: UserListItem) => {
    const reason = await prompt({
      title: `Suspend User: ${user.displayName}`,
      message: "State the reason for suspending this account.",
      placeholder: "e.g. Terms of service violation, payment chargeback dispute...",
      required: true,
      multiline: true,
      variant: "danger",
      confirmText: "Suspend Account",
    });

    if (reason) {
      const ok = await adminService.suspendUser(user.id, reason);
      if (ok) {
        toast({ title: "User Suspended", message: `${user.displayName} is now suspended.`, variant: "warning" });
        fetchUsers();
      }
    }
  };

  const handleReactivate = async (user: UserListItem) => {
    const ok2 = await confirm({
      title: `Reactivate Account: ${user.displayName}?`,
      message: "This will restore full login and platform access for this user.",
      confirmText: "Reactivate User",
      variant: "success",
    });

    if (ok2) {
      const ok = await adminService.reactivateUser(user.id);
      if (ok) {
        toast({ title: "User Reactivated", message: `${user.displayName} restored to ACTIVE.`, variant: "success" });
        fetchUsers();
      }
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            User Accounts Directory
            {users.length > 0 && <span className="ml-2 text-base font-semibold text-slate-400">({users.length})</span>}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Global directory of enrolled students, marketplace tutors, and system administrators.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsAddUserOpen(true)}
            className="font-bold bg-[#14209C] hover:bg-[#0d1870] text-white text-xs shadow-sm flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New User</span>
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        {/* Role Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl overflow-x-auto">
          {(["ALL", "STUDENT", "TUTOR", "ADMIN"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                roleFilter === r
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {r === "ALL" ? "All Roles" : `${r}s`}
            </button>
          ))}
        </div>

        {/* Status & Search */}
        <div className="flex items-center gap-2.5">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 font-semibold outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>

          <div className="relative w-full sm:w-60">
            <input
              type="text"
              placeholder="Search by name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pl-9 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">No users found</h3>
            <p className="text-xs text-slate-400">Try adjusting your search criteria or role filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Country / Timezone</TableHead>
                  <TableHead>Learning / Teaching</TableHead>
                  <TableHead>Joined Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const isSuspended = user.status === "SUSPENDED";

                  return (
                    <TableRow
                      key={user.id}
                      className={`cursor-pointer hover:bg-slate-50/70 transition ${
                        isSuspended ? "bg-rose-50/30" : ""
                      }`}
                      onClick={() => router.push(`/admin/users/${user.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={user.avatarUrl}
                            fallbackName={user.displayName}
                            size="sm"
                          />
                          <div>
                            <strong className="text-xs font-bold text-slate-900 block">
                              {user.displayName}
                            </strong>
                            <span className="text-[10px] text-slate-500">{user.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((r) => (
                            <Badge
                              key={r}
                              variant={
                                r === "SUPER_ADMIN" || r === "ADMIN"
                                  ? "destructive"
                                  : r === "TUTOR"
                                  ? "default"
                                  : "subtle"
                              }
                              size="sm"
                              className="text-[10px] font-bold"
                            >
                              {r}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        <span>{user.country}</span>
                        <span className="text-[10px] text-slate-400 block">{user.timezone}</span>
                      </TableCell>
                      <TableCell className="text-xs text-slate-700">
                        {user.studentProfile && (
                          <span className="block text-[11px] text-indigo-700 font-semibold">
                            🎓 {user.studentProfile.completedLessons} lessons · {user.studentProfile.totalHoursLearned}h
                          </span>
                        )}
                        {user.tutorProfile && (
                          <span className="block text-[11px] text-amber-700 font-semibold">
                            👨‍🏫 ${user.tutorProfile.hourlyRate}/hr · {user.tutorProfile.averageRating}★
                          </span>
                        )}
                        {!user.studentProfile && !user.tutorProfile && (
                          <span className="text-slate-400 text-xs italic">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 font-mono">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={isSuspended ? "destructive" : "success"}
                          size="sm"
                        >
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/admin/users/${user.id}`)}
                            className="text-xs flex items-center gap-1"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">360 View</span>
                          </Button>

                          {isSuspended ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReactivate(user)}
                              className="text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                              title="Reactivate Account"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSuspend(user)}
                              className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                              title="Suspend Account"
                            >
                              <Ban className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        title="Add New Platform User"
        description="Create an account and assign initial platform permissions."
      >
        <form onSubmit={handleCreateUser} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Full Display Name
            </label>
            <Input
              required
              placeholder="e.g. Maya Lin"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <Input
              type="email"
              required
              placeholder="user@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Primary Role
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none"
              >
                <option value="STUDENT">Student</option>
                <option value="TUTOR">Tutor</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Country
              </label>
              <Input
                value={newCountry}
                onChange={(e) => setNewCountry(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsAddUserOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              type="submit"
              disabled={creatingUser}
              className="font-bold bg-[#14209C] hover:bg-[#0d1870] text-white"
            >
              {creatingUser ? "Creating..." : "Create User"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
