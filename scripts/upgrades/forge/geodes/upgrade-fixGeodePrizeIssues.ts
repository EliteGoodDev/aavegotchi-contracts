import { ethers, network, run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../../tasks/deployUpgrade";

import {
  maticForgeDiamond,
  mumbaiForgeDiamond,
  diamondOwner,
  impersonate,
} from "../../../helperFunctions";
import { ForgeDAOFacet, ForgeDAOFacet__factory } from "../../../../typechain";
import { ForgeDAOFacetInterface } from "../../../../typechain/ForgeDAOFacet";

const isMumbai = false;

export async function upgradeForgeGeodeFix() {
  console.log("Upgrading Forge facets for Geodes.");

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName:
        "contracts/Aavegotchi/ForgeDiamond/facets/ForgeDAOFacet.sol:ForgeDAOFacet",
      addSelectors: ["function tempFixQuantity() external"],
      removeSelectors: [],
    },

    {
      facetName:
        "contracts/Aavegotchi/ForgeDiamond/facets/ForgeVRFFacet.sol:ForgeVRFFacet",
      addSelectors: [],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const owner = await diamondOwner(maticForgeDiamond, ethers);

  const iface: ForgeDAOFacetInterface = new ethers.utils.Interface(
    ForgeDAOFacet__factory.abi
  ) as ForgeDAOFacetInterface;
  const calldata = iface.encodeFunctionData("tempFixQuantity");
  const args: DeployUpgradeTaskArgs = {
    diamondAddress: isMumbai ? mumbaiForgeDiamond : maticForgeDiamond,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
    freshDeployment: false,
    diamondOwner: owner,
    initAddress: maticForgeDiamond,
    initCalldata: calldata,
  };

  await run("deployUpgrade", args);

  console.log("Finished Fixing and resetting.");

  console.log("removing temp function");
  const facets2: FacetsAndAddSelectors[] = [
    {
      facetName:
        "contracts/Aavegotchi/ForgeDiamond/facets/ForgeDAOFacet.sol:ForgeDAOFacet",
      addSelectors: [],
      removeSelectors: ["function tempFixQuantity() external"],
    },
  ];

  const joined2 = convertFacetAndSelectorsToString(facets2);
  const args2: DeployUpgradeTaskArgs = {
    diamondAddress: isMumbai ? mumbaiForgeDiamond : maticForgeDiamond,
    facetsAndAddSelectors: joined2,
    useLedger: false,
    useMultisig: false,
    freshDeployment: false,
    diamondOwner: owner,
  };
  await run("deployUpgrade", args2);
  console.log("Removed temp function");
}

if (require.main === module) {
  upgradeForgeGeodeFix()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}