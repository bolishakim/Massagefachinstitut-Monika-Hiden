# Staff Users Credentials

## System Users Added

All staff users have been successfully created with username-based login support. **Staff can now login using their `firstname.lastname` usernames instead of email addresses.**

### Administrators (ADMIN Role)
| Name | Username/Email | Password | Specialization | Role |
|------|----------------|----------|----------------|------|
| **Dr. Admin Manager** | admin@medicalcenter.com | `Admin123!` | Medical Massage | ADMIN |
| **Monika Hiden** | `monika.hiden` | `password123` | Medical Massage | ADMIN |

### Moderators (MODERATOR Role)
| Name | Username/Email | Password | Specialization | Role |
|------|----------------|----------|----------------|------|
| **Sarah Wilson** | supervisor@medicalcenter.com | `Moderator123` | Physiotherapy | MODERATOR |
| **Hedra Ramandious** | `hedra.ramandious` | `password123` | Physiotherapy | MODERATOR |

### Staff Members (USER Role)
| Name | Username | Password | Specialization | Role |
|------|----------|----------|----------------|------|
| **Emma Johnson** | staff@medicalcenter.com | `User123` | Massage | USER |
| **Stefan Konrad** | `stefan.konrad` | `password123` | Massage | USER |
| **Simon Freisitzer** | `simon.freisitzer` | `password123` | Massage | USER |
| **Barbara Eckerstorfer** | `barbara.eckerstorfer` | `password123` | Massage | USER |
| **Stephan Hiden** | `stephan.hiden` | `password123` | Massage | USER |
| **Katharina Marchold** | `katharina.marchold` | `password123` | Massage | USER |
| **Flavius Null** | `flavius.null` | `password123` | Massage | USER |

## User Statistics

- **Total Users:** 11
- **Administrators:** 2 (full system access)
- **Moderators:** 2 (staff supervision, scheduling)
- **Regular Staff:** 7 (basic access, own profile management)

## Specializations Distribution

- **Massage:** 7 users
- **Medical Massage:** 2 users  
- **Physiotherapy:** 2 users

## Login Instructions

### For Real Staff (Username Login)
1. Navigate to the application login page
2. **Login with username**: Use `firstname.lastname` format (e.g., `stefan.konrad`)
3. **Password**: `password123` for all real staff
4. Access level determined by role:
   - **ADMIN**: Monika Hiden - Full system access, user management, settings
   - **MODERATOR**: Hedra Ramandious - Staff management, scheduling, reports  
   - **USER**: All masseurs - Basic functionality, own profile, patient care

### For System Users (Email Login)
1. Navigate to the application login page
2. **Login with email**: Use full email address
3. **Password**: As specified in table above
4. These are the original system admin/test accounts

## Security Notes

- All users have `emailVerified: true` and `isActive: true`
- Passwords are securely hashed using bcrypt
- MFA is disabled for all new users (can be enabled individually)
- Session management is handled via JWT tokens

## Authentication System Updates

### New Features Added
- ✅ **Username Support**: Added `username` field to User model
- ✅ **Flexible Login**: Users can login with either email OR username
- ✅ **Validation Updated**: Login route accepts both email and username formats
- ✅ **Database Migration**: Successfully applied schema changes

### Login API Changes
```json
// Both formats now work:

// Email login (original)
{
  "email": "admin@medicalcenter.com",
  "password": "Admin123!"
}

// Username login (new)
{
  "username": "stefan.konrad", 
  "password": "password123"
}
```

## Testing Verified

✅ All users can successfully log in with usernames
✅ Email login still works for existing accounts
✅ Role-based access control is functional  
✅ Specializations are correctly assigned
✅ Password authentication works correctly
✅ Login validation handles both email and username formats

## Quick Reference - Real Staff Usernames

| Staff Member | Username | Role | Specialization |
|--------------|----------|------|----------------|
| Stefan Konrad | `stefan.konrad` | USER | Massage |
| Simon Freisitzer | `simon.freisitzer` | USER | Massage |
| Monika Hiden | `monika.hiden` | ADMIN | Medical Massage |
| Barbara Eckerstorfer | `barbara.eckerstorfer` | USER | Massage |
| Stephan Hiden | `stephan.hiden` | USER | Massage |
| Hedra Ramandious | `hedra.ramandious` | MODERATOR | Physiotherapy |
| Katharina Marchold | `katharina.marchold` | USER | Massage |
| Flavius Null | `flavius.null` | USER | Massage |

**All passwords:** `password123`

---

*Document generated: 2025-08-18*
*Last updated: Username-based authentication implemented*