import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  XCircle,
} from "lucide-react";

interface Location {
  id: string;
  name: string;
}

export function CreateEvent() {
  const navigate = useNavigate();
  const { t } = useTranslation(["events", "admin"]);
  const [isLoading, setIsLoading] = useState(false);
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

    if (!startTime || !endTime) {
      setError("Please select both start and end time");
      setIsLoading(false);
      return;
    }

    if (!(startTime instanceof Date) || isNaN(startTime.getTime())) {
      setError("Invalid start time");
      setIsLoading(false);
      return;
    }

    if (!(endTime instanceof Date) || isNaN(endTime.getTime())) {
      setError("Invalid end time");
      setIsLoading(false);
      return;
    }

    const payload = {
      title,
      description: description || undefined,
      type,
      notice: notice || undefined,
      locationId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
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
                    <span className="label-text">{t("events:form.title")} *</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t("events:form.title")}
                    required
                    maxLength={255}
                  />
                  <label className="label">
                    <span className="label-text-alt">{t("events:form.titleDesc")}</span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">{t("events:form.type")} *</span>
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
                  <label className="label">
                    <span className="label-text-alt">{t("events:form.typeDesc")}</span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">{t("events:form.location")} *</span>
                  </label>
                  <select
                    className="select select-bordered"
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                    required
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
                    <span className="label-text">{t("events:form.startTime")} *</span>
                  </label>
                  <DateTimePicker
                    value={startTime}
                    onChange={setStartTime}
                    placeholder={t("events:form.startTime")}
                    required
                  />
                  <label className="label">
                    <span className="label-text-alt">{t("events:form.startTimeDesc")}</span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">{t("events:form.endTime")} *</span>
                  </label>
                  <DateTimePicker
                    value={endTime}
                    onChange={setEndTime}
                    placeholder={t("events:form.endTime")}
                    required
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
