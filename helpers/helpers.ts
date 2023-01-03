import { ethers } from "hardhat";
import { BigNumber, BigNumberish } from "ethers";
import { request } from "graphql-request";
import { snapshotGraphUrl } from "./constants";

interface ProposalTitle {
  proposals: [
    {
      title: string;
    }
  ];
}

export async function impersonateSigner(network: any, address: string) {
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [address],
  });
  return await ethers.getSigner(address);
}

export async function fundSigner(
  network: any,
  address: string,
  amount: BigNumberish
) {
  await network.provider.request({
    method: "hardhat_setBalance",
    params: [address, ethers.utils.hexlify(amount)],
  });
}

export async function impersonateAndFundSigner(
  network: any,
  address: string,
  amount: BigNumberish = ethers.utils.parseEther("1000")
) {
  await fundSigner(network, address, amount);
  return await impersonateSigner(network, address);
}

export async function propType(id: string): Promise<"coreprop" | "sigprop"> {
  const query = `query {
    proposals( where:{
      id_in:["${id}"],
    },
    ){
  title}
  }`;
  const res: ProposalTitle = await request(snapshotGraphUrl, query);
  console.log(res.proposals[0]);

  if (res.proposals[0].title.includes("AGIP")) {
    return "coreprop";
  } else {
    return "sigprop";
  }
}
