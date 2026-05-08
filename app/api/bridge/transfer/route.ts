import { NextRequest, NextResponse } from "next/server"

// CloutContracts Network Configuration
const CCS_RPC_URL = "https://evm.cloutcontracts.net"
const CCS_CHAIN_ID = 12
const CCS_BRIDGE_CONTRACT = "0x1e067bFe21E1555524252168870De152a05CCE62"

// Source chain RPC URLs for verification (using endpoints that don't block server requests)
const SOURCE_CHAIN_RPCS: Record<number, string[]> = {
  1: ["https://rpc.ankr.com/eth", "https://1rpc.io/eth", "https://eth.drpc.org"], // Ethereum
  56: ["https://bsc-dataseed.binance.org", "https://rpc.ankr.com/bsc", "https://1rpc.io/bnb"], // BNB Chain
  61: ["https://etc.rivet.link", "https://rpc.ankr.com/eth_classic", "https://etc.etcdesktop.com"], // Ethereum Classic
}

// Source chain CCS token contracts
const SOURCE_CCS_CONTRACTS: Record<number, string> = {
  1: "0x1da4858ad385cc377165A298CC2CE3fce0C5fD31", // Ethereum
  56: "0x3e3B357061103DC040759aC7DceEaba9901043aD", // BNB
  61: "0x9186ff77866DfD1007429F552e48C6d1A927297A", // ETC
}

// Bridge recipient address (where users send tokens on source chain)
// This must match the address derived from BRIDGE_OPERATOR_PRIVATE_KEY
const BRIDGE_RECIPIENT = "0x1e34d105862e909b390465e71e599e99d7e80e72"

// Track processed transactions to prevent double-spending
const processedTxs = new Set<string>()

// ERC20 Transfer event signature
const TRANSFER_EVENT_SIGNATURE = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"

interface BridgeRequest {
  To: string
  Amount: string
  originChainId: number
  txHash: string
}

