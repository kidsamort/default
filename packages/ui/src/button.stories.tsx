import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["solid", "outline", "soft", "surface"],
    },
    color: {
      control: "select",
      options: ["blue", "red", "green", "gray"],
    },
    size: {
      control: "select",
      options: ["1", "2", "3"],
    },
    disabled: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    children: "Click me",
    variant: "solid",
    color: "blue",
    size: "2",
  },
};
