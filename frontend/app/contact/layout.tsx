import type { Metadata } from "next";
import { constructMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return constructMetadata({
    path: "/contact",
    pageKey: "contact",
    title: "Contact Us",
    description: "Get in touch with the PayTrizz squad for project inquiries, custom tech solutions, or general questions.",
  });
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
