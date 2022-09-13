import { Signer } from "ethers";
import { run, ethers, network } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import {
  AavegotchiFacet__factory,
  DiamondCutFacet,
  OwnershipFacet,
} from "../../typechain";
import { AavegotchiFacetInterface } from "../../typechain/AavegotchiFacet";
import { WearableDiamond__factory } from "../../typechain/factories/WearableDiamond__factory";

//import { ItemsFacetInterface } from "../../typechain/ItemsFacet";
import {
  gasPrice,
  getSelectors,
  maticDiamondAddress,
} from "../helperFunctions";
import { FacetCutAction } from "../libraries/diamond/diamond";

const diamondUpgrader = "0x35fe3df776474a7b24b3b1ec6e745a830fdad351";

//these already deployed facets(in the aavegotchi diamond) are added to the wearableDiamond directly
const aavegotchiCutFacet = "0x4f908Fa47F10bc2254dae7c74d8B797C1749A8a6";
const aavegotchiLoupeFacet = "0x58f64b56B1e15D8C932c51287d814EDaa8d6feb9";
const aavegotchiOwnerShipFacet = "0xAE7DF9f59FEc446903c64f21a76d039Bc81712ef";

let periphery: string;

//includes upgrades for AavegotchiFacet,BridgeFacet and DAOFacet
export async function upgrade1() {
  console.log("executing upgrade 1");

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName:
        "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      addSelectors: [
        "function setPeriphery(address _periphery) external",
        "function removeInterface() external",
      ],
      removeSelectors: [],
    },
    {
      facetName: "contracts/Aavegotchi/facets/BridgeFacet.sol:BridgeFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "DAOFacet",
      addSelectors: [],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  let iface: AavegotchiFacetInterface = new ethers.utils.Interface(
    AavegotchiFacet__factory.abi
  ) as AavegotchiFacetInterface;
  //@ts-ignore
  const calldata = iface.encodeFunctionData("addInterfaces", []);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: maticDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
    initAddress: maticDiamondAddress,
    initCalldata: calldata,
  };

  await run("deployUpgrade", args);
}

//includes upgrades for ERC1155MarketplaceFacet,ItemsFacet and ItemsTransferFacet
//also deploys the wearable diamond and sets the address in the aavegotchi diamond
export async function upgrade2() {
  console.log("-------------------------");
  console.log("executing upgrade 2");

  periphery = await deployWearableDiamond();

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "ERC1155MarketplaceFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
      addSelectors: [],
      removeSelectors: [
        "function findWearableSets(uint256[] calldata _wearableIds) external view returns (uint256[] memory wearableSetIds_)",
        "function totalWearableSets() external view returns (uint256)",
        "function getWearableSet(uint256 _index) public view returns((string name,uint8[] allowedCollaterals,uint16[] wearableIds,int8[5] traitsBonuses) memory wearableSet_)",
        "function getWearableSets() external view returns((string name,uint8[] allowedCollaterals,uint16[] wearableIds,int8[5] traitsBonuses)[] memory wearableSets_)",
      ],
    },
    {
      facetName: "ItemsTransferFacet",
      addSelectors: [],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  //set the wearable diamond address
  let iface: AavegotchiFacetInterface = new ethers.utils.Interface(
    AavegotchiFacet__factory.abi
  ) as AavegotchiFacetInterface;
  //@ts-ignore
  const calldata = iface.encodeFunctionData("setPeriphery", [periphery]);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: maticDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
    initAddress: maticDiamondAddress,
    initCalldata: calldata,
  };

  await run("deployUpgrade", args);
}

