import Notification from "../models/Notification.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// GET /notifications — Get user's notifications (paginated)
export const getNotifications = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const [notifications, total, unread] = await Promise.all([
    Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments({ user: req.user._id }),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);

  return res.status(200).json(
    new ApiResponse(200, { notifications, total, unread, page, pages: Math.ceil(total / limit) }, "Notifications fetched")
  );
});

// GET /notifications/unread-count — Lightweight count for bell badge
export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ user: req.user._id, isRead: false });
  return res.status(200).json(new ApiResponse(200, { count }, "Unread count"));
});

// PUT /notifications/:id/read — Mark one notification as read
export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { returnDocument: 'after' }
  );
  if (!notification) throw new ApiError(404, "Notification not found");
  return res.status(200).json(new ApiResponse(200, notification, "Marked as read"));
});

// PUT /notifications/read-all — Mark all as read
export const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  return res.status(200).json(new ApiResponse(200, {}, "All notifications marked as read"));
});

// DELETE /notifications/:id — Delete one notification
export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!notification) throw new ApiError(404, "Notification not found");
  return res.status(200).json(new ApiResponse(200, {}, "Notification deleted"));
});

// DELETE /notifications — Clear all notifications
export const clearNotifications = asyncHandler(async (req, res) => {
  await Notification.deleteMany({ user: req.user._id });
  return res.status(200).json(new ApiResponse(200, {}, "All notifications cleared"));
});

// Utility — called internally by other controllers to create a notification
export const createNotification = async ({ userId, type, title, message, link, data }) => {
  try {
    await Notification.create({ user: userId, type, title, message, link, data });
  } catch {
    // Never throw — notification failures should not break the parent flow
  }
};

