import { type NextRequest, NextResponse } from "next/server"

interface CompilationInput {
  source: string
  filename: string
  version?: string
  optimization?: boolean
  evmVersion?: string
}

interface CompilationOutput {
  success: boolean
  bytecode?: string
  abi?: any[]
  errors?: string[]
  warnings?: string[]
  gasEstimate?: number
  contractName?: string
}

// Load solc dynamically
let solc: any = null

async function loadCompiler(): Promise<any> {
  if (solc) return solc
  
  try {
    // Dynamic import of solc
    const solcModule = await import("solc")
    solc = solcModule.default || solcModule
    return solc
  } catch (error) {
    console.error("Failed to load solc:", error)
    throw new Error("Solidity compiler not available")
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      source,
      filename,
      version = "0.8.19",
      optimization = true,
      evmVersion = "paris",
    }: CompilationInput = await request.json()

    if (!source || !filename) {
      return NextResponse.json(
        { success: false, errors: ["Source code and filename are required"] },
        { status: 400 }
      )
    }

    // Load the Solidity compiler
    const compiler = await loadCompiler()

    // Extract contract name from source
    const contractMatch = source.match(/contract\s+(\w+)/)
    const contractName = contractMatch ? contractMatch[1] : "Contract"

    // Prepare Standard JSON input for solc
    const input = {
      language: "Solidity",
      sources: {
        [filename]: {
          content: source,
        },
      },
      settings: {
        optimizer: {
          enabled: optimization,
          runs: 200,
        },
        evmVersion: evmVersion,
        outputSelection: {
          "*": {
            "*": ["abi", "evm.bytecode.object", "evm.gasEstimates"],
          },
        },
      },
    }

    // Compile the contract
    const outputJson = compiler.compile(JSON.stringify(input))
    const output = JSON.parse(outputJson)

    // Collect errors and warnings
    const errors: string[] = []
    const warnings: string[] = []

    if (output.errors) {
      for (const error of output.errors) {
        if (error.severity === "error") {
          errors.push(error.formattedMessage || error.message)
        } else if (error.severity === "warning") {
          warnings.push(error.formattedMessage || error.message)
        }
      }
    }

    // If there are compilation errors, return them
    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        errors,
        warnings,
      })
    }

    // Extract compiled contract data
    const contracts = output.contracts?.[filename]
    if (!contracts || Object.keys(contracts).length === 0) {
      return NextResponse.json({
        success: false,
        errors: ["No contracts found in compilation output"],
        warnings,
      })
    }

    // Get the first contract (or the one matching contractName)
    const compiledContract = contracts[contractName] || Object.values(contracts)[0]
    
    if (!compiledContract) {
      return NextResponse.json({
        success: false,
        errors: [`Contract ${contractName} not found in compilation output`],
        warnings,
      })
    }

    const bytecode = compiledContract.evm?.bytecode?.object
    const abi = compiledContract.abi

    // Estimate gas from compilation output
    let gasEstimate = 21000 // Base gas
    if (compiledContract.evm?.gasEstimates?.creation) {
      const creation = compiledContract.evm.gasEstimates.creation
      gasEstimate = (creation.codeDepositCost || 0) + (creation.executionCost || 0)
    }

    return NextResponse.json({
      success: true,
      bytecode: bytecode ? `0x${bytecode}` : undefined,
      abi,
      warnings,
      gasEstimate,
      contractName,
    })
  } catch (error: any) {
    console.error("Compilation error:", error)
    return NextResponse.json(
      {
        success: false,
        errors: [`Compilation failed: ${error.message}`],
        warnings: [],
      },
      { status: 500 }
    )
  }
}
