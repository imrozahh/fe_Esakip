import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setShowLogoutModal(false);
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      navigate("/login", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Check if current path is under capaian sub-menu
  const isCapaianActive =
    location.pathname === "/capaian-kerja" ||
    location.pathname === "/realisasi-anggaran";

  const menu = [
    {
      name: "Dashboard",
      icon: "dashboard",
      path: "/dashboard",
    },
    {
      name: "Pohon Kinerja",
      icon: "account_tree",
      path: "/pohon-kinerja",
    },
    {
      name: "Rencana Strategi",
      icon: "strategy",
      path: "/rencana-strategi",
    },
    {
      name: "Capaian Kerja",
      icon: "assignment_turned_in",
      submenu: [
        {
          name: "Capaian Kinerja",
          icon: "trending_up",
          path: "/capaian-kerja",
        },
        {
          name: "Realisasi Anggaran",
          icon: "account_balance_wallet",
          path: "/realisasi-anggaran",
        },
      ],
    },
    {
      name: "Laporan",
      icon: "description",
      path: "/laporan",
    },
  ];

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 z-30 w-[260px] h-screen bg-[#001e40] px-4 py-6">
      {/* Logo */}
      <div className="flex items-center gap-2 px-2 mb-8">
        <span className="material-symbols-outlined text-white text-[32px]">
          shield
        </span>

        <div>
          <h1 className="text-xl font-bold text-white">E-SAKIP</h1>

          <p className="text-xs text-[#a7c8ff]">DISKOMINFO KAB. MALANG</p>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 flex flex-col gap-1">
        {menu.map((item) =>
          item.submenu ? (
            <div key={item.name}>
              {/* Parent menu item with toggle */}
              <button
                onClick={() =>
                  setOpenSubmenu(openSubmenu === item.name ? null : item.name)
                }
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded text-sm font-semibold transition-colors ${
                  isCapaianActive
                    ? "bg-[#003366] text-white border-l-4 border-[#d5e3ff]"
                    : "text-[#d5e3ff] hover:bg-[#003366]/70 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined">{item.icon}</span>
                  {item.name}
                </div>
                <span
                  className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${
                    openSubmenu === item.name || isCapaianActive
                      ? "rotate-180"
                      : ""
                  }`}
                >
                  expand_more
                </span>
              </button>

              {/* Sub-menu items */}
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  openSubmenu === item.name || isCapaianActive
                    ? "max-h-40 opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l-2 border-[#003366] pl-2">
                  {item.submenu.map((sub) => (
                    <NavLink
                      key={sub.path}
                      to={sub.path}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-2 rounded text-[13px] font-medium transition-colors
                        ${
                          isActive
                            ? "bg-[#003366]/80 text-white"
                            : "text-[#a7c8ff] hover:bg-[#003366]/50 hover:text-white"
                        }`
                      }
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {sub.icon}
                      </span>
                      {sub.name}
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded text-sm font-semibold transition-colors
              ${
                isActive
                  ? "bg-[#003366] text-white border-l-4 border-[#d5e3ff]"
                  : "text-[#d5e3ff] hover:bg-[#003366]/70 hover:text-white"
              }`
              }
            >
              <span className="material-symbols-outlined">{item.icon}</span>

              {item.name}
            </NavLink>
          )
        )}
      </nav>

      {/* Logout */}
      <div className="border-t border-[#003366] pt-4">
        <button
          type="button"
          onClick={() => setShowLogoutModal(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-semibold text-[#d5e3ff] hover:bg-red-500/20 hover:text-red-200 transition-colors text-left"
        >
          <span className="material-symbols-outlined">logout</span>
          Logout
        </button>
      </div>

      {/* Pop up Konfirmasi Logout */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-center border border-slate-100">
            {/* Icon */}
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
              <span className="material-symbols-outlined text-[32px]">logout</span>
            </div>

            {/* Title & Desc */}
            <h3 className="text-lg font-bold text-slate-900">
              Konfirmasi Logout
            </h3>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              Apakah Anda yakin ingin keluar dari sistem E-SAKIP?
            </p>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                className="flex-1 rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                disabled={isLoggingOut}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 active:bg-red-800 shadow-md hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isLoggingOut ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Keluar...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">check</span>
                    <span>Ya, Keluar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
