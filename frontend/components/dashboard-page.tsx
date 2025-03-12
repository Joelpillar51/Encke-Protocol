"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ArrowUpFromLine, ArrowDownToLine, Info } from "lucide-react"
import Link from "next/link"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AssetTable } from "@/components/asset-table"
import { HealthFactorIndicator } from "@/components/health-factor-indicator"
import { FadeIn, SlideUp, StaggerChildren, StaggerItem } from "@/components/animations"
import { motion } from "framer-motion"

export function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview")

  // Mock data
  const userStats = {
    totalSupplied: 5000,
    totalBorrowed: 2000,
    netWorth: 3000,
    healthFactor: 1.8,
    borrowLimit: 3500,
    borrowLimitUsed: 57,
  }

  const marketStats = {
    totalValueLocked: 12500000,
    totalBorrowed: 4800000,
    totalSuppliers: 1250,
    totalBorrowers: 450,
  }

  const suppliedAssets = [
    { asset: "ATOM", icon: "/placeholder.svg?height=24&width=24", balance: 100, value: 1200, apy: 3.2 },
    { asset: "OSMO", icon: "/placeholder.svg?height=24&width=24", balance: 500, value: 800, apy: 4.5 },
    { asset: "JUNO", icon: "/placeholder.svg?height=24&width=24", balance: 200, value: 600, apy: 2.8 },
  ]

  const borrowedAssets = [
    { asset: "USDC", icon: "/placeholder.svg?height=24&width=24", balance: 1000, value: 1000, apy: 5.2 },
    { asset: "ATOM", icon: "/placeholder.svg?height=24&width=24", balance: 50, value: 600, apy: 4.8 },
  ]

  return (
    <FadeIn>
      <div className="space-y-8">
        <div className="flex flex-col space-y-4">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your lending and borrowing positions</p>
        </div>

        <StaggerChildren>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StaggerItem>
              <Card className="overflow-hidden border-2 border-transparent hover:border-primary/20 transition-all duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Net Worth</CardTitle>
                </CardHeader>
                <CardContent>
                  <motion.div
                    className="text-2xl font-bold"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    ${userStats.netWorth.toLocaleString()}
                  </motion.div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supplied ${userStats.totalSupplied.toLocaleString()} - Borrowed $
                    {userStats.totalBorrowed.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="overflow-hidden border-2 border-transparent hover:border-primary/20 transition-all duration-300">
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
              <Card className="overflow-hidden border-2 border-transparent hover:border-primary/20 transition-all duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Borrow Limit</CardTitle>
                </CardHeader>
                <CardContent>
                  <motion.div
                    className="text-2xl font-bold"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    ${userStats.borrowLimit.toLocaleString()}
                  </motion.div>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Used: {userStats.borrowLimitUsed}%</span>
                      <span>${userStats.totalBorrowed.toLocaleString()}</span>
                    </div>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${userStats.borrowLimitUsed}%` }}
                      transition={{ duration: 1, delay: 0.3 }}
                      className="h-2 bg-primary rounded-full"
                    />
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="overflow-hidden border-2 border-transparent hover:border-primary/20 transition-all duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col space-y-2">
                  <Link href="/deposit" passHref>
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <Button className="w-full" size="sm">
                        <ArrowDownToLine className="mr-2 h-4 w-4" />
                        Deposit
                      </Button>
                    </motion.div>
                  </Link>
                  <Link href="/borrow" passHref>
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <Button className="w-full" size="sm" variant="outline">
                        <ArrowUpFromLine className="mr-2 h-4 w-4" />
                        Borrow
                      </Button>
                    </motion.div>
                  </Link>
                </CardContent>
              </Card>
            </StaggerItem>
          </div>
        </StaggerChildren>

        <SlideUp delay={0.3}>
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="supplied">Supplied</TabsTrigger>
              <TabsTrigger value="borrowed">Borrowed</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Card className="border-2 border-transparent hover:border-primary/20 transition-all duration-300">
                  <CardHeader>
                    <CardTitle>Your Supplied Assets</CardTitle>
                    <CardDescription>Assets you've supplied as collateral</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {suppliedAssets.length > 0 ? (
                      <AssetTable
                        assets={suppliedAssets}
                        type="supplied"
                        columns={["asset", "balance", "value", "apy"]}
                      />
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground">You haven't supplied any assets yet</p>
                        <Link href="/deposit" passHref>
                          <Button className="mt-4">Deposit Now</Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-2 border-transparent hover:border-primary/20 transition-all duration-300">
                  <CardHeader>
                    <CardTitle>Your Borrowed Assets</CardTitle>
                    <CardDescription>Assets you've borrowed from the protocol</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {borrowedAssets.length > 0 ? (
                      <AssetTable
                        assets={borrowedAssets}
                        type="borrowed"
                        columns={["asset", "balance", "value", "apy"]}
                      />
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground">You haven't borrowed any assets yet</p>
                        <Link href="/borrow" passHref>
                          <Button className="mt-4">Borrow Now</Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="border-2 border-transparent hover:border-primary/20 transition-all duration-300">
                <CardHeader>
                  <CardTitle>Market Overview</CardTitle>
                  <CardDescription>Current state of the Encke Protocol</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Value Locked</p>
                      <motion.p
                        className="text-xl font-bold"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                      >
                        ${marketStats.totalValueLocked.toLocaleString()}
                      </motion.p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Borrowed</p>
                      <motion.p
                        className="text-xl font-bold"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                      >
                        ${marketStats.totalBorrowed.toLocaleString()}
                      </motion.p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Suppliers</p>
                      <motion.p
                        className="text-xl font-bold"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                      >
                        {marketStats.totalSuppliers.toLocaleString()}
                      </motion.p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Borrowers</p>
                      <motion.p
                        className="text-xl font-bold"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.7 }}
                      >
                        {marketStats.totalBorrowers.toLocaleString()}
                      </motion.p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="supplied">
              <Card className="mt-4 border-2 border-transparent hover:border-primary/20 transition-all duration-300">
                <CardHeader>
                  <CardTitle>Your Supplied Assets</CardTitle>
                  <CardDescription>Assets you've supplied as collateral</CardDescription>
                </CardHeader>
                <CardContent>
                  {suppliedAssets.length > 0 ? (
                    <AssetTable
                      assets={suppliedAssets}
                      type="supplied"
                      columns={["asset", "balance", "value", "apy", "collateral", "actions"]}
                    />
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">You haven't supplied any assets yet</p>
                      <Link href="/deposit" passHref>
                        <Button className="mt-4">Deposit Now</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="borrowed">
              <Card className="mt-4 border-2 border-transparent hover:border-primary/20 transition-all duration-300">
                <CardHeader>
                  <CardTitle>Your Borrowed Assets</CardTitle>
                  <CardDescription>Assets you've borrowed from the protocol</CardDescription>
                </CardHeader>
                <CardContent>
                  {borrowedAssets.length > 0 ? (
                    <AssetTable
                      assets={borrowedAssets}
                      type="borrowed"
                      columns={["asset", "balance", "value", "apy", "actions"]}
                    />
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">You haven't borrowed any assets yet</p>
                      <Link href="/borrow" passHref>
                        <Button className="mt-4">Borrow Now</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </SlideUp>
      </div>
    </FadeIn>
  )
}

