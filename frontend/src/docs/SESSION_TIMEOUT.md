# Session Timeout Implementation

This document describes the session timeout feature implemented to automatically log out inactive users.

## Overview

The session timeout system tracks user activity and automatically logs users out after a period of inactivity. It provides warnings before logout and allows users to extend their session.

## Components

### 1. `useSessionTimeout` Hook
- **Location**: `/src/hooks/useSessionTimeout.tsx`
- **Purpose**: Tracks user activity and manages session timeout logic
- **Features**:
  - Monitors mouse, keyboard, touch, and scroll events
  - Configurable timeout and warning durations  
  - Automatic logout on inactivity
  - Real-time countdown display

### 2. `SessionTimeoutDialog` Component
- **Location**: `/src/components/auth/SessionTimeoutDialog.tsx`
- **Purpose**: Shows warning dialog before session expires
- **Features**:
  - Real-time countdown timer
  - "Extend Session" and "Logout" buttons
  - German language interface
  - Animated modal with backdrop

### 3. `SessionTimeoutProvider` Component
- **Location**: `/src/components/auth/SessionTimeoutProvider.tsx`
- **Purpose**: Integrates session timeout with the application
- **Features**:
  - Wraps application with timeout functionality
  - Only active for authenticated users
  - Handles logout on timeout

## Configuration

### Default Settings
```typescript
{
  timeoutDuration: 15 * 60 * 1000,  // 15 minutes (900,000ms)
  warningDuration: 2 * 60 * 1000,   // 2 minutes warning (120,000ms)
  checkInterval: 1000,              // Check every second
}
```

### Customization
You can customize timeout settings in `App.tsx`:

```typescript
<SessionTimeoutProvider
  timeoutDuration={30 * 60 * 1000} // 30 minutes
  warningDuration={5 * 60 * 1000}  // 5 minutes warning
>
  {/* App content */}
</SessionTimeoutProvider>
```

## Activity Tracking

### Monitored Events
The system tracks these user activities:
- `mousedown` - Mouse clicks
- `mousemove` - Mouse movement  
- `keypress` - Key presses
- `keydown` - Key down events
- `scroll` - Page scrolling
- `touchstart` - Touch interactions
- `click` - Click events

### Behavior
- **Active Usage**: Any tracked event resets the timeout timer
- **Navigation**: Changing pages/routes counts as activity
- **API Calls**: Making requests counts as activity (through mouse/keyboard events)
- **Background**: No activity tracking when browser tab is hidden

## User Experience

### Normal Flow
1. User logs in → Session timeout starts
2. User interacts → Timer resets to 15 minutes
3. User continues → Timer keeps resetting

### Timeout Warning
1. 13 minutes pass without activity
2. Warning dialog appears with 2-minute countdown
3. User can:
   - Click "Verlängern" (Extend) → Session resets to 15 minutes
   - Click "Abmelden" (Logout) → Immediate logout
   - Do nothing → Automatic logout when timer reaches 0

### Automatic Logout
1. Session expires (15 minutes of inactivity)
2. User is logged out automatically
3. Redirected to login page
4. All auth tokens cleared

## Technical Details

### Session Storage
- Uses localStorage for activity timestamps
- No server-side session storage required
- Works across browser tabs/windows

### Integration with Auth System
- Integrates with existing `useAuth` hook
- Uses existing logout mechanism
- Respects authentication state

### Performance
- Minimal overhead (1-second interval checks)
- Event listeners use passive mode where possible
- Automatic cleanup on component unmount

## Security Considerations

### Benefits
- Prevents unauthorized access to abandoned sessions
- Complies with security best practices
- Configurable timeout periods for different security levels

### Limitations
- Client-side only (can be bypassed by modifying code)
- Relies on JavaScript being enabled
- Does not prevent server-side session hijacking

## Troubleshooting

### Session Not Timing Out
- Check if user is authenticated
- Verify events are being tracked (check console logs)
- Ensure SessionTimeoutProvider wraps authenticated routes

### Warning Not Showing
- Check if warning duration is less than timeout duration
- Verify dialog component is rendered correctly
- Check z-index and CSS positioning

### Immediate Logout
- Check if timeout duration is too short
- Verify activity events are being registered
- Check for JavaScript errors in console

## Future Enhancements

### Possible Improvements
1. **Server-side validation**: Validate session timeout on server
2. **Multi-tab synchronization**: Share timeout across browser tabs
3. **Idle detection**: More sophisticated idle detection (mouse stillness)
4. **Role-based timeouts**: Different timeout periods for different user roles
5. **Activity analytics**: Track and analyze user activity patterns

### Implementation Examples
```typescript
// Role-based timeout
const getTimeoutForRole = (role: string) => {
  switch (role) {
    case 'ADMIN': return 30 * 60 * 1000; // 30 minutes
    case 'USER': return 15 * 60 * 1000;  // 15 minutes
    default: return 10 * 60 * 1000;      // 10 minutes
  }
};

// Multi-tab sync (using localStorage events)
window.addEventListener('storage', (e) => {
  if (e.key === 'lastActivity') {
    updateActivityFromOtherTab(e.newValue);
  }
});
```

## Testing

### Manual Testing
1. Login to the application
2. Wait 13 minutes without interaction
3. Verify warning dialog appears
4. Test "Extend" button functionality
5. Test automatic logout after 15 minutes

### Automated Testing
```typescript
// Example test cases
describe('Session Timeout', () => {
  test('should show warning after configured period', () => {
    // Test implementation
  });
  
  test('should reset timer on user activity', () => {
    // Test implementation  
  });
  
  test('should logout after timeout expires', () => {
    // Test implementation
  });
});
```