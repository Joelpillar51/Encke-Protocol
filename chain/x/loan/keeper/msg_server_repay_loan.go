package keeper

import (
	"context"

	"loan/x/loan/types"

	errorsmod "cosmossdk.io/errors"
	sdk "github.com/cosmos/cosmos-sdk/types"
	sdkerrors "github.com/cosmos/cosmos-sdk/types/errors"
)

func (k msgServer) RepayLoan(goCtx context.Context, msg *types.MsgRepayLoan) (*types.MsgRepayLoanResponse, error) {
	ctx := sdk.UnwrapSDKContext(goCtx)

	// Get loan from ID.
	loan, found := k.GetLoan(ctx, msg.Id)

	// Return error if loan is not found.
	if !found {
		return nil, errorsmod.Wrapf(sdkerrors.ErrKeyNotFound, "key %d doesn't exist", msg.Id)
	}

	// Validate loan state.
	if loan.State != "approved" {
		return nil, errorsmod.Wrapf(types.ErrWrongLoanState, "%v", loan.State)
	}

	// Parse lender address.
	lender, _ := sdk.AccAddressFromBech32(loan.Lender)

	// Parse borrower address.
	borrower, _ := sdk.AccAddressFromBech32(loan.Borrower)

	// Ensure signer is borrower.
	if msg.Creator != loan.Borrower {
		return nil, errorsmod.Wrap(sdkerrors.ErrUnauthorized, "Cannot repay: not the borrower")
	}

	// Parse amount.
	amount, _ := sdk.ParseCoinsNormalized(loan.Amount)

	// Parse fee.
	fee, _ := sdk.ParseCoinsNormalized(loan.Fee)

	// Parse collateral
	collateral, _ := sdk.ParseCoinsNormalized(loan.Collateral)

	// Send borrowed amount from borrower to lender.
	err := k.bankKeeper.SendCoins(ctx, borrower, lender, amount)
	if err != nil {
		return nil, err
	}

	// Send fee from borrower to lender.
	err = k.bankKeeper.SendCoins(ctx, borrower, lender, fee)
	if err != nil {
		return nil, err
	}

	// Return collateral to borrower.
	err = k.bankKeeper.SendCoinsFromModuleToAccount(ctx, types.ModuleName, borrower, collateral)
	if err != nil {
		return nil, err
	}

	// Update load state.
	loan.State = "repayed"

	// Update loan in storage.
	k.SetLoan(ctx, loan)

	return &types.MsgRepayLoanResponse{}, nil
}
