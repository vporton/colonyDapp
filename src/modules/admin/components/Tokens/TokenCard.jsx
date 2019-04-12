/* @flow */

import React from 'react';

import type { TokenReferenceType } from '~immutable';

import Card from '~core/Card';
import EthUsd from '~core/EthUsd';
import Numeral from '~core/Numeral';
import { SpinnerLoader } from '~core/Preloaders';
import CopyableAddress from '~core/CopyableAddress';

import {
  tokenIsETH,
  tokenBalanceIsNotPositive,
} from '../../../dashboard/checks';

import { useToken } from '../../../dashboard/hooks';

import styles from './TokenCard.css';

type Props = {|
  token: TokenReferenceType,
|};

const displayName = 'admin.Tokens.TokenCard';

const TokenCard = ({
  token: { address, isNative, balance, iconHash },
  token: tokenReference,
}: Props) => {
  const token = useToken(address);
  const { name, symbol } = token || {};
  return token ? (
    <Card key={address} className={styles.main}>
      <div className={styles.cardHeading}>
        {!!iconHash && (
          <div className={styles.iconContainer}>
            {/* TODO: this is cheating, we should load from our own node */}
            <img src={`https://ipfs.io/ipfs/${iconHash}`} alt={name} />
          </div>
        )}
        <div className={styles.tokenSymbol}>
          {symbol || (
            <>
              Unknown Token<CopyableAddress>{address}</CopyableAddress>
            </>
          )}
          {isNative && <span>*</span>}
        </div>
      </div>
      <div
        className={
          tokenBalanceIsNotPositive(tokenReference)
            ? styles.balanceNotPositive
            : styles.balanceContent
        }
      >
        <Numeral
          value={balance}
          decimals={2}
          integerSeparator=""
          unit="ether"
        />
      </div>
      <div className={styles.cardFooter}>
        {tokenIsETH(token) && <EthUsd value={balance} decimals={3} />}
      </div>
    </Card>
  ) : (
    <SpinnerLoader />
  );
};

TokenCard.displayName = displayName;

export default TokenCard;
