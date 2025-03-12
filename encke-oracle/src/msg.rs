use cosmwasm_schema::{cw_serde, QueryResponses};
use cosmwasm_std::Uint128;

/// Message to instantiate the mock oracle
#[cw_serde]
pub struct InstantiateMsg {}

/// Messages to execute oracle actions
#[cw_serde]
pub enum ExecuteMsg {
    SetPrice { token: String, price: Uint128 }, // Set price for a token
}

/// Query messages for the oracle
#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    #[returns(PriceResponse)]
    GetPrice { token: String }, // Get price of a token
}

#[cw_serde]
pub struct PriceResponse {
    pub price: Uint128,
}