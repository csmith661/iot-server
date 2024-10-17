import { server_events } from "../server_events.ts";
import server_status from "../server_status.ts";

let LED_POWER: "on" | "off" = "on";
const led_config: Record<
  number,
  {
    animation: string;
    color: string;
    r: number;
    b: number;
    g: number;
  }
> = {
  1: {
    animation: "none",
    color: "0, 175, 0",
    r: 0,
    g: 0,
    b: 175,
  },
  2: {
    animation: "none",
    color: "0, 175, 0",
    r: 0,
    g: 0,
    b: 175,
  },
  3: {
    animation: "none",
    color: "0, 175, 0",
    r: 0,
    g: 0,
    b: 175,
  },
  4: {
    animation: "none",
    color: "0, 0, 0",
    r: 0,
    g: 0,
    b: 0,
  },
};

export async function return_light_status(req: Request): Promise<Response> {
  const status = server_status.get_current_alarm_status();

  const query = new URL(req.url).searchParams;

  const position = Number(query.get("position"));

  const position_color = led_config[position]?.color ?? "255, 0, 0";

  const position_animation = led_config[position]?.animation ?? "slow_pulse";

  if (LED_POWER === "off") {
    return new Response(
      JSON.stringify({
        status: "off",
        animation: "none",
        color: "0, 0, 0",
      }),
      {
        headers: { "content-type": "application/json" },
      }
    );
  }

  if (status === "normal") {
    return new Response(
      JSON.stringify({
        status: "normal",
        animation: position_animation,
        color: position_color,
      }),
      {
        headers: { "content-type": "application/json" },
      }
    );
  }

  if (status === "trouble") {
    return new Response(
      JSON.stringify({
        status: "trouble",
        animation: "strobe",
        color: "255, 0, 0",
      }),
      {
        headers: { "content-type": "application/json" },
      }
    );
  }

  return new Response(
    JSON.stringify({
      status: "default",
      animation: "strobe",
      color: "255, 0, 0",
    }),
    {
      headers: { "content-type": "application/json" },
    }
  );
}

export async function status_board(req: Request): Promise<Response> {
  const html = generate_status_board(
    server_status.global_status,
    server_status.clients
  );
  // Send the HTML response
  return new Response(html, { headers: { "content-type": "text/html" } });
}

function generate_status_board(
  current_status: typeof server_status.global_status,
  clients: typeof server_status.clients
): string {
  const statusList = Array.from(current_status.entries())
    .map(
      ([statusName, status]) => `
      <li>
        <strong>${statusName}:</strong>
        <ul>
          ${Object.entries(status)
            .map(([key, value]) => `<li>${key}: ${value}</li>`)
            .join("")}
        </ul>
      </li>
    `
    )
    .join("");

  const clientList = Array.from(clients.entries())
    .map(
      ([clientName, client]) => `
      <li>
        <strong>${clientName}:</strong> Connect Time - ${client.time_connected}, Purpose - ${client.purpose}
      </li>
    `
    )
    .join("");

  const received_urls_req = server_status.received_urls_req
    .map(
      (item) =>
        `<li>Status: ${item.readable_log} - Time: ${item.timestamp} - Details: ${item.details}</li>`
    )
    .join("");

  const html = `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 20px;
            }
            h1 {
              text-align: center;
              color: #333;
            }
            h2 {
              color: #555;
            }
            ul {
              list-style-type: none;
              padding: 0;
            }
            li {
              background: #fff;
              margin: 10px 0;
              padding: 10px;
              border: 1px solid #ddd;
              border-radius: 5px;
            }
            button {
              display: block;
              margin: 20px auto;
              padding: 10px 20px;
              font-size: 16px;
              color: #fff;
              background-color: #007bff;
              border: none;
              border-radius: 5px;
              cursor: pointer;
            }
            button:hover {
              background-color: #0056b3;
            }
            #refresh-time {
              text-align: center;
              margin-top: 20px;
              color: #555;
            }
          </style>
          <script src="https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js"></script>
          <script>
            function updateRefreshTime() {
              const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
              document.getElementById('refresh-time').innerText = 'Last refreshed: ' + now;
            }
            setInterval(function() {
              location.reload();
            }, 30000); // 30 seconds
            window.onload = updateRefreshTime;
          </script>
        </head>
        <body>
          <h1>Status Board</h1>
          <h2>Current Status</h2>
          <ul>
            ${current_status.size ? statusList : "<li>No status available</li>"}
          </ul>
          <h2>Clients</h2>
          <ul>
            ${clients.size ? clientList : "<li>No clients connected</li>"}
          </ul>
          <button onclick="location.reload()">Refresh</button>
          <div id="refresh-time"></div>
          <div> Received URLS: <div>
          <ul>
            ${received_urls_req}
          </ul>
        </body>
      </html>
    `;

  return html;
}

