import { EventEmitter } from "event_emitter";
import { alarm_sender } from "./events/alarm.ts";

export const server_events = new EventEmitter<{
  alarm: (status: "trouble" | "normal") => void;
}>();

export function init_event_registry() {
  alarm_sender();
}
