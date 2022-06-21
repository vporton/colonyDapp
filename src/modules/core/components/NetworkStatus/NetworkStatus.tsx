import cx from 'classnames';
import React, { useState, useEffect } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import styles from './NetworkStatus.css';
import {
  useLatestRpcBlockQuery,
  useColonyServerLivenessQuery,
  useLatestSubgraphBlockQuery,
  useReputationOracleLivenessQuery,
  useIpfsLivenessQuery,
} from '~data/index';

import Popover from '~core/Popover';
import Icon from '~core/Icon';
import ExternalLink from '~core/ExternalLink';
import { NETWORK_HEALTH } from '~externalUrls';
import { NetworkHealthType } from '~types/index';

const MSG = defineMessages({
  networkStatusButton: {
    id: 'pages.NavigationWrapper.UserNavigation.networkStatusButton',
    defaultMessage: `Network`,
  },

  networkHealthHeader: {
    id: 'pages.NavigationWrapper.UserNavigation.networkHealthHeader',
    defaultMessage: `Network health is {networkHealth}`,
  },

  networkHealthDescription: {
    id: 'pages.NavigationWrapper.UserNavigation.networkHealthDescription',
    defaultMessage: `{networkHealth, select,
      poor
        {You should be able to perform actions, however,
        there is problem retrieving new information from the
        chain. We are working to resolve this.}
      critical
        {You will have trouble performing actions and retrieving
        information from the chain. We are working to resolve this.}
      other
        {Network is healthy.}}`,
  },
});

const NetworkStatus = () => {
  const [networkHealth, setNetworkHealth] = useState<NetworkHealthType>(
    NetworkHealthType.Healthy,
  );

  const networkCheckInterval = 300 * 1000; // 5 minutes

  const {
    data: latestRpcBlock,
    error: latestRpcBlockError,
  } = useLatestRpcBlockQuery({
    pollInterval: networkCheckInterval,
  });

  const { data: isColonyServerAlive } = useColonyServerLivenessQuery({
    pollInterval: networkCheckInterval,
  });

  const { data: isReputationOracleAlive } = useReputationOracleLivenessQuery({
    pollInterval: networkCheckInterval,
  });

  const { data: ipfsLivenessData } = useIpfsLivenessQuery({
    pollInterval: networkCheckInterval,
  });

  const {
    data: latestSubgraphBlock,
    error: latestSubgraphBlockError,
  } = useLatestSubgraphBlockQuery({
    pollInterval: networkCheckInterval,
  });
  const subgraphRpcDiff = 42;

  useEffect(() => {
    if (latestRpcBlockError) {
      setNetworkHealth(NetworkHealthType.Critical);
    } else if (
      latestSubgraphBlockError ||
      !isReputationOracleAlive?.isReputationOracleAlive ||
      !isColonyServerAlive?.isServerAlive ||
      !ipfsLivenessData?.isIPFSAlive ||
      (latestRpcBlock &&
        latestSubgraphBlock &&
        latestRpcBlock.latestRpcBlock >
          latestSubgraphBlock.latestSubgraphBlock + subgraphRpcDiff)
    ) {
      setNetworkHealth(NetworkHealthType.Poor);
    } else {
      // If everything is okay, set health to healthy (to correct for the previous state)
      setNetworkHealth(NetworkHealthType.Healthy);
    }
  }, [
    latestRpcBlockError,
    isReputationOracleAlive,
    isColonyServerAlive,
    ipfsLivenessData,
    latestRpcBlock,
    latestSubgraphBlock,
    latestSubgraphBlockError,
  ]);

  return (
    <>
      {networkHealth !== NetworkHealthType.Healthy && (
        <div>
          <Popover
            appearance={{ theme: 'grey' }}
            showArrow={false}
            placement="bottom-start"
            content={() => (
              <div className={styles.networkHealth}>
                <div className={styles.networkHealthHeading}>
                  <span
                    className={cx(
                      styles[`networkHealthIcon-${networkHealth}`],
                      styles.networkHealthIcon,
                    )}
                  >
                    <Icon name="triangle-warning" />
                  </span>
                  <span>
                    <FormattedMessage
                      {...MSG.networkHealthHeader}
                      values={{ networkHealth }}
                    />
                  </span>
                </div>
                <span className={styles.networkHealthDescription}>
                  <FormattedMessage
                    {...MSG.networkHealthDescription}
                    values={{ networkHealth }}
                  />
                </span>

                <ExternalLink
                  text={{ id: 'text.learnMore' }}
                  className={styles.link}
                  href={NETWORK_HEALTH}
                />
              </div>
            )}
            popperOptions={{
              modifiers: [
                {
                  name: 'offset',
                  options: { offset: [0, 9] },
                },
              ],
            }}
          >
            <div
              className={`${styles.elementWrapper}
                            ${styles.networkInfo}
                            ${styles.networkHealthHeading}`}
            >
              <span
                className={cx(
                  styles[`networkHealthIcon-${networkHealth}`],
                  styles.networkHealthIcon,
                )}
              >
                <Icon name="triangle-warning" />
              </span>
              <FormattedMessage {...MSG.networkStatusButton} />
            </div>
          </Popover>
        </div>
      )}
    </>
  );
};

export default NetworkStatus;