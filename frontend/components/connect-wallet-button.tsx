"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Wallet, ChevronDown, Copy, ExternalLink, LogOut } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import { LoadingSpinner } from "@/components/animations"
import {
  connectNeutronWallet,
  connectKeplrWallet,
  connectLeapWallet,
  disconnectNeutronWallet,
  type NeutronWallet,
} from "@/lib/neutron"

export function ConnectWalletButton() {
  const [wallet, setWallet] = useState<NeutronWallet | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    // Check if wallet address is in local storage
    const storedAddress = localStorage.getItem("walletAddress")
    const storedType = localStorage.getItem("walletType") as "neutron" | "keplr" | "leap" | null

    if (storedAddress && storedType) {
      setWallet({
        address: storedAddress,
        balance: 0, // We don't store balance in local storage
        walletType: storedType,
      })
    }
  }, [])

  const connectWallet = async (walletType: "neutron" | "keplr" | "leap") => {
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

      setWallet(walletResponse)

      // Store wallet address and type in local storage
      localStorage.setItem("walletAddress", walletResponse.address)
      localStorage.setItem("walletType", walletResponse.walletType)

      toast({
        title: "Wallet connected",
        description: `Your ${walletType.charAt(0).toUpperCase() + walletType.slice(1)} wallet has been connected successfully.`,
      })
    } catch (error) {
      console.error(`Error connecting ${walletType} wallet:`, error)
      toast({
        title: "Connection failed",
        description: `Failed to connect to ${walletType} wallet.`,
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
      setConnectingWallet(null)
    }
  }

  const disconnectWallet = async () => {
    try {
      await disconnectNeutronWallet()
      setWallet(null)

      // Remove wallet data from local storage
      localStorage.removeItem("walletAddress")
      localStorage.removeItem("walletType")

      toast({
        title: "Wallet disconnected",
        description: "Your wallet has been disconnected.",
      })

      // Redirect to login page
      router.push("/login")
    } catch (error) {
      console.error("Error disconnecting wallet:", error)
      toast({
        title: "Disconnection failed",
        description: "Failed to disconnect from wallet.",
        variant: "destructive",
      })
    }
  }

  const copyAddress = () => {
    if (wallet) {
      navigator.clipboard.writeText(wallet.address)
      toast({
        title: "Address copied",
        description: "Wallet address copied to clipboard.",
      })
    }
  }

  // Format address for display
  const formatAddress = (address: string) => {
    if (!address) return ""
    return `${address.substring(0, 8)}...${address.substring(address.length - 4)}`
  }

  // Get wallet icon based on type
  const getWalletIcon = () => {
    if (!wallet) return <Wallet className="mr-2 h-4 w-4" />

    switch (wallet.walletType) {
      case "keplr":
        return (
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
        )
      case "leap":
        return (
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24Z"
              fill="#E54033"
            />
            <path d="M7.5 6.5L16.5 6.5L16.5 17.5L7.5 17.5L7.5 6.5Z" stroke="white" strokeWidth="2" />
            <path d="M10.5 9.5L13.5 9.5L13.5 14.5L10.5 14.5L10.5 9.5Z" fill="white" />
          </svg>
        )
      default:
        return <Wallet className="mr-2 h-4 w-4" />
    }
  }

  if (!wallet) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button>
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
          </motion.div>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect your wallet</DialogTitle>
            <DialogDescription>Connect your wallet to use Encke Protocol</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-4 mt-4">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button onClick={() => connectWallet("neutron")} className="w-full" disabled={isConnecting}>
                {isConnecting && connectingWallet === "neutron" ? (
                  <>
                    <LoadingSpinner size="h-5 w-5" className="mr-2" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2 h-4 w-4" />
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
                  onClick={() => connectWallet("keplr")}
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
                  onClick={() => connectWallet("leap")}
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
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button variant="outline">
            <div className="flex items-center">
              <motion.div
                className="h-2 w-2 rounded-full bg-green-500 mr-2"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [1, 0.7, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "loop",
                }}
              />
              <span className="flex items-center">
                {getWalletIcon()}
                {formatAddress(wallet.address)}
              </span>
              <ChevronDown className="ml-2 h-4 w-4" />
            </div>
          </Button>
        </motion.div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>My Wallet</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={copyAddress}>
          <Copy className="mr-2 h-4 w-4" />
          Copy Address
        </DropdownMenuItem>
        <DropdownMenuItem>
          <ExternalLink className="mr-2 h-4 w-4" />
          View on Explorer
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={disconnectWallet}>
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

