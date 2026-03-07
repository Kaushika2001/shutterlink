"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Image, Plus, Trash2, Edit2, Loader2, Star, Upload, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { EmptyState } from "@/components/ui/empty-state"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  getPortfolioItems,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  uploadPortfolioImage,
  type PortfolioItem,
} from "@/services/portfolio"
import { getProviderProfileId } from "@/services/provider-helper"

const CATEGORIES = [
  "Wedding",
  "Portrait",
  "Event",
  "Commercial",
  "Real Estate",
  "Product",
  "Fashion",
  "Sports",
  "Wildlife",
  "Landscape",
  "Food",
  "Automotive",
  "Editing",
  "Equipment"
]

export default function ProviderPortfolioPage() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [providerId, setProviderId] = useState<string | null>(null)
  
  // Dialog state
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null)
  
  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [isFeatured, setIsFeatured] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadError, setUploadError] = useState("")

  useEffect(() => {
    loadData()
  }, [user])

  async function loadData() {
    if (!user) return

    setIsLoading(true)
    try {
      // Get provider profile ID
      const profId = await getProviderProfileId(user.id)
      if (!profId) {
        toast.error("Provider profile not found. Please complete your profile first.")
        setIsLoading(false)
        return
      }
      setProviderId(profId)

      // Load portfolio items
      const portfolioData = await getPortfolioItems(profId)
      setItems(portfolioData)
    } catch (error) {
      console.error("Error loading portfolio:", error)
      toast.error("Failed to load portfolio")
    } finally {
      setIsLoading(false)
    }
  }

  function resetForm() {
    setTitle("")
    setDescription("")
    setCategory("")
    setIsFeatured(false)
    setImageFile(null)
    setImagePreview("")
    setEditingItem(null)
    setUploadError("")
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError("Please select an image file")
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be less than 5MB")
      return
    }

    setUploadError("")
    setImageFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  async function handleAdd() {
    if (!providerId) return

    // Validation
    if (!title.trim()) {
      toast.error("Please enter a title")
      return
    }
    if (!imageFile && !editingItem) {
      toast.error("Please select an image")
      return
    }

    setIsSubmitting(true)
    try {
      let imageUrl = editingItem?.image_url || ""

      // Upload image if new file selected
      if (imageFile) {
        const uploadedUrl = await uploadPortfolioImage(providerId, imageFile)
        if (!uploadedUrl) {
          throw new Error("Failed to upload image")
        }
        imageUrl = uploadedUrl
      }

      // Create portfolio item
      const newItem = await createPortfolioItem({
        provider_id: providerId,
        title: title.trim(),
        description: description.trim() || undefined,
        image_url: imageUrl,
        category: category || undefined,
        is_featured: isFeatured,
        display_order: items.length,
      })

      if (newItem) {
        setItems([...items, newItem])
        setShowAddDialog(false)
        resetForm()
        toast.success("Portfolio item added successfully!")
      }
    } catch (error: any) {
      console.error("Error adding portfolio item:", error)
      toast.error(error.message || "Failed to add portfolio item")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleEdit() {
    if (!editingItem || !providerId) return

    if (!title.trim()) {
      toast.error("Please enter a title")
      return
    }

    setIsSubmitting(true)
    try {
      let imageUrl = editingItem.image_url

      // Upload new image if selected
      if (imageFile) {
        const uploadedUrl = await uploadPortfolioImage(providerId, imageFile)
        if (!uploadedUrl) {
          throw new Error("Failed to upload image")
        }
        imageUrl = uploadedUrl
      }

      // Update portfolio item
      const updated = await updatePortfolioItem(editingItem.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        image_url: imageUrl,
        category: category || undefined,
        is_featured: isFeatured,
      })

      if (updated) {
        setItems(items.map((i) => (i.id === editingItem.id ? updated : i)))
        setEditingItem(null)
        resetForm()
        toast.success("Portfolio item updated successfully!")
      }
    } catch (error: any) {
      console.error("Error updating portfolio item:", error)
      toast.error(error.message || "Failed to update portfolio item")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this portfolio item?")) return

    try {
      const success = await deletePortfolioItem(id)
      if (success) {
        setItems(items.filter((i) => i.id !== id))
        toast.success("Portfolio item deleted successfully!")
      } else {
        toast.error("Failed to delete portfolio item")
      }
    } catch (error: any) {
      console.error("Error deleting portfolio item:", error)
      toast.error(error.message || "Failed to delete portfolio item")
    }
  }

  function openEdit(item: PortfolioItem) {
    setEditingItem(item)
    setTitle(item.title)
    setDescription(item.description || "")
    setCategory(item.category || "")
    setIsFeatured(item.is_featured)
    setImagePreview(item.image_url)
  }

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (!providerId) {
    return (
      <div className="flex flex-col gap-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Provider profile not found. Please complete your profile in the Profile tab first.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Portfolio</h1>
          <p className="text-muted-foreground">Showcase your best work to attract customers</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button
              className="bg-primary text-primary-foreground"
              onClick={() => {
                resetForm()
                setShowAddDialog(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground">Add Portfolio Item</DialogTitle>
              <DialogDescription>Add a new item to your portfolio to showcase your work</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="add-title" className="text-foreground">
                  Title *
                </Label>
                <Input
                  id="add-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Beach Wedding Ceremony"
                  className="bg-background"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="add-description" className="text-foreground">
                  Description
                </Label>
                <Textarea
                  id="add-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe this work..."
                  className="bg-background"
                  rows={3}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="add-category" className="text-foreground">
                  Category
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="add-featured" className="text-foreground">
                  Featured Item
                </Label>
                <Switch id="add-featured" checked={isFeatured} onCheckedChange={setIsFeatured} />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="add-image" className="text-foreground">
                  Image *
                </Label>
                <Input
                  id="add-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="bg-background"
                />
                {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
                {imagePreview && (
                  <div className="relative mt-2 aspect-video w-full overflow-hidden rounded-lg border border-border">
                    <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Maximum file size: 5MB. Supported formats: JPG, PNG, WebP
                </p>
              </div>

              <Button onClick={handleAdd} disabled={isSubmitting || !imageFile} className="bg-primary text-primary-foreground">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add to Portfolio
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingItem}
        onOpenChange={(o) => {
          if (!o) {
            setEditingItem(null)
            resetForm()
          }
        }}
      >
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Portfolio Item</DialogTitle>
            <DialogDescription>Update the details of your portfolio item</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-title" className="text-foreground">
                Title *
              </Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-background"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-description" className="text-foreground">
                Description
              </Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-background"
                rows={3}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-category" className="text-foreground">
                Category
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="edit-featured" className="text-foreground">
                Featured Item
              </Label>
              <Switch id="edit-featured" checked={isFeatured} onCheckedChange={setIsFeatured} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-image" className="text-foreground">
                Change Image (optional)
              </Label>
              <Input
                id="edit-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="bg-background"
              />
              {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
              {imagePreview && (
                <div className="relative mt-2 aspect-video w-full overflow-hidden rounded-lg border border-border">
                  <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                </div>
              )}
            </div>

            <Button onClick={handleEdit} disabled={isSubmitting} className="bg-primary text-primary-foreground">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Portfolio Grid */}
      {items.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden border-border bg-card">
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                <img src={item.image_url} alt={item.title} className="h-full w-full object-cover" crossOrigin="anonymous" />
                {item.is_featured && (
                  <div className="absolute left-2 top-2">
                    <div className="flex items-center gap-1 rounded-full bg-primary/90 px-2 py-1 text-xs font-medium text-primary-foreground backdrop-blur-sm">
                      <Star className="h-3 w-3" />
                      Featured
                    </div>
                  </div>
                )}
                <div className="absolute right-2 top-2 flex gap-1">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 bg-card/90 backdrop-blur-sm"
                    onClick={() => openEdit(item)}
                    aria-label={`Edit ${item.title}`}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 bg-card/90 text-destructive backdrop-blur-sm hover:text-destructive"
                    onClick={() => handleDelete(item.id)}
                    aria-label={`Delete ${item.title}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-medium text-card-foreground">{item.title}</h3>
                {item.description && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                )}
                {item.category && (
                  <span className="mt-2 inline-block rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {item.category}
                  </span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Image}
          title="No portfolio items"
          description="Add your best work to showcase to potential clients."
          actionLabel="Add Item"
          onAction={() => setShowAddDialog(true)}
        />
      )}
    </div>
  )
}
