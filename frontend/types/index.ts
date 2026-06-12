export type UserRole = "customer" | "provider" | "admin"

export type ProviderType = "photographer" | "editor" | "equipment_renter"

export type BookingStatus = "pending" | "confirmed" | "in_progress" | "completed" | "cancelled" | "rejected"

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded"

export type PaymentMethod = "stripe" | "bank_transfer" | "card"

export type ServiceCategory = "wedding" | "portrait" | "event" | "commercial" | "real_estate" | "product" | "editing" | "equipment_rental"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
  phone?: string
  created_at: string
  is_verified: boolean
}

export interface Provider extends User {
  provider_type: ProviderType
  business_name: string
  description: string
  categories: ServiceCategory[]
  price_range: { min: number; max: number }
  rating: number
  total_reviews: number
  portfolio: PortfolioItem[]
  availability: AvailabilitySlot[]
  location: string
  is_approved: boolean
  total_bookings: number
}

export interface PortfolioItem {
  id: string
  provider_id: string
  title: string
  description: string
  image_url: string
  category: ServiceCategory
  created_at: string
}

export interface AvailabilitySlot {
  id: string
  provider_id: string
  date: string
  start_time: string
  end_time: string
  is_available: boolean
}

export interface Booking {
  id: string
  customer_id: string
  customer_name: string
  customer_email: string
  provider_id: string
  provider_name: string
  provider_business: string
  service_category: ServiceCategory
  date: string
  start_time: string
  end_time: string
  location: string
  notes: string
  status: BookingStatus
  total_amount: number
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  booking_id: string
  customer_id: string
  customer_name: string
  provider_id: string
  provider_name: string
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  transaction_ref: string
  created_at: string
}

export interface Review {
  id: string
  booking_id: string
  customer_id: string
  customer_name: string
  customer_avatar?: string
  provider_id: string
  rating: number
  comment: string
  created_at: string
}

export interface StatCard {
  title: string
  value: string | number
  change?: number
  icon: React.ReactNode
  trend?: "up" | "down" | "neutral"
}

export interface ChartDataPoint {
  name: string
  value: number
  [key: string]: string | number
}

export interface Dispute {
  id: string
  booking_id: string
  customer_name: string
  provider_name: string
  reason: string
  status: "open" | "investigating" | "resolved" | "closed"
  created_at: string
  resolved_at?: string
}
