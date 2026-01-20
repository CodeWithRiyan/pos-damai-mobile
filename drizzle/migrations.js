// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_mysterious_ben_grimm.sql';
import m0001 from './0001_windy_venom.sql';
import m0002 from './0002_odd_the_stranger.sql';
import m0003 from './0003_massive_kate_bishop.sql';
import m0004 from './0004_add_status_to_purchase.sql';
import m0005 from './0005_add_status_to_inventory_transactions.sql';
import m0006 from './0006_add_purchase_returns.sql';

export default {
  journal,
  migrations: {
    m0000,
    m0001,
    m0002,
    m0003,
    m0004,
    m0005,
    m0006
  }
}