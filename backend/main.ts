import { Contract, Account, json, RpcProvider, constants } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";

dotenv.config();

const CONTRACT_PATH = "./artifacts/contracts_Starkloop.contract_class.json";
const CHECK_INTERVAL_MS = 30 * 1000; // 30 seconds

let serviceAccount: Account;
let loopContract: Contract;

// Initialize the RPC provider
const myProvider = new RpcProvider({ nodeUrl: process.env.RPC_PROVIDER_URL });

// Function to initialize the service account
async function connectAccount() {
    const privateKey0 = process.env.PRIVATE_KEY ?? "";
    const accountAddress0: string = process.env.ACCOUNT_ADDRESS ?? "";

    console.log('OZ_ACCOUNT_ADDRESS=', accountAddress0);
    console.log('OZ_ACCOUNT_PRIVATE_KEY=', privateKey0);

    serviceAccount = new Account(
        myProvider,
        accountAddress0,
        privateKey0,
        undefined,
        constants.TRANSACTION_VERSION.V3
    );

    console.log("Service account connected.");
}

// Function to load the contract
async function getContract() {
    const testAddress = process.env.CONTRACT;
    const contractFile = fs.readFileSync(CONTRACT_PATH).toString("ascii");
    const compiledTest = json.parse(contractFile);

    loopContract = new Contract(compiledTest.abi, testAddress, myProvider);
    loopContract.connect(serviceAccount);

    console.log("Contract connected.");
}

// Function to check due payments
async function checkDuePayments() {
    try {
        const contractAddress = process.env.CONTRACT;

        // Estimate the fee
        const { suggestedMaxFee: estimatedFee1 } = await serviceAccount.estimateInvokeFee({
            contractAddress: contractAddress,
            entrypoint: "check_due_payments",
            calldata: [],
        });

        console.log('Estimated fee:', estimatedFee1);

        // Invoke the contract
        const result = await loopContract.invoke("check_due_payments", [], {
            maxFee: estimatedFee1,
        });

        await myProvider.waitForTransaction(result.transaction_hash);

        console.log('Transaction hash:', result.transaction_hash);
        console.log('✅ Payment check completed.');

    } catch (error) {
        console.error('Error in checkDuePayments:', error);
    }
}

// Main function to run the process and repeat it every 30 seconds
async function main() {
    await connectAccount();   // Connect account
    await getContract();      // Load contract

    // First immediate check
    await checkDuePayments();

    // Set up a recurring check every 30 seconds
    setInterval(async () => {
        console.log("Checking for due payments...");
        await checkDuePayments();
    }, CHECK_INTERVAL_MS);
}

// Run the main function and handle any errors
main()
    .then(() => console.log('Monitoring started...'))
    .catch((error) => {
        console.error('Error in main execution:', error);
        process.exit(1);
    });
