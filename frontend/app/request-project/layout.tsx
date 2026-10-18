import type { Metadata } from "next";
import { constructMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return constructMetadata({
    path: "/request-project",
    pageKey: "request-project",
    title: "Request a Project Squad",
    description: "Submit your product requirements and assemble an elite, vetted tech squad tailored to your scope, budget, and timeline.",
  });
}

export default function RequestProjectLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
