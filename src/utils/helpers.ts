import { readFile } from "fs/promises";
import { join } from "path";
import { Constants } from "./constants.js";
import { CLIError } from "./error.js";
import { promises as fs } from "fs";

export type Config = {
  spritePath: string;
  componentPath: string;
  componentName: string;
};

export const validateConfig = (config: Record<string, unknown>): Config => {
  const { spritePath, componentPath, componentName } = config;
  if (!spritePath || typeof spritePath !== "string") {
    throw new CLIError(
      `The configuration file must contain a 'spritePath' property of type string.`,
    );
  }
  if (!componentPath || typeof componentPath !== "string") {
    throw new CLIError(
      `The configuration file must contain a 'componentPath' property of type string.`,
    );
  }
  if (!componentName || typeof componentName !== "string") {
    throw new CLIError(
      `The configuration file must contain a 'componentName' property of type string.`,
    );
  }
  return config as Config;
};

export const getConfig = async (): Promise<Config> => {
  const configPath = join(process.cwd(), Constants.configFileName);
  const configExists = await fs
    .access(configPath)
    .then(() => true)
    .catch(() => false);
  if (!configExists) {
    throw new CLIError(
      `The configuration file '${Constants.configFileName}' does not exist in the current directory. Please run 'npx spritelab init' to create the configuration file.`,
    );
  }
  const configFile = await readFile(configPath);
  const config = JSON.parse(configFile.toString()) as Record<string, unknown>;
  return validateConfig(config);
};
