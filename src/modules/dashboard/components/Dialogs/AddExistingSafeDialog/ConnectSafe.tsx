import React, { useEffect, useState } from 'react';
import { FormikProps } from 'formik';
import {
  defineMessages,
  FormattedMessage,
  MessageDescriptor,
  useIntl,
} from 'react-intl';
import copyToClipboard from 'copy-to-clipboard';

import Button from '~core/Button';
import DialogSection from '~core/Dialog/DialogSection';
import ExternalLink from '~core/ExternalLink';
import Icon from '~core/Icon';
import { Tooltip } from '~core/Popover';

import {
  GNOSIS_AMB_BRIDGES,
  GNOSIS_NETWORK,
  SUPPORTED_SAFE_NETWORKS,
} from '~constants';

import { FormValues, AddExistingSafeProps } from './index';

import styles from './AddExistingSafeDialogForm.css';

const MSG = defineMessages({
  subtitle: {
    id: 'dashboard.AddExistingSafeDialog.ConnectSafe.subtitle',
    defaultMessage: 'Step 2: Connect the Safe',
  },
  warning: {
    id: 'dashboard.AddExistingSafeDialog.ConnectSafe.warning',
    defaultMessage: `<span>Be aware.</span> Cross-chain bridging can have an element of risk.`,
  },
  instructions: {
    id: 'dashboard.AddExistingSafeDialog.ConnectSafe.instructions',
    defaultMessage: `To give this colony permission to control the Safe, you need to provide the following details in the Zodiac Bridge Module in your Safe. <a>Learn how to set up the Zodiac Bridge Module.</a>`,
  },
  amb: {
    id: 'dashboard.AddExistingSafeDialog.ConnectSafe.amb',
    defaultMessage: 'AMB Contract Address',
  },
  controller: {
    id: 'dashboard.AddExistingSafeDialog.ConnectSafe.controller',
    defaultMessage: 'Controller Contract Address',
  },
  chain: {
    id: 'dashboard.AddExistingSafeDialog.ConnectSafe.chain',
    defaultMessage: 'Chain ID',
  },
  moduleLink: {
    id: 'dashboard.AddExistingSafeDialog.ConnectSafe.moduleLink',
    defaultMessage: `<a>Click to go to the Safe and add the Bridge Module</a>`,
  },
  moduleSubtitle: {
    id: 'dashboard.AddExistingSafeDialog.ConnectSafe.moduleSubtitle',
    defaultMessage: 'Add the module to the Safe',
  },
  moduleDetailsSubtitle: {
    id: 'dashboard.AddExistingSafeDialog.ConnectSafe.moduleDetailsSubtitle',
    defaultMessage: 'Bridge Module setup details',
  },
  copyDataTooltip: {
    id: 'InvisibleCopyableAddress.copyAddressTooltip',
    defaultMessage: `{copied, select,
      true {Copied}
      false {{tooltipMessage}}
    }`,
  },
  copyMessage: {
    id: 'InvisibleCopyableAddress.copyMessage',
    defaultMessage: 'Click to copy',
  },
});

const instructionsHref = `https://colony.gitbook.io/colony/advanced-features/safe-control-gnosis-safe/adding-a-safe#step-2-connect-the-safe`;

interface ConnectSafeProps
  extends Pick<AddExistingSafeProps, 'colonyAddress' | 'setStepIndex'> {
  safeAddress: string;
}

interface CopyableProps {
  label: MessageDescriptor;
  text: string;
}

