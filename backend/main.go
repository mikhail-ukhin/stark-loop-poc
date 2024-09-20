package main

import (
	"fmt"
)

// Item represents a simple model for the API
type Item struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

var (
	someContract               string = "0x049D36570D4e46f48e99674bd3fcc84644DdD6b96F7C741B1562B82f9e004dC7" // Sepolia ETH contract address
	contractMethod             string = "decimals"
	contractMethodWithCalldata string = "balance_of"
)

func main() {
	fmt.Println("Starting simpleCall example")

	// Load variables from '.env' file
	// rpcProviderUrl := setup.GetRpcProviderUrl()
	// accountAddress := setup.GetAccountAddress()
}
