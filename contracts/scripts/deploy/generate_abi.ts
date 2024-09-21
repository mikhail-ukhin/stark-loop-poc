import { Account, CallData, Contract, RpcProvider, stark } from "starknet";
import * as dotenv from "dotenv";
import { getCompiledCode } from "./utils";
// dotenv.config();
import * as fs from 'fs';


async function main() {

  let sierraCode, casmCode;

  try {
    ({ sierraCode, casmCode } = await getCompiledCode(
      "contracts_Starkloop"
    ));
  } catch (error: any) {
    console.log("Failed to read contract files");
    process.exit(1);
  }

  const jsonString = JSON.stringify(sierraCode.abi, null, 2);

  fs.writeFileSync('artifacts/abi.json', jsonString);
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
