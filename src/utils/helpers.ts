import { readFile } from "fs/promises";
import { join } from "path";
import { Constants } from "./constants.js";
import { CLIError } from "./error.js";
import { promises as fs } from "fs";
import shortUUID from "short-uuid";
import { glob } from "glob";
import { parse } from "node-html-parser";

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

// Generate the IconName type of the form sprite/icon-name based on the icons in the sprite files
export const generateIconType = async (spritePath: string) => {
  const spritePaths = glob.sync(`${spritePath}/*.svg`);

  const getSpriteName = (path: string) => path.split("\\").pop()?.split(".")[0];
  const iconNames: Record<string, string[]> = spritePaths.reduce<
    Record<string, string[]>
  >((acc, path) => {
    const spriteName = getSpriteName(path);
    if (spriteName) {
      acc[spriteName] = [];
    }
    return acc;
  }, {});
  for (const path of spritePaths) {
    const content = await readFile(path);
    const root = parse(content.toString());
    const spriteName = getSpriteName(path);
    if (!spriteName) {
      continue;
    }
    const symbols = root.querySelectorAll("symbol");
    for (const symbol of symbols) {
      const iconName = symbol.getAttribute("id");
      if (!iconName) {
        continue;
      }
      iconNames[spriteName]?.push(iconName);
    }
  }

  const types = Object.entries(iconNames).reduce<string[]>(
    (acc, [sprite, icons]) => {
      const spriteType = icons.map((icon) => `"${sprite}/${icon}"`);
      acc.push(...spriteType);
      return acc;
    },
    [],
  );
  return types.join(" | ") || '""';
};

export const getComponentContent = async (
  componentName: string,
  spritePath: string,
) => {
  const hasTs = await hasTypeScript();
  const spriteLocation = spritePath.slice("./public".length) || "/";
  if (hasTs) {
    return [
      'import React from "react";',
      "",
      `export type IconName = ${await generateIconType(spritePath)};`,
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
  const output = [
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
  ];
  const pkg = await getPackage();
  const propTypes =
    pkg.dependencies["prop-types"] || pkg.devDependencies["prop-types"];
  if (propTypes) {
    output.splice(
      1,
      0,
      'import PropTypes from "prop-types";',
      "",
      `${componentName}.propTypes = {`,
      "  icon: PropTypes.string.isRequired,",
      "};",
    );
  }

  return output.join("\n");
};

export const hasTypeScript = async () => {
  try {
    const tsconfigPath = join(process.cwd(), "tsconfig.json");
    await fs.access(tsconfigPath);
    return true;
  } catch {
    return false;
  }
};

export const getPackage = async () => {
  const pkgPath = join(process.cwd(), "package.json");
  const pkgFile = await readFile(pkgPath);
  const pkg = JSON.parse(pkgFile.toString());
  return pkg;
};

export const getFramework = async () => {
  try {
    const pkg = await getPackage();
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
};

export const getDefaultSpriteContent = () => {
  return [
    "<?xml version='1.0' encoding='UTF-8'?>",
    "<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'>",
    "<defs>",
    "</defs>",
    "</svg>",
    "",
  ].join("\n");
};

export const updateComponentContent = async (config: Config) => {
  const hasTs = await hasTypeScript();
  const componentPath = join(
    process.cwd(),
    config.componentPath,
    `${config.componentName}.${hasTs ? "tsx" : "jsx"}`,
  );
  const componentContent = await getComponentContent(
    config.componentName,
    config.spritePath,
  );
  await fs.writeFile(componentPath, componentContent);
};
