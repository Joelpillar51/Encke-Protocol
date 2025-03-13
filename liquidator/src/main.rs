use cosmrs::{
    cosmwasm::MsgExecuteContract,
    crypto::secp256k1::SigningKey,
    proto::cosmos::{
        auth::v1beta1::{BaseAccount, QueryAccountRequest, QueryAccountResponse},
        tx::v1beta1::{AuthInfo as ProtoAuthInfo, TxBody},
    },
    rpc::{Client, HttpClient},
    tendermint::block::Height,
    tx::{AuthInfo, Body, Fee, Raw as TxRaw, SignDoc, SignerInfo},
    AccountId, Any, Coin, Denom,
};
use cosmwasm_schema::cw_serde;
use cosmwasm_std::{to_json_binary, Addr, CosmosMsg, Uint128, WasmMsg, WasmQuery};
use log::{error, info, warn};
use prost::Message;
use std::fs;
use std::path::Path;
use std::time::{Duration, SystemTime};
use std::{error::Error as StdError, str::FromStr};

// Custom error type to unify error handling
type Error = Box<dyn StdError + 'static>;

// Configuration constants
const NEUTRON_RPC_ENDPOINT: &str = "https://rpc-palvus.pion-1.ntrn.tech"; // Neutron testnet RPC
const PAGE_SIZE: u32 = 100; // Number of positions per page
const BATCH_SIZE: usize = 50; // Number of positions per batch

#[cw_serde]
pub struct Position {
    pub borrower: Addr,
    pub lender: Option<Addr>,
    pub borrow_token: Token,
    pub collateral_token: Token,
    pub amount: Uint128,
    pub interest_rate: Uint128,
    pub collateral: Uint128,
    pub start_time: u64,
    pub filled: bool,
}

#[cw_serde]
pub enum Token {
    Native(String),
    Cw20(Addr),
}

#[cw_serde]
pub enum QueryMsg {
    GetAllPositions {
        start_after: Option<Uint128>,
        limit: Option<u32>,
    },
}

#[cw_serde]
pub enum ExecuteMsg {
    Liquidate { position_id: Uint128 },
}

#[cw_serde]
pub struct PositionsResponse {
    pub positions: Vec<(Uint128, Position)>,
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    env_logger::init(); // Initialize logging
    let contract_addr = Addr::unchecked("neutron1contractaddress"); // Replace with actual address
    let oracle_addr = Addr::unchecked("neutron1oracleaddress"); // Replace with actual address
    let client = HttpClient::new(NEUTRON_RPC_ENDPOINT).expect("NEUTRON_RPC_ENDPOINT is not set");
    let key_path = "key.txt";
    let key = load_signing_key(key_path).expect("Failed to load signing key");
    let pub_key = key.public_key().account_id("neutron").expect("msg");
    let account_id = AccountId::new("neutron", &pub_key.to_bytes()).expect("msg");
    let chain_id = "neutron-1".to_string();

    info!("Starting liquidation bot for contract: {}", contract_addr);

    loop {
        match process_positions(
            &client,
            &contract_addr,
            &oracle_addr,
            &key,
            &account_id,
            &chain_id,
        )
        .await
        {
            Ok(_) => info!("Position check cycle completed"),
            Err(e) => error!("Error in position check cycle: {}", e),
        }
        tokio::time::sleep(Duration::from_secs(60)).await; // Check every minute
    }
}

fn load_signing_key<P: AsRef<Path>>(path: P) -> Result<SigningKey, Box<dyn StdError>> {
    let binding = fs::read_to_string(path)?;
    let key_hex = binding.trim();
    let key_bytes = hex::decode(key_hex)?;
    let signing_key = SigningKey::from_slice(&key_bytes)?;
    Ok(signing_key)
}

/// Process all positions in batches synchronously
async fn process_positions(
    client: &HttpClient,
    contract_addr: &Addr,
    oracle_addr: &Addr,
    key: &SigningKey,
    account_id: &AccountId,
    chain_id: &str,
) -> Result<(), Error> {
    let mut start_after: Option<Uint128> = None;
    let mut all_positions = Vec::new();

    // Fetch all positions with pagination
    loop {
        let positions = query_positions(client, contract_addr, start_after).await?;
        all_positions.extend(positions.clone());
        info!(
            "Fetched {} positions, total now: {}",
            positions.len(),
            all_positions.len()
        );

        if positions.len() < PAGE_SIZE as usize {
            break;
        }
        start_after = positions.last().map(|(id, _)| *id);
    }

    // Process positions in batches synchronously
    let batches: Vec<Vec<(Uint128, Position)>> = all_positions
        .chunks(BATCH_SIZE)
        .map(|chunk| chunk.to_vec())
        .collect();

    for batch in batches {
        process_batch(
            client,
            contract_addr,
            oracle_addr,
            key,
            account_id,
            chain_id,
            &batch,
        )
        .await?;
    }

    Ok(())
}

