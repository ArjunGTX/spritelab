#!/usr/bin/env node
import { Command } from "commander";
import pi from "picocolors";
import { readFile } from "fs/promises";
import { initAction } from "./actions/init.js";
import { addIconAction } from "./actions/add-icon.js";
import { removeIconAction } from "./actions/remove-icon.js";
import { createSpriteAction } from "./actions/create-sprite.js";
import { deleteSpriteAction } from "./actions/delete-sprite.js";

const main = async () => {
  const pkgFile = await readFile(new URL("../package.json", import.meta.url));
  const pkg = JSON.parse(pkgFile.toString());

  const program = new Command();
  program.version(pkg.version).name(pkg.name).description(pkg.description);

  program
    .command("init")
    .alias("i")
    .option("-y, --yes", "Skip the questions and use the default values.")
    .description("Initialize the icon library.")
    .addHelpText(
      "after",
      "\n\nInitialize the icon library by answering a few questions. This will create a sprite file, a react component, and a type definition file based on whether your project uses typescript or not.\n\nExample: npx spritelab init\n\n",
    )
    .action(initAction);
  program
    .command("add")
    .alias("a")
    .option("-n, --name <name>", "Name of the icon to be added.")
    .option(
      "-i, --icon <icon>",
      "URL or the file path of the icon to be added.",
    )
    .option(
      "-s, --sprite [sprite]",
      "Name of the sprite to add the icon to. If not provided, the icon will be added to the default sprite.",
      "default",
    )
    .description("Add an icon to a sprite.")
    .addHelpText(
      "after",
      "\n\nExample:\n\nnpx spritelab add --name bell-fill --icon 'D:\\Downloads\\icons\\bell-fill.svg' --sprite notifications\n\nor\n\nnpx spritelab add --name bell-fill --icon 'https://api.iconify.design/bi/bell-fill.svg' --sprite notifications\n\n",
    )
    .action(addIconAction);
  program
    .command("remove")
    .alias("r")
    .option("-n, --name <name>", "Name of the icon to be removed.")
    .option(
      "-s, --sprite [sprite]",
      "Name of the sprite to remove the icon from. If not provided, the icon will be removed from the default sprite if it exists.",
      "default",
    )
    .description("Remove an icon from a sprite.")
    .addHelpText(
      "after",
      "\n\nExample: npx spritelab remove --name bell-fill --sprite notifications\n\n",
    )
    .action(removeIconAction);
  program
    .command("create")
    .alias("c")
    .option("-n, --name <name>", "Name of the sprite to be created.")
    .description("Create a new sprite.")
    .addHelpText(
      "after",
      "\n\nExample: npx spritelab create --name notifications\n\n",
    )
    .action(createSpriteAction);
  program
    .command("delete")
    .alias("d")
    .option(
      "-n, --name [name]",
      "Name of the sprite to be deleted. If not provided, the default sprite will be deleted.",
      "default",
    )
    .description("Delete a sprite and all the icons within the sprite.")
    .addHelpText(
      "after",
      "\n\nExample: npx spritelab delete --name notifications\n\n",
    )
    .action(deleteSpriteAction);

  program.parse(process.argv);
};

main().catch((err) => pi.red(`Failed to execute spritelab cli: ${err}`));
