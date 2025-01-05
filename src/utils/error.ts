export class CLIError extends Error {
  public silent: boolean = false;
  constructor(message: string, silent?: boolean) {
    super(message);
    this.name = "CLIError";
    this.silent = !!silent;
  }
}
