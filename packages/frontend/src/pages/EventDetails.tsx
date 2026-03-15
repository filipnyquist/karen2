import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { eden } from "../eden";
import { useAuth } from "../contexts/AuthContext";
import { useEventSubscription } from "../contexts/WebSocketContext";
import { Comments } from "../components/Comments";
import { TicketGenerator } from "../components/TicketGenerator";
import { TicketRedeemer } from "../components/TicketRedeemer";
import {
  Calendar,
  MapPin,
  Users,
  ArrowLeft,
  Clock,
  AlertCircle,
  CheckCircle,
  UserPlus,
  UserMinus,
  User,
} from "lucide-react";

interface Event {
  id: string;
  title: string;
  description?: string;
  type: string;
  notice?: string;
  location: {
    id: string;
    name: string;
    address?: string;
  };
  startTime: string;
  endTime: string;
  timeDisplay: string;
  status: string;
  minResponsible: number;
  maxResponsible: number;
  minWorkers: number;
  maxWorkers: number;
  maxGuests: number;
  maxGuestsPerPerson?: number;
  givesPoints: boolean;
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: string;
  workers: {
    responsible: Worker[];
    regular: Worker[];
  };
}

interface Worker {
  id: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    nickname?: string | null;
    profilePicture?: string;
  };
}

