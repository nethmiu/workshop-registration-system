const mongoose = require('mongoose');

const workshopSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Workshop code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z0-9_-]+$/, 'Workshop code can only contain uppercase letters, numbers, hyphens, and underscores']
    },
    title: {
      type: String,
      required: [true, 'Workshop title is required'],
      trim: true,
      minlength: [3, 'Workshop title must be at least 3 characters long'],
      maxlength: [200, 'Workshop title cannot exceed 200 characters']
    },
    instructor: {
      type: String,
      required: [true, 'Instructor name is required'],
      trim: true,
      minlength: [2, 'Instructor name must be at least 2 characters long'],
      maxlength: [100, 'Instructor name cannot exceed 100 characters']
    },
    dateTime: {
      type: Date,
      required: [true, 'Workshop date and time is required']
    },
    capacity: {
      type: Number,
      required: [true, 'Workshop capacity is required'],
      min: [1, 'Capacity must be at least 1']
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'cancelled'],
        message: '{VALUE} is not a valid status. Allowed values: active, cancelled'
      },
      default: 'active'
    },
    cancelReason: {
      type: String,
      trim: true,
      default: ''
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

const Workshop = mongoose.model('Workshop', workshopSchema);

module.exports = Workshop;
