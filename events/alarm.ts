import { server_events } from "../server_events.ts";
import server_status from "../server_status.ts";

export function alarm_sender() {
  return server_events.on("alarm", (status) => {
    //any bots that listen for alarms will receive the code trouble or normal
    const relevant_bots: { bot_name: string; socket: WebSocket }[] = [];

    for (const [key, value] of server_status.clients.entries()) {
      if (value.purpose === "alarm") {
        relevant_bots.push({ bot_name: key, socket: value.socket });
      }
    }

    relevant_bots.forEach((bot) => {
      if (status === "trouble") {
        bot.socket.send("TROUBLE");
      }
      if (status === "normal") {
        bot.socket.send("SYSTEM_NORMAL");
      }
    });
  });
}
