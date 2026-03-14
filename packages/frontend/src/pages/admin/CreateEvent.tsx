import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { eden } from "../../eden";
import {
  Calendar,
  ChevronLeft,
  AlertCircle,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface Location {
  id: string;
  name: string;
}

export function CreateEvent() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [locations, setLocations] = useState<Location[]>([]);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"event" | "private_event">("event");
  const [notice, setNotice] = useState("");
  const [locationId, setLocationId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [minResponsible, setMinResponsible] = useState(1);
  const [maxResponsible, setMaxResponsible] = useState(2);
  const [minWorkers, setMinWorkers] = useState(2);
  const [maxWorkers, setMaxWorkers] = useState(10);
  const [maxGuests, setMaxGuests] = useState(0);
  const [maxGuestsPerPerson, setMaxGuestsPerPerson] = useState<number | null>(null);
  const [givesPoints, setGivesPoints] = useState(true);

  useEffect(() => {
    fetchLocations();
  }, []);

  async function fetchLocations() {
    const { data } = await eden.locations.get();
    if (data?.locations) {
      setLocations(data.locations);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const payload = {
      title,
      description: description || undefined,
      type,
      notice: notice || undefined,
      locationId,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      minResponsible,
      maxResponsible,
      minWorkers,
      maxWorkers,
      maxGuests,
      maxGuestsPerPerson: maxGuestsPerPerson || undefined,
      givesPoints,
    };

    const { error: apiError } = await eden.events.post(payload);

    setIsLoading(false);

    if (apiError) {
      setError("Failed to create event. Please check your inputs and try again.");
      return;
    }

    navigate("/admin/events");
  }

  function handleCancel() {
    navigate("/admin/events");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={handleCancel} className="btn btn-ghost btn-sm">
            <ChevronLeft className="w-4 h-4" />
            Back to Events
          </button>
          <h1 className="text-3xl font-bold">Create Event</h1>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="border-b border-base-200 pb-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Basic Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text">Title *</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Event title"
                    required
                    maxLength={255}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Type *</span>
                  </label>
                  <select
                    className="select select-bordered"
                    value={type}
                    onChange={(e) => setType(e.target.value as "event" | "private_event")}
                    required
                  >
                    <option value="event">Public Event</option>
                    <option value="private_event">Private Event</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Location *</span>
                  </label>
                  <select
                    className="select select-bordered"
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                    required
                  >
                    <option value="">Select a location</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text">Description</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Event description"
                    rows={3}
                  />
                </div>

                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text">Notice</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={notice}
                    onChange={(e) => setNotice(e.target.value)}
                    placeholder="Important notice for attendees"
                  />
                </div>
              </div>
            </div>

            {/* Date and Time */}
            <div className="border-b border-base-200 pb-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Date and Time
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Start Time *</span>
                  </label>
                  <input
                    type="datetime-local"
                    className="input input-bordered"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">End Time *</span>
                  </label>
                  <input
                    type="datetime-local"
                    className="input input-bordered"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Worker Settings */}
            <div className="border-b border-base-200 pb-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Worker Settings
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Min Responsible</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered"
                    value={minResponsible}
                    onChange={(e) => setMinResponsible(parseInt(e.target.value) || 0)}
                    min={0}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Max Responsible</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered"
                    value={maxResponsible}
                    onChange={(e) => setMaxResponsible(parseInt(e.target.value) || 0)}
                    min={0}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Min Workers</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered"
                    value={minWorkers}
                    onChange={(e) => setMinWorkers(parseInt(e.target.value) || 0)}
                    min={0}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Max Workers</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered"
                    value={maxWorkers}
                    onChange={(e) => setMaxWorkers(parseInt(e.target.value) || 0)}
                    min={0}
                  />
                </div>
              </div>
            </div>

            {/* Guest Settings */}
            <div className="border-b border-base-200 pb-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Guest Settings
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Max Guests</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered"
                    value={maxGuests}
                    onChange={(e) => setMaxGuests(parseInt(e.target.value) || 0)}
                    min={0}
                  />
                  <label className="label">
                    <span className="label-text-alt">Maximum total guests allowed</span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Max Guests Per Person</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered"
                    value={maxGuestsPerPerson ?? ""}
                    onChange={(e) =>
                      setMaxGuestsPerPerson(e.target.value ? parseInt(e.target.value) : null)
                    }
                    min={0}
                    placeholder="Unlimited"
                  />
                  <label className="label">
                    <span className="label-text-alt">Max guests each worker can bring</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Points Settings */}
            <div className="pb-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Points Settings
              </h2>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    checked={givesPoints}
                    onChange={(e) => setGivesPoints(e.target.checked)}
                  />
                  <span className="label-text">This event gives points to workers</span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-4 border-t border-base-200">
              <button type="button" className="btn btn-ghost" onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Creating...
                  </>
                ) : (
                  "Create Event"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
