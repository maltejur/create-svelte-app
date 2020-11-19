import prompts from "prompts";
import validFilename from "valid-filename";
import degit from "degit";
import { exec } from "child_process";
import path from "path";
import ora from "ora";
import chalk from "chalk";

(async () => {
  console.log(chalk.inverse("\n create-svelte-app "));
  console.log();
  const response = await prompts(
    [
      {
        type: "text",
        name: "name",
        message: "Project name",
        validate: validFilename,
        initial: "my-svelte-app",
      },
      {
        type: "select",
        name: "type",
        message: "Project type",
        choices: [
          { title: "svelte", value: "svelte" },
          { title: "sapper", value: "sapper" },
        ],
      },
      {
        type: "select",
        name: "bundler",
        message: "Bundler",
        choices: [
          { title: "rollup", value: "rollup" },
          { title: "webpack", value: "webpack" },
        ],
      },
      {
        type: (previous) => (previous == "rollup" ? "confirm" : null),
        name: "typescript",
        message: "Use Typescript?",
        initial: true,
      },
      {
        type: "select",
        name: "packageManager",
        message: "Package manager",
        choices: [
          { title: "yarn", value: "yarn" },
          { title: "npm", value: "npm" },
        ],
      },
    ],
    {
      onCancel: () => {
        console.log();
        process.exit(1);
      },
    }
  );

  console.log();

  let template;
  if (response.type == "svelte" && response.bundler == "rollup")
    template = "sveltejs/template";
  else if (response.type == "svelte" && response.bundler == "webpack")
    template = "sveltejs/template-webpack";
  else if (response.type == "sapper" && response.bundler == "rollup")
    template = "sveltejs/sapper-template#rollup";
  else if (response.type == "sapper" && response.bundler == "webpack")
    template = "sveltejs/sapper-template#webpack";

  await cloneTemplate(template, response.name);
  process.chdir(response.name);
  if (response.typescript) await setupTypeScript();
  await installPackages(response.packageManager);

  console.log("\nDone!");
  console.log("\nTo start your app:\n");
  console.log(` ${chalk.cyan("cd")} ${response.name}`);
  console.log(` ${chalk.cyan("yarn")} dev`);
  console.log();
})();

async function cloneTemplate(template: string, folder: string) {
  const spinner = ora(`Cloning ${template}`).start();
  return new Promise((resolve, reject) => {
    degit(template, {})
      .clone(folder)
      .then(() => {
        spinner.succeed();
        resolve();
      })
      .catch((error) => {
        spinner.fail(`Error while cloning repo (${error.toString()})`);
        process.exit(0);
      });
  });
  // console.log(`git clone https://github.com/${template} ${folder}`);
  // exec(`git clone https://github.com/${template} ${folder}`);
  // spinner.succeed();
}

async function setupTypeScript() {
  const spinner = ora(`Setting up TypeScript`).start();
  await execAsync(`node ${path.join("scripts", "setupTypeScript.js")}`);
  spinner.succeed();
}

async function installPackages(packageManager: string) {
  const spinner = ora(`Installing packages`).start();
  switch (packageManager) {
    case "yarn":
      await execAsync(`yarn`);
      break;

    case "npm":
      await execAsync(`npm i`);
      break;

    default:
      await execAsync(`npm i`);
      break;
  }
  spinner.succeed();
}

async function execAsync(command: string) {
  return new Promise((resolve) => {
    exec(command, () => resolve());
  });
}
