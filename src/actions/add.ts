import { logErrorAndExit } from "../utils/error.js";

export class AddAction {
  execute(options: Record<string, unknown>) {
    try {
      console.log(options);
    } catch (err) {
      logErrorAndExit(err);
    }
  }

  constructor() {
    // explicitly bind the execute method to the class instance to avoid losing the context when passing it as a callback.
    this.execute = this.execute.bind(this);
  }
}
