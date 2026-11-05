export type MutationTicket = { id: string };
export function createRequestTickets<Request, Result>(
  service: (request: Request) => Promise<Result>,
) {
  const requests = new Map<string, Request>();
  return {
    put: (request: Request): MutationTicket => {
      const ticket = { id: crypto.randomUUID() };
      requests.set(ticket.id, request);
      return ticket;
    },
    execute: async (ticket: MutationTicket) => {
      const request = requests.get(ticket.id);
      if (!request) throw new Error("Yêu cầu đã kết thúc.");
      try {
        return await service(request);
      } finally {
        requests.delete(ticket.id);
      }
    },
  };
}
