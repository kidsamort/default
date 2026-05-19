export default function Home() {
  return (
    <main style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2.5rem", fontWeight: "700", marginBottom: "1rem" }}>
        Welcome to {{PROJECT_NAME}}
      </h1>
      <p style={{ color: "#666", marginBottom: "2rem" }}>
        Your monorepo is ready. Start building.
      </p>
      
      <div style={{ display: "grid", gap: "1rem" }}>
        <div style={{ 
          padding: "1.5rem", 
          border: "1px solid #e5e5e5", 
          borderRadius: "8px",
          backgroundColor: "#f9f9f9"
        }}>
          <h2 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>🚀 Getting Started</h2>
          <code style={{ 
            display: "block", 
            padding: "0.75rem", 
            background: "#111", 
            color: "#fff", 
            borderRadius: "4px",
            fontFamily: "monospace",
            fontSize: "0.875rem"
          }}>
            bun run dev
          </code>
        </div>
        
        <div style={{ 
          padding: "1.5rem", 
          border: "1px solid #e5e5e5", 
          borderRadius: "8px"
        }}>
          <h2 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>📦 Stack</h2>
          <ul style={{ color: "#444", lineHeight: "1.8" }}>
            <li>Next.js 16 + React 19</li>
            <li>Radix UI + Framer Motion</li>
            <li>TypeScript with project references</li>
            <li>Biome for linting & formatting</li>
            <li>Turborepo for build orchestration</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
