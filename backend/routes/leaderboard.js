const express = require('express');
const router  = express.Router();
const User    = require('../models/User');

// GET: Real points leaderboard — observations + citizen contributions + streak
router.get('/', async (req, res) => {
  try {
    const pipeline = [
      // Join citizen science contributions
      {
        $lookup: {
          from: 'citizencontributions',
          localField: '_id',
          foreignField: 'userId',
          as: 'citizenData'
        }
      },
      // Join personal observations
      {
        $lookup: {
          from: 'observations',
          localField: '_id',
          foreignField: 'createdBy',
          as: 'observationsData'
        }
      },
      {
        $project: {
          username:              1,
          totalPoints:           1,
          level:                 1,
          updatedAt:             1,
          totalObservations:     { $size: '$observationsData' },
          totalCitizenScience:   { $size: '$citizenData' },
          // Approximate streak: number of distinct observation dates
          observationDays: {
            $size: {
              $setUnion: {
                $map: {
                  input: '$observationsData',
                  as: 'o',
                  in: {
                    $dateToString: { format: '%Y-%m-%d', date: '$$o.observedAt' }
                  }
                }
              }
            }
          }
        }
      },
      { $sort: { totalPoints: -1 } },
      { $limit: 15 }
    ];

    const results = await User.aggregate(pipeline);
    res.json(results);
  } catch (err) {
    console.error('Leaderboard aggregation error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;