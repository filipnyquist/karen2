import { Trophy, Medal } from "lucide-react";

export function Scoreboard() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <Trophy className="w-12 h-12 mx-auto mb-4 text-accent" />
        <h1 className="text-3xl font-bold">Scoreboard</h1>
        <p className="text-base-content/70">
          Top contributors this semester
        </p>
      </div>

      <div className="card bg-base-100 shadow-xl max-w-2xl mx-auto">
        <div className="card-body">
          <div className="flex justify-center gap-4 mb-6">
            <button className="btn btn-primary btn-sm">This Semester</button>
            <button className="btn btn-ghost btn-sm">All Time</button>
          </div>

          <div className="text-center py-12 text-base-content/60">
            <Medal className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No scores yet</p>
            <p className="text-sm mt-2">
              Be the first to work an event and appear here!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
