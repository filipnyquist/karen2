import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { eden } from "../../eden";
import {
  Users,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  User,
  Shield,
  AlertCircle,
} from "lucide-react";

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  emailVerified: boolean;
  deactivated: boolean;
  createdAt: string;
  educations: string[];
}

const roleLabels: Record<string, string> = {
  unverified: "Unverified",
  user: "User",
  admin: "Admin",
  superadmin: "Super Admin",
};

const roleBadges: Record<string, string> = {
  unverified: "badge-ghost",
  user: "badge-primary",
  admin: "badge-secondary",
  superadmin: "badge-accent",
};

const educationLabels: Record<string, string> = {
  pub_worker: "Pub Worker",
  aas: "AAS",
  responsible: "Responsible",
};

export function AdminUsers() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [includeDeactivated, setIncludeDeactivated] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [page, search, role, includeDeactivated]);

  async function fetchUsers() {
    setIsLoading(true);
    const { data } = await eden.admin.users.get({
      query: {
        page: String(page),
        limit: "20",
        ...(search && { search }),
        ...(role && { role }),
        includeDeactivated: includeDeactivated ? "true" : "false",
      },
    });
    if (data) {
      setUsers(data.users || []);
      setTotalPages(data.pagination?.totalPages || 1);
    }
    setIsLoading(false);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/admin" className="btn btn-ghost btn-sm">
          <ChevronLeft className="w-4 h-4" />
          Back to Admin
        </Link>
        <h1 className="text-3xl font-bold">User Management</h1>
      </div>

      {/* Filters */}
      <div className="card bg-base-100 shadow-lg mb-6">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="form-control">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/50" />
                <input
                  type="text"
                  placeholder="Search users..."
                  className="input input-bordered w-full pl-10"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>

            <div className="form-control">
              <select
                className="select select-bordered w-full"
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Roles</option>
                <option value="unverified">Unverified</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>

            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={includeDeactivated}
                  onChange={(e) => {
                    setIncludeDeactivated(e.target.checked);
                    setPage(1);
                  }}
                />
                <span className="label-text">Include deactivated</span>
              </label>
            </div>

            <button
              className="btn btn-ghost"
              onClick={() => {
                setSearch("");
                setRole("");
                setIncludeDeactivated(false);
                setPage(1);
              }}
            >
              <Filter className="w-4 h-4" /> Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-16 h-16 mx-auto mb-4 text-base-content/30" />
              <p className="text-base-content/60">No users found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Educations</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className={user.deactivated ? "opacity-50" : ""}
                      >
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-sm">
                              {user.name.charAt(0)}
                            </div>
                            {user.name}
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>
                          <span
                            className={`badge ${
                              roleBadges[user.role] || "badge-ghost"
                            }`}
                          >
                            {roleLabels[user.role] || user.role}
                          </span>
                        </td>
                        <td>
                          {!user.emailVerified && (
                            <span className="badge badge-warning badge-sm">
                              Unverified
                            </span>
                          )}
                          {user.deactivated && (
                            <span className="badge badge-error badge-sm ml-1">
                              Deactivated
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-1">
                            {user.educations.map((edu) => (
                              <span
                                key={edu}
                                className="badge badge-outline badge-sm"
                              >
                                {educationLabels[edu] || edu}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          <Link
                            to={`/admin/users/${user.id}`}
                            className="btn btn-sm btn-ghost"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <button
                    className="btn btn-sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    className="btn btn-sm"
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