/// Process a batch of positions
async fn process_batch(
    client: &HttpClient,
    contract_addr: &Addr,
    oracle_addr: &Addr,
    key: &SigningKey,
    account_id: &AccountId,
    chain_id: &str,
    batch: &[(Uint128, Position)],
) -> Result<(), Error> {
    for (id, pos) in batch {
        if !pos.filled {
            continue; // Skip unfilled positions
        }

        let token_str = match &pos.collateral_token {
            Token::Native(denom) => denom.clone(),
            Token::Cw20(addr) => addr.to_string(),
        };
        let price = query_price(client, oracle_addr, &token_str).await?;
        let collateral_value = pos.collateral * price;
        let time_elapsed = SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)?
            .as_secs()
            - pos.start_time;
        let interest = pos.amount * pos.interest_rate * Uint128::from(time_elapsed)
            / Uint128::from(31_536_000u64 * 100u64);
        let total_debt = pos.amount + interest;
        let threshold = Uint128::from(150u128); // Assuming 1.5x from config

        if collateral_value < total_debt * threshold / Uint128::from(100u128) {
            info!(
                "Liquidating position {}: collateral_value={}, total_debt={}",
                id, collateral_value, total_debt
            );
            let tx = build_and_sign_tx(
                client,
                key,
                account_id,
                chain_id,
                contract_addr,
                *id,
                &pos.borrow_token,
                total_debt,
            )
            .await?;
            match broadcast_tx(client, tx).await {
                Ok(_) => {
                    info!("Liquidation tx broadcasted for position {}", id);
                }
                Err(e) => {
                    warn!("Broadcast failed for position {}: {}", id, e);
                }
            }
            info!("Liquidation tx broadcasted for position {}", id);
        }
    }
    Ok(())
}

#[allow(deprecated)]
async fn query_positions(
    client: &HttpClient,
    contract_addr: &Addr,
    start_after: Option<Uint128>,
) -> Result<Vec<(Uint128, Position)>, Error> {
    let query_msg = QueryMsg::GetAllPositions {
        start_after,
        limit: Some(PAGE_SIZE),
    };
    let query_data = base64::encode(serde_json::to_vec(&WasmQuery::Smart {
        contract_addr: contract_addr.to_string(),
        msg: to_json_binary(&query_msg)?,
    })?);

    let response = client
        .abci_query(None, format!("wasm/query/{}", query_data), None, false)
        .await?;

    let decoded = base64::decode(&response.value).map_err(|e| {
        error!("Failed to decode response: {:?}", response.value);
        e
    })?;
    let positions: PositionsResponse = serde_json::from_slice(&decoded)?;
    Ok(positions.positions)
}

