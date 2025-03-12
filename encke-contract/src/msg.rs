use cosmwasm_schema::{cw_serde, QueryResponses};
use cosmwasm_std::Uint128;

use crate::state::{Config, Deposit, Position, Token};

/// Message to instantiate the contract
#[cw_serde]
pub struct InstantiateMsg {
    pub mock_oracle: String,            // Address of the mock oracle
    pub liquidation_threshold: Uint128, // Liquidation threshold (e.g., 150 for 1.5x)
    pub initial_tokens: Vec<String>,    // Initial list of supported tokens
}

/// Messages to execute contract actions
#[cw_serde]
pub enum ExecuteMsg {
    AddToken {
        token: String,
    }, // Add a supported token (admin only)
    Deposit {
        token: String,
        amount: Uint128,
    }, // Deposit tokens into the contract
    Borrow {
        // Create a borrow position
        borrow_token: String,
        amount: Uint128,
        interest_rate: Uint128,
        collateral_token: String,
        collateral: Uint128,
    },
    Withdraw {
        token: String,
        amount: Uint128,
    }, // Withdraw deposited tokens
    FillPosition {
        position_id: Uint128,
        amount: Uint128,
    }, // Fill a borrow position
    Repay {
        position_id: Uint128,
    }, // Repay a position
    Liquidate {
        position_id: Uint128,
    }, // Liquidate an undercollateralized position
}

/// Query messages with responses
#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    #[returns(TokenConfigsResponse)]
    GetTokenConfigs {}, // Get list of supported tokens
    #[returns(UserInfoResponse)]
    GetUserInfo { address: String }, // Get user deposits and positions
    #[returns(PositionResponse)]
    GetPosition { position_id: Uint128 }, // Get specific position
    #[returns(PositionsResponse)]
    GetAllPositions {
        start_after: Option<Uint128>,
        limit: Option<u32>,
    }, // Get paginated positions
    #[returns(ConfigResponse)]
    GetConfig {}, // Get config
}

/// Response for GetTokenConfigs
#[cw_serde]
pub struct TokenConfigsResponse {
    pub tokens: Vec<TokenConfig>,
}

/// Token configuration
#[cw_serde]
pub struct TokenConfig {
    pub token: Token,
    pub is_supported: bool,
}

/// Response for GetUserInfo
#[cw_serde]
pub struct UserInfoResponse {
    pub user_info: Option<UserInfo>,
}

/// User information including deposits and positions
#[cw_serde]
pub struct UserInfo {
    pub deposits: Vec<Deposit>,
    pub positions: Vec<(Uint128, Position)>,
}

/// Response for GetPosition
#[cw_serde]
pub struct PositionResponse {
    pub position: Position,
}

/// Response for GetAllPositions
#[cw_serde]
pub struct PositionsResponse {
    pub positions: Vec<(u128, Position)>,
}

/// Response for GetConfig
#[cw_serde]
pub struct ConfigResponse {
    pub config: Config,
}
