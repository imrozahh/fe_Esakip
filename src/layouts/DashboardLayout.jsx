import { Outlet } from "react-router-dom";
import Sidebar from "../component/sidebar";
import Navbar from "../component/Navbar";

function DashboardLayout() {
  return (
    <div className="min-h-screen bg-slate-50">

      <Sidebar />

      <div className="ml-[260px] min-h-screen w-[calc(100%-260px)]">

        <Navbar />

        <main className="w-full overflow-x-auto">
          <Outlet />
        </main>

      </div>

    </div>
  );
}

export default DashboardLayout;