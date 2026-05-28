# Firestore Setup & Configuration

## 🔧 Firestore Security Rules

Add these rules to your Firestore `firestore.rules` file to restrict attendance access:

```javascript
// Attendance collection rules
match /attendance/{document=**} {
  // Anyone authenticated can read
  allow read: if request.auth.uid != null;
  
  // Write restrictions:
  // - Admins can do anything
  // - Employees can only modify their own records
  allow write: if request.auth.uid != null && 
                  (hasAnyRole(['super_admin', 'hr_admin']) ||
                   request.auth.token.employee_id == resource.data.employeeId ||
                   request.auth.token.employee_id == request.resource.data.employeeId);
}

// Helper function to check roles
function hasAnyRole(roles) {
  return request.auth.token.role in roles;
}
```

**Or simpler version** (if not using custom claims):

```javascript
match /attendance/{document=**} {
  allow read: if request.auth.uid != null;
  allow write: if request.auth.uid != null;
}
```

---

## 📊 Firestore Indexes

Firestore will automatically prompt you to create these indexes when you first run certain queries. You can also create them manually in the Firebase Console.

### Index 1: Employee + Date Descending
**Collection**: `attendance`  
**Fields**:
- `employeeId` (Ascending)
- `date` (Descending)

**Used for**: Getting employee's latest records first

### Index 2: Employee + Date Ascending
**Collection**: `attendance`  
**Fields**:
- `employeeId` (Ascending)  
- `date` (Ascending)

**Used for**: Getting employee's oldest records first (historical queries)

### Index 3: Date + Status
**Collection**: `attendance`  
**Fields**:
- `date` (Ascending)
- `status` (Ascending)

**Used for**: Getting records by date and status (admin queries)

---

## 🚀 Manual Index Creation

### Via Firebase Console

1. Go to **Firebase Console** → Your Project
2. Select **Firestore Database**
3. Go to **Indexes** tab
4. Click **Create Index**
5. Fill in:
   - **Collection ID**: `attendance`
   - **Fields**: As listed above
   - **Query scope**: Collection (not collection-group)
6. Click **Create**
7. Wait for index to build (usually 1-2 minutes)

### Via Firestore CLI

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login
firebase login

# Deploy indexes
firebase deploy --only firestore:indexes
```

Create a `firestore.indexes.json` file:

```json
{
  "indexes": [
    {
      "collectionGroup": "attendance",
      "queryScope": "Collection",
      "fields": [
        {
          "fieldPath": "employeeId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "date",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "attendance",
      "queryScope": "Collection",
      "fields": [
        {
          "fieldPath": "employeeId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "date",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "attendance",
      "queryScope": "Collection",
      "fields": [
        {
          "fieldPath": "date",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "status",
          "order": "ASCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
```

---

## 🔑 Firebase Custom Claims (Optional)

To use the advanced security rules, set custom claims when creating users:

```javascript
// In your backend or Firebase Admin SDK
const admin = require('firebase-admin');

admin.auth().setCustomUserClaims(uid, {
  role: 'employee', // or 'hr_admin', 'super_admin'
  employee_id: 'emp123'
}).then(() => {
  console.log('Custom claims set');
});
```

Or in your frontend auth service:

```typescript
// After user creation in authService.ts
import { doc, setDoc } from 'firebase/firestore';

export const createUserProfile = async (uid: string, userData: any) => {
  const userDoc = doc(db, 'users', uid);
  await setDoc(userDoc, {
    ...userData,
    role: 'employee', // default role
    createdAt: serverTimestamp(),
  });
};
```

---

## 📋 Pre-deployment Checklist

### Firestore Setup
- [ ] Firestore Database created in Firebase Console
- [ ] Collection rules updated (or basic rules set)
- [ ] Indexes created (or verified to auto-create)
- [ ] Test data cleared (optional)

### Frontend Setup
- [ ] `firebase.ts` initialized with correct credentials
- [ ] `attendanceService.ts` imported correctly
- [ ] Components render without errors
- [ ] Routing works in development

### Testing
- [ ] Check-in creates document in Firestore
- [ ] Check-out updates document with working hours
- [ ] History table displays records
- [ ] Summary cards calculate correctly
- [ ] Admin filters work
- [ ] Mobile responsive design works

### Security
- [ ] Rules restrict access appropriately
- [ ] Only admins can view all records
- [ ] Employees can only see their own records
- [ ] No sensitive data exposed in Firestore

---

## 💾 Backup & Recovery

### Backup Attendance Data

```bash
# Export collection to JSON
firestore-cli export --path ./backups --project your-project-id --collections attendance
```

### Restore Attendance Data

```bash
# Import collection from JSON
firestore-cli import --path ./backups/attendance --project your-project-id
```

---

## 📊 Monitoring & Maintenance

### Check Collection Size

Go to **Firebase Console** → **Firestore Database** → **Manage** tab

Look for `attendance` collection to see:
- Number of documents
- Storage used
- Index size

### Optimize Queries

If queries are slow:
1. Verify indexes are created
2. Check if queries match index fields exactly
3. Reduce date range in queries
4. Add more specific filters

### Read/Write Costs

Estimated costs for 1000 employees:
- **Daily reads**: ~2,000 (check-in + dashboard views)
- **Daily writes**: ~1,000 (check-in + check-out)
- **Monthly cost**: ~$0.50-$2 depending on region

---

## 🆘 Troubleshooting

### Issue: "Composite index required"
**Solution**: Create index as described above or wait for Firestore to auto-prompt

### Issue: "Permission denied" error
**Solution**: Update Firestore rules to allow your queries

### Issue: Records not appearing
**Solution**:
1. Check Firestore console - collection exists?
2. Check browser console for JavaScript errors
3. Verify authentication is working
4. Check if user has correct ID format

### Issue: Slow queries
**Solution**:
1. Check if indexes are created
2. Reduce number of documents queried
3. Add filters to queries
4. Consider pagination

---

## 🔍 Data Validation

### Verify Data Structure

Expected fields in each attendance document:

```javascript
{
  employeeId: String,           // Required
  employeeName: String,         // Required
  date: String,                 // Required (YYYY-MM-DD)
  checkIn: String || null,      // Required (HH:MM:SS format)
  checkOut: String || null,     // Can be null
  status: String,               // One of: Present, Late, Absent, Leave
  workingHours: Number,         // 0 or positive decimal
  lateMark: Boolean,            // true/false
  createdAt: Timestamp,         // Server timestamp
  updatedAt: Timestamp,         // Optional
}
```

### Manual Data Cleanup

If data becomes corrupted, clean via Firestore Console:

1. Go to Firestore Database
2. Find `attendance` collection
3. Select document
4. Edit or delete as needed

---

## 📚 Firestore Best Practices

1. **Batch operations**: Update multiple records together
2. **Transactions**: For consistency when updating related data
3. **Read caching**: Use local caching for frequently accessed data
4. **Pagination**: Don't load all records at once
5. **Indexing**: Create indexes before going to production

---

## 🚀 Production Deployment

### Before Going Live

1. [ ] All indexes created
2. [ ] Security rules locked down
3. [ ] Test with realistic data volume
4. [ ] Verify performance acceptable
5. [ ] Backup procedure documented
6. [ ] Monitoring alerts set up (optional)

### Deploy

```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes

# Or deploy everything
firebase deploy
```

---

## 📞 Firebase Support

- **Official Docs**: https://firebase.google.com/docs/firestore
- **Pricing Calculator**: https://cloud.google.com/products/calculator
- **Firebase Console**: https://console.firebase.google.com
- **Support**: Firebase Console → Help → Support

---

**Last Updated**: May 28, 2026  
**Status**: Ready for Production
