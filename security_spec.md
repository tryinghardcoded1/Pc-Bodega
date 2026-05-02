# Security Specification - PC Bodega

## 1. Data Invariants
- **Orders**:
  - Must belong to a valid user or have a valid tracking number for guest lookup.
  - Tracking numbers must be immutable once set.
  - Status transitions should ideally be restricted (but currently we allow admin to set any).
- **Chats**:
  - A chat thread must be between a specific `userId` and the administrative team.
  - Only the owner (userId) or an admin can read/write the thread metadata.
- **Messages**:
  - Must be part of an existing thread.
  - The `senderId` must match the authenticated user.
  - Users can only read messages in threads they belong to.

## 2. The "Dirty Dozen" Payloads (Red Team Test Cases)

1. **Privilege Escalation (Admin Spoof)**: Attempt to write to `/admins/{anyId}` as a non-admin.
2. **Identity Spoofing (Order Owner)**: Create an order with a `userId` that is not mine.
3. **Ghost Fields (Shadow Update)**: Update an order with an extra `isVerified: true` field.
4. **ID Poisoning**: Create an order with a 2KB document ID.
5. **PII Leak**: A user attempts to read another user's profile in `/users/{otherId}`.
6. **Orphaned Writes**: Create a message in a non-existent chat thread.
7. **Negative Total**: Create an order with a `total` of -100.
8. **Malicious Image**: Send a 5MB base64 string in `imageUrl`.
9. **Status Hijack**: A user attempts to update their order status to `delivered`.
10. **Timestamp Fraud**: Create an order with a `createdAt` value from the future (client-provided).
11. **Email Spoofing**: Login with an email matching an admin but with `email_verified: false` (if we used email as the primary check, but we check against a hardcoded list).
12. **Blanket Read Attack**: Attempt to `list` all orders without a `userId` filter.

## 3. Test Runner Concept (firestore.rules.test.ts)
The tests will use the `@firebase/rules-unit-testing` framework to verify that the payloads above are rejected.
