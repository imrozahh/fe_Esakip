import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [openSubmenu, setOpenSubmenu] = useState(null);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
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
        <NavLink
          to="/login"
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
          }}
          className="flex items-center gap-3 px-3 py-2.5 rounded text-sm font-semibold text-[#d5e3ff] hover:bg-[#003366]/70 hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined">logout</span>
          Logout
        </NavLink>
      </div>
    </aside>
  );
}

export default Sidebar;