export async function configuration_board(req: Request): Promise<Response> {
  const html = `
   <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LED Configuration</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
    }
    .form-group {
      margin-bottom: 15px;
      padding-top: 2rem;
    }
    label {
      display: block;
      margin-bottom: 5px;
    }
    input[type="number"], select {
      width: 100%;
      padding: 8px;
      margin-bottom: 10px;
    }
    button {
      padding: 10px 15px;
      background-color: #007BFF;
      color: #FFF;
      border: none;
      cursor: pointer;
    }
    button:hover {
      background-color: #0056b3;
    }
    .led1 {
      background-color: rgb(${led_config[1].r}, ${led_config[1].g}, ${
    led_config[1].b
  });
      height: 50px;
      width: 50px;
    }
    .led2 {
      background-color: rgb(${led_config[2].r}, ${led_config[2].g}, ${
    led_config[2].b
  });
      height: 50px;
      width: 50px;
    }
    .led3 {
      background-color: rgb(${led_config[3].r}, ${led_config[3].g}, ${
    led_config[3].b
  });
      height: 50px;
      width: 50px;
    }
      .led4 {
      background-color: rgb(${led_config[4].r}, ${led_config[4].g}, ${
    led_config[4].b
  });
      height: 50px;
      width: 50px;
    }
    .flex{
    display: flex;
    gap: 2rem;
      }
    .power-button {
    padding: 10px 20px;
    font-size: 16px;
    color: white;
    background-color: #007BFF;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

.power-button.off {
    background-color: #FF5733;
}

.power-button:hover {
    background-color: #0056b3;
}
  </style>





</head>
<body>


  

<div class="flex" style="width:100%;justify-content:space-around">
    <div class="flex" style="justify-content:center">
      <button id="powerButton" class="power-button">Toggle Power</button>
      <div id="response"></div>
    </div>
   
    <div style="width:25%">
    <select id="position" name="position">
    ${Object.entries(server_status.global_status.get("alarm") ?? {}).map(
      ([key, value]) => {
        if (value === "trouble") {
          return `<option value="${key}">${key}</option>`;
        }
      }
    )}
    </select>

    <button id="resetButton">Reset Alarm</button>



     <script>
            // Function to toggle power status
          async function togglePower(e) {

      e.preventDefault();
              const response = await fetch('/power', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ power: '${
            LED_POWER === "off" ? "on" : "off"
          }' }),
        });

        const message = await response.json();
        alert(message.message)

        window.location.reload();

        }

          // Add event listener to the button
          powerButton.addEventListener('click', togglePower);

    </script>

      <script>

      resetButton.addEventListener('click', async (e) => {
        const position = document.getElementById('position').value;
        const response = await fetch('/reset?name=' + position, {
          method: 'POST',
        });

        const message = await response.json();
        alert(message.message);

      window.location.reload();

      });
    </script>

  
    </div>
  </div>

  <div>

  <h1>LED Configuration</h1>
  <div class="flex">
  <div>POS 1 (Nathan): 
  <div class="led1"></div>
  </div>
  <div>POS 2 (Justin): 
  <div class="led2"></div>
  </div>
    <div>POS 3 (Austin): 
  <div class="led3"></div>
  </div>
  <div>POS 4 (Jeff): 
  <div class="led4"></div>
  </div>
  </div>
  <form id="ledForm">
    <div class="form-group">
      <label for="r">Red</label>
      <input type="number" id="r" name="r" min="0" max="255" required>
    </div>
    <div class="form-group">
      <label for="g">Green</label>
      <input type="number" id="g" name="g" min="0" max="255" required>
    </div>
    <div class="form-group">
      <label for="b">Blue</label>
      <input type="number" id="b" name="b" min="0" max="255" required>
    </div>
    <div class="form-group">
      <label for="animation">Animation</label>
      <select id="animation" name="animation" required>
        <option value="slow_pulse">Slow Pulse</option>
        <option value="strobe">Strobe</option>
        <option value="wig_wag">Wig_wag</option>
        <option value="tron">Tron</option>

        <option value="none">None</option>
      </select>
    </div>
    <div class="form-group">
      <label for="position">Position</label>
      <select id="position" name="position" required>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
      </select>
    </div>
    <button type="submit">Update Configuration</button>
  </form>
  <script>
    document.getElementById('ledForm').addEventListener('submit', async (e) => {
      
      const formData = new FormData(e.target);
      const data = {
        r: parseInt(formData.get('r')),
        g: parseInt(formData.get('g')),
        b: parseInt(formData.get('b')),
        animation: formData.get('animation'),
        position: parseInt(formData.get('position')),
      };

      const response = await fetch('/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      alert(result.message);
    });
  </script>
</body>
</html>

   
   
   `;

  return new Response(html, { headers: { "content-type": "text/html" } });
}

export async function set_power(req: Request): Promise<Response> {
  const data = (await req.json()) as { power: "on" | "off" };

  LED_POWER = data.power;

  return new Response(
    JSON.stringify({ message: `LED Power is now ${data.power}` }),
    { headers: { "content-type": "application/json" } }
  );
}

export async function set_leds_config(req: Request): Promise<Response> {
  const data = (await req.json()) as {
    r: number;
    g: number;
    b: number;
    position: number;
    animation: string;
  };

  led_config[data.position] = {
    animation: data.animation,
    color: `${data.r}, ${data.b}, ${data.g}`,
    r: data.r,
    g: data.g,
    b: data.b,
  };

  return new Response(
    JSON.stringify({ message: "Configuration updated successfully" }),
    { headers: { "content-type": "application/json" } }
  );
}

export async function reset_alarm(req: Request): Promise<Response> {
  const params = new URL(req.url).searchParams;

  const alarm_name = params.get("name");

  if (!alarm_name) {
    return new Response(JSON.stringify({ message: "Alarm name is required" }), {
      headers: { "content-type": "application/json" },
    });
  }

  if (!server_status.global_status.get("alarm")?.[alarm_name]) {
    return new Response(JSON.stringify({ message: "Alarm not found" }), {
      headers: { "content-type": "application/json" },
    });
  }

  server_status.set_alarm_status(alarm_name, "normal");

  return new Response(
    JSON.stringify({ message: `Alarm ${alarm_name} has been reset` }),
    { headers: { "content-type": "application/json" } }
  );
}
