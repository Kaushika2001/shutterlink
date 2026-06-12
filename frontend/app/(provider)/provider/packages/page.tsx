"use client"

import { useState, useEffect } from "react"
import { useAuthReady } from "@/hooks/use-auth-ready"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Package, Plus, Edit, Trash2, Loader2, Clock, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  getServicePackages,
  createServicePackage,
  updateServicePackage,
  deleteServicePackage,
  type ServicePackage,
  type ServiceType
} from "@/services/packages"
import { getProviderProfileId } from "@/services/provider-helper"

// Form validation schema
const packageSchema = z.object({
  name: z.string().min(3, "Package name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  service_type: z.enum(["photography", "editing", "both"]),
  duration_hours: z.number().min(0).optional(),
  price: z.number().min(0, "Price must be positive"),
  deliverables: z.string().min(5, "Please list deliverables"),
  max_revisions: z.number().min(0, "Revisions cannot be negative"),
  turnaround_days: z.number().min(0).optional(),
  is_active: z.boolean().default(true)
})

type PackageFormData = z.infer<typeof packageSchema>

export default function ProviderPackagesPage() {
  const { user, ready, isAuthenticated } = useAuthReady()
  const [packages, setPackages] = useState<ServicePackage[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [providerProfileId, setProviderProfileId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<PackageFormData>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      is_active: true,
      max_revisions: 2,
      service_type: "photography"
    }
  })

  // Load packages
  useEffect(() => {
    if (!ready) return

    async function init() {
      if (!isAuthenticated || !user?.id) {
        setLoading(false)
        return
      }

      const profileId = await getProviderProfileId(user.id)
      if (profileId) {
        setProviderProfileId(profileId)
        void loadPackages(profileId)
      } else {
        toast.error("Provider profile not found. Please complete your profile setup.")
        setLoading(false)
      }
    }
    
    void init()
  }, [user, ready, isAuthenticated])

  async function loadPackages(profileId?: string) {
    const idToUse = profileId || providerProfileId
    if (!idToUse) {
      toast.error("Please log in to view packages")
      return
    }
    setLoading(true)
    try {
      const data = await getServicePackages(idToUse)
      setPackages(data)
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to load packages"
      toast.error(errorMessage)
      console.error("Load packages error:", error)
    } finally {
      setLoading(false)
    }
  }

  // Handle form submission
  async function onSubmit(data: PackageFormData) {
    if (!providerProfileId) {
      toast.error("Provider profile not found")
      return
    }
    setSubmitting(true)

    try {
      // Convert deliverables string to array
      const deliverablesArray = data.deliverables
        .split('\n')
        .map(item => item.trim())
        .filter(item => item.length > 0)

      if (deliverablesArray.length === 0) {
        toast.error("Please add at least one deliverable")
        setSubmitting(false)
        return
      }

      const packageData = {
        ...data,
        provider_id: providerProfileId,
        deliverables: deliverablesArray
      }

      if (editingPackage) {
        // Update existing package
        await updateServicePackage(editingPackage.id, packageData)
        toast.success("Package updated successfully")
      } else {
        // Create new package
        await createServicePackage(packageData)
        toast.success("Package created! It appears on Explore → Service Packages.")
      }

      setDialogOpen(false)
      reset()
      setEditingPackage(null)
      loadPackages()
    } catch (error: any) {
      const errorMessage = error?.message || (editingPackage ? "Failed to update package" : "Failed to create package")
      toast.error(errorMessage)
      console.error("Submit package error:", error)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle edit
  function handleEdit(pkg: ServicePackage) {
    setEditingPackage(pkg)
    setValue("name", pkg.name)
    setValue("description", pkg.description)
    setValue("service_type", pkg.service_type)
    setValue("duration_hours", pkg.duration_hours || undefined)
    setValue("price", pkg.price)
    setValue("deliverables", pkg.deliverables.join('\n'))
    setValue("max_revisions", pkg.max_revisions)
    setValue("turnaround_days", pkg.turnaround_days || undefined)
    setValue("is_active", pkg.is_active)
    setDialogOpen(true)
  }

  // Handle delete
  async function handleDelete(packageId: string) {
    if (!confirm("Are you sure you want to delete this package? This action cannot be undone.")) return

    try {
      await deleteServicePackage(packageId)
      toast.success("Package deleted successfully")
      loadPackages()
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to delete package"
      toast.error(errorMessage)
      console.error("Delete package error:", error)
    }
  }

  // Handle toggle active
  async function handleToggleActive(pkg: ServicePackage) {
    try {
      await updateServicePackage(pkg.id, { is_active: !pkg.is_active })
      toast.success(`Package ${!pkg.is_active ? "activated" : "deactivated"}`)
      loadPackages()
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to update package status"
      toast.error(errorMessage)
      console.error("Toggle package error:", error)
    }
  }

  // Reset form and close dialog
  function closeDialog() {
    setDialogOpen(false)
    reset()
    setEditingPackage(null)
  }

  const serviceTypeLabels = {
    photography: "Photography",
    editing: "Photo Editing",
    both: "Photography & Editing"
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Service Packages</h1>
          <p className="text-muted-foreground">
            Create and manage packages anytime. Only your provider account needs admin approval — not each package.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingPackage(null); reset(); }}>
              <Plus className="mr-2 h-4 w-4" />
              Create Package
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingPackage ? "Edit Package" : "Create New Package"}</DialogTitle>
              <DialogDescription>
                {editingPackage ? "Update your service package details" : "Add a new service package for customers to book"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Package Name */}
              <div>
                <Label htmlFor="name">Package Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Wedding Photography Premium"
                  {...register("name")}
                />
                {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>}
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what's included in this package..."
                  rows={3}
                  {...register("description")}
                />
                {errors.description && <p className="mt-1 text-sm text-destructive">{errors.description.message}</p>}
              </div>

              {/* Service Type */}
              <div>
                <Label htmlFor="service_type">Service Type</Label>
                <Select
                  value={watch("service_type")}
                  onValueChange={(value) => setValue("service_type", value as ServiceType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="photography">Photography</SelectItem>
                    <SelectItem value="editing">Photo Editing</SelectItem>
                    <SelectItem value="both">Photography & Editing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price */}
              <div>
                <Label htmlFor="price">Price (LKR)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="25000"
                  {...register("price", { valueAsNumber: true })}
                />
                {errors.price && <p className="mt-1 text-sm text-destructive">{errors.price.message}</p>}
              </div>

              {/* Duration & Turnaround (side by side) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration_hours">Duration (hours)</Label>
                  <Input
                    id="duration_hours"
                    type="number"
                    placeholder="4"
                    {...register("duration_hours", { valueAsNumber: true })}
                  />
                </div>
                <div>
                  <Label htmlFor="turnaround_days">Turnaround (days)</Label>
                  <Input
                    id="turnaround_days"
                    type="number"
                    placeholder="7"
                    {...register("turnaround_days", { valueAsNumber: true })}
                  />
                </div>
              </div>

              {/* Max Revisions */}
              <div>
                <Label htmlFor="max_revisions">Max Revisions</Label>
                <Input
                  id="max_revisions"
                  type="number"
                  placeholder="2"
                  {...register("max_revisions", { valueAsNumber: true })}
                />
                {errors.max_revisions && <p className="mt-1 text-sm text-destructive">{errors.max_revisions.message}</p>}
              </div>

              {/* Deliverables */}
              <div>
                <Label htmlFor="deliverables">Deliverables (one per line)</Label>
                <Textarea
                  id="deliverables"
                  placeholder="50 edited high-resolution photos&#10;Online gallery&#10;Download rights"
                  rows={5}
                  {...register("deliverables")}
                />
                <p className="mt-1 text-xs text-muted-foreground">Enter each deliverable on a new line</p>
                {errors.deliverables && <p className="mt-1 text-sm text-destructive">{errors.deliverables.message}</p>}
              </div>

              {/* Active Status */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={watch("is_active")}
                  onCheckedChange={(checked) => setValue("is_active", checked)}
                />
                <Label htmlFor="is_active">Active (shown in Explore when your provider account is verified)</Label>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingPackage ? "Update Package" : "Create Package"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {packages.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <Card key={pkg.id} className={`relative ${!pkg.is_active ? 'opacity-60' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{pkg.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {serviceTypeLabels[pkg.service_type]}
                    </CardDescription>
                  </div>
                  <Badge variant={pkg.is_active ? "default" : "secondary"}>
                    {pkg.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{pkg.description}</p>

                <div className="space-y-2 border-t pt-4">
                  <p className="text-2xl font-bold text-foreground">
                    LKR {pkg.price.toLocaleString()}
                  </p>

                  {pkg.duration_hours && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {pkg.duration_hours} hours
                    </div>
                  )}

                  {pkg.turnaround_days && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4" />
                      {pkg.turnaround_days} days turnaround
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground">
                    {pkg.max_revisions} revision{pkg.max_revisions !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="border-t pt-4">
                  <p className="mb-2 text-sm font-medium">Deliverables:</p>
                  <ul className="space-y-1">
                    {pkg.deliverables.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-primary">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-2 border-t pt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleEdit(pkg)}
                  >
                    <Edit className="mr-2 h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleActive(pkg)}
                  >
                    {pkg.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(pkg.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Package}
          title="No packages yet"
          description="Create your first service package to start receiving bookings"
          actionLabel="Create Package"
          onAction={() => setDialogOpen(true)}
        />
      )}
    </div>
  )
}
