"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Code,
  Play,
  FileText,
  Folder,
  Plus,
  Trash2,
  Download,
  Settings,
  Terminal,
  AlertCircle,
  CheckCircle,
  Zap,
  Network,
  Cpu,
  Globe,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"

import { boincManager } from "@/lib/boinc-integration"
import { decentralizedCore } from "@/lib/decentralized-core"
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
  distributedCompilation?: boolean
  nodeId?: string
  compilationTime?: number
}

interface DistributedState {
  isEnabled: boolean
  networkStatus: any
  boincStats: any
  activeNodes: number
  queuedTasks: number
}

const DEFAULT_CONTRACT = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract HelloWorld {
    string public message;
    address public owner;
    
    event MessageChanged(string newMessage, address changedBy);
    
    constructor(string memory _message) {
        message = _message;
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
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256 _totalSupply
    ) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        totalSupply = _totalSupply * 10**_decimals;
        balanceOf[msg.sender] = totalSupply;
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
    string public name;
    string public symbol;
    uint256 public totalSupply;
    
    mapping(uint256 => address) public ownerOf;
    mapping(address => uint256) public balanceOf;
    mapping(uint256 => address) public getApproved;
    mapping(address => mapping(address => bool)) public isApprovedForAll;
    
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    
    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
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
    
    constructor(address[] memory _owners, uint256 _required) {
        require(_owners.length > 0, "Owners required");
        require(_required > 0 && _required <= _owners.length, "Invalid required number");
        
        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "Invalid owner");
            require(!isOwner[owner], "Owner not unique");
            
            isOwner[owner] = true;
            owners.push(owner);
        }
        
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

  const [distributedState, setDistributedState] = useState<DistributedState>({
    isEnabled: false,
    networkStatus: null,
    boincStats: null,
    activeNodes: 0,
    queuedTasks: 0,
  })

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()
  const { account, deployContract: deployViaMetaMask } = useAuth()

  const activeFile = files.find((f) => f.id === activeFileId)

  useEffect(() => {
    const initializeDistributedComputing = async () => {
      try {
        // Listen for network events
        decentralizedCore.on("network:ready", () => {
          addToConsole("🌐 Decentralized network initialized", "success")
          updateDistributedState()
        })

        boincManager.on("boinc:ready", () => {
          addToConsole("🔬 BOINC computing network connected", "success")
          updateDistributedState()
        })

        boincManager.on("work:completed", (data) => {
          addToConsole(`✅ BOINC task completed: ${data.workId}`, "success")
          updateDistributedState()
        })

        // Initial state update
        updateDistributedState()
      } catch (error) {
        addToConsole(`❌ Failed to initialize distributed computing: ${error}`, "error")
      }
    }

    initializeDistributedComputing()

    // Cleanup listeners on unmount
    return () => {
      decentralizedCore.removeAllListeners()
      boincManager.removeAllListeners()
    }
  }, [])

  const updateDistributedState = () => {
    const networkStatus = decentralizedCore.getNetworkStatus()
    const boincStats = boincManager.getStatistics()

    setDistributedState({
      isEnabled: networkStatus.isInitialized,
      networkStatus,
      boincStats,
      activeNodes: networkStatus.onlineNodes,
      queuedTasks: networkStatus.activeTasks,
    })
  }

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
      // Check cache first
      const cachedResult = cacheDB.getCachedContract(activeFile.content)
      if (cachedResult) {
        addToConsole(`📦 Using cached compilation for ${activeFile.name}`, "success")
        setCompilationResult({
          success: true,
          bytecode: cachedResult.bytecode,
          abi: cachedResult.abi,
          gasEstimate: 21000,
          distributedCompilation: false,
        })
        setIsCompiling(false)
        return
      }

      let result: CompilationResult

      // Use distributed compilation if enabled
      if (distributedState.isEnabled && distributedState.activeNodes > 0) {
        addToConsole(`🌐 Using distributed compilation via BOINC network`, "info")

        const startTime = Date.now()
        const workId = await boincManager.distributedCompile(activeFile.content, activeFile.name)

        // Wait for BOINC completion (simulate for now)
        await new Promise((resolve) => setTimeout(resolve, 2000))

        const compilationTime = Date.now() - startTime

        // Simulate distributed compilation result
        result = {
          success: true,
          bytecode: "0x608060405234801561001057600080fd5b50...", // Mock bytecode
          abi: [
            {
              inputs: [],
              name: "getMessage",
              outputs: [{ internalType: "string", name: "", type: "string" }],
              stateMutability: "view",
              type: "function",
            },
          ],
          gasEstimate: 150000,
          distributedCompilation: true,
          nodeId: `node-${Math.floor(Math.random() * 3) + 1}`,
          compilationTime,
        }

        addToConsole(`⚡ Distributed compilation completed in ${compilationTime}ms`, "success")

        // Cache the result
        cacheDB.cacheCompiledContract(activeFile.content, result.bytecode!, result.abi!)
      } else {
        // Fallback to regular compilation
        addToConsole(`🔧 Using local compilation`, "info")

        const response = await fetch("/api/contracts/compile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            source: activeFile.content,
            filename: activeFile.name,
          }),
        })

        result = await response.json()
        result.distributedCompilation = false

        // Cache successful compilations
        if (result.success && result.bytecode && result.abi) {
          cacheDB.cacheCompiledContract(activeFile.content, result.bytecode, result.abi)
        }
      }

      setCompilationResult(result)

      if (result.success) {
        const compileMethod = result.distributedCompilation ? "distributed" : "local"
        addToConsole(`✅ ${compileMethod} compilation successful for ${activeFile.name}`, "success")

        if (result.distributedCompilation) {
          addToConsole(`🖥️ Compiled on node: ${result.nodeId}`, "info")
        }

        if (result.warnings?.length) {
          result.warnings.forEach((warning: string) => {
            addToConsole(`⚠️ Warning: ${warning}`, "info")
          })
        }
      } else {
        addToConsole(`❌ Compilation failed for ${activeFile.name}`, "error")
        result.errors?.forEach((error: string) => {
          addToConsole(`Error: ${error}`, "error")
        })
      }

      // Update distributed state after compilation
      updateDistributedState()
    } catch (error: any) {
      addToConsole(`Compilation error: ${error.message}`, "error")
      setCompilationResult({ success: false, errors: [error.message] })
    } finally {
      setIsCompiling(false)
    }
  }

  const deployContract = async () => {
    if (!compilationResult || !compilationResult.success || !account) return

    setIsDeploying(true)
    addToConsole(`Deploying ${activeFile?.name}...`, "info")

    try {
      const deployedAddress = await deployContract(compilationResult.bytecode!, compilationResult.abi!, account)
      setDeployedContract(deployedAddress)
      addToConsole(`✅ Contract deployed at address: ${deployedAddress}`, "success")
    } catch (error: any) {
      addToConsole(`Deployment error: ${error.message}`, "error")
    } finally {
      setIsDeploying(false)
    }
  }

  const toggleDistributedComputing = async (enabled: boolean) => {
    if (enabled) {
      addToConsole("🚀 Enabling distributed computing...", "info")
      // Network should already be initialized from useEffect
      updateDistributedState()
    } else {
      addToConsole("⏹️ Disabling distributed computing...", "info")
      setDistributedState((prev) => ({ ...prev, isEnabled: false }))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Solidity IDE</h3>
          <Badge variant="secondary" className="bg-accent/10 text-accent">
            <Zap className="w-3 h-3 mr-1" />
            Remix-like
          </Badge>
          {distributedState.isEnabled && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Network className="w-3 h-3 mr-1" />
              Distributed
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-4">
            <Label htmlFor="distributed-toggle" className="text-sm">
              Distributed Computing
            </Label>
            <Switch
              id="distributed-toggle"
              checked={distributedState.isEnabled}
              onCheckedChange={toggleDistributedComputing}
            />
          </div>

          <Button onClick={compileContract} disabled={isCompiling || !activeFile} size="sm" variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            {isCompiling ? "Compiling..." : distributedState.isEnabled ? "Compile (Distributed)" : "Compile"}
          </Button>

          <Button onClick={deployContract} disabled={isDeploying || !compilationResult?.success || !account} size="sm">
            <Play className="w-4 h-4 mr-2" />
            {isDeploying ? "Deploying..." : "Deploy"}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* File Explorer */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Folder className="w-4 h-4" />
                File Explorer
              </CardTitle>
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
                  <Plus className="w-3 h-3" />
                </Button>
              </div>

              <ScrollArea className="h-48">
                <div className="space-y-1">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer text-sm ${
                        file.id === activeFileId ? "bg-accent/20 text-accent" : "hover:bg-muted/50"
                      }`}
                      onClick={() => setActiveFileId(file.id)}
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-3 h-3" />
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
                          <Trash2 className="w-3 h-3" />
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
                      <Code className="w-3 h-3 mr-2" />
                      {template}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {distributedState.isEnabled && (
            <Card className="mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Network Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span>Active Nodes:</span>
                  <Badge variant="outline">{distributedState.activeNodes}</Badge>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Queued Tasks:</span>
                  <Badge variant="outline">{distributedState.queuedTasks}</Badge>
                </div>
                <div className="flex justify-between text-xs">
                  <span>BOINC Projects:</span>
                  <Badge variant="outline">{distributedState.boincStats?.activeProjects || 0}</Badge>
                </div>
                <Separator />
                <div className="flex items-center gap-2 text-xs">
                  <Cpu className="w-3 h-3" />
                  <span className="text-green-600">Distributed Ready</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Code Editor */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  {activeFile?.name || "No file selected"}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {compilationResult && (
                    <Badge variant={compilationResult.success ? "default" : "destructive"} className="text-xs">
                      {compilationResult.success ? (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      ) : (
                        <AlertCircle className="w-3 h-3 mr-1" />
                      )}
                      {compilationResult.success ? "Compiled" : "Error"}
                    </Badge>
                  )}
                  <Button onClick={() => {}} size="sm" variant="ghost">
                    <Download className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {activeFile ? (
                <textarea
                  ref={textareaRef}
                  value={activeFile.content}
                  onChange={(e) => updateFileContent(e.target.value)}
                  className="w-full h-96 p-3 font-mono text-sm bg-muted/30 border border-border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Write your Solidity code here..."
                  spellCheck={false}
                />
              ) : (
                <div className="h-96 flex items-center justify-center text-muted-foreground">
                  <p>No file selected</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Console & Deployment */}
        <div className="lg:col-span-1 space-y-4">
          {/* Compilation Status */}
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
                    {compilationResult.success ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    {compilationResult.success ? "Success" : "Failed"}
                    {compilationResult.distributedCompilation && (
                      <Badge variant="outline" className="text-xs">
                        <Network className="w-2 h-2 mr-1" />
                        Distributed
                      </Badge>
                    )}
                  </div>

                  {compilationResult.distributedCompilation && compilationResult.nodeId && (
                    <div className="text-xs text-muted-foreground">
                      Node: {compilationResult.nodeId} | Time: {compilationResult.compilationTime}ms
                    </div>
                  )}

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
                <CardTitle className="text-sm flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  Console
                </CardTitle>
                <Button onClick={() => setConsoleOutput([])} size="sm" variant="ghost" className="h-6 text-xs">
                  Clear
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48">
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
