import { motion } from 'framer-motion'
import Starfield from './components/Starfield'

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5 },
}

export default function App() {
  return (
    <div className="min-h-screen bg-void-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-void-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="/" className="text-xl font-semibold tracking-tight text-white">
            AIPER
          </a>
          <nav className="hidden gap-8 md:flex">
            <a href="#problem" className="text-sm text-zinc-400 transition hover:text-white">Problem</a>
            <a href="#solution" className="text-sm text-zinc-400 transition hover:text-white">Solution</a>
            <a href="#how-it-works" className="text-sm text-zinc-400 transition hover:text-white">How it works</a>
          </nav>
          <a
            href="#demo"
            className="rounded-lg bg-blue-500/20 px-4 py-2 text-sm font-medium text-blue-400 ring-1 ring-blue-500/30 transition hover:bg-blue-500/30"
          >
            Request Demo
          </a>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative min-h-screen overflow-hidden bg-grid pt-24">
          <Starfield />
          <div className="absolute inset-0 bg-gradient-to-b from-void-950/50 via-transparent to-void-950" />
          <div className="absolute left-1/2 top-1/3 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 glow-orb" />
          <div className="absolute right-1/4 top-1/2 h-[300px] w-[300px] rounded-full bg-violet-500/10 glow-orb" />
          <div className="container relative z-10 mx-auto max-w-4xl px-6 pb-32 pt-32 md:pt-40">
            <motion.p
              className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-blue-400/90"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              ECSS-compliant documentation platform
            </motion.p>
            <motion.h1
              className="text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              From Paperwork to Liftoff.
            </motion.h1>
            <motion.p
              className="mt-6 max-w-2xl text-lg text-zinc-400 md:text-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              AI-powered ECSS-compliant documentation for satellite manufacturers.
              Turn engineering chaos into structured, compliant, launch-ready systems.
            </motion.p>
            <motion.div
              className="mt-10 flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.5 }}
            >
              <a
                href="#demo"
                className="inline-flex items-center rounded-lg bg-blue-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-600 hover:shadow-blue-500/30"
              >
                Request Demo
              </a>
              <a
                href="#demo"
                className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10 hover:border-white/20"
              >
                Join Early Access
              </a>
            </motion.div>
          </div>
        </section>

        {/* Problem */}
        <section id="problem" className="relative border-t border-white/5 bg-grid py-24 md:py-32">
          <div className="container mx-auto max-w-6xl px-6">
            <motion.h2
              className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl"
              {...fadeUp}
            >
              Satellite teams don't build rockets.
              <br />
              <span className="text-zinc-500">They fight paperwork.</span>
            </motion.h2>
            <motion.div
              className="mt-12 grid gap-8 md:grid-cols-2 lg:gap-16"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.08 } },
              }}
            >
              <div className="space-y-6">
                {[
                  '30%+ of system engineering time lost to manual documentation',
                  'Fragmented ECSS compliance workflows',
                  'Version control chaos across suppliers',
                  'No real-time traceability between requirements and hardware',
                ].map((text, i) => (
                  <motion.div
                    key={i}
                    className="flex gap-3"
                    variants={{
                      hidden: { opacity: 0, x: -12 },
                      visible: { opacity: 1, x: 0 },
                    }}
                    transition={{ duration: 0.4 }}
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500/80" />
                    <span className="text-zinc-400">{text}</span>
                  </motion.div>
                ))}
              </div>
              <motion.div
                className="relative"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.5 }}
              >
                <div className="overflow-hidden rounded-xl border border-white/10 bg-void-900/80 p-4 shadow-2xl">
                  <div className="mb-4 flex gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500/60" />
                    <span className="h-2 w-2 rounded-full bg-amber-500/60" />
                    <span className="h-2 w-2 rounded-full bg-green-500/60" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {['v1_final.docx', 'v2_FINAL.docx', 'v3_actual_final.docx', 'ECSS_draft_old.xlsx', 'req_export (2).csv', 'TB_legacy.pdf'].map((f, i) => (
                      <div
                        key={i}
                        className="rounded border border-white/5 bg-void-800/80 px-3 py-2 text-xs text-zinc-500"
                      >
                        {f}
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-center text-xs text-zinc-600">Chaos</p>
                </div>
                <div className="absolute -bottom-4 -right-4 overflow-hidden rounded-xl border border-blue-500/30 bg-void-900 p-4 shadow-xl shadow-blue-500/10">
                  <div className="mb-3 flex gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500/80" />
                    <span className="h-2 w-2 rounded-full bg-blue-400/50" />
                    <span className="h-2 w-2 rounded-full bg-blue-400/50" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 w-full rounded bg-blue-500/20" />
                    <div className="h-2 w-3/4 rounded bg-blue-500/15" />
                    <div className="flex gap-2">
                      <div className="h-8 flex-1 rounded bg-blue-500/10" />
                      <div className="h-8 flex-1 rounded bg-blue-500/10" />
                    </div>
                  </div>
                  <p className="mt-2 text-center text-xs text-blue-400/90">AIPER</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Solution */}
        <section id="solution" className="relative border-t border-white/5 bg-void-900/30 py-24 md:py-32">
          <div className="container mx-auto max-w-6xl px-6">
            <motion.h2
              className="max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl"
              {...fadeUp}
            >
              AIPER transforms documentation into mission intelligence.
            </motion.h2>
            <motion.div
              className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.06 } },
              }}
            >
              {[
                {
                  icon: (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  ),
                  title: 'AI Document Generation',
                  desc: 'Automatically generate ECSS-compliant documentation from engineering inputs.',
                },
                {
                  icon: (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
                    </svg>
                  ),
                  title: 'Traceability Graph Engine',
                  desc: 'Live requirement-to-hardware mapping.',
                },
                {
                  icon: (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  title: 'Hardware Compatibility Checker',
                  desc: 'Prevent integration failures before AIT.',
                },
                {
                  icon: (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-1.331 9.94a5.5 5.5 0 00-1.399-1.399 5.5 5.5 0 00-1.399 1.399M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  title: 'Smart Version Control',
                  desc: 'Every change tracked. Zero ambiguity.',
                },
                {
                  icon: (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  ),
                  title: 'Secure & Private',
                  desc: '100% data ownership.',
                },
              ].map((item, i) => (
                <motion.article
                  key={i}
                  className="group rounded-xl border border-white/5 bg-void-900/60 p-6 transition hover:border-blue-500/20 hover:bg-void-800/60"
                  variants={{
                    hidden: { opacity: 0, y: 16 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="mb-4 inline-flex rounded-lg bg-blue-500/10 p-2.5 text-blue-400 ring-1 ring-blue-500/20 transition group-hover:bg-blue-500/15">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm text-zinc-400">{item.desc}</p>
                </motion.article>
              ))}
            </motion.div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="relative border-t border-white/5 bg-grid py-24 md:py-32">
          <div className="container mx-auto max-w-5xl px-6">
            <motion.h2
              className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl"
              {...fadeUp}
            >
              How it works
            </motion.h2>
            <motion.div
              className="relative mt-16 grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.2 } },
              }}
            >
              <div className="absolute left-1/2 top-7 hidden h-0.5 w-2/3 -translate-x-1/2 border-t border-dashed border-blue-500/20 md:block" aria-hidden />
              {[
                { step: 1, label: 'Upload / Sync Engineering Data' },
                { step: 2, label: 'AIPER structures, links, validates' },
                { step: 3, label: 'Export compliant mission-ready documentation' },
              ].map((item) => (
                <motion.div
                  key={item.step}
                  className="relative flex flex-col items-center text-center"
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="relative z-10 mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-blue-500/40 bg-blue-500/10 text-xl font-bold text-blue-400">
                    {item.step}
                  </div>
                  <p className="max-w-[240px] text-sm font-medium text-zinc-300">{item.label}</p>
                </motion.div>
              ))}
            </motion.div>
            <motion.div
              className="mt-12 rounded-xl border border-white/10 bg-void-900/80 p-6 md:p-8"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12">
                <div className="flex items-center gap-2 rounded-lg bg-void-800 px-4 py-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="text-sm text-zinc-400">Data sources</span>
                </div>
                <svg className="h-5 w-8 text-blue-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <div className="flex items-center gap-2 rounded-lg bg-blue-500/10 px-4 py-2 ring-1 ring-blue-500/20">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-sm text-blue-400">AIPER Engine</span>
                </div>
                <svg className="h-5 w-8 text-blue-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <div className="flex items-center gap-2 rounded-lg bg-void-800 px-4 py-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm text-zinc-400">ECSS docs</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Social proof */}
        <section className="relative border-t border-white/5 py-20 md:py-28">
          <div className="container mx-auto max-w-4xl px-6 text-center">
            <motion.p
              className="mb-10 flex flex-wrap items-center justify-center gap-8 md:gap-12 text-zinc-500"
              {...fadeUp}
            >
              {['OHB', 'Argotec', 'NanoAvionics', 'Pixxel'].map((name, i) => (
                <span key={i} className="text-lg font-medium tracking-wide text-zinc-600">
                  {name}
                </span>
              ))}
            </motion.p>
            <motion.p
              className="text-lg text-zinc-400 md:text-xl"
              {...fadeUp}
            >
              Built with feedback from aerospace engineers across Europe and the US.
            </motion.p>
          </div>
        </section>

        {/* Vision */}
        <section className="relative border-t border-white/5 bg-void-900/30 py-24 md:py-32">
          <div className="container mx-auto max-w-3xl px-6 text-center">
            <motion.h2
              className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl"
              {...fadeUp}
            >
              Infrastructure for the Space Economy.
            </motion.h2>
            <motion.p
              className="mt-8 text-lg leading-relaxed text-zinc-400"
              {...fadeUp}
            >
              As satellites scale from dozens to thousands, documentation must become autonomous.
              AIPER is the layer that turns engineering data into compliant, auditable, launch-ready systems—so teams ship missions, not spreadsheets.
            </motion.p>
          </div>
        </section>

        {/* Final CTA */}
        <section id="demo" className="relative border-t border-white/5 bg-grid py-24 md:py-32">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent" />
          <div className="container relative mx-auto max-w-3xl px-6 text-center">
            <motion.h2
              className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl"
              {...fadeUp}
            >
              Stop Managing Documents.
              <br />
              Start Launching Missions.
            </motion.h2>
            <motion.div
              className="mt-10"
              {...fadeUp}
            >
              <a
                href="#demo"
                className="inline-flex items-center rounded-lg bg-blue-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-600 hover:shadow-blue-500/30"
              >
                Book a Demo
              </a>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="container mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6">
          <span className="text-sm font-medium text-zinc-500">© AIPER Space 2026</span>
          <div className="flex flex-wrap items-center gap-6 text-sm text-zinc-500">
            <a href="#contact" className="transition hover:text-white">Contact</a>
            <a href="#privacy" className="transition hover:text-white">Privacy</a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="transition hover:text-white">LinkedIn</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
