import React, { useState, useEffect } from "react";
import axios from "axios";
import { API, useAuth } from "../App";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../components/ui/select";
import {
  UserCircle,
  Plus,
  Shield,
  ShieldCheck,
  Lock,
  LockOpen,
  SignOut,
  MagnifyingGlass,
  Warning
} from "@phosphor-icons/react";

const UserManagement = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, sessionsRes] = await Promise.all([
        axios.get(`${API}/users`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/sessions`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setUsers(usersRes.data);
      setSessions(sessionsRes.data);
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async (userId) => {
    if (!window.confirm("Are you sure you want to block this user?")) return;
    try {
      await axios.put(`${API}/users/${userId}/block`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("User blocked successfully");
      fetchData();
    } catch (error) {
      toast.error("Failed to block user");
    }
  };

  const handleUnblock = async (userId) => {
    try {
      await axios.put(`${API}/users/${userId}/unblock`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("User unblocked successfully");
      fetchData();
    } catch (error) {
      toast.error("Failed to unblock user");
    }
  };

  const handleForceLogout = async (userId) => {
    if (!window.confirm("Are you sure you want to force logout this user?")) return;
    try {
      await axios.delete(`${API}/users/${userId}/sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("User sessions cleared");
      fetchData();
    } catch (error) {
      toast.error("Failed to clear sessions");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#4CAF50] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1917]" style={{ fontFamily: 'Manrope' }}>
            User Management
          </h1>
          <p className="text-[#57534E] mt-1">{users.length} total users</p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="h-14 px-6 bg-[#4CAF50] hover:bg-[#43A047] text-white font-semibold rounded-lg flex items-center gap-2"
          data-testid="add-user-button"
        >
          <Plus size={22} weight="bold" />
          Add User
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-[#78716C]" size={20} />
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-12 pl-12 bg-white border-2 border-[#E7E5E4] focus:border-[#4CAF50]"
          data-testid="search-users-input"
        />
      </div>

      {/* Active Sessions */}
      {sessions.length > 0 && (
        <div className="bg-[#E8F5E9] border border-[#C8E6C9] rounded-lg p-4">
          <h3 className="font-semibold text-[#1B5E20] mb-3">Active Sessions ({sessions.length})</h3>
          <div className="space-y-2">
            {sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-[#E7E5E4]">
                <div>
                  <p className="font-medium text-[#1C1917]">{session.user?.name || "Unknown"}</p>
                  <p className="text-sm text-[#57534E]">
                    {session.device_name} • Logged in {new Date(session.login_time).toLocaleString()}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleForceLogout(session.user_id)}
                  className="text-[#DC2626] border-red-200 hover:bg-red-50"
                  data-testid={`force-logout-${session.user_id}`}
                >
                  <SignOut size={18} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="space-y-3">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className={`bg-white border rounded-lg p-4 ${
              user.is_blocked ? "border-red-200 bg-red-50" : "border-[#E7E5E4]"
            }`}
            data-testid={`user-card-${user.id}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                    user.is_blocked ? "bg-red-500" : user.role === "admin" ? "bg-[#1B5E20]" : "bg-[#4CAF50]"
                  }`}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[#1C1917]">{user.name}</h3>
                    {user.role === "admin" && (
                      <span className="px-2 py-0.5 text-xs font-semibold bg-[#1B5E20] text-white rounded">
                        Admin
                      </span>
                    )}
                    {user.is_blocked && (
                      <span className="px-2 py-0.5 text-xs font-semibold bg-[#DC2626] text-white rounded flex items-center gap-1">
                        <Lock size={12} />
                        Blocked
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#57534E]">{user.email}</p>
                  {user.is_blocked && user.blocked_reason && (
                    <p className="text-xs text-[#DC2626] mt-1 flex items-center gap-1">
                      <Warning size={14} />
                      {user.blocked_reason}
                    </p>
                  )}
                  <p className="text-xs text-[#78716C] mt-1">
                    Joined {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {user.is_blocked ? (
                  <Button
                    variant="outline"
                    onClick={() => handleUnblock(user.id)}
                    className="h-10 text-[#16A34A] border-green-200 hover:bg-green-50"
                    data-testid={`unblock-user-${user.id}`}
                  >
                    <LockOpen size={18} />
                    <span className="ml-2 hidden sm:inline">Unblock</span>
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleForceLogout(user.id)}
                      className="h-10"
                      data-testid={`logout-user-${user.id}`}
                    >
                      <SignOut size={18} />
                      <span className="ml-2 hidden sm:inline">Logout</span>
                    </Button>
                    {user.role !== "admin" && (
                      <Button
                        variant="outline"
                        onClick={() => handleBlock(user.id)}
                        className="h-10 text-[#DC2626] border-red-200 hover:bg-red-50"
                        data-testid={`block-user-${user.id}`}
                      >
                        <Lock size={18} />
                        <span className="ml-2 hidden sm:inline">Block</span>
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add User Dialog */}
      <AddUserDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        token={token}
        onSuccess={fetchData}
      />
    </div>
  );
};

const AddUserDialog = ({ open, onClose, token, onSuccess }) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user"
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error("Please fill all required fields");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/auth/register`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("User created successfully");
      onSuccess();
      onClose();
      setForm({ name: "", email: "", password: "", role: "user" });
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'Manrope' }}>Add New User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">
              Full Name *
            </Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Enter full name"
              className="h-12 mt-1"
              data-testid="add-user-name"
            />
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">
              Email *
            </Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Enter email"
              className="h-12 mt-1"
              data-testid="add-user-email"
            />
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">
              Password *
            </Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Enter password"
              className="h-12 mt-1"
              data-testid="add-user-password"
            />
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-[#57534E]">
              Role
            </Label>
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
              <SelectTrigger className="h-12 mt-1" data-testid="add-user-role">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User (Staff/Volunteer)</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-12">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-12 bg-[#4CAF50] hover:bg-[#43A047] text-white"
              data-testid="add-user-submit"
            >
              {loading ? "Creating..." : "Create User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserManagement;
