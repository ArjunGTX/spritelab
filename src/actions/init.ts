import { promises as fs } from "fs";
import { readFile } from "fs/promises";
import inquirer from "inquirer";
import { join } from "path";
import { Constants, defaultSpriteContent } from "../utils/constants.js";
import shortUUID from "short-uuid";
import { CLIError, logErrorAndExit } from "../utils/error.js";

type Framework = "react" | "next" | "other";

type PromptResponse = {
  spritePath: string;
  componentPath: string;
  componentName: string;
  confirm: boolean;
};

export class InitAction {
  private hasTs: boolean = false;
  private framework: Framework = "other";
  private promptResponse: PromptResponse | null = null;

  // Check if the project uses TypeScript by looking for a tsconfig.json file at the root.
  private async hasTypeScript(): Promise<boolean> {
    try {
      const tsconfigPath = join(process.cwd(), "tsconfig.json");
      await fs.access(tsconfigPath);
      return true;
    } catch {
      return false;
    }
  }

  // Check if the project uses React or Next.js by looking for the respective dependencies in package.json.
  private async getFramework(): Promise<Framework> {
    try {
      const pkgPath = join(process.cwd(), "package.json");
      const pkgFile = await readFile(pkgPath);
      const pkg = JSON.parse(pkgFile.toString());
      if (pkg.dependencies.next) {
        return "next";
      }
      if (pkg.dependencies.react) {
        return "react";
      }
      return "other";
    } catch (err) {
      throw new CLIError(
        `Failed to read package.json: ${(err as Error).message}`,
      );
    }
  }

  private getDefaultSpritePath(): string {
    return this.framework === "next" || this.framework === "react"
      ? "./public/sprites"
      : "./sprites";
  }

  private async getDefaultComponentPath(): Promise<string> {
    const hasSrc = await fs
      .access(join(process.cwd(), "src"))
      .then(() => true)
      .catch(() => false);
    return hasSrc ? "./src/components/icon" : "./components/icon";
  }

  private getDefaultComponentName(): string {
    return "Icon";
  }

  private validateSpritePath(input: string): boolean | string {
    return input.startsWith("./public")
      ? true
      : "The path should be within the public directory.";
  }

  private validateComponentPath(input: string): boolean | string {
    return input.startsWith("./")
      ? true
      : "The path should be relative to the project root.";
  }

  private validateComponentName(input: string): boolean | string {
    return /^[A-Z][A-Za-z0-9]*$/.test(input)
      ? true
      : "The component name should start with an uppercase letter and contain only alphanumeric characters.";
  }

  private async generatePrompts(): Promise<PromptResponse> {
    try {
      return await inquirer.prompt([
        {
          type: "input",
          name: "spritePath",
          message: "Where would you like to save the sprites?",
          default: this.getDefaultSpritePath(),
          validate: this.validateSpritePath,
        },
        {
          type: "input",
          name: "componentPath",
          message: "Where would you like to save the component?",
          default: await this.getDefaultComponentPath(),
          validate: this.validateComponentPath,
        },
        {
          type: "input",
          name: "componentName",
          message: "What would you like to name the component?",
          default: this.getDefaultComponentName(),
          validate: this.validateComponentName,
        },
        {
          type: "confirm",
          name: "confirm",
          message: "Proceed to initialize the icon library?",
        },
      ]);
    } catch {
      throw new CLIError("Operation interrupted.", true);
    }
  }

  // Assert that the prompt response is not null.
  private assertPromptResponseExists(
    promptResponse: typeof this.promptResponse,
  ): asserts promptResponse is NonNullable<typeof this.promptResponse> {
    if (!promptResponse) {
      throw new CLIError("Prompt response is required to proceed.");
    }
  }

