import React from 'react';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import { getUnusedAddressFromAccount } from '@wallet-utils/coinmarket/coinmarketUtils';
import {
    FiatValue,
    QuestionTooltip,
    Translation,
    AccountLabeling,
    FormattedCryptoAmount,
} from '@suite-components';
import { Input, Button, variables, CoinLogo, DeviceImage } from '@trezor/components';
import { useCoinmarketBuyOffersContext } from '@wallet-hooks/useCoinmarketBuyOffers';
import { AddressOptions } from '@wallet-views/coinmarket/common/AddressOptions';
import { useAccountAddressDictionary } from '@wallet-hooks/useAccounts';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    margin-top: 10px;
`;

const CardContent = styled.div`
    display: flex;
    flex-direction: column;
    padding: 24px;
`;

const LogoWrapper = styled.div`
    display: flex;
    align-items: center;
    padding: 0 0 0 15px;
`;

const AccountWrapper = styled.div`
    display: flex;
    padding: 0 0 0 15px;
    flex-direction: column;
`;

const Label = styled.div`
    display: flex;
    align-items: center;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const StyledQuestionTooltip = styled(QuestionTooltip)`
    padding-left: 3px;
`;

const CryptoWrapper = styled.div`
    padding-right: 3px;
`;

const FiatWrapper = styled.div`
    padding: 0 0 0 3px;
`;

const CustomLabel = styled(Label)`
    padding-bottom: 12px;
`;

const LabelText = styled.div``;

const StyledDeviceImage = styled(DeviceImage)`
    padding: 0 10px 0 0;
`;

const Amount = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const AccountName = styled.div`
    display: flex;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const FakeInput = styled.div`
    display: flex;
    margin-bottom: 20px;
    padding: 5px;
    min-height: 61px;
    align-items: center;
    border-radius: 4px;
    border: solid 2px ${props => props.theme.STROKE_GREY};
    background: ${props => props.theme.BG_WHITE};
`;

const ButtonWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding-top: 20px;
    border-top: 1px solid ${props => props.theme.STROKE_GREY};
    margin: 20px 0;
`;

const Confirmed = styled.div`
    display: flex;
    height: 60px;
    font-size: ${variables.FONT_SIZE.BIG};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    background: ${props => props.theme.BG_GREY};
    align-items: center;
    justify-content: center;
    margin-top: 27px;
`;

interface FormState {
    address: string;
}

const VerifyAddressComponent = () => {
    const {
        account,
        device,
        callInProgress,
        verifyAddress,
        selectedQuote,
        goToPayment,
        addressVerified,
    } = useCoinmarketBuyOffersContext();
    const { symbol, formattedBalance } = account;
    const { path, address: unusedAddress } = getUnusedAddressFromAccount(account);

    const { watch, setValue, control } = useForm<FormState>({
        mode: 'onChange',
        defaultValues: { address: unusedAddress },
    });

    const addressDictionary = useAccountAddressDictionary(account);
    const { address } = watch();
    const accountAddress = addressDictionary[address];

    if (!path || !address || !selectedQuote) {
        return null;
    }

    return (
        <Wrapper>
            <CardContent>
                <CustomLabel>
                    <LabelText>
                        <Translation id="TR_BUY_RECEIVING_ACCOUNT" />
                    </LabelText>
                    <StyledQuestionTooltip tooltip="TR_BUY_RECEIVE_ACCOUNT_QUESTION_TOOLTIP" />
                </CustomLabel>
                <FakeInput>
                    <LogoWrapper>
                        <CoinLogo size={25} symbol={symbol} />
                    </LogoWrapper>
                    <AccountWrapper>
                        <AccountName>
                            <AccountLabeling account={account} />
                        </AccountName>
                        <Amount>
                            <CryptoWrapper>
                                <FormattedCryptoAmount value={formattedBalance} symbol={symbol} />
                            </CryptoWrapper>
                            •
                            <FiatWrapper>
                                <FiatValue amount={formattedBalance} symbol={symbol} />
                            </FiatWrapper>
                        </Amount>
                    </AccountWrapper>
                </FakeInput>
                {account?.networkType === 'bitcoin' ? (
                    <>
                        <CustomLabel>
                            <Translation id="TR_BUY_RECEIVING_ADDRESS" />
                            <StyledQuestionTooltip tooltip="TR_BUY_RECEIVE_ADDRESS_QUESTION_TOOLTIP" />
                        </CustomLabel>
                        <AddressOptions
                            account={account}
                            control={control}
                            receiveSymbol={account.symbol}
                            setValue={setValue}
                            address={address}
                        />
                    </>
                ) : (
                    <Input
                        label={
                            <Label>
                                <Translation id="TR_BUY_RECEIVING_ADDRESS" />
                                <StyledQuestionTooltip tooltip="TR_BUY_RECEIVE_ADDRESS_QUESTION_TOOLTIP" />
                            </Label>
                        }
                        value={address}
                        readOnly
                    />
                )}
                {addressVerified && addressVerified === address && (
                    <Confirmed>
                        {device && (
                            <StyledDeviceImage
                                height={25}
                                trezorModel={device.features?.major_version === 1 ? 1 : 2}
                            />
                        )}
                        <Translation id="TR_BUY_CONFIRMED_ON_TREZOR" />
                    </Confirmed>
                )}
            </CardContent>
            <ButtonWrapper>
                {(!addressVerified || addressVerified !== address) && (
                    <Button
                        isLoading={callInProgress}
                        isDisabled={callInProgress}
                        onClick={() => {
                            if (accountAddress && address) {
                                verifyAddress(account, address, accountAddress.path);
                            }
                        }}
                    >
                        <Translation id="TR_BUY_CONFIRM_ON_TREZOR" />
                    </Button>
                )}
                {addressVerified && addressVerified === address && (
                    <Button
                        isLoading={callInProgress}
                        isDisabled={callInProgress}
                        onClick={() => goToPayment(address)}
                    >
                        <Translation id="TR_BUY_GO_TO_PAYMENT" />
                    </Button>
                )}
            </ButtonWrapper>
        </Wrapper>
    );
};

export default VerifyAddressComponent;
