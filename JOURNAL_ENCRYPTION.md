# 🔒 Journal Entry Encryption

## Overview

All journal entries in the Untangle platform are now **fully encrypted at rest** to ensure complete privacy and data protection. This means that even if someone gains access to the database, they cannot read the personal thoughts and content of users' journal entries.

## 🔐 How It Works

### Encryption Process
1. **Input**: User writes journal entry (title and content)
2. **Encryption**: Sensitive data is encrypted using AES-256-GCM before saving
3. **Storage**: Only encrypted data is stored in the database
4. **Decryption**: Data is automatically decrypted when retrieved for display

### Technical Implementation
- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Management**: 32-character encryption key stored in environment variables
- **Fields Encrypted**: 
  - `title` → `encryptedTitle`
  - `content` → `encryptedContent`
- **Automatic**: Encryption/decryption happens transparently

## 📁 Files Modified

### Database Model
- `backend/server/models/Journal.js`
  - Added `encryptedTitle` and `encryptedContent` fields
  - Implemented pre-save encryption hooks
  - Added post-init decryption hooks
  - Created helper methods for encrypted operations

### API Routes
- `backend/server/routes/journal.js`
  - Updated all routes to use encrypted methods
  - Modified GET, POST, PUT operations for encryption
  - Ensured decrypted data is returned to users

### Migration Script
- `backend/scripts/encrypt-journal-entries.js`
  - Encrypts all existing journal entries
  - Verification and testing tools
  - Safe migration process

## 🚀 Usage

### For Users
Journal encryption is **completely transparent**. Users continue to:
- Write journal entries normally
- View their entries as usual
- Edit and delete entries seamlessly

### For Developers

#### Creating Encrypted Entries
```javascript
// Old way (not encrypted)
const entry = {
  title: "My Day",
  content: "Today was amazing..."
};
journal.entries.push(entry);

// New way (encrypted)
await journal.addEncryptedEntry({
  title: "My Day",
  content: "Today was amazing..."
});
```

#### Retrieving Decrypted Entries
```javascript
// Get all entries with decrypted content
const decryptedEntries = journal.getDecryptedEntries();

// Get specific entry with decrypted content
const entry = journal.getDecryptedEntry(entryId);
```

#### Updating Encrypted Entries
```javascript
// Update with automatic encryption
await journal.updateEncryptedEntry(entryId, {
  title: "Updated Title",
  content: "Updated content..."
});
```

## 🔧 Migration Process

### 1. Run Migration Script
```bash
cd backend
node scripts/encrypt-journal-entries.js
```

### 2. Verify Encryption
```bash
# Check if all entries are encrypted
node scripts/encrypt-journal-entries.js --verify-only

# Test decryption functionality
node scripts/encrypt-journal-entries.js --test-only
```

### 3. Migration Output
```
🔒 Starting Journal Encryption Migration...

📚 Found 5 journals
📖 Processing journal for user: 507f1f77bcf86cd799439011
  🔒 Encrypted entry 507f1f77bcf86cd799439012
  🔒 Encrypted entry 507f1f77bcf86cd799439013
  💾 Saved journal for user 507f1f77bcf86cd799439011

📊 Migration Summary:
  Total entries processed: 25
  Entries encrypted: 25
  Entries skipped (already encrypted): 0
  Journals processed: 5

✅ Journal encryption migration completed successfully!
```

## 🛡️ Security Benefits

### Data Protection
- **At Rest**: All journal content is encrypted in the database
- **In Transit**: HTTPS ensures encrypted transmission
- **In Memory**: Decrypted data is only available during processing

### Privacy Compliance
- **GDPR Compliant**: Personal data is properly protected
- **Right to be Forgotten**: Encrypted data can be securely deleted
- **Data Minimization**: Only necessary data is decrypted when needed

### Access Control
- **Database Access**: Even with database access, content is unreadable
- **Backup Security**: Encrypted backups protect data
- **Admin Protection**: Admins cannot read user journal content

## 🔍 Verification

### Check Encryption Status
```javascript
// In database query
db.journals.find({ "entries.encryptedContent": { $exists: true } })

// Should return all journals with encrypted entries
```

### Verify Decryption
```javascript
// Test decryption in application
const journal = await Journal.findById(userId);
const entry = journal.getDecryptedEntry(entryId);
console.log(entry.title); // Should show decrypted title
console.log(entry.content); // Should show decrypted content
```

## ⚠️ Important Notes

### Environment Variables
Ensure these are set in your `.env` file:
```bash
ENCRYPTION_KEY=your-32-character-encryption-key-here
```

### Backup Considerations
- **Encrypted Backups**: Database backups contain encrypted data
- **Key Security**: Encryption key must be securely stored
- **Recovery**: Without the encryption key, data cannot be recovered

### Performance Impact
- **Minimal**: Encryption/decryption is fast with AES-256-GCM
- **Memory**: Decrypted data is only held briefly in memory
- **Storage**: Encrypted data may be slightly larger than plain text

## 🧪 Testing

### Test Encryption
```bash
# Run the migration script with test flag
node scripts/encrypt-journal-entries.js --test-only
```

### Test API Endpoints
```bash
# Create a journal entry
curl -X POST http://localhost:5002/api/journal/entries \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Entry","content":"This is a test"}'

# Retrieve the entry (should be decrypted)
curl -X GET http://localhost:5002/api/journal/entries/ENTRY_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Encryption Key Missing
```
Error: ENCRYPTION_KEY environment variable is required
```
**Solution**: Run `node scripts/setup-security.js` to generate keys

#### 2. Decryption Fails
```
Error: Failed to decrypt data
```
**Solution**: Check if encryption key matches the one used for encryption

#### 3. Migration Fails
```
Error: Error during migration
```
**Solution**: Check database connection and ensure sufficient permissions

### Debug Mode
```bash
# Enable debug logging
DEBUG=encryption node scripts/encrypt-journal-entries.js
```

## 📊 Monitoring

### Log Encryption Events
```javascript
// In your application
console.log('Journal entry encrypted:', entryId);
console.log('Journal entry decrypted:', entryId);
```

### Monitor Performance
- Track encryption/decryption times
- Monitor memory usage during operations
- Check database storage growth

## 🔄 Future Enhancements

### Planned Features
- **Field-level Encryption**: Encrypt additional sensitive fields
- **Key Rotation**: Automatic encryption key rotation
- **Client-side Encryption**: Encrypt data before sending to server
- **Zero-knowledge Architecture**: Server never sees unencrypted data

### Advanced Security
- **Hardware Security Modules**: Use HSM for key management
- **Multi-layer Encryption**: Multiple encryption layers
- **Quantum-resistant Algorithms**: Future-proof encryption

---

**🎉 Journal encryption is now fully implemented! All personal thoughts and journal entries are protected with enterprise-grade encryption, ensuring complete privacy and data security.**