export async function POST(request: NextRequest) {
  try {
    const body: BridgeRequest = await request.json()
    const { To, Amount, originChainId, txHash } = body

    console.log("[Bridge] Received request:", { To, Amount, originChainId, txHash })

    // Validate inputs
    if (!To || !Amount || !originChainId || !txHash) {
      return NextResponse.json(
        { success: false, msg: "Missing required parameters" },
        { status: 400 }
      )
    }

    // Check if already processed
    if (processedTxs.has(txHash.toLowerCase())) {
      return NextResponse.json(
        { success: false, msg: "Transaction already processed" },
        { status: 400 }
      )
    }

    // Get operator private key from environment
    const operatorPrivateKey = process.env.BRIDGE_OPERATOR_PRIVATE_KEY
    if (!operatorPrivateKey) {
      console.error("[Bridge] BRIDGE_OPERATOR_PRIVATE_KEY not set")
      return NextResponse.json(
        { success: false, msg: "Bridge operator not configured" },
        { status: 500 }
      )
    }

    // Verify the source transaction
    const verification = await verifySourceTransaction(txHash, originChainId, To, Amount)
    if (!verification.valid) {
      return NextResponse.json(
        { success: false, msg: verification.error },
        { status: 400 }
      )
    }

    // Execute transfer on CloutContracts network
    const result = await executeTransfer(operatorPrivateKey, To, Amount)
    
    if (result.success) {
      // Mark as processed
      processedTxs.add(txHash.toLowerCase())
      
      return NextResponse.json({
        success: true,
        hash: result.hash,
        msg: "Bridge transfer completed successfully"
      })
    } else {
      return NextResponse.json(
        { success: false, msg: result.error },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error("[Bridge] Error:", error)
    return NextResponse.json(
      { success: false, msg: error.message || "Bridge transfer failed" },
      { status: 500 }
    )
  }
}

async function verifySourceTransaction(
  txHash: string,
  chainId: number,
  expectedRecipient: string,
  expectedAmount: string
): Promise<{ valid: boolean; error?: string }> {
  const rpcUrls = SOURCE_CHAIN_RPCS[chainId]
  const tokenContract = SOURCE_CCS_CONTRACTS[chainId]

  if (!rpcUrls || !tokenContract) {
    return { valid: false, error: `Unsupported chain ID: ${chainId}` }
  }

  let lastError: string | null = null

  // Try each RPC endpoint until one works
  for (const rpcUrl of rpcUrls) {
    try {
      // Get transaction receipt with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const receiptResponse = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_getTransactionReceipt",
          params: [txHash],
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Check if response is JSON
      const contentType = receiptResponse.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        lastError = `RPC ${rpcUrl} returned non-JSON response`
        continue
      }

      const receiptResult = await receiptResponse.json()
      
      if (receiptResult.error) {
        lastError = `RPC error: ${receiptResult.error.message}`
        continue
      }

      const receipt = receiptResult.result

      if (!receipt) {
        return { valid: false, error: "Transaction not found or not confirmed" }
      }

      if (receipt.status !== "0x1") {
        return { valid: false, error: "Transaction failed on source chain" }
      }

      // Find Transfer event to the bridge recipient
      const transferLog = receipt.logs?.find((log: any) => {
        return (
          log.address.toLowerCase() === tokenContract.toLowerCase() &&
          log.topics[0] === TRANSFER_EVENT_SIGNATURE &&
          log.topics[2] && 
          log.topics[2].toLowerCase().includes(BRIDGE_RECIPIENT.slice(2).toLowerCase())
        )
      })

      if (!transferLog) {
        return { valid: false, error: "No transfer to bridge recipient found in transaction" }
      }

      // Verify amount (CCS has 0 decimals, so raw value = token amount)
      const transferredAmount = BigInt(transferLog.data)
      const requestedAmount = BigInt(expectedAmount)

      if (transferredAmount < requestedAmount) {
        return { 
          valid: false, 
          error: `Amount mismatch: transferred ${transferredAmount}, requested ${requestedAmount}` 
        }
      }

      // Successfully verified
      return { valid: true }

    } catch (error: any) {
      lastError = error.message
      continue
    }
  }

  // All RPC endpoints failed
  return { valid: false, error: `Verification failed: ${lastError || "All RPC endpoints failed"}` }
}

async function executeTransfer(
  privateKey: string,
  to: string,
  amount: string
): Promise<{ success: boolean; hash?: string; error?: string }> {
  try {
    // Derive address from private key
    const publicKey = await deriveAddress(privateKey)

    // On CCS mainnet, CCS is the NATIVE currency (like ETH on Ethereum)
    // We need to check native balance, not ERC20 token balance
    const balanceResponse = await fetch(CCS_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getBalance",
        params: [publicKey, "latest"],
      }),
    })
    const balanceResult = await balanceResponse.json()
    const nativeBalanceWei = BigInt(balanceResult.result || "0x0")
    
    // CCS tokens have 0 decimals on other chains, but native CCS has 18 decimals
    // Amount from source chain is in token units (0 decimals)
    // We need to convert to wei (18 decimals) for native transfer
    const amountTokens = BigInt(amount)
    const amountWei = amountTokens * BigInt(10 ** 18)
    
    // Check if we have enough native CCS (including gas buffer)
    const gasBuffer = BigInt(10 ** 17) // 0.1 CCS for gas
    if (nativeBalanceWei < amountWei + gasBuffer) {
      const availableTokens = nativeBalanceWei / BigInt(10 ** 18)
      return {
        success: false,
        error: `Bridge has insufficient liquidity. Available: ${availableTokens.toString()} CCS, Requested: ${amountTokens.toString()} CCS. Please contact support to complete your bridge manually.`
      }
    }

    // Get nonce
    const nonceResponse = await fetch(CCS_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getTransactionCount",
        params: [publicKey, "latest"],
      }),
    })
    const nonceResult = await nonceResponse.json()
    const nonce = nonceResult.result

    // Get gas price
    const gasPriceResponse = await fetch(CCS_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_gasPrice",
        params: [],
      }),
    })
    const gasPriceResult = await gasPriceResponse.json()
    const gasPrice = gasPriceResult.result

    // Build native CCS transfer transaction (no data, just value transfer)
    const amountHex = "0x" + amountWei.toString(16)
    
    const tx = {
      nonce: nonce,
      gasPrice: gasPrice,
      gasLimit: "0x5208", // 21000 gas for simple transfer
      to: to, // Send directly to user's address
      value: amountHex, // Native CCS amount in wei
      data: "0x", // No data for native transfer
      chainId: CCS_CHAIN_ID,
    }

    // Sign and send transaction
    const signedTx = await signTransaction(tx, privateKey)
    
    const sendResponse = await fetch(CCS_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_sendRawTransaction",
        params: [signedTx],
      }),
    })

    const sendResult = await sendResponse.json()
    
    if (sendResult.error) {
      // Check for insufficient funds error and provide clearer message
      const errorMsg = sendResult.error.message || ""
      if (errorMsg.includes("insufficient funds")) {
        return { 
          success: false, 
          error: "Bridge temporarily unavailable - operator wallet needs gas funding. Your source transaction was verified. Please contact support to complete your bridge manually." 
        }
      }
      return { success: false, error: errorMsg }
    }

    console.log("[Bridge] Transaction sent:", sendResult.result)
    return { success: true, hash: sendResult.result }

  } catch (error: any) {
    console.error("[Bridge] Execute error:", error)
    return { success: false, error: error.message }
  }
}

