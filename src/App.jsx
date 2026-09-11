import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PohonKinerja from "./pages/PohonKinerja";
import RencanaStrategi from "./pages/PohonRenstra";
import CapaianKerja from "./pages/CapaianKinerja";
import Laporan from "./pages/Laporan";

import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./component/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* LOGIN */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />

          {/* SEMUA HALAMAN UTAMA (DILINDUNGI) */}
          <Route element={<ProtectedRoute />}>

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

          </Route>

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
