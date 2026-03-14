import { useEffect, useState } from "react";
import { eden } from "./eden";

function App() {
  const [message, setMessage] = useState<string>("Loading...");

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await eden.test.get();
      if (error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage(data);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card bg-base-100 shadow-xl p-8">
        <h1 className="text-3xl font-bold mb-4">Karen2</h1>
        <p className="text-lg">
          Backend says: <span className="font-mono text-primary">{message}</span>
        </p>
      </div>
    </div>
  );
}

export default App;