// Simple secp256k1 signing using Web Crypto API
async function deriveAddress(privateKey: string): Promise<string> {
  // Remove 0x prefix if present
  const privKeyHex = privateKey.startsWith("0x") ? privateKey.slice(2) : privateKey
  const privKeyBytes = hexToBytes(privKeyHex)
  
  // Use the secp256k1 curve to derive public key
  // For simplicity, we'll use a library approach via dynamic import
  const { keccak256 } = await import("js-sha3")
  
  // Import secp256k1
  const secp256k1 = await import("secp256k1")
  const pubKey = secp256k1.publicKeyCreate(privKeyBytes, false)
  
  // Remove the 04 prefix and hash
  const pubKeyWithoutPrefix = pubKey.slice(1)
  const hash = keccak256(pubKeyWithoutPrefix)
  
  // Take last 20 bytes as address
  const address = "0x" + hash.slice(-40)
  return address
}

async function signTransaction(tx: any, privateKey: string): Promise<string> {
  const { keccak256 } = await import("js-sha3")
  const secp256k1 = await import("secp256k1")
  const { RLP } = await import("@ethereumjs/rlp")
  
  const privKeyHex = privateKey.startsWith("0x") ? privateKey.slice(2) : privateKey
  const privKeyBytes = hexToBytes(privKeyHex)

  // EIP-155 signing
  const chainId = tx.chainId
  
  // Helper to convert hex string to bytes, handling empty/zero values properly
  const toRlpBytes = (hex: string): Uint8Array => {
    if (!hex || hex === "0x" || hex === "0x0" || hex === "0x00") {
      return new Uint8Array(0)
    }
    // Remove leading zeros but keep at least one byte for non-zero values
    let h = hex.startsWith("0x") ? hex.slice(2) : hex
    // Remove leading zeros
    while (h.length > 2 && h.startsWith("00")) {
      h = h.slice(2)
    }
    // Ensure even length
    if (h.length % 2 !== 0) {
      h = "0" + h
    }
    return hexToBytes("0x" + h)
  }
  
  // Create raw transaction array for signing
  const rawTx = [
    toRlpBytes(tx.nonce),
    toRlpBytes(tx.gasPrice),
    toRlpBytes(tx.gasLimit),
    hexToBytes(tx.to), // Address should keep all bytes
    toRlpBytes(tx.value),
    hexToBytes(tx.data),
    toRlpBytes("0x" + chainId.toString(16)),
    new Uint8Array(0),
    new Uint8Array(0),
  ]

  // RLP encode and hash
  const encoded = RLP.encode(rawTx)
  const msgHash = hexToBytes("0x" + keccak256(encoded))

  // Sign
  const { signature, recid } = secp256k1.ecdsaSign(msgHash, privKeyBytes)
  
  // Calculate v with EIP-155
  const v = chainId * 2 + 35 + recid
  const r = Buffer.from(signature.slice(0, 32))
  const s = Buffer.from(signature.slice(32, 64))

  // Create signed transaction
  const signedTx = [
    toRlpBytes(tx.nonce),
    toRlpBytes(tx.gasPrice),
    toRlpBytes(tx.gasLimit),
    hexToBytes(tx.to),
    toRlpBytes(tx.value),
    hexToBytes(tx.data),
    toRlpBytes("0x" + v.toString(16)),
    new Uint8Array(r),
    new Uint8Array(s),
  ]

  const signedEncoded = RLP.encode(signedTx)
  return "0x" + Buffer.from(signedEncoded).toString("hex")
}

function hexToBytes(hex: string): Uint8Array {
  const h = hex.startsWith("0x") ? hex.slice(2) : hex
  if (h.length === 0) return new Uint8Array(0)
  const bytes = new Uint8Array(h.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

// Token contracts for each network
const TOKEN_CONTRACTS: Record<number, string> = {
  1: "0x1da4858ad385cc377165A298CC2CE3fce0C5fD31",  // ETH
  56: "0x3e3B357061103DC040759aC7DceEaba9901043aD", // BNB
  61: "0x9186ff77866DfD1007429F552e48C6d1A927297A", // ETC
  12: "0x1e067bFe21E1555524252168870De152a05CCE62", // CCS Mainnet
}

// RPC URLs for each network (using free endpoints without API keys)
const NETWORK_RPCS: Record<number, string[]> = {
  1: ["https://ethereum-rpc.publicnode.com", "https://eth.drpc.org", "https://cloudflare-eth.com"],
  56: ["https://bsc-dataseed.binance.org", "https://bsc-dataseed1.defibit.io", "https://bsc-rpc.publicnode.com"],
  61: ["https://etc.rivet.link", "https://etc.etcdesktop.com", "https://etc.mytokenpocket.vip"],
  12: ["https://evm.cloutcontracts.net"],
}

// Helper to fetch token balance on any network (tries multiple RPCs)
async function fetchTokenBalance(chainId: number, address: string): Promise<{ balance: string; raw: string; error?: string }> {
  const rpcUrls = NETWORK_RPCS[chainId]
  const contract = TOKEN_CONTRACTS[chainId]
  if (!rpcUrls || !contract) return { balance: "0", raw: "0x0", error: "Unknown chain" }
  
  // For CCS mainnet, check if it's native token by trying balanceOf first, then fallback to native balance
  const balanceOfData = `0x70a08231${address.slice(2).toLowerCase().padStart(64, "0")}`
  
  for (const rpcUrl of rpcUrls) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)
      
      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_call",
          params: [{ to: contract, data: balanceOfData }, "latest"],
        }),
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      const result = await response.json()
      
      // If the call reverted (contract doesn't exist or not ERC20), try native balance for CCS mainnet
      if (result.error && chainId === 12) {
        const nativeResponse = await fetch(rpcUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "eth_getBalance",
            params: [address, "latest"],
          }),
        })
        const nativeResult = await nativeResponse.json()
        if (nativeResult.result) {
          // Native CCS has 18 decimals, convert to token amount (assuming 0 decimals for display)
          const balanceWei = BigInt(nativeResult.result || "0x0")
          const balanceTokens = balanceWei / BigInt(10 ** 18)
          return { balance: balanceTokens.toString(), raw: nativeResult.result, error: "Using native balance (not ERC20)" }
        }
      }
      
      if (result.error) {
        continue // Try next RPC
      }
      
      const raw = result.result || "0x0"
      const balance = BigInt(raw).toString()
      return { balance, raw }
    } catch {
      continue // Try next RPC
    }
  }
  
  return { balance: "0", raw: "0x0", error: "All RPC endpoints failed" }
}

// GET endpoint to check bridge status
export async function GET() {
  const privateKey = process.env.BRIDGE_OPERATOR_PRIVATE_KEY || ""
  const hasPrivateKey = privateKey.length > 0
  
  if (!hasPrivateKey) {
    return NextResponse.json({
      status: "not_configured",
      error: "BRIDGE_OPERATOR_PRIVATE_KEY not set",
    })
  }
  
  let derivedAddress = "unknown"
  try {
    derivedAddress = await deriveAddress(privateKey)
  } catch (e: any) {
    return NextResponse.json({
      status: "error",
      error: "Failed to derive address: " + e.message,
    })
  }
  
  // Fetch balances from all networks in parallel
  const [ethBalance, bnbBalance, etcBalance, ccsBalance, nativeBalance] = await Promise.all([
    fetchTokenBalance(1, derivedAddress),
    fetchTokenBalance(56, derivedAddress),
    fetchTokenBalance(61, derivedAddress),
    fetchTokenBalance(12, derivedAddress),
    // Also get native CCS balance
    fetch(CCS_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getBalance",
        params: [derivedAddress, "latest"],
      }),
    }).then(r => r.json()).then(r => ({
      balance: (Number(BigInt(r.result || "0x0")) / 1e18).toFixed(6),
      raw: r.result || "0x0",
    })).catch(e => ({ balance: "0", raw: "0x0", error: e.message })),
  ])
  
  return NextResponse.json({
    status: "operational",
    operator_address: derivedAddress,
    expected_address: BRIDGE_RECIPIENT,
    addresses_match: derivedAddress.toLowerCase() === BRIDGE_RECIPIENT.toLowerCase(),
    native_ccs_balance: nativeBalance.balance + " CCS (for gas)",
    liquidity: {
      eth: { ...ethBalance, contract: TOKEN_CONTRACTS[1] },
      bnb: { ...bnbBalance, contract: TOKEN_CONTRACTS[56] },
      etc: { ...etcBalance, contract: TOKEN_CONTRACTS[61] },
      ccs_mainnet: { ...ccsBalance, contract: TOKEN_CONTRACTS[12] },
    },
  })
}
