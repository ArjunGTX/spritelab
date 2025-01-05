import { join } from "path";
import { CLIError, logErrorAndExit } from "../utils/error.js";
import {
  Config,
  getComponentContent,
  getConfig,
  hasTypeScript,
} from "../utils/helpers.js";
import { readFile } from "fs/promises";
import { promises as fs } from "fs";
import { parse } from "node-html-parser";
import inquirer from "inquirer";

type AddOptions = {
  name: string;
  icon: string;
  sprite: string;
};

export class AddAction {
  private config: Config | null = null;
  private options: AddOptions | null = null;

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
    if (!options.icon) {
      throw new CLIError(
        "Option 'icon' is required. Please provide the icon using --icon.",
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

  private async getIconContent(): Promise<string> {
    if (!this.options) {
      throw new CLIError("Options not found.");
    }
    if (this.options.icon.startsWith("http")) {
      const response = await fetch(this.options.icon);
      if (!response.ok) {
        throw new CLIError(
          `Failed to fetch the icon from the provided URL: ${this.options.icon}. Please make sure the URL points to a valid SVG icon.`,
        );
      }
      return await response.text();
    }
    const iconContent = await readFile(this.options.icon, "utf-8");
    return iconContent;
  }

  private generateSvgSymbol(iconContent: string) {
    if (!this.options) {
      throw new CLIError("Options not found.");
    }
    const iconRoot = parse(iconContent);
    const svg = iconRoot.querySelector("svg");
    if (!svg) {
      throw new CLIError("The icon must contain an SVG element.");
    }
    svg.tagName = "symbol";
    svg.setAttribute("id", this.options.name);
    svg.removeAttribute("xmlns");
    svg.removeAttribute("xmlns:xlink");
    svg.removeAttribute("version");
    svg.removeAttribute("width");
    svg.removeAttribute("height");
    return svg;
  }

  private async updateComponent() {
    if (!(await hasTypeScript())) {
      return;
    }
    if (!this.options) {
      throw new CLIError("Options not found.");
    }
    if (!this.config) {
      throw new CLIError("Config not found.");
    }
    console.log(`Updating '${this.config.componentName}' component...`);
    const componentPath = join(
      process.cwd(),
      this.config.componentPath,
      `${this.config.componentName}.tsx`,
    );
    const componentContent = await getComponentContent(
      this.config.componentName,
      this.config.spritePath,
    );
    await fs.writeFile(componentPath, componentContent);
    console.log(
      `Component '${this.config.componentName}' updated successfully.`,
    );
  }

  private async addIconToSprite() {
    if (!this.options) {
      throw new CLIError("Options not found.");
    }
    console.log(
      `Adding icon '${this.options.name}' to the sprite '${this.options.sprite}'...`,
    );
    const spritePath = this.getSpritePath();
    const spriteContent = await this.getSpriteContent();
    const spriteRoot = parse(spriteContent);
    const defs = spriteRoot.querySelector("defs");
    const existingIcon = defs?.getElementById(this.options.name);
    if (existingIcon) {
      const response = await inquirer.prompt([
        {
          type: "confirm",
          name: "overwrite",
          message: `The icon '${this.options.name}' already exists in the sprite '${this.options.sprite}'. Overwrite?`,
        },
      ]);
      if (response.overwrite) {
        defs?.removeChild(existingIcon);
      } else {
        throw new CLIError("Operation cancelled.", true);
      }
    }
    const iconContent = await this.getIconContent();
    defs?.appendChild(this.generateSvgSymbol(iconContent));
    await fs.writeFile(spritePath, spriteRoot.toString());
    console.log(
      `Icon '${this.options.name}' added to the sprite '${this.options.sprite}'.`,
    );
  }

  async execute(options: Record<string, unknown>) {
    try {
      this.validateOptions(options);
      this.options = {
        name: options.name as string,
        icon: options.icon as string,
        sprite: options.sprite as string,
      };
      this.config = await getConfig();
      await this.addIconToSprite();
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
