import { join } from "path";
import { CLIError, logErrorAndExit } from "../utils/error.js";
import {
  Config,
  getConfig,
  getDefaultSpriteContent,
} from "../utils/helpers.js";
import { promises as fs } from "fs";
import inquirer from "inquirer";

type CreateOptions = {
  name: string;
};

export class CreateAction {
  private config: Config | null = null;
  private options: CreateOptions | null = null;

  private validateOptions(
    options: Record<string, unknown>,
  ): asserts options is { name: string } {
    if (!options.name) {
      throw new CLIError(
        "Option 'name' is required. Please provide a name for the icon using --name.",
      );
    }
    if (!/^[a-zA-Z0-9-_/]+$/.test(options.name as string)) {
      throw new CLIError(
        "Option 'name' must contain only alphanumeric characters, '-', '_' or '/'.",
      );
    }
  }

  async createSprite() {
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
    if (spriteExists) {
      const response = await inquirer.prompt([
        {
          type: "confirm",
          name: "overwrite",
          message: `Sprite with the name '${this.options.name}' already exists. Overwrite?`,
        },
      ]);
      if (!response.overwrite) {
        throw new CLIError("Operation cancelled.", true);
      }
    }
    console.log(`Creating sprite '${this.options.name}'...`);
    await fs.writeFile(spritePath, getDefaultSpriteContent());
    console.log(
      `Sprite '${this.options.name}' created successfully.\n\nUse the following command to add an icon to the sprite:\n\nnpx spritelab add --name <icon-name> --icon <url-or-path-to-svg-file> --sprite ${this.options.name}\n`,
    );
  }

  async execute(options: Record<string, unknown>) {
    try {
      this.validateOptions(options);
      this.options = {
        name: options.name as string,
      };
      this.config = await getConfig();
      await this.createSprite();
    } catch (err) {
      logErrorAndExit(err);
    }
  }

  constructor() {
    // explicitly bind the execute method to the class instance to avoid losing the context when passing it as a callback.
    this.execute = this.execute.bind(this);
  }
}
