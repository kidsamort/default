import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "./card";

const meta: Meta<typeof Card> = {
  title: "Components/Card",
  component: Card,
  argTypes: {
    variant: {
      control: "select",
      options: ["surface", "classic", "translucent"],
    },
    size: {
      control: "select",
      options: ["1", "2", "3"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    children: "This is a card content",
    variant: "surface",
    size: "2",
  },
};
