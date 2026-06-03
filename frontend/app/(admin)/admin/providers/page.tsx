"use client"

import { useState, useEffect, useMemo } from "react"
import { apiRequest } from "@/lib/api"
import { categoryLabels } from "@/lib/constants"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Search, MoreVertical, Camera, Star, CheckCircle, XCircle, Eye, Filter, MapPin, BookOpen, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [approvalFilter, setApprovalFilter] = useState<string>("all")
  const [selectedProvider, setSelectedProvider] = useState<any>(null)

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const data: any[] = await apiRequest('/admin/providers', {}, true)
        setProviders(data ?? [])
      } catch (error: any) {
        toast.error(error.message || 'Failed to load providers')
      } finally {
        setLoading(false)
      }
    }
    fetchProviders()
  }, [])

  const filtered = useMemo(() => {
    return providers.filter((p) => {
      const matchSearch =
        (p.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (p.business_name ?? "").toLowerCase().includes(search.toLowerCase())
      const matchType = typeFilter === "all" || p.provider_type === typeFilter
      const matchApproval =
        approvalFilter === "all" ||
        (approvalFilter === "approved" && p.is_approved) ||
        (approvalFilter === "pending" && !p.is_approved)
      return matchSearch && matchType && matchApproval
    })
  }, [search, typeFilter, approvalFilter, providers])

  const providerTypeLabel: Record<string, string> = {
    photographer: "Photographer",
    editor: "Editor",
    equipment_renter: "Equipment Renter",
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Provider Management</h1>
        <p className="text-sm text-muted-foreground">Verify and manage service providers</p>
      </div>

      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="text-base font-semibold text-card-foreground">
              All Providers ({filtered.length})
            </CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search providers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-full pl-9 sm:w-56"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-9 w-full sm:w-40">
                  <Filter className="mr-2 h-3.5 w-3.5" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="photographer">Photographer</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="equipment_renter">Equipment Renter</SelectItem>
                </SelectContent>
              </Select>
              <Select value={approvalFilter} onValueChange={setApprovalFilter}>
                <SelectTrigger className="h-9 w-full sm:w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="hidden md:table-cell">Rating</TableHead>
                  <TableHead className="hidden lg:table-cell">Bookings</TableHead>
                  <TableHead>Approval</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((provider) => (
                  <TableRow key={provider.id} className="hover:bg-accent/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Camera className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-card-foreground">{provider.business_name}</p>
                          <p className="text-xs text-muted-foreground">{provider.name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {providerTypeLabel[provider.provider_type] ?? provider.provider_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                        <span className="text-sm font-medium text-card-foreground">{provider.rating}</span>
                        <span className="text-xs text-muted-foreground">({provider.total_reviews})</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                      {provider.total_bookings}
                    </TableCell>
                    <TableCell>
                      {provider.is_approved ? (
                        <Badge variant="outline" className="border-success/30 bg-success/10 text-success">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Approved
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning-foreground">
                          <XCircle className="mr-1 h-3 w-3" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedProvider(provider)}>
                            <Eye className="mr-2 h-3.5 w-3.5" />
                            View Details
                          </DropdownMenuItem>
                          {!provider.is_approved ? (
                            <DropdownMenuItem onClick={() => toast.success(`${provider.business_name} approved`)}>
                              <CheckCircle className="mr-2 h-3.5 w-3.5" />
                              Approve Provider
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => toast.error(`${provider.business_name} approval revoked`)}
                            >
                              <XCircle className="mr-2 h-3.5 w-3.5" />
                              Revoke Approval
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Camera className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm font-medium text-muted-foreground">No providers found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Provider Detail Dialog */}
      <Dialog open={!!selectedProvider} onOpenChange={() => setSelectedProvider(null)}>
        <DialogContent className="max-w-lg">
          {selectedProvider && (
            <>
              <DialogHeader>
                <DialogTitle className="text-foreground">{selectedProvider.business_name}</DialogTitle>
                <DialogDescription>{selectedProvider.description}</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Owner</span>
                    <span className="text-sm font-medium text-foreground">{selectedProvider.name}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Type</span>
                    <span className="text-sm font-medium text-foreground capitalize">
                      {providerTypeLabel[selectedProvider.provider_type] ?? selectedProvider.provider_type}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Rating</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                      <span className="text-sm font-medium text-foreground">{selectedProvider.rating}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Total Bookings</span>
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">{selectedProvider.total_bookings}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {selectedProvider.location}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedProvider.categories ?? []).map((cat: string) => (
                    <Badge key={cat} variant="secondary" className="text-xs">
                      {categoryLabels[cat] || cat}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  {!selectedProvider.is_approved ? (
                    <Button
                      className="flex-1"
                      onClick={() => {
                        toast.success(`${selectedProvider.business_name} approved`)
                        setSelectedProvider(null)
                      }}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve Provider
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        toast.error(`${selectedProvider.business_name} approval revoked`)
                        setSelectedProvider(null)
                      }}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Revoke Approval
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
