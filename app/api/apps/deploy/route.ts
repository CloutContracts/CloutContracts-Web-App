import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { appName, repoUrl, buildCommand, address } = await request.json()

    if (!appName || !repoUrl || !address) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const deploymentResponse = await fetch("https://api.vercel.com/v13/deployments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: appName.toLowerCase().replace(/\s+/g, "-"),
        gitSource: {
          type: "github",
          repo: repoUrl.replace("https://github.com/", ""),
        },
        buildCommand: buildCommand || "npm run build",
        env: {
          NEXT_PUBLIC_CLOUT_CONTRACTS_RPC: process.env.CLOUT_CONTRACTS_RPC_URL,
          NEXT_PUBLIC_CHAIN_ID: "1337",
        },
      }),
    })

    const deployment = await deploymentResponse.json()

    if (!deploymentResponse.ok) {
      return NextResponse.json({ error: deployment.error?.message || "Deployment failed" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      deploymentId: deployment.id,
      url: `https://${deployment.url}`,
      appName,
      owner: address,
      status: "deploying",
    })
  } catch (error) {
    console.error("App deployment error:", error)
    return NextResponse.json({ error: "App deployment failed" }, { status: 500 })
  }
}
