import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { eden } from "../../eden";
import {
  ArrowLeft,
  User,
  Mail,
  Shield,
  Award,
  Calendar,
  Check,
  X,
  Trash2,
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
  profilePicture?: string;
  educations: {
    id: string;
    type: string;
    assignedBy: { id: string; name: string };
    assignedAt: string;
  }[];
}

interface Stats {
  eventsWorked: number;
  eventsAsResponsible: number;
  pointsEvents: number;
  guestsSignedUp: number;
}

const roleOptions = [
  { value: "unverified", label: "Unverified" },
  { value: "user", label: "User" },
  { value: "admin", label: "Admin" },
  { value: "superadmin", label: "Super Admin" },
];

const educationOptions = [
  { value: "pub_worker", label: "Pub Worker" },
  { value: "aas", label: "AAS (Ansvarig Alkoholservering)" },
  { value: "responsible", label: "Responsible" },
];

export function AdminUserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    fetchUser();
  }, [id]);

  async function fetchUser() {
    if (!id) return;
    setIsLoading(true);
    const { data, error: apiError } = await eden.admin.users[id].get();
    if (apiError) {
      setError("Failed to load user");
    } else if (data) {
      setUser(data.user as UserData);
      setStats(data.stats as Stats);
      setName(data.user.name);
      setRole(data.user.role);
    }
    setIsLoading(false);
  }

  async function handleSave() {
    if (!id) return;
    const { error: apiError } = await eden.admin.users[id].put({
      name,
      role,
    });

    if (apiError) {
      setError(getErrorMessage(apiError));
    } else {
      setIsEditing(false);
      fetchUser();
    }
  }

  async function handleDeactivate() {
    if (!id || !confirm("Are you sure you want to deactivate this user?"))
      return;

    const { error: apiError } = await eden.admin.users[id].delete();

    if (apiError) {
      setError(getErrorMessage(apiError));
    } else {
      navigate("/admin/users");
    }
  }

  async function handleAddEducation(educationType: string) {
    if (!id) return;
    const { error: apiError } = await eden.admin.users[id].educations.post({
      educationType,
    });

    if (apiError) {
      setError(getErrorMessage(apiError));
    } else {
      fetchUser();
    }
  }

  async function handleRemoveEducation(educationId: string) {
    if (!id) return;
    const { error: apiError } = await eden.admin.users[id].educations[
      educationId
    ].delete();

    if (apiError) {
      setError(getErrorMessage(apiError));
    } else {
      fetchUser();
    }
  }

  function getErrorMessage(err: unknown): string {
    if (typeof err === "object" && err !== null) {
      const e = err as { message?: string; value?: { message?: string } };
      return e.message || e.value?.message || "An error occurred";
    }
    return "An error occurred";
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-error" />
          <h2 className="text-xl font-semibold">User not found</h2>
        </div>
      </div>
    );
  }

  const hasEducation = (type: string) =>
    user.educations.some((e) => e.type === type);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/admin/users" className="btn btn-ghost btn-sm">
          <ArrowLeft className="w-4 h-4" />
          Back to Users
        </Link>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-primary text-primary-content flex items-center justify-center text-3xl font-bold">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    {isEditing ? (
                      <input
                        type="text"
                        className="input input-bordered text-xl font-bold"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    ) : (
                      <h1 className="text-3xl font-bold">{user.name}</h1>
                    )}
                    <div className="flex items-center gap-2 text-base-content/70 mt-1">
                      <Mail className="w-4 h-4" />
                      {user.email}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={handleSave}
                      >
                        <Check className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          setIsEditing(false);
                          setName(user.name);
                          setRole(user.role);
                        }}
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setIsEditing(true)}
                      >
                        Edit
                      </button>
                      {!user.deactivated && (
                        <button
                          className="btn btn-error btn-sm btn-outline"
                          onClick={handleDeactivate}
                        >
                          <Trash2 className="w-4 h-4" />
                          Deactivate
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="divider"></div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    <span className="label-text">Role</span>
                  </label>
                  {isEditing ? (
                    <select
                      className="select select-bordered w-full"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      {roleOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary" />
                      <span className="capitalize">{user.role}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="label">
                    <span className="label-text">Status</span>
                  </label>
                  <div className="flex gap-2">
                    <span
                      className={`badge ${
                        user.emailVerified
                          ? "badge-success"
                          : "badge-warning"
                      }`}
                    >
                      {user.emailVerified ? "Verified" : "Unverified"}
                    </span>
                    {user.deactivated && (
                      <span className="badge badge-error">Deactivated</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="stat bg-base-100 shadow rounded-box">
              <div className="stat-title">Events Worked</div>
              <div className="stat-value">{stats?.eventsWorked || 0}</div>
            </div>
            <div className="stat bg-base-100 shadow rounded-box">
              <div className="stat-title">As Responsible</div>
              <div className="stat-value">
                {stats?.eventsAsResponsible || 0}
              </div>
            </div>
            <div className="stat bg-base-100 shadow rounded-box">
              <div className="stat-title">Points Events</div>
              <div className="stat-value">{stats?.pointsEvents || 0}</div>
            </div>
            <div className="stat bg-base-100 shadow rounded-box">
              <div className="stat-title">Guests Signed Up</div>
              <div className="stat-value">{stats?.guestsSignedUp || 0}</div>
            </div>
          </div>
        </div>

        {/* Educations */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">
              <Award className="w-5 h-5" />
              Educations
            </h2>

            <div className="space-y-3 mt-4">
              {educationOptions.map((edu) => {
                const has = hasEducation(edu.value);
                const userEdu = user.educations.find(
                  (e) => e.type === edu.value
                );

                return (
                  <div
                    key={edu.value}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      has ? "bg-success/10" : "bg-base-200"
                    }`}
                  >
                    <div>
                      <span className="font-medium">{edu.label}</span>
                      {userEdu && (
                        <p className="text-xs text-base-content/70">
                          Assigned by {userEdu.assignedBy.name} on{" "}
                          {new Date(userEdu.assignedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    {has ? (
                      <button
                        className="btn btn-error btn-sm btn-outline"
                        onClick={() => handleRemoveEducation(userEdu!.id)}
                      >
                        <X className="w-4 h-4" />
                        Remove
                      </button>
                    ) : (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleAddEducation(edu.value)}
                      >
                        <Check className="w-4 h-4" />
                        Add
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
