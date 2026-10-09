# Firebase setup

The app uses Firebase Authentication for email/password accounts and Cloud
Firestore for private, per-user wallet data. The Firebase web configuration in
`src/lib/firebase.ts` is client-side configuration; Firestore security rules,
not a hidden client key, restrict access to user-owned documents.

Before deploying:

1. In Firebase Console, enable **Authentication → Sign-in method → Email/Password**
   and **Google**. Configure the Google provider and support email when prompted.
2. Create a **Cloud Firestore** database.
3. Publish the rules in [`firestore.rules`](./firestore.rules) in **Firestore →
   Rules**. They allow each authenticated user to access only documents under
   `users/{their-uid}`.
4. Add the Vercel deployment domain to **Authentication → Settings →
   Authorized domains** if it is not already listed.

On the first account initialization, existing browser data seeds the cloud
account; if there is no browser data, existing cloud records are retained.
After initialization, Firestore is the source of truth and changes sync in real
time. The theme remains a device-local preference. The account-initialization
record is retained when data is reset, preventing stale browser data from
another device being imported again afterward.
