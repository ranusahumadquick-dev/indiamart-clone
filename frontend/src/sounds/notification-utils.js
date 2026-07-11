// Mock notification sound for testing
// In production, replace with actual audio files
export const mockNotificationSound = () => {
  console.log("🔔 Notification sound would play here");
  return Promise.resolve();
};

// Test notification display
export const testNotification = () => {
  if (typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
    
    if (Notification.permission === "granted") {
      new Notification("Test Notification", {
        body: "This is a test notification from the chat system",
        icon: "/favicon.ico"
      });
    }
  }
};

// Export notification utility functions
export default {
  mockNotificationSound,
  testNotification
};