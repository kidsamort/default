import { Type } from "@sinclair/typebox";

// Example schema - extend as needed
export const UserSchema = Type.Object({
  id: Type.String(),
  email: Type.String({ format: "email" }),
  name: Type.String(),
  createdAt: Type.String({ format: "date-time" }),
  updatedAt: Type.String({ format: "date-time" }),
});

export type User = typeof UserSchema.static;

// Health check response
export const HealthSchema = Type.Object({
  status: Type.Literal("healthy"),
  timestamp: Type.String(),
});

export type Health = typeof HealthSchema.static;
