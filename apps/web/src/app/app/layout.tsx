import type { PropsWithChildren } from "react";
import { AppShell } from "@/components/app-shell";

export default function AuthenticatedLayout({ children }: PropsWithChildren) {
  return <AppShell>{children}</AppShell>;
}
