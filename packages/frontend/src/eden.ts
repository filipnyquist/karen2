import { treaty } from "@elysiajs/eden";

// Define a generic API client type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EdenClient = any;

// Use environment variable for API URL, fallback to current origin for Docker/proxy setups
const API_URL = import.meta.env.VITE_API_URL?.trim() ||
  `${window.location.protocol}//${window.location.host}/api`;

// Use explicit type annotation to prevent inference issues
export const eden: EdenClient = treaty(API_URL, {
  fetch: {
    credentials: "include",
  },
  headers() {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
});
