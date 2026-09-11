import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-outline-variant shadow-sm sticky top-0 z-20 flex items-center justify-between px-4 md:px-8">

      {/* Breadcrumb */}
      <div className="hidden sm:flex items-center gap-2 text-sm text-on-surface-variant">

        <span className="material-symbols-outlined text-[18px]">
          home
        </span>

        <span>/</span>

        <span className="text-primary font-bold">
          Dashboard
        </span>

      </div>

      {/* Right */}
      <div className="flex items-center gap-4 ml-auto">

        {/* Search */}
        <div className="relative hidden lg:block w-64">

          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>

          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 rounded-full border border-outline-variant bg-surface-container-low text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />

        </div>

        {/* Notification */}
        <button className="relative p-2 rounded-full hover:bg-surface-container-low transition-colors">

          <span className="material-symbols-outlined text-on-surface-variant">
            notifications
          </span>

          <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />

        </button>

        {/* Admin */}
        <div className="flex items-center gap-2">

          <div className="w-9 h-9 rounded-full bg-surface-tint flex items-center justify-center text-white font-semibold">
            A
          </div>

          <div className="hidden md:block">

            <p className="text-xs font-bold text-primary">
              {user?.name || "Admin"}
            </p>

          </div>

          <span className="material-symbols-outlined text-on-surface-variant">
            expand_more
          </span>

        </div>

      </div>

    </header>
  );
}

export default Navbar;
