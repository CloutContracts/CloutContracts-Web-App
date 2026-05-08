"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { cacheDB } from "@/lib/cache-db"

interface SolidityFile {
  id: string
  name: string
  content: string
  isActive: boolean
}

interface CompilationResult {
  success: boolean
  bytecode?: string
  abi?: any[]
  errors?: string[]
  warnings?: string[]
  gasEstimate?: number
}

const DEFAULT_CONTRACT = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract HelloWorld {
    string public message = "Hello, CloutContracts!";
    address public owner;
    
    event MessageChanged(string newMessage, address changedBy);
    
    constructor() {
        owner = msg.sender;
    }
    
    function setMessage(string memory _message) public {
        require(bytes(_message).length > 0, "Message cannot be empty");
        message = _message;
        emit MessageChanged(_message, msg.sender);
    }
    
    function getMessage() public view returns (string memory) {
        return message;
    }
    
    function getOwner() public view returns (address) {
        return owner;
    }
}`

const CONTRACT_TEMPLATES = {
  "ERC20 Token": `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ERC20Token {
    string public name = "My Token";
    string public symbol = "MTK";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    address public owner;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    // No constructor arguments needed - edit the name, symbol, decimals above
    // and the initial supply below before deploying
    constructor() {
        owner = msg.sender;
        uint256 initialSupply = 1000000; // 1 million tokens
        totalSupply = initialSupply * 10**decimals;
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }
    
    function transfer(address _to, uint256 _value) public returns (bool) {
        require(balanceOf[msg.sender] >= _value, "Insufficient balance");
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;
        emit Transfer(msg.sender, _to, _value);
        return true;
    }
    
    function approve(address _spender, uint256 _value) public returns (bool) {
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }
    
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
        require(balanceOf[_from] >= _value, "Insufficient balance");
        require(allowance[_from][msg.sender] >= _value, "Insufficient allowance");
        
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        allowance[_from][msg.sender] -= _value;
        
        emit Transfer(_from, _to, _value);
        return true;
    }
}`,

  "ERC721 NFT": `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ERC721NFT {
    // Edit these values before deploying
    string public name = "My NFT Collection";
    string public symbol = "MNFT";
    uint256 public totalSupply;
    address public contractOwner;
    
    mapping(uint256 => address) public ownerOf;
    mapping(address => uint256) public balanceOf;
    mapping(uint256 => address) public getApproved;
    mapping(address => mapping(address => bool)) public isApprovedForAll;
    
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    
    constructor() {
        contractOwner = msg.sender;
    }
    
    function mint(address _to, uint256 _tokenId) public {
        require(_to != address(0), "Cannot mint to zero address");
        require(ownerOf[_tokenId] == address(0), "Token already exists");
        
        ownerOf[_tokenId] = _to;
        balanceOf[_to]++;
        totalSupply++;
        
        emit Transfer(address(0), _to, _tokenId);
    }
    
    function transferFrom(address _from, address _to, uint256 _tokenId) public {
        require(_isApprovedOrOwner(msg.sender, _tokenId), "Not approved or owner");
        require(_to != address(0), "Cannot transfer to zero address");
        
        ownerOf[_tokenId] = _to;
        balanceOf[_from]--;
        balanceOf[_to]++;
        
        delete getApproved[_tokenId];
        
        emit Transfer(_from, _to, _tokenId);
    }
    
    function approve(address _approved, uint256 _tokenId) public {
        address owner = ownerOf[_tokenId];
        require(msg.sender == owner || isApprovedForAll[owner][msg.sender], "Not authorized");
        
        getApproved[_tokenId] = _approved;
        emit Approval(owner, _approved, _tokenId);
    }
    
    function _isApprovedOrOwner(address _spender, uint256 _tokenId) internal view returns (bool) {
        address owner = ownerOf[_tokenId];
        return (_spender == owner || getApproved[_tokenId] == _spender || isApprovedForAll[owner][_spender]);
    }
}`,

  "Multi-Sig Wallet": `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MultiSigWallet {
    address[] public owners;
    uint256 public required;
    uint256 public transactionCount;
    
    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 confirmations;
    }
    
    mapping(uint256 => Transaction) public transactions;
    mapping(uint256 => mapping(address => bool)) public confirmations;
    mapping(address => bool) public isOwner;
    
    event Deposit(address indexed sender, uint256 amount);
    event Submission(uint256 indexed transactionId);
    event Confirmation(address indexed sender, uint256 indexed transactionId);
    event Execution(uint256 indexed transactionId);
    
    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not an owner");
        _;
    }
    
    modifier transactionExists(uint256 _transactionId) {
        require(transactions[_transactionId].to != address(0), "Transaction does not exist");
        _;
    }
    
    modifier notConfirmed(uint256 _transactionId) {
        require(!confirmations[_transactionId][msg.sender], "Transaction already confirmed");
        _;
    }
    
    modifier notExecuted(uint256 _transactionId) {
        require(!transactions[_transactionId].executed, "Transaction already executed");
        _;
    }
    
    // Deploys with msg.sender as the only owner, requiring 1 signature
    // Use addOwner() to add more owners after deployment
    constructor() {
        owners.push(msg.sender);
        isOwner[msg.sender] = true;
        required = 1;
    }
    
    function addOwner(address _owner) public onlyOwner {
        require(_owner != address(0), "Invalid owner");
        require(!isOwner[_owner], "Owner already exists");
        owners.push(_owner);
        isOwner[_owner] = true;
    }
    
    function setRequired(uint256 _required) public onlyOwner {
        require(_required > 0 && _required <= owners.length, "Invalid required number");
        required = _required;
    }
    
    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }
    
    function submitTransaction(address _to, uint256 _value, bytes memory _data) public onlyOwner returns (uint256) {
        uint256 transactionId = transactionCount;
        transactions[transactionId] = Transaction({
            to: _to,
            value: _value,
            data: _data,
            executed: false,
            confirmations: 0
        });
        
        transactionCount++;
        emit Submission(transactionId);
        
        confirmTransaction(transactionId);
        return transactionId;
    }
    
    function confirmTransaction(uint256 _transactionId) 
        public 
        onlyOwner 
        transactionExists(_transactionId) 
        notConfirmed(_transactionId) 
    {
        confirmations[_transactionId][msg.sender] = true;
        transactions[_transactionId].confirmations++;
        
        emit Confirmation(msg.sender, _transactionId);
        
        executeTransaction(_transactionId);
    }
    
    function executeTransaction(uint256 _transactionId) 
        public 
        onlyOwner 
        transactionExists(_transactionId) 
        notExecuted(_transactionId) 
    {
        Transaction storage txn = transactions[_transactionId];
        
        if (txn.confirmations >= required) {
            txn.executed = true;
            (bool success, ) = txn.to.call{value: txn.value}(txn.data);
            require(success, "Transaction execution failed");
            
            emit Execution(_transactionId);
        }
    }
}`,
}

export function SolidityIDE() {
  const [files, setFiles] = useState<SolidityFile[]>([
    {
      id: "1",
      name: "HelloWorld.sol",
      content: DEFAULT_CONTRACT,
      isActive: true,
    },
  ])
  const [activeFileId, setActiveFileId] = useState("1")
  const [newFileName, setNewFileName] = useState("")
  const [compilationResult, setCompilationResult] = useState<CompilationResult | null>(null)
  const [isCompiling, setIsCompiling] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const [deployedContract, setDeployedContract] = useState<string>("")
  const [consoleOutput, setConsoleOutput] = useState<string[]>([])
  const [isMetaMaskConnected, setIsMetaMaskConnected] = useState(false)
  const [metaMaskAccount, setMetaMaskAccount] = useState<string>("")
  const [isClient, setIsClient] = useState(false)
  const [constructorArgs, setConstructorArgs] = useState<Record<string, string>>({})
  const [constructorParams, setConstructorParams] = useState<{name: string, type: string}[]>([])

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()
  const { account, deployContract: deployViaMetaMask } = useAuth()

  const activeFile = files.find((f) => f.id === activeFileId)

  useEffect(() => {
    setIsClient(true)

    const checkMetaMaskConnection = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: "eth_accounts" })
          if (accounts.length > 0) {
            setIsMetaMaskConnected(true)
            setMetaMaskAccount(accounts[0])
            
          } else {
            setIsMetaMaskConnected(false)
            setMetaMaskAccount("")
            
          }
        } catch (error) {
          
          setIsMetaMaskConnected(false)
        }
      } else {
        
        setIsMetaMaskConnected(false)
      }
    }

    checkMetaMaskConnection()

    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length > 0) {
          setIsMetaMaskConnected(true)
          setMetaMaskAccount(accounts[0])
          
        } else {
          setIsMetaMaskConnected(false)
          setMetaMaskAccount("")
          
        }
      })
    }

    return () => {
      if (typeof window !== "undefined" && window.ethereum) {
        window.ethereum.removeAllListeners("accountsChanged")
      }
    }
  }, [])

  const addToConsole = (message: string, type: "info" | "error" | "success" = "info") => {
    const timestamp = new Date().toLocaleTimeString()
    const prefix = type === "error" ? "❌" : type === "success" ? "✅" : "ℹ️"
    setConsoleOutput((prev) => [...prev, `[${timestamp}] ${prefix} ${message}`])
  }

  const createNewFile = () => {
    if (!newFileName.trim()) {
      toast({
        title: "Invalid filename",
        description: "Please enter a valid filename",
        variant: "destructive",
      })
      return
    }

    const fileName = newFileName.endsWith(".sol") ? newFileName : `${newFileName}.sol`
    const newFile: SolidityFile = {
      id: Date.now().toString(),
      name: fileName,
      content: `// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n\ncontract ${newFileName.replace(".sol", "")} {\n    // Your contract code here\n}`,
      isActive: false,
    }

    setFiles((prev) => [...prev, newFile])
    setActiveFileId(newFile.id)
    setNewFileName("")
    addToConsole(`Created new file: ${fileName}`, "success")
  }

  const deleteFile = (fileId: string) => {
    if (files.length === 1) {
      toast({
        title: "Cannot delete",
        description: "You must have at least one file",
        variant: "destructive",
      })
      return
    }

    const fileToDelete = files.find((f) => f.id === fileId)
    setFiles((prev) => prev.filter((f) => f.id !== fileId))

    if (activeFileId === fileId) {
      const remainingFiles = files.filter((f) => f.id !== fileId)
      setActiveFileId(remainingFiles[0].id)
    }

    addToConsole(`Deleted file: ${fileToDelete?.name}`, "info")
  }

  const updateFileContent = (content: string) => {
    setFiles((prev) => prev.map((f) => (f.id === activeFileId ? { ...f, content } : f)))
  }

  const loadTemplate = (templateName: keyof typeof CONTRACT_TEMPLATES) => {
    const newFile: SolidityFile = {
      id: Date.now().toString(),
      name: `${templateName.replace(/\s+/g, "")}.sol`,
      content: CONTRACT_TEMPLATES[templateName],
      isActive: false,
    }

    setFiles((prev) => [...prev, newFile])
    setActiveFileId(newFile.id)
    addToConsole(`Loaded template: ${templateName}`, "success")
  }

  const compileContract = async () => {
    if (!activeFile) return

    setIsCompiling(true)
    addToConsole(`Compiling ${activeFile.name}...`, "info")

    try {
      const cachedResult = cacheDB.getCachedContract(activeFile.content)
      if (cachedResult) {
        addToConsole(`📦 Using cached compilation for ${activeFile.name}`, "success")
        setCompilationResult({
          success: true,
          bytecode: cachedResult.bytecode,
          abi: cachedResult.abi,
          gasEstimate: 21000,
        })
        setIsCompiling(false)
        return
      }

      let result: CompilationResult

      addToConsole(`🔧 Compiling with Solidity compiler (solc)...`, "info")

      // Extract pragma version from source
      const pragmaMatch = activeFile.content.match(/pragma\s+solidity\s+[\^~]?([0-9.]+)/)
      const solcVersion = pragmaMatch ? pragmaMatch[1] : "0.8.19"
      
      addToConsole(`📦 Using Solidity version: ${solcVersion}`, "info")

      const response = await fetch("/api/contracts/compile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: activeFile.content,
          filename: activeFile.name,
          version: solcVersion,
          optimization: true,
          evmVersion: "paris", // Compatible with most EVM networks
        }),
      })

      result = await response.json()

      if (result.success && result.bytecode && result.abi) {
        cacheDB.cacheCompiledContract(activeFile.content, result.bytecode, result.abi)
      }

      setCompilationResult(result)

      if (result.success) {
        const bytecodeSize = result.bytecode ? (result.bytecode.length - 2) / 2 : 0 // -2 for 0x prefix, /2 for hex to bytes
        addToConsole(`✅ Compilation successful for ${activeFile.name}`, "success")
        addToConsole(`📊 Bytecode size: ${bytecodeSize} bytes`, "info")
        if (result.gasEstimate) {
          addToConsole(`⛽ Estimated deployment gas: ${result.gasEstimate.toLocaleString()}`, "info")
        }
        if (result.abi) {
          addToConsole(`📋 ABI generated with ${result.abi.length} entries`, "info")
        }

        if (result.warnings?.length) {
          result.warnings.forEach((warning: string) => {
            addToConsole(`⚠️ ${warning}`, "info")
          })
        }
      } else {
        addToConsole(`❌ Compilation failed for ${activeFile.name}`, "error")
        result.errors?.forEach((error: string) => {
          addToConsole(`${error}`, "error")
        })
      }
    } catch (error: any) {
      addToConsole(`Compilation error: ${error.message}`, "error")
      setCompilationResult({ success: false, errors: [error.message] })
    } finally {
      setIsCompiling(false)
    }
  }

  const deployContract = async () => {
    if (!compilationResult?.success) {
      addToConsole("❌ Please compile the contract first", "error")
      return
    }

    if (typeof window === "undefined" || !window.ethereum) {
      addToConsole("❌ MetaMask not detected. Please install MetaMask extension.", "error")
      alert("MetaMask not detected. Please install the MetaMask browser extension to deploy contracts.")
      return
    }

    if (!isMetaMaskConnected || !metaMaskAccount) {
      addToConsole("🦊 Requesting MetaMask connection...", "info")
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        })

        if (accounts.length > 0) {
          setIsMetaMaskConnected(true)
          setMetaMaskAccount(accounts[0])
          addToConsole(`✅ MetaMask connected: ${accounts[0]}`, "success")
        } else {
          addToConsole("❌ MetaMask connection rejected", "error")
          return
        }
      } catch (error: any) {
        addToConsole(`❌ MetaMask connection failed: ${error.message}`, "error")
        return
      }
    }

    setIsDeploying(true)
    addToConsole("🚀 Starting deployment to CloutContracts network...", "info")

    try {
      const ethereum = window.ethereum as any
      
      // CloutContracts Network configuration
      const CCS_NETWORK = {
        chainId: "0xC", // 12 in hex
        chainName: "CloutContracts Network",
        nativeCurrency: { name: "CCS", symbol: "CCS", decimals: 18 },
        rpcUrls: ["https://evm.cloutcontracts.net"],
        blockExplorerUrls: ["https://blocks.cloutcontracts.net"],
      }
      
      // Check and switch to CloutContracts network
      const currentChainId = await ethereum.request({ method: "eth_chainId" })
      if (currentChainId.toLowerCase() !== CCS_NETWORK.chainId.toLowerCase()) {
        addToConsole("🔄 Switching to CloutContracts network...", "info")
        try {
          await ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: CCS_NETWORK.chainId }],
          })
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            addToConsole("📝 Adding CloutContracts network to wallet...", "info")
            await ethereum.request({
              method: "wallet_addEthereumChain",
              params: [CCS_NETWORK],
            })
          } else if (switchError.code === 4001) {
            throw new Error("User rejected network switch")
          } else {
            throw switchError
          }
        }
      }
      
      addToConsole("📝 Preparing contract deployment transaction...", "info")
      
      // Prepare the deployment transaction
      let bytecode = compilationResult.bytecode?.startsWith("0x") 
        ? compilationResult.bytecode 
        : `0x${compilationResult.bytecode}`
      
      // Check if contract has a constructor with arguments
      const abi = compilationResult.abi || []
      const constructor = abi.find((item: any) => item.type === "constructor")
      
      if (constructor && constructor.inputs && constructor.inputs.length > 0) {
        addToConsole(`⚠️ Contract has constructor with ${constructor.inputs.length} argument(s)`, "info")
        addToConsole(`Constructor args: ${constructor.inputs.map((i: any) => `${i.name}: ${i.type}`).join(", ")}`, "info")
        // For now, we'll try deploying without args - user should ensure contract doesn't require args
        // or provide default values in the contract
      }
      
      // Estimate gas first
      let gasLimit = 5000000 // Default to 5M gas
      try {
        const estimatedGas = await ethereum.request({
          method: "eth_estimateGas",
          params: [{
            from: metaMaskAccount,
            data: bytecode,
          }],
        })
        // Add 20% buffer to estimated gas
        gasLimit = Math.floor(parseInt(estimatedGas, 16) * 1.2)
        addToConsole(`⛽ Estimated gas: ${gasLimit.toLocaleString()}`, "info")
      } catch (gasError: any) {
        addToConsole(`⚠️ Gas estimation failed, using default: ${gasLimit.toLocaleString()}`, "info")
        // If gas estimation fails, the deployment will likely fail too
        // but we'll try anyway with a high gas limit
      }
      
      // Send deployment transaction via MetaMask
      const txHash = await ethereum.request({
        method: "eth_sendTransaction",
        params: [{
          from: metaMaskAccount,
          data: bytecode,
          gas: "0x" + gasLimit.toString(16),
        }],
      })
      
      addToConsole(`📤 Transaction sent: ${txHash}`, "info")
      addToConsole("⏳ Waiting for confirmation...", "info")
      
      // Poll for transaction receipt to get contract address
      let receipt = null
      let attempts = 0
      while (!receipt && attempts < 60) {
        await new Promise(resolve => setTimeout(resolve, 2000))
        try {
          receipt = await ethereum.request({
            method: "eth_getTransactionReceipt",
            params: [txHash],
          })
        } catch {
          // Continue polling
        }
        attempts++
      }
      
      if (receipt) {
        // Check if transaction succeeded
        if (receipt.status === "0x0") {
          addToConsole(`❌ Transaction failed (reverted)`, "error")
          addToConsole(`This usually means:`, "error")
          addToConsole(`  - Constructor requires arguments that weren't provided`, "error")
          addToConsole(`  - Contract code has a require/revert in constructor`, "error")
          addToConsole(`  - Insufficient gas for deployment`, "error")
          addToConsole(`📤 Transaction Hash: ${txHash}`, "info")
        } else if (receipt.contractAddress) {
          setDeployedContract(receipt.contractAddress)
          addToConsole(`✅ Contract deployed successfully!`, "success")
          addToConsole(`📍 Contract Address: ${receipt.contractAddress}`, "info")
          addToConsole(`🔗 View on Explorer: https://blocks.cloutcontracts.net/address/${receipt.contractAddress}`, "info")
        } else {
          addToConsole(`✅ Transaction confirmed but no contract address returned`, "info")
          addToConsole(`📤 Transaction Hash: ${txHash}`, "info")
        }
      } else {
        addToConsole(`⏳ Transaction pending. Check explorer for status.`, "info")
        addToConsole(`📤 Transaction Hash: ${txHash}`, "info")
      }
    } catch (error: any) {
      
      if (error.code === 4001) {
        addToConsole(`❌ Transaction rejected by user`, "error")
      } else {
        addToConsole(`❌ Deployment failed: ${error.message}`, "error")
      }
    } finally {
      setIsDeploying(false)
    }
  }

  if (!isClient) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-primary flex-shrink-0">💻</span>
            <h3 className="text-lg font-semibold truncate">CloutContracts IDE</h3>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button disabled size="sm" variant="outline">
              Loading...
            </Button>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="text-muted-foreground">Loading IDE...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-primary flex-shrink-0">💻</span>
          <h3 className="text-lg font-semibold truncate">CloutContracts IDE</h3>
          {isMetaMaskConnected && metaMaskAccount && (
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200 hidden lg:inline-flex flex-shrink-0"
            >
              🦊 Connected: {metaMaskAccount.slice(0, 6)}...{metaMaskAccount.slice(-4)}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button onClick={compileContract} disabled={isCompiling || !activeFile} size="sm" variant="outline">
            <span className="hidden sm:inline">⚙️ </span>
            {isCompiling ? "Compiling..." : "Compile"}
          </Button>

          <Button
            onClick={deployContract}
            disabled={isDeploying || !compilationResult?.success}
            size="sm"
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
          >
            <span className="hidden sm:inline">▶️ </span>
            {isDeploying ? "Deploying..." : !isMetaMaskConnected ? "Deploy (Connect)" : "Deploy"}
          </Button>
        </div>
      </div>

      <div className="space-y-6 lg:grid lg:grid-cols-4 lg:gap-6 lg:space-y-0">
        {/* File Explorer */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">📁 File Explorer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="NewContract.sol"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="text-xs"
                  onKeyPress={(e) => e.key === "Enter" && createNewFile()}
                />
                <Button onClick={createNewFile} size="sm" variant="outline">
                  +
                </Button>
              </div>

              <ScrollArea className="h-32 sm:h-48">
                <div className="space-y-1">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer text-sm ${
                        file.id === activeFileId
                          ? "bg-blue-100 text-blue-900 border border-blue-300"
                          : "hover:bg-muted/50 text-foreground"
                      }`}
                      onClick={() => setActiveFileId(file.id)}
                    >
                      <div className="flex items-center gap-2">
                        <span className={file.id === activeFileId ? "text-blue-900" : "text-muted-foreground"}>📄</span>
                        <span className="truncate">{file.name}</span>
                      </div>
                      {files.length > 1 && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteFile(file.id)
                          }}
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 hover:bg-destructive/20"
                        >
                          🗑️
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <Separator />

              <div className="space-y-2">
                <Label className="text-xs font-medium">Templates</Label>
                <div className="space-y-1">
                  {Object.keys(CONTRACT_TEMPLATES).map((template) => (
                    <Button
                      key={template}
                      onClick={() => loadTemplate(template as keyof typeof CONTRACT_TEMPLATES)}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs h-8"
                    >
                      💻 {template}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Code Editor */}
        <div className="lg:col-span-2">
          <Card className="border-2 border-dashed border-muted-foreground/20 hover:border-primary/30 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  💻 {activeFile?.name || "No file selected"}
                  {activeFile?.name.endsWith(".sol") && (
                    <Badge variant="secondary" className="text-xs">
                      Solidity
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {compilationResult && (
                    <Badge variant={compilationResult.success ? "default" : "destructive"} className="text-xs">
                      {compilationResult.success ? "✅" : "❌"} {compilationResult.success ? "Compiled" : "Error"}
                    </Badge>
                  )}
                  <Button onClick={() => {}} size="sm" variant="ghost">
                    ⬇️
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {activeFile ? (
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={activeFile.content}
                    onChange={(e) => updateFileContent(e.target.value)}
                    className="w-full h-64 sm:h-80 lg:h-96 p-4 pl-12 font-mono text-sm bg-white text-gray-800 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent shadow-inner overflow-auto"
                    placeholder="// Write your Solidity smart contract here..."
                    spellCheck={false}
                    style={{
                      fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                      lineHeight: "1.6",
                      tabSize: "2",
                      whiteSpace: "pre",
                      overflowWrap: "normal",
                      wordBreak: "normal",
                    }}
                  />
                  <div className="absolute top-4 left-2 text-gray-400 text-xs font-mono pointer-events-none select-none overflow-hidden max-w-[2.5rem] h-64 sm:h-80 lg:h-96">
                    <div className="h-full overflow-hidden" style={{ paddingTop: "0px" }}>
                      {activeFile.content
                        .split("\n")
                        .slice(0, Math.floor(384 / (1.6 * 14)))
                        .map((_, i) => (
                          <div key={i} className="h-[1.6em] text-right pr-1 leading-[1.6]">
                            {i + 1}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-64 sm:h-80 lg:h-96 flex items-center justify-center text-muted-foreground bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <div className="text-6xl mb-4">💻</div>
                    <p className="text-lg font-medium">No file selected</p>
                    <p className="text-sm text-gray-500">Create a new file or select an existing one to start coding</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Compilation Status */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Compilation</CardTitle>
            </CardHeader>
            <CardContent>
              {compilationResult ? (
                <div className="space-y-2">
                  <div
                    className={`flex items-center gap-2 text-sm ${
                      compilationResult.success ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {compilationResult.success ? "✅" : "❌"} {compilationResult.success ? "Success" : "Failed"}
                  </div>

                  {compilationResult.errors && compilationResult.errors.length > 0 && (
                    <div className="text-xs text-red-600 space-y-1">
                      {compilationResult.errors.map((error, i) => (
                        <div key={i} className="p-2 bg-red-50 dark:bg-red-950/20 rounded">
                          {error}
                        </div>
                      ))}
                    </div>
                  )}

                  {compilationResult.warnings && compilationResult.warnings.length > 0 && (
                    <div className="text-xs text-yellow-600 space-y-1">
                      {compilationResult.warnings.map((warning, i) => (
                        <div key={i} className="p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded">
                          {warning}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No compilation results</p>
              )}
            </CardContent>
          </Card>

          {/* Deployment Status */}
          {deployedContract && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Deployed Contract</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-xs font-mono bg-muted/50 p-2 rounded break-all">{deployedContract}</div>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(deployedContract)
                      toast({ title: "Copied to clipboard" })
                    }}
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                  >
                    Copy Address
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Console */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">💻 Console</CardTitle>
                <Button onClick={() => setConsoleOutput([])} size="sm" variant="ghost" className="h-6 text-xs">
                  Clear
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-32 sm:h-48">
                <div className="space-y-1">
                  {consoleOutput.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Console output will appear here...</p>
                  ) : (
                    consoleOutput.map((output, i) => (
                      <div key={i} className="text-xs font-mono p-1 rounded bg-muted/30">
                        {output}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
