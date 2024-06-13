// run with: node main.mjs
import { computeName } from "./utils.mjs";

const name = process.argv[2];
function main() {
  const bg = computeName({ name });
  console.log(bg);
}

main();
