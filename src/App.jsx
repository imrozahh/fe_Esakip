import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PohonKinerja from "./pages/PohonKinerja";
import RencanaStrategi from "./pages/PohonRenstra";
import CapaianKerja from "./pages/CapaianKinerja";
import Laporan from "./pages/Laporan";

import DashboardLayout from "./layouts/DashboardLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* LOGIN */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        {/* SEMUA HALAMAN UTAMA */}
        <Route element={<DashboardLayout />}>

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/pohon-kinerja"
            element={<PohonKinerja />}
          />

          <Route
            path="/rencana-strategi"
            element={<RencanaStrategi />}
          />

          <Route
            path="/capaian-kerja"
            element={<CapaianKerja />}
          />

          <Route
            path="/laporan"
            element={<Laporan />}
          />

        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;