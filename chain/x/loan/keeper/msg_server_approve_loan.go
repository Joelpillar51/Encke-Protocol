package keeper

import (
	"context"

	"loan/x/loan/types"

	errorsmod "cosmossdk.io/errors"
	sdk "github.com/cosmos/cosmos-sdk/types"
	sdkerrors "github.com/cosmos/cosmos-sdk/types/errors"
)

func (k msgServer) ApproveLoan(goCtx context.Context, msg *types.MsgApproveLoan) (*types.MsgApproveLoanResponse, error) {
	ctx := sdk.UnwrapSDKContext(goCtx)

	// Get loan from id.
	loan, found := k.GetLoan(ctx, msg.Id)

	// Return error if loan is not found.
	if !found {
		return nil, errorsmod.Wrapf(sdkerrors.ErrKeyNotFound, "key %d doesn't exist", msg.Id)
	}

	// Validate loan state
	if loan.State != "requested" {
		return nil, errorsmod.Wrapf(types.ErrWrongLoanState, "%v", loan.State)
	}

	// Parse lender address.
	lender, _ := sdk.AccAddressFromBech32(msg.Creator)

	// Parse borrower address.
	borrower, _ := sdk.AccAddressFromBech32(loan.Borrower)

	// Parse amount to coin type.
	amount, err := sdk.ParseCoinsNormalized(loan.Amount)
	if err != nil {
		return nil, errorsmod.Wrap(types.ErrWrongLoanState, "Cannot parse coins in loan amount")
	}

	// Transfer tokens from lender to borrower
	err = k.bankKeeper.SendCoins(ctx, lender, borrower, amount)
	if err != nil {
		return nil, err
	}

	// Initialize loan lender
	loan.Lender = msg.Creator

	// Update loan state.
	loan.State = "approved"

	// Update loan in storage
	k.SetLoan(ctx, loan)

	return &types.MsgApproveLoanResponse{}, nil
}
