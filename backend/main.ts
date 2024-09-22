import { Contract, Account, json, RpcProvider, constants } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {

    const myProvider = new RpcProvider({ nodeUrl: process.env.RPC_PROVIDER_URL });

    // initialize existing predeployed account 0 of Devnet-rs
    console.log('OZ_ACCOUNT_ADDRESS=', process.env.ACCOUNT_ADDRESS);
    console.log('OZ_ACCOUNT_PRIVATE_KEY=', process.env.PRIVATE_KEY);

    const privateKey0 = process.env.PRIVATE_KEY ?? "";
    const accountAddress0: string = process.env.ACCOUNT_ADDRESS ?? "";

    const serviceAccount = new Account(
        myProvider,
        accountAddress0,
        privateKey0,
        undefined,
        constants.TRANSACTION_VERSION.V3
      );
    
    console.log("Account 1 connected.\n");

    const testAddress = "0x4187f2497247c92bb8d9b960f0fecb704d173525c3012316e0095a3454acde5";
    
    const compiledTest = json.parse(fs.readFileSync("./artifacts/contracts_Starkloop.contract_class.json").toString("ascii"));

    console.log('read contracts success', compiledTest)

    const myTestContract = new Contract(compiledTest.abi, testAddress, myProvider);

    console.log('Test Contract connected at =', myTestContract.address);

    myTestContract.connect(serviceAccount);

    const bal1  = await myTestContract.get_subscription(1);

    console.log("Subscription", bal1);


    // estimate fee
    const { suggestedMaxFee: estimatedFee1 } = await serviceAccount.estimateInvokeFee({ contractAddress: testAddress, entrypoint: "check_due_payments", calldata: [] });

    console.log('estimated fee', estimatedFee1);

    const result = await myTestContract.invoke("check_due_payments", []);

    await myProvider.waitForTransaction(result.transaction_hash);

    console.log('trx hash', result.transaction_hash);

    // const bal2 = await myTestContract.get_balance();
    // console.log("Final balance =", bal2);
    

    console.log('✅ Test completed.');
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });