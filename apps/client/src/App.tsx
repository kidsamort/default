import { Card, Heading, Text, Code, Box, Flex } from "@radix-ui/themes";

export default function App() {
  return (
    <Box p="6" style={{ maxWidth: "800px", margin: "0 auto" }}>
      <Heading size="8" mb="2">
        Welcome to {{PROJECT_NAME}}
      </Heading>
      <Text size="3" color="gray" mb="6" as="p">
        Your modular Bun + Vite + React 19 monorepo is ready.
      </Text>

      <Flex direction="column" gap="4">
        <Card size="2">
          <Heading size="3" mb="2">🚀 Getting Started</Heading>
          <Code variant="ghost" style={{ display: "block", padding: "12px", background: "#1a1a1a", color: "#00ffcc" }}>
            bun run dev
          </Code>
        </Card>

        <Card size="2">
          <Heading size="3" mb="2">📦 Stack</Heading>
          <Flex direction="column" gap="1" style={{ listStyle: "disc", paddingLeft: "20px" }}>
            <Text as="div">• Vite + React 19</Text>
            <Text as="div">• Radix UI Themes</Text>
            <Text as="div">• Zustand State Management</Text>
            <Text as="div">• TypeScript with Project References</Text>
            <Text as="div">• Biome for linting & formatting</Text>
            <Text as="div">• Turborepo for build orchestration</Text>
          </Flex>
        </Card>
      </Flex>
    </Box>
  );
}
