import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { eden } from "../../eden";
import {
  Calendar,
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Users,
  AlertCircle,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

interface Event {
  id: string;
  title: string;
  type: string;
  status: string;
  startTime: string;
  endTime: string;
  timeDisplay: string;
  location: { id: string; name: string };
  responsibleCount: number;
  maxResponsible: number;
  workerCount: number;
  maxWorkers: number;
  givesPoints: boolean;
}

interface Location {
  id: string;
  name: string;
}

const statusBadges: Record<string, string> = {
  open: "badge-success",
  booked: "badge-primary",
  canceled: "badge-error",
};

const typeBadges: Record<string, string> = {
  event: "badge-info",
  private_event: "badge-secondary",
};

export function AdminEvents() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [locationId, setLocationId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEvents();
    fetchLocations();
  }, [page, search, status, locationId]);

  async function fetchEvents() {
    setIsLoading(true);
    const { data } = await eden.events.get({
      query: {
        page: String(page),
        limit: "20",
        ...(search && { search }),
        ...(status && { status }),
        ...(locationId && { locationId }),
      },
    });
    if (data) {
      setEvents(data.events || []);
      setTotalPages(data.pagination?.totalPages || 1);
    }
    setIsLoading(false);
  }

  async function fetchLocations() {
    const { data } = await eden.locations.get();
    if (data?.locations) {
      setLocations(data.locations);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this event?")) return;

    const { error: apiError } = await eden.events[id].delete();

    if (apiError) {
      setError("Failed to delete event");
    } else {
      fetchEvents();
    }
  }

  async function handleCancel(id: string) {
    if (!confirm("Are you sure you want to cancel this event?")) return;

    const { error: apiError } = await eden.events[id].put({
      status: "canceled",
    });

    if (apiError) {
      setError("Failed to cancel event");
    } else {
      fetchEvents();
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="btn btn-ghost btn-sm">
            <ChevronLeft className="w-4 h-4" />
            Back to Admin
          </Link>
          <h1 className="text-3xl font-bold">Event Management</h1>
        </div>
        <Link to="/admin/events/new" className="btn btn-primary">
          <Plus className="w-4 h-4" />
          Create Event
        </Link>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="card bg-base-100 shadow-lg mb-6">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="form-control">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/50" />
                <input
                  type="text"
                  placeholder="Search events..."
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
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="booked">Booked</option>
                <option value="canceled">Canceled</option>
              </select>
            </div>

            <div className="form-control">
              <select
                className="select select-bordered w-full"
                value={locationId}
                onChange={(e) => {
                  setLocationId(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Locations</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="btn btn-ghost"
              onClick={() => {
                setSearch("");
                setStatus("");
                setLocationId("");
                setPage(1);
              }}
            >
              <Filter className="w-4 h-4" /> Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-base-content/30" />
              <p className="text-base-content/60">No events found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Time</th>
                      <th>Location</th>
                      <th>Workers</th>
                      <th>Status</th>
                      <th>Points</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event) => (
                      <tr key={event.id}>
                        <td>
                          <div>
                            <p className="font-medium">{event.title}</p>
                            <span
                              className={`badge badge-sm ${
                                typeBadges[event.type] || "badge-ghost"
                              }`}
                            >
                              {event.type === "private_event"
                                ? "Private"
                                : "Public"}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-base-content/50" />
                            <span className="text-sm">
                              {event.timeDisplay}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-base-content/50" />
                            {event.location?.name}
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-base-content/50" />
                            <span className="text-sm">
                              {event.responsibleCount}/{event.maxResponsible}{" "}
                              resp, {event.workerCount}/{event.maxWorkers}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              statusBadges[event.status] || "badge-ghost"
                            }`}
                          >
                            {event.status}
                          </span>
                        </td>
                        <td>
                          {event.givesPoints ? (
                            <CheckCircle className="w-5 h-5 text-success" />
                          ) : (
                            <XCircle className="w-5 h-5 text-base-content/30" />
                          )}
                        </td>
                        <td>
                          <div className="flex gap-1">
                            <Link
                              to={`/events/${event.id}`}
                              className="btn btn-sm btn-ghost"
                            >
                              View
                            </Link>
                            <Link
                              to={`/admin/events/${event.id}/edit`}
                              className="btn btn-sm btn-ghost"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            {event.status !== "canceled" && (
                              <button
                                className="btn btn-sm btn-ghost text-warning"
                                onClick={() => handleCancel(event.id)}
                              >
                                Cancel
                              </button>
                            )}
                            <button
                              className="btn btn-sm btn-ghost text-error"
                              onClick={() => handleDelete(event.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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
