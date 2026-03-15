import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { eden } from "../../eden";
import { DateTimePicker } from "../../components/DateTimePicker";
import {
  Calendar,
  ChevronLeft,
  AlertCircle,
  Clock,
  MapPin,
  Users,
  CheckCircle,
} from "lucide-react";

interface Location {
  id: string;
  name: string;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  type: "event" | "private_event";
  notice: string | null;
  location: Location;
  startTime: string;
  endTime: string;
  status: "open" | "booked" | "canceled";
  minResponsible: number;
  maxResponsible: number;
  minWorkers: number;
  maxWorkers: number;
  maxGuests: number;
  maxGuestsPerPerson: number | null;
  givesPoints: boolean;
}

export function EditEvent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(["events", "admin"]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState("");
  const [locations, setLocations] = useState<Location[]>([]);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"event" | "private_event">("event");
  const [notice, setNotice] = useState("");
  const [locationId, setLocationId] = useState("");
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [status, setStatus] = useState<"open" | "booked" | "canceled">("open");
  const [minResponsible, setMinResponsible] = useState(1);
  const [maxResponsible, setMaxResponsible] = useState(2);
  const [minWorkers, setMinWorkers] = useState(2);
  const [maxWorkers, setMaxWorkers] = useState(10);
  const [maxGuests, setMaxGuests] = useState(0);
  const [maxGuestsPerPerson, setMaxGuestsPerPerson] = useState<number | null>(null);
  const [givesPoints, setGivesPoints] = useState(true);

  useEffect(() => {
    fetchLocations();
    if (id) {
      fetchEvent();
    }
  }, [id]);

  async function fetchLocations() {
    const { data } = await eden.locations.get();
    if (data?.locations) {
      setLocations(data.locations);
    }
  }

  async function fetchEvent() {
    setIsFetching(true);
    const { data, error: apiError } = await eden.events[id!].get();

    if (apiError || !data) {
      setError("Failed to load event data");
      setIsFetching(false);
      return;
    }

    const event = (data as { event: Event }).event;

    setTitle(event.title);
    setDescription(event.description || "");
    setType(event.type);
    setNotice(event.notice || "");
    setLocationId(event.location.id);
    // Convert ISO strings to Date objects
    setStartTime(new Date(event.startTime));
    setEndTime(new Date(event.endTime));
    setStatus(event.status);
    setMinResponsible(event.minResponsible);
    setMaxResponsible(event.maxResponsible);
    setMinWorkers(event.minWorkers);
    setMaxWorkers(event.maxWorkers);
    setMaxGuests(event.maxGuests);
    setMaxGuestsPerPerson(event.maxGuestsPerPerson);
    setGivesPoints(event.givesPoints);

    setIsFetching(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const payload: Record<string, unknown> = {};

    if (title) payload.title = title;
    if (description !== undefined) payload.description = description || undefined;
    if (type) payload.type = type;
    if (notice !== undefined) payload.notice = notice || undefined;
    if (locationId) payload.locationId = locationId;
    if (startTime) payload.startTime = startTime.toISOString();
    if (endTime) payload.endTime = endTime.toISOString();
    if (status) payload.status = status;
    if (minResponsible !== undefined) payload.minResponsible = minResponsible;
    if (maxResponsible !== undefined) payload.maxResponsible = maxResponsible;
    if (minWorkers !== undefined) payload.minWorkers = minWorkers;
    if (maxWorkers !== undefined) payload.maxWorkers = maxWorkers;
    if (maxGuests !== undefined) payload.maxGuests = maxGuests;
    payload.maxGuestsPerPerson = maxGuestsPerPerson || undefined;
    if (givesPoints !== undefined) payload.givesPoints = givesPoints;

    const { error: apiError } = await eden.events[id!].put(payload);

    setIsLoading(false);

    if (apiError) {
      setError("Failed to update event. Please check your inputs and try again.");
      return;
    }

    navigate("/admin/events");
  }

  function handleCancel() {
    navigate("/admin/events");
  }

  if (isFetching) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={handleCancel} className="btn btn-ghost btn-sm">
            <ChevronLeft className="w-4 h-4" />
            Back to Events
          </button>
          <h1 className="text-3xl font-bold">Edit Event</h1>
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
                    <span className="label-text">{t("events:form.title")}</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t("events:form.title")}
                    maxLength={255}
                  />
                  <label className="label">
                    <span className="label-text-alt">{t("events:form.titleDesc")}</span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">{t("events:form.type")}</span>
                  </label>
                  <select
                    className="select select-bordered"
                    value={type}
                    onChange={(e) => setType(e.target.value as "event" | "private_event")}
                  >
                    <option value="event">Public Event</option>
                    <option value="private_event">Private Event</option>
                  </select>
                  <label className="label">
                    <span className="label-text-alt">{t("events:form.typeDesc")}</span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">{t("events:form.status")}</span>
                  </label>
                  <select
                    className="select select-bordered"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "open" | "booked" | "canceled")}
                  >
                    <option value="open">Open</option>
                    <option value="booked">Booked</option>
                    <option value="canceled">Canceled</option>
                  </select>
                  <label className="label">
                    <span className="label-text-alt">{t("events:form.statusDesc")}</span>
                  </label>
                </div>

                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text">{t("events:form.location")}</span>
                  </label>
                  <select
                    className="select select-bordered"
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                  >
                    <option value="">{t("events:form.location")}</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                  <label className="label">
                    <span className="label-text-alt">{t("events:form.locationDesc")}</span>
                  </label>
                </div>

                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text">{t("events:form.description")}</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t("events:form.description")}
                    rows={3}
                  />
                  <label className="label">
                    <span className="label-text-alt">{t("events:form.descriptionDesc")}</span>
                  </label>
                </div>

                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text">{t("events:form.notice")}</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={notice}
                    onChange={(e) => setNotice(e.target.value)}
                    placeholder={t("events:form.notice")}
                  />
                  <label className="label">
                    <span className="label-text-alt">{t("events:form.noticeDesc")}</span>
                  </label>
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
                    <span className="label-text">{t("events:form.startTime")}</span>
                  </label>
                  <DateTimePicker
                    value={startTime}
                    onChange={setStartTime}
                    placeholder={t("events:form.startTime")}
                  />
                  <label className="label">
                    <span className="label-text-alt">{t("events:form.startTimeDesc")}</span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">{t("events:form.endTime")}</span>
                  </label>
                  <DateTimePicker
                    value={endTime}
                    onChange={setEndTime}
                    placeholder={t("events:form.endTime")}
                  />
                  <label className="label">
                    <span className="label-text-alt">{t("events:form.endTimeDesc")}</span>
                  </label>
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
                    <span className="label-text">{t("events:form.minResponsible")}</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered"
                    value={minResponsible}
                    onChange={(e) => setMinResponsible(parseInt(e.target.value) || 0)}
                    min={0}
                  />
                  <label className="label">
                    <span className="label-text-alt">{t("events:form.minResponsibleDesc")}</span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">{t("events:form.maxResponsible")}</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered"
                    value={maxResponsible}
                    onChange={(e) => setMaxResponsible(parseInt(e.target.value) || 0)}
                    min={0}
                  />
                  <label className="label">
                    <span className="label-text-alt">{t("events:form.maxResponsibleDesc")}</span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">{t("events:form.minWorkers")}</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered"
                    value={minWorkers}
                    onChange={(e) => setMinWorkers(parseInt(e.target.value) || 0)}
                    min={0}
                  />
                  <label className="label">
                    <span className="label-text-alt">{t("events:form.minWorkersDesc")}</span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">{t("events:form.maxWorkers")}</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered"
                    value={maxWorkers}
                    onChange={(e) => setMaxWorkers(parseInt(e.target.value) || 0)}
                    min={0}
                  />
                  <label className="label">
                    <span className="label-text-alt">{t("events:form.maxWorkersDesc")}</span>
                  </label>
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
                    <span className="label-text">{t("events:form.maxGuests")}</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered"
                    value={maxGuests}
                    onChange={(e) => setMaxGuests(parseInt(e.target.value) || 0)}
                    min={0}
                  />
                  <label className="label">
                    <span className="label-text-alt">{t("events:form.maxGuestsDesc")}</span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">{t("events:form.maxGuestsPerPerson")}</span>
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
                    <span className="label-text-alt">{t("events:form.maxGuestsPerPersonDesc")}</span>
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
                  <span className="label-text">{t("events:form.givesPointsDesc")}</span>
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
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
