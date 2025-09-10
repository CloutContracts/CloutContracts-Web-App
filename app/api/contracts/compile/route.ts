import { type NextRequest, NextResponse } from "next/server"
import { decentralizedCore } from "@/lib/decentralized-core"
import { cacheDB } from "@/lib/cache-db"

interface CompilationInput {
  source: string
  filename: string
  version?: string
  optimization?: boolean
  useSharding?: boolean
}

interface CompilationOutput {
  success: boolean
  bytecode?: string
  abi?: any[]
  errors?: string[]
  warnings?: string[]
  gasEstimate?: number
  shardIds?: string[]
  isSharded?: boolean
  originalSize?: number
  compressedSize?: number
}

export async function POST(request: NextRequest) {
  try {
    const {
      source,
      filename,
      version = "0.8.19",
      optimization = true,
      useSharding = false,
    }: CompilationInput = await request.json()

    if (!source || !filename) {
      return NextResponse.json({ success: false, errors: ["Source code and filename are required"] }, { status: 400 })
    }

    console.log(`[v0] Compiling ${filename} (${source.length} chars)${useSharding ? " with sharding" : ""}`)

    const cacheKey = `${filename}-${hashString(source)}`
    const cachedResult = cacheDB.getCachedContract(source)
    if (cachedResult) {
      console.log(`[v0] Using cached compilation for ${filename}`)
      return NextResponse.json({
        success: true,
        bytecode: cachedResult.bytecode,
        abi: cachedResult.abi,
        gasEstimate: estimateGas(source),
        isSharded: false,
      })
    }

    // Basic Solidity syntax validation
    const syntaxErrors = validateSoliditySyntax(source)
    if (syntaxErrors.length > 0) {
      return NextResponse.json({
        success: false,
        errors: syntaxErrors,
        warnings: [],
      })
    }

    const sourceSize = new TextEncoder().encode(source).length
    const shouldShard = useSharding || sourceSize > 50000 // Auto-shard files > 50KB

    let compilationResult: CompilationOutput

    if (shouldShard) {
      console.log(`[v0] Large contract detected (${sourceSize} bytes), using data sharding`)
      compilationResult = await compileWithSharding(source, filename, version, optimization)
    } else {
      compilationResult = await compileSolidity(source, filename, version, optimization)
    }

    if (compilationResult.success && compilationResult.bytecode && compilationResult.abi) {
      cacheDB.cacheCompiledContract(source, compilationResult.bytecode, compilationResult.abi)
    }

    return NextResponse.json(compilationResult)
  } catch (error: any) {
    console.error("Compilation error:", error)
    return NextResponse.json(
      {
        success: false,
        errors: [`Compilation failed: ${error.message}`],
        warnings: [],
      },
      { status: 500 },
    )
  }
}

async function compileWithSharding(
  source: string,
  filename: string,
  version: string,
  optimization: boolean,
): Promise<CompilationOutput> {
  try {
    const sourceBytes = new TextEncoder().encode(source)
    const originalSize = sourceBytes.length

    console.log(`[v0] Sharding contract ${filename} (${originalSize} bytes)`)

    // Shard the source code
    const shardIds = await decentralizedCore.shardData(sourceBytes, filename)

    // Compile the original (for now - in production, you'd compile from shards)
    const compilationResult = await compileSolidity(source, filename, version, optimization)

    if (compilationResult.success) {
      // Also shard the compiled bytecode if it's large
      const bytecodeBytes = new TextEncoder().encode(compilationResult.bytecode || "")
      let bytecodeShards: string[] = []

      if (bytecodeBytes.length > 32000) {
        // Shard bytecode > 32KB
        bytecodeShards = await decentralizedCore.shardData(bytecodeBytes, `${filename}-bytecode`)
        console.log(`[v0] Bytecode sharded into ${bytecodeShards.length} pieces`)
      }

      return {
        ...compilationResult,
        shardIds,
        isSharded: true,
        originalSize,
        compressedSize: shardIds.length * 64 * 1024, // Estimate based on shard size
        warnings: [
          ...(compilationResult.warnings || []),
          `Contract sharded into ${shardIds.length} pieces for distributed storage`,
        ],
      }
    }

    return compilationResult
  } catch (error: any) {
    console.error("[v0] Sharding compilation failed:", error)
    return {
      success: false,
      errors: [`Sharding compilation failed: ${error.message}`],
    }
  }
}

function validateSoliditySyntax(source: string): string[] {
  const errors: string[] = []

  // Check for SPDX license identifier
  if (!source.includes("SPDX-License-Identifier")) {
    errors.push("Warning: SPDX license identifier not found")
  }

  // Check for pragma statement
  if (!source.includes("pragma solidity")) {
    errors.push("Error: Missing pragma solidity statement")
  }

  // Check for basic contract structure
  if (!source.includes("contract ") && !source.includes("library ") && !source.includes("interface ")) {
    errors.push("Error: No contract, library, or interface found")
  }

  // Check for unmatched braces
  const openBraces = (source.match(/{/g) || []).length
  const closeBraces = (source.match(/}/g) || []).length
  if (openBraces !== closeBraces) {
    errors.push("Error: Unmatched braces - check your contract structure")
  }

  // Check for unmatched parentheses
  const openParens = (source.match(/\(/g) || []).length
  const closeParens = (source.match(/\)/g) || []).length
  if (openParens !== closeParens) {
    errors.push("Error: Unmatched parentheses")
  }

  // Check for missing semicolons (basic check)
  const lines = source.split("\n")
  lines.forEach((line, index) => {
    const trimmed = line.trim()
    if (
      trimmed &&
      !trimmed.startsWith("//") &&
      !trimmed.startsWith("/*") &&
      !trimmed.startsWith("*") &&
      !trimmed.endsWith("{") &&
      !trimmed.endsWith("}") &&
      !trimmed.includes("pragma") &&
      !trimmed.includes("import") &&
      !trimmed.includes("SPDX") &&
      trimmed.length > 10 &&
      !trimmed.endsWith(";")
    ) {
      // This is a very basic check - in production you'd want more sophisticated parsing
      if (trimmed.includes("=") || trimmed.includes("function") || trimmed.includes("return")) {
        errors.push(`Warning: Line ${index + 1} might be missing a semicolon`)
      }
    }
  })

  return errors
}

