import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
  {
    key:   { type: String, required: true, unique: true, trim: true },
    value: { type: mongoose.Schema.Types.Mixed },
    label: { type: String },
    group: { type: String, default: "general" },
  },
  { timestamps: true }
);

settingSchema.statics.get = async function (key, fallback = null) {
  const doc = await this.findOne({ key });
  return doc ? doc.value : fallback;
};

settingSchema.statics.set = async function (key, value, label, group) {
  return this.findOneAndUpdate(
    { key },
    { value, ...(label && { label }), ...(group && { group }) },
    { upsert: true, new: true }
  );
};

export default mongoose.model("Setting", settingSchema);
