import { EventEmitter } from "node:events";

type SupportEvent = {
  ticketId: string;
  payload: unknown;
};

export const supportLiveEvents = new EventEmitter();

export function publishSupportEvent(event: SupportEvent) {
  supportLiveEvents.emit("support:event", event);
}
