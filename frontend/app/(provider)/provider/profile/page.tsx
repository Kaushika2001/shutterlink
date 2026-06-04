"use client"

import { useState, useEffect } from "react"
import { useAuthReady } from "@/hooks/use-auth-ready"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Save, User, Briefcase, DollarSign, MapPin, Award, Clock, Star, Instagram, Facebook, Twitter, Linkedin } from "lucide-react"
import { toast } from "sonner"
import { getProviderProfile, updateProviderProfile, type ProviderProfile } from "@/services/provider"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"

const SERVICE_TYPES = [
  { value: "photographer", label: "Photographer" },
  { value: "videographer", label: "Videographer" },
  { value: "editor", label: "Photo/Video Editor" },
  { value: "equipment_renter", label: "Equipment Rental" },
]

const SPECIALIZATIONS = [
  "Wedding", "Portrait", "Event", "Commercial", "Real Estate", 
  "Product", "Fashion", "Sports", "Wildlife", "Landscape",
  "Food", "Automotive", "Drone", "Underwater", "Studio"
]

const AVAILABILITY_STATUS = [
  { value: "available", label: "Available", color: "bg-green-500" },
  { value: "busy", label: "Busy", color: "bg-yellow-500" },
  { value: "unavailable", label: "Unavailable", color: "bg-red-500" },
]