async function compileSolidity(
  source: string,
  filename: string,
  version: string,
  optimization: boolean,
): Promise<CompilationOutput> {
  // In a real implementation, this would use the actual Solidity compiler (solc)
  // For this demo, we'll simulate the compilation process

  const warnings: string[] = []

  // Extract contract name from source
  const contractMatch = source.match(/contract\s+(\w+)/)
  const contractName = contractMatch ? contractMatch[1] : "UnknownContract"

  // Simulate some common warnings
  if (!source.includes("constructor")) {
    warnings.push("No constructor found - using default constructor")
  }

  if (source.includes("public") && !source.includes("external")) {
    warnings.push("Consider using 'external' instead of 'public' for functions not called internally")
  }

  if (!optimization) {
    warnings.push("Optimization is disabled - bytecode will be larger")
  }

  // Generate mock bytecode (in production, this would come from solc)
  const mockBytecode = generateMockBytecode(source, contractName)

  // Generate mock ABI (in production, this would come from solc)
  const mockABI = generateMockABI(source, contractName)

  // Estimate gas (mock calculation)
  const gasEstimate = estimateGas(source)

  return {
    success: true,
    bytecode: mockBytecode,
    abi: mockABI,
    warnings,
    gasEstimate,
  }
}

function generateMockBytecode(source: string, contractName: string): string {
  // This is a mock bytecode generator for demo purposes
  // In production, you would use the actual Solidity compiler

  const baseCode = "608060405234801561001057600080fd5b50"
  const contractHash = hashString(contractName)
  const sourceHash = hashString(source.substring(0, 100))

  return `0x${baseCode}${contractHash}${sourceHash}${"0".repeat(100)}`
}

function generateMockABI(source: string, contractName: string): any[] {
  const abi: any[] = []

  // Extract constructor
  const constructorMatch = source.match(/constructor\s*$$[^)]*$$/)
  if (constructorMatch) {
    abi.push({
      type: "constructor",
      inputs: extractFunctionParams(constructorMatch[0]),
      stateMutability: "nonpayable",
    })
  }

  // Extract functions
  const functionMatches = source.matchAll(/function\s+(\w+)\s*$$[^)]*$$(?:\s+\w+)*(?:\s+returns\s*$$[^)]*$$)?/g)
  for (const match of functionMatches) {
    const functionName = match[1]
    const isView = match[0].includes("view") || match[0].includes("pure")
    const isPayable = match[0].includes("payable")

    abi.push({
      type: "function",
      name: functionName,
      inputs: extractFunctionParams(match[0]),
      outputs: extractFunctionOutputs(match[0]),
      stateMutability: isPayable ? "payable" : isView ? "view" : "nonpayable",
    })
  }

  // Extract events
  const eventMatches = source.matchAll(/event\s+(\w+)\s*$$[^)]*$$/g)
  for (const match of eventMatches) {
    const eventName = match[1]
    abi.push({
      type: "event",
      name: eventName,
      inputs: extractEventParams(match[0]),
    })
  }

  return abi
}

function extractFunctionParams(functionSignature: string): any[] {
  // Basic parameter extraction - in production you'd want more robust parsing
  const paramsMatch = functionSignature.match(/$$([^)]*)$$/)
  if (!paramsMatch || !paramsMatch[1].trim()) return []

  const params = paramsMatch[1].split(",").map((param) => {
    const parts = param.trim().split(/\s+/)
    if (parts.length >= 2) {
      return {
        name: parts[parts.length - 1],
        type: parts.slice(0, -1).join(" "),
      }
    }
    return { name: "", type: param.trim() }
  })

  return params.filter((p) => p.type)
}

function extractFunctionOutputs(functionSignature: string): any[] {
  const returnsMatch = functionSignature.match(/returns\s*$$([^)]*)$$/)
  if (!returnsMatch || !returnsMatch[1].trim()) return []

  return extractFunctionParams(`(${returnsMatch[1]})`)
}

function extractEventParams(eventSignature: string): any[] {
  const params = extractFunctionParams(eventSignature)
  return params.map((param) => ({
    ...param,
    indexed: false, // In production, you'd parse for 'indexed' keyword
  }))
}

function estimateGas(source: string): number {
  // Mock gas estimation based on source code complexity
  const baseGas = 21000
  const codeComplexity = source.length / 100
  const functionCount = (source.match(/function/g) || []).length
  const storageOperations = (source.match(/mapping|struct|array/g) || []).length

  return Math.floor(baseGas + codeComplexity * 1000 + functionCount * 5000 + storageOperations * 10000)
}

function hashString(str: string): string {
  // Simple hash function for demo purposes
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, "0")
}
