import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { eden } from "../eden";
import { useAuth } from "../contexts/AuthContext";
import {
  Calendar,
  MapPin,
  Users,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
} from "lucide-react";

interface Event {
  id: string;
  title: string;
  type: string;
  status: string;
  startTime: string;
  endTime: string;
  timeDisplay: string;
  location: {
    id: string;
    name: string;
  };
  responsibleCount: number;
  maxResponsible: number;
  workerCount: number;
  maxWorkers: number;
  givesPoints: boolean;
}

export function Events() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [locationId, setLocationId] = useState("");
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchEvents();
    fetchLocations();
  }, [page, search, status, locationId]);

  async function fetchEvents() {
    setIsLoading(true);
    const { data } = await eden.events.get({
      query: {
        page: String(page),
        limit: "10",
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
    if (data) {
      setLocations(data.locations || []);
    }
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Events</h1>
          <p className="text-base-content/70">Browse and sign up for upcoming events</p>
        </div>
        {(user?.role === "admin" || user?.role === "superadmin") && (
          <Link to="/admin/events" className="btn btn-primary">
            Manage Events
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="card bg-base-100 shadow-lg mb-8">
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

      {/* Events List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-base-content/30" />
          <h2 className="text-xl font-semibold mb-2">No events found</h2>
          <p className="text-base-content/60">
            Try adjusting your filters or check back later.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <Link
              key={event.id}
              to={`/events/${event.id}`}
              className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="card-body">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(event.status)}
                      {event.givesPoints && (
                        <span className="badge badge-secondary">Points</span>
                      )}
                      {event.type === "private_event" && (
                        <span className="badge badge-info">Private</span>
                      )}
                    </div>
                    <h2 className="card-title text-xl">{event.title}</h2>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-base-content/70 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {event.timeDisplay}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {event.location.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-sm text-base-content/70">Responsible</div>
                      <div className="font-semibold">
                        {event.responsibleCount}/{event.maxResponsible}
                      </div>
                      <div className="w-24 h-2 bg-base-200 rounded-full mt-1">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{
                            width: `${(event.responsibleCount / event.maxResponsible) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-sm text-base-content/70">Workers</div>
                      <div className="font-semibold">
                        {event.workerCount}/{event.maxWorkers}
                      </div>
                      <div className="w-24 h-2 bg-base-200 rounded-full mt-1">
                        <div
                          className="h-full bg-secondary rounded-full"
                          style={{
                            width: `${(event.workerCount / event.maxWorkers) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="hidden md:block">
                      {event.status === "open" &&
                      event.workerCount < event.maxWorkers ? (
                        <span className="btn btn-primary btn-sm">Sign Up</span>
                      ) : (
                        <span className="badge badge-ghost">
                          Full
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
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
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
