FROM denoland/deno

ENV PORT=${PORT}
ENV ALARM_TOKEN=${ALARM_TOKEN}

EXPOSE ${PORT}

WORKDIR /app

ADD . /app

RUN deno cache main.ts

CMD ["run", "--allow-all", "main.ts"]
