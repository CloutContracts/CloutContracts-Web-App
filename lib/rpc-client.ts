export class CloutContractsRPC {
  private rpcUrl: string
  private apiKey: string

  constructor() {
    this.rpcUrl = process.env.NEXT_PUBLIC_CLOUT_CONTRACTS_RPC || "https://rpc.cloutcontracts.network"
    this.apiKey = process.env.CLOUT_CONTRACTS_API_KEY || ""
  }

  async call(method: string, params: any[] = []): Promise<any> {
    const response = await fetch(this.rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method,
        params,
        id: Date.now(),
      }),
    })

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error.message)
    }

    return data.result
  }

  async getBalance(address: string): Promise<string> {
    const balance = await this.call("eth_getBalance", [address, "latest"])
    return (Number.parseInt(balance, 16) / Math.pow(10, 18)).toString()
  }

  async sendTransaction(transaction: any): Promise<string> {
    return await this.call("eth_sendTransaction", [transaction])
  }

  async getTransactionReceipt(hash: string): Promise<any> {
    return await this.call("eth_getTransactionReceipt", [hash])
  }

  async deployContract(bytecode: string, from: string): Promise<string> {
    return await this.sendTransaction({
      from,
      data: bytecode,
      gas: "0x76c0",
    })
  }
}

export const rpcClient = new CloutContractsRPC()
