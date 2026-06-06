import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import "../../../packages/ui/src/styles/tokens.css";
import {
  accentColors,
  grayColors,
  radii,
  themePropDefs,
} from "@radix-ui/themes/props";
import {
  DocsContainer,
  type DocsContainerProps,
} from "@storybook/addon-docs/blocks";
import { themes } from "storybook/theming";
import type { Preview } from "@storybook/react-vite";

const ExampleContainer = ({
  children,
  context,
  ...props
}: DocsContainerProps) => {
  const [isDark, setIsDark] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches,
  );

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const storybookTheme = isDark ? themes.dark : themes.light;

  return (
    <DocsContainer context={context} {...props} theme={storybookTheme}>
      {children}
    </DocsContainer>
  );
};

const preview: Preview = {
  parameters: {
    layout: "centered",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      container: ExampleContainer,
    },
    a11y: {
      test: "todo",
    },
  },
  globalTypes: {
    appearance: {
      name: "Appearance",
      description: "Color scheme (light/dark)",
      defaultValue: themePropDefs.appearance.default,
      toolbar: {
        icon: "circlehollow",
        items: themePropDefs.appearance.values.map((value: string) => ({
          value,
          title: value.charAt(0).toUpperCase() + value.slice(1),
          icon:
            value === "light"
              ? "sun"
              : value === "dark"
                ? "moon"
                : "circlehollow",
        })),
      },
    },
    accentColor: {
      name: "Accent Color",
      description: "Radix UI accent color",
      defaultValue: themePropDefs.accentColor.default,
      toolbar: {
        icon: "paintbrush",
        items: [...accentColors],
      },
    },
    grayColor: {
      name: "Gray Color",
      description: "Radix UI gray color scale",
      defaultValue: themePropDefs.grayColor.default,
      toolbar: {
        icon: "contrast",
        items: [...grayColors],
      },
    },
    panelBackground: {
      name: "Panel Background",
      description: "Visual style for panels",
      defaultValue: themePropDefs.panelBackground.default,
      toolbar: {
        icon: "info",
        items: [...themePropDefs.panelBackground.values],
      },
    },
    radius: {
      name: "Radius",
      description: "Radix UI border radius",
      defaultValue: "medium",
      toolbar: {
        icon: "box",
        items: [...radii],
      },
    },
    scaling: {
      name: "Scaling",
      description: "Layout scaling",
      defaultValue: themePropDefs.scaling.default,
      toolbar: {
        icon: "zoom",
        items: [...themePropDefs.scaling.values],
      },
    },
  },
  decorators: [
    (Story, context) => {
      const {
        appearance,
        accentColor,
        grayColor,
        panelBackground,
        radius,
        scaling,
      } = context.globals;

      useEffect(() => {
        const body = document.body;
        body.classList.add("radix-themes");
        body.setAttribute("data-is-root-theme", "true");
        body.setAttribute("data-accent-color", accentColor);
        body.setAttribute("data-gray-color", grayColor);
        body.setAttribute("data-panel-background", panelBackground);
        body.setAttribute("data-radius", radius);
        body.setAttribute("data-scaling", scaling);

        if (appearance === "light" || appearance === "dark") {
          body.classList.remove("light", "dark", "light-theme", "dark-theme");
          body.classList.add(appearance, `${appearance}-theme`);
        }

        // Apply Pro-level Radix UI styles to the entire canvas
        body.style.backgroundColor = "var(--gray-1)";
        body.style.color = "var(--gray-12)";
        body.style.fontFamily = "var(--default-font-family)";
        body.style.setProperty("-webkit-font-smoothing", "antialiased");
        body.style.setProperty("-moz-osx-font-smoothing", "grayscale");
      }, [
        appearance,
        accentColor,
        grayColor,
        panelBackground,
        radius,
        scaling,
      ]);

      return (
        <Theme
          appearance={appearance}
          accentColor={accentColor}
          grayColor={grayColor}
          panelBackground={panelBackground}
          radius={radius}
          scaling={scaling}
          asChild
        >
          <Story />
        </Theme>
      );
    },
  ],
};

export default preview;
