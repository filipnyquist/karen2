import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { eden } from "../../eden";
import {
  Users,
  Calendar,
  MapPin,
  Award,
  Settings,
  ChevronRight,
} from "lucide-react";

interface Stats {
  totalUsers: number;
  upcomingEvents: number;
  totalLocations: number;
  recentEvents: Event[];
}

interface Event {
  id: string;
  title: string;
  startTime: string;
  location: {
    name: string;
  };
  workerCount: number;
  maxWorkers: number;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    setIsLoading(true);
    // Fetch multiple endpoints in parallel
    const [{ data: usersData }, { data: eventsData }, { data: locationsData }] =
      await Promise.all([
        eden.admin.users.get({ query: { limit: "1" } }),
        eden.events.get({ query: { limit: "5" } }),
        eden.locations.get(),
      ]);

    setStats({
      totalUsers: usersData?.pagination?.total || 0,
      upcomingEvents: eventsData?.pagination?.total || 0,
      totalLocations: locationsData?.locations?.length || 0,
      recentEvents: eventsData?.events?.slice(0, 5) || [],
    });
    setIsLoading(false);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link
          to="/admin/users"
          className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow"
        >
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base-content/70">Total Users</p>
                <p className="text-3xl font-bold">{stats?.totalUsers || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>
        </Link>

        <Link
          to="/admin/events"
          className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow"
        >
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base-content/70">Events</p>
                <p className="text-3xl font-bold">
                  {stats?.upcomingEvents || 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-secondary" />
              </div>
            </div>
          </div>
        </Link>

        <Link
          to="/admin/locations"
          className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow"
        >
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base-content/70">Locations</p>
                <p className="text-3xl font-bold">
                  {stats?.totalLocations || 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-accent" />
              </div>
            </div>
          </div>
        </Link>

        <Link
          to="/admin/frontpage"
          className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow"
        >
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base-content/70">Front Page</p>
                <p className="text-lg font-bold">Edit Notice</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-info/10 flex items-center justify-center">
                <Settings className="w-6 h-6 text-info" />
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                to="/admin/events/new"
                className="btn btn-outline w-full justify-between"
              >
                <span>Create New Event</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                to="/admin/locations/new"
                className="btn btn-outline w-full justify-between"
              >
                <span>Add New Location</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                to="/admin/users"
                className="btn btn-outline w-full justify-between"
              >
                <span>Manage Users</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title mb-4">Recent Events</h2>
            {stats?.recentEvents?.length === 0 ? (
              <p className="text-base-content/60">No upcoming events</p>
            ) : (
              <div className="space-y-3">
                {stats?.recentEvents?.map((event) => (
                  <Link
                    key={event.id}
                    to={`/events/${event.id}`}
                    className="flex items-center justify-between p-3 bg-base-200 rounded-lg hover:bg-base-300 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-base-content/70">
                        {event.location?.name}
                      </p>
                    </div>
                    <div className="text-sm">
                      {event.workerCount}/{event.maxWorkers}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
