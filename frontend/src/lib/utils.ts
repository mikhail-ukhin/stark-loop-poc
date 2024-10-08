import { useContract } from "@starknet-react/core";
import { Abi, cairo } from "starknet";

type HexString = `0x${string}`;

// Token options with labels and values
export const tokenOptions = [
  { label: 'STRK', value: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d', decimals: 18 },
  { label: 'USDC', value: '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8', decimals: 6  },
  { label: 'DAI', value: '0x00da114221cb83fa859dbdb4c44beeaa0bb37c7537ad5ae66fe5e0efd20e6eb3', decimals: 18  },
];

// Helper function to shorten address
export const shortenAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Helper function to convert hex to decimal and format it
export const formatAmount = (hex: string) => {
  const decimal = parseInt(hex, 16);
  return decimal.toString();
};

export const convertToHexString = (input: string | undefined): HexString => {
  if (!input) {
    return '' as HexString;
  }

  if (!input.startsWith('0x')) {
    return `0x${input}` as HexString;
  }

  return input as HexString;
}

  export const mapTokenAddressToLabel = (tokenAddressBigInt: bigint) => {
    const tokenAddress = `0x0${tokenAddressBigInt.toString(16)}`; 
    const token = tokenOptions.find((t) => t.value.toLowerCase() === tokenAddress.toLowerCase());

    return token ? token.label : tokenAddress;
  };

  export const mapTokenAddressToDecimals = (tokenAddressBigInt: bigint) => {
    const tokenAddress = `0x0${tokenAddressBigInt.toString(16)}`;
    const token = tokenOptions.find((t) => t.value.toLowerCase() === tokenAddress.toLowerCase());

    return token ? token.decimals : 1;
  };

  export const formatRecipient = (bigIntValue: bigint) => {
    const recipientStr = bigIntValue.toString(16); 
    return `0x${recipientStr.slice(0, 6)}`; 
  };

  export const convertBigIntToNumber = (bigIntValue: bigint) => {
    return Number(bigIntValue);
  };

  export const getNextPayment = (last_payment: bigint, periodicity: bigint) => {
    // If last_payment is 0 (bigint zero), return the current date in milliseconds
    if (last_payment === BigInt(0)) {
      return new Date(Date.now());
    }
  
    // Convert last_payment and periodicity to numbers and add them
    const timestampNumber: number = Number(last_payment) * 1000 + Number(periodicity) * 1000;
  
    // Return the calculated next payment date as a Date object
    return new Date(timestampNumber);
  };
  

   // Convert a plain number or BigInt to u256 structure
  export function numberToU256(num: number) {
    const bigNum = BigInt(num); // Ensure we work with BigInt for large numbers
    const MAX_UINT128 = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'); // Correct mask for 128-bit values
    
    const low = bigNum & MAX_UINT128; // Get the lower 128 bits
    const high = bigNum >> BigInt(128); // Get the upper 128 bits
    
    return {
        low: low.toString(),   // Convert low part to string if needed
        high: high.toString(), // Convert high part to string if needed
    };
  }

  export function get_contract_by_address(addr: any, abiType: Abi) {
    const { contract } = useContract({ abi : abiType, address: addr})

    return contract;
  }
  

  