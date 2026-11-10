import { USE_MOCK } from "../config";
import { realApi } from "./real";
import { mockApi } from "./mock";

// The whole app talks to the backend only through this object.
export const api = USE_MOCK ? mockApi : realApi;
