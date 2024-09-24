import { Contract, Account, json, RpcProvider, constants, hash, num, events, CallData, ParsedEvent } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";

dotenv.config();

const CONTRACT_PATH = "./artifacts/abi.json";
const CALL_DUE_PAYMENTS_INTERVAL_MS = 60 * 1000; // 60 seconds
const CHECK_EVENTS_INTERVAL_MS = 15 * 1000; // 30 seconds

let serviceAccount: Account;
let loopContract: Contract;

const myProvider = new RpcProvider({ nodeUrl: process.env.RPC_PROVIDER_URL });
const paymentEventName = 'contracts::starkloop::Starkloop::DuePayment';

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
    loopContract = new Contract(abi, process.env.CONTRACT, myProvider);
    loopContract.connect(serviceAccount);
}

async function checkDuePayments() {
    try {
        const { suggestedMaxFee: estimatedFee } = await serviceAccount.estimateInvokeFee({
            contractAddress: loopContract.address,
            entrypoint: "check_due_payments",
            calldata: [],
        });

        const result = await loopContract.invoke("check_due_payments", [], { maxFee: estimatedFee });
        await myProvider.waitForTransaction(result.transaction_hash);
        console.log(`✅ Payment check transaction hash: ${result.transaction_hash}`);
    } catch (error) {
        console.error('Error in checkDuePayments:', error);
    }
}

async function handleDuePaymentEvents() {
    try {
        const lastBlock = await myProvider.getBlock('latest');
        const keyFilter = [[num.toHex(hash.starknetKeccak('DuePayment')), '0x8']];
        const abiEvents = events.getAbiEvents(loopContract.abi);
        const abiStructs = CallData.getAbiStruct(loopContract.abi);
        const abiEnums = CallData.getAbiEnum(loopContract.abi);

        let continuationToken: string | undefined = '0';

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

            if (eventsList && eventsList.events.length > 0) {
                const parsedEvents = events.parseEvents(eventsList.events, abiEvents, abiStructs, abiEnums);

                for (const event of parsedEvents) {
                    const id = event[paymentEventName].id;
                    console.log(id);
                    await sendPayment(id);
                }
            }
        }
    } catch (error) {
        console.error('Error in handleDuePaymentEvents:', error);
    }
}

function toUint256(value: bigint) {
    const mask = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF");
    const low = value & mask;
    const high = value >> BigInt(128);
    return { low, high };
}

async function sendPayment(id: any) {
    try {
        const { suggestedMaxFee: estimatedFee } = await serviceAccount.estimateInvokeFee({
            contractAddress: loopContract.address,
            entrypoint: "make_schedule_payment",
            calldata: [toUint256(id)],
        });

        const result = await loopContract.invoke("make_schedule_payment", [id], { maxFee: estimatedFee });
        await myProvider.waitForTransaction(result.transaction_hash);
        console.log(`✅ Payment for subscription ${id} completed. Transaction hash: ${result.transaction_hash}`);
    } catch (error) {
        console.error(`Error processing payment for subscription ${id}:`, error);
    }
}

async function main() {
    await connectAccount();
    await getContract();

    // await checkDuePayments();
    await handleDuePaymentEvents();

    // setInterval(checkDuePayments, CALL_DUE_PAYMENTS_INTERVAL_MS);
    setInterval(handleDuePaymentEvents, CHECK_EVENTS_INTERVAL_MS);
}

main()
    .then(() => console.log('Monitoring started...'))
    .catch((error) => {
        console.error('Error in main execution:', error);
        process.exit(1);
    });



    