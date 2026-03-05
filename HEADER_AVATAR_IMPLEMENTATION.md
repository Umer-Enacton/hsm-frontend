# Header Avatar Implementation

## Summary
Added user avatar display functionality to the Header component. The avatar is fetched from the backend and displayed in the user menu dropdown.

## Changes Made

### 1. Admin Layout (`app/(pages)/admin/layout.tsx`)

#### Added Imports
```typescript
import { getCurrentProfile } from "@/lib/profile-api";
import { UserRole, type User } from "@/types/auth";
```

#### Updated User State Type
```typescript
// BEFORE:
const [user, setUser] = useState<{
  name: string;
  email: string;
  role?: string;
} | null>(null);

// AFTER:
const [user, setUser] = useState<User | null>(null);
```

#### Fetch User Profile on Load
```typescript
// Fetch full user profile from backend (includes avatar)
try {
  const userProfile = await getCurrentProfile();
  console.log("Fetched user profile:", userProfile);
  setUser(userProfile);
} catch (profileError) {
  console.error("Failed to fetch profile, using token data:", profileError);
  // Fallback to token data if profile fetch fails
  setUser({
    id: userData.id,
    name: userData.name || userData.email?.split("@")[0] || "Admin User",
    email: userData.email || "admin@hsm.com",
    phone: "",
    roleId: userData.roleId,
    avatar: null,
  });
}
```

#### Added Profile Update Event Listener
```typescript
// Listen for profile update events
const handleProfileUpdate = () => {
  console.log("Profile updated event received, refreshing user data");
  loadUserData();
};

window.addEventListener('profile-updated', handleProfileUpdate);

return () => {
  window.removeEventListener('profile-updated', handleProfileUpdate);
};
```

#### Mapped User Data to Header Props
```typescript
header={{
  user: user ? {
    name: user.name,
    email: user.email,
    avatarUrl: user.avatar || undefined,  // ← Avatar URL
    role: "Administrator",
  } : undefined,
  onProfileClick,
  onLogout,
  showSearch: true,
  searchPlaceholder: "Search admin...",
}}
```

### 2. Profile Page (`app/(pages)/admin/profile/page.tsx`)

#### Emit Event on Profile Update
```typescript
const handleProfileUpdate = (updatedUser: User) => {
  setUser(updatedUser);
  setActiveTab("overview");
  // Emit custom event to notify layout to refresh user data
  window.dispatchEvent(new CustomEvent('profile-updated'));
};
```

## How It Works

### 1. Initial Load
1. User logs in
2. Admin layout mounts
3. Fetches full user profile from `/user/profile` endpoint (includes avatar)
4. Displays avatar in Header user menu

### 2. Profile Update
1. User updates profile (including avatar) on profile page
2. Profile page emits `profile-updated` custom event
3. Admin layout listens for event and re-fetches user data
4. Header updates with new avatar

### 3. Header Display (Already Implemented)
The Header component already had the Avatar set up:
```tsx
<Avatar className="h-7 w-7">
  <AvatarImage src={user.avatarUrl} alt={user.name} />
  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
</Avatar>
```

## User Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        Login                                 │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  JWT Token stored (contains: id, email, roleId, name)      │
│  ❌ Does NOT contain avatar URL                             │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Admin Layout Loads                                         │
│  1. Validates JWT                                           │
│  2. Fetches full profile from /user/profile                │
│  3. Gets avatar URL from backend                           │
│  4. Sets user state with avatar                            │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Header Displays Avatar                                     │
│  • If avatar exists: Show image                            │
│  • If no avatar: Show initials (fallback)                  │
└─────────────────────────────────────────────────────────────┘
```

## Backend API

### GET /user/profile
Returns full user data including avatar:
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "role_id": 3,
    "avatar": "https://res.cloudinary.com/...",  // ← Avatar URL
    "created_at": "2026-02-20T10:00:00.000Z"
  }
}
```

## Benefits

1. **Always Fresh** - Avatar is fetched on each page load from backend
2. **Auto Updates** - When profile is updated, header refreshes automatically
3. **Fallback Handling** - Shows initials if no avatar is set
4. **Error Resilient** - Falls back to token data if profile fetch fails

## Future Enhancements

- Consider caching profile data to reduce API calls
- Add loading skeleton for avatar while fetching
- Implement React Context for global user state management
- Add avatar crop/resize before upload
