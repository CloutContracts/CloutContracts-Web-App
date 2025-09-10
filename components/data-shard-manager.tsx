"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Database,
  HardDrive,
  Network,
  Upload,
  Download,
  FileText,
  Zap,
  CheckCircle,
  AlertCircle,
  Layers,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ShardInfo {
  id: string
  filename: string
  size: number
  shardCount: number
  created: string
  status: "complete" | "partial" | "corrupted"
}

interface NetworkStats {
  networkStatus: any
  shardingEnabled: boolean
  totalShards: number
  activeNodes: number
  replicationFactor: number
  maxShardSize: number
  compressionRatio: number
}

export function DataShardManager() {
  const [shards, setShards] = useState<ShardInfo[]>([])
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [reconstructShardIds, setReconstructShardIds] = useState("")

  const { toast } = useToast()

  useEffect(() => {
    loadNetworkStats()
    loadShardList()
  }, [])

  const loadNetworkStats = async () => {
    try {
      const response = await fetch("/api/data/shards")
      const stats = await response.json()
      setNetworkStats(stats)
    } catch (error) {
      console.error("Failed to load network stats:", error)
    }
  }

  const loadShardList = () => {
    // Mock shard data - in production, this would come from the decentralized network
    const mockShards: ShardInfo[] = [
      {
        id: "contract-1-shards",
        filename: "LargeContract.sol",
        size: 125000,
        shardCount: 3,
        created: new Date().toISOString(),
        status: "complete",
      },
      {
        id: "bytecode-1-shards",
        filename: "CompiledBytecode.bin",
        size: 89000,
        shardCount: 2,
        created: new Date(Date.now() - 3600000).toISOString(),
        status: "complete",
      },
    ]
    setShards(mockShards)
  }

  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to shard",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Convert file to base64
      const fileData = await fileToBase64(selectedFile)

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch("/api/data/shards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: fileData,
          filename: selectedFile.name,
        }),
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const result = await response.json()

      if (result.success) {
        toast({
          title: "File sharded successfully",
          description: `Created ${result.totalShards} shards across ${result.networkNodes} nodes`,
        })

        // Add to shard list
        const newShard: ShardInfo = {
          id: result.shardIds[0].split("-")[0] + "-shards",
          filename: selectedFile.name,
          size: selectedFile.size,
          shardCount: result.totalShards,
          created: new Date().toISOString(),
          status: "complete",
        }
        setShards((prev) => [newShard, ...prev])
      } else {
        throw new Error(result.error || "Sharding failed")
      }
    } catch (error: any) {
      toast({
        title: "Sharding failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      setSelectedFile(null)
    }
  }

  const handleReconstruct = async () => {
    if (!reconstructShardIds.trim()) {
      toast({
        title: "No shard IDs provided",
        description: "Please enter comma-separated shard IDs",
        variant: "destructive",
      })
      return
    }

    setIsDownloading(true)

    try {
      const shardIds = reconstructShardIds.split(",").map((id) => id.trim())

      const response = await fetch("/api/data/shards", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ shardIds }),
      })

      const result = await response.json()

      if (result.success) {
        // Convert base64 back to file and download
        const blob = base64ToBlob(result.data)
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "reconstructed-file"
        a.click()
        URL.revokeObjectURL(url)

        toast({
          title: "File reconstructed",
          description: `Downloaded ${result.reconstructedSize} bytes from ${result.shardsUsed} shards`,
        })
      } else {
        throw new Error(result.error || "Reconstruction failed")
      }
    } catch (error: any) {
      toast({
        title: "Reconstruction failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const result = reader.result as string
        resolve(result.split(",")[1]) // Remove data:type;base64, prefix
      }
      reader.onerror = reject
    })
  }

  const base64ToBlob = (base64: string): Blob => {
    const byteCharacters = atob(base64)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray])
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Data Shard Manager</h3>
          <Badge variant="secondary" className="bg-accent/10 text-accent">
            <Layers className="w-3 h-3 mr-1" />
            Distributed Storage
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Network Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Network className="w-4 h-4" />
              Network Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {networkStats ? (
              <>
                <div className="flex justify-between text-sm">
                  <span>Sharding:</span>
                  <Badge variant={networkStats.shardingEnabled ? "default" : "secondary"}>
                    {networkStats.shardingEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Active Nodes:</span>
                  <Badge variant="outline">{networkStats.activeNodes}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Shards:</span>
                  <Badge variant="outline">{networkStats.totalShards}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Replication:</span>
                  <Badge variant="outline">{networkStats.replicationFactor}x</Badge>
                </div>
                <Separator />
                <div className="text-xs text-muted-foreground">Max shard: {formatBytes(networkStats.maxShardSize)}</div>
                <div className="text-xs text-muted-foreground">
                  Compression: {Math.round(networkStats.compressionRatio * 100)}%
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">Loading network status...</div>
            )}
          </CardContent>
        </Card>

        {/* Upload Interface */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Shard File
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="file-upload" className="text-sm">
                Select File
              </Label>
              <Input
                id="file-upload"
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="text-sm"
              />
            </div>

            {selectedFile && (
              <div className="text-xs text-muted-foreground space-y-1">
                <div>File: {selectedFile.name}</div>
                <div>Size: {formatBytes(selectedFile.size)}</div>
                <div>Est. shards: {Math.ceil(selectedFile.size / (64 * 1024))}</div>
              </div>
            )}

            {isUploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="h-2" />
                <div className="text-xs text-center text-muted-foreground">Sharding... {uploadProgress}%</div>
              </div>
            )}

            <Button onClick={handleFileUpload} disabled={!selectedFile || isUploading} className="w-full" size="sm">
              <HardDrive className="w-4 h-4 mr-2" />
              {isUploading ? "Sharding..." : "Create Shards"}
            </Button>
          </CardContent>
        </Card>

        {/* Reconstruct Interface */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Download className="w-4 h-4" />
              Reconstruct File
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="shard-ids" className="text-sm">
                Shard IDs
              </Label>
              <Input
                id="shard-ids"
                placeholder="shard-1, shard-2, shard-3..."
                value={reconstructShardIds}
                onChange={(e) => setReconstructShardIds(e.target.value)}
                className="text-sm"
              />
            </div>

            <Button
              onClick={handleReconstruct}
              disabled={!reconstructShardIds.trim() || isDownloading}
              className="w-full bg-transparent"
              size="sm"
              variant="outline"
            >
              <Zap className="w-4 h-4 mr-2" />
              {isDownloading ? "Reconstructing..." : "Reconstruct & Download"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Shard List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Sharded Files
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {shards.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8">
                  No sharded files yet. Upload a file to get started.
                </div>
              ) : (
                shards.map((shard) => (
                  <div key={shard.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          shard.status === "complete"
                            ? "bg-green-500"
                            : shard.status === "partial"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                      />
                      <div>
                        <div className="text-sm font-medium">{shard.filename}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatBytes(shard.size)} • {shard.shardCount} shards
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {shard.status === "complete" ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <AlertCircle className="w-3 h-3 mr-1" />
                        )}
                        {shard.status}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {new Date(shard.created).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