  // Check if the sprite and component files already exist at the specified locations and prompt the user to overwrite them.
  private async checkExistence(): Promise<void> {
    try {
      this.assertPromptResponseExists(this.promptResponse);
      const spritePath = join(
        process.cwd(),
        this.promptResponse.spritePath,
        `${Constants.defaultSpriteName}.svg`,
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
            message:
              "A sprite already exists at the specified location. Overwrite?",
          },
        ]);
        if (!response.overwrite) {
          throw new CLIError("Operation cancelled.", true);
        }
      }
      const componentPath = join(
        process.cwd(),
        this.promptResponse.componentPath,
        `${this.promptResponse.componentName}${this.hasTs ? ".tsx" : ".jsx"}`,
      );
      const componentExists = await fs
        .access(componentPath)
        .then(() => true)
        .catch(() => false);
      if (componentExists) {
        const response = await inquirer.prompt([
          {
            type: "confirm",
            name: "overwrite",
            message:
              "A component already exists at the specified location. Overwrite?",
          },
        ]);
        if (!response.overwrite) {
          throw new CLIError("Operation cancelled.", true);
        }
      }
    } catch (err) {
      throw new CLIError(
        `Failed to validate icon library: ${(err as Error).message}`,
      );
    }
  }

  private async createSprite(): Promise<void> {
    try {
      this.assertPromptResponseExists(this.promptResponse);
      console.log(`Creating sprite at ${this.promptResponse.spritePath}`);
      const spriteFolder = join(process.cwd(), this.promptResponse.spritePath);
      await fs.mkdir(spriteFolder, { recursive: true });
      const spritePath = join(
        spriteFolder,
        `${Constants.defaultSpriteName}.svg`,
      );
      await fs.writeFile(spritePath, defaultSpriteContent);
      console.log("Sprite created successfully.");
    } catch (err) {
      throw new CLIError(
        `Failed to create sprite file at path ${this.promptResponse?.spritePath}: ${(err as Error).message}`,
      );
    }
  }

  private async createComponent(): Promise<void> {
    try {
      this.assertPromptResponseExists(this.promptResponse);
      console.log(
        `Creating component at ${this.promptResponse.componentPath}...`,
      );
      const componentFolder = join(
        process.cwd(),
        this.promptResponse.componentPath,
      );
      await fs.mkdir(componentFolder, { recursive: true });
      const componentPath = join(
        componentFolder,
        `${this.promptResponse.componentName}${this.hasTs ? ".tsx" : ".jsx"}`,
      );
      await fs.writeFile(componentPath, this.generateComponentContent());
      console.log("Component created successfully.");
    } catch (err) {
      throw new CLIError(
        `Failed to create component file at path ${this.promptResponse?.componentPath}: ${(err as Error).message}`,
      );
    }
  }

  private generateComponentContent(): string {
    this.assertPromptResponseExists(this.promptResponse);
    const { componentName, spritePath } = this.promptResponse;
    const spriteLocation = spritePath.slice("./public".length) || "/";
    if (this.hasTs) {
      return [
        'import React from "react";',
        "",
        'export type IconName = "";',
        "",
        `export type ${componentName}Props = React.DetailedHTMLProps<`,
        "  React.SVGAttributes<SVGSVGElement>,",
        "  SVGSVGElement",
        "> & {",
        "  icon: IconName;",
        "};",
        "",
        `export const ${componentName} = React.forwardRef<SVGSVGElement, ${componentName}Props>(function Icon(`,
        "  { icon, ...props },",
        "  ref",
        ") {",
        '  const [sprite, iconName] = icon.split("/");',
        "  return (",
        "    <svg ref={ref} {...props}>",
        `      <use href={\`${spriteLocation}/\${sprite}.svg?v=${shortUUID.generate()}#\${iconName}\`} />`,
        "    </svg>",
        "  );",
        "});",
        "",
      ].join("\n");
    }
    return [
      'import React from "react";',
      "",
      `export const ${componentName} = React.forwardRef(function ${componentName}({ icon, ...props }, ref) {`,
      '  const [sprite, iconName] = icon.split("/");',
      "  return (",
      "    <svg ref={ref} {...props}>",
      `      <use href={\`${spriteLocation}/\${sprite}.svg?v=${shortUUID.generate()}#\${iconName}\`} />`,
      "    </svg>",
      "  );",
      "});",
      "",
    ].join("\n");
  }

  private async createConfigFile(): Promise<void> {
    this.assertPromptResponseExists(this.promptResponse);
    try {
      console.log("Creating configuration file...");
      const configPath = join(process.cwd(), Constants.configFileName);
      await fs.writeFile(
        configPath,
        [
          "{",
          `  "spritePath": "${this.promptResponse.spritePath}",`,
          `  "componentPath": "${this.promptResponse.componentPath}",`,
          `  "componentName": "${this.promptResponse.componentName}"`,
          "}",
        ].join("\n"),
      );
      console.log("Configuration file created successfully.");
    } catch (err) {
      throw new CLIError(
        `Failed to create config file at path ${Constants.configFileName}: ${(err as Error).message}`,
      );
    }
  }

  async execute(options: Record<string, unknown>): Promise<void> {
    try {
      this.hasTs = await this.hasTypeScript();
      this.framework = await this.getFramework();
      if (this.framework === "other") {
        throw new CLIError(
          "SpriteLab currently only supports React and Next.js projects. New frameworks will be added soon.",
          true,
        );
      }
      if (options.yes) {
        this.promptResponse = {
          spritePath: this.getDefaultSpritePath(),
          componentPath: await this.getDefaultComponentPath(),
          componentName: this.getDefaultComponentName(),
          confirm: true,
        };
      } else {
        this.promptResponse = await this.generatePrompts();
        if (!this.promptResponse.confirm) {
          throw new CLIError("Initialization cancelled.", true);
        }
      }
      await this.checkExistence();
      await Promise.all([
        this.createSprite(),
        this.createComponent(),
        this.createConfigFile(),
      ]);
      console.log(
        "Icon library initialized successfully.\n\nNext Steps:\n1. Add icons to your sprite using the 'add' command.\n2. Use the generated component to display icons in your project.\n",
      );
    } catch (err) {
      logErrorAndExit(err);
    }
  }

  constructor() {
    // explicitly bind the execute method to the class instance to avoid losing the context when passing it as a callback.
    this.execute = this.execute.bind(this);
  }
}
