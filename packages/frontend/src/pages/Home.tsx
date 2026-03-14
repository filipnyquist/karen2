import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { eden } from "../eden";
import {
  Calendar,
  MapPin,
  Trophy,
  ArrowRight,
  FileText,
  Users,
  Clock,
} from "lucide-react";

interface Notice {
  id: string;
  title: string | null;
  content: string;
  isActive: boolean;
}

interface Event {
  id: string;
  title: string;
  timeDisplay: string;
  location: { name: string };
  workerCount: number;
  maxWorkers: number;
  responsibleCount: number;
  maxResponsible: number;
}

export function Home() {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setIsLoading(true);

    // Fetch notice and events in parallel
    const [{ data: noticeData }, { data: eventsData }] = await Promise.all([
      eden.events["frontpage-notice"].get(),
      eden.events.get({ query: { limit: "5", status: "open" } }),
    ]);

    if (noticeData?.notice) {
      setNotice(noticeData.notice);
    }

    if (eventsData?.events) {
      setUpcomingEvents(eventsData.events);
    }

    setIsLoading(false);
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero min-h-[70vh] bg-gradient-to-br from-primary to-secondary text-primary-content">
        <div className="hero-content text-center">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Welcome to Karen2
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Event management platform for Blekinge Studentkår.
              Sign up for events, manage guest lists, and track your contributions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/events" className="btn btn-secondary btn-lg">
                <Calendar className="w-5 h-5" />
                Browse Events
              </Link>
              <Link to="/register" className="btn btn-outline btn-lg border-white text-white hover:bg-white hover:text-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Notice Section */}
      {notice?.isActive && (
        <section className="py-8 px-4 bg-info/10">
          <div className="max-w-4xl mx-auto">
            <div className="alert alert-info">
              <FileText className="w-6 h-6" />
              <div>
                {notice.title && (
                  <h2 className="font-bold text-lg">{notice.title}</h2>
                )}
                <div className="whitespace-pre-wrap">{notice.content}</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            What You Can Do
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body items-center text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Calendar className="w-8 h-8 text-primary" />
                </div>
                <h3 className="card-title">Work Events</h3>
                <p className="text-base-content/70">
                  Sign up to work at pub and club events. First-come, first-served!
                </p>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl">
              <div className="card-body items-center text-center">
                <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                  <MapPin className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="card-title">Manage Guest Lists</h3>
                <p className="text-base-content/70">
                  Add guests to events and keep track of who&apos;s coming.
                </p>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl">
              <div className="card-body items-center text-center">
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                  <Trophy className="w-8 h-8 text-accent" />
                </div>
                <h3 className="card-title">Earn Points</h3>
                <p className="text-base-content/70">
                  Climb the scoreboard by working events and earning recognition.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="py-20 px-4 bg-base-100">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Upcoming Events</h2>
            <Link to="/events" className="btn btn-ghost btn-sm">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="text-center py-12 text-base-content/60">
              <p>No upcoming events at the moment.</p>
              <p className="text-sm mt-2">Check back soon for new events!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((event) => (
                <Link
                  key={event.id}
                  to={`/events/${event.id}`}
                  className="card bg-base-200 hover:bg-base-300 transition-colors"
                >
                  <div className="card-body">
                    <h3 className="card-title">{event.title}</h3>
                    <div className="space-y-2 text-sm text-base-content/70 mt-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {event.timeDisplay}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {event.location?.name}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {event.responsibleCount}/{event.maxResponsible} responsible, {event.workerCount}/{event.maxWorkers} workers
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
