import type { z } from "zod";

export type FieldSpec = {
  name: string;
  type: string;
  required: boolean;
  rules: string;
};
export type Endpoint = {
  name: string;
  feature: string;
  method: string;
  path: string;
  version: boolean;
  idempotency: boolean;
  invalidates: string[];
  permission: string | null;
  fields: FieldSpec[];
  params: z.ZodType;
  query: z.ZodType;
  body: z.ZodType;
  response: z.ZodType;
};
export const endpoint = <const T extends Endpoint>(value: T): T => value;
export type TransportOptions = {
  version?: number;
  key?: string;
  signal?: AbortSignal;
  scenario?: string;
};
export type ContractRequest<C extends Endpoint> = TransportOptions & {
  params?: z.input<C["params"]>;
  query?: z.input<C["query"]>;
  body?: z.input<C["body"]>;
};
export type ContractResponse<C extends Endpoint> = z.output<C["response"]>;
