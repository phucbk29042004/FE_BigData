import type { NextRequest } from "next/server";
import {
  readTransactionEvents,
  resolveTransactionStreamConfig,
} from "@/lib/realtime/transactions-stream";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const encoder = new TextEncoder();
const DEFAULT_RETRY_MS = 3000;
const CONFIG_ERROR_RETRY_MS = 30_000;

const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
};

export async function GET(request: NextRequest) {
  const config = resolveTransactionStreamConfig();
  if (!config) {
    const body =
      `retry: ${CONFIG_ERROR_RETRY_MS}\n` +
      frameEvent("error", {
        message:
          "Missing Redis config. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (or UPSTASH_REDIS_CONNECTION).",
      });
    return new Response(body, { headers: SSE_HEADERS });
  }

  let cursor =
    request.headers.get("last-event-id") ??
    request.nextUrl.searchParams.get("cursor") ??
    "$";
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const closeStream = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          // no-op: stream may already be closed
        }
      };

      request.signal.addEventListener("abort", closeStream);
      controller.enqueue(encoder.encode(`retry: ${DEFAULT_RETRY_MS}\n\n`));
      controller.enqueue(
        encoder.encode(
          frameEvent("ready", { stream: config.streamKey, cursor }),
        ),
      );

      while (!closed && !request.signal.aborted) {
        try {
          const { events, nextCursor } = await readTransactionEvents(
            config,
            cursor,
          );
          cursor = nextCursor;

          if (events.length === 0) {
            controller.enqueue(encoder.encode(frameEvent("ping", { t: Date.now() })));
            continue;
          }

          for (const event of events) {
            if (closed || request.signal.aborted) break;
            cursor = event.id;
            controller.enqueue(
              encoder.encode(frameEvent("transaction", event.transaction, event.id)),
            );
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown stream error";
          controller.enqueue(
            encoder.encode(frameEvent("error", { message })),
          );
          await sleep(1000);
        }
      }

      closeStream();
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}

function frameEvent(event: string, data: unknown, id?: string): string {
  const dataLine = `data: ${JSON.stringify(data)}\n`;
  const eventLine = `event: ${event}\n`;
  const idLine = id ? `id: ${id}\n` : "";
  return `${idLine}${eventLine}${dataLine}\n`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
