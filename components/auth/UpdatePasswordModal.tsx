"use client";

import * as React from "react";
import { AlertCircle, KeyRound } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useModal } from "@/components/ui/modal-context";

interface UpdatePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpdatePasswordModal({ isOpen, onClose }: UpdatePasswordModalProps) {
  const { toast } = useModal();
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const calculateStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const strength = calculateStrength(newPassword);

  const getStrengthLabel = (s: number) => {
    switch (s) {
      case 1:
        return { label: "Weak", color: "bg-rose-500", text: "text-rose-600" };
      case 2:
        return { label: "Fair", color: "bg-amber-500", text: "text-amber-600" };
      case 3:
        return { label: "Good", color: "bg-blue-500", text: "text-blue-600" };
      case 4:
        return { label: "Strong", color: "bg-emerald-500", text: "text-emerald-600" };
      default:
        return { label: "Too Short", color: "bg-slate-200", text: "text-slate-400" };
    }
  };

  const strengthInfo = getStrengthLabel(strength);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast({ title: "Weak Password", message: "Password must be at least 8 characters.", variant: "danger" });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords Do Not Match", message: "Please confirm your new password correctly.", variant: "danger" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const json = await res.json();
      if (res.ok) {
        toast({
          title: "Password Updated",
          message: "Your account password has been changed securely.",
          variant: "success",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        onClose();
      } else {
        toast({ title: "Error", message: json.error || "Failed to update password.", variant: "danger" });
      }
    } catch {
      toast({ title: "Error", message: "Network error occurred.", variant: "danger" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Change Account Password"
      description="Update your password to keep your Sabina LMS account secure."
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2 text-slate-900">
        {/* Current Password */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Current Password
          </label>
          <Input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
          />
        </div>

        {/* New Password */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            New Password
          </label>
          <Input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 8 characters"
          />

          {/* Strength Bar */}
          {newPassword && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Password strength:</span>
                <span className={`font-bold ${strengthInfo.text}`}>{strengthInfo.label}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden flex gap-1">
                <div className={`h-full flex-1 rounded-full ${strength >= 1 ? strengthInfo.color : "bg-slate-200"}`} />
                <div className={`h-full flex-1 rounded-full ${strength >= 2 ? strengthInfo.color : "bg-slate-200"}`} />
                <div className={`h-full flex-1 rounded-full ${strength >= 3 ? strengthInfo.color : "bg-slate-200"}`} />
                <div className={`h-full flex-1 rounded-full ${strength >= 4 ? strengthInfo.color : "bg-slate-200"}`} />
              </div>
            </div>
          )}
        </div>

        {/* Confirm New Password */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Confirm New Password
          </label>
          <Input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter new password"
          />
          {confirmPassword && confirmPassword !== newPassword && (
            <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Passwords do not match
            </p>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="default"
            type="submit"
            disabled={loading || newPassword.length < 8 || newPassword !== confirmPassword}
            className="font-bold bg-[#14209C] hover:bg-[#0d1870] text-white flex items-center gap-1.5"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{loading ? "Updating..." : "Update Password"}</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}
