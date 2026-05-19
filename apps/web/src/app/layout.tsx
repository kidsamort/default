import { Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Theme appearance="light" accentColor="blue" radius="medium">
          {children}
        </Theme>
      </body>
    </html>
  );
}
