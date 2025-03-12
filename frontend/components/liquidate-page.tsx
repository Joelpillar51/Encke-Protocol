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
import { AlertTriangle, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

export function LiquidatePage() {
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null)
  const [amount, setAmount] = useState<string>("")
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()

  // Mock data for at-risk positions
  const atRiskPositions = [
    {
      id: "pos1",
      user: "cosmos1abcdef...",
      healthFactor: 0.95,
      totalBorrowed: 5000,
      totalCollateral: 5250,
      collateralAssets: [
        { asset: "ATOM", icon: "/placeholder.svg?height=24&width=24", amount: 100, value: 1200 },
        { asset: "OSMO", icon: "/placeholder.svg?height=24&width=24", amount: 500, value: 800 },
      ],
      borrowedAssets: [
        { asset: "USDC", icon: "/placeholder.svg?height=24&width=24", amount: 1800, value: 1800 },
        { asset: "ATOM", icon: "/placeholder.svg?height=24&width=24", amount: 50, value: 600 },
      ],
    },
    {
      id: "pos2",
      user: "cosmos2ghijkl...",
      healthFactor: 0.88,
      totalBorrowed: 8000,
      totalCollateral: 7500,
      collateralAssets: [
        { asset: "ATOM", icon: "/placeholder.svg?height=24&width=24", amount: 200, value: 2400 },
        { asset: "JUNO", icon: "/placeholder.svg?height=24&width=24", amount: 1000, value: 3000 },
      ],
      borrowedAssets: [
        { asset: "USDC", icon: "/placeholder.svg?height=24&width=24", amount: 5000, value: 5000 },
        { asset: "OSMO", icon: "/placeholder.svg?height=24&width=24", amount: 1000, value: 1600 },
      ],
    },
    {
      id: "pos3",
      user: "cosmos3mnopqr...",
      healthFactor: 0.92,
      totalBorrowed: 3000,
      totalCollateral: 2900,
      collateralAssets: [
        { asset: "JUNO", icon: "/placeholder.svg?height=24&width=24", amount: 500, value: 1500 },
        { asset: "OSMO", icon: "/placeholder.svg?height=24&width=24", amount: 800, value: 1280 },
      ],
      borrowedAssets: [
        { asset: "ATOM", icon: "/placeholder.svg?height=24&width=24", amount: 200, value: 2400 },
        { asset: "USDC", icon: "/placeholder.svg?height=24&width=24", amount: 500, value: 500 },
      ],
    },
  ]

  const filteredPositions = searchQuery
    ? atRiskPositions.filter(
        (pos) =>
          pos.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pos.collateralAssets.some((asset) => asset.asset.toLowerCase().includes(searchQuery.toLowerCase())) ||
          pos.borrowedAssets.some((asset) => asset.asset.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    : atRiskPositions

  const getSelectedPositionDetails = () => {
    return atRiskPositions.find((pos) => pos.id === selectedPositionId)
  }

  const handleLiquidate = async () => {
    setIsLoading(true)

    // Simulate transaction
    setTimeout(() => {
      setIsLoading(false)
      setIsConfirmOpen(false)
      setAmount("")
      setSelectedPositionId(null)

      toast({
        title: "Liquidation successful",
        description: `You have successfully liquidated the position`,
      })
    }, 2000)
  }

  const handleMaxClick = () => {
    const position = getSelectedPositionDetails()
    if (position) {
      // In a real implementation, this would be the maximum amount that can be liquidated
      const maxLiquidationAmount = position.totalBorrowed * 0.5
      setAmount(maxLiquidationAmount.toString())
    }
  }

  // Calculate liquidation bonus based on health factor
  const calculateLiquidationBonus = (healthFactor: number) => {
    // The lower the health factor, the higher the bonus
    return Math.min(10 + (1 - healthFactor) * 20, 20)
  }

  const selectedPosition = getSelectedPositionDetails()
  const liquidationBonus = selectedPosition ? calculateLiquidationBonus(selectedPosition.healthFactor) : 0

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-4">
        <h1 className="text-3xl font-bold">Liquidations</h1>
        <p className="text-muted-foreground">Liquidate undercollateralized positions and earn rewards</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liquidation Overview</CardTitle>
          <CardDescription>How liquidations work in Encke Protocol</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-amber-500/10 rounded-md border border-amber-500/20">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium">Liquidations are high-risk operations</p>
              <p className="text-sm text-muted-foreground">
                Liquidating positions requires technical knowledge and carries risks. Make sure you understand the
                process before proceeding.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium">How Liquidations Work</h3>
              <p className="text-sm text-muted-foreground">
                When a borrower's health factor falls below 1.0, their position becomes eligible for liquidation.
                Liquidators can repay a portion of the borrowed assets and receive collateral at a discount.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Liquidation Rewards</h3>
              <p className="text-sm text-muted-foreground">
                Liquidators receive a bonus on the collateral they claim, typically between 5-15% depending on the
                health factor of the position. The lower the health factor, the higher the bonus.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>At-Risk Positions</CardTitle>
          <CardDescription>Positions with health factor below 1.0 that can be liquidated</CardDescription>
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by address or asset..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Health Factor</TableHead>
                  <TableHead>Borrowed</TableHead>
                  <TableHead>Collateral</TableHead>
                  <TableHead>Liquidation Bonus</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPositions.length > 0 ? (
                  filteredPositions.map((position) => (
                    <TableRow key={position.id}>
                      <TableCell className="font-mono">{position.user}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                          {position.healthFactor.toFixed(2)}
                        </Badge>
                      </TableCell>
                      <TableCell>${position.totalBorrowed.toLocaleString()}</TableCell>
                      <TableCell>${position.totalCollateral.toLocaleString()}</TableCell>
                      <TableCell>{calculateLiquidationBonus(position.healthFactor).toFixed(2)}%</TableCell>
                      <TableCell className="text-right">
                        <Button onClick={() => setSelectedPositionId(position.id)} variant="outline">
                          <AlertTriangle className="mr-2 h-4 w-4" />
                          Liquidate
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
                      <p className="text-muted-foreground">No positions found matching your search</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Liquidate Modal */}
      {selectedPosition && (
        <Dialog open={!!selectedPosition} onOpenChange={(open) => !open && setSelectedPositionId(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Liquidate Position</DialogTitle>
              <DialogDescription>Enter the amount you want to liquidate</DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="amount" className="text-sm font-medium">
                    Amount to Repay
                  </label>
                  <div className="text-sm text-muted-foreground">
                    Max: ${(selectedPosition.totalBorrowed * 0.5).toLocaleString()}
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
                <label className="text-sm font-medium">Amount to liquidate</label>
                <Slider
                  value={[Number.parseFloat(amount) || 0]}
                  max={selectedPosition.totalBorrowed * 0.5}
                  step={1}
                  onValueChange={(value) => setAmount(value[0].toString())}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>$0</span>
                  <span>${(selectedPosition.totalBorrowed * 0.5).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-4 rounded-md border p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Position Health Factor</span>
                  <span className="text-sm text-red-500">{selectedPosition.healthFactor.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm">Liquidation Bonus</span>
                  <span className="text-sm text-green-500">{liquidationBonus.toFixed(2)}%</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm">Collateral to Receive</span>
                  <span className="text-sm font-medium">
                    $
                    {Number.parseFloat(amount || "0") > 0
                      ? (Number.parseFloat(amount) * (1 + liquidationBonus / 100)).toLocaleString()
                      : "0"}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-amber-500/10 rounded-md border border-amber-500/20">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium">Liquidation Warning</p>
                  <p className="text-sm text-muted-foreground">
                    Liquidations are irreversible. Make sure you have enough funds to cover the transaction and
                    understand the risks involved.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedPositionId(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => setIsConfirmOpen(true)}
                disabled={
                  !amount ||
                  Number.parseFloat(amount) <= 0 ||
                  Number.parseFloat(amount) > selectedPosition.totalBorrowed * 0.5
                }
              >
                Continue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirmation Modal */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Liquidation</DialogTitle>
            <DialogDescription>Please review the transaction details</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex justify-between items-center">
              <span>Position</span>
              <span className="font-mono">{selectedPosition?.user}</span>
            </div>

            <div className="flex justify-between items-center">
              <span>Amount to Repay</span>
              <span>${Number.parseFloat(amount).toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center">
              <span>Collateral to Receive</span>
              <span>${Number.parseFloat(amount) * (1 + liquidationBonus / 100).toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center">
              <span>Liquidation Bonus</span>
              <span className="text-green-500">{liquidationBonus.toFixed(2)}%</span>
            </div>

            <div className="flex justify-between items-center">
              <span>Gas Fee (est.)</span>
              <span>0.002 ATOM</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleLiquidate} disabled={isLoading}>
              {isLoading ? "Processing..." : "Confirm Liquidation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Import Table components for the liquidate page
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

