import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { eden } from "../eden";
import { User, Mail, Award, Ticket, Edit2, Save, X, Camera } from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  nickname: string | null;
  role: string;
  emailVerified: boolean;
  profilePicture: string | null;
  educations: string[];
}

export function Profile() {
  const { user: authUser, refreshUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    nickname: "",
    profilePicture: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    setIsLoading(true);
    const { data, error } = await eden.users.me.get();
    if (error) {
      setError("Failed to load profile");
    } else if (data?.user) {
      setProfile(data.user as UserProfile);
      setFormData({
        name: data.user.name || "",
        nickname: data.user.nickname || "",
        profilePicture: data.user.profilePicture || "",
      });
    }
    setIsLoading(false);
  }

  async function handleSave() {
    setIsSaving(true);
    setError("");
    setSuccessMessage("");

    const updateData: {
      name?: string;
      nickname?: string | null;
      profilePicture?: string | null;
    } = {};

    if (formData.name !== profile?.name) {
      updateData.name = formData.name;
    }

    if (formData.nickname !== (profile?.nickname || "")) {
      updateData.nickname = formData.nickname || null;
    }

    if (formData.profilePicture !== (profile?.profilePicture || "")) {
      updateData.profilePicture = formData.profilePicture || null;
    }

    // Only send request if there are changes
    if (Object.keys(updateData).length === 0) {
      setIsEditing(false);
      setIsSaving(false);
      return;
    }

    const { data, error } = await eden.users.me.put(updateData);

    if (error) {
      setError(getErrorMessage(error));
    } else if (data?.user) {
      setProfile(data.user as UserProfile);
      setSuccessMessage("Profile updated successfully");
      setIsEditing(false);
      // Refresh auth context to update name in navbar
      refreshUser?.();
    }

    setIsSaving(false);
  }

  function handleCancel() {
    setFormData({
      name: profile?.name || "",
      nickname: profile?.nickname || "",
      profilePicture: profile?.profilePicture || "",
    });
    setIsEditing(false);
    setError("");
  }

  function getErrorMessage(err: unknown): string {
    if (typeof err === "object" && err !== null) {
      const e = err as { message?: string; value?: { message?: string } };
      return e.message || e.value?.message || "An error occurred";
    }
    return "An error occurred";
  }

  function getDisplayName() {
    return profile?.nickname || profile?.name || "";
  }

  function getAvatarUrl() {
    if (profile?.profilePicture) {
      return profile.profilePicture;
    }
    // Generate avatar with initials
    const name = profile?.name || "";
    const initial = name.charAt(0).toUpperCase();
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&text=${initial}`;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Profile</h1>

      {error && (
        <div className="alert alert-error mb-6">
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success mb-6">
          <span>{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body items-center text-center">
            {/* Avatar */}
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-base-200">
                <img
                  src={getAvatarUrl()}
                  alt={getDisplayName()}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to initial on error
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<div class="w-full h-full bg-primary text-primary-content flex items-center justify-center text-3xl font-bold">${profile?.name.charAt(0).toUpperCase()}</div>`;
                    }
                  }}
                />
              </div>
              {isEditing && (
                <div className="absolute -bottom-2 -right-2 bg-base-100 rounded-full p-1 shadow">
                  <Camera className="w-5 h-5 text-base-content/70" />
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="w-full space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Name</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Your name"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Nickname</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={formData.nickname}
                    onChange={(e) =>
                      setFormData({ ...formData, nickname: e.target.value })
                    }
                    placeholder="Display nickname (optional)"
                  />
                  <label className="label">
                    <span className="label-text-alt">
                      Shown instead of your name
                    </span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Profile Picture URL</span>
                  </label>
                  <input
                    type="url"
                    className="input input-bordered w-full"
                    value={formData.profilePicture}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        profilePicture: e.target.value,
                      })
                    }
                    placeholder="https://example.com/photo.jpg"
                  />
                  <label className="label">
                    <span className="label-text-alt">
                      Leave empty for auto-generated avatar
                    </span>
                  </label>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    className="btn btn-primary flex-1"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <span className="loading loading-spinner loading-sm" />
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </>
                    )}
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="card-title text-2xl">{getDisplayName()}</h2>
                {profile?.nickname && (
                  <p className="text-base-content/60 text-sm">{profile.name}</p>
                )}
                <p className="text-base-content/70">{profile?.email}</p>
                <div className="badge badge-primary mt-2">{profile?.role}</div>

                <button
                  className="btn btn-ghost btn-sm mt-4"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Profile
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">
                <Award className="w-5 h-5" />
                Your Stats
              </h3>
              <div className="stats stats-vertical lg:stats-horizontal shadow">
                <div className="stat">
                  <div className="stat-title">Events Worked</div>
                  <div className="stat-value">0</div>
                  <div className="stat-desc">All time</div>
                </div>
                <div className="stat">
                  <div className="stat-title">This Semester</div>
                  <div className="stat-value">0</div>
                  <div className="stat-desc">Current ranking</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Guests Signed Up</div>
                  <div className="stat-value">0</div>
                  <div className="stat-desc">Total</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">
                <Ticket className="w-5 h-5" />
                Skip Queue Tickets
              </h3>
              <div className="py-8 text-center text-base-content/60">
                <p>No active tickets</p>
                <p className="text-sm mt-2">
                  Work events to earn skip queue tickets
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
