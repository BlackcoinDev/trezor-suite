import React, { useMemo, useState, useEffect } from 'react';
import styled from 'styled-components';
import useDebounce from 'react-use/lib/useDebounce';

import { Stack } from '@suite-components/Skeleton';
import { Card } from '@trezor/components';
import { Translation } from '@suite-components';
import { Section } from '@dashboard-components';
import { useSelector, useActions } from '@suite-hooks';
import { groupTransactionsByDate, advancedSearchTransactions } from '@suite-common/wallet-utils';
import { SETTINGS } from '@suite-config';
import { WalletAccountTransaction, Account } from '@wallet-types';
import Actions from './components/Actions';
import TransactionItem from '@wallet-components/TransactionItem';
import { Pagination } from '@wallet-components';
import TransactionsGroup from './components/TransactionsGroup';
import SkeletonTransactionItem from './components/SkeletonTransactionItem';
import NoSearchResults from './components/NoSearchResults';
import { findAnchorTransactionPage } from '@suite-utils/anchor';
import { fetchTransactionsThunk } from '@suite-common/wallet-core';

const StyledCard = styled(Card)<{ isPending: boolean }>`
    flex-direction: column;
    padding: 0;
    border-radius: 0;
    background: none;
`;

const StyledSection = styled(Section)`
    margin-bottom: 20px;
`;

const PaginationWrapper = styled.div`
    margin-top: 20px;
`;

interface TransactionListProps {
    transactions: WalletAccountTransaction[];
    symbol: WalletAccountTransaction['symbol'];
    isLoading?: boolean;
    account: Account;
}

const TransactionList = ({ transactions, isLoading, account, ...props }: TransactionListProps) => {
    const ref = React.createRef<HTMLDivElement>();
    const { fetchTransactions } = useActions({
        fetchTransactions: fetchTransactionsThunk,
    });
    const { anchor, localCurrency } = useSelector(state => ({
        localCurrency: state.wallet.settings.localCurrency,
        anchor: state.router.anchor,
    }));

    // Search
    const [search, setSearch] = useState('');
    const [searchedTransactions, setSearchedTransactions] = useState(transactions);
    const isSearching = search !== '';

    useDebounce(
        () => {
            const results = advancedSearchTransactions(transactions, account.metadata, search);
            setSearchedTransactions(results);
        },
        200,
        [transactions, account.metadata, search],
    );

    const [hasFetchedAll, setHasFetchedAll] = useState(false);
    useEffect(() => {
        if (anchor && !hasFetchedAll) {
            fetchTransactions({
                accountKey: account.key,
                page: 2,
                perPage: SETTINGS.TXS_PER_PAGE,
                noLoading: true,
                recursive: true,
            });
            setHasFetchedAll(true);
        }
    }, [anchor, fetchTransactions, account, hasFetchedAll]);

    // Pagination
    const perPage = SETTINGS.TXS_PER_PAGE;
    const startPage = findAnchorTransactionPage(transactions, perPage, anchor);
    const [currentPage, setSelectedPage] = useState(startPage);

    useEffect(() => {
        // reset page on account change
        setSelectedPage(startPage);
    }, [account.descriptor, account.symbol, startPage]);

    const totalItems = isSearching ? searchedTransactions.length : account.history.total;

    const onPageSelected = (page: number) => {
        setSelectedPage(page);

        if (!isSearching) {
            fetchTransactions({ accountKey: account.key, page, perPage });
        }

        if (ref.current) {
            ref.current.scrollIntoView();
        }
    };

    const startIndex = (currentPage - 1) * perPage;
    const stopIndex = startIndex + perPage;

    const slicedTransactions = useMemo(
        () => searchedTransactions.slice(startIndex, stopIndex),
        [searchedTransactions, startIndex, stopIndex],
    );

    const transactionsByDate = useMemo(
        () => groupTransactionsByDate(slicedTransactions),
        [slicedTransactions],
    );

    // if total pages cannot be determined check current page and number of txs (XRP)
    // Edge case: if there is exactly 25 Ripple txs, pagination will be displayed
    const isRipple = account.networkType === 'ripple';
    const isLastRipplePage = isRipple && slicedTransactions.length < perPage;
    const showRipplePagination = !(isLastRipplePage && currentPage === 1);
    const showPagination = isRipple ? showRipplePagination : totalItems > perPage;

    return (
        <StyledSection
            ref={ref}
            heading={<Translation id="TR_ALL_TRANSACTIONS" />}
            actions={
                <Actions
                    account={account}
                    search={search}
                    setSearch={setSearch}
                    setSelectedPage={setSelectedPage}
                />
            }
        >
            {/* TODO: show this skeleton also while searching in txs */}
            {isLoading ? (
                <Stack col childMargin="0px 0px 16px 0px">
                    <SkeletonTransactionItem />
                    <SkeletonTransactionItem />
                    <SkeletonTransactionItem />
                </Stack>
            ) : (
                <>
                    {transactions.length > 0 && searchedTransactions.length === 0 ? (
                        <NoSearchResults />
                    ) : (
                        Object.keys(transactionsByDate).map(dateKey => {
                            const isPending = dateKey === 'pending';
                            return (
                                <TransactionsGroup
                                    key={dateKey}
                                    dateKey={dateKey}
                                    symbol={props.symbol}
                                    transactions={transactionsByDate[dateKey]}
                                    localCurrency={localCurrency}
                                >
                                    <StyledCard isPending={isPending}>
                                        {transactionsByDate[dateKey].map(
                                            (tx: WalletAccountTransaction) => (
                                                <TransactionItem
                                                    key={tx.txid}
                                                    transaction={tx}
                                                    isPending={isPending}
                                                    accountMetadata={account.metadata}
                                                    accountKey={account.key}
                                                />
                                            ),
                                        )}
                                    </StyledCard>
                                </TransactionsGroup>
                            );
                        })
                    )}
                </>
            )}
            {showPagination && (
                <PaginationWrapper>
                    <Pagination
                        hasPages={!isRipple}
                        currentPage={currentPage}
                        isLastPage={isLastRipplePage}
                        perPage={perPage}
                        totalItems={totalItems}
                        onPageSelected={onPageSelected}
                    />
                </PaginationWrapper>
            )}
        </StyledSection>
    );
};

export default TransactionList;
