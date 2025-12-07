# Notifications System Documentation

## Overview

The ReelTalk notifications system provides real-time notifications for user interactions including follows, likes, comments, challenges, and payments. The system is built on Firebase Firestore with real-time subscriptions.

## Architecture

### Core Components

1. **Notification Service** (`src/services/notification-service.ts`)
   - Central service for managing notifications
   - Handles CRUD operations and real-time subscriptions
   - Uses Firebase Firestore for data persistence

2. **Notification Bell Component** (`src/components/NotificationBell.tsx`)
   - Displays unread notification count in the header
   - Shows dropdown with quick access to notifications
   - Real-time updates via subscription

3. **Notifications Page** (`src/app/notifications/page.tsx`)
   - Full notifications interface
   - Mark as read/unread functionality
   - Delete notifications
   - Filter by type with color coding

4. **Webhook Handler** (`src/app/api/stripe/webhook/route.ts`)
   - Handles Stripe payment events
   - Creates notifications for payment-related events

## Notification Types

### 1. Follow Notifications
- **Triggered**: When a user follows a creator
- **Recipient**: The creator being followed
- **Data**: Follower's name and profile link
- **Service**: `follow-service.ts`

```typescript
await followCreator(userId, creatorId, userName);
```

### 2. Like Notifications
- **Triggered**: When a user likes a video
- **Recipient**: The video creator
- **Data**: Liker's name and video title
- **Service**: `video-service.ts`

```typescript
await likeVideo(videoId, userId, userName);
```

### 3. Comment Notifications
- **Triggered**: When a user comments on a video or livestream
- **Recipient**: The video/livestream creator
- **Data**: Commenter's name and content location
- **Services**: `comment-service.ts`

```typescript
// Video comments
await postVideoComment(videoId, userId, userName, userPhoto, content, creatorId);

// Livestream comments
await postLivestreamComment(livestreamId, userId, userName, userPhoto, content, creatorId);
```

### 4. Challenge Notifications
- **Triggered**: 
  - When a user submits a challenge entry
  - When a submission is approved/rejected
- **Recipient**: 
  - Challenge creator (for submissions)
  - Submission creator (for approval/rejection)
- **Service**: `challenge-service.ts`

```typescript
// Submission notification (sent to creator)
await submitChallengeEntry(challengeId, userId, userName, userPhoto, submissionUrl, description);

// Approval notification (sent to submitter)
await approveSubmission(challengeId, submissionId);
```

### 5. Payment Notifications
- **Triggered**: When a payment is completed
- **Recipient**: 
  - User (for subscription confirmation)
  - Creator (for new subscriber)
- **Service**: Stripe webhook handler

**Events:**
- Premium plan purchase
- Creator subscription purchase
- Subscription cancellation

## Database Schema

### Notification Document Structure

```typescript
{
  id: string;                    // Unique notification ID
  userId: string;                // Recipient user ID
  type: 'follow' | 'like' | 'comment' | 'challenge' | 'payment';
  title: string;                 // Notification title
  message: string;               // Notification message
  link?: string;                 // Link to related content
  read: boolean;                 // Read status
  createdAt: Timestamp;          // Creation timestamp
}
```

### Firestore Path
```
users/{userId}/notifications/{notificationId}
```

## API Reference

### Notification Service Functions

#### Create Notification
```typescript
createNotification(
  userId: string,
  type: 'follow' | 'like' | 'comment' | 'challenge' | 'payment',
  title: string,
  message: string,
  link?: string
): Promise<string>
```

#### Get User Notifications
```typescript
getUserNotifications(userId: string): Promise<Notification[]>
```

#### Get Unread Count
```typescript
getUnreadNotificationsCount(userId: string): Promise<number>
```

#### Mark as Read
```typescript
markNotificationAsRead(userId: string, notificationId: string): Promise<void>
markAllNotificationsAsRead(userId: string): Promise<void>
```

#### Delete Notification
```typescript
deleteNotification(userId: string, notificationId: string): Promise<void>
```

#### Real-time Subscriptions
```typescript
// Subscribe to notifications
subscribeToNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void
): () => void

// Subscribe to unread count
subscribeToUnreadCount(
  userId: string,
  callback: (count: number) => void
): () => void
```

## Integration Guide

### Adding Notifications to Existing Features

1. **Import the service**
```typescript
import { createNotification } from '@/services/notification-service';
```