export function EventDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [error, setError] = useState("");
  const [isSignedUp, setIsSignedUp] = useState(false);

  // WebSocket message handler for real-time updates
  const handleWebSocketMessage = useCallback((message: { type: string; data?: { user?: { id: string; name: string }; workerId?: string; userId?: string } }) => {
    switch (message.type) {
      case "worker_signup": {
        // Refresh event data when someone signs up
        fetchEvent();
        // Show toast notification if it's not the current user
        if (message.data?.user?.id !== user?.id) {
          showToast(`${message.data?.user?.name} signed up to work`, "info");
        }
        break;
      }
      case "worker_cancel": {
        // Refresh event data when someone cancels
        fetchEvent();
        break;
      }
      case "comment": {
        // Comments component handles its own updates via refresh
        break;
      }
      case "guest_signup": {
        // Refresh event data when guest is added
        fetchEvent();
        break;
      }
    }
  }, [user?.id]);

  // Subscribe to WebSocket updates for this event
  useEventSubscription(id || "", handleWebSocketMessage);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  // Toast notification helper
  function showToast(message: string, type: "info" | "success" | "warning" | "error" = "info") {
    // Create toast element
    const toast = document.createElement("div");
    const alertClass = {
      info: "alert-info",
      success: "alert-success",
      warning: "alert-warning",
      error: "alert-error",
    }[type];

    toast.className = `alert ${alertClass} shadow-lg fixed bottom-4 right-4 z-50 max-w-sm animate-fade-in`;
    toast.innerHTML = `
      <span>${message}</span>
    `;

    document.body.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
      toast.classList.add("animate-fade-out");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  const fetchEvent = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    const { data, error } = await eden.events[id].get();
    if (error) {
      setError("Failed to load event");
    } else if (data?.event) {
      setEvent(data.event as Event);
      // Check if current user is signed up
      const allWorkers = [
        ...(data.event.workers?.responsible || []),
        ...(data.event.workers?.regular || []),
      ];
      setIsSignedUp(allWorkers.some((w: Worker) => w.user.id === user?.id));
    }
    setIsLoading(false);
  }, [id, user?.id]);

  async function handleSignup(asResponsible?: boolean) {
    if (!user || !id) {
      navigate("/login");
      return;
    }

    setIsSigningUp(true);
    setError("");

    const { error } = await eden.events[id].signup.post(
      asResponsible !== undefined ? { asResponsible } : undefined
    );

    if (error) {
      setError(getErrorMessage(error));
    } else {
      setIsSignedUp(true);
      fetchEvent();
    }

    setIsSigningUp(false);
  }

  async function handleCancelSignup() {
    if (!id) return;
    setIsSigningUp(true);
    setError("");

    const { error } = await eden.events[id].signup.delete();

    if (error) {
      setError(getErrorMessage(error));
    } else {
      setIsSignedUp(false);
      fetchEvent();
    }

    setIsSigningUp(false);
  }

  function getErrorMessage(err: unknown): string {
    if (typeof err === "object" && err !== null) {
      const e = err as { message?: string; value?: { message?: string } };
      return e.message || e.value?.message || "An error occurred";
    }
    return "An error occurred";
  }

  function getWorkerDisplayName(worker: Worker) {
    return worker.user.nickname || worker.user.name;
  }

  function getWorkerAvatarUrl(worker: Worker) {
    if (worker.user.profilePicture) {
      return worker.user.profilePicture;
    }
    const name = worker.user.name || "";
    const initial = name.charAt(0).toUpperCase();
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&text=${initial}`;
  }

  function formatSignupDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString("sv-SE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "open":
        return <span className="badge badge-success">Open</span>;
      case "canceled":
        return <span className="badge badge-error">Canceled</span>;
      case "booked":
        return <span className="badge badge-warning">Booked</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-error" />
          <h2 className="text-xl font-semibold mb-2">Event not found</h2>
          <Link to="/events" className="btn btn-primary">
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  const isEventFull =
    event.workers.responsible.length >= event.maxResponsible &&
    event.workers.regular.length >= event.maxWorkers;

  const canSignup =
    event.status === "open" &&
    new Date(event.startTime) > new Date() &&
    !isEventFull;

  // Check if user is responsible for this event
  const isResponsible = event.workers.responsible.some(
    (w: Worker) => w.user.id === user?.id
  );
  const canManageTickets = user?.role === "admin" || user?.role === "superadmin" || isResponsible;

  // Check if user can sign up as responsible
  const hasResponsibleEducation = user?.educations?.includes("responsible");
  const responsibleSpotsAvailable = event.workers.responsible.length < event.maxResponsible;
  const canSignupAsResponsible = hasResponsibleEducation && responsibleSpotsAvailable;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        to="/events"
        className="btn btn-ghost btn-sm mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Events
      </Link>

      {/* Event Header */}
      <div className="card bg-base-100 shadow-xl mb-8">
        <div className="card-body">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {getStatusBadge(event.status)}
            {event.givesPoints && (
              <span className="badge badge-secondary">Gives Points</span>
            )}
            {event.type === "private_event" && (
              <span className="badge badge-info">Private Event</span>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-4">{event.title}</h1>

          <div className="flex flex-wrap items-center gap-6 text-base-content/70 mb-6">
            <span className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              {event.timeDisplay}
            </span>
            <Link
              to={`/locations/${event.location.id}`}
              className="flex items-center gap-2 hover:text-primary"
            >
              <MapPin className="w-5 h-5" />
              {event.location.name}
            </Link>
          </div>

          {event.description && (
            <div className="prose max-w-none mb-6">
              <p>{event.description}</p>
            </div>
          )}

          {event.notice && event.type === "private_event" && (
            <div className="alert alert-info mb-6">
              <AlertCircle className="w-5 h-5" />
              <span>{event.notice}</span>
            </div>
          )}

          {error && (
            <div className="alert alert-error mb-6">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Signup Button */}
          {user && (
            <div className="flex gap-4">
              {isSignedUp ? (
                <button
                  className="btn btn-error"
                  onClick={handleCancelSignup}
                  disabled={isSigningUp}
                >
                  {isSigningUp ? (
                    <span className="loading loading-spinner"></span>
                  ) : (
                    <>
                      <UserMinus className="w-5 h-5" />
                      Cancel Signup
                    </>
                  )}
                </button>
              ) : canSignupAsResponsible ? (
                // Show two buttons for users with responsible education
                <>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleSignup(true)}
                    disabled={!canSignup || isSigningUp}
                  >
                    {isSigningUp ? (
                      <span className="loading loading-spinner"></span>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" />
                        Sign Up as Responsible
                      </>
                    )}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleSignup(false)}
                    disabled={!canSignup || isSigningUp}
                  >
                    {isSigningUp ? (
                      <span className="loading loading-spinner"></span>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" />
                        Sign Up as Worker
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={() => handleSignup()}
                  disabled={!canSignup || isSigningUp}
                >
                  {isSigningUp ? (
                    <span className="loading loading-spinner"></span>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      Sign Up to Work
                    </>
                  )}
                </button>
              )}

              {event.maxGuests > 0 && (
                <Link
                  to={`/events/${event.id}/guests`}
                  className="btn btn-secondary"
                >
                  {canManageTickets ? "View All Guests" : "Manage Guests"}
                </Link>
              )}
            </div>
          )}

          {!user && event.status === "open" && (
            <div className="alert alert-info">
              <Link to="/login" className="link link-primary">
                Log in
              </Link>{" "}
              to sign up for this event
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Workers List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Responsible Workers */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">
                <Users className="w-5 h-5" />
                Responsible ({event.workers.responsible.length}/
                {event.maxResponsible})
              </h2>

              {event.workers.responsible.length === 0 ? (
                <p className="text-base-content/60 py-4">
                  No responsible assigned yet
                </p>
              ) : (
                <div className="overflow-x-auto mt-4">
                  <table className="table table-zebra">
                    <thead>
                      <tr>
                        <th className="w-12"></th>
                        <th>Name</th>
                        <th className="w-32">Signed up</th>
                      </tr>
                    </thead>
                    <tbody>
                      {event.workers.responsible.map((worker) => (
                        <tr key={worker.id}>
                          <td>
                            <Link to={`/users/${worker.user.id}`} className="avatar hover:opacity-80 transition-opacity">
                              <div className="w-10 h-10 rounded-full">
                                <img
                                  src={getWorkerAvatarUrl(worker)}
                                  alt={getWorkerDisplayName(worker)}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = "none";
                                    const parent = target.parentElement;
                                    if (parent) {
                                      parent.innerHTML = `<div class="w-full h-full bg-primary text-primary-content flex items-center justify-center text-lg font-bold">${worker.user.name.charAt(0).toUpperCase()}</div>`;
                                    }
                                  }}
                                />
                              </div>
                            </Link>
                          </td>
                          <td>
                            <Link
                              to={`/users/${worker.user.id}`}
                              className="flex flex-col hover:text-primary transition-colors"
                            >
                              <span className="font-medium">
                                {getWorkerDisplayName(worker)}
                              </span>
                              {worker.user.nickname && (
                                <span className="text-xs text-base-content/60">
                                  {worker.user.name}
                                </span>
                              )}
                            </Link>
                          </td>
                          <td className="text-sm text-base-content/70">
                            {formatSignupDate(worker.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Regular Workers */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">
                <User className="w-5 h-5" />
                Workers ({event.workers.regular.length}/{event.maxWorkers})
              </h2>

              {event.workers.regular.length === 0 ? (
                <p className="text-base-content/60 py-4">
                  No workers signed up yet. Be the first!
                </p>
              ) : (
                <div className="overflow-x-auto mt-4">
                  <table className="table table-zebra">
                    <thead>
                      <tr>
                        <th className="w-12"></th>
                        <th>Name</th>
                        <th className="w-32">Signed up</th>
                      </tr>
                    </thead>
                    <tbody>
                      {event.workers.regular.map((worker) => (
                        <tr key={worker.id}>
                          <td>
                            <Link to={`/users/${worker.user.id}`} className="avatar hover:opacity-80 transition-opacity">
                              <div className="w-10 h-10 rounded-full">
                                <img
                                  src={getWorkerAvatarUrl(worker)}
                                  alt={getWorkerDisplayName(worker)}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = "none";
                                    const parent = target.parentElement;
                                    if (parent) {
                                      parent.innerHTML = `<div class="w-full h-full bg-secondary text-secondary-content flex items-center justify-center text-lg font-bold">${worker.user.name.charAt(0).toUpperCase()}</div>`;
                                    }
                                  }}
                                />
                              </div>
                            </Link>
                          </td>
                          <td>
                            <Link
                              to={`/users/${worker.user.id}`}
                              className="flex flex-col hover:text-primary transition-colors"
                            >
                              <span className="font-medium">
                                {getWorkerDisplayName(worker)}
                              </span>
                              {worker.user.nickname && (
                                <span className="text-xs text-base-content/60">
                                  {worker.user.name}
                                </span>
                              )}
                            </Link>
                          </td>
                          <td className="text-sm text-base-content/70">
                            {formatSignupDate(worker.createdAt)}
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

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Management - Only visible to responsible/admin */}
          {canManageTickets && event.status !== "canceled" && (
            <>
              <TicketGenerator
                eventId={event.id}
                workers={[
                  ...event.workers.responsible,
                  ...event.workers.regular,
                ]}
                canGenerate={canManageTickets}
              />
              <TicketRedeemer
                eventId={event.id}
                canRedeem={canManageTickets}
              />
            </>
          )}

          {/* Event Info */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="font-bold mb-4">Event Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-base-content/70">Created by</span>
                  <span>{event.createdBy.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-content/70">Max Guests</span>
                  <span>{event.maxGuests}</span>
                </div>
                {event.maxGuestsPerPerson && (
                  <div className="flex justify-between">
                    <span className="text-base-content/70">
                      Max guests per person
                    </span>
                    <span>{event.maxGuestsPerPerson}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="font-bold mb-4">Signup Progress</h3>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Responsible</span>
                  <span>
                    {event.workers.responsible.length}/{event.maxResponsible}
                  </span>
                </div>
                <div className="w-full h-2 bg-base-200 rounded-full">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{
                      width: `${
                        (event.workers.responsible.length / event.maxResponsible) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Workers</span>
                  <span>
                    {event.workers.regular.length}/{event.maxWorkers}
                  </span>
                </div>
                <div className="w-full h-2 bg-base-200 rounded-full">
                  <div
                    className="h-full bg-secondary rounded-full"
                    style={{
                      width: `${
                        (event.workers.regular.length / event.maxWorkers) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="mt-8">
        <Comments eventId={event.id} />
      </div>
    </div>
  );
}
