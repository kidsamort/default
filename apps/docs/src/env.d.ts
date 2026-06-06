import type { ReactNode } from "react";

declare global {
  type LayoutProps<T extends string = string> = {
    children: ReactNode;
    params: Promise<{ slug?: string[] }>;
  };

  type PageProps<T extends string = string> = {
    params: Promise<{ slug?: string[] }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
  };

  type RouteContext<T extends string = string> = {
    params: Promise<{ slug?: string[] }>;
  };
}
