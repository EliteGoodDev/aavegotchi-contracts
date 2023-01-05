import { LedgerSigner } from "@anders-t/ethers-ledger";
import { BigNumber, Signer } from "ethers";
import { ethers, network } from "hardhat";
import { DAOFacet, OwnershipFacet } from "../typechain";
import { impersonate, maticDiamondAddress } from "./helperFunctions";

async function main() {
  let signer: Signer = new LedgerSigner(ethers.provider);
  let diamond = (await ethers.getContractAt(
    "OwnershipFacet",
    maticDiamondAddress
  )) as OwnershipFacet;
  if (network.name === "hardhat") {
    const owner = await diamond.owner();
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [owner],
    });
    signer = await ethers.provider.getSigner(owner);
  }

  if (network.name === "matic") {
    signer = (await ethers.getSigners())[0];
  }

  const defenderRelayer = "0xb6384935d68e9858f8385ebeed7db84fc93b1420";
  const limit = BigNumber.from("100");

  console.log("Making the relayer a gameManager " + maticDiamondAddress);

  let daoFacet = (await ethers.getContractAt(
    "DAOFacet",
    maticDiamondAddress,
    signer
  )) as DAOFacet;

  if (network.name === "hardhat") {
    diamond = await impersonate(
      await diamond.owner(),
      diamond,
      ethers,
      network
    );
  }

  const tx = await daoFacet.addGameManagers([defenderRelayer], [limit]);
  const tx2 = await tx.wait();
  console.log("Transaction hash: " + tx2.transactionHash);
  console.log("Relayer added as game manager");
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
