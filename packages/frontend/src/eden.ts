import { treaty } from "@elysiajs/eden";
import type { App } from "../../backend/src/index";

export const eden = treaty<App>("http://localhost:3000");
