// id - 5 (snow camo pants) and 66 (future wizard visor)

import { run } from "hardhat";
import { updateSvgTaskForSvgType } from "../../scripts/svgHelperFunctions";

async function main() {
  const ids = [5, 66];

  const fixLeft = await updateSvgTaskForSvgType(ids, "left");
  const fixBack = await updateSvgTaskForSvgType(ids, "back");

  await run("updateSvgs", fixLeft);
  await run("updateSvgs", fixBack);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.visorAndSnCmPantsFix = main;
