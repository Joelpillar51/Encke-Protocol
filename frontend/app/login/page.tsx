"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"
import { motion } from "framer-motion"
import { AuthLayout } from "@/components/auth-layout"
import { LoadingSpinner } from "@/components/animations"
import { useToast } from "@/hooks/use-toast"
import { connectNeutronWallet, connectKeplrWallet, connectLeapWallet } from "@/lib/neutron"

export default function LoginPage() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Check if user is already authenticated
  useEffect(() => {
    const walletAddress = localStorage.getItem("walletAddress")
    if (walletAddress) {
      router.push("/")
    }
  }, [router])

  const handleConnect = async (walletType: "neutron" | "keplr" | "leap") => {
    try {
      setIsConnecting(true)
      setConnectingWallet(walletType)

      let walletResponse

      switch (walletType) {
        case "neutron":
          walletResponse = await connectNeutronWallet()
          break
        case "keplr":
          walletResponse = await connectKeplrWallet()
          break
        case "leap":
          walletResponse = await connectLeapWallet()
          break
      }

      // Store wallet address and type in local storage
      localStorage.setItem("walletAddress", walletResponse.address)
      localStorage.setItem("walletType", walletResponse.walletType)

      toast({
        title: "Wallet connected",
        description: `Your ${walletType.charAt(0).toUpperCase() + walletType.slice(1)} wallet has been connected successfully.`,
      })

      // Redirect to dashboard after successful connection
      setIsRedirecting(true)
      setTimeout(() => {
        router.push("/")
      }, 1000)
    } catch (error) {
      console.error(`Error connecting ${walletType} wallet:`, error)
      toast({
        title: "Connection failed",
        description: `Failed to connect to ${walletType} wallet.`,
        variant: "destructive",
      })
      setIsConnecting(false)
      setConnectingWallet(null)
    }
  }

  if (isRedirecting) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <LoadingSpinner size="h-12 w-12" />
          <p className="mt-4 text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <Card className="border-2 border-transparent hover:border-primary/20 transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to Encke Protocol</CardTitle>
          <CardDescription>Connect your wallet to access the decentralized lending platform</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button onClick={() => handleConnect("neutron")} className="w-full py-6 text-lg" disabled={isConnecting}>
              {isConnecting && connectingWallet === "neutron" ? (
                <>
                  <LoadingSpinner size="h-5 w-5" className="mr-2" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-5 w-5" />
                  Connect Neutron Wallet
                </>
              )}
            </Button>
          </motion.div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleConnect("keplr")}
                disabled={isConnecting}
              >
                {isConnecting && connectingWallet === "keplr" ? (
                  <LoadingSpinner size="h-4 w-4" className="mr-2" />
                ) : (
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M20 40C31.0457 40 40 31.0457 40 20C40 8.9543 31.0457 0 20 0C8.9543 0 0 8.9543 0 20C0 31.0457 8.9543 40 20 40Z"
                      fill="#7F45FD"
                    />
                    <path
                      d="M29.9883 13.3515V26.6484C29.9883 27.5703 29.2969 28.3203 28.375 28.3203H11.625C10.7031 28.3203 10.0117 27.5703 10.0117 26.6484V13.3515C10.0117 12.4297 10.7031 11.6797 11.625 11.6797H28.375C29.2969 11.6797 29.9883 12.4297 29.9883 13.3515Z"
                      fill="white"
                    />
                    <path
                      d="M20.0001 24.6484C22.5782 24.6484 24.6485 22.5782 24.6485 20C24.6485 17.4218 22.5782 15.3516 20.0001 15.3516C17.4219 15.3516 15.3516 17.4218 15.3516 20C15.3516 22.5782 17.4219 24.6484 20.0001 24.6484Z"
                      fill="#7F45FD"
                    />
                  </svg>
                )}
                Keplr
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleConnect("leap")}
                disabled={isConnecting}
              >
                {isConnecting && connectingWallet === "leap" ? (
                  <LoadingSpinner size="h-4 w-4" className="mr-2" />
                ) : (
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24Z"
                      fill="#E54033"
                    />
                    <path d="M7.5 6.5L16.5 6.5L16.5 17.5L7.5 17.5L7.5 6.5Z" stroke="white" strokeWidth="2" />
                    <path d="M10.5 9.5L13.5 9.5L13.5 14.5L10.5 14.5L10.5 9.5Z" fill="white" />
                  </svg>
                )}
                Leap
              </Button>
            </motion.div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-muted-foreground text-center">
            By connecting your wallet, you agree to our{" "}
            <a href="#" className="underline underline-offset-4 hover:text-primary">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="underline underline-offset-4 hover:text-primary">
              Privacy Policy
            </a>
          </div>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}

