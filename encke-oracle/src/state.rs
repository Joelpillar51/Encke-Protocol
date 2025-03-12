use cosmwasm_std::{Addr, Uint128};
use cw_storage_plus::{Item, Map};

/// Storage for token prices
pub const PRICES: Map<&str, Uint128> = Map::new("prices");
pub const ADMIN: Item<Addr> = Item::new("admin");
