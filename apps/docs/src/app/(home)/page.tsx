import { Cpu, MoveRight, Shield, Zap } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-col min-h-screen bg-background text-foreground selection:bg-foreground selection:text-background transition-colors duration-500">
      {/* Background Pattern */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] bg-dot-pattern"></div>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center pt-32 pb-20 px-6 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fd-muted text-fd-muted-foreground text-xs font-medium mb-8 border border-fd-border">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
          </span>
          v1.0.0 Now Available
        </div>

        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9] text-fd-foreground">
          LUMINA
        </h1>

        <p className="text-lg md:text-xl text-fd-muted-foreground max-w-2xl mb-12 font-medium leading-relaxed">
          Интеллектуальный брокер между вашим опытом и требованиями рынка.
          Создавайте безупречные резюме с помощью ИИ.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <Link
            href="/docs"
            className="group flex items-center gap-2 bg-fd-primary text-fd-primary-foreground px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-fd-primary/10"
          >
            Читать документацию
            <MoveRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="https://github.com/kidsamort/Project/CIAI"
            className="flex items-center gap-2 px-8 py-4 rounded-xl font-semibold border border-fd-border hover:bg-fd-accent hover:text-fd-accent-foreground transition-all"
          >
            GitHub
          </a>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 py-20 px-6 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Zap className="w-6 h-6" />}
            title="AI Engine"
            description="Использование LLM для глубокого анализа вакансий и адаптации вашего опыта под конкретные задачи."
          />
          <FeatureCard
            icon={<Cpu className="w-6 h-6" />}
            title="Modern Stack"
            description="Next.js 16, ElysiaJS, Bun и Drizzle. Построено на самых быстрых технологиях современности."
          />
          <FeatureCard
            icon={<Shield className="w-6 h-6" />}
            title="ATS Friendly"
            description="Строгая одноколоночная структура и чистая разметка для 100% проходимости через фильтры найма."
          />
        </div>
      </section>

      <footer className="relative z-10 py-12 px-6 border-t border-fd-border mt-auto text-center">
        <p className="text-fd-muted-foreground text-sm font-medium">
          © {new Date().getFullYear()} LUMINA. Built for the future of work.
        </p>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-8 rounded-2xl border border-fd-border bg-fd-card/50 backdrop-blur-sm hover:border-fd-accent hover:shadow-xl hover:shadow-fd-accent/5 transition-all group">
      <div className="w-12 h-12 rounded-xl bg-fd-muted flex items-center justify-center mb-6 text-fd-foreground group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-fd-foreground">{title}</h3>
      <p className="text-fd-muted-foreground leading-relaxed font-medium">
        {description}
      </p>
    </div>
  );
}
