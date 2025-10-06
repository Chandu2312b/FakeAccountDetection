import { Router } from 'express';
import { parse } from 'csv-parse/sync';
import Account from '../models/Account.js';

const router = Router();

/*
POST /api/upload/csv
Body:
{
  csv: "accountId,username,follower_count,following_count,posts_count,account_age_days\n..."
}
*/
router.post('/csv', async (req, res) => {
  const { csv } = req.body || {};
  if (!csv || typeof csv !== 'string') {
    return res.status(400).json({ error: 'Provide csv string in body' });
  }
  try {
    const records = parse(csv, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    const bulk = records.map(r => ({
      updateOne: {
        filter: { accountId: r.accountId || r.username },
        update: {
          $set: {
            accountId: r.accountId || r.username,
            username: r.username || r.accountId,
            followerCount: Number(r.follower_count || 0),
            followingCount: Number(r.following_count || 0),
            postsCount: Number(r.posts_count || 0),
            accountAgeDays: Number(r.account_age_days || 0)
          }
        },
        upsert: true
      }
    }));

    if (bulk.length > 0) {
      await Account.bulkWrite(bulk);
    }

    res.json({ insertedOrUpdated: bulk.length });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: 'CSV parse error' });
  }
});

export default router;






