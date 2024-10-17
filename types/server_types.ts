export type ClientSessionInfo = Map<
  string,
  { purpose: string; time_connected: string }
>;

export type GlobalStatuses<SupportedStrings, SupportedTypes> = Map<
  SupportedStrings,
  SupportedTypes
>;

export type SupportedStatusStrings = "alarm";

export type AlarmStatus = { [x: string]: "trouble" | "normal" };

export type SupportedStatusTypes = AlarmStatus;

export type BotPayload = {
  bot_name: string;
  token: string;
  type: string;
};
