export type UserRole = 'customer' | 'provider' | 'admin';
export type ProviderType = 'photographer' | 'editor' | 'equipment_renter';
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PaymentMethod = 'stripe';
export type ServiceCategory = 'wedding' | 'portrait' | 'event' | 'commercial' | 'real_estate' | 'product' | 'editing' | 'equipment_rental';
export type LocationType = 'on_site' | 'studio' | 'remote';

// User & Auth
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  created_at: string;
  updated_at: string;
  is_verified: boolean;
}

export interface SupabaseSessionPayload {
  access_token: string;
  refresh_token: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  /** Supabase session for Realtime subscriptions in the browser */
  supabase_session?: SupabaseSessionPayload | null;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface PasswordResetPayload {
  email: string;
}

// Provider
export interface ProviderProfile {
  id: string;
  user_id: string;
  business_name: string;
  service_type: ProviderType[];
  specializations: string[];
  years_experience: number;
  hourly_rate: number;
  availability_status: 'available' | 'busy' | 'unavailable';
  portfolio_url?: string;
  bio?: string;
  equipment_list?: string[];
  coverage_areas?: string[];
  max_travel_distance?: number;
  social_urls?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
  };
  is_verified: boolean;
  verification_date?: string;
  total_bookings: number;
  average_rating: number;
  response_time_hours: number;
}

export interface CreateProviderPayload {
  business_name: string;
  service_type: ProviderType[];
  specializations?: string[];
  years_experience: number;
  hourly_rate: number;
  bio?: string;
  equipment_list?: string[];
  coverage_areas?: string[];
  max_travel_distance?: number;
  social_urls?: Record<string, string>;
}

// Bookings
export interface Booking {
  id: string;
  booking_number: string;
  customer_id: string;
  provider_id: string;
  package_id: string;
  status: BookingStatus;
  service_date: string;
  service_time: string;
  duration_hours: number;
  location_type: LocationType;
  location_address: string;
  special_requests?: string;
  total_price: number;
  deposit_amount: number;
  deposit_paid: boolean;
  cancellation_reason?: string;
  cancelled_by?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBookingPayload {
  provider_id: string;
  package_id: string;
  service_date: string;
  service_time: string;
  duration_hours: number;
  location_type: LocationType;
  location_address: string;
  special_requests?: string;
}

// Service Packages
export interface ServicePackage {
  id: string;
  provider_id: string;
  name: string;
  description: string;
  service_type: 'photography' | 'editing' | 'both';
  duration_hours: number;
  price: number;
  deliverables: string[];
  max_revisions: number;
  turnaround_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePackagePayload {
  name: string;
  description: string;
  service_type: 'photography' | 'editing' | 'both';
  duration_hours: number;
  price: number;
  deliverables: string[];
  max_revisions: number;
  turnaround_days: number;
}

// Portfolio
export interface PortfolioItem {
  id: string;
  provider_id: string;
  title: string;
  description: string;
  image_url: string;
  category: ServiceCategory;
  is_featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePortfolioPayload {
  title: string;
  description: string;
  category: ServiceCategory;
  is_featured?: boolean;
}

// Payments
export interface Payment {
  id: string;
  booking_id: string;
  payer_id: string;
  amount: number;
  payment_type: 'deposit' | 'full_payment' | 'refund';
  payment_method: PaymentMethod;
  payment_gateway: string;
  transaction_id: string;
  status: PaymentStatus;
  payment_date: string;
  failure_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentPayload {
  booking_id: string;
  amount: number;
  payment_type: 'deposit' | 'full_payment' | 'refund';
  payment_method: PaymentMethod;
}

export interface ProviderPayout {
  id: string;
  provider_id: string;
  booking_id: string;
  gross_amount: number;
  platform_fee: number;
  net_amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  payout_method: string;
  payout_date?: string;
  payout_transaction_id?: string;
}

// Reviews
export interface Review {
  id: string;
  booking_id: string;
  reviewer_id: string;
  provider_id: string;
  rating: number;
  title: string;
  comment: string;
  would_recommend: boolean;
  is_verified_booking: boolean;
  is_visible: boolean;
  professionalism_rating: number;
  quality_rating: number;
  value_rating: number;
  flagged_count: number;
  helpful_count: number;
  provider_response?: string;
  provider_response_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateReviewPayload {
  booking_id: string;
  rating: number;
  title: string;
  comment: string;
  would_recommend: boolean;
  professionalism_rating: number;
  quality_rating: number;
  value_rating: number;
}

// Messaging
export interface Message {
  id: string;
  booking_id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMessagePayload {
  booking_id: string;
  recipient_id: string;
  message: string;
}

// Notifications
export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

// Availability
export interface AvailabilitySchedule {
  id: string;
  provider_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface BlockedDate {
  id: string;
  provider_id: string;
  blocked_date: string;
  reason: string;
}

// API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// Search/Filter Options
export interface ProviderSearchOptions {
  service_type?: ProviderType;
  location?: string;
  min_rating?: number;
  min_price?: number;
  max_price?: number;
  specialization?: string;
  is_verified?: boolean;
  page?: number;
  limit?: number;
}
