async function normalize(value: unknown): Promise<unknown> {
  if (value instanceof Blob) {
    return {
      type: value.type,
      size: value.size,
      name: value instanceof File ? value.name : undefined,
      content: await digest(await value.arrayBuffer()),
    };
  }
  if (Array.isArray(value)) return Promise.all(value.map(normalize));
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort())
      result[key] = await normalize(Reflect.get(value, key));
    return result;
  }
  return value;
}
async function digest(value: BufferSource) {
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", value))]
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");
}
export async function fingerprint(value: unknown) {
  return digest(
    new TextEncoder().encode(JSON.stringify(await normalize(value))),
  );
}
