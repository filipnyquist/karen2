import { Link } from "react-router-dom";
import { Calendar, MapPin, Trophy, ArrowRight } from "lucide-react";

export function Home() {
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
                  Add guests to events and keep track of who's coming.
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
          <div className="text-center py-12 text-base-content/60">
            <p>No upcoming events at the moment.</p>
            <p className="text-sm mt-2">Check back soon for new events!</p>
          </div>
        </div>
      </section>
    </div>
  );
}
