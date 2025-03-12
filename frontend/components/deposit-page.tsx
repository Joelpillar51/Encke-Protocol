"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AssetTable } from "@/components/asset-table"
import { Info, ArrowDownToLine } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { AssetIcon } from "@/components/asset-icon"
import { FadeIn, SlideUp } from "@/components/animations"
import { useContract } from "@/hooks/use-contract"

export function DepositPage() {
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null)
  const [amount, setAmount] = useState<string>("")
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const { execute, query, isLoading, error } = useContract()
  const { toast } = useToast()

  // Mock data
  const marketAssets = [
    {
      asset: "NTRN",
      balance: 100,
      value: 1200,
      apy: 3.2,
      walletBalance: 50,
      walletValue: 600,
    },
    {
      asset: "ATOM",
      balance: 500,
      value: 800,
      apy: 4.5,
      walletBalance: 200,
      walletValue: 320,
    },
    {
      asset: "OSMO",
      balance: 200,
      value: 600,
      apy: 2.8,
      walletBalance: 100,
      walletValue: 300,
    },
    {
      asset: "USDC",
      balance: 1000,
      value: 1000,
      apy: 2.1,
      walletBalance: 500,
      walletValue: 500,
    },
  ]

  const getSelectedAssetDetails = () => {
    return marketAssets.find((asset) => asset.asset === selectedAsset)
  }

  const handleDeposit = async () => {
    if (!selectedAsset || !amount) return

    try {
      const result = await execute({
        deposit: {
          asset: selectedAsset,
          amount: amount,
        },
      })

      setIsConfirmOpen(false)
      setAmount("")
      setSelectedAsset(null)

      toast({
        title: "Deposit successful",
        description: `You have successfully deposited ${amount} ${selectedAsset}`,
      })

      // Optionally, refresh the user's balance or other data here
    } catch (err) {
      toast({
        title: "Deposit failed",
        description: error?.message || "An error occurred while processing your deposit",
        variant: "destructive",
      })
    }
  }

  const handleMaxClick = () => {
    const asset = getSelectedAssetDetails()
    if (asset) {
      setAmount(asset.walletBalance.toString())
    }
  }

  return (
    <FadeIn>
      <div className="space-y-8">
        <div className="flex flex-col space-y-4">
          <h1 className="text-3xl font-bold">Deposit</h1>
          <p className="text-muted-foreground">Supply assets to earn interest and use as collateral</p>
        </div>

        <Tabs defaultValue="deposit">
          <TabsList>
            <TabsTrigger value="deposit">Deposit</TabsTrigger>
            <TabsTrigger value="your-deposits">Your Deposits</TabsTrigger>
          </TabsList>

          <TabsContent value="deposit">
            <SlideUp>
              <Card className="mt-4 overflow-hidden border-2 border-transparent hover:border-primary/20 transition-all duration-300">
                <CardHeader>
                  <CardTitle>Available Assets</CardTitle>
                  <CardDescription>Select an asset to deposit into the protocol</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Asset</TableHead>
                          <TableHead>Wallet Balance</TableHead>
                          <TableHead>Supply APY</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {marketAssets.map((asset) => (
                          <TableRow key={asset.asset}>
                            <TableCell>
                              <div className="flex items-center">
                                <AssetIcon asset={asset.asset} className="h-6 w-6 mr-2" />
                                <span>{asset.asset}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div>
                                  {asset.walletBalance.toLocaleString()} {asset.asset}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  ${asset.walletValue.toLocaleString()}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-green-500">{asset.apy.toFixed(2)}%</div>
                            </TableCell>
                            <TableCell className="text-right">
                              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                  onClick={() => setSelectedAsset(asset.asset)}
                                  disabled={asset.walletBalance <= 0}
                                >
                                  <ArrowDownToLine className="mr-2 h-4 w-4" />
                                  Deposit
                                </Button>
                              </motion.div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </SlideUp>
          </TabsContent>

          <TabsContent value="your-deposits">
            <SlideUp>
              <Card className="mt-4 overflow-hidden border-2 border-transparent hover:border-primary/20 transition-all duration-300">
                <CardHeader>
                  <CardTitle>Your Deposits</CardTitle>
                  <CardDescription>Assets you've supplied to the protocol</CardDescription>
                </CardHeader>
                <CardContent>
                  <AssetTable
                    assets={marketAssets.filter((asset) => asset.balance > 0)}
                    type="supplied"
                    columns={["asset", "balance", "value", "apy", "collateral", "actions"]}
                  />
                </CardContent>
              </Card>
            </SlideUp>
          </TabsContent>
        </Tabs>

        {/* Deposit Modal */}
        <AnimatePresence>
          {selectedAsset && (
            <Dialog open={!!selectedAsset} onOpenChange={(open) => !open && setSelectedAsset(null)}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Deposit {selectedAsset}</DialogTitle>
                  <DialogDescription>Enter the amount you want to deposit</DialogDescription>
                </DialogHeader>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="space-y-6 py-4"
                >
                  <div className="space-y-6 py-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label htmlFor="amount" className="text-sm font-medium">
                          Amount
                        </label>
                        <div className="text-sm text-muted-foreground">
                          Balance: {getSelectedAssetDetails()?.walletBalance.toLocaleString()} {selectedAsset}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Input
                          id="amount"
                          type="number"
                          placeholder="0.0"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                        />
                        <Button variant="outline" onClick={handleMaxClick}>
                          Max
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Amount to deposit</label>
                      <Slider
                        value={[Number.parseFloat(amount) || 0]}
                        max={getSelectedAssetDetails()?.walletBalance || 100}
                        step={0.01}
                        onValueChange={(value) => setAmount(value[0].toString())}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0 {selectedAsset}</span>
                        <span>
                          {getSelectedAssetDetails()?.walletBalance} {selectedAsset}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 rounded-md border p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <span className="text-sm">Collateral Usage</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 ml-1 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">
                                  Assets used as collateral can be borrowed against but may be liquidated if your health
                                  factor drops too low.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <span className="text-sm">Enabled</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm">Supply APY</span>
                        <span className="text-sm text-green-500">{getSelectedAssetDetails()?.apy.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setSelectedAsset(null)}>
                    Cancel
                  </Button>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => setIsConfirmOpen(true)}
                      disabled={
                        !amount ||
                        Number.parseFloat(amount) <= 0 ||
                        Number.parseFloat(amount) > (getSelectedAssetDetails()?.walletBalance || 0)
                      }
                    >
                      Continue
                    </Button>
                  </motion.div>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </AnimatePresence>

        {/* Confirmation Modal */}
        <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Deposit</DialogTitle>
              <DialogDescription>Please review the transaction details</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="flex justify-between items-center">
                <span>Asset</span>
                <div className="flex items-center">
                  <AssetIcon asset={selectedAsset || ""} className="h-5 w-5 mr-2" />
                  <span>{selectedAsset}</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span>Amount</span>
                <span>
                  {Number.parseFloat(amount).toLocaleString()} {selectedAsset}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span>Value</span>
                <span>
                  $
                  {(
                    (Number.parseFloat(amount) * (getSelectedAssetDetails()?.value || 0)) /
                    (getSelectedAssetDetails()?.balance || 1)
                  ).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span>Gas Fee (est.)</span>
                <span>0.001 NTRN</span>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleDeposit} disabled={isLoading}>
                {isLoading ? "Processing..." : "Confirm Deposit"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </FadeIn>
  )
}

// Import Table components for the deposit page
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

