import { promises as fs } from "fs";
import { readFile } from "fs/promises";
import inquirer from "inquirer";
import { join } from "path";
import { Constants } from "../utils/constants.js";

type Framework = "react" | "next" | "other";

type PromptResponse = {
  spriteLocation: string;
  componentLocation: string;
  componentName: string;
  confirm: boolean;
};

export class InitAction {
  private hasTs: boolean = false;
  private framework: Framework = "other";
  private promptResponse: PromptResponse | null = null;

  // Check if the project uses TypeScript by looking for a tsconfig.json file at the root.
  private async hasTypeScript() {
    try {
      const tsconfigPath = join(process.cwd(), "tsconfig.json");
      await fs.access(tsconfigPath);
      return true;
    } catch {
      return false;
    }
  }

  // Check if the project uses React or Next.js by looking for the respective dependencies in package.json.
  private async getFramework() {
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
      const error = err as Error;
      console.log(`Failed to read package.json: ${error.message}`);
      process.exit(1);
    }
  }

  private getDefaultSpriteLocation() {
    if (this.framework === "next" || this.framework === "react") {
      return "./public/sprites";
    }
    return "./sprites";
  }

  private async getDefaultComponentLocation() {
    const hasSrc = await fs
      .access(join(process.cwd(), "src"))
      .then(() => true)
      .catch(() => false);
    if (hasSrc) {
      return "./src/components/icon";
    }
    return "./components/icon";
  }

  private getDefaultComponentName() {
    return "Icon";
  }

  private validateDirectoryPath(input: string) {
    if (!input.startsWith("./")) {
      return "The path should be relative to the project root.";
    }
    return true;
  }

  private validateComponentName(input: string) {
    if (!/^[$A-Z_][0-9A-Z_$]*$/i.test(input)) {
      return "The component name should be a valid JavaScript identifier.";
    }
    return true;
  }

  private async generatePrompts() {
    try {
      const response = await inquirer.prompt([
        {
          type: "input",
          name: "spriteLocation",
          message: "Where would you like to save the sprites?",
          default: this.getDefaultSpriteLocation(),
          validate: this.validateDirectoryPath,
        },
        {
          type: "input",
          name: "componentLocation",
          message: "Where would you like to save the component?",
          default: await this.getDefaultComponentLocation(),
          validate: this.validateDirectoryPath,
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
      return response;
    } catch (err) {
      console.log("Operation interrupted.");
      process.exit(0);
    }
  }

  // Assert that the prompt response is not null.
  private assertPromptResponseExists(
    promptResponse: typeof this.promptResponse,
  ): asserts promptResponse is NonNullable<typeof this.promptResponse> {
    if (!promptResponse) {
      console.log("Prompt response is required to proceed.");
      process.exit(1);
    }
  }

  // Check if the sprite and component files already exist at the specified locations and prompt the user to overwrite them.
  private async checkExistence() {
    try {
      this.assertPromptResponseExists(this.promptResponse);
      const spritePath = join(
        process.cwd(),
        this.promptResponse.spriteLocation,
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
          console.log("Operation cancelled.");
          process.exit(0);
        }
      }
      const componentPath = join(
        process.cwd(),
        this.promptResponse.componentLocation,
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
          console.log("Operation cancelled.");
          process.exit(0);
        }
      }
    } catch (err) {
      const error = err as Error;
      console.log(`Failed to validate icon library: ${error.message}`);
      process.exit(1);
    }
  }

  private async createSprite() {
    try {
      this.assertPromptResponseExists(this.promptResponse);
      console.log(`Creating sprite at ${this.promptResponse.spriteLocation}`);
      const spriteFolder = join(
        process.cwd(),
        this.promptResponse.spriteLocation,
      );
      await fs.mkdir(spriteFolder, { recursive: true });
      const spritePath = join(
        spriteFolder,
        `${Constants.defaultSpriteName}.svg`,
      );
      await fs.writeFile(
        spritePath,
        "<svg xmlns='http://www.w3.org/2000/svg'></svg>",
      );
      console.log("Sprite created successfully.");
    } catch (err) {
      const error = err as Error;
      console.log(
        `Failed to create sprite file at path ${this.promptResponse?.spriteLocation}: ${error.message}`,
      );
      process.exit(1);
    }
  }

  private async createComponent() {
    try {
      this.assertPromptResponseExists(this.promptResponse);
      console.log(
        `Creating component at ${this.promptResponse.componentLocation}...`,
      );
      const componentFolder = join(
        process.cwd(),
        this.promptResponse.componentLocation,
      );
      await fs.mkdir(componentFolder, { recursive: true });
      const componentPath = join(
        componentFolder,
        `${this.promptResponse.componentName}${this.hasTs ? ".tsx" : ".jsx"}`,
      );
      await fs.writeFile(componentPath, `import React from "react"`);
      console.log("Component created successfully.");
    } catch (err) {
      const error = err as Error;
      console.log(
        `Failed to create component file at path ${this.promptResponse?.componentLocation}: ${error.message}`,
      );
      process.exit(1);
    }
  }

  async execute(options: Record<string, unknown>) {
    this.hasTs = await this.hasTypeScript();
    this.framework = await this.getFramework();
    if (this.framework === "other") {
      console.log(
        "SpriteLab currently only supports React and Next.js projects. New frameworks will be added soon.",
      );
      process.exit(0);
    }
    if (options.yes) {
      this.promptResponse = {
        spriteLocation: this.getDefaultSpriteLocation(),
        componentLocation: await this.getDefaultComponentLocation(),
        componentName: this.getDefaultComponentName(),
        confirm: true,
      };
    } else {
      this.promptResponse = await this.generatePrompts();
      if (!this.promptResponse.confirm) {
        console.log("Initialization cancelled.");
        process.exit(0);
      }
    }
    await this.checkExistence();
    await this.createSprite();
    await this.createComponent();
    console.log(
      "Icon library initialized successfully.\n\nNext Steps:\n1. Add icons to your sprite using the 'add' command.\n2. Use the generated component to display icons in your project.\n",
    );
  }

  constructor() {
    // explicitly bind the execute method to the class instance to avoid losing the context when passing it as a callback.
    this.execute = this.execute.bind(this);
  }
}
