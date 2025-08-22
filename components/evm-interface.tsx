"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Code, Play, Zap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"

export function EVMInterface() {
  const [contractCode, setContractCode] = useState("")
  const [contractAddress, setContractAddress] = useState("")
  const [functionName, setFunctionName] = useState("")
  const [functionArgs, setFunctionArgs] = useState("")
  const [isDeploying, setIsDeploying] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const { toast } = useToast()
  const { account } = useAuth()

  const deployContract = async () => {
    if (!contractCode.trim()) {
      toast({
        title: "No contract code",
        description: "Please enter Solidity contract code to deploy",
        variant: "destructive",
      })
      return
    }

    if (!account) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to deploy contracts",
        variant: "destructive",
      })
      return
    }

    setIsDeploying(true)
    try {
      const response = await fetch("/api/contracts/deploy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contractCode,
          address: account,
          constructorArgs: [],
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Deployment failed")
      }

      setContractAddress(result.contractAddress)

      toast({
        title: "Contract deployed",
        description: `Contract deployed at ${result.contractAddress.slice(0, 10)}...`,
      })
    } catch (error: any) {
      toast({
        title: "Deployment failed",
        description: error.message || "Failed to deploy contract",
        variant: "destructive",
      })
    } finally {
      setIsDeploying(false)
    }
  }

  const executeFunction = async () => {
    if (!contractAddress || !functionName) {
      toast({
        title: "Missing information",
        description: "Please provide contract address and function name",
        variant: "destructive",
      })
      return
    }

    if (!account) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to interact with contracts",
        variant: "destructive",
      })
      return
    }

    setIsExecuting(true)
    try {
      const response = await fetch("/api/rpc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_call",
          params: [
            {
              to: contractAddress,
              data: `0x${functionName}`, // This would need proper ABI encoding in production
            },
            "latest",
          ],
          id: 1,
        }),
      })

      const result = await response.json()

      if (result.error) {
        throw new Error(result.error.message)
      }

      toast({
        title: "Function executed",
        description: `Successfully called ${functionName}()`,
      })
    } catch (error: any) {
      toast({
        title: "Execution failed",
        description: error.message || "Failed to execute function",
        variant: "destructive",
      })
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Code className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">EVM Interface</h3>
        <Badge variant="secondary" className="bg-accent/10 text-accent">
          <Zap className="w-3 h-3 mr-1" />
          Live Instance
        </Badge>
      </div>

      <Tabs defaultValue="deploy" className="space-y-4">
        <TabsList>
          <TabsTrigger value="deploy">Deploy Contract</TabsTrigger>
          <TabsTrigger value="interact">Interact</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="deploy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deploy Smart Contract</CardTitle>
              <CardDescription>Write and deploy Solidity contracts to the CloutContracts EVM</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contract-code">Solidity Code</Label>
                <Textarea
                  id="contract-code"
                  placeholder="pragma solidity ^0.8.0;

contract MyContract {
    string public message;
    
    constructor(string memory _message) {
        message = _message;
    }
    
    function setMessage(string memory _message) public {
        message = _message;
    }
}"
                  value={contractCode}
                  onChange={(e) => setContractCode(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>

              <Button onClick={deployContract} disabled={isDeploying || !account} className="w-full">
                <Play className="w-4 h-4 mr-2" />
                {isDeploying ? "Deploying..." : "Deploy Contract"}
              </Button>

              {contractAddress && (
                <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                  <p className="text-sm font-medium text-accent">Contract Deployed!</p>
                  <p className="text-xs text-muted-foreground font-mono">{contractAddress}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Interact with Contract</CardTitle>
              <CardDescription>Call functions on deployed smart contracts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contract-address">Contract Address</Label>
                <Input
                  id="contract-address"
                  placeholder="0x..."
                  value={contractAddress}
                  onChange={(e) => setContractAddress(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="function-name">Function Name</Label>
                <Input
                  id="function-name"
                  placeholder="setMessage"
                  value={functionName}
                  onChange={(e) => setFunctionName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="function-args">Arguments (JSON)</Label>
                <Input
                  id="function-args"
                  placeholder='["Hello World"]'
                  value={functionArgs}
                  onChange={(e) => setFunctionArgs(e.target.value)}
                />
              </div>

              <Button onClick={executeFunction} disabled={isExecuting || !account} className="w-full">
                <Zap className="w-4 h-4 mr-2" />
                {isExecuting ? "Executing..." : "Execute Function"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="cursor-pointer hover:bg-accent/5 transition-colors">
              <CardHeader>
                <CardTitle className="text-base">ERC-20 Token</CardTitle>
                <CardDescription>Standard fungible token contract</CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:bg-accent/5 transition-colors">
              <CardHeader>
                <CardTitle className="text-base">ERC-721 NFT</CardTitle>
                <CardDescription>Non-fungible token contract</CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:bg-accent/5 transition-colors">
              <CardHeader>
                <CardTitle className="text-base">Multi-Sig Wallet</CardTitle>
                <CardDescription>Secure multi-signature wallet</CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:bg-accent/5 transition-colors">
              <CardHeader>
                <CardTitle className="text-base">DAO Governance</CardTitle>
                <CardDescription>Decentralized governance contract</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
