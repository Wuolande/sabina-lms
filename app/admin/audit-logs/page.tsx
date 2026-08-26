"use client";

import * as React from "react";
import { FileText, ShieldAlert, Search, History, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/Table";
import { adminService } from "@/services/adminService";
import { formatDate } from "@/lib/utils";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  const fetchLogs = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getAuditLogs({ limit: 50 });
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filtered = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.adminName.toLowerCase().includes(search.toLowerCase()) ||
      l.targetName.toLowerCase().includes(search.toLowerCase()) ||
      (l.details && l.details.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Immutable Audit Trail ({filtered.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Append-only chronological log of all administrative authorizations, approvals, suspensions, and changes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search audit actions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pl-9 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            className="flex items-center gap-1.5 text-xs shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <History className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">No logs found</h3>
            <p className="text-xs text-slate-400">Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Log ID</TableHead>
                  <TableHead>Actor / Admin</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target Resource</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-[11px] text-slate-500 font-semibold">
                      {log.id.slice(0, 14)}...
                    </TableCell>
                    <TableCell className="text-xs font-bold text-slate-900">
                      {log.adminName}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          log.action.includes('APPROVED')
                            ? 'success'
                            : log.action.includes('REJECTED') || log.action.includes('SUSPENDED')
                            ? 'destructive'
                            : log.action.includes('CHANGES')
                            ? 'warning'
                            : 'subtle'
                        }
                        size="sm"
                      >
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-slate-800">
                      {log.targetName}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 max-w-sm">
                      {log.details}
                    </TableCell>
                    <TableCell className="text-right text-xs text-slate-400 font-mono">
                      {formatDate(log.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
