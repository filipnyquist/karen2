import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { eden } from "../eden";
import { useAuth } from "../contexts/AuthContext";
import {
  Users,
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  AlertCircle,
  X,
  Check,
} from "lucide-react";

interface Guest {
  id: string;
  guestName: string;
  guestEmail?: string;
  guestSsn?: string;
  signedUpBy?: {
    id: string;
    name: string;
  };
  createdAt: string;
}

export function GuestList() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [myGuests, setMyGuests] = useState<Guest[]>([]);
  const [totalGuests, setTotalGuests] = useState(0);
  const [maxGuests, setMaxGuests] = useState(0);
  const [canViewFullList, setCanViewFullList] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingGuest, setEditingGuest] = useState<string | null>(null);

  // Form state
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestSsn, setGuestSsn] = useState("");

  useEffect(() => {
    fetchGuests();
  }, [id]);

  async function fetchGuests() {
    if (!id) return;
    setIsLoading(true);
    const { data, error: apiError } = await eden.events[id].guests.get();
    if (apiError) {
      setError("Failed to load guest list");
    } else if (data) {
      setTotalGuests(data.totalGuests || 0);
      setMaxGuests(data.maxGuests || 0);
      setCanViewFullList(data.canViewFullList || false);
      if (data.canViewFullList) {
        setGuests(data.guests || []);
      } else {
        setMyGuests(data.myGuests || []);
      }
    }
    setIsLoading(false);
  }

  async function handleAddGuest(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !user?.emailVerified) return;

    setError("");
    const { error: apiError } = await eden.events[id].guests.post({
      guestName,
      guestEmail: guestEmail || undefined,
      guestSsn: guestSsn || undefined,
    });

    if (apiError) {
      setError(getErrorMessage(apiError));
    } else {
      setIsAdding(false);
      setGuestName("");
      setGuestEmail("");
      setGuestSsn("");
      fetchGuests();
    }
  }

  async function handleUpdateGuest(guestId: string) {
    if (!id) return;

    setError("");
    const { error: apiError } = await eden.events[id].guests[guestId].put({
      guestName,
      guestEmail: guestEmail || undefined,
      guestSsn: guestSsn || undefined,
    });

    if (apiError) {
      setError(getErrorMessage(apiError));
    } else {
      setEditingGuest(null);
      setGuestName("");
      setGuestEmail("");
      setGuestSsn("");
      fetchGuests();
    }
  }

  async function handleDeleteGuest(guestId: string) {
    if (!id) return;
    if (!confirm("Are you sure you want to remove this guest?")) return;

    const { error: apiError } = await eden.events[id].guests[guestId].delete();

    if (apiError) {
      setError(getErrorMessage(apiError));
    } else {
      fetchGuests();
    }
  }

  function getErrorMessage(err: unknown): string {
    if (typeof err === "object" && err !== null) {
      const e = err as { message?: string; value?: { message?: string } };
      return e.message || e.value?.message || "An error occurred";
    }
    return "An error occurred";
  }

  function startEditing(guest: Guest) {
    setEditingGuest(guest.id);
    setGuestName(guest.guestName);
    setGuestEmail(guest.guestEmail || "");
    setGuestSsn(guest.guestSsn || "");
  }

  function cancelEditing() {
    setEditingGuest(null);
    setGuestName("");
    setGuestEmail("");
    setGuestSsn("");
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  const displayGuests = canViewFullList ? guests : myGuests;
  const canAddGuests = user?.emailVerified && maxGuests > 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back link */}
      <Link to={`/events/${id}`} className="btn btn-ghost btn-sm mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Event
      </Link>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            {canViewFullList ? "All Guests" : "My Guests"}
          </h1>
          <p className="text-base-content/70">
            {totalGuests} of {maxGuests} spots filled
          </p>
        </div>
        {canAddGuests && !isAdding && (
          <button
            className="btn btn-primary"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="w-5 h-5" />
            Add Guest
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Add Guest Form */}
      {isAdding && (
        <div className="card bg-base-100 shadow-lg mb-6">
          <div className="card-body">
            <h2 className="card-title mb-4">Add Guest</h2>
            <form onSubmit={handleAddGuest} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Guest Name *</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  required
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Email</span>
                </label>
                <input
                  type="email"
                  className="input input-bordered"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">SSN (Personnummer)</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={guestSsn}
                  onChange={(e) => setGuestSsn(e.target.value)}
                  placeholder="YYYYMMDD-XXXX"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary">
                  <Check className="w-4 h-4" />
                  Add
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsAdding(false)}
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="card bg-base-100 shadow-lg mb-6">
        <div className="card-body">
          <div className="flex justify-between text-sm mb-2">
            <span>Guest List Capacity</span>
            <span>
              {totalGuests} / {maxGuests}
            </span>
          </div>
          <div className="w-full h-3 bg-base-200 rounded-full">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${(totalGuests / maxGuests) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Guest List */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          {displayGuests.length === 0 ? (
            <div className="text-center py-12 text-base-content/60">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No guests yet</p>
              {canAddGuests && (
                <p className="text-sm mt-2">
                  Be the first to add a guest!
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>SSN</th>
                    {canViewFullList && <th>Added By</th>}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayGuests.map((guest) => (
                    <tr key={guest.id}>
                      {editingGuest === guest.id ? (
                        <>
                          <td>
                            <input
                              type="text"
                              className="input input-bordered input-sm w-full"
                              value={guestName}
                              onChange={(e) => setGuestName(e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="email"
                              className="input input-bordered input-sm w-full"
                              value={guestEmail}
                              onChange={(e) => setGuestEmail(e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="input input-bordered input-sm w-full"
                              value={guestSsn}
                              onChange={(e) => setGuestSsn(e.target.value)}
                            />
                          </td>
                          {canViewFullList && <td>-</td>}
                          <td>
                            <div className="flex gap-1">
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => handleUpdateGuest(guest.id)}
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                className="btn btn-sm btn-ghost"
                                onClick={cancelEditing}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="font-medium">{guest.guestName}</td>
                          <td>{guest.guestEmail || "-"}</td>
                          <td>{guest.guestSsn || "-"}</td>
                          {canViewFullList && (
                            <td>{guest.signedUpBy?.name || "-"}</td>
                          )}
                          <td>
                            {(!canViewFullList ||
                              guest.signedUpBy?.id === user?.id ||
                              user?.role === "admin" ||
                              user?.role === "superadmin") && (
                              <div className="flex gap-1">
                                <button
                                  className="btn btn-sm btn-ghost"
                                  onClick={() => startEditing(guest)}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  className="btn btn-sm btn-error btn-ghost"
                                  onClick={() => handleDeleteGuest(guest.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
