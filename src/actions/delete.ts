import { join } from "path";
import { CLIError, logErrorAndExit } from "../utils/error.js";
import { Config, getConfig, updateComponentContent } from "../utils/helpers.js";
import { promises as fs } from "fs";

type DeleteOptions = {
  name: string;
};

export class DeleteAction {
  private config: Config | null = null;
  private options: DeleteOptions | null = null;

  private validateOptions(
    options: Record<string, unknown>,
  ): asserts options is { name: string } {
    if (options.name && !/^[a-zA-Z0-9-_/]+$/.test(options.name as string)) {
      throw new CLIError(
        "Option 'name' must contain only alphanumeric characters, '-', '_' or '/'.",
      );
    }
  }

  async deleteSprite() {
    if (!this.config) {
      throw new CLIError("Configuration not found.");
    }
    if (!this.options) {
      throw new CLIError("Options not found.");
    }
    const spritePath = join(
      process.cwd(),
      this.config.spritePath,
      `${this.options.name}.svg`,
    );
    const spriteExists = await fs
      .access(spritePath)
      .then(() => true)
      .catch(() => false);
    if (!spriteExists) {
      throw new CLIError(
        `Sprite '${this.options.name}' does not exist, nothing to delete.`,
        true,
      );
    }
    await fs.unlink(spritePath);
    console.log(`Sprite '${this.options.name}' deleted successfully.`);
  }

  private async updateComponent() {
    if (!this.options) {
      throw new CLIError("Options not found.");
    }
    if (!this.config) {
      throw new CLIError("Config not found.");
    }
    console.log(`Updating '${this.config.componentName}' component...`);
    await updateComponentContent(this.config);
    console.log(
      `Component '${this.config.componentName}' updated successfully.`,
    );
  }

  async execute(options: Record<string, unknown>) {
    try {
      this.validateOptions(options);
      this.options = {
        name: options.name as string,
      };
      this.config = await getConfig();
      await this.deleteSprite();
      await this.updateComponent();
    } catch (err) {
      logErrorAndExit(err);
    }
  }

  constructor() {
    // explicitly bind the execute method to the class instance to avoid losing the context when passing it as a callback.
    this.execute = this.execute.bind(this);
  }
}
