import { analyticsHandlers } from "./analyticsHandlers";
import { authHandlers } from "./authHandlers";
import { messagingHandlers } from "./messagingHandlers";
import { productHandlers } from "./productHandlers";
import { warrantyHandlers } from "./warrantyHandlers";

export const handlers = [
  ...authHandlers,
  ...productHandlers,
  ...analyticsHandlers,
  ...messagingHandlers,
  ...warrantyHandlers,
];
