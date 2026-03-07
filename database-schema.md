# ShutterLink Database Schema

## Overview
This document describes the current and planned database schema for the ShutterLink platform - a photography service marketplace connecting photographers/editors with customers.

**Database**: Supabase (PostgreSQL)
**Last Updated**: February 22, 2026

---

## Current Implementation Status

### ✅ Implemented Tables

#### 1. `users`
**Purpose**: Core user authentication and profile management for all user types

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier (references `auth.users.id`) |
| `email` | VARCHAR | UNIQUE, NOT NULL | User's email address |
| `name` | VARCHAR | NOT NULL | User's full name |
| `role` | ENUM | NOT NULL | User role: 'customer', 'provider', 'admin' |
| `contact_number` | VARCHAR | NULLABLE | Phone number |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Account creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes**:
- PRIMARY KEY on `id`
- UNIQUE INDEX on `email`
- INDEX on `role` (for filtering)

**Referenced in code**:
- `src/services/auth.ts:29` - User insertion during registration
- `src/services/auth.ts:95` - Role lookup
- `src/services/auth.ts:111` - Role lookup by ID

**Row Level Security (RLS)**: Should be enabled
- Users can read their own profile
- Admins can read all profiles
- Users can update their own profile

---

## Planned Tables (Based on Epics)

### Epic 1: User Management & Authentication

#### 2. `user_profiles` (Extension of users table)
**Purpose**: Extended profile information for all users

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated UUID |
| `user_id` | UUID | FK → users.id, UNIQUE | Reference to users table |
| `bio` | TEXT | NULLABLE | User biography |
| `profile_picture_url` | VARCHAR | NULLABLE | Profile photo URL |
| `location` | VARCHAR | NULLABLE | City/Region |
| `country` | VARCHAR | NULLABLE | Country |
| `timezone` | VARCHAR | NULLABLE | User timezone |
| `language_preference` | VARCHAR | DEFAULT 'en' | Preferred language |
| `notification_preferences` | JSONB | DEFAULT '{}' | Notification settings |
| `is_email_verified` | BOOLEAN | DEFAULT FALSE | Email verification status |
| `is_phone_verified` | BOOLEAN | DEFAULT FALSE | Phone verification status |
| `last_login_at` | TIMESTAMP | NULLABLE | Last login timestamp |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Profile creation date |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update |

---

### Epic 2: Photographer & Editor Profile Management

#### 3. `provider_profiles`
**Purpose**: Detailed profiles for photographers and editors

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated UUID |
| `user_id` | UUID | FK → users.id, UNIQUE | Reference to users table |
| `business_name` | VARCHAR | NULLABLE | Business/Studio name |
| `service_type` | VARCHAR[] | NOT NULL | Array: ['photographer', 'editor', 'both'] |
| `specializations` | VARCHAR[] | DEFAULT '{}' | Wedding, Portrait, Event, etc. |
| `years_experience` | INTEGER | NULLABLE | Years in business |
| `hourly_rate` | DECIMAL(10,2) | NULLABLE | Base hourly rate |
| `availability_status` | ENUM | DEFAULT 'available' | 'available', 'busy', 'unavailable' |
| `portfolio_url` | VARCHAR | NULLABLE | External portfolio link |
| `bio` | TEXT | NULLABLE | Professional bio |
| `equipment_list` | TEXT | NULLABLE | Equipment description |
| `coverage_areas` | VARCHAR[] | DEFAULT '{}' | Service locations |
| `max_travel_distance` | INTEGER | NULLABLE | Max km willing to travel |
| `is_verified` | BOOLEAN | DEFAULT FALSE | Admin verified status |
| `verification_date` | TIMESTAMP | NULLABLE | When verified |
| `total_bookings` | INTEGER | DEFAULT 0 | Lifetime booking count |
| `average_rating` | DECIMAL(3,2) | DEFAULT 0 | Average review rating |
| `response_time_hours` | INTEGER | NULLABLE | Avg response time |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Profile creation |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update |

#### 4. `portfolio_items`
**Purpose**: Gallery items for provider portfolios

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated UUID |
| `provider_id` | UUID | FK → provider_profiles.id | Owner of portfolio |
| `title` | VARCHAR | NOT NULL | Image/Project title |
| `description` | TEXT | NULLABLE | Description |
| `image_url` | VARCHAR | NOT NULL | Image URL |
| `category` | VARCHAR | NULLABLE | Wedding, Portrait, etc. |
| `is_featured` | BOOLEAN | DEFAULT FALSE | Show on profile |
| `display_order` | INTEGER | DEFAULT 0 | Sort order |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Upload date |

#### 5. `service_packages`
**Purpose**: Pre-defined service packages offered by providers

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated UUID |
| `provider_id` | UUID | FK → provider_profiles.id | Package owner |
| `name` | VARCHAR | NOT NULL | Package name |
| `description` | TEXT | NOT NULL | Package details |
| `service_type` | ENUM | NOT NULL | 'photography', 'editing', 'both' |
| `duration_hours` | DECIMAL(4,2) | NULLABLE | Session duration |
| `price` | DECIMAL(10,2) | NOT NULL | Package price |
| `deliverables` | TEXT[] | DEFAULT '{}' | What's included |
| `max_revisions` | INTEGER | DEFAULT 0 | Editing revisions allowed |
| `turnaround_days` | INTEGER | NULLABLE | Delivery timeframe |
| `is_active` | BOOLEAN | DEFAULT TRUE | Available for booking |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation date |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update |

---

### Epic 3: Customer Service Discovery

#### 6. `service_categories`
**Purpose**: Categorization for service discovery

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated UUID |
| `name` | VARCHAR | NOT NULL, UNIQUE | Category name |
| `slug` | VARCHAR | NOT NULL, UNIQUE | URL-friendly slug |
| `description` | TEXT | NULLABLE | Category description |
| `icon` | VARCHAR | NULLABLE | Icon identifier |
| `parent_category_id` | UUID | FK → service_categories.id | Parent category |
| `is_active` | BOOLEAN | DEFAULT TRUE | Visible in search |
| `display_order` | INTEGER | DEFAULT 0 | Sort order |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation date |

#### 7. `saved_providers`
**Purpose**: Customers can save/favorite providers

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated UUID |
| `customer_id` | UUID | FK → users.id | Customer who saved |
| `provider_id` | UUID | FK → provider_profiles.id | Saved provider |
| `created_at` | TIMESTAMP | DEFAULT NOW() | When saved |

**Indexes**:
- UNIQUE INDEX on (`customer_id`, `provider_id`)

---

### Epic 4: Booking & Appointment System

#### 8. `bookings`
**Purpose**: Core booking/appointment management

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated UUID |
| `booking_number` | VARCHAR | UNIQUE, NOT NULL | Human-readable ID |
| `customer_id` | UUID | FK → users.id | Customer |
| `provider_id` | UUID | FK → provider_profiles.id | Provider |
| `package_id` | UUID | FK → service_packages.id | Selected package |
| `status` | ENUM | NOT NULL | 'pending', 'confirmed', 'completed', 'cancelled' |
| `service_date` | DATE | NOT NULL | Scheduled date |
| `service_time` | TIME | NOT NULL | Scheduled time |
| `duration_hours` | DECIMAL(4,2) | NOT NULL | Session duration |
| `location_type` | ENUM | NOT NULL | 'on_site', 'studio', 'remote' |
| `location_address` | TEXT | NULLABLE | Service location |
| `special_requests` | TEXT | NULLABLE | Customer notes |
| `total_price` | DECIMAL(10,2) | NOT NULL | Total cost |
| `deposit_amount` | DECIMAL(10,2) | DEFAULT 0 | Deposit required |
| `deposit_paid` | BOOLEAN | DEFAULT FALSE | Deposit status |
| `cancellation_reason` | TEXT | NULLABLE | Why cancelled |
| `cancelled_by` | UUID | FK → users.id | Who cancelled |
| `cancelled_at` | TIMESTAMP | NULLABLE | Cancellation time |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Booking creation |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update |

**Indexes**:
- INDEX on `customer_id`
- INDEX on `provider_id`
- INDEX on `status`
- INDEX on `service_date`

#### 9. `availability_schedules`
**Purpose**: Provider availability management

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated UUID |
| `provider_id` | UUID | FK → provider_profiles.id | Provider |
| `day_of_week` | INTEGER | NOT NULL | 0=Sunday to 6=Saturday |
| `start_time` | TIME | NOT NULL | Available from |
| `end_time` | TIME | NOT NULL | Available until |
| `is_available` | BOOLEAN | DEFAULT TRUE | Active schedule |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation date |

**Indexes**:
- INDEX on (`provider_id`, `day_of_week`)

#### 10. `blocked_dates`
**Purpose**: Provider unavailable dates

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated UUID |
| `provider_id` | UUID | FK → provider_profiles.id | Provider |
| `blocked_date` | DATE | NOT NULL | Unavailable date |
| `reason` | VARCHAR | NULLABLE | Why blocked |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation date |

**Indexes**:
- UNIQUE INDEX on (`provider_id`, `blocked_date`)

---

### Epic 5: Payment Management

#### 11. `payments`
**Purpose**: Payment transaction records

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated UUID |
| `booking_id` | UUID | FK → bookings.id | Related booking |
| `payer_id` | UUID | FK → users.id | Who paid |
| `amount` | DECIMAL(10,2) | NOT NULL | Payment amount |
| `payment_type` | ENUM | NOT NULL | 'deposit', 'full_payment', 'refund' |
| `payment_method` | VARCHAR | NOT NULL | 'card', 'bank_transfer', etc. |
| `payment_gateway` | VARCHAR | NULLABLE | Stripe, PayPal, etc. |
| `transaction_id` | VARCHAR | UNIQUE | External transaction ID |
| `status` | ENUM | NOT NULL | 'pending', 'completed', 'failed', 'refunded' |
| `payment_date` | TIMESTAMP | NULLABLE | When processed |
| `failure_reason` | TEXT | NULLABLE | Error message |
| `metadata` | JSONB | DEFAULT '{}' | Gateway response |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation |

#### 12. `provider_payouts`
**Purpose**: Track provider earnings and payouts

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated UUID |
| `provider_id` | UUID | FK → provider_profiles.id | Provider |
| `booking_id` | UUID | FK → bookings.id | Related booking |
| `gross_amount` | DECIMAL(10,2) | NOT NULL | Before fees |
| `platform_fee` | DECIMAL(10,2) | NOT NULL | ShutterLink commission |
| `net_amount` | DECIMAL(10,2) | NOT NULL | Provider receives |
| `payout_status` | ENUM | NOT NULL | 'pending', 'processed', 'failed' |
| `payout_date` | TIMESTAMP | NULLABLE | When paid out |
| `payout_method` | VARCHAR | NULLABLE | Bank transfer, etc. |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation |

---

### Epic 6: Ratings & Reviews

#### 13. `reviews`
**Purpose**: Customer reviews of providers

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated UUID |
| `booking_id` | UUID | FK → bookings.id | Related booking |
| `reviewer_id` | UUID | FK → users.id | Customer reviewer |
| `provider_id` | UUID | FK → provider_profiles.id | Provider being reviewed |
| `rating` | INTEGER | NOT NULL, CHECK (1-5) | Star rating |
| `title` | VARCHAR | NULLABLE | Review headline |
| `comment` | TEXT | NULLABLE | Review text |
| `would_recommend` | BOOLEAN | DEFAULT TRUE | Recommendation |
| `professionalism_rating` | INTEGER | CHECK (1-5) | Sub-rating |
| `quality_rating` | INTEGER | CHECK (1-5) | Sub-rating |
| `value_rating` | INTEGER | CHECK (1-5) | Sub-rating |
| `is_verified_booking` | BOOLEAN | DEFAULT FALSE | Verified purchase |
| `is_visible` | BOOLEAN | DEFAULT TRUE | Public/Hidden |
| `flagged_count` | INTEGER | DEFAULT 0 | Abuse reports |
| `helpful_count` | INTEGER | DEFAULT 0 | Helpful votes |
| `provider_response` | TEXT | NULLABLE | Provider reply |
| `provider_response_date` | TIMESTAMP | NULLABLE | Reply date |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Review date |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last edit |

**Indexes**:
- INDEX on `provider_id`
- INDEX on `rating`
- UNIQUE INDEX on `booking_id` (one review per booking)

#### 14. `review_responses`
**Purpose**: Provider responses to reviews

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated UUID |
| `review_id` | UUID | FK → reviews.id, UNIQUE | Parent review |
| `provider_id` | UUID | FK → provider_profiles.id | Responding provider |
| `response_text` | TEXT | NOT NULL | Response content |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Response date |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last edit |

---

### Epic 7: Admin Panel & Management

#### 15. `admin_actions`
**Purpose**: Audit log of admin activities

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated UUID |
| `admin_id` | UUID | FK → users.id | Admin user |
| `action_type` | VARCHAR | NOT NULL | Action performed |
| `target_type` | VARCHAR | NULLABLE | Table affected |
| `target_id` | UUID | NULLABLE | Record ID affected |
| `details` | JSONB | DEFAULT '{}' | Action details |
| `ip_address` | VARCHAR | NULLABLE | Admin IP |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Action timestamp |

#### 16. `platform_settings`
**Purpose**: System configuration

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated UUID |
| `setting_key` | VARCHAR | UNIQUE, NOT NULL | Setting identifier |
| `setting_value` | TEXT | NOT NULL | Setting value |
| `setting_type` | VARCHAR | NOT NULL | Data type |
| `description` | TEXT | NULLABLE | What it controls |
| `is_public` | BOOLEAN | DEFAULT FALSE | Client-side access |
| `updated_by` | UUID | FK → users.id | Last admin |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update |

---

### Epic 8: Notifications & Communication

#### 17. `notifications`
**Purpose**: In-app notification system

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated UUID |
| `user_id` | UUID | FK → users.id | Recipient |
| `type` | VARCHAR | NOT NULL | Notification category |
| `title` | VARCHAR | NOT NULL | Notification title |
| `message` | TEXT | NOT NULL | Notification body |
| `link` | VARCHAR | NULLABLE | Action URL |
| `is_read` | BOOLEAN | DEFAULT FALSE | Read status |
| `read_at` | TIMESTAMP | NULLABLE | When read |
| `priority` | ENUM | DEFAULT 'normal' | 'low', 'normal', 'high' |
| `metadata` | JSONB | DEFAULT '{}' | Extra data |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation time |

**Indexes**:
- INDEX on (`user_id`, `is_read`)
- INDEX on `created_at`

#### 18. `messages`
**Purpose**: Direct messaging between users

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated UUID |
| `conversation_id` | UUID | NOT NULL | Thread identifier |
| `sender_id` | UUID | FK → users.id | Message sender |
| `recipient_id` | UUID | FK → users.id | Message recipient |
| `booking_id` | UUID | FK → bookings.id | Related booking |
| `message_text` | TEXT | NOT NULL | Message content |
| `is_read` | BOOLEAN | DEFAULT FALSE | Read status |
| `read_at` | TIMESTAMP | NULLABLE | When read |
| `attachment_url` | VARCHAR | NULLABLE | File attachment |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Send time |

**Indexes**:
- INDEX on `conversation_id`
- INDEX on (`sender_id`, `recipient_id`)

---

### Epic 9: Reports & Analytics

#### 19. `analytics_events`
**Purpose**: Track user behavior and platform metrics

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated UUID |
| `user_id` | UUID | FK → users.id | User (nullable) |
| `event_type` | VARCHAR | NOT NULL | Event name |
| `event_category` | VARCHAR | NOT NULL | Event grouping |
| `properties` | JSONB | DEFAULT '{}' | Event data |
| `page_url` | VARCHAR | NULLABLE | Where it happened |
| `session_id` | VARCHAR | NULLABLE | Session identifier |
| `ip_address` | VARCHAR | NULLABLE | User IP |
| `user_agent` | TEXT | NULLABLE | Browser info |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Event timestamp |

**Indexes**:
- INDEX on `event_type`
- INDEX on `created_at`
- INDEX on `user_id`

#### 20. `provider_statistics`
**Purpose**: Aggregated provider performance metrics

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated UUID |
| `provider_id` | UUID | FK → provider_profiles.id, UNIQUE | Provider |
| `total_bookings` | INTEGER | DEFAULT 0 | Lifetime bookings |
| `completed_bookings` | INTEGER | DEFAULT 0 | Completed services |
| `cancelled_bookings` | INTEGER | DEFAULT 0 | Cancellations |
| `total_revenue` | DECIMAL(12,2) | DEFAULT 0 | Lifetime earnings |
| `average_rating` | DECIMAL(3,2) | DEFAULT 0 | Review average |
| `total_reviews` | INTEGER | DEFAULT 0 | Review count |
| `profile_views` | INTEGER | DEFAULT 0 | Profile views |
| `response_rate_percent` | DECIMAL(5,2) | DEFAULT 0 | Response rate |
| `acceptance_rate_percent` | DECIMAL(5,2) | DEFAULT 0 | Booking acceptance |
| `last_calculated_at` | TIMESTAMP | DEFAULT NOW() | Last update |

---

### Epic 10: Security & Privacy

#### 21. `user_sessions`
**Purpose**: Track active user sessions

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated UUID |
| `user_id` | UUID | FK → users.id | User |
| `session_token` | VARCHAR | UNIQUE, NOT NULL | Session identifier |
| `ip_address` | VARCHAR | NULLABLE | Login IP |
| `user_agent` | TEXT | NULLABLE | Device info |
| `is_active` | BOOLEAN | DEFAULT TRUE | Session status |
| `expires_at` | TIMESTAMP | NOT NULL | Expiry time |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Login time |
| `last_activity_at` | TIMESTAMP | DEFAULT NOW() | Last action |

#### 22. `audit_logs`
**Purpose**: Security audit trail

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated UUID |
| `user_id` | UUID | FK → users.id | User |
| `action` | VARCHAR | NOT NULL | Action performed |
| `resource_type` | VARCHAR | NULLABLE | Table affected |
| `resource_id` | UUID | NULLABLE | Record ID |
| `ip_address` | VARCHAR | NULLABLE | User IP |
| `user_agent` | TEXT | NULLABLE | Browser info |
| `details` | JSONB | DEFAULT '{}' | Action details |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Action time |

**Indexes**:
- INDEX on `user_id`
- INDEX on `created_at`
- INDEX on `action`

---

### Epic 11: Performance & Scalability

#### 23. `cache_entries` (Optional - if using DB caching)
**Purpose**: Database-level caching

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `key` | VARCHAR | PRIMARY KEY | Cache key |
| `value` | TEXT | NOT NULL | Cached value |
| `expires_at` | TIMESTAMP | NOT NULL | Expiry time |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation time |

---

### Epic 12: File & Media Handling

#### 24. `media_files`
**Purpose**: Track all uploaded files

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated UUID |
| `uploader_id` | UUID | FK → users.id | Who uploaded |
| `file_name` | VARCHAR | NOT NULL | Original filename |
| `file_path` | VARCHAR | NOT NULL | Storage path/URL |
| `file_type` | VARCHAR | NOT NULL | MIME type |
| `file_size_bytes` | BIGINT | NOT NULL | File size |
| `storage_provider` | VARCHAR | DEFAULT 'supabase' | Where stored |
| `related_entity_type` | VARCHAR | NULLABLE | profile, booking, etc. |
| `related_entity_id` | UUID | NULLABLE | Related record |
| `is_public` | BOOLEAN | DEFAULT FALSE | Public access |
| `is_deleted` | BOOLEAN | DEFAULT FALSE | Soft delete |
| `metadata` | JSONB | DEFAULT '{}' | Image dimensions, etc. |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Upload time |

**Indexes**:
- INDEX on `uploader_id`
- INDEX on (`related_entity_type`, `related_entity_id`)

---

### Epic 13: Customization & Localization

#### 25. `translations`
**Purpose**: Multi-language support

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated UUID |
| `language_code` | VARCHAR | NOT NULL | 'en', 'es', etc. |
| `translation_key` | VARCHAR | NOT NULL | Key identifier |
| `translation_value` | TEXT | NOT NULL | Translated text |
| `context` | VARCHAR | NULLABLE | Where used |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation date |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update |

**Indexes**:
- UNIQUE INDEX on (`language_code`, `translation_key`)

---

### Epic 14: System Health & Maintenance

#### 26. `system_health_logs`
**Purpose**: System monitoring and health checks

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated UUID |
| `check_type` | VARCHAR | NOT NULL | Health check name |
| `status` | ENUM | NOT NULL | 'healthy', 'degraded', 'down' |
| `response_time_ms` | INTEGER | NULLABLE | Check duration |
| `details` | JSONB | DEFAULT '{}' | Check results |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Check time |

**Indexes**:
- INDEX on `check_type`
- INDEX on `created_at`

---

## Database Relationships Summary

```
users
├── user_profiles (1:1)
├── provider_profiles (1:1)
├── bookings (1:many as customer)
├── bookings (1:many as provider via provider_profiles)
├── reviews (1:many as reviewer)
├── notifications (1:many)
├── messages (1:many as sender/recipient)
├── saved_providers (1:many)
├── payments (1:many as payer)
├── admin_actions (1:many)
└── media_files (1:many)

provider_profiles
├── portfolio_items (1:many)
├── service_packages (1:many)
├── availability_schedules (1:many)
├── blocked_dates (1:many)
├── bookings (1:many)
├── reviews (1:many)
├── provider_payouts (1:many)
└── provider_statistics (1:1)

bookings
├── payments (1:many)
├── reviews (1:1)
├── messages (1:many)
└── provider_payouts (1:1)

reviews
├── review_responses (1:1)
```

---

## Migration Plan

### Phase 1: Core Features (Weeks 1-2)
- ✅ users (Already implemented)
- user_profiles
- provider_profiles
- portfolio_items
- service_packages

### Phase 2: Booking System (Weeks 3-4)
- bookings
- availability_schedules
- blocked_dates
- service_categories
- saved_providers

### Phase 3: Financial (Week 5)
- payments
- provider_payouts

### Phase 4: Social & Communication (Week 6)
- reviews
- review_responses
- notifications
- messages

### Phase 5: Admin & Analytics (Week 7)
- admin_actions
- analytics_events
- provider_statistics
- platform_settings

### Phase 6: Advanced Features (Week 8)
- media_files
- audit_logs
- user_sessions
- translations
- system_health_logs

---

## Important Notes

1. **UUID vs Serial IDs**: Using UUIDs for better scalability and security
2. **Soft Deletes**: Consider adding `deleted_at` timestamp to major tables
3. **Indexes**: Add indexes on foreign keys and frequently queried columns
4. **RLS Policies**: Every table needs Row Level Security policies in Supabase
5. **Triggers**: Consider triggers for:
   - Updating `updated_at` timestamps
   - Calculating provider statistics
   - Sending notifications on booking changes
6. **Full-Text Search**: Add GIN indexes on text columns for search functionality
7. **Partitioning**: Consider partitioning large tables like `analytics_events` by date

---

## Supabase-Specific Considerations

### Storage Buckets
- `profile-pictures` - User profile photos
- `portfolio-images` - Provider portfolio
- `booking-attachments` - Booking-related files

### Edge Functions
- Payment processing
- Email notifications
- Image optimization
- Analytics aggregation

### Realtime Subscriptions
- Messages table (real-time chat)
- Notifications table (live notifications)
- Bookings table (status updates)

---

## Security Best Practices

1. Enable RLS on all tables
2. Create policies for each user role (customer, provider, admin)
3. Use prepared statements (Supabase handles this)
4. Validate all inputs on the server side
5. Store sensitive data encrypted
6. Implement rate limiting on API endpoints
7. Regular security audits via `audit_logs`

---

## Next Steps

1. Create SQL migration scripts for each phase
2. Set up RLS policies for each table
3. Create database functions for complex queries
4. Set up database triggers for automation
5. Create views for common queries
6. Plan backup and recovery strategy
