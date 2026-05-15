const mongoose = require('mongoose');
const BedHold = require('../models/BedHold');
const { releaseExpiredHolds, cancelHoldByAdmin, confirmHoldByAdmin } = require('../services/holdService');

// GET /api/admin/holds?hospitalId=&status=active
exports.listHolds = async (req, res) => {
  try {
    await releaseExpiredHolds();

    const { hospitalId, status } = req.query;
    const q = {};
    if (hospitalId && mongoose.Types.ObjectId.isValid(hospitalId)) {
      q.hospital = hospitalId;
    }
    if (status && ['active', 'released', 'confirmed'].includes(status)) {
      q.status = status;
    } else {
      q.status = 'active';
    }

    const holds = await BedHold.find(q)
      .sort({ createdAt: -1 })
      .limit(200)
      .populate('hospital', 'name city')
      .lean();

    res.json({ success: true, count: holds.length, data: holds });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/admin/holds/:holdId/cancel
exports.adminCancelHold = async (req, res) => {
  try {
    await releaseExpiredHolds();

    const { holdId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(holdId)) {
      return res.status(400).json({ success: false, message: 'Invalid hold id' });
    }

    const result = await cancelHoldByAdmin(holdId);
    if (!result.ok) {
      return res.status(404).json({ success: false, message: 'No active hold with that id' });
    }
    res.json({ success: true, message: 'Hold cancelled; availability restored' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/admin/holds/:holdId/confirm
exports.adminConfirmHold = async (req, res) => {
  try {
    await releaseExpiredHolds();

    const { holdId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(holdId)) {
      return res.status(400).json({ success: false, message: 'Invalid hold id' });
    }

    const result = await confirmHoldByAdmin(holdId);
    if (!result.ok) {
      return res.status(404).json({ success: false, message: 'No active hold with that id' });
    }
    res.json({ success: true, message: 'Hold confirmed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
