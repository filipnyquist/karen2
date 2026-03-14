import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { eden } from "../eden";
import { MapPin, Users, Calendar, ArrowLeft, AlertCircle } from "lucide-react";

interface Location {
  id: string;
  name: string;
  description?: string;
  address?: string;
  capacity?: number;
  picture?: string;
  createdAt: string;
}

interface Event {
  id: string;
  title: string;
  type: string;
  startTime: string;
  endTime: string;
  timeDisplay?: string;
  status: string;
  workerCount: number;
  maxWorkers: number;
}

export function LocationDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [location, setLocation] = useState<Location | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLocation();
  }, [id]);

  async function fetchLocation() {
    if (!id) return;
    setIsLoading(true);
    const { data, error: apiError } = await eden.locations[id].get();
    if (apiError) {
      setError("Failed to load location");
    } else if (data) {
      setLocation(data.location as Location);
      setUpcomingEvents(data.upcomingEvents || []);
    }
    setIsLoading(false);
  }

  function formatEventTime(startTime: string, endTime: string): string {
    const start = new Date(startTime);
    const end = new Date(endTime);

    const isOvernight = start.getDate() !== end.getDate();

    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const startDay = days[start.getDay()];
    const endDay = days[end.getDay()];

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString("sv-SE", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    };

    if (isOvernight) {
      return `${startDay} ${formatTime(start)} - ${endDay} ${formatTime(end)}`;
    }
    return `${startDay} ${formatTime(start)} - ${formatTime(end)}`;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-error" />
          <h2 className="text-xl font-semibold mb-2">Location not found</h2>
          <Link to="/locations" className="btn btn-primary">
            <ArrowLeft className="w-4 h-4" />
            Back to Locations
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back link */}
      <Link to="/locations" className="btn btn-ghost btn-sm mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Locations
      </Link>

      {/* Location Header */}
      <div className="card bg-base-100 shadow-xl mb-8">
        <div className="card-body">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-10 h-10 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                {location.name}
              </h1>

              {location.address && (
                <p className="text-base-content/70 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {location.address}
                </p>
              )}

              {location.description && (
                <p className="text-base-content/70 mb-4">
                  {location.description}
                </p>
              )}

              {location.capacity && (
                <div className="badge badge-outline">
                  <Users className="w-4 h-4 mr-1" />
                  Capacity: {location.capacity}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-6">
            <Calendar className="w-6 h-6" />
            Upcoming Events
          </h2>

          {upcomingEvents.length === 0 ? (
            <div className="text-center py-12 text-base-content/60">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No upcoming events at this location</p>
              <p className="text-sm mt-2">Check back later for new events!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <Link
                  key={event.id}
                  to={`/events/${event.id}`}
                  className="flex items-center justify-between p-4 bg-base-200 rounded-lg hover:bg-base-300 transition-colors"
                >
                  <div>
                    <h3 className="font-semibold">{event.title}</h3>
                    <p className="text-sm text-base-content/70">
                      {event.timeDisplay ||
                        formatEventTime(event.startTime, event.endTime)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-base-content/70">Workers</div>
                    <div className="font-semibold">
                      {event.workerCount}/{event.maxWorkers}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
