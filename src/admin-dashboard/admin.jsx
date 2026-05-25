import Dashboard from "./components/Dashboard";
import UsersByCountry from "./components/UsersByCountry";

export default function Admin() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        Admin Dashboard
      </h1>

      <Dashboard />

      <div className="mt-10">
        <UsersByCountry />
      </div>
    </div>
  );
}