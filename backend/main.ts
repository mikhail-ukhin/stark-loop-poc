import { Contract, Account, json, RpcProvider, constants, hash, num, events, CallData, ParsedEvent, cairo } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";

dotenv.config();

const CONTRACT_PATH = "./artifacts/abi.json";
const CALL_DUE_PAYMENTS_INTERVAL_MS = 30 * 1000; // 60 seconds

let serviceAccount: Account;
let loopContract: Contract;

const myProvider = new RpcProvider({ nodeUrl: process.env.RPC_PROVIDER_URL });

async function connectAccount() {
    serviceAccount = new Account(
        myProvider,
        process.env.ACCOUNT_ADDRESS || "",
        process.env.PRIVATE_KEY || "",
        undefined,
        constants.TRANSACTION_VERSION.V3
    );
}

async function getContract() {
    const abi = json.parse(fs.readFileSync(CONTRACT_PATH, "ascii"));
    loopContract = new Contract(abi, process.env.CONTRACT || "", myProvider);
    loopContract.connect(serviceAccount);
}

async function checkDuePayments() {
    console.log('starting to check for any due payments');

    const result = await getPayableSubscriptionIds();

    if (result && result.length > 0) {
        console.log(`found ${result.length} payments. Processing them...`);

        // send them sequentially (can think about do parallel Promise.all())
        result.forEach(async element => {
            await sendPayment(element);
        });
    }
    else {
        console.log('Nothing was found. waiting...')
    }
}

async function getPayableSubscriptionIds() {
    try {
        const { suggestedMaxFee: estimatedFee } = await serviceAccount.estimateInvokeFee({
            contractAddress: loopContract.address,
            entrypoint: "get_all_subscription_that_must_be_payed_ids",
            calldata: [],
        });

        const result = await loopContract.call("get_all_subscription_that_must_be_payed_ids", []);

        console.log(`✅ Payment check transaction hash`);
        return result as Array<BigInt>;
    } catch (error) {
        console.error('Error in getPayableSubscriptionIds:', error);
    }
}

async function sendPayment(id: any) {
    try {

        if (!id) return;

        const id_u = cairo.uint256(BigInt(id));

        const { suggestedMaxFee: estimatedFee } = await serviceAccount.estimateInvokeFee({
            contractAddress: loopContract.address,
            entrypoint: "make_schedule_payment",
            calldata: [id_u],
        });

        const result = await loopContract.invoke("make_schedule_payment", [id_u], { maxFee: estimatedFee });

        await myProvider.waitForTransaction(result.transaction_hash);

        console.log(`✅ Payment for subscription ${id} completed. Transaction hash: ${result.transaction_hash}`);
    } catch (error) {
        console.error(`Error ${error} processing payment for subscription ${id}:`);
    }
}

async function main() {
    await connectAccount();
    await getContract();

    await checkDuePayments();

    setInterval(checkDuePayments, CALL_DUE_PAYMENTS_INTERVAL_MS);
}

main()
    .then(() => console.log('Monitoring started...'))
    .catch((error) => {
        // console.error('Error in main execution:', error);
        process.exit(1);
    });
    