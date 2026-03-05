# Provider Business Page - Implementation Plan

## Overview

The Business page allows providers to view and manage their business profile.

## URL & Route

- **Path:** `/provider/business`
- **Layout:** Provider layout (with sidebar/header)
- **Access:** Providers only (roleId: 2)

## Page Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ Provider Business Page (/provider/business)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  HEADER                                                  │    │
│  │  • Title: "Business Profile"                             │    │
│  │  • Breadcrumb: Home > Business                            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  VERIFICATION ALERT (if pending)                        │    │
│  │  ⏳ Pending Verification - Admin approval required        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │  ┌─────────────────────┐  ┌─────────────────────────┐   │  │
│  │  │                     │  │                         │   │  │
│  │  │   BUSINESS CARD      │  │   BUSINESS STATS        │   │  │
│  │  │                     │  │                         │   │  │
│  │  │  [Logo/Name]        │  │  Services: 8           │   │  │
│  │  │  Business Name       │  │  Bookings: 156         │   │  │
│  │  │  Description         │  │  Rating: ⭐ 4.5/5      │   │  │
│  │  │  Category Badge      │  │  Revenue: PKR 78K      │   │  │
│  │  │  Contact Info        │  │                         │   │  │
│  │  │  Verification Badge  │  │                         │   │  │
│  │  │                     │  │  [View Analytics]        │   │  │
│  │  │  [Edit Profile]      │  │                         │   │  │
│  │  │                     │  │                         │   │  │
│  │  └─────────────────────┘  └─────────────────────────┘   │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────┐    │  │
│  │  │  BUSINESS DETAILS                               │    │  │
│  │  │  • Full Description                               │    │  │
│  │  │  • Address & Location                             │    │  │
│  │  │  • Contact Information                            │    │  │
│  │  │  • Website & Social Links                          │    │  │
│  │  └─────────────────────────────────────────────────┘    │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  QUICK ACTIONS                                          │    │
│  │  • [📝 Edit Profile]  [📅 Availability]  [🔧 Services]  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Components Structure

```
app/(pages)/provider/business/
├── page.tsx                    # Main business page
└── components/
    ├── BusinessProfileCard.tsx  # Main business info card
    ├── BusinessStats.tsx         # Statistics display
    ├── BusinessDetails.tsx       # Detailed information
    └── EditBusinessDialog.tsx    # Edit modal
```

## 1. BusinessProfileCard Component

### Purpose

Display the main business information in an attractive card format.

### Features

- **Logo & Cover Image**: Display business branding
- **Business Name**: Large, prominent
- **Description**: Truncated with "Read more"
- **Category Badge**: Colored badge
- **Verification Status**:
  - ✅ Verified: Green checkmark badge
  - ⏳ Pending: Orange clock badge
- **Rating Display**: Stars + average
- **Contact Info**: Phone, email, address
- **Edit Button**: Opens edit dialog

### Props

```typescript
interface BusinessProfileCardProps {
  business: Business;
  onEdit: () => void;
}
```

### UI Elements

```tsx
<Card className="overflow-hidden">
  {/* Cover Image */}
  <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/5">
    {business.coverImage && (
      <img src={business.coverImage} className="w-full h-full object-cover" />
    )}
  </div>

  {/* Logo & Name */}
  <div className="relative px-6 pb-6">
    <div className="-mt-12 mb-4">
      <Avatar className="h-24 w-24 border-4 border-background">
        {business.logo ? (
          <AvatarImage src={business.logo} />
        ) : (
          <AvatarFallback className="text-2xl">
            {business.name.charAt(0)}
          </AvatarFallback>
        )}
      </Avatar>
    </div>

    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{business.name}</h2>
        <Badge variant={business.isVerified ? "success" : "secondary"}>
          {business.isVerified ? "✓ Verified" : "⏳ Pending"}
        </Badge>
      </div>

      <Badge variant="outline">{business.category}</Badge>

      <p className="text-muted-foreground line-clamp-2">
        {business.description}
      </p>

      {/* Rating */}
      {business.isVerified && (
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 fill-yellow-400" />
          <span className="font-medium">{business.rating || "New"}</span>
          <span className="text-muted-foreground text-sm">
            ({business.totalReviews || 0} reviews)
          </span>
        </div>
      )}

      {/* Contact */}
      <div className="space-y-1 text-sm">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span>{business.phone}</span>
        </div>
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span>{business.email}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span>{business.address}</span>
        </div>
      </div>

      <Button onClick={onEdit} className="w-full">
        Edit Profile
      </Button>
    </div>
  </div>
</Card>
```

## 2. BusinessStats Component

### Purpose

Display key business metrics.

### Stats to Show

```typescript
{
  servicesCount: number,      // Total services
  activeServices: number,      // Currently active
  totalBookings: number,       // All-time bookings
  completedBookings: number,   // Successfully completed
  totalRevenue: number,        // Total earnings
  averageRating: number,       // Star rating
  totalReviews: number,        // Review count
  verificationStatus: string,  // Verified/Pending
}
```

### UI Layout

```tsx
<div className="grid gap-4 md:grid-cols-4">
  <StatCard
    icon={Package}
    label="Services"
    value={stats.servicesCount}
    change="+2 this month"
  />
  <StatCard
    icon={Calendar}
    label="Bookings"
    value={stats.totalBookings}
    change="+12% from last month"
  />
  <StatCard
    icon={DollarSign}
    label="Revenue"
    value={`RS ${stats.totalRevenue.toLocaleString()}`}
    change="+8% from last month"
  />
  <StatCard
    icon={Star}
    label="Rating"
    value={stats.averageRating || "New"}
    subtext={`${stats.totalReviews} reviews`}
  />
</div>
```

## 3. BusinessDetails Component

### Purpose

Show detailed business information.

### Sections

1. **About**
   - Full description
   - Business history
   - Mission statement (optional)

2. **Contact Information**
   - Phone (with click-to-call)
   - Email (with mailto link)
   - Address
   - Website (with link)
   - Social media links (optional)

3. **Verification Status**
   - Status badge
   - Verification date (if verified)
   - Pending message (if pending)

### UI

```tsx
<Card>
  <CardHeader>
    <CardTitle>Business Details</CardTitle>
  </CardHeader>
  <CardContent className="space-y-6">
    {/* About Section */}
    <div>
      <h3 className="font-semibold mb-2">About</h3>
      <p className="text-muted-foreground">{business.description}</p>
    </div>

    {/* Contact Section */}
    <div>
      <h3 className="font-semibold mb-2">Contact Information</h3>
      <div className="space-y-2">
        <ContactRow
          icon={Phone}
          label="Phone"
          value={business.phone}
          href={`tel:${business.phone}`}
        />
        <ContactRow
          icon={Mail}
          label="Email"
          value={business.email}
          href={`mailto:${business.email}`}
        />
        <ContactRow icon={MapPin} label="Address" value={business.address} />
        <ContactRow
          icon={Globe}
          label="Website"
          value={business.website}
          href={business.website}
        />
      </div>
    </div>

    {/* Verification Section */}
    <div
      className={`p-4 rounded-lg ${business.isVerified ? "bg-green-50" : "bg-orange-50"}`}
    >
      <VerificationStatus business={business} />
    </div>
  </CardContent>
</Card>
```

## 4. EditBusinessDialog Component

### Purpose

Modal dialog to edit business profile.

### Features

- **Image Upload**: Logo and cover image (controlled upload)
- **Text Fields**: Name, description, category, website
- **Validation**: Same as onboarding Stage 1
- **Save/Cancel**: Action buttons

### Tabs Structure

```tsx
<Dialog>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Edit Business Profile</DialogTitle>
    </DialogHeader>

    <Tabs defaultValue="basic">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="basic">Basic Info</TabsTrigger>
        <TabsTrigger value="images">Images</TabsTrigger>
      </TabsList>

      <TabsContent value="basic">
        {/* Name, Description, Category, Contact, Website */}
      </TabsContent>

      <TabsContent value="images">
        {/* Logo Upload, Cover Image Upload */}
      </TabsContent>
    </Tabs>

    <DialogFooter>
      <Button variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button onClick={onSave} disabled={isSaving}>
        {isSaving ? <Loader2 className="animate-spin" /> : "Save Changes"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## 5. Page Layout (page.tsx)

### Data Fetching

```typescript
useEffect(() => {
  const loadBusiness = async () => {
    const userData = getUserData();
    if (userData) {
      const business = await getProviderBusiness(userData.id);
      setBusiness(business);
    }
  };
  loadBusiness();
}, []);
```

### Restriction Logic

```typescript
// If not verified, disable certain actions
const canManageServices = business?.isVerified;
const canReceiveBookings = business?.isVerified;
```

## Verification States

### Pending State

```tsx
<Alert variant="warning">
  <Clock className="animate-pulse" />
  <AlertTitle>Pending Verification</AlertTitle>
  <AlertDescription>
    Your business is awaiting admin approval. This usually takes 1-2 business
    days. You cannot add services or receive bookings until verified.
  </AlertDescription>
</Alert>
```

### Verified State

```tsx
<Alert variant="success">
  <CheckCircle2 />
  <AlertTitle>Business Verified</AlertTitle>
  <AlertDescription>
    Your business is verified and active. You can add services and receive
    bookings.
  </AlertDescription>
</Alert>
```

## API Integration

### Endpoints Used

```typescript
// Get business
GET /business/provider/:userId

// Update business
PUT /businesses/:id
{
  name,
  description,
  categoryId,
  logo?,        // URL from upload
  coverImage?,   // URL from upload
  website
}

// Upload images
POST /upload/logo
POST /upload/cover-image

// Get stats
GET /provider/dashboard/stats  (if exists)
```

## Quick Actions Section

```tsx
<div className="flex gap-2">
  <Button variant="outline" onClick={() => router.push("/provider/services")}>
    <Package className="h-4 w-4 mr-2" />
    Manage Services
  </Button>

  <Button
    variant="outline"
    onClick={() => router.push("/provider/availability")}
  >
    <Calendar className="h-4 w-4 mr-2" />
    Set Availability
  </Button>

  <Button variant="outline" onClick={() => router.push("/provider/bookings")}>
    <Users className="h-4 w-4 mr-2" />
    View Bookings
  </Button>
</div>
```

## File Organization

```
app/(pages)/provider/business/
├── page.tsx                           # Main page
└── components/
    ├── BusinessProfileCard.tsx        # Business card
    ├── BusinessStats.tsx               # Stats grid
    ├── BusinessDetails.tsx             # Details section
    └── EditBusinessDialog.tsx          # Edit modal
```

## Implementation Order

### Phase 1: Structure (Priority 1)

1. Create page structure with loading state
2. Fetch and display business data
3. Show verification alert

### Phase 2: Components (Priority 1)

1. BusinessProfileCard - Display business info
2. VerificationAlert - Show verification status

### Phase 3: Edit Functionality (Priority 2)

1. Create EditBusinessDialog
2. Implement image upload
3. Save changes to backend

### Phase 4: Stats (Priority 3)

1. Create BusinessStats component
2. Fetch or mock stats data
3. Display metrics

### Phase 5: Polish (Priority 3)

1. Add BusinessDetails section
2. Add quick actions
3. Error handling and loading states

## Mobile Responsiveness

### Breakpoints

```css
/* Desktop (default) */
.grid-cols-4        /* Stats grid */

/* Tablet (md) */
.grid-cols-2        /* Stats grid */

/* Mobile (sm) */
.grid-cols-1        /* Stats grid, stacked cards */
```

### Mobile Optimizations

- Stack cards vertically
- Full-width images
- Touch-friendly buttons
- Collapsible sections

## Error Handling

### Loading State

```tsx
{
  isLoading && (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin" />
    </div>
  );
}
```

### Error State

```tsx
{
  error && (
    <Alert variant="destructive">
      <AlertCircle />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
}
```

### Empty State (Shouldn't happen)

```tsx
{
  !business && !isLoading && (
    <Alert>
      <AlertTitle>No Business Found</AlertTitle>
      <AlertDescription>
        Please complete your onboarding to create a business profile.
      </AlertDescription>
    </Alert>
  );
}
```

## Future Enhancements

1. **Analytics**: Click on stats to see detailed charts
2. **Reviews**: Show recent reviews on business card
3. **Portfolio**: Image gallery of work samples
4. **Team**: Add team members
5. **Settings**: Business notification preferences
6. **Export**: Export business data as PDF

---

**Status:** Planning Complete
**Implementation:** Ready to start
**Priority:** High (after dashboard fixes)
