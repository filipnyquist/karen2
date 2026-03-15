import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { eden } from "../eden";
import {
  Calendar,
  Users,
  Award,
  Ticket,
  ArrowRight,
  Clock,
  MapPin,
  Plus,
  Search,
  TrendingUp,
} from "lucide-react";

interface UpcomingEvent {
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
  isResponsible: boolean;
  guestCount: number;
  maxGuests: number;
}

interface DashboardStats {
  eventsWorked: number;
  rank: number | null;
  ticketsCount: number;
  upcomingEventsCount: number;
}

interface Activity {
  type: string;
  id: string;
  eventId: string;
  eventTitle: string;
  guestName: string;
  createdAt: string;
}

interface DashboardData {
  stats: DashboardStats;
  upcomingEvents: UpcomingEvent[];
  recentActivity: Activity[];
}

export function Dashboard() {
  const { t } = useTranslation("dashboard");
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setIsLoading(true);
    setError(null);
    try {
      const { data: responseData, error: responseError } = await eden.dashboard.get();
      if (responseError) {
        setError("Failed to load dashboard data");
      } else if (responseData) {
        setData(responseData as DashboardData);
      }
    } catch (err) {
      setError("An error occurred while loading the dashboard");
    } finally {
      setIsLoading(false);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "open":
        return <span className="badge badge-success badge-sm">Open</span>;
      case "canceled":
        return <span className="badge badge-error badge-sm">Canceled</span>;
      case "booked":
        return <span className="badge badge-warning badge-sm">Booked</span>;
      default:
        return <span className="badge badge-sm">{status}</span>;
    }
  }

  const stats = data?.stats;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('welcome', { name: user?.name || '' })}</h1>
        </div>
        <div className="flex gap-2">
          <Link to="/events" className="btn btn-primary">
            <Search className="w-4 h-4 mr-2" />
            Browse Events
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : error ? (
        <div className="alert alert-error mb-8">
          <span>{error}</span>
          <button className="btn btn-sm" onClick={fetchDashboardData}>
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Upcoming Events */}
            <div className="stat bg-base-100 shadow rounded-box">
              <div className="stat-figure text-primary">
                <Calendar className="w-8 h-8" />
              </div>
              <div className="stat-title">Upcoming Events</div>
              <div className="stat-value text-primary">
                {stats?.upcomingEventsCount ?? 0}
              </div>
              <div className="stat-desc">You&apos;re signed up for</div>
            </div>

            {/* Events Worked */}
            <div className="stat bg-base-100 shadow rounded-box">
              <div className="stat-figure text-secondary">
                <Award className="w-8 h-8" />
              </div>
              <div className="stat-title">Events Worked</div>
              <div className="stat-value text-secondary">
                {stats?.eventsWorked ?? 0}
              </div>
              <div className="stat-desc">
                {stats?.rank ? `Rank #${stats.rank}` : "No rank yet"}
              </div>
            </div>

            {/* Tickets */}
            <div className="stat bg-base-100 shadow rounded-box">
              <div className="stat-figure text-accent">
                <Ticket className="w-8 h-8" />
              </div>
              <div className="stat-title">Skip Queue Tickets</div>
              <div className="stat-value text-accent">
                {stats?.ticketsCount ?? 0}
              </div>
              <div className="stat-desc">Available to use</div>
            </div>

            {/* Quick Link to Scoreboard */}
            <Link
              to="/scoreboard"
              className="stat bg-base-100 shadow rounded-box hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="stat-figure text-info">
                <TrendingUp className="w-8 h-8" />
              </div>
              <div className="stat-title">Leaderboard</div>
              <div className="stat-value text-info text-2xl">View</div>
              <div className="stat-desc">See all rankings</div>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upcoming Events */}
            <div className="lg:col-span-2">
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="card-title flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Your Upcoming Events
                    </h2>
                    {data && data.upcomingEvents.length > 0 && (
                      <Link to="/events" className="btn btn-ghost btn-sm">
                        View All <ArrowRight className="w-4 h-4 ml-1" />
                      </Link>
                    )}
                  </div>

                  {data && data.upcomingEvents.length === 0 ? (
                    <div className="py-8 text-center text-base-content/60">
                      <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="font-medium">No upcoming events</p>
                      <p className="text-sm mt-2 mb-4">
                        Browse events to find ones you want to work
                      </p>
                      <Link to="/events" className="btn btn-primary btn-sm">
                        <Search className="w-4 h-4 mr-2" />
                        Browse Events
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {data?.upcomingEvents.map((event) => (
                        <div
                          key={event.id}
                          className="border border-base-200 rounded-lg p-4 hover:bg-base-50 transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {getStatusBadge(event.status)}
                                {event.isResponsible && (
                                  <span className="badge badge-primary badge-sm">
                                    Responsible
                                  </span>
                                )}
                                {event.type === "private_event" && (
                                  <span className="badge badge-info badge-sm">
                                    Private
                                  </span>
                                )}
                              </div>
                              <h3 className="font-semibold text-lg">
                                {event.title}
                              </h3>
                              <div className="flex flex-wrap items-center gap-4 text-sm text-base-content/70 mt-1">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {event.timeDisplay}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {event.location.name}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              {event.maxGuests > 0 && (
                                <div className="text-center">
                                  <div className="text-xs text-base-content/70">
                                    Your Guests
                                  </div>
                                  <div className="font-semibold text-sm">
                                    {event.guestCount}/{event.maxGuests}
                                  </div>
                                </div>
                              )}
                              <Link
                                to={`/events/${event.id}/guests`}
                                className="btn btn-outline btn-sm"
                              >
                                <Users className="w-4 h-4 mr-1" />
                                {event.maxGuests > 0 ? "Manage Guests" : "Guests"}
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                  <h3 className="card-title text-lg mb-4">Quick Actions</h3>
                  <div className="space-y-2">
                    <Link to="/events" className="btn btn-outline w-full justify-start">
                      <Search className="w-4 h-4 mr-2" />
                      Find Events
                    </Link>
                    <Link to="/my-tickets" className="btn btn-outline w-full justify-start">
                      <Ticket className="w-4 h-4 mr-2" />
                      My Tickets
                    </Link>
                    <Link to="/scoreboard" className="btn btn-outline w-full justify-start">
                      <Award className="w-4 h-4 mr-2" />
                      Scoreboard
                    </Link>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                  <h3 className="card-title text-lg mb-4">Recent Activity</h3>
                  {data && data.recentActivity.length === 0 ? (
                    <p className="text-base-content/60 text-sm">
                      No recent activity to show
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {data?.recentActivity.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-start gap-3 text-sm"
                        >
                          <div className="bg-base-200 p-2 rounded-full">
                            <Plus className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">
                              Added {activity.guestName}
                            </p>
                            <p className="text-base-content/70 text-xs">
                              to {activity.eventTitle}
                            </p>
                            <p className="text-base-content/50 text-xs mt-1">
                              {new Date(activity.createdAt).toLocaleDateString(
                                "sv-SE"
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
