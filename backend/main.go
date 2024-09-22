package main

import (
	"context"
	"fmt"
	"math/big"
	"strconv"
	"strk-loop-api/setup"
	"time"

	"github.com/NethermindEth/juno/core/felt"
	"github.com/NethermindEth/starknet.go/account"
	"github.com/NethermindEth/starknet.go/rpc"
	"github.com/NethermindEth/starknet.go/utils"
)

var (
	contract                   string = "0x049D36570D4e46f48e99674bd3fcc84644DdD6b96F7C741B1562B82f9e004dC7" // Sepolia ETH contract address
	contractMethod             string = "check_due_payments"
	contractMethodWithCalldata string = "balance_of"
)

func main() {
	rpcProviderUrl := setup.GetRpcProviderUrl()
	accountAddress := setup.GetAccountAddress()
	accountCairoVersion := setup.GetAccountCairoVersion()
	privateKey := setup.GetPrivateKey()
	publicKey := setup.GetPublicKey()

	client, err := rpc.NewProvider(rpcProviderUrl)
	if err != nil {
		panic(fmt.Sprintf("Error dialing the RPC provider: %s", err))
	}

	ks := account.NewMemKeystore()
	privKeyBI, ok := new(big.Int).SetString(privateKey, 0)
	if !ok {
		panic("Fail to convert privKey to bitInt")
	}
	ks.Put(publicKey, privKeyBI)

	accountAddressInFelt, err := utils.HexToFelt(accountAddress)
	if err != nil {
		fmt.Println("Failed to transform the account address, did you give the hex address?")
		panic(err)
	}

	accnt, err := account.NewAccount(client, accountAddressInFelt, publicKey, ks, accountCairoVersion)
	if err != nil {
		panic(err)
	}

	fmt.Println("Established connection with the client")

	// Getting the nonce from the account
	nonce, err := accnt.Nonce(context.Background(), rpc.BlockID{Tag: "latest"}, accnt.AccountAddress)
	if err != nil {
		panic(err)
	}

	// Building the InvokeTx struct
	InvokeTx := rpc.BroadcastInvokev1Txn{
		InvokeTxnV1: rpc.InvokeTxnV1{
			MaxFee:        new(felt.Felt).SetUint64(100000000000000),
			Version:       rpc.TransactionV1,
			Nonce:         nonce,
			Type:          rpc.TransactionType_Invoke,
			SenderAddress: accnt.AccountAddress,
		}}

	contractAddress, err := utils.HexToFelt(contract)

	if err != nil {
		panic(err)
	}

	amount, _ := utils.HexToFelt("0xffffffff")
	// Building the functionCall struct, where :
	FnCall := rpc.FunctionCall{
		ContractAddress:    contractAddress,                               //contractAddress is the contract that we want to call
		EntryPointSelector: utils.GetSelectorFromNameFelt(contractMethod), //this is the function that we want to call
		Calldata:           []*felt.Felt{amount, &felt.Zero},              //the calldata necessary to call the function. Here we are passing the "amount" value for the "mint" function
	}

	// Building the Calldata with the help of FmtCalldata where we pass in the FnCall struct along with the Cairo version
	InvokeTx.Calldata, err = accnt.FmtCalldata([]rpc.FunctionCall{FnCall})
	if err != nil {
		panic(err)
	}

	// Estimate the transaction fee
	feeRes, err := accnt.EstimateFee(context.Background(), []rpc.BroadcastTxn{InvokeTx}, []rpc.SimulationFlag{}, rpc.WithBlockTag("latest"))
	if err != nil {
		setup.PanicRPC(err)
	}
	estimatedFee := feeRes[0].OverallFee
	// If the estimated fee is higher than the current fee, let's override it and sign again
	if estimatedFee.Cmp(InvokeTx.MaxFee) == 1 {
		newFee, err := strconv.ParseUint(estimatedFee.String(), 0, 64)
		if err != nil {
			panic(err)
		}
		InvokeTx.MaxFee = new(felt.Felt).SetUint64(newFee + newFee/5) // fee + 20% to be sure
		// Signing the transaction again
		err = accnt.SignInvokeTransaction(context.Background(), &InvokeTx.InvokeTxnV1)
		if err != nil {
			panic(err)
		}
	}

	// After the signing we finally call the AddInvokeTransaction in order to invoke the contract function
	resp, err := accnt.AddInvokeTransaction(context.Background(), InvokeTx)
	if err != nil {
		setup.PanicRPC(err)
	}

	fmt.Println("Waiting for the transaction status...")
	time.Sleep(time.Second * 3) // Waiting 3 seconds

	//Getting the transaction status
	txStatus, err := client.GetTransactionStatus(context.Background(), resp.TransactionHash)
	if err != nil {
		setup.PanicRPC(err)
	}

	// This returns us with the transaction hash and status
	fmt.Printf("Transaction hash response: %v\n", resp.TransactionHash)
	fmt.Printf("Transaction execution status: %s\n", txStatus.ExecutionStatus)
	fmt.Printf("Transaction status: %s\n", txStatus.FinalityStatus)
}