#[allow(deprecated)]
async fn query_price(
    client: &HttpClient,
    oracle_addr: &Addr,
    token: &str,
) -> Result<Uint128, Error> {
    let query_msg = oracle::QueryMsg::GetPrice {
        token: token.to_string(),
    };
    let query_data = base64::encode(serde_json::to_vec(&WasmQuery::Smart {
        contract_addr: oracle_addr.to_string(),
        msg: to_json_binary(&query_msg)?,
    })?);
    let response = client
        .abci_query(None, format!("wasm/query/{}", query_data), None, false)
        .await?;

    let decoded = base64::decode(response.value)?;
    let price: Uint128 = serde_json::from_slice(&decoded)?;
    Ok(price)
}
/// Build and sign a liquidation transaction
#[allow(deprecated)]
async fn build_and_sign_tx(
    client: &HttpClient,
    key: &SigningKey,
    account_id: &AccountId,
    chain_id: &str,
    contract_addr: &Addr,
    position_id: Uint128,
    borrow_token: &Token,
    total_debt: Uint128,
) -> Result<TxRaw, Box<dyn std::error::Error>> {
    let msg = ExecuteMsg::Liquidate { position_id };
    let wasm_msg: CosmosMsg<ExecuteMsg> = CosmosMsg::Wasm(WasmMsg::Execute {
        contract_addr: contract_addr.to_string(),
        msg: to_json_binary(&msg)?,
        funds: match borrow_token {
            Token::Native(denom) => vec![cosmwasm_std::Coin {
                denom: denom.clone(),
                amount: total_debt,
            }],
            Token::Cw20(_) => vec![],
        },
    });

    // Convert CosmosMsg to MsgExecuteContract
    let execute_msg = match wasm_msg {
        CosmosMsg::Wasm(WasmMsg::Execute {
            contract_addr,
            msg,
            funds,
        }) => MsgExecuteContract {
            sender: account_id.clone(),
            contract: AccountId::from_str(&contract_addr)?,
            msg: msg.into(),
            funds: funds
                .into_iter()
                .map(|coin| Coin {
                    denom: Denom::from_str(&coin.denom).expect("msg"),
                    amount: coin.amount.u128(),
                })
                .collect::<Vec<Coin>>(),
        },
        _ => unreachable!("Only WasmMsg::Execute is supported here"),
    };

    // Encode MsgExecuteContract into Any
    let any_msg = Any {
        type_url: "/cosmwasm.wasm.v1.MsgExecuteContract".to_string(),
        value: execute_msg.msg.encode_to_vec(),
    };

    // Get current block height and calculate timeout
    let current_height = client.latest_block().await?.block.header.height.value();
    let timeout_height = current_height + 100; // Add 100 blocks as timeout

    // Build transaction body
    let tx_body = Body {
        messages: vec![any_msg],
        memo: String::new(),
        timeout_height: Height::from(timeout_height as u32),
        extension_options: vec![],
        non_critical_extension_options: vec![],
    };

    // Convert to Protobuf TxBody
    let proto_tx_body = TxBody {
        messages: tx_body.messages,
        memo: tx_body.memo,
        timeout_height: timeout_height as u64,
        extension_options: tx_body.extension_options,
        non_critical_extension_options: tx_body.non_critical_extension_options,
    };

    // Define fee
    let fee = Fee::from_amount_and_gas(
        Coin {
            denom: Denom::from_str("untrn")?,
            amount: 100000u64.into(),
        },
        200000u64,
    );

    // Build auth info
    let auth_info = AuthInfo {
        signer_infos: vec![SignerInfo::single_direct(None, 0)], // Sequence 0 for simplicity
        fee,
    };

    // Convert to Protobuf AuthInfo
    let proto_auth_info = ProtoAuthInfo {
        signer_infos: auth_info
            .signer_infos
            .into_iter()
            .map(|si| si.into())
            .collect(),
        fee: Some(cosmrs::proto::cosmos::tx::v1beta1::Fee {
            amount: auth_info
                .fee
                .amount
                .into_iter()
                .map(|coin| cosmrs::proto::cosmos::base::v1beta1::Coin {
                    denom: coin.denom.to_string(),
                    amount: coin.amount.to_string(),
                })
                .collect(),
            gas_limit: auth_info.fee.gas_limit,
            payer: String::new(),   // Default to empty; adjust if needed
            granter: String::new(), // Default to empty; adjust if needed
        }),
        tip: None,
    };

    // Serialize Body and AuthInfo to bytes
    let body_bytes = proto_tx_body.encode_to_vec();
    let auth_info_bytes = proto_auth_info.encode_to_vec();

    // Fetch account info
    let query_req = QueryAccountRequest {
        address: account_id.to_string(),
    };
    let query_data = query_req.encode_to_vec();
    let response = client
        .abci_query(
            Some("cosmos.auth.v1beta1.Query/Account".to_string()),
            query_data,
            None,
            false,
        )
        .await?;
    let account_response: QueryAccountResponse = prost::Message::decode(&response.value[..])?;
    let account_any = account_response.account.ok_or("No account found")?;

    // Verify type_url and decode to BaseAccount
    if account_any.type_url != "/cosmos.auth.v1beta1.BaseAccount" {
        return Err("Account type is not BaseAccount".into());
    }
    let base_account = BaseAccount::decode(&account_any.value[..])
        .map_err(|e| format!("Failed to decode BaseAccount: {}", e))?;
    let account_number = base_account.account_number;

    // Create and sign the SignDoc
    let sign_doc = SignDoc {
        body_bytes,
        auth_info_bytes,
        chain_id: chain_id.parse()?,
        account_number,
    };

    let tx_raw = sign_doc.sign(key)?;
    Ok(tx_raw)
}

async fn broadcast_tx(client: &HttpClient, tx: TxRaw) -> Result<(), Error> {
    let tx_bytes = tx.to_bytes()?;
    for attempt in 1..=3 {
        match client.broadcast_tx_sync(tx_bytes.clone()).await {
            Ok(_) => return Ok(()),
            Err(e) if attempt < 3 => {
                error!("Broadcast attempt {} failed: {}", attempt, e);
                tokio::time::sleep(Duration::from_secs(1)).await;
            }
            Err(e) => return Err(e.into()),
        }
    }
    unreachable!()
}

mod oracle {
    use cosmwasm_schema::cw_serde;

    #[cw_serde]
    pub enum QueryMsg {
        GetPrice { token: String },
    }
}
