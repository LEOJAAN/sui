// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { useGetRollingAverageApys } from '@mysten/core';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useActiveAddress } from '../../hooks/useActiveAddress';
import { calculateStakeShare } from '../calculateStakeShare';
import { getStakeSuiBySuiId } from '../getStakeSuiBySuiId';
import { getTokenStakeSuiForValidator } from '../getTokenStakeSuiForValidator';
import { StakeAmount } from '../home/StakeAmount';
import { useGetDelegatedStake } from '../useGetDelegatedStake';
import { useSystemState } from '../useSystemState';
import { ValidatorLogo } from '../validators/ValidatorLogo';
import { Card } from '_app/shared/card';
import Alert from '_components/alert';
import LoadingIndicator from '_components/loading/LoadingIndicator';
import { Text } from '_src/ui/app/shared/text';
import { IconTooltip } from '_src/ui/app/shared/tooltip';

type ValidatorFormDetailProps = {
    validatorAddress: string;
    unstake?: boolean;
};

export function ValidatorFormDetail({
    validatorAddress,
    unstake,
}: ValidatorFormDetailProps) {
    const accountAddress = useActiveAddress();

    const [searchParams] = useSearchParams();
    const stakeIdParams = searchParams.get('staked');
    const {
        data: system,
        isLoading: loadingValidators,
        isError: errorValidators,
    } = useSystemState();

    const {
        data: stakeData,
        isLoading,
        isError,
        error,
    } = useGetDelegatedStake(accountAddress || '');

    const { data: rollingAverageApys } = useGetRollingAverageApys(
        system?.activeValidators.length || null
    );

    const validatorData = useMemo(() => {
        if (!system) return null;
        return system.activeValidators.find(
            (av) => av.suiAddress === validatorAddress
        );
    }, [validatorAddress, system]);

    //TODO: verify this is the correct validator stake balance
    const totalValidatorStake = validatorData?.stakingPoolSuiBalance || 0;

    const totalStake = useMemo(() => {
        if (!stakeData) return 0n;
        return unstake
            ? getStakeSuiBySuiId(stakeData, stakeIdParams)
            : getTokenStakeSuiForValidator(stakeData, validatorAddress);
    }, [stakeData, stakeIdParams, unstake, validatorAddress]);

    const totalValidatorsStake = useMemo(() => {
        if (!system) return 0;
        return system.activeValidators.reduce(
            (acc, curr) => (acc += BigInt(curr.stakingPoolSuiBalance)),
            0n
        );
    }, [system]);

    const totalStakePercentage = useMemo(() => {
        if (!system || !stakeData) return 0;
        return calculateStakeShare(
            getTokenStakeSuiForValidator(stakeData, validatorAddress),
            BigInt(totalValidatorsStake)
        );
    }, [stakeData, system, totalValidatorsStake, validatorAddress]);

    const apy = rollingAverageApys?.[validatorAddress] || 0;

    if (isLoading || loadingValidators) {
        return (
            <div className="p-2 w-full flex justify-center items-center h-full">
                <LoadingIndicator />
            </div>
        );
    }

    if (isError || errorValidators) {
        return (
            <div className="p-2">
                <Alert mode="warning">
                    <div className="mb-1 font-semibold">
                        {error?.message ?? 'Error loading validator data'}
                    </div>
                </Alert>
            </div>
        );
    }

    return (
        <div className="w-full">
            {validatorData && (
                <Card
                    titleDivider
                    header={
                        <div className="flex py-2.5 px-3.75 gap-2 items-center">
                            <ValidatorLogo
                                validatorAddress={validatorAddress}
                                iconSize="sm"
                                size="body"
                            />
                        </div>
                    }
                    footer={
                        !unstake && (
                            <>
                                <Text
                                    variant="body"
                                    weight="medium"
                                    color="steel-darker"
                                >
                                    Your Staked SUI
                                </Text>

                                <StakeAmount
                                    balance={totalStake}
                                    variant="body"
                                />
                            </>
                        )
                    }
                >
                    <div className="divide-x flex divide-solid divide-gray-45 divide-y-0 flex-col gap-3.5">
                        <div className="flex gap-2 items-center justify-between">
                            <div className="flex gap-1 items-baseline text-steel">
                                <Text
                                    variant="body"
                                    weight="medium"
                                    color="steel-darker"
                                >
                                    Staking APY
                                </Text>
                                <IconTooltip tip="This is the Annualized Percentage Yield of the a specific validator’s past operations. Note there is no guarantee this APY will be true in the future." />
                            </div>

                            <Text
                                variant="body"
                                weight="semibold"
                                color="gray-90"
                            >
                                {apy > 0 ? `${apy}%` : '--'}
                            </Text>
                        </div>
                        <div className="flex gap-2 items-center justify-between">
                            <div className="flex gap-1 items-baseline text-steel">
                                <Text
                                    variant="body"
                                    weight="medium"
                                    color="steel-darker"
                                >
                                    Staking Share
                                </Text>
                                <IconTooltip tip="This is the Annualized Percentage Yield of the a specific validator’s past operations. Note there is no guarantee this APY will be true in the future." />
                            </div>

                            <Text
                                variant="body"
                                weight="semibold"
                                color="gray-90"
                            >
                                {totalStakePercentage > 0
                                    ? `${totalStakePercentage}%`
                                    : '--'}
                            </Text>
                        </div>

                        {!unstake && (
                            <div className="flex gap-2 items-center justify-between mb-3.5">
                                <div className="flex gap-1 items-baseline text-steel">
                                    <Text
                                        variant="body"
                                        weight="medium"
                                        color="steel-darker"
                                    >
                                        Total Staked
                                    </Text>
                                    <IconTooltip tip="The total SUI staked on the network by this validator and its delegators, to validate the network and earn rewards." />
                                </div>
                                <StakeAmount
                                    balance={totalValidatorStake}
                                    variant="body"
                                />
                            </div>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
}