//this includes upgrades to the wearable Diamond
//adds the WearableFacet and EventHandlerFacet
export async function upgrade3() {
  console.log("-------------------------");
  console.log("executing upgrade 3");

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "WearablesFacet",
      addSelectors: [
        "function balanceOf(address _owner, uint256 _id) external view returns (uint256 balance_)",
        "function balanceOfBatch(address[] calldata _owners, uint256[] calldata _ids) external view returns (uint256[] memory bals)",
        "function uri(uint256 _id) external view returns (string memory)",
        "function isApprovedForAll(address _owner, address _operator) external view returns (bool approved_)",
        "function symbol() external pure returns (string memory)",
        "function name() external pure returns (string memory)",
        "function setApprovalForAll(address _operator, bool _approved) external",
        "function setBaseURI(string memory _value) external",
        "function safeTransferFrom(address _from,address _to,uint256 _id,uint256 _value,bytes calldata _data) external",
        "function safeBatchTransferFrom(address _from,address _to,uint256[] calldata _ids,uint256[] calldata _values,bytes calldata _data) external",
      ],
      removeSelectors: [],
    },

    {
      facetName: "EventHandlerFacet",
      addSelectors: [
        "function emitApprovalEvent(address _account,address _operator,bool _approved) external",
        "function emitUriEvent(string memory _value, uint256 _id) external",
        "function emitTransferSingleEvent(address _operator,address _from,address _to,uint256 _id,uint256 _value) external",
        "function emitTransferBatchEvent(address _operator,address _from,address _to,uint256[] calldata _ids,uint256[] calldata _values) external",
      ],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: periphery,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
  };

  await run("deployUpgrade", args);
}

//includes upgrades for the ShopFacet, VoucherMigrationFacet and PeripheryFacet
export async function upgrade4() {
  console.log("-------------------------");
  console.log("executing upgrade 4");

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "ShopFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "VoucherMigrationFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "PeripheryFacet",
      addSelectors: [
        "function peripheryBalanceOf(address _owner, uint256 _id) external view returns (uint256 balance_)",
        "function peripheryBalanceOfBatch(address[] calldata _owners, uint256[] calldata _ids) external view returns (uint256[] memory bals_) ",
        "function peripheryUri(uint256 _id) external view returns (string memory)",
        "function peripheryIsApprovedForAll(address _owner, address _operator) external view returns (bool approved_)",
        "function peripherySetApprovalForAll(address _operator, bool _approved) external",
        "function peripherySetBaseURI(string memory _value) external returns (uint256 _itemsLength)",
        "function peripherySafeTransferFrom(address _from,address _to,uint256 _id,uint256 _value,bytes calldata _data) external",
        "function peripherySafeBatchTransferFrom(address _from,address _to,uint256[] calldata _ids,uint256[] calldata _values,bytes calldata _data) external",
      ],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: maticDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
  };

  await run("deployUpgrade", args);
}

//This adds a new facet called WearableSetsFacet to the aavegotchi diamond
export async function upgrade5() {
  console.log("-------------------------");
  console.log("executing upgrade 5");

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "WearableSetsFacet",
      addSelectors: [
        "function findWearableSets(uint256[] calldata _wearableIds) external view returns (uint256[] memory wearableSetIds_)",
        "function totalWearableSets() external view returns (uint256)",
        "function getWearableSet(uint256 _index) public view returns((string name,uint8[] allowedCollaterals,uint16[] wearableIds,int8[5] traitsBonuses) memory wearableSet_)",
        "function getWearableSets() external view returns((string name,uint8[] allowedCollaterals,uint16[] wearableIds,int8[5] traitsBonuses)[] memory wearableSets_)",
      ],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: maticDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
  };

  await run("deployUpgrade", args);
}

async function deployWearableDiamond() {
  console.log("Deploying wearable diamond");
  // deploy Diamond
  const Diamond = (await ethers.getContractFactory(
    "WearableDiamond"
  )) as WearableDiamond__factory;

  const diamond = await Diamond.deploy(
    diamondUpgrader,
    aavegotchiCutFacet,
    aavegotchiLoupeFacet,
    aavegotchiOwnerShipFacet,
    { gasPrice: gasPrice }
  );
  await diamond.deployed();
  console.log("Wearable Diamond deployed to:", diamond.address);

  return diamond.address;
}

async function upgradeAll() {
  await upgrade1();
  await upgrade2();
  await upgrade3();
  await upgrade4();
  await upgrade5();
}

if (require.main === module) {
  upgradeAll()
    .then(() => process.exit(0))
    // .then(() => console.log('upgrade completed') /* process.exit(0) */)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
