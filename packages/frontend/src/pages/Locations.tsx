import { MapPin } from "lucide-react";

export function Locations() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Locations</h1>
      <p className="text-base-content/70 mb-8">
        Event venues and locations
      </p>

      <div className="text-center py-16">
        <MapPin className="w-16 h-16 mx-auto mb-4 text-base-content/30" />
        <h2 className="text-xl font-semibold mb-2">No locations yet</h2>
        <p className="text-base-content/60">
          Locations will be added by administrators
        </p>
      </div>
    </div>
  );
}
