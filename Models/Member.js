import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    imageUrl: { type: String, required: false }, // Cloudinary URL (optional)
    adharNumber: { type: String, required: false }, // optional
    bankAccountNumber: { type: String, required: false }, // optional
  },
  { timestamps: true }
);

export default mongoose.model("Member", memberSchema);