const ConnectSafe = ({
  isSubmitting,
  values: { chainId },
  setStepIndex,
  colonyAddress,
  safeAddress,
}: ConnectSafeProps & FormikProps<FormValues>) => {
  const selectedChain = SUPPORTED_SAFE_NETWORKS.find(
    (network) => network.chainId === Number(chainId),
  );
  const { formatMessage } = useIntl();
  const moduleHref = `https://app.safe.global/${selectedChain?.shortName.toLowerCase()}:${safeAddress}/apps?appUrl=https%3A%2F%2Fzodiac.gnosisguild.org%2F`;
  const CopyableData = ({ label, text }: CopyableProps) => {
    const [copied, setCopied] = useState(false);
    const tooltipMessage = formatMessage(MSG.copyMessage);

    const handleClipboardCopy = () => {
      setCopied(true);
      copyToClipboard(text);
    };

    useEffect(() => {
      let timeout;
      if (copied) {
        timeout = setTimeout(() => setCopied(false), 2000);
      }
      return () => {
        clearTimeout(timeout);
      };
    }, [copied]);

    return (
      <div className={styles.copyableContainer}>
        <span className={styles.subtitle}>
          <FormattedMessage {...label} />
        </span>
        <div className={`${styles.copyable} ${styles.fat}`}>
          <span>{text}</span>
          <Tooltip
            trigger="hover"
            content={
              <FormattedMessage
                {...MSG.copyDataTooltip}
                values={{ copied, tooltipMessage }}
              />
            }
          >
            <Icon
              appearance={{ size: 'normal' }}
              name="copy"
              onClick={handleClipboardCopy}
            />
          </Tooltip>
        </div>
      </div>
    );
  };

  return (
    <>
      <DialogSection appearance={{ theme: 'sidePadding' }}>
        <div className={styles.warning}>
          <FormattedMessage
            {...MSG.warning}
            values={{
              span: (chunks) => <span>{chunks}</span>,
            }}
          />
        </div>
      </DialogSection>
      <DialogSection appearance={{ theme: 'sidePadding' }}>
        <span className={styles.subtitle}>
          <FormattedMessage {...MSG.subtitle} />
        </span>
      </DialogSection>
      <DialogSection appearance={{ theme: 'sidePadding' }}>
        <div className={styles.instructions}>
          <FormattedMessage
            {...MSG.instructions}
            values={{
              a: (chunks) => (
                <ExternalLink text={chunks} href={instructionsHref} />
              ),
            }}
          />
        </div>
      </DialogSection>
      <DialogSection appearance={{ theme: 'sidePadding' }}>
        <div className={`${styles.instructions} ${styles.moduleLinkSection}`}>
          <span className={styles.subtitle}>
            <FormattedMessage {...MSG.moduleSubtitle} />
          </span>
          <FormattedMessage
            {...MSG.moduleLink}
            values={{
              a: (chunks) => <ExternalLink text={chunks} href={moduleHref} />,
            }}
          />
        </div>
      </DialogSection>
      <DialogSection appearance={{ theme: 'sidePadding' }}>
        <div className={styles.info}>
          <span className={styles.subtitle}>
            <FormattedMessage {...MSG.moduleDetailsSubtitle} />
          </span>
          <CopyableData
            label={MSG.amb}
            text={GNOSIS_AMB_BRIDGES[chainId].foreignAMB}
          />
          <CopyableData label={MSG.controller} text={colonyAddress} />
          <CopyableData
            label={MSG.chain}
            text={GNOSIS_NETWORK.chainId.toString()}
          />
        </div>
      </DialogSection>
      <DialogSection appearance={{ align: 'right', theme: 'footer' }}>
        <Button
          appearance={{ theme: 'secondary', size: 'large' }}
          onClick={() => setStepIndex((step) => step - 1)}
          text={{ id: 'button.back' }}
        />
        <Button
          appearance={{ theme: 'primary', size: 'large' }}
          onClick={() => setStepIndex((step) => step + 1)}
          text={{ id: 'button.continue' }}
          type="submit"
          loading={isSubmitting}
          style={{ width: styles.wideButton }}
        />
      </DialogSection>
    </>
  );
};

ConnectSafe.displayName = 'dashboard.AddExistingSafeDialog.ConnectSafe';

export default ConnectSafe;
