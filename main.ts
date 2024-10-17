import { set_alarm_status } from "./routes/set_alarm_status.ts";
import { handleAlarmWebSocket } from "./websocket/alarm_websocket_handler.ts";
import {
  configuration_board,
  reset_alarm,
  return_light_status,
  set_leds_config,
  set_power,
  status_board,
} from "./routes/status_board.ts";
import server_status from "./server_status.ts";
import { router } from "./router.ts";
import { init_event_registry } from "./server_events.ts";

//Register Events
init_event_registry();
//--------------------//

Deno.serve({ port: Number(server_status.port) }, async (req) => {
  //WEBSOCKET HANDLING
  if (req.headers.get("upgrade") === "websocket") {
    let type = req.headers.get("type");
    //if type is undefined, look for query params in the url and get the type

    if (type === null) {
      const url = new URL(req.url);
      type = url.searchParams.get("type");
    }
    switch (type) {
      case "alarm":
        return handleAlarmWebSocket(req);
    }
  }

  if (req.url.includes("alarm")) {
    server_status.add_url_req(req.url);
  }
  //ROUTING [] add more routes to array {path: "/path", fn: function}
  return await router(req, [
    { path: "/alarm", method: "GET", fn: set_alarm_status },
    { path: "/status", method: "GET", fn: status_board },
    { path: "/light-status", method: "GET", fn: return_light_status },
    { path: "/config", method: "GET", fn: configuration_board },
    { path: "/config", method: "POST", fn: set_leds_config },
    { path: "/power", method: "POST", fn: set_power },
    { path: "/reset", method: "POST", fn: reset_alarm },
  ]);
});
