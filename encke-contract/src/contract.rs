#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;
use cosmwasm_std::{
    to_json_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult, Uint128,
};
use cw2::set_contract_version;
use execute::{
    execute_add_token, execute_borrow, execute_deposit, execute_fill_position, execute_liquidate,
    execute_repay, execute_withdraw,
};
use query::{
    query_all_positions, query_config, query_position, query_token_configs, query_user_info,
};

use crate::error::ContractError;
use crate::msg::{ExecuteMsg, InstantiateMsg, QueryMsg};
use crate::state::{Config, CONFIG, POSITION_COUNTER, SUPPORTED_TOKENS};

// version info for migration info
const CONTRACT_NAME: &str = "crates.io:encke-contract";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> StdResult<Response> {
    // Save configuration
    let config = Config {
        admin: info.sender.clone(),
        mock_oracle: deps.api.addr_validate(&msg.mock_oracle)?,
        liquidation_threshold: msg.liquidation_threshold,
    };

    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;
    CONFIG.save(deps.storage, &config)?;
    POSITION_COUNTER.save(deps.storage, &Uint128::zero())?;

    // Initialize supported tokens
    for token in msg.initial_tokens {
        SUPPORTED_TOKENS.save(deps.storage, &token, &true)?;
    }

    Ok(Response::new()
        .add_attribute("action", "instantiate")
        .add_attribute("admin", info.sender.to_string()))
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(deps: DepsMut, env: Env, info: MessageInfo, msg: ExecuteMsg) -> StdResult<Response> {
    match msg {
        ExecuteMsg::AddToken { token } => execute_add_token(deps, info, token),
        ExecuteMsg::Deposit { token, amount } => execute_deposit(deps, env, info, token, amount),
        ExecuteMsg::Borrow {
            borrow_token,
            amount,
            interest_rate,
            collateral_token,
            collateral,
        } => execute_borrow(
            deps,
            env,
            info,
            borrow_token,
            amount,
            interest_rate,
            collateral_token,
            collateral,
        ),
        ExecuteMsg::Withdraw { token, amount } => execute_withdraw(deps, env, info, token, amount),
        ExecuteMsg::FillPosition {
            position_id,
            amount,
        } => execute_fill_position(deps, env, info, position_id, amount),
        ExecuteMsg::Repay { position_id } => execute_repay(deps, env, info, position_id),
        ExecuteMsg::Liquidate { position_id } => execute_liquidate(deps, env, info, position_id),
    }
}

pub mod execute {
    use cosmwasm_std::{BankMsg, Coin, CosmosMsg, QueryRequest, StdError, WasmMsg, WasmQuery};
    use cw20::Cw20ExecuteMsg;

    use crate::state::{Position, Token, DEPOSITS, POSITIONS};

    use super::*;

    /// Add a new supported token (admin only)
    pub fn execute_add_token(
        deps: DepsMut,
        info: MessageInfo,
        token: String,
    ) -> StdResult<Response> {
        let config = CONFIG.load(deps.storage)?;
        if info.sender != config.admin {
            return Err(StdError::generic_err("Unauthorized"));
        }
        SUPPORTED_TOKENS.save(deps.storage, &token, &true)?;
        Ok(Response::new()
            .add_attribute("action", "add_token")
            .add_attribute("token", token))
    }

    /// Deposit tokens into the contract for lending
    pub fn execute_deposit(
        deps: DepsMut,
        env: Env,
        info: MessageInfo,
        token: String,
        amount: Uint128,
    ) -> StdResult<Response> {
        if !SUPPORTED_TOKENS
            .may_load(deps.storage, &token)?
            .unwrap_or(false)
        {
            return Err(StdError::generic_err("Unsupported token"));
        }

        let token_type = determine_token_type(&deps.as_ref(), &token)?;
        let msg = match token_type {
            Token::Native(denom) => {
                verify_funds(&info.funds, &denom, amount)?;
                BankMsg::Send {
                    to_address: env.contract.address.to_string(),
                    amount: vec![Coin { denom, amount }],
                }
                .into()
            }
            Token::Cw20(addr) => CosmosMsg::Wasm(WasmMsg::Execute {
                contract_addr: addr.to_string(),
                msg: to_json_binary(&Cw20ExecuteMsg::TransferFrom {
                    owner: info.sender.to_string(),
                    recipient: env.contract.address.to_string(),
                    amount,
                })?,
                funds: vec![],
            }),
        };

        // Update deposit balance
        let key = (&info.sender, token.as_str());
        let current = DEPOSITS
            .may_load(deps.storage, key)?
            .unwrap_or(Uint128::zero());
        DEPOSITS.save(deps.storage, key, &(current + amount))?;

        Ok(Response::new()
            .add_message(msg)
            .add_attribute("action", "deposit")
            .add_attribute("user", info.sender.to_string())
            .add_attribute("amount", amount.to_string()))
    }

    /// Create a new borrow position
    pub fn execute_borrow(
        deps: DepsMut,
        env: Env,
        info: MessageInfo,
        borrow_token: String,
        amount: Uint128,
        interest_rate: Uint128,
        collateral_token: String,
        collateral: Uint128,
    ) -> StdResult<Response> {
        if !SUPPORTED_TOKENS
            .may_load(deps.storage, &borrow_token)?
            .unwrap_or(false)
            || !SUPPORTED_TOKENS
                .may_load(deps.storage, &collateral_token)?
                .unwrap_or(false)
        {
            return Err(StdError::generic_err("Unsupported token"));
        }

        let borrow_token_type = determine_token_type(&deps.as_ref(), &borrow_token)?;
        let collateral_token_type = determine_token_type(&deps.as_ref(), &collateral_token)?;

        // Transfer collateral to contract
        let transfer_msg = match collateral_token_type.clone() {
            Token::Native(denom) => {
                verify_funds(&info.funds, &denom, collateral)?;
                BankMsg::Send {
                    to_address: env.contract.address.to_string(),
                    amount: vec![Coin {
                        denom,
                        amount: collateral,
                    }],
                }
                .into()
            }
            Token::Cw20(addr) => CosmosMsg::Wasm(WasmMsg::Execute {
                contract_addr: addr.to_string(),
                msg: to_json_binary(&Cw20ExecuteMsg::TransferFrom {
                    owner: info.sender.to_string(),
                    recipient: env.contract.address.to_string(),
                    amount: collateral,
                })?,
                funds: vec![],
            }),
        };

        // Create and save position
        let position_id = POSITION_COUNTER.load(deps.storage)? + Uint128::one();
        let position = Position {
            borrower: info.sender.clone(),
            lender: None,
            borrow_token: borrow_token_type,
            collateral_token: collateral_token_type,
            amount,
            interest_rate,
            collateral,
            start_time: 0,
            filled: false,
        };
        POSITIONS.save(deps.storage, position_id.u128(), &position)?;
        POSITION_COUNTER.save(deps.storage, &position_id)?;

        Ok(Response::new()
            .add_message(transfer_msg)
            .add_attribute("action", "borrow")
            .add_attribute("position_id", position_id.to_string())
            .add_attribute("borrower", info.sender.to_string()))
    }

    /// Fill an existing borrow position
    pub fn execute_fill_position(
        deps: DepsMut,
        env: Env,
        info: MessageInfo,
        position_id: Uint128,
        amount: Uint128,
    ) -> StdResult<Response> {
        let mut position = POSITIONS.load(deps.storage, position_id.u128())?;
        if position.filled || position.lender.is_some() {
            return Err(StdError::generic_err("Position already filled"));
        }
        if position.amount != amount {
            return Err(StdError::generic_err("Amount mismatch"));
        }

        // Transfer borrowed amount to borrower
        let transfer_msg = match &position.borrow_token {
            Token::Native(denom) => {
                verify_funds(&info.funds, denom, amount)?;
                BankMsg::Send {
                    to_address: position.borrower.to_string(),
                    amount: vec![Coin {
                        denom: denom.clone(),
                        amount,
                    }],
                }
                .into()
            }
            Token::Cw20(addr) => CosmosMsg::Wasm(WasmMsg::Execute {
                contract_addr: addr.to_string(),
                msg: to_json_binary(&Cw20ExecuteMsg::TransferFrom {
                    owner: info.sender.to_string(),
                    recipient: position.borrower.to_string(),
                    amount,
                })?,
                funds: vec![],
            }),
        };

        // Update position
        position.lender = Some(info.sender.clone());
        position.filled = true;
        position.start_time = env.block.time.seconds();
        POSITIONS.save(deps.storage, position_id.u128(), &position)?;

        Ok(Response::new()
            .add_message(transfer_msg)
            .add_attribute("action", "fill_position")
            .add_attribute("lender", info.sender.to_string()))
    }

    /// Repay a filled position
    pub fn execute_repay(
        deps: DepsMut,
        env: Env,
        info: MessageInfo,
        position_id: Uint128,
    ) -> StdResult<Response> {
        let position = POSITIONS.load(deps.storage, position_id.u128())?;
        if position.borrower != info.sender {
            return Err(StdError::generic_err("Not borrower"));
        }
        if !position.filled {
            return Err(StdError::generic_err("Position not filled"));
        }

        let time_elapsed = env.block.time.seconds() - position.start_time;
        let interest = position.amount * position.interest_rate * Uint128::from(time_elapsed)
            / Uint128::from(31_536_000u64 * 100u64);
        let total_repayment = position.amount + interest;

        // Transfer repayment to lender
        let repay_msg = match &position.borrow_token {
            Token::Native(denom) => {
                verify_funds(&info.funds, denom, total_repayment)?;
                BankMsg::Send {
                    to_address: position.lender.clone().unwrap().to_string(),
                    amount: vec![Coin {
                        denom: denom.clone(),
                        amount: total_repayment,
                    }],
                }
                .into()
            }
            Token::Cw20(addr) => CosmosMsg::Wasm(WasmMsg::Execute {
                contract_addr: addr.to_string(),
                msg: to_json_binary(&Cw20ExecuteMsg::TransferFrom {
                    owner: info.sender.to_string(),
                    recipient: position.lender.clone().unwrap().to_string(),
                    amount: total_repayment,
                })?,
                funds: vec![],
            }),
        };

        // Return collateral to borrower
        let collateral_msg = match &position.collateral_token {
            Token::Native(denom) => BankMsg::Send {
                to_address: info.sender.to_string(),
                amount: vec![Coin {
                    denom: denom.clone(),
                    amount: position.collateral,
                }],
            }
            .into(),
            Token::Cw20(addr) => CosmosMsg::Wasm(WasmMsg::Execute {
                contract_addr: addr.to_string(),
                msg: to_json_binary(&Cw20ExecuteMsg::Transfer {
                    recipient: info.sender.to_string(),
                    amount: position.collateral,
                })?,
                funds: vec![],
            }),
        };

        POSITIONS.remove(deps.storage, position_id.u128());
        Ok(Response::new()
            .add_messages(vec![repay_msg, collateral_msg])
            .add_attribute("action", "repay")
            .add_attribute("position_id", position_id.to_string()))
    }

    /// Withdraw deposited tokens from the contract
    pub fn execute_withdraw(
        deps: DepsMut,
        _env: Env,
        info: MessageInfo,
        token: String,
        amount: Uint128,
    ) -> StdResult<Response> {
        if !SUPPORTED_TOKENS
            .may_load(deps.storage, &token)?
            .unwrap_or(false)
        {
            return Err(StdError::generic_err("Unsupported token"));
        }

        let token_type = determine_token_type(&deps.as_ref(), &token)?;
        let key = (&info.sender, token.as_str());
        let current = DEPOSITS.load(deps.storage, key)?;
        if current < amount {
            return Err(StdError::generic_err("Insufficient deposit"));
        }

        // Transfer tokens back to user
        let withdraw_msg = match token_type {
            Token::Native(denom) => BankMsg::Send {
                to_address: info.sender.to_string(),
                amount: vec![Coin { denom, amount }],
            }
            .into(),
            Token::Cw20(addr) => CosmosMsg::Wasm(WasmMsg::Execute {
                contract_addr: addr.to_string(),
                msg: to_json_binary(&Cw20ExecuteMsg::Transfer {
                    recipient: info.sender.to_string(),
                    amount,
                })?,
                funds: vec![],
            }),
        };

        // Update deposit balance
        if current == amount {
            DEPOSITS.remove(deps.storage, key);
        } else {
            DEPOSITS.save(deps.storage, key, &(current - amount))?;
        }

        Ok(Response::new()
            .add_message(withdraw_msg)
            .add_attribute("action", "withdraw")
            .add_attribute("user", info.sender.to_string())
            .add_attribute("amount", amount.to_string()))
    }

    /// Liquidate an undercollateralized position
    pub fn execute_liquidate(
        deps: DepsMut,
        env: Env,
        info: MessageInfo,
        position_id: Uint128,
    ) -> StdResult<Response> {
        let config = CONFIG.load(deps.storage)?;
        let position = POSITIONS.load(deps.storage, position_id.u128())?;
        if !position.filled {
            return Err(StdError::generic_err("Position not filled"));
        }

        // Query collateral price from oracle
        let token_str = match &position.collateral_token {
            Token::Native(denom) => denom.clone(),
            Token::Cw20(addr) => addr.to_string(),
        };
        let price: Uint128 = deps.querier.query(&QueryRequest::Wasm(WasmQuery::Smart {
            contract_addr: config.mock_oracle.to_string(),
            msg: to_json_binary(&encke_oracle::QueryMsg::GetPrice {
                token: token_str.clone(),
            })?,
        }))?;
        let collateral_value = position.collateral * price;
        let time_elapsed = env.block.time.seconds() - position.start_time;
        let interest = position.amount * position.interest_rate * Uint128::from(time_elapsed)
            / Uint128::from(31_536_000u64 * 100u64);
        let total_debt = position.amount + interest;

        // Check liquidation condition
        if collateral_value >= total_debt * config.liquidation_threshold / Uint128::from(100u128) {
            return Err(StdError::generic_err("Position not undercollateralized"));
        }

        // Calculate shares
        let liquidator_share = total_debt * Uint128::from(90u128) / Uint128::from(100u128);
        let lender_share = total_debt - liquidator_share;
        let collateral_to_liquidator =
            position.collateral * Uint128::from(95u128) / Uint128::from(100u128);

        // Transfer debt repayment and collateral
        let (liquidator_payment_msg, lender_repayment_msg) = match &position.borrow_token {
            Token::Native(denom) => {
                verify_funds(&info.funds, denom, total_debt)?;
                (
                    BankMsg::Send {
                        to_address: env.contract.address.to_string(),
                        amount: vec![Coin {
                            denom: denom.clone(),
                            amount: total_debt,
                        }],
                    }
                    .into(),
                    BankMsg::Send {
                        to_address: position.lender.clone().unwrap().to_string(),
                        amount: vec![Coin {
                            denom: denom.clone(),
                            amount: lender_share,
                        }],
                    }
                    .into(),
                )
            }
            Token::Cw20(addr) => (
                CosmosMsg::Wasm(WasmMsg::Execute {
                    contract_addr: addr.to_string(),
                    msg: to_json_binary(&Cw20ExecuteMsg::TransferFrom {
                        owner: info.sender.to_string(),
                        recipient: env.contract.address.to_string(),
                        amount: total_debt,
                    })?,
                    funds: vec![],
                }),
                CosmosMsg::Wasm(WasmMsg::Execute {
                    contract_addr: addr.to_string(),
                    msg: to_json_binary(&Cw20ExecuteMsg::Transfer {
                        recipient: position.lender.clone().unwrap().to_string(),
                        amount: lender_share,
                    })?,
                    funds: vec![],
                }),
            ),
        };

        let liquidator_collateral_msg = match &position.collateral_token {
            Token::Native(denom) => BankMsg::Send {
                to_address: info.sender.to_string(),
                amount: vec![Coin {
                    denom: denom.clone(),
                    amount: collateral_to_liquidator,
                }],
            }
            .into(),
            Token::Cw20(addr) => CosmosMsg::Wasm(WasmMsg::Execute {
                contract_addr: addr.to_string(),
                msg: to_json_binary(&Cw20ExecuteMsg::Transfer {
                    recipient: info.sender.to_string(),
                    amount: collateral_to_liquidator,
                })?,
                funds: vec![],
            }),
        };

        POSITIONS.remove(deps.storage, position_id.u128());
        Ok(Response::new()
            .add_messages(vec![
                liquidator_payment_msg,
                lender_repayment_msg,
                liquidator_collateral_msg,
            ])
            .add_attribute("action", "liquidate")
            .add_attribute("position_id", position_id.to_string()))
    }

    // Helper functions

    /// Determine token type from string
    pub fn determine_token_type(deps: &Deps, token: &str) -> StdResult<Token> {
        if deps.api.addr_validate(token).is_ok() {
            Ok(Token::Cw20(deps.api.addr_validate(token)?))
        } else {
            Ok(Token::Native(token.to_string()))
        }
    }

    /// Verify sufficient funds for native token transfers
    fn verify_funds(funds: &[Coin], denom: &str, amount: Uint128) -> StdResult<()> {
        let sent = funds
            .iter()
            .find(|c| c.denom == denom)
            .map(|c| c.amount)
            .unwrap_or(Uint128::zero());
        if sent < amount {
            Err(StdError::generic_err("Insufficient funds"))
        } else {
            Ok(())
        }
    }
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetTokenConfigs {} => to_json_binary(&query_token_configs(deps)?),
        QueryMsg::GetUserInfo { address } => to_json_binary(&query_user_info(deps, address)?),
        QueryMsg::GetPosition { position_id } => {
            to_json_binary(&query_position(deps, position_id)?)
        }
        QueryMsg::GetAllPositions { start_after, limit } => {
            to_json_binary(&query_all_positions(deps, start_after, limit)?)
        }
        QueryMsg::GetConfig {} => to_json_binary(&query_config(deps)?),
    }
}

