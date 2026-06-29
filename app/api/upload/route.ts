import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { serverError } from "@/lib/http";

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

/** Validates real image magic bytes so a client can't spoof Content-Type. */
function sniffImage(bytes: Uint8Array): string | null {
  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47)
    return "image/png";
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  // GIF: 47 49 46 38
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38)
    return "image/gif";
  // WEBP: RIFF....WEBP
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  )
    return "image/webp";
  return null;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "no file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "only PNG, JPG, WebP, and GIF are allowed" },
        { status: 400 }
      );
    }

    if (file.size === 0 || file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "file must be between 1 byte and 2MB" },
        { status: 400 }
      );
    }

    // Verify the actual bytes match an allowed image format (not just the
    // client-declared Content-Type).
    const buf = new Uint8Array(await file.arrayBuffer());
    const sniffed = sniffImage(buf);
    if (!sniffed) {
      return NextResponse.json(
        { error: "file content is not a valid image" },
        { status: 400 }
      );
    }

    const extByType: Record<string, string> = {
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/webp": "webp",
      "image/gif": "gif",
    };
    const ext = extByType[sniffed] ?? "png";
    const filename = `logos/${crypto.randomUUID()}.${ext}`;

    const blob = await put(filename, Buffer.from(buf), {
      access: "public",
      contentType: sniffed,
    });

    return NextResponse.json({ url: blob.url });
  } catch (e) {
    return serverError("upload", e, "upload failed");
  }
}
