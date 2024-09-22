
type HexString = `0x${string}`;

// Token options with labels and values
const tokenOptions = [
  { label: 'STRK', value: '0xCa14007Eff0dB1f8135f4C25B34De49AB0d42766' },
  { label: 'USDC', value: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' },
  { label: 'DAI', value: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357' },
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
    return token ? token.label : tokenAddress; 
  };

  export const formatRecipient = (bigIntValue: bigint) => {
    const recipientStr = bigIntValue.toString(16); 
    return `0x${recipientStr.slice(0, 6)}`; 
  };

  export const convertBigIntToNumber = (bigIntValue: bigint) => {
    return Number(bigIntValue);
  };

  