function Dashboard() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* =========================
          MAIN CONTENT
      ========================== */}
      <main className="p-4 md:p-6 lg:p-8 flex flex-col gap-6">

        {/* =========================
            WELCOME BANNER
        ========================== */}
        <section
          className="bg-gradient-to-r from-[#eaf3ff] via-white to-white border border-[#b9d3f5] rounded-xl p-6 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 relative overflow-hidden"
          style={{
            boxShadow:
              "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
          }}
        >
          <div className="absolute right-0 top-0 w-64 h-full opacity-20 bg-gradient-to-l from-[#2f6fb3] to-transparent pointer-events-none" />

          <div className="relative z-10">
            <h2 className="text-2xl font-semibold text-[#001e40] mb-2">
              Selamat Datang, Admin
            </h2>

            <p className="text-sm md:text-base text-[#334155] max-w-2xl leading-6">
              Kelola dan pantau kinerja instansi melalui E-SAKIP KOMINFO.
              Sistem ini dirancang untuk memastikan akuntabilitas dan
              transparansi dalam pencapaian target strategis.
            </p>
          </div>

          
        </section>

        {/* =========================
            STATISTICS
        ========================== */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Total Pohon Kinerja */}
          <div className="bg-white border border-[#E2E8F0] border-t-4 border-t-[#2f6fb3] rounded-xl p-5 shadow-sm">

            <div className="flex justify-between items-start mb-4">

              <div className="w-10 h-10 rounded-lg bg-[#d5e3ff] flex items-center justify-center text-[#001e40]">
                <span className="material-symbols-outlined">
                  account_tree
                </span>
              </div>

              <span className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded text-xs font-semibold">
                <span className="material-symbols-outlined text-[14px]">
                  trending_up
                </span>
                12%
              </span>

            </div>

            <p className="text-sm text-[#475569] mb-1">
              Total Pohon Kinerja
            </p>

            <h3 className="text-3xl font-bold text-[#0b1c30]">
              142
            </h3>

          </div>

          {/* Total Rencana Strategi */}
          <div className="bg-white border border-[#E2E8F0] border-t-4 border-t-[#4d88c7] rounded-xl p-5 shadow-sm">

            <div className="flex justify-between items-start mb-4">

              <div className="w-10 h-10 rounded-lg bg-[#dde1ff] flex items-center justify-center text-[#001659]">
                <span className="material-symbols-outlined">
                  strategy
                </span>
              </div>

              <span className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded text-xs font-semibold">
                <span className="material-symbols-outlined text-[14px]">
                  trending_up
                </span>
                8%
              </span>

            </div>

            <p className="text-sm text-[#475569] mb-1">
              Total Rencana Strategi
            </p>

            <h3 className="text-3xl font-bold text-[#0b1c30]">
              48
            </h3>

          </div>

          {/* Capaian Kinerja */}
          <div className="bg-white border border-[#E2E8F0] border-t-4 border-t-[#72a5dc] rounded-xl p-5 shadow-sm">

            <div className="flex justify-between items-start mb-4">

              <div className="w-10 h-10 rounded-lg bg-[#dce9ff] flex items-center justify-center text-[#001e40]">
                <span className="material-symbols-outlined">
                  data_usage
                </span>
              </div>

              <span className="flex items-center gap-1 text-slate-700 bg-slate-50 px-2 py-1 rounded text-xs font-semibold">
                <span className="material-symbols-outlined text-[14px]">
                  trending_flat
                </span>
                0%
              </span>

            </div>

            <p className="text-sm text-[#475569] mb-1">
              Capaian Kinerja
            </p>

            <h3 className="text-3xl font-bold text-[#0b1c30]">
              87.5%
            </h3>

          </div>

          {/* Total Laporan */}
          <div className="bg-white border border-[#E2E8F0] border-t-4 border-t-[#1d4f85] rounded-xl p-5 shadow-sm">

            <div className="flex justify-between items-start mb-4">

              <div className="w-10 h-10 rounded-lg bg-[#fee2e2] flex items-center justify-center text-[#ba1a1a]">
                <span className="material-symbols-outlined">
                  description
                </span>
              </div>

              <span className="flex items-center gap-1 text-red-700 bg-red-50 px-2 py-1 rounded text-xs font-semibold">
                <span className="material-symbols-outlined text-[14px]">
                  trending_down
                </span>
                3%
              </span>

            </div>

            <p className="text-sm text-[#475569] mb-1">
              Total Laporan
            </p>

            <h3 className="text-3xl font-bold text-[#0b1c30]">
              312
            </h3>

          </div>

        </section>

        {/* =========================
            CHART + QUICK ACTION
        ========================== */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* PERFORMANCE CHART */}
          <div className="lg:col-span-2 bg-white border border-[#c7dbf3] rounded-xl shadow-sm">

            <div className="p-5 border-b border-[#c7dbf3] bg-[#f4f8fe] flex items-center justify-between">

              <h3 className="text-lg font-semibold text-[#0b1c30]">
                Performance Overview
              </h3>

              <button className="p-2 hover:bg-surface-container-low rounded-lg">
                <span className="material-symbols-outlined text-[#475569]">
                  more_vert
                </span>
              </button>

            </div>

            <div className="p-6">

              <div className="flex gap-4">

                {/* Y AXIS */}
                <div className="h-[280px] flex flex-col justify-between text-xs text-[#475569] py-2">
                  <span>100</span>
                  <span>75</span>
                  <span>50</span>
                  <span>25</span>
                  <span>0</span>
                </div>

                {/* CHART */}
                <div className="flex-1">

                  <div className="h-[280px] border-l border-b border-outline-variant flex items-end justify-around gap-4 px-6">

                    {/* Q1 */}
                    <div className="h-full flex flex-col justify-end items-center gap-2 w-12">
                      <div className="w-full h-[60%] bg-primary rounded-t-lg relative">
                        <div className="absolute bottom-0 left-0 w-full h-[45%] bg-primary-fixed rounded-t-lg" />
                      </div>
                      <span className="text-xs text-[#475569]">
                        Q1
                      </span>
                    </div>

                    {/* Q2 */}
                    <div className="h-full flex flex-col justify-end items-center gap-2 w-12">
                      <div className="w-full h-[75%] bg-primary rounded-t-lg relative">
                        <div className="absolute bottom-0 left-0 w-full h-[60%] bg-primary-fixed rounded-t-lg" />
                      </div>
                      <span className="text-xs text-[#475569]">
                        Q2
                      </span>
                    </div>

                    {/* Q3 */}
                    <div className="h-full flex flex-col justify-end items-center gap-2 w-12">
                      <div className="w-full h-[85%] bg-primary rounded-t-lg relative">
                        <div className="absolute bottom-0 left-0 w-full h-[80%] bg-primary-fixed rounded-t-lg" />
                      </div>
                      <span className="text-xs text-[#475569]">
                        Q3
                      </span>
                    </div>

                    {/* Q4 */}
                    <div className="h-full flex flex-col justify-end items-center gap-2 w-12">
                      <div className="w-full h-[40%] bg-primary rounded-t-lg relative">
                        <div className="absolute bottom-0 left-0 w-full h-[20%] bg-primary-fixed rounded-t-lg" />
                      </div>
                      <span className="text-xs text-[#475569]">
                        Q4
                      </span>
                    </div>

                  </div>

                </div>

              </div>

              {/* LEGEND */}
              <div className="flex justify-center gap-6 mt-5 text-xs text-[#475569]">

                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary rounded-sm" />
                  Target
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary-fixed rounded-sm" />
                  Realisasi
                </div>

              </div>

            </div>

          </div>

          {/* QUICK ACTION */}
          <div className="bg-white border border-[#c7dbf3] rounded-xl p-5 shadow-sm">

            <h3 className="text-lg font-semibold text-[#0b1c30] mb-5">
              Aksi Cepat
            </h3>

            <div className="grid grid-cols-2 gap-3">

              <QuickAction
                icon="add_circle"
                title="Tambah Pohon Kinerja"
              />

              <QuickAction
                icon="add_task"
                title="Tambah Renstra"
              />

              <QuickAction
                icon="input"
                title="Input Capaian"
              />

              <QuickAction
                icon="post_add"
                title="Buat Laporan"
              />

            </div>

          </div>

        </section>

        {/* =========================
            AKTIVITAS TERBARU
        ========================== */}
        <section className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm">

            <div className="p-5 border-b border-[#c7dbf3] bg-[#f4f8fe] flex justify-between items-center">

            <h3 className="text-lg font-semibold text-[#0b1c30]">
              Aktivitas Terbaru
            </h3>

            <button className="text-sm text-[#001e40] font-semibold hover:underline">
              Lihat Semua
            </button>

          </div>

          <div className="p-5">

            <ActivityItem
              icon="update"
              text={
                <>
                  Pohon Kinerja{" "}
                  <strong>Ditjen Aptika 2024</strong>{" "}
                  diperbarui.
                </>
              }
              time="2 jam yang lalu oleh Budi S."
            />

            <ActivityItem
              icon="note_add"
              text={
                <>
                  Laporan Triwulan III{" "}
                  <strong>Balitbang SDM</strong>{" "}
                  dibuat.
                </>
              }
              time="Kemarin, 14:30 oleh Rina K."
            />

            <ActivityItem
              icon="warning"
              text={
                <>
                  Capaian Indikator{" "}
                  <strong>IKU 2.1</strong>{" "}
                  ditandai Belum Tercapai.
                </>
              }
              time="Kemarin, 09:15 oleh Sistem"
            />

            <ActivityItem
              icon="check_circle"
              text={
                <>
                  Rencana Strategi{" "}
                  <strong>2025-2029</strong>{" "}
                  disetujui.
                </>
              }
              time="2 Hari yang lalu oleh Admin"
              last
            />

          </div>

        </section>

      </main>
    </div>
  );
}


/* =================================
   QUICK ACTION COMPONENT
================================= */

function QuickAction({ icon, title }) {
  return (
    <button className="flex flex-col items-center justify-center p-4 min-h-[120px] border border-[#c7dbf3] bg-[#f8fbff] rounded-lg hover:bg-[#eaf3ff] hover:border-[#2f6fb3] transition-all group">

      <span className="material-symbols-outlined text-[#001e40] text-2xl mb-2 group-hover:scale-110 transition-transform">
        {icon}
      </span>

      <span className="text-xs font-semibold text-[#334155] text-center group-hover:text-[#001e40]">
        {title}
      </span>

    </button>
  );
}


/* =================================
   ACTIVITY COMPONENT
================================= */

function ActivityItem({ icon, text, time, last = false }) {
  return (
    <div className="flex gap-4 relative">

      {!last && (
        <div className="absolute left-4 top-9 bottom-[-20px] w-px bg-[#E2E8F0]" />
      )}

      <div className="w-8 h-8 rounded-full bg-[#d5e3ff] flex items-center justify-center text-[#001e40] shrink-0 z-10 border-2 border-white">

        <span className="material-symbols-outlined text-[16px]">
          {icon}
        </span>

      </div>

      <div className="pb-5">

        <p className="text-sm text-[#0b1c30]">
          {text}
        </p>

        <p className="text-xs text-[#64748b] mt-1">
          {time}
        </p>

      </div>

    </div>
  );
}

export default Dashboard;