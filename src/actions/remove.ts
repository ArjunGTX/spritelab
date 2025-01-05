import { join } from "path";
import { CLIError, logErrorAndExit } from "../utils/error.js";
import { Config, getConfig, updateComponentContent } from "../utils/helpers.js";
import { readFile } from "fs/promises";
import { promises as fs } from "fs";
import { parse } from "node-html-parser";

type RemoveOptions = {
  name: string;
  sprite: string;
};

export class RemoveAction {
  private config: Config | null = null;
  private options: RemoveOptions | null = null;

  private validateOptions(
    options: Record<string, unknown>,
  ): asserts options is { name: string; icon: string; sprite: string } {
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
    if (options.sprite && !/^[a-zA-Z0-9-_/]+$/.test(options.sprite as string)) {
      throw new CLIError(
        "Option 'sprite' must contain only alphanumeric characters, '-' or '_'.",
      );
    }
  }

  private getSpritePath() {
    if (!this.config) {
      throw new CLIError("Configuration not found.");
    }
    if (!this.options) {
      throw new CLIError("Options not found.");
    }
    return join(
      process.cwd(),
      this.config.spritePath,
      `${this.options.sprite}.svg`,
    );
  }

  private async getSpriteContent() {
    if (!this.options) {
      throw new CLIError("Options not found.");
    }
    const spritePath = this.getSpritePath();
    const spriteExists = await fs
      .access(spritePath)
      .then(() => true)
      .catch(() => false);
    if (!spriteExists) {
      if (this.options.sprite === "default") {
        throw new CLIError(
          `The default sprite does not exist at '${this.config?.spritePath}', please run 'npx spritelab init' to create the default sprite.`,
        );
      }
      throw new CLIError(
        `The sprite '${this.options.sprite}' does not exist at '${this.config?.spritePath}'. please run 'npx spritelab create --name ${this.options.sprite}' to create the sprite.`,
      );
    }
    return await readFile(spritePath, "utf-8");
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

  private async removeIconFromSprite() {
    if (!this.options) {
      throw new CLIError("Options not found.");
    }
    console.log(
      `removing icon '${this.options.name}' from the sprite '${this.options.sprite}'...`,
    );
    const spritePath = this.getSpritePath();
    const spriteContent = await this.getSpriteContent();
    const spriteRoot = parse(spriteContent);
    const defs = spriteRoot.querySelector("defs");
    const existingIcon = defs?.getElementById(this.options.name);
    if (!existingIcon) {
      throw new CLIError(
        `Icon '${this.options.name}' does not exist in the sprite '${this.options.sprite}', nothing to remove.`,
      );
    }
    existingIcon.remove();
    await fs.writeFile(spritePath, spriteRoot.toString());
    console.log(
      `Icon '${this.options.name}' removed from the sprite '${this.options.sprite}'.`,
    );
  }

  async execute(options: Record<string, unknown>) {
    try {
      this.validateOptions(options);
      this.options = {
        name: options.name as string,
        sprite: options.sprite as string,
      };
      this.config = await getConfig();
      await this.removeIconFromSprite();
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
