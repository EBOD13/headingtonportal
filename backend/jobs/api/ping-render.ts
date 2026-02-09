import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(
  _req: VercelRequest,
  res: VercelResponse
) {
  try {
    const response = await fetch(
      "https://api.danielesambu.com/internal/ping",
      {
        headers: {
          "x-keepalive-secret": process.env.KEEPALIVE_SECRET!,
        },
      }
    );

    res.status(200).json({
      ok: response.ok,
      status: response.status,
    });
  } catch (err) {
    res.status(500).json({ error: "Ping failed" });
  }
}
