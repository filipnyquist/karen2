import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { eden } from "../../eden";
import {
  MapPin,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  AlertCircle,
  Users,
  Maximize,
} from "lucide-react";

interface Location {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  capacity: number | null;
  picture: string | null;
}

export function AdminLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [capacity, setCapacity] = useState("");

  useEffect(() => {
    fetchLocations();
  }, []);

  async function fetchLocations() {
    setIsLoading(true);
    const { data } = await eden.locations.get();
    if (data?.locations) {
      setLocations(data.locations);
    }
    setIsLoading(false);
  }

  function openModal(location?: Location) {
    if (location) {
      setEditingLocation(location);
      setName(location.name);
      setDescription(location.description || "");
      setAddress(location.address || "");
      setCapacity(location.capacity?.toString() || "");
    } else {
      setEditingLocation(null);
      setName("");
      setDescription("");
      setAddress("");
      setCapacity("");
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingLocation(null);
    setName("");
    setDescription("");
    setAddress("");
    setCapacity("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const payload = {
      name,
      description: description || undefined,
      address: address || undefined,
      capacity: capacity ? parseInt(capacity) : undefined,
    };

    if (editingLocation) {
      const { error: apiError } = await eden.locations[editingLocation.id].put(
        payload
      );
      if (apiError) {
        setError("Failed to update location");
        return;
      }
    } else {
      const { error: apiError } = await eden.locations.post(payload);
      if (apiError) {
        setError("Failed to create location");
        return;
      }
    }

    closeModal();
    fetchLocations();
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this location?")) return;

    const { error: apiError } = await eden.locations[id].delete();

    if (apiError) {
      setError("Failed to delete location");
    } else {
      fetchLocations();
    }
  }

  const filteredLocations = locations.filter(
    (loc) =>
      loc.name.toLowerCase().includes(search.toLowerCase()) ||
      loc.address?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="btn btn-ghost btn-sm">
            <ChevronLeft className="w-4 h-4" />
            Back to Admin
          </Link>
          <h1 className="text-3xl font-bold">Location Management</h1>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus className="w-4 h-4" />
          Add Location
        </button>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Search */}
      <div className="card bg-base-100 shadow-lg mb-6">
        <div className="card-body">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/50" />
            <input
              type="text"
              placeholder="Search locations..."
              className="input input-bordered w-full max-w-md pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Locations Grid */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : filteredLocations.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 mx-auto mb-4 text-base-content/30" />
              <p className="text-base-content/60">No locations found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLocations.map((location) => (
                <div
                  key={location.id}
                  className="card bg-base-200 hover:bg-base-300 transition-colors"
                >
                  <div className="card-body">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="card-title">{location.name}</h3>
                        {location.address && (
                          <p className="text-sm text-base-content/70 mt-1">
                            {location.address}
                          </p>
                        )}
                      </div>
                      <div className="dropdown dropdown-end">
                        <button className="btn btn-ghost btn-sm">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {location.description && (
                      <p className="text-sm mt-2 line-clamp-2">
                        {location.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-4 text-sm text-base-content/70">
                      {location.capacity && (
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>Capacity: {location.capacity}</span>
                        </div>
                      )}
                    </div>

                    <div className="card-actions justify-end mt-4">
                      <Link
                        to={`/locations/${location.id}`}
                        className="btn btn-sm btn-ghost"
                      >
                        View
                      </Link>
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => openModal(location)}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        className="btn btn-sm btn-ghost text-error"
                        onClick={() => handleDelete(location.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg">
            <h3 className="font-bold text-lg">
              {editingLocation ? "Edit Location" : "Add New Location"}
            </h3>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Name *</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Description</span>
                </label>
                <textarea
                  className="textarea textarea-bordered"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Address</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Capacity</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  min={0}
                />
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingLocation ? "Save Changes" : "Create Location"}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={closeModal}></div>
        </div>
      )}
    </div>
  );
}
