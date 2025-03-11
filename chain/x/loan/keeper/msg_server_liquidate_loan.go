package keeper

import (
	"context"

	"loan/x/loan/types"

	"strconv"

	errorsmod "cosmossdk.io/errors"
	sdk "github.com/cosmos/cosmos-sdk/types"
	sdkerrors "github.com/cosmos/cosmos-sdk/types/errors"
)

func (k msgServer) LiquidateLoan(goCtx context.Context, msg *types.MsgLiquidateLoan) (*types.MsgLiquidateLoanResponse, error) {
	ctx := sdk.UnwrapSDKContext(goCtx)

	// Get loan from ID.
	loan, found := k.GetLoan(ctx, msg.Id)

	// Return error if loan not found.
	if !found {
		return nil, errorsmod.Wrapf(sdkerrors.ErrKeyNotFound, "key %d doesn't exist", msg.Id)
	}

	// Ensure lender is signer.
	if loan.Lender != msg.Creator {
		return nil, errorsmod.Wrap(sdkerrors.ErrUnauthorized, "Cannot liquidate: not the lender")
	}

	// Ensure valid loan state.
	if loan.State != "approved" {
		return nil, errorsmod.Wrapf(types.ErrWrongLoanState, "%v", loan.State)
	}

	// Parse lender address.
	lender, _ := sdk.AccAddressFromBech32(loan.Lender)

	// Parse collateral to coin type
	collateral, _ := sdk.ParseCoinsNormalized(loan.Collateral)

	// Parse deadline.
	deadline, err := strconv.ParseInt(loan.Deadline, 10, 64)
	if err != nil {
		panic(err)
	}

	// Ensure deadline has passed.
	if ctx.BlockHeight() < deadline {
		return nil, errorsmod.Wrap(types.ErrDeadline, "Cannot liquidate before deadline")
	}

	// Transfer collateral to lender.
	err = k.bankKeeper.SendCoinsFromModuleToAccount(ctx, types.ModuleName, lender, collateral)
	if err != nil {
		return nil, err
	}

	// Update loan state.
	loan.State = "liquidated"

	// Update loan in storage
	k.SetLoan(ctx, loan)

	return &types.MsgLiquidateLoanResponse{}, nil
}
