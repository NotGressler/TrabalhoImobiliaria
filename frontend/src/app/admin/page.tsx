import RequireAuth from "../../auth/RequireAuth";
import AdminDashboard from "../../components/admin/AdminDashboard";
export default function AdminPage() { return <RequireAuth role="ADMIN"><AdminDashboard /></RequireAuth>; }
