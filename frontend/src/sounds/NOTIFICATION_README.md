# Notification System Documentation

This chat system includes a comprehensive notification system with browser notifications, sound alerts, and real-time updates.

## Features

### 🔔 Browser Notifications
- **New Message Alerts**: Shows native browser notifications when receiving new messages
- **Conversation Updates**: Notifies about conversation status changes
- **Permission Management**: Handles browser notification permissions gracefully

### 🔊 Sound Notifications
- **Audio Alerts**: Plays notification sounds when new messages arrive
- **Custom Sounds**: Supports multiple audio formats (mp3, ogg)
- **Error Handling**: Gracefully handles audio playback errors

### 📱 Real-time Updates
- **Socket.IO Integration**: Instant message delivery
- **Unread Counters**: Live badge updates
- **Online Status**: Real-time user presence indicators

## Implementation

### Audio Files
The system expects notification audio files in:
- `/public/sounds/notification.mp3`
- `/public/sounds/notification.ogg`

If these files don't exist, the system will log errors but continue functioning without sound.

### Notification Flow
1. **Message Received** → Socket.IO event triggered
2. **Permission Check** → Browser notification permission verified
3. **Display Notification** → Native notification shown
4. **Play Sound** → Audio alert played
5. **Update UI** → Unread count incremented

### Configuration
- **Notification Timeout**: 5 seconds auto-close
- **Badge Icon**: `/favicon.ico`
- **Silent Mode**: Can be configured per notification
- **Interaction**: Optional user interaction required

## Usage

### Testing Notifications
```javascript
// Test browser permission
if ('Notification' in window) {
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// Test notification display
new Notification("Test", {
  body: "This is a test notification",
  icon: "/favicon.ico"
});
```

### Code Integration
```javascript
// In ChatContext
const sendNotification = useCallback((message: any) => {
  if (typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "granted") {
      new Notification("New Message", {
        body: `${message.sender.name}: ${message.text}`,
        icon: message.sender.avatar,
      });
    }
  }
}, []);

// Use in message handler
sendNotification(message);
```

## Browser Support

- **Chrome**: Full support
- **Firefox**: Full support  
- **Safari**: Supported (requires user interaction)
- **Mobile**: Supported with limitations

## Accessibility

- **Screen Readers**: Notification text is accessible
- **Keyboard Navigation**: Tab navigation supported
- **Visual Notifications**: High contrast icons and text
- **Sound Options**: Can be disabled via system settings