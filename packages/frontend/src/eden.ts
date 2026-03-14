import { treaty } from "@elysiajs/eden";

// Define a generic API client type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EdenClient = any;

// Use explicit type annotation to prevent inference issues
export const eden: EdenClient = treaty("http://localhost:3000", {
  fetch: {
    credentials: "include",
  },
  headers() {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
});
