import { useAuth } from "../contexts/AuthContext";
import { User, Mail, Award, Ticket } from "lucide-react";

export function Profile() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body items-center text-center">
            <div className="w-24 h-24 rounded-full bg-primary text-primary-content flex items-center justify-center text-3xl font-bold mb-4">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="card-title text-2xl">{user?.name}</h2>
            <p className="text-base-content/70">{user?.email}</p>
            <div className="badge badge-primary mt-2">{user?.role}</div>
          </div>
        </div>

        {/* Stats */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">
                <Award className="w-5 h-5" />
                Your Stats
              </h3>
              <div className="stats stats-vertical lg:stats-horizontal shadow">
                <div className="stat">
                  <div className="stat-title">Events Worked</div>
                  <div className="stat-value">0</div>
                  <div className="stat-desc">All time</div>
                </div>
                <div className="stat">
                  <div className="stat-title">This Semester</div>
                  <div className="stat-value">0</div>
                  <div className="stat-desc">Current ranking</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Guests Signed Up</div>
                  <div className="stat-value">0</div>
                  <div className="stat-desc">Total</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">
                <Ticket className="w-5 h-5" />
                Skip Queue Tickets
              </h3>
              <div className="py-8 text-center text-base-content/60">
                <p>No active tickets</p>
                <p className="text-sm mt-2">
                  Work events to earn skip queue tickets
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
