import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { eden } from "../eden";
import { ArrowLeft, Award, Calendar, User, Users } from "lucide-react";

interface PublicUser {
  id: string;
  name: string;
  nickname: string | null;
  role: string;
  profilePicture: string | null;
  createdAt: string;
  educations: string[];
}

interface RecentEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  givesPoints: boolean;
  isResponsible: boolean;
}

interface UserStats {
  eventsWorked: number;
  eventsAsResponsible: number;
}

export function PublicProfile() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProfile();
  }, [id]);

  async function fetchProfile() {
    if (!id) return;
    setIsLoading(true);
    const { data, error: apiError } = await eden.users[id].get();
    if (apiError) {
      setError("Failed to load profile");
    } else if (data) {
      setProfile(data.user as PublicUser);
      setStats(data.stats as UserStats);
      setRecentEvents(data.recentEvents as RecentEvent[]);
    }
    setIsLoading(false);
  }

  function getDisplayName() {
    return profile?.nickname || profile?.name || "";
  }

  function getAvatarUrl() {
    if (profile?.profilePicture) {
      return profile.profilePicture;
    }
    const name = profile?.name || "";
    const initial = name.charAt(0).toUpperCase();
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&text=${initial}`;
  }

  function getRoleBadgeColor(role: string) {
    switch (role) {
      case "superadmin":
        return "badge-error";
      case "admin":
        return "badge-warning";
      case "user":
        return "badge-primary";
      default:
        return "badge-ghost";
    }
  }

  function getEducationLabel(type: string) {
    switch (type) {
      case "pub_worker":
        return "Pub Worker";
      case "aas":
        return "AAS";
      case "responsible":
        return "Responsible";
      default:
        return type;
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("sv-SE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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

  if (error || !profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <User className="w-16 h-16 mx-auto mb-4 text-error" />
          <h2 className="text-xl font-semibold mb-2">User not found</h2>
          <Link to="/events" className="btn btn-primary">
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back link */}
      <Link to="/events" className="btn btn-ghost btn-sm mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Events
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body items-center text-center">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full overflow-hidden bg-base-200 mb-4">
              <img
                src={getAvatarUrl()}
                alt={getDisplayName()}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `<div class="w-full h-full bg-primary text-primary-content flex items-center justify-center text-3xl font-bold">${profile.name.charAt(0).toUpperCase()}</div>`;
                  }
                }}
              />
            </div>

            <h2 className="card-title text-2xl">{getDisplayName()}</h2>
            {profile.nickname && (
              <p className="text-base-content/60 text-sm">{profile.name}</p>
            )}

            <div className={`badge ${getRoleBadgeColor(profile.role)} mt-2`}>
              {profile.role}
            </div>

            {/* Educations */}
            {profile.educations.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {profile.educations.map((edu) => (
                  <div key={edu} className="badge badge-outline">
                    {getEducationLabel(edu)}
                  </div>
                ))}
              </div>
            )}

            <p className="text-base-content/50 text-sm mt-4">
              Member since {formatDate(profile.createdAt)}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">
                <Award className="w-5 h-5" />
                Stats
              </h3>
              <div className="stats stats-vertical lg:stats-horizontal shadow">
                <div className="stat">
                  <div className="stat-title">Events Worked</div>
                  <div className="stat-value">{stats?.eventsWorked || 0}</div>
                  <div className="stat-desc">Completed events</div>
                </div>
                <div className="stat">
                  <div className="stat-title">As Responsible</div>
                  <div className="stat-value">
                    {stats?.eventsAsResponsible || 0}
                  </div>
                  <div className="stat-desc">Leadership roles</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Regular Events</div>
                  <div className="stat-value">
                    {(stats?.eventsWorked || 0) -
                      (stats?.eventsAsResponsible || 0)}
                  </div>
                  <div className="stat-desc">Team member</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Events */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">
                <Calendar className="w-5 h-5" />
                Recent Events
              </h3>

              {recentEvents.length === 0 ? (
                <div className="text-center py-8 text-base-content/60">
                  <p>No completed events yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Event</th>
                        <th>Date</th>
                        <th>Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentEvents.map((event) => (
                        <tr key={event.id}>
                          <td>
                            <Link
                              to={`/events/${event.id}`}
                              className="font-medium hover:text-primary"
                            >
                              {event.title}
                            </Link>
                          </td>
                          <td>{formatDate(event.startTime)}</td>
                          <td>
                            {event.isResponsible ? (
                              <span className="badge badge-primary">
                                Responsible
                              </span>
                            ) : (
                              <span className="badge badge-ghost">
                                Worker
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
