// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_mysterious_ben_grimm.sql';
import m0001 from './0001_windy_venom.sql';
import m0002 from './0002_odd_the_stranger.sql';
import m0003 from './0003_massive_kate_bishop.sql';
import m0004 from './0004_add_status_to_purchase.sql';
import m0005 from './0005_add_status_to_inventory_transactions.sql';
import m0006 from './0006_add_purchase_returns.sql';
import m0007 from './0007_add_stock_opnames.sql';
import m0008 from './0008_ordinary_jazinda.sql';
import m0009 from './0009_legal_shockwave.sql';
import m0010 from './0010_finance_local_ref_id.sql';
import m0011 from './0011_add_userid_to_finances.sql';
import m0012 from './0012_lethal_longshot.sql';

  export default {
    journal,
    migrations: {
      m0000,
m0001,
m0002,
m0003,
m0004,
m0005,
m0006,
m0007,
m0008,
m0009,
m0010,
m0011,
m0012
    }
  }
  