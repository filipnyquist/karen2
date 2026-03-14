import { useAuth } from "../contexts/AuthContext";
import { Calendar, Users, Award } from "lucide-react";

export function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Welcome, {user?.name}!</h1>
      <p className="text-base-content/70 mb-8">
        Here's what's happening with your events
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="stat bg-base-100 shadow rounded-box">
          <div className="stat-figure text-primary">
            <Calendar className="w-8 h-8" />
          </div>
          <div className="stat-title">Upcoming Events</div>
          <div className="stat-value">0</div>
          <div className="stat-desc">You're signed up for</div>
        </div>

        <div className="stat bg-base-100 shadow rounded-box">
          <div className="stat-figure text-secondary">
            <Users className="w-8 h-8" />
          </div>
          <div className="stat-title">Guests</div>
          <div className="stat-value">0</div>
          <div className="stat-desc">On your guest lists</div>
        </div>

        <div className="stat bg-base-100 shadow rounded-box">
          <div className="stat-figure text-accent">
            <Award className="w-8 h-8" />
          </div>
          <div className="stat-title">Points</div>
          <div className="stat-value">0</div>
          <div className="stat-desc">Events worked this semester</div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Your Upcoming Events</h2>
          <div className="py-8 text-center text-base-content/60">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No upcoming events</p>
            <p className="text-sm mt-2">
              Browse events to find ones you want to work
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
