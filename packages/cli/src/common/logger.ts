import chalk from "chalk";

export default class Logger {
  warn(msg: string) {
    console.log(chalk.yellow.bold(msg));
  }

  error(msg: string) {
    console.log(chalk.red.bold(msg));
  }

  info(msg: string) {
    console.log(chalk.white(msg));
  }

  success(msg: string) {
    console.log(chalk.green(msg));
  }
}
