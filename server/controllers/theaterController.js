const Theater = require('../models/Theater');
const Show = require('../models/Show');

exports.getTheaters = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const { search, city, sortBy = 'createdAt' } = req.query;

    const amenities = req.query.amenities
      ? Array.isArray(req.query.amenities)
        ? req.query.amenities
        : [req.query.amenities]
      : [];

    const match = { isActive: true };

    if (search) {
      match.name = { $regex: search, $options: 'i' };
    }

    if (city) {
      match['location.city'] = city;
    }

    if (amenities.length > 0) {
      match.amenities = { $all: amenities };
    }

    let sort = { createdAt: -1 };
    if (sortBy === 'name') sort = { name: 1 };
    if (sortBy === 'name_desc') sort = { name: -1 };

    // 🔥 AGGREGATION START
    const theaters = await Theater.aggregate([
      { $match: match },

      {
        $lookup: {
          from: 'shows',               // Show collection name
          localField: '_id',
          foreignField: 'theater',
          as: 'shows'
        }
      },

      {
        $addFields: {
          showCount: {
            $size: {
              $filter: {
                input: '$shows',
                as: 'show',
cond: { $gte: ['$$show.date', new Date()] }

              }
            }
          }
        }
      },

      { $project: { shows: 0 } }, // optional (remove heavy data)

      { $sort: sort },
      { $skip: skip },
      { $limit: limit }
    ]);

    const total = await Theater.countDocuments(match);

    res.json({
      success: true,
      theaters,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch theaters'
    });
  }
};
