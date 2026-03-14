import { useState } from "react";
import { eden } from "../eden";
import { Ticket, Gift, CheckCircle, AlertCircle, User } from "lucide-react";

interface TicketGeneratorProps {
  eventId: string;
  workers: Array<{
    id: string;
    user: {
      id: string;
      name: string;
      email?: string;
    };
  }>;
  canGenerate: boolean;
}

export function TicketGenerator({
  eventId,
  workers,
  canGenerate,
}: TicketGeneratorProps) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function generateTicket() {
    if (!selectedUserId) return;

    setIsGenerating(true);
    setError("");
    setSuccess(false);

    const { error: apiError } = await eden.tickets.generate.post({
      userId: selectedUserId,
      eventId,
    });

    if (apiError) {
      setError("Failed to generate ticket");
    } else {
      setSuccess(true);
      setSelectedUserId("");
    }

    setIsGenerating(false);
  }

  if (!canGenerate) {
    return null;
  }

  // Filter to show all workers (could be extended to filter out those who already have tickets)

  return (
    <div className="card bg-base-100 shadow-lg">
      <div className="card-body">
        <h3 className="card-title flex items-center gap-2">
          <Gift className="w-5 h-5" />
          Give Skip Queue Ticket
        </h3>

        {error && (
          <div className="alert alert-error">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <CheckCircle className="w-5 h-5" />
            <span>Ticket generated successfully!</span>
          </div>
        )}

        <div className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Select Worker</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="">Choose a worker...</option>
              {workers.map((worker) => (
                <option key={worker.user.id} value={worker.user.id}>
                  {worker.user.name}
                </option>
              ))}
            </select>
          </div>

          <button
            className="btn btn-primary w-full"
            onClick={generateTicket}
            disabled={!selectedUserId || isGenerating}
          >
            {isGenerating ? (
              <>
                <span className="loading loading-spinner loading-sm" />
                Generating...
              </>
            ) : (
              <>
                <Ticket className="w-4 h-4" />
                Generate Ticket
              </>
            )}
          </button>

          <p className="text-sm text-base-content/70 text-center">
            Workers can use tickets to skip the queue at future events.
          </p>
        </div>
      </div>
    </div>
  );
}
