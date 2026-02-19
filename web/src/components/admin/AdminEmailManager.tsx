"use client";

import { useState, useEffect } from "react";
import { X, Plus, Eye, EyeOff, Sparkles, Ban, CheckCircle, Trash2 } from "lucide-react";
import {
  getSettings,
  addAdminEmail,
  removeAdminEmail,
} from "@/lib/actions/settings";

export default function AdminEmailManager() {
  const [adminEmails, setAdminEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [creatingTest, setCreatingTest] = useState(false);
  const [userStatuses, setUserStatuses] = useState<Record<string, boolean>>({});
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [adminSdkAvailable, setAdminSdkAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settings = await getSettings();
      const emails = settings.adminEmails || [];
      setAdminEmails(emails);
      
      // Check Admin SDK availability and load user statuses
      const statuses: Record<string, boolean> = {};
      let sdkAvailable = false;
      
      for (const email of emails) {
        try {
          const response = await fetch("/api/admin/get-user-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
          const result = await response.json();
          if (result.success) {
            statuses[email] = result.disabled || false;
            // If we got a real status (not a note), Admin SDK is available
            if (!result.note) {
              sdkAvailable = true;
            }
          } else {
            // If Admin SDK not available, assume enabled
            statuses[email] = false;
          }
        } catch (err) {
          // If we can't get status, assume enabled
          statuses[email] = false;
        }
      }
      
      setUserStatuses(statuses);
      setAdminSdkAvailable(sdkAvailable || emails.length === 0);
    } catch (err) {
      setError("Failed to load admin emails");
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number";
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return "Password must contain at least one special character (!@#$%^&*(),.?\":{}|<>)";
    }
    return null;
  };

  const getPasswordStrength = (password: string): {
    strength: "weak" | "medium" | "strong";
    score: number;
  } => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    if (password.length >= 16) score++;

    if (score <= 3) return { strength: "weak", score };
    if (score <= 5) return { strength: "medium", score };
    return { strength: "strong", score };
  };

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newEmail.trim()) {
      setError("Please enter an email address");
      return;
    }

    if (!newPassword.trim()) {
      setError("Please enter a password");
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setAdding(true);
    const result = await addAdminEmail(newEmail.trim(), newPassword);

    if (result.success) {
      setSuccess(`Admin "${newEmail}" added successfully with password`);
      setNewEmail("");
      setNewPassword("");
      await loadSettings();
    } else {
      setError(result.error);
    }
    setAdding(false);
  };

  const handleRemoveEmail = async (email: string) => {
    if (
      !confirm(
        `Are you sure you want to remove "${email}" from admin access? This will not delete the Firebase user, only remove admin access.`
      )
    ) {
      return;
    }

    setError(null);
    setSuccess(null);

    const result = await removeAdminEmail(email);

    if (result.success) {
      setSuccess(`Admin email "${email}" removed successfully`);
      await loadSettings();
    } else {
      setError(result.error);
    }
  };

  const handleDeleteUser = async (email: string) => {
    if (
      !confirm(
        `⚠️ WARNING: Are you sure you want to DELETE "${email}"?\n\n` +
        `This will:\n` +
        `- Permanently delete the Firebase Authentication account\n` +
        `- Remove admin access from the whitelist\n\n` +
        `This action cannot be undone!`
      )
    ) {
      return;
    }

    setError(null);
    setSuccess(null);
    setDeletingUser(email);

    try {
      // Step 1: Delete Firebase user account
      const deleteResponse = await fetch("/api/admin/delete-user", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const deleteResult = await deleteResponse.json();

      // Step 2: Remove from admin whitelist (even if delete failed)
      const removeResult = await removeAdminEmail(email);

      if (deleteResult.success && removeResult.success) {
        setSuccess(`User "${email}" deleted successfully and removed from admin list`);
        await loadSettings();
      } else if (deleteResult.success && !removeResult.success) {
        const removeError = removeResult.success ? "" : removeResult.error;
        setSuccess(
          `Firebase account deleted, but failed to remove from admin list: ${removeError}`
        );
        await loadSettings();
      } else if (!deleteResult.success && removeResult.success) {
        setError(
          `Removed from admin list, but failed to delete Firebase account: ${deleteResult.message || deleteResult.error}`
        );
        await loadSettings();
      } else {
        const removeError = removeResult.success ? "" : removeResult.error;
        setError(
          `Failed to delete user: ${deleteResult.message || deleteResult.error}. ` +
          `Also failed to remove from admin list: ${removeError}`
        );
      }
    } catch (error: any) {
      // Try to remove from whitelist anyway
      const removeResult = await removeAdminEmail(email);
      if (removeResult.success) {
        setError(
          `Failed to delete Firebase account: ${error.message}. ` +
          `User has been removed from admin list. You may need to delete the Firebase account manually.`
        );
        await loadSettings();
      } else {
        const removeError = removeResult.success ? "" : removeResult.error;
        setError(
          `Failed to delete user: ${error.message}. ` +
          `Also failed to remove from admin list: ${removeError}`
        );
      }
    } finally {
      setDeletingUser(null);
    }
  };

  const handleToggleDisable = async (email: string) => {
    const isDisabled = userStatuses[email] || false;
    const action = isDisabled ? "enable" : "disable";
    
    if (
      !confirm(
        `Are you sure you want to ${action} the account for "${email}"?\n\n${
          isDisabled
            ? "Enabling will allow the user to login again."
            : "Disabling will prevent the user from logging in, but the account will remain."
        }`
      )
    ) {
      return;
    }

    setError(null);
    setSuccess(null);
    setUpdatingStatus(email);

    try {
      const response = await fetch("/api/admin/disable-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, disabled: !isDisabled }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(`Account "${email}" ${action}d successfully`);
        // Update local status
        setUserStatuses((prev) => ({
          ...prev,
          [email]: !isDisabled,
        }));
      } else {
        setError(result.error || result.message || `Failed to ${action} account`);
      }
    } catch (error: any) {
      setError(error.message || `Failed to ${action} account`);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleCreateTestAdmin = async () => {
    setError(null);
    setSuccess(null);
    setCreatingTest(true);

    const testEmail = "admin@test.com";
    const testPassword = "Admin123!@#";

    try {
      // Step 1: Create Firebase user
      const createUserResponse = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      });

      const createUserResult = await createUserResponse.json();

      if (!createUserResult.success && createUserResult.error !== "User already exists") {
        setError(createUserResult.error || createUserResult.message);
        setCreatingTest(false);
        return;
      }

      // Step 2: Add to admin list
      const addAdminResponse = await fetch("/api/admin/add-to-whitelist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: testEmail,
        }),
      });

      const addAdminResult = await addAdminResponse.json();

      if (addAdminResult.success) {
        setSuccess(
          `Test admin user created successfully! Email: ${testEmail}, Password: ${testPassword}`
        );
        await loadSettings();
      } else {
        // If already in list, that's fine
        if (addAdminResult.message?.includes("already")) {
          setSuccess(
            `Test admin user already exists! Email: ${testEmail}, Password: ${testPassword}`
          );
          await loadSettings();
        } else {
          setError(addAdminResult.error || "Failed to add email to admin list");
        }
      }
    } catch (error: any) {
      setError(error.message || "Failed to create test admin user");
    } finally {
      setCreatingTest(false);
    }
  };

  const passwordStrength = getPasswordStrength(newPassword);

  if (loading) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-6">
        <p className="text-sm text-white/70">Loading admin emails...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin SDK Warning */}
      {adminSdkAvailable === false && (
        <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 px-4 py-3">
          <div className="flex items-start gap-3">
            <Ban className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-400 mb-1">
                Firebase Admin SDK Not Configured
              </p>
              <p className="text-xs text-yellow-300/80">
                Disable/Enable functionality requires Firebase Admin SDK. To set it up, see{" "}
                <code className="px-1.5 py-0.5 bg-yellow-500/20 rounded text-yellow-200">
                  FIREBASE_ADMIN_SETUP.md
                </code>
                . You can still add and remove admin emails, but disabling accounts won't work.
              </p>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-2">Admin Email Access</h2>
        <p className="text-sm text-white/70 mb-4">
          Add admin users with email and password. Only users with emails in this
          list will be able to access the admin dashboard. Passwords must be strong
          (at least 8 characters with uppercase, lowercase, number, and special character).
        </p>
        
        {/* Quick test admin button */}
        <button
          onClick={handleCreateTestAdmin}
          disabled={creatingTest}
          className="mb-6 flex items-center gap-2 rounded-lg border border-accentGold/50 bg-accentGold/10 px-4 py-2 text-sm font-medium text-accentGold transition hover:border-accentGold hover:bg-accentGold/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="h-4 w-4" />
          {creatingTest ? "Creating Test Admin..." : "Quick Create Test Admin"}
        </button>
      </div>

      {/* Add new admin form */}
      <form
        onSubmit={handleAddEmail}
        className="rounded-lg border border-white/10 bg-white/5 p-6 space-y-4"
      >
        <div>
          <label
            htmlFor="new-email"
            className="block text-sm font-medium text-white/80 mb-2"
          >
            Admin Email
          </label>
          <input
            id="new-email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="admin@example.com"
            disabled={adding}
            required
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-white/40 focus:border-accentGold/50 focus:outline-none focus:ring-2 focus:ring-accentGold/20 transition disabled:opacity-50"
          />
        </div>

        <div>
          <label
            htmlFor="new-password"
            className="block text-sm font-medium text-white/80 mb-2"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="new-password"
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter strong password"
              disabled={adding}
              required
              minLength={8}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 pr-10 text-white placeholder-white/40 focus:border-accentGold/50 focus:outline-none focus:ring-2 focus:ring-accentGold/20 transition disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Password strength indicator */}
          {newPassword && (
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      passwordStrength.strength === "weak"
                        ? "bg-red-500 w-1/3"
                        : passwordStrength.strength === "medium"
                        ? "bg-yellow-500 w-2/3"
                        : "bg-green-500 w-full"
                    }`}
                  />
                </div>
                <span
                  className={`text-xs font-medium ${
                    passwordStrength.strength === "weak"
                      ? "text-red-400"
                      : passwordStrength.strength === "medium"
                      ? "text-yellow-400"
                      : "text-green-400"
                  }`}
                >
                  {passwordStrength.strength.toUpperCase()}
                </span>
              </div>
              <div className="text-xs text-white/50 space-y-1">
                <p>Password requirements:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li
                    className={
                      newPassword.length >= 8 ? "text-green-400" : "text-white/30"
                    }
                  >
                    At least 8 characters
                  </li>
                  <li
                    className={
                      /[A-Z]/.test(newPassword) ? "text-green-400" : "text-white/30"
                    }
                  >
                    One uppercase letter
                  </li>
                  <li
                    className={
                      /[a-z]/.test(newPassword) ? "text-green-400" : "text-white/30"
                    }
                  >
                    One lowercase letter
                  </li>
                  <li
                    className={
                      /[0-9]/.test(newPassword) ? "text-green-400" : "text-white/30"
                    }
                  >
                    One number
                  </li>
                  <li
                    className={
                      /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
                        ? "text-green-400"
                        : "text-white/30"
                    }
                  >
                    One special character
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={adding || !newEmail || !newPassword}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-accentGold bg-accentGold px-4 py-2 text-sm font-semibold uppercase tracking-[0.1em] text-background transition hover:border-accentGold/90 hover:bg-accentGold/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4" />
          {adding ? "Creating..." : "Add Admin User"}
        </button>
      </form>

      {/* Messages */}
      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-500/50 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          {success}
        </div>
      )}

      {/* Admin emails list */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-6">
        <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-white/80 mb-4">
          Current Admin Emails ({adminEmails.length})
        </h3>

        {adminEmails.length === 0 ? (
          <p className="text-sm text-white/50 italic">
            No admin emails configured. Add an admin user above to grant admin access.
          </p>
        ) : (
          <div className="space-y-2">
            {adminEmails.map((email) => {
              const isDisabled = userStatuses[email] || false;
              const isUpdating = updatingStatus === email;
              const isDeleting = deletingUser === email;
              const isProcessing = isUpdating || isDeleting;
              
              return (
                <div
                  key={email}
                  className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
                    isDisabled
                      ? "border-orange-500/30 bg-orange-500/5"
                      : "border-white/10 bg-black/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-white">{email}</span>
                    {isDisabled && (
                      <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-xs font-medium text-orange-400">
                        DISABLED
                      </span>
                    )}
                    {isDeleting && (
                      <span className="text-xs text-red-400 animate-pulse">Deleting...</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleDisable(email)}
                      disabled={isProcessing}
                      className={`rounded p-1.5 transition ${
                        isDisabled
                          ? "text-green-400/60 hover:bg-green-500/20 hover:text-green-400"
                          : "text-orange-400/60 hover:bg-orange-500/20 hover:text-orange-400"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      title={
                        isDisabled
                          ? "Enable account (allow login)"
                          : "Disable account (prevent login)"
                      }
                    >
                      {isDisabled ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Ban className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleRemoveEmail(email)}
                      disabled={isProcessing}
                      className="rounded p-1.5 text-white/60 transition hover:bg-yellow-500/20 hover:text-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Remove admin access (keeps Firebase account)"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(email)}
                      disabled={isProcessing}
                      className="rounded p-1.5 text-red-400/60 transition hover:bg-red-500/20 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete user account permanently (deletes Firebase account and removes admin access)"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="rounded-lg border border-accentGold/30 bg-accentGold/10 p-4">
        <p className="text-xs text-accentGold/90">
          <strong>Note:</strong> When you add an admin user, a Firebase Authentication
          account will be created with the provided email and password. The user can
          then login to the admin dashboard using these credentials.{" "}
          <strong>Actions available:</strong>{" "}
          <span className="text-accentGold">Disable/Enable</span> to prevent login without deleting,{" "}
          <span className="text-yellow-400">Remove</span> to revoke admin access while keeping the Firebase account, or{" "}
          <span className="text-red-400">Delete</span> to permanently delete both the Firebase account and admin access.
        </p>
      </div>
    </div>
  );
}
