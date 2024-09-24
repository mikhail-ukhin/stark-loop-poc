
type HexString = `0x${string}`;

// Token options with labels and values
const tokenOptions = [
  { label: 'STRK', value: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d' },
  { label: 'USDC', value: '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8' },
  { label: 'DAI', value: '0x00da114221cb83fa859dbdb4c44beeaa0bb37c7537ad5ae66fe5e0efd20e6eb3' },
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
    const tokenAddress = `0x${tokenAddressBigInt.toString(16)}`; 
    const token = tokenOptions.find((t) => t.value.toLowerCase() === tokenAddress.toLowerCase());
    console.log(tokenAddress, '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d');

    return token ? token.label : tokenAddress;
  };

  export const formatRecipient = (bigIntValue: bigint) => {
    const recipientStr = bigIntValue.toString(16); 
    return `0x${recipientStr.slice(0, 6)}`; 
  };

  export const convertBigIntToNumber = (bigIntValue: bigint) => {
    return Number(bigIntValue);
  };

  