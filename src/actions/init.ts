import { promises as fs } from "fs";
import { readFile } from "fs/promises";
import inquirer from "inquirer";
import { join } from "path";

export type Framework = "react" | "next" | "other";

export const initAction = async () => {
  const hasTS = await hasTypeScript();
  const framework = await getFramework();
  if (framework === "other") {
    console.log(
      "SpriteLab currently only supports React and Next.js projects. New frameworks will be added soon.",
    );
    process.exit(0);
  }
  const promptResponse = await generatePrompts(hasTS, framework);
  if (!promptResponse.confirm) {
    console.log("Initialization cancelled.");
    process.exit(0);
  }
};

// Check if the project has TypeScript by looking for tsconfig.json
const hasTypeScript = async () => {
  const tsconfigPath = join(process.cwd(), "tsconfig.json");
  try {
    await fs.access(tsconfigPath);
    return true;
  } catch {
    return false;
  }
};

// Retrieve the frontend framework used in the project
const getFramework = async () => {
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
};

const getDefaultSpriteLocation = (framework: Framework) => {
  if (framework === "next" || framework === "react") {
    return "./public/sprites";
  }
  return "./sprites";
};

const getDefaultComponentLocation = async () => {
  const hasSrc = await fs
    .access(join(process.cwd(), "src"))
    .then(() => true)
    .catch(() => false);
  if (hasSrc) {
    return "./src/components/icon";
  }
  return "./components/icon";
};

const getDefaultComponentName = () => {
  return "Icon";
};

const validateDirectoryPath = (input: string) => {
  if (!input.startsWith("./")) {
    return "The path should be relative to the project root.";
  }
  return true;
};

const validateComponentName = (input: string) => {
  if (!/^[$A-Z_][0-9A-Z_$]*$/i.test(input)) {
    return "The component name should be a valid JavaScript identifier.";
  }
  return true;
};

const generatePrompts = async (hasTS: boolean, framework: Framework) => {
  try {
    const response = await inquirer.prompt([
      {
        type: "input",
        name: "spriteLocation",
        message: "Where would you like to save the sprites?",
        default: getDefaultSpriteLocation(framework),
        validate: validateDirectoryPath,
      },
      {
        type: "input",
        name: "componentLocation",
        message: "Where would you like to save the component?",
        default: await getDefaultComponentLocation(),
        validate: validateDirectoryPath,
      },
      {
        type: "input",
        name: "componentName",
        message: "What would you like to name the component?",
        default: getDefaultComponentName(),
        validate: validateComponentName,
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
};
