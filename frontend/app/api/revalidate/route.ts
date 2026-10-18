import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { secret, tag, path } = body;

    const expectedSecret =
      process.env.REVALIDATE_SECRET ||
      process.env.NEXTJS_REVALIDATE_SECRET ||
      "e1d2c3b4a59687786950413223142536475869708192a3b4c5d6e7f8091a2b3c";

    if (!expectedSecret || secret !== expectedSecret) {
      return NextResponse.json({ success: false, message: "Invalid secret token" }, { status: 401 });
    }

    if (tag) {
      try {
        (revalidateTag as any)(tag);
      } catch {
        try {
          (revalidateTag as any)(tag, "max");
        } catch {}
      }

      // Revalidate layout and core pages for site-wide settings & menus
      if (tag === "settings" || tag === "menus") {
        revalidatePath("/", "layout");
      } else {
        revalidatePath("/", "page");
      }
    }

    if (path) {
      revalidatePath(path);
    }

    return NextResponse.json({
      success: true,
      message: `Revalidated successfully`,
      data: { tag, path, timestamp: new Date().toISOString() },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ success: false, message: `Revalidation error: ${message}` }, { status: 500 });
  }
}
