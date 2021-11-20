import React, { useMemo } from 'react';
import { FormattedMessage, defineMessages } from 'react-intl';
import { BigNumber } from 'ethers/utils';

import { getPriceStatus } from '../utils';

import RemainingTokensValue from './RemainingTokensValue';
import RemainingWidget from './RemainingDisplayWidget';

interface Appearance {
  theme?: 'white' | 'danger';
}

export interface PeriodTokensType {
  decimals: number;
  soldPeriodTokens: BigNumber;
  maxPeriodTokens: BigNumber;
  targetPeriodTokens: BigNumber;
}

interface Props {
  appearance?: Appearance;
  periodTokens?: PeriodTokensType;
}

const displayName =
  'dashboard.CoinMachine.RemainingDisplayWidgets.RemainingTokens';

const MSG = defineMessages({
  tokensRemainingTitle: {
    id: 'dashboard.CoinMachine.RemainingDisplayWidgets.RemainingTokens.title',
    defaultMessage: 'Tokens remaining',
  },
  tokensRemainingTooltip: {
    id: 'dashboard.CoinMachine.RemainingDisplayWidgets.RemainingTokens.tooltip',
    defaultMessage: `This is the number of tokens remaining in the current batch.`,
  },
  tokensTypePlaceholder: {
    id: 'dashboard.CoinMachine.RemainingDisplayWidgets.RemainingTokens.title',
    defaultMessage: '0',
  },
  tokensTypeFooterText: {
    id: `dashboard.CoinMachine.RemainingDisplayWidgets.RemainingTokens.footerText`,
    defaultMessage: 'Price next sale',
  },
  soldOut: {
    id: 'dashboard.CoinMachine.RemainingDisplayWidgets.RemainingTokens.soldOut',
    defaultMessage: 'SOLD OUT',
  },
});

const RemainingTokens = ({
  appearance = { theme: 'white' },
  periodTokens,
}: Props) => {
  const priceStatus = useMemo(() => {
    if (!periodTokens) {
      return undefined;
    }

    return getPriceStatus(periodTokens, periodTokens.soldPeriodTokens, true);
  }, [periodTokens]);

  const widgetText = useMemo(() => {
    return {
      title: MSG.tokensRemainingTitle,
      placeholder: MSG.tokensTypePlaceholder,
      tooltipText: MSG.tokensRemainingTooltip,
      footerText: priceStatus && MSG.tokensTypeFooterText,
    };
  }, [priceStatus]);

  const displayedValue = useMemo(() => {
    if (periodTokens) {
      return (
        <RemainingTokensValue
          periodTokens={periodTokens}
          tokensBought={periodTokens.soldPeriodTokens}
        />
      );
    }

    return <FormattedMessage {...widgetText.placeholder} />;
  }, [widgetText, periodTokens]);

  const showValueWarning = useMemo(() => {
    if (periodTokens?.soldPeriodTokens.gte(periodTokens?.maxPeriodTokens)) {
      return true;
    }

    return false;
  }, [periodTokens]);

  return (
    <RemainingWidget
      widgetText={widgetText}
      appearance={appearance}
      isWarning={showValueWarning}
      displayedValue={displayedValue}
      priceStatus={periodTokens && priceStatus}
    />
  );
};

RemainingTokens.displayName = displayName;

export default RemainingTokens;