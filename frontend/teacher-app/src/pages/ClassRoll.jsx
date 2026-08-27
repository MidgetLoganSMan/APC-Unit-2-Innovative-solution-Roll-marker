import { useEffect, useState, useContext } from "react";
import AuthContext from "../context/AuthContext";

export default function ClassRoll() {
  const token = useContext(AuthContext);
  const [roll, setRoll] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRoll = async () => {
      const res = await fetch("http://localhost:3000/api/roll/1", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      setRoll(data);
      setLoading(false);
    };

    loadRoll();
  }, [token]);

  if (loading) return <p>Loading roll...</p>;

  return (
    <div>
      <h2>Class Roll</h2>

      {roll.length === 0 && <p>No roll entries found.</p>}

      {roll.map(entry => (
        <div key={entry.id} style={{ marginBottom: "10px" }}>
          <strong>Student ID:</strong> {entry.studentId} <br />
          <strong>Status:</strong> {entry.status} <br />
          <strong>Time:</strong> {new Date(entry.timestamp).toLocaleTimeString()}
        </div>
      ))}
    </div>
  );
}
