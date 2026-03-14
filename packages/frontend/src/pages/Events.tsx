import { Calendar, MapPin, Users } from "lucide-react";

export function Events() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Events</h1>
          <p className="text-base-content/70">
            Browse and sign up for upcoming events
          </p>
        </div>
      </div>

      <div className="text-center py-16">
        <Calendar className="w-16 h-16 mx-auto mb-4 text-base-content/30" />
        <h2 className="text-xl font-semibold mb-2">No events scheduled</h2>
        <p className="text-base-content/60">
          Check back soon for new events!
        </p>
      </div>
    </div>
  );
}
