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
import { RotateCcw, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { HealthFactorIndicator } from "@/components/health-factor-indicator"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { AssetIcon } from "@/components/asset-icon"
import { FadeIn, SlideUp, StaggerChildren, StaggerItem } from "@/components/animations"

export function RepayPage() {
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null)
  const [amount, setAmount] = useState<string>("")
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Mock data
  const userStats = {
    totalSupplied: 5000,
    totalBorrowed: 2000,
    borrowLimit: 3500,
    borrowLimitUsed: 57,
    healthFactor: 1.8,
  }

  // Calculate new health factor based on repay amount
  const calculateNewHealthFactor = (repayAmount: number) => {
    const currentBorrowed = userStats.totalBorrowed
    const newBorrowed = Math.max(currentBorrowed - repayAmount, 0)
    const newBorrowLimitUsed = (newBorrowed / userStats.borrowLimit) * 100

    // Simple calculation - in reality this would be more complex
    const newHealthFactor = 2 * (1 - newBorrowLimitUsed / 100)
    return Math.min(newHealthFactor, 10) // Cap at 10 for display purposes
  }

  // Calculate new borrow limit used
  const calculateNewBorrowLimitUsed = (repayAmount: number) => {
    const currentBorrowed = userStats.totalBorrowed
    const newBorrowed = Math.max(currentBorrowed - repayAmount, 0)
    return (newBorrowed / userStats.borrowLimit) * 100
  }

  const borrowedAssets = [
    {
      asset: "USDC",
      balance: 1000,
      value: 1000,
      apy: 3.1,
      walletBalance: 500,
      walletValue: 500,
    },
    {
      asset: "NTRN",
      balance: 50,
      value: 600,
      apy: 5.2,
      walletBalance: 20,
      walletValue: 240,
    },
  ]

  const getSelectedAssetDetails = () => {
    return borrowedAssets.find((asset) => asset.asset === selectedAsset)
  }

  const handleRepay = async () => {
    setIsLoading(true)

    // Simulate transaction
    setTimeout(() => {
      setIsLoading(false)
      setIsConfirmOpen(false)
      setAmount("")
      setSelectedAsset(null)

      toast({
        title: "Repayment successful",
        description: `You have successfully repaid ${amount} ${selectedAsset}`,
      })
    }, 2000)
  }

  const handleMaxClick = () => {
    const asset = getSelectedAssetDetails()
    if (asset) {
      // Use the minimum of wallet balance and borrowed amount
      const maxRepayAmount = Math.min(asset.walletBalance, asset.balance)
      setAmount(maxRepayAmount.toString())
    }
  }

  const repayAmountValue = Number.parseFloat(amount) || 0
  const newHealthFactor = calculateNewHealthFactor(repayAmountValue)
  const newBorrowLimitUsed = calculateNewBorrowLimitUsed(repayAmountValue)

  return (
    <FadeIn>
      <div className="space-y-8">
        <div className="flex flex-col space-y-4">
          <h1 className="text-3xl font-bold">Repay</h1>
          <p className="text-muted-foreground">Repay your borrowed assets</p>
        </div>

        <StaggerChildren>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StaggerItem>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Borrow Limit</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${userStats.borrowLimit.toLocaleString()}</div>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Used: {userStats.borrowLimitUsed.toFixed(2)}%</span>
                      <span>${userStats.totalBorrowed.toLocaleString()}</span>
                    </div>
                    <Progress value={userStats.borrowLimitUsed} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center text-muted-foreground">
                    Health Factor
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 ml-1 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            Health factor represents the safety of your loan. If it falls below 1.0, your position may
                            be liquidated.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <HealthFactorIndicator value={userStats.healthFactor} />
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Borrowed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${userStats.totalBorrowed.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">Across all borrowed assets</p>
                </CardContent>
              </Card>
            </StaggerItem>
          </div>
        </StaggerChildren>

        <SlideUp>
          <Card className="overflow-hidden border-2 border-transparent hover:border-primary/20 transition-all duration-300">
            <CardHeader>
              <CardTitle>Your Borrowed Assets</CardTitle>
              <CardDescription>Select an asset to repay</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset</TableHead>
                      <TableHead>Borrowed</TableHead>
                      <TableHead>Wallet Balance</TableHead>
                      <TableHead>APY</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {borrowedAssets.map((asset) => (
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
                              {asset.balance.toLocaleString()} {asset.asset}
                            </div>
                            <div className="text-xs text-muted-foreground">${asset.value.toLocaleString()}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>
                              {asset.walletBalance.toLocaleString()} {asset.asset}
                            </div>
                            <div className="text-xs text-muted-foreground">${asset.walletValue.toLocaleString()}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-amber-500">{asset.apy.toFixed(2)}%</div>
                        </TableCell>
                        <TableCell className="text-right">
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button onClick={() => setSelectedAsset(asset.asset)} disabled={asset.walletBalance <= 0}>
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Repay
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

        {/* Repay Modal */}
        <AnimatePresence>
          {selectedAsset && (
            <Dialog open={!!selectedAsset} onOpenChange={(open) => !open && setSelectedAsset(null)}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Repay {selectedAsset}</DialogTitle>
                  <DialogDescription>Enter the amount you want to repay</DialogDescription>
                </DialogHeader>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="space-y-6 py-4"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label htmlFor="amount" className="text-sm font-medium">
                        Amount
                      </label>
                      <div className="text-sm text-muted-foreground">
                        Wallet Balance: {getSelectedAssetDetails()?.walletBalance.toLocaleString()} {selectedAsset}
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
                    <label className="text-sm font-medium">Amount to repay</label>
                    <Slider
                      value={[Number.parseFloat(amount) || 0]}
                      max={Math.min(
                        getSelectedAssetDetails()?.walletBalance || 0,
                        getSelectedAssetDetails()?.balance || 0,
                      )}
                      step={0.01}
                      onValueChange={(value) => setAmount(value[0].toString())}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0 {selectedAsset}</span>
                      <span>
                        {Math.min(
                          getSelectedAssetDetails()?.walletBalance || 0,
                          getSelectedAssetDetails()?.balance || 0,
                        ).toLocaleString()}{" "}
                        {selectedAsset}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-md border p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Borrow APY</span>
                      <span className="text-sm text-amber-500">{getSelectedAssetDetails()?.apy.toFixed(2)}%</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Borrow Limit Used</span>
                        <span>
                          {userStats.borrowLimitUsed.toFixed(2)}% → {newBorrowLimitUsed.toFixed(2)}%
                        </span>
                      </div>
                      <Progress value={newBorrowLimitUsed} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Health Factor</span>
                        <span
                          className={
                            newHealthFactor < 1.1
                              ? "text-red-500"
                              : newHealthFactor < 1.5
                                ? "text-yellow-500"
                                : "text-green-500"
                          }
                        >
                          {userStats.healthFactor.toFixed(2)} → {newHealthFactor.toFixed(2)}
                        </span>
                      </div>
                      <Progress
                        value={Math.min((newHealthFactor / 2) * 100, 100)}
                        className={`h-2 ${
                          newHealthFactor < 1.1
                            ? "bg-red-500"
                            : newHealthFactor < 1.5
                              ? "bg-yellow-500"
                              : "bg-green-500"
                        }`}
                      />
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
                        Number.parseFloat(amount) > (getSelectedAssetDetails()?.walletBalance || 0) ||
                        Number.parseFloat(amount) > (getSelectedAssetDetails()?.balance || 0)
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
              <DialogTitle>Confirm Repayment</DialogTitle>
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
                <span>New Health Factor</span>
                <span
                  className={
                    newHealthFactor < 1.1
                      ? "text-red-500"
                      : newHealthFactor < 1.5
                        ? "text-yellow-500"
                        : "text-green-500"
                  }
                >
                  {newHealthFactor.toFixed(2)}
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
              <Button onClick={handleRepay} disabled={isLoading}>
                {isLoading ? "Processing..." : "Confirm Repayment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </FadeIn>
  )
}

// Import Table components for the repay page
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

