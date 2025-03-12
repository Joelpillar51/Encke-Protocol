use cosmwasm_std::{Addr, Uint128};
use cw_storage_plus::{Item, Map};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

/// Configuration for the lending protocol
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Config {
    pub admin: Addr,                    // Address of the contract admin
    pub liquidation_threshold: Uint128, // Threshold for liquidation (e.g., 150 for 1.5x)
    pub mock_oracle: Addr,              // Address of the mock oracle contract
}

/// Represents a token type: native (e.g., "untrn") or CW20
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub enum Token {
    Native(String), // Native token denomination
    Cw20(Addr),     // CW20 token contract address
}

/// A lending position between a borrower and lender
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Position {
    pub borrower: Addr,          // Address of the borrower
    pub lender: Option<Addr>,    // Address of the lender (None if unfilled)
    pub borrow_token: Token,     // Token being borrowed
    pub collateral_token: Token, // Token used as collateral
    pub amount: Uint128,         // Amount borrowed
    pub interest_rate: Uint128,  // Annual interest rate in basis points (e.g., 500 = 5%)
    pub collateral: Uint128,     // Amount of collateral
    pub start_time: u64,         // Timestamp when position was filled
    pub filled: bool,            // Whether the position has been filled by a lender
}

/// A user's deposit in the contract
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Deposit {
    pub token: Token,    // Token deposited
    pub amount: Uint128, // Amount deposited
}

/// Storage items
pub const CONFIG: Item<Config> = Item::new("config"); // Contract configuration
pub const SUPPORTED_TOKENS: Map<&str, bool> = Map::new("supported_tokens"); // Supported tokens map
pub const POSITIONS: Map<u128, Position> = Map::new("positions"); // Positions map
pub const DEPOSITS: Map<(&Addr, &str), Uint128> = Map::new("deposits"); // User deposits map
pub const POSITION_COUNTER: Item<Uint128> = Item::new("position_counter"); // Counter for position IDs
