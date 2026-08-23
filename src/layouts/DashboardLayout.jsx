import { Outlet } from "react-router-dom";
import Sidebar from "../component/sidebar";
import Navbar from "../component/Navbar";

function DashboardLayout() {
  return (
    <div className="min-h-screen bg-slate-50">

      {/* Sidebar */}
      <Sidebar />

      {/* Area kanan */}
      <div className="ml-[260px] min-h-screen">

        {/* Navbar */}
        <Navbar />

        {/* Isi halaman */}
        <main>
          <Outlet />
        </main>

      </div>

    </div>
  );
}

export default DashboardLayout;