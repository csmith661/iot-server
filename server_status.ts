import { load } from "@std/dotenv";
import {
  GlobalStatuses,
  SupportedStatusStrings,
  SupportedStatusTypes,
} from "./types/server_types.ts";
import { server_events } from "./server_events.ts";

await load({ export: true });
const env = await load();

class ServerStatus {
  _global_status: GlobalStatuses<SupportedStatusStrings, SupportedStatusTypes>;
  clients: Map<
    string,
    { purpose: string; time_connected: string; socket: WebSocket }
  >;
  port: string;
  alarm_token: string;
  received_urls_req: {
    url: string;
    timestamp: string;
    readable_log: string;
    details: string;
  }[];

  constructor() {
    this._global_status = new Map();
    this.clients = new Map();
    this.received_urls_req = [];
    this.port = env["SERVER_PORT"] ?? Deno.env.get("SERVER_PORT");
    this.alarm_token = env["ALARM_TOKEN"] ?? Deno.env.get("ALARM_TOKEN");
    /*
    TEST THE ENV VARIABLES
    */
    if (this.port === undefined || this.alarm_token === undefined) {
      throw new Error("ALARM_TOKEN is not defined in .env");
    }
  }

  get global_status() {
    return this._global_status;
  }

  async emit_alarm(status: "trouble" | "normal") {
    await server_events.emit("alarm", status);
  }

  get_current_alarm_status() {
    const status_obj = Object.values(this._global_status.get("alarm") ?? {});

    if (status_obj.some((value) => value === "trouble")) {
      return "trouble";
    } else {
      return "normal";
    }
  }

  add_url_req(url: string) {
    const url_object = new URL(url);
    const params = new URLSearchParams(url_object.search);

    const payload = {
      token: params.get("token"),
      message: params.get("Body"),
    };

    const message = payload.message?.split(";") ?? [];

    const alarm_name = message[0];

    const status = message[1].includes("Success") ? "normal" : "trouble";

    this.received_urls_req.push({
      readable_log: `${alarm_name}: ${status}`,
      details: message[1],
      url,
      timestamp: new Date().toLocaleString(),
    });
  }

  set_alarm_status(alarm_name: string, value: SupportedStatusTypes[string]) {
    const status_obj = this._global_status.get("alarm");
    this._global_status.set("alarm", { ...status_obj, [alarm_name]: value });

    const new_alarm_status = Object.values(
      this.global_status.get("alarm") ?? {}
    );

    if (new_alarm_status.some((value) => value === "trouble")) {
      this.emit_alarm("trouble");
    } else {
      this.emit_alarm("normal");
    }
  }
}

export default new ServerStatus();
