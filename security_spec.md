# CookBook Firestore Security Specification

## 1. Data Invariants
1. **Strict Ownership**: Every document under `/users/{userId}` and its subcollections (`mealPlans`, `groceryItems`, `nutriScans`) belongs exclusively to `userId`. No cross-user reads, lists, creates, updates, or deletes are permitted.
2. **Email Verification Gate**: All authenticated reads and writes require `request.auth != null && request.auth.token.email_verified == true`.
3. **Immutable Ownership & Timestamps**: `ownerId` and `createdAt` are immutable once created. `createdAt` and `updatedAt` must equal `request.time` on creation, and `updatedAt` must equal `request.time` on update.
4. **No Client-Trusted Pricing**: `groceryItems` only stores `itemKey`, `name`, `amount`, `unit`, `checked`, and `isCustom`. Price fields are strictly forbidden in Firestore writes and always computed server-side.
5. **Bounded Payloads**: Every string, array, and document ID is strictly type-checked and size-bounded to prevent resource exhaustion and shadow-field injection.

## 2. The "Dirty Dozen" Attack Payloads (Expected: `PERMISSION_DENIED`)
1. **Unauthenticated Read**: `get(/users/alice)` with `auth = null`.
2. **Cross-User Read**: `get(/users/alice/mealPlans/Monday)` as `bob` (`uid: bob`).
3. **Unverified Email Write**: `set(/users/alice)` with `auth = { uid: 'alice', token: { email_verified: false } }`.
4. **Identity Spoofing on Create**: `set(/users/bob/mealPlans/Monday)` as `alice` (`uid: alice`) with `ownerId: 'alice'`.
5. **Shadow Field Injection on Create**: `set(/users/alice)` with `{ ownerId: 'alice', currency: 'USD', hiddenRecipeIds: [], isAdmin: true, createdAt: request.time, updatedAt: request.time }`.
6. **Client-Trusted Price Injection**: `set(/users/alice/groceryItems/milk)` with `{ ..., price: 0.01 }`.
7. **Immutable Field Mutation**: `update(/users/alice/mealPlans/Monday)` attempting to change `ownerId` or `createdAt`.
8. **Spoofed Timestamp**: `set(/users/alice/nutriScans/apple)` with `createdAt: Timestamp(2020-01-01)`.
9. **Path ID Poisoning**: `set(/users/alice/groceryItems/bad$id!with/spaces)` (fails `isValidId()`).
10. **Invalid Enum Value**: `set(/users/alice/mealPlans/Funday)` (fails `day in ['Monday'..'Sunday']`).
11. **Oversized String / Resource Exhaustion**: `set(/users/alice/nutriScans/test)` with 5,000-char `mealName`.
12. **Out-of-Range Health Score**: `set(/users/alice/nutriScans/test)` with `healthScore: 999`.