2. **Call after action completes**
```typescript
// After user action (follow, like, comment, etc.)
await createNotification(
  recipientUserId,
  'follow',
  'New Follower',
  `${userName} started following you`,
  `/profile/${userId}`
);
```

3. **Pass required parameters**
- For follows: Include `userName` parameter
- For likes: Include `userId` and `userName` parameters
- For comments: Include `creatorId` parameter
- For challenges: Automatic via service
- For payments: Handled by webhook

## UI Components

### Notification Bell (Header)
- Location: `src/components/NotificationBell.tsx`
- Features:
  - Real-time unread count badge
  - Dropdown preview
  - Quick access to notifications page

### Notifications Page
- Location: `src/app/notifications/page.tsx`
- Features:
  - Full notification list
  - Color-coded by type
  - Mark as read/delete actions
  - Links to related content
  - Responsive design

## Styling

Notifications use color coding for quick identification:

- **Follow** (Blue): `bg-blue-50 border-blue-200`
- **Like** (Red): `bg-red-50 border-red-200`
- **Comment** (Green): `bg-green-50 border-green-200`
- **Challenge** (Yellow): `bg-yellow-50 border-yellow-200`
- **Payment** (Purple): `bg-purple-50 border-purple-200`

## Best Practices

1. **Always include context**: Provide meaningful titles and messages
2. **Include links**: Add navigation links to related content when possible
3. **Avoid duplicates**: Check if similar notifications already exist
4. **Handle errors gracefully**: Wrap notification creation in try-catch
5. **Test notifications**: Verify notifications appear in real-time
6. **Clean up subscriptions**: Always unsubscribe from listeners

## Testing

### Manual Testing Checklist

- [ ] Follow a creator → Notification appears for creator
- [ ] Like a video → Notification appears for video creator
- [ ] Comment on video → Notification appears for video creator
- [ ] Comment on livestream → Notification appears for stream creator
- [ ] Submit challenge → Notification appears for challenge creator
- [ ] Approve challenge → Notification appears for submitter
- [ ] Purchase premium → Notification appears for user
- [ ] Subscribe to creator → Notifications appear for both users
- [ ] Mark notification as read → Status updates
- [ ] Delete notification → Notification removed
- [ ] Unread count updates → Badge shows correct count

## Performance Considerations

1. **Limit queries**: Notifications are limited to 50 most recent
2. **Real-time subscriptions**: Use unsubscribe callbacks to prevent memory leaks
3. **Batch operations**: Mark all as read uses batch updates
4. **Indexing**: Ensure Firestore indexes are created for queries

## Notification Settings

Users can customize their notification preferences through the Notification Settings page.

### Accessing Settings
- Navigate to **Settings** → **Notifications**
- Or go directly to `/settings/notifications`

### Available Settings
- **Follow Notifications**: Get notified when someone follows you
- **Like Notifications**: Get notified when someone likes your video
- **Comment Notifications**: Get notified when someone comments on your video
- **Challenge Notifications**: Get notified about challenge submissions and approvals
- **Payment Notifications**: Get notified about subscriptions and purchases
- **Email Notifications**: Receive important notifications via email (coming soon)

### How Settings Work
- Settings are stored per user in the `notificationSettings` collection
- When a notification is about to be created, the system checks the user's settings
- If a notification type is disabled, the notification will not be created
- Default settings have all notification types enabled

## Future Enhancements

- [ ] Email notifications for important events
- [ ] Push notifications (Web Push API)
- [ ] Notification grouping (e.g., "5 people liked your video")
- [ ] Notification history/archive
- [ ] Notification scheduling
- [ ] Analytics on notification engagement
- [ ] Notification digest/summary emails

## Troubleshooting

### Notifications not appearing
1. Check Firestore security rules allow writes to notifications collection
2. Verify `creatorId` or recipient `userId` is correct
3. Check browser console for errors
4. Ensure user is authenticated

### Unread count not updating
1. Verify real-time subscription is active
2. Check Firestore listener is properly initialized
3. Ensure `read` field is being updated correctly

### Webhook notifications not working
1. Verify Stripe webhook secret is set in environment
2. Check webhook handler logs
3. Ensure metadata includes `userId` and `creatorId`
4. Verify Firestore admin SDK is initialized

## Security

- Notifications are stored in user's subcollection
- Firestore rules should restrict access to user's own notifications
- Webhook signature verification prevents unauthorized events
- Admin SDK used for webhook operations to bypass client-side rules
