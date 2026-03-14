import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { eden } from "../eden";
import { useAuth } from "../contexts/AuthContext";
import { MapPin, Users, AlertCircle } from "lucide-react";

interface Location {
  id: string;
  name: string;
  description?: string;
  address?: string;
  capacity?: number;
  picture?: string;
}

export function Locations() {
  const { user } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLocations();
  }, []);

  async function fetchLocations() {
    setIsLoading(true);
    const { data, error: apiError } = await eden.locations.get();
    if (apiError) {
      setError("Failed to load locations");
    } else if (data) {
      setLocations(data.locations || []);
    }
    setIsLoading(false);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Locations</h1>
          <p className="text-base-content/70">
            Event venues and locations
          </p>
        </div>
        {(user?.role === "admin" || user?.role === "superadmin") && (
          <Link to="/admin/locations" className="btn btn-primary">
            Manage Locations
          </Link>
        )}
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {locations.length === 0 ? (
        <div className="text-center py-16">
          <MapPin className="w-16 h-16 mx-auto mb-4 text-base-content/30" />
          <h2 className="text-xl font-semibold mb-2">No locations yet</h2>
          <p className="text-base-content/60">
            Locations will be added by administrators
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((location) => (
            <Link
              key={location.id}
              to={`/locations/${location.id}`}
              className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="card-title text-xl">{location.name}</h2>
                    {location.address && (
                      <p className="text-sm text-base-content/70 mt-1 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {location.address}
                      </p>
                    )}
                  </div>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                </div>

                {location.description && (
                  <p className="text-base-content/70 mt-4 line-clamp-2">
                    {location.description}
                  </p>
                )}

                {location.capacity && (
                  <div className="flex items-center gap-2 mt-4 text-sm text-base-content/70">
                    <Users className="w-4 h-4" />
                    Capacity: {location.capacity}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
