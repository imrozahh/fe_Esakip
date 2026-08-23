import { NavLink } from "react-router-dom";

function Sidebar() {

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
      path: "/capaian-kerja",
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
          <h1 className="text-xl font-bold text-white">
            E-SAKIP
          </h1>

          <p className="text-xs text-[#a7c8ff]">
            DISKOMINFO KAB. MALANG
          </p>
        </div>

      </div>

      {/* Menu */}
      <nav className="flex-1 flex flex-col gap-1">

        {menu.map((item) => (
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

            <span className="material-symbols-outlined">
              {item.icon}
            </span>

            {item.name}

          </NavLink>
        ))}

      </nav>

      {/* Logout */}
      <div className="border-t border-[#003366] pt-4">

        <NavLink
          to="/login"
          className="flex items-center gap-3 px-3 py-2.5 rounded text-sm font-semibold text-[#d5e3ff] hover:bg-[#003366]/70 hover:text-white transition-colors"
        >

          <span className="material-symbols-outlined">
            logout
          </span>

          Logout

        </NavLink>

      </div>

    </aside>
  );
}

export default Sidebar;