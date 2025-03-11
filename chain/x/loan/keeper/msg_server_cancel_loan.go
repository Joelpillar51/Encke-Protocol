package keeper

import (
	"context"

	"loan/x/loan/types"

	errorsmod "cosmossdk.io/errors"
	sdk "github.com/cosmos/cosmos-sdk/types"
	sdkerrors "github.com/cosmos/cosmos-sdk/types/errors"
)

func (k msgServer) CancelLoan(goCtx context.Context, msg *types.MsgCancelLoan) (*types.MsgCancelLoanResponse, error) {
	ctx := sdk.UnwrapSDKContext(goCtx)

	// Get loan from ID
	loan, found := k.GetLoan(ctx, msg.Id)

	// Return error if loan not found
	if !found {
		return nil, errorsmod.Wrapf(sdkerrors.ErrKeyNotFound, "key %d doesn't exist", msg.Id)
	}

	// Ensure signer is borrower.
	if loan.Borrower != msg.Creator {
		return nil, errorsmod.Wrap(sdkerrors.ErrUnauthorized, "Cannot cancel: not the borrower")
	}

	// Ensure loan state is valid.
	if loan.State != "requested" {
		return nil, errorsmod.Wrapf(types.ErrWrongLoanState, "%v", loan.State)
	}

	// Parse borrower to valid address.
	borrower, _ := sdk.AccAddressFromBech32(loan.Borrower)

	// Parse collateral amount to coin type.
	collateral, _ := sdk.ParseCoinsNormalized(loan.Collateral)

	// transfer token from module to borrower
	err := k.bankKeeper.SendCoinsFromModuleToAccount(ctx, types.ModuleName, borrower, collateral)
	if err != nil {
		return nil, err
	}

	// Update state of loan
	loan.State = "cancelled"

	// Update loan in storage
	k.SetLoan(ctx, loan)

	return &types.MsgCancelLoanResponse{}, nil
}
