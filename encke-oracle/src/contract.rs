#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;
use cosmwasm_std::{to_json_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult};
use cw2::set_contract_version;
use execute::execute_add_token;
use query::get_price;

use crate::msg::{ExecuteMsg, InstantiateMsg, QueryMsg};
use crate::state::{ADMIN, PRICES};

// version info for migration info
const CONTRACT_NAME: &str = "crates.io:encke-oracle";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    _msg: InstantiateMsg,
) -> StdResult<Response> {
    ADMIN.save(deps.storage, &info.sender.clone())?;
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;
    Ok(Response::new()
        .add_attribute("action", "instantiate")
        .add_attribute("admin", info.sender))
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> StdResult<Response> {
    match msg {
        ExecuteMsg::SetPrice { token, price } => execute_add_token(deps, info, token, price),
    }
}

pub mod execute {
    use cosmwasm_std::{StdError, Uint128};

    use crate::state::PRICES;

    use super::*;

    /// Add a new supported token (admin only)
    pub fn execute_add_token(
        deps: DepsMut,
        info: MessageInfo,
        token: String,
        price: Uint128,
    ) -> StdResult<Response> {
        let admin = ADMIN.load(deps.storage)?;
        if info.sender != admin {
            return Err(StdError::generic_err("Unauthorized"));
        }
        PRICES.save(deps.storage, &token, &price)?;
        Ok(Response::new()
            .add_attribute("action", "set_price")
            .add_attribute("token", token)
            .add_attribute("price", price.to_string()))
    }
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetPrice { token } => {
            to_json_binary(&get_price(deps, &token)?)
        }
    }
}

pub mod query {
    use crate::msg::PriceResponse;

    use super::*;

    pub fn get_price(deps: Deps, token: &str) -> StdResult<PriceResponse> {
        let price = PRICES.load(deps.storage, &token)?;
        Ok(PriceResponse { price })
    }
}

#[cfg(test)]
mod tests {}
