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
  // Read package.json file and get the version, name and description
  const pkgFile = await readFile(new URL("../package.json", import.meta.url));
  const pkg = JSON.parse(pkgFile.toString());

  const program = new Command();
  // Display the version, name and description of the package
  program.version(pkg.version).name(pkg.name).description(pkg.description);

  program
    .command("init")
    .description("Initialize the icon library.")
    .action(initAction);
  program
    .command("add <icon> [sprite]")
    .description("Add an icon to a sprite.")
    .addHelpText("after", "\nExample: spritelab add icon-name sprite-name")
    .action(addIconAction);
  program
    .command("remove <icon> [sprite]")
    .description("Remove an icon from a sprite.")
    .action(removeIconAction);
  program
    .command("create <sprite>")
    .description("Create a new sprite.")
    .action(createSpriteAction);
  program
    .command("delete <sprite>")
    .description("Delete a sprite and all the icons within the sprite.")
    .action(deleteSpriteAction);

  program.parse(process.argv);
};

main().catch((err) => pi.red(`Failed to execute spritelab cli: ${err}`));
