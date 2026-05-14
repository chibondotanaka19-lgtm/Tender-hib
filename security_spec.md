# Security Specification - TenderHub

## Data Invariants
1. A **Tender** must have a unique ID, a title, an organizationId (issuer), and a status.
2. A **Bid** must belong to a valid Tender and have a valid userId (consumer).
3. A **Message** must belong to a valid Bid.
4. **Notifications** are private to the recipient.
5. Users cannot change their **Role** after account creation.
6. Only the **Organization** that issued a tender can award it.

## The "Dirty Dozen" Payloads (Denial Expected)
1. **Identity Spoofing**: Attempt to create a tender with `organizationId` of another user.
2. **Privilege Escalation**: Attempt to update `users/{uid}` with `role: 'organization'` when it was `consumer`.
3. **State Shortcutting**: Attempt to update a bid status directly to `accepted` as a consumer.
4. **Orphaned Writes**: Attempt to create a bid for a non-existent tender.
5. **Ghost Fields**: Attempt to add `isVerified: true` to a tender document.
6. **Negative Budget**: Attempt to create a tender with a negative budget.
7. **Size Exhaustion**: Attempt to send a 1MB string as a tender title.
8. **Malicious ID**: Attempt to create a tender with ID `../forbidden/doc`.
9. **Unauthorized List**: Attempt to list all `bids` as a random user without filters.
10. **Timestamp Fraud**: Attempt to set `createdAt` to a future date instead of `serverTimestamp()`.
11. **PII Leak**: Attempt to read another user's private info (email) without being part of a shared transaction.
12. **Status Lock Bypass**: Attempt to update a tender's details after it has been `awarded`.

## Test Scenarios (Drafting for Rules)
- `tenders` list: PASS for all.
- `tenders` create: PASS only for `role == 'organization'`.
- `bids` create: PASS only for `role == 'consumer'`.
- `bids` status update: PASS only for Tender Owner.
- `messages` create: PASS only for Bidder or Tender Owner.
