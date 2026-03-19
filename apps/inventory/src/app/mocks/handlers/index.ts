import { authHandlers } from "./authHandlers";
import { productHandlers } from "./productHandlers";
import { analyticsHandlers } from "./analyticsHandlers";
import { campaignHandlers } from "./campaignHandlers";
import { messagingHandlers } from "./messagingHandlers";
import { warrantyHandlers } from "./warrantyHandlers";

export const handlers = [
  ...authHandlers,
  ...productHandlers,
  ...analyticsHandlers,
  ...campaignHandlers,
  ...messagingHandlers,
  ...warrantyHandlers,
];