pub mod query {
    use cosmwasm_std::StdError;
    use cw_storage_plus::Bound;

    use crate::{
        msg::{
            ConfigResponse, PositionResponse, PositionsResponse, TokenConfig, TokenConfigsResponse,
            UserInfo, UserInfoResponse,
        },
        state::{Deposit, Position, DEPOSITS, POSITIONS},
    };

    use super::{execute::determine_token_type, *};

    /// Query supported tokens
    pub fn query_token_configs(deps: Deps) -> StdResult<TokenConfigsResponse> {
        let tokens: Vec<TokenConfig> = SUPPORTED_TOKENS
            .range(deps.storage, None, None, cosmwasm_std::Order::Ascending)
            .map(|item: Result<(String, bool), StdError>| {
                let (token_str, is_supported) = item?;
                let token = determine_token_type(&deps, &token_str)?;
                Ok(TokenConfig { token, is_supported })
            })
            .collect::<StdResult<Vec<_>>>()?;
        Ok(TokenConfigsResponse { tokens })
    }

    /// Query user deposits and positions
    pub fn query_user_info(deps: Deps, address: String) -> StdResult<UserInfoResponse> {
        let addr = deps.api.addr_validate(&address)?;
        let deposits: Vec<Deposit> = DEPOSITS
            .prefix(&addr)
            .range(deps.storage, None, None, cosmwasm_std::Order::Ascending)
            .map(|item: Result<(String, Uint128), StdError>| {
                let (token_str, amount) = item?;
                let token = determine_token_type(&deps, &token_str)?;
                Ok(Deposit { token, amount })
            })
            .collect::<StdResult<Vec<_>>>()?;
        let positions: Vec<(Uint128, Position)> = POSITIONS
            .range(deps.storage, None, None, cosmwasm_std::Order::Ascending)
            .filter_map(|item| {
                let (id, pos) = item.ok()?;
                if pos.borrower == addr || pos.lender == Some(addr.clone()) {
                    Some(Ok((id, pos)))
                } else {
                    None
                }
            })
            .collect()?;
    
        Ok(UserInfoResponse {
            user_info: if deposits.is_empty() && positions.is_empty() {
                None
            } else {
                Some(UserInfo { deposits, positions })
            },
        })
    }

    /// Query a specific position
    pub fn query_position(deps: Deps, position_id: Uint128) -> StdResult<PositionResponse> {
        let position = POSITIONS.load(deps.storage, position_id.u128())?;
        Ok(PositionResponse { position })
    }

    /// Query all positions with pagination
    pub fn query_all_positions(
        deps: Deps,
        start_after: Option<Uint128>,
        limit: Option<u32>,
    ) -> StdResult<PositionsResponse> {
        let limit = limit.unwrap_or(100).min(100) as usize;
        let start = start_after.map(Bound::exclusive);

        let positions = POSITIONS
            .range(deps.storage, start, None, cosmwasm_std::Order::Ascending)
            .take(limit)
            .collect::<StdResult<Vec<_>>>()?;
        Ok(PositionsResponse { positions })
    }

    /// Query a protocol config
    pub fn query_config(deps: Deps) -> StdResult<ConfigResponse> {
        let config = CONFIG.load(deps.storage)?;
        Ok(ConfigResponse { config })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
}
