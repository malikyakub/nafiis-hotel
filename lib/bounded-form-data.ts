export class FormBodyError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

// Count actual bytes before the multipart parser allocates fields/files. A
// Content-Length header is optional and must never be the only size check.
export async function boundedFormData(request: Request, maxBytes: number): Promise<FormData> {
  const contentType = request.headers.get("content-type") || "";
  if (!/^multipart\/form-data\s*;/i.test(contentType)) {
    throw new FormBodyError(415, "Use a multipart form for the payment attachment.");
  }
  const tooLarge = () => new FormBodyError(413, "Maximum upload size is 4 MB.");
  const declared = request.headers.get("content-length");
  if (declared !== null && Number(declared) > maxBytes) throw tooLarge();
  if (!request.body) throw new FormBodyError(400, "Missing payment attachment.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel().catch(() => {});
        throw tooLarge();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return await new Response(body, { headers: { "content-type": contentType } }).formData();
  } catch {
    throw new FormBodyError(400, "Invalid payment attachment form. Please try again.");
  }
}
