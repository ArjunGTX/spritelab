export class CLIError extends Error {
  public silent: boolean = false;
  constructor(message: string, silent?: boolean) {
    super(message);
    this.name = "CLIError";
    this.silent = !!silent;
  }
}

export const logErrorAndExit = (err: unknown) => {
  if (err instanceof CLIError) {
    if (!err.silent) {
      console.error(err.message);
      process.exit(1);
    }
    console.log(err.message);
    process.exit(0);
  }
  console.error(`An unexpected error occurred: ${(err as Error).message}`);
  process.exit(1);
};
