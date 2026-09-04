import { useEffect, useMemo, useRef, useState } from "react";

/* =========================================================
   KONFIGURASI API
   Sesuaikan base URL ini kalau backend Laravel-mu jalan di
   alamat lain (misal domain Laragon virtual host).
========================================================= */

const API_BASE_URL = "http://localhost:8000";
const AUTO_REFRESH_INTERVAL_MS = 20000;

/* =========================================================
   HELPER: hitung milidetik sampai tengah malam berikutnya
========================================================= */

function millisUntilNextMidnight() {
  const now = new Date();
  const nextMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    5 // buffer 5 detik biar aman lewat tengah malam
  );
  return nextMidnight.getTime() - now.getTime();
}

/* =========================================================
   HELPER: format waktu relatif ("2 jam yang lalu", dst)
========================================================= */

function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60000);

  if (diffMinutes < 1) return "Baru saja";
  if (diffMinutes < 60) return `${diffMinutes} menit yang lalu`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} jam yang lalu`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Kemarin";
  if (diffDays < 7) return `${diffDays} hari yang lalu`;

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* =========================================================
   METADATA TAMPILAN PER LEVEL NODE
========================================================= */

const LEVEL_META = {
  ULTIMATE: { label: "Ultimate Outcome", icon: "flag", bg: "bg-[#D5E3FF]", color: "text-[#001E40]" },
  INTERMEDIATE: { label: "Intermediate Outcome", icon: "alt_route", bg: "bg-[#DDE1FF]", color: "text-[#173BAB]" },
  IMMEDIATE: { label: "Immediate Outcome", icon: "hub", bg: "bg-[#DCE9FF]", color: "text-[#43474F]" },
  OUTPUT: { label: "Output", icon: "account_tree", bg: "bg-[#D5E3FF]", color: "text-[#001E40]" },
};

export default function Dashboard() {
  const [search, setSearch] = useState("");

  /* =======================================================
     TAHUN AKTIF — otomatis dihitung ulang tiap tengah malam
  ======================================================= */

  const [activeYear, setActiveYear] = useState(() => new Date().getFullYear());
  const midnightTimerRef = useRef(null);

  useEffect(() => {
    function scheduleMidnightCheck() {
      midnightTimerRef.current = setTimeout(() => {
        setActiveYear(new Date().getFullYear());
        scheduleMidnightCheck(); // jadwalkan lagi buat tengah malam berikutnya
      }, millisUntilNextMidnight());
    }

    scheduleMidnightCheck();

    return () => {
      if (midnightTimerRef.current) {
        clearTimeout(midnightTimerRef.current);
      }
    };
  }, []);

  /* =======================================================
     RINGKASAN POHON KINERJA — ambil dari backend, ikut
     activeYear. Refetch otomatis begitu activeYear berubah
     (termasuk saat tengah malam ganti tahun).
  ======================================================= */

  const [summary, setSummary] = useState(null);
  const [summaryStatus, setSummaryStatus] = useState("loading"); // loading | success | error

  useEffect(() => {
    let cancelled = false;

    async function fetchSummary() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/pohon-kinerja/summary?tahun=${activeYear}`
        );

        if (!response.ok) {
          throw new Error(`Request gagal dengan status ${response.status}`);
        }

        const json = await response.json();

        if (!cancelled) {
          setSummary(json.data);
          setSummaryStatus("success");
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Gagal mengambil ringkasan pohon kinerja:", error);
          setSummaryStatus("error");
        }
      }
    }

    setSummaryStatus("loading");
    fetchSummary();

    const intervalId = setInterval(fetchSummary, AUTO_REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [activeYear]);

  /* =======================================================
     DIAGRAM POHON KINERJA — struktur tree ringkas, ikut
     activeYear, auto-refresh sama seperti bagian lain.
  ======================================================= */

  const [tree, setTree] = useState(null);
  const [treeStatus, setTreeStatus] = useState("loading"); // loading | success | empty | error

  useEffect(() => {
    let cancelled = false;

    async function fetchTree() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/pohon-kinerja/tree?tahun=${activeYear}`
        );

        if (response.status === 404) {
          if (!cancelled) {
            setTree(null);
            setTreeStatus("empty");
          }
          return;
        }

        if (!response.ok) {
          throw new Error(`Request gagal dengan status ${response.status}`);
        }

        const json = await response.json();

        if (!cancelled) {
          setTree(json.data?.tree ?? null);
          setTreeStatus("success");
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Gagal mengambil diagram pohon kinerja:", error);
          setTreeStatus("error");
        }
      }
    }

    setTreeStatus("loading");
    fetchTree();

    const intervalId = setInterval(fetchTree, AUTO_REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [activeYear]);

  /* =======================================================
     AKTIVITAS TERBARU — node yang paling baru diubah,
     ikut activeYear juga, auto-refresh sama seperti summary.
  ======================================================= */

  const [activities, setActivities] = useState([]);
  const [activitiesStatus, setActivitiesStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;

    async function fetchActivities() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/pohon-kinerja/recent-activity?tahun=${activeYear}&limit=2`
        );

        if (!response.ok) {
          throw new Error(`Request gagal dengan status ${response.status}`);
        }

        const json = await response.json();

        if (!cancelled) {
          setActivities(json.data ?? []);
          setActivitiesStatus("success");
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Gagal mengambil aktivitas terbaru:", error);
          setActivitiesStatus("error");
        }
      }
    }

    setActivitiesStatus("loading");
    fetchActivities();

    const intervalId = setInterval(fetchActivities, AUTO_REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [activeYear]);

  /* =======================================================
     STAT CARDS — Ultimate, Intermediate, Immediate, Output
  ======================================================= */

  const stats = useMemo(() => {
    const formatValue = (value) => {
      if (summaryStatus === "loading") return "...";
      if (summaryStatus === "error") return "-";
      return String(value ?? 0);
    };

    return [
      {
        title: "Jumlah Ultimate Outcome",
        value: formatValue(summary?.ultimate),
        icon: "flag",
      },
      {
        title: "Jumlah Intermediate Outcome",
        value: formatValue(summary?.intermediate),
        icon: "alt_route",
      },
      {
        title: "Jumlah Immediate Outcome",
        value: formatValue(summary?.immediate),
        icon: "hub",
      },
      {
        title: "Jumlah Output",
        value: formatValue(summary?.output),
        icon: "account_tree",
      },
    ];
  }, [summary, summaryStatus]);

  return (
    <div className="w-full bg-[#F8FAFC]">
      {/* =====================================================
          DASHBOARD CONTENT
      ====================================================== */}

      <main className="p-4 md:p-8 flex flex-col gap-6">
        {/* ================= WELCOME ================= */}
        <section className="relative overflow-hidden bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm">
          <div className="absolute right-0 top-0 w-64 h-full opacity-10 bg-gradient-to-l from-[#001E40] to-transparent pointer-events-none" />

          <div className="relative z-10">
            <h1 className="text-2xl font-semibold text-[#001E40] mb-2">
              Selamat Datang, Admin
            </h1>

            <p className="text-sm md:text-base text-[#43474F] max-w-3xl leading-6">
              Kelola dan pantau kinerja instansi melalui E-SAKIP
              KOMINFO. Sistem ini dirancang untuk memastikan
              akuntabilitas dan transparansi dalam pencapaian target
              strategis.
            </p>
          </div>
        </section>

        {/* ================= STATISTICS ================= */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-[#43474F]">
              Pohon Kinerja tahun{" "}
              <span className="font-semibold text-[#001E40]">
                {activeYear}
              </span>
            </p>

            {summaryStatus === "error" && (
              <p className="text-xs text-[#93000A]">
                Gagal memuat data pohon kinerja.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.title}
                className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm"
              >
                <div className="w-10 h-10 rounded flex items-center justify-center bg-[#D5E3FF] text-[#1F477B]">
                  <span className="material-symbols-outlined">
                    {stat.icon}
                  </span>
                </div>

                <div className="mt-4">
                  <p className="text-sm text-[#43474F] mb-1">
                    {stat.title}
                  </p>

                  <h2 className="text-3xl font-bold text-[#0B1C30]">
                    {stat.value}
                  </h2>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================= DIAGRAM + RIGHT ================= */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ================= DIAGRAM POHON KINERJA ================= */}
          <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-xl shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-[#E2E8F0]">
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-[#0B1C30]">
                  Diagram Pohon Kinerja
                </h2>
                <p className="text-xs text-[#737780] mt-0.5">
                  Struktur cascading tahun {activeYear}
                </p>
              </div>
            </div>

            <div className="p-5 md:p-8 overflow-x-auto">
              {treeStatus === "loading" && (
                <p className="text-sm text-[#737780] text-center py-10">
                  Memuat diagram...
                </p>
              )}

              {treeStatus === "error" && (
                <p className="text-sm text-[#93000A] text-center py-10">
                  Gagal memuat diagram pohon kinerja.
                </p>
              )}

              {treeStatus === "empty" && (
                <p className="text-sm text-[#737780] text-center py-10">
                  Belum ada data pohon kinerja untuk tahun {activeYear}.
                </p>
              )}

              {treeStatus === "success" && tree && (
                <div className="flex flex-col items-center min-w-max px-4">
                  {/* ROOT: Ultimate Outcome */}
                  <div className="rounded-lg border-2 border-[#001E40] bg-[#001E40] px-4 py-2.5 text-center max-w-[240px] shadow-sm">
                    <p className="text-[9px] uppercase tracking-wide text-white/70">
                      Ultimate Outcome
                    </p>
                    <p className="text-sm font-semibold text-white line-clamp-2">
                      {tree.title}
                    </p>
                  </div>

                  {tree.branches && tree.branches.length > 0 && (
                    <>
                      {/* garis turun dari root */}
                      <div className="w-px h-5 bg-[#C3C6D1]" />

                      <div className="relative flex justify-center gap-5 flex-wrap">
                        {/* garis horizontal penghubung, cuma kalau cabangnya lebih dari 1 */}
                        {tree.branches.length > 1 && (
                          <div className="absolute left-6 right-6 top-0 h-px bg-[#C3C6D1]" />
                        )}

                        {tree.branches.map((intermediate) => {
                          const immediateChildren = intermediate.children ?? [];
                          const totalImmediate = immediateChildren.length;
                          const totalOutput = immediateChildren.reduce(
                            (sum, immediate) =>
                              sum + (immediate.children?.length ?? 0),
                            0
                          );

                          return (
                            <div
                              key={intermediate.id}
                              className="flex flex-col items-center pt-5"
                            >
                              <div className="w-px h-5 bg-[#C3C6D1] -mt-5 mb-0" />

                              <div className="rounded-lg border border-[#173BAB] bg-[#DDE1FF] px-3 py-2 text-center w-[160px]">
                                <p className="text-[9px] uppercase tracking-wide text-[#173BAB]">
                                  Intermediate
                                </p>
                                <p className="text-xs font-medium text-[#0B1C30] line-clamp-2">
                                  {intermediate.title}
                                </p>
                                <p className="text-[10px] text-[#43474F] mt-1">
                                  {totalImmediate} Immediate · {totalOutput} Output
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ================= RIGHT COLUMN ================= */}
          <div className="flex flex-col gap-6">
            {/* Aksi Cepat */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm">
              <h2 className="text-lg md:text-xl font-semibold text-[#0B1C30] mb-4">
                Aksi Cepat
              </h2>

              <div className="grid grid-cols-2 gap-2">
                {/* NOTE: sesuaikan href di bawah ini dengan path routing
                    beneran di project React kamu */}
                <a
                  href="/pohon-kinerja"
                  className="flex flex-col items-center justify-center p-4 border border-[#E2E8F0] rounded hover:bg-[#D3E4FE] hover:border-[#001E40] transition group"
                >
                  <span className="material-symbols-outlined text-[#001E40] mb-1 group-hover:scale-110 transition">
                    account_tree
                  </span>
                  <span className="text-xs text-[#43474F] text-center">
                    Lihat Pohon Kinerja
                  </span>
                </a>

                <a
                  href="/pohon-kinerja/arsip"
                  className="flex flex-col items-center justify-center p-4 border border-[#E2E8F0] rounded hover:bg-[#D3E4FE] hover:border-[#001E40] transition group"
                >
                  <span className="material-symbols-outlined text-[#001E40] mb-1 group-hover:scale-110 transition">
                    archive
                  </span>
                  <span className="text-xs text-[#43474F] text-center">
                    Lihat Arsip
                  </span>
                </a>
              </div>
            </div>

            {/* Aktivitas Terbaru */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl flex flex-col shadow-sm">
              <div className="p-4 border-b border-[#E2E8F0]">
                <h2 className="text-lg md:text-xl font-semibold text-[#0B1C30]">
                  Aktivitas Terbaru
                </h2>
              </div>

              <div className="p-4 flex flex-col gap-4">
                {activitiesStatus === "loading" && (
                  <p className="text-sm text-[#737780] text-center py-4">
                    Memuat aktivitas...
                  </p>
                )}

                {activitiesStatus === "error" && (
                  <p className="text-sm text-[#93000A] text-center py-4">
                    Gagal memuat aktivitas terbaru.
                  </p>
                )}

                {activitiesStatus === "success" && activities.length === 0 && (
                  <p className="text-sm text-[#737780] text-center py-4">
                    Belum ada aktivitas untuk tahun {activeYear}.
                  </p>
                )}

                {activitiesStatus === "success" &&
                  activities.map((activity, index) => {
                    const meta = LEVEL_META[activity.level] ?? LEVEL_META.OUTPUT;

                    return (
                      <div
                        key={`${activity.level}-${index}`}
                        className="flex gap-3 items-start relative"
                      >
                        {index !== activities.length - 1 && (
                          <div className="absolute left-4 top-8 bottom-[-16px] w-px bg-[#E2E8F0]" />
                        )}

                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 border-2 border-white ${meta.bg} ${meta.color}`}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {meta.icon}
                          </span>
                        </div>

                        <div>
                          <p className="text-sm text-[#0B1C30] leading-5">
                            <span className="text-xs text-[#737780]">
                              {meta.label}
                            </span>
                            <br />
                            <span className="font-medium">
                              {activity.title || "(tanpa judul)"}
                            </span>
                          </p>

                          <p className="text-xs text-[#737780] mt-1">
                            {formatRelativeTime(activity.updated_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="bg-[#EFF4FF] border-t border-[#C3C6D1] py-4">
        <div className="flex flex-col items-center gap-2">
          <div className="flex gap-6">
            <button className="text-sm text-[#5D5F5F] hover:underline">
              Privacy Policy
            </button>

            <button className="text-sm text-[#5D5F5F] hover:underline">
              Terms of Service
            </button>
          </div>

          <p className="text-sm font-semibold text-[#001E40]">
            © 2026 KOMINFO
          </p>
        </div>
      </footer>
    </div>
  );
}