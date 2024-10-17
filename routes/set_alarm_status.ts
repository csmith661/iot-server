import server_status from "../server_status.ts";

//http://thingamabob.bayviewphysicians.com/testl?From=49625044454&To=3545354535&Body=Daily%20Status%20Check;%20Result:%20Success;%20Status%20Check%20Ok&token=<TOKEN

export async function set_alarm_status(req: Request): Promise<Response> {
  const url_object = new URL(req.url);
  const params = new URLSearchParams(url_object.search);

  const payload = {
    token: params.get("token"),
    message: params.get("Body"),
  };

  const message = payload.message?.split(";") ?? [];

  const alarm_name = message[0];

  const status = message[1].includes("Success") ? "normal" : "trouble";

  if (status === undefined || alarm_name === undefined) {
    return new Response("Invalid Request", { status: 400 });
  }

  const valid_token = payload.token === server_status.alarm_token;

  if (!valid_token) {
    return new Response("Invalid token", { status: 400 });
  }

  server_status.set_alarm_status(alarm_name, status);

  return new Response("Updated Alarm: " + status, { status: 400 });
}