export default function ProviderProfilePage() {
  const { user, ready, isAuthenticated } = useAuthReady()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [profile, setProfile] = useState<ProviderProfile | null>(null)

  // Form state
  const [businessName, setBusinessName] = useState("")
  const [serviceTypes, setServiceTypes] = useState<string[]>([])
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([])
  const [yearsExperience, setYearsExperience] = useState("")
  const [hourlyRate, setHourlyRate] = useState("")
  const [availabilityStatus, setAvailabilityStatus] = useState<"available" | "busy" | "unavailable">("available")
  const [portfolioUrl, setPortfolioUrl] = useState("")
  const [bio, setBio] = useState("")
  const [equipmentList, setEquipmentList] = useState("")
  const [coverageAreas, setCoverageAreas] = useState("")
  const [maxTravelDistance, setMaxTravelDistance] = useState("")
  const [responseTimeHours, setResponseTimeHours] = useState("")
  
  // Social media
  const [instagramUrl, setInstagramUrl] = useState("")
  const [facebookUrl, setFacebookUrl] = useState("")
  const [twitterUrl, setTwitterUrl] = useState("")
  const [linkedinUrl, setLinkedinUrl] = useState("")

  useEffect(() => {
    if (!ready) return
    void loadProfile()
  }, [user, ready, isAuthenticated])

  async function loadProfile() {
    if (!isAuthenticated || !user) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const data = await getProviderProfile(user.id)
      if (data) {
        setProfile(data)
        populateForm(data)
      }
    } catch (error) {
      console.error("Error loading profile:", error)
      toast.error("Failed to load profile")
    } finally {
      setIsLoading(false)
    }
  }

  function populateForm(data: ProviderProfile) {
    setBusinessName(data.business_name || "")
    setServiceTypes(data.service_type || [])
    setSelectedSpecializations(data.specializations || [])
    setYearsExperience(data.years_experience?.toString() || "")
    setHourlyRate(data.hourly_rate?.toString() || "")
    setAvailabilityStatus(data.availability_status)
    setPortfolioUrl(data.portfolio_url || "")
    setBio(data.bio || "")
    setEquipmentList(data.equipment_list || "")
    setCoverageAreas(data.coverage_areas?.join(", ") || "")
    setMaxTravelDistance(data.max_travel_distance?.toString() || "")
    setResponseTimeHours(data.response_time_hours?.toString() || "")
    const social = (data as ProviderProfile & { social_urls?: Record<string, string> }).social_urls
    setInstagramUrl(data.instagram_url || social?.instagram || "")
    setFacebookUrl(data.facebook_url || social?.facebook || "")
    setTwitterUrl(data.twitter_url || social?.twitter || "")
    setLinkedinUrl(data.linkedin_url || social?.linkedin || "")
  }

  function toggleServiceType(type: string) {
    setServiceTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  function toggleSpecialization(spec: string) {
    setSelectedSpecializations(prev =>
      prev.includes(spec)
        ? prev.filter(s => s !== spec)
        : [...prev, spec]
    )
  }

  async function handleSave() {
    if (!user) return

    // Validation
    if (serviceTypes.length === 0) {
      toast.error("Please select at least one service type")
      return
    }

    if (!businessName.trim()) {
      toast.error("Business name is required")
      return
    }

    setIsSaving(true)
    try {
      const updates: Partial<ProviderProfile> = {
        business_name: businessName.trim(),
        service_type: serviceTypes,
        specializations: selectedSpecializations,
        years_experience: yearsExperience ? parseInt(yearsExperience, 10) : 0,
        hourly_rate: hourlyRate ? parseFloat(hourlyRate) : 0,
        availability_status: availabilityStatus,
        portfolio_url: portfolioUrl || null,
        bio: bio || null,
        equipment_list: equipmentList || null,
        coverage_areas: coverageAreas ? coverageAreas.split(",").map(a => a.trim()) : [],
        max_travel_distance: maxTravelDistance ? parseInt(maxTravelDistance) : null,
        response_time_hours: responseTimeHours ? parseInt(responseTimeHours) : null,
        instagram_url: instagramUrl || null,
        facebook_url: facebookUrl || null,
        twitter_url: twitterUrl || null,
        linkedin_url: linkedinUrl || null,
      }

      const updated = await updateProviderProfile(user.id, updates)
      setProfile(updated)
      toast.success("Profile updated successfully!")
    } catch (error: any) {
      console.error("Error saving profile:", error)
      toast.error(error.message || "Failed to save profile")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="flex flex-col gap-6">
      {!profile && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 text-sm text-muted-foreground">
            Complete your profile below and click <strong>Save Profile</strong> to appear on Explore and accept bookings.
          </CardContent>
        </Card>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Provider Profile</h1>
          <p className="text-muted-foreground">Manage your professional profile and service information</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-primary text-primary-foreground">
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Profile
            </>
          )}
        </Button>
      </div>

      {/* Profile Stats */}
      {profile && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border bg-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Verified</p>
                  <p className="text-lg font-semibold text-foreground">
                    {profile.is_verified ? "Yes" : "Pending"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Bookings</p>
                  <p className="text-lg font-semibold text-foreground">{profile.total_bookings}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Star className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Average Rating</p>
                  <p className="text-lg font-semibold text-foreground">{profile.average_rating.toFixed(1)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Response Time</p>
                  <p className="text-lg font-semibold text-foreground">
                    {profile.response_time_hours ? `${profile.response_time_hours}h` : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Basic Information */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle>Basic Information</CardTitle>
          </div>
          <CardDescription>Your professional identity and contact details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g., John's Photography Studio"
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="yearsExperience">Years of Experience</Label>
              <Input
                id="yearsExperience"
                type="number"
                value={yearsExperience}
                onChange={(e) => setYearsExperience(e.target.value)}
                placeholder="e.g., 5"
                className="bg-background"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Service Types *</Label>
            <div className="flex flex-wrap gap-2">
              {SERVICE_TYPES.map((type) => (
                <Badge
                  key={type.value}
                  variant={serviceTypes.includes(type.value) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleServiceType(type.value)}
                >
                  {type.label}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Specializations</Label>
            <div className="flex flex-wrap gap-2">
              {SPECIALIZATIONS.map((spec) => (
                <Badge
                  key={spec}
                  variant={selectedSpecializations.includes(spec) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleSpecialization(spec)}
                >
                  {spec}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell potential clients about yourself, your experience, and your style..."
              className="bg-background min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Pricing & Availability */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <CardTitle>Pricing & Availability</CardTitle>
          </div>
          <CardDescription>Set your rates and availability status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Hourly Rate (LKR)</Label>
              <Input
                id="hourlyRate"
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                placeholder="e.g., 5000"
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="availabilityStatus">Availability Status</Label>
              <Select value={availabilityStatus} onValueChange={(v: any) => setAvailabilityStatus(v)}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABILITY_STATUS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${status.color}`} />
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="responseTimeHours">Typical Response Time (hours)</Label>
              <Input
                id="responseTimeHours"
                type="number"
                value={responseTimeHours}
                onChange={(e) => setResponseTimeHours(e.target.value)}
                placeholder="e.g., 24"
                className="bg-background"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location & Coverage */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <CardTitle>Location & Coverage</CardTitle>
          </div>
          <CardDescription>Where you operate and travel preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="coverageAreas">Coverage Areas (comma-separated)</Label>
            <Input
              id="coverageAreas"
              value={coverageAreas}
              onChange={(e) => setCoverageAreas(e.target.value)}
              placeholder="e.g., Colombo, Kandy, Galle"
              className="bg-background"
            />
            <p className="text-xs text-muted-foreground">Enter cities or areas where you provide services</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxTravelDistance">Maximum Travel Distance (km)</Label>
            <Input
              id="maxTravelDistance"
              type="number"
              value={maxTravelDistance}
              onChange={(e) => setMaxTravelDistance(e.target.value)}
              placeholder="e.g., 50"
              className="bg-background"
            />
          </div>
        </CardContent>
      </Card>

      {/* Equipment & Portfolio */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <CardTitle>Equipment & Portfolio</CardTitle>
          </div>
          <CardDescription>Showcase your gear and work</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="equipmentList">Equipment List</Label>
            <Textarea
              id="equipmentList"
              value={equipmentList}
              onChange={(e) => setEquipmentList(e.target.value)}
              placeholder="List your cameras, lenses, lighting, and other equipment..."
              className="bg-background min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="portfolioUrl">Portfolio Website URL</Label>
            <Input
              id="portfolioUrl"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="https://yourwebsite.com"
              className="bg-background"
            />
          </div>
        </CardContent>
      </Card>

      {/* Social Media */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Social Media</CardTitle>
          <CardDescription>Connect your social media profiles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instagramUrl">
              <div className="flex items-center gap-2">
                <Instagram className="h-4 w-4" />
                Instagram
              </div>
            </Label>
            <Input
              id="instagramUrl"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="https://instagram.com/username"
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="facebookUrl">
              <div className="flex items-center gap-2">
                <Facebook className="h-4 w-4" />
                Facebook
              </div>
            </Label>
            <Input
              id="facebookUrl"
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
              placeholder="https://facebook.com/page"
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="twitterUrl">
              <div className="flex items-center gap-2">
                <Twitter className="h-4 w-4" />
                Twitter
              </div>
            </Label>
            <Input
              id="twitterUrl"
              value={twitterUrl}
              onChange={(e) => setTwitterUrl(e.target.value)}
              placeholder="https://twitter.com/username"
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedinUrl">
              <div className="flex items-center gap-2">
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </div>
            </Label>
            <Input
              id="linkedinUrl"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/username"
              className="bg-background"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button (Bottom) */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} className="bg-primary text-primary-foreground">
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Profile
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
