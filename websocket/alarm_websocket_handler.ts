import dayjs from "dayjs";
import server_status from "../server_status.ts";

export function handleAlarmWebSocket(req: Request): Response {
  const { socket, response } = Deno.upgradeWebSocket(req);

  socket.addEventListener("open", async () => {
    let token = req.headers.get("token");
    //if token is undefined, look for query params in the url and get the token
    if (token === null) {
      const url = new URL(req.url);
      token = url.searchParams.get("token");
    }
    let bot_name = req.headers.get("name");
    //if bot_name is undefined, look for query params in the url and get the bot_name
    if (bot_name === null) {
      const url = new URL(req.url);
      bot_name = url.searchParams.get("name");
    }

    const valid_token = token === server_status.alarm_token;

    if (valid_token) {
      server_status.clients.set(bot_name ?? "unknown", {
        purpose: "alarm",
        time_connected: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        socket: socket,
      });

      const current_status = server_status.get_current_alarm_status();

      await server_status.emit_alarm(current_status);
    }

    if (!valid_token) {
      socket.close(400, "Invalid token");
      return new Response("Invalid token", { status: 400 });
    }
  });

  socket.addEventListener("close", () => {
    const bot_name = req.headers.get("name");

    server_status.clients.delete(bot_name ?? "unknown");
  });

  // socket.addEventListener("message", (event: MessageEvent) => {
  //   console.debug("Got message from client");

  //   const message = JSON.parse(event.data) as { message: string };

  //   if (message.message === "get_clients") {
  //     socket.send(JSON.stringify(Array.from(client_info.keys())));
  //   }
  //   socket.send("Hello from server!");
  // });

  return response;
}
