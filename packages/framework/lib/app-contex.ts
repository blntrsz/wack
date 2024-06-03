import { Context } from "./context.js";

interface AppContext {
  env: string;
}

const AppContext = Context.create<AppContext>("app");

export const useApp = AppContext.use;
export const withApp = AppContext.with;
