import { Contract, Account, json, RpcProvider, constants, hash, num, events, CallData, ParsedEvent } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";

dotenv.config();

const CONTRACT_PATH = "./artifacts/abi.json";
const CALL_DUE_PAYMENTS_INTERVAL_MS = 30 * 2 * 1000; // 60 seconds
const CHECK_EVENTS_INTERVAL_MS = 30 * 1000; // 30 seconds

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
    const abiFile = fs.readFileSync(CONTRACT_PATH).toString("ascii");
    const abi = json.parse(abiFile);

    loopContract = new Contract(abi, testAddress, myProvider);
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

async function handleDuePaymentEvents() {
    const lastBlock = await myProvider.getBlock('latest');
    const keyFilter = [[num.toHex(hash.starknetKeccak('DuePayment')), '0x8']];

    const abiEvents = events.getAbiEvents(loopContract.abi);
    const abiStructs = CallData.getAbiStruct(loopContract.abi);
    const abiEnums = CallData.getAbiEnum(loopContract.abi);

    let continuationToken: string | undefined = '0';
    let result: ParsedEvent[] = [];

    while (continuationToken) { 
        
        const eventsList = await myProvider.getEvents({
            address: loopContract.address,
            from_block: { block_number: lastBlock.block_number - 2 },
            to_block: { block_number: lastBlock.block_number },
            chunk_size: 5,
            keys: keyFilter,
            continuation_token: continuationToken === '0' ? undefined : continuationToken,
          });

        continuationToken = eventsList.continuation_token;

        if (eventsList) {
            const parsed = events.parseEvents(eventsList.events, abiEvents, abiStructs, abiEnums);

            parsed.forEach(element => {
                result.push(element)
            });
        }
        
    }
    if (result) {
        console.log('collected events', result.length);
    }
    else {
        console.log('no events')
    }
    
}

// Main function to run the process and repeat it every N seconds
async function main() {
    await connectAccount();   // Connect account
    await getContract();      // Load contract

    // First immediate check
    await checkDuePayments();
    await handleDuePaymentEvents();

    setInterval(async () => {
        console.log("Checking for due payment events...");
        await handleDuePaymentEvents();
    }, CHECK_EVENTS_INTERVAL_MS);

    // Set up a recurring check every 30 seconds
    setInterval(async () => {
        console.log("Checking for due payments...");
        await checkDuePayments();
    }, CALL_DUE_PAYMENTS_INTERVAL_MS);
}

main()
    .then(() => console.log('Monitoring started...'))
    .catch((error) => {
        console.error('Error in main execution:', error);
        process.exit(1);
    });
