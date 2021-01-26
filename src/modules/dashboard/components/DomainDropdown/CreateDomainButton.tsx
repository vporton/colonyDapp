import React, { MouseEventHandler, useCallback } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { ColonyVersion } from '@colony/colony-js';

import Icon from '~core/Icon';
import { useDialog } from '~core/Dialog';

import CreateEditDomainDialog from '~dashboard/CreateEditDomainDialog';

import { Colony } from '~data/index';

import styles from './CreateDomainButton.css';

const MSG = defineMessages({
  buttonCreateNewDomain: {
    id: 'dashboard.DomainDropdown.CreateDomainButton.buttonCreateNewDomain',
    defaultMessage: 'Create new team',
  },
});

interface Props {
  colony: Colony;
}

const displayName = 'dashboard.DomainDropdown.CreateDomainButton';

const CreateDomainButton = ({ colony }: Props) => {
  const { formatMessage } = useIntl();
  const openCreateDomainDialog = useDialog(CreateEditDomainDialog);

  const handleClick = useCallback<MouseEventHandler<HTMLButtonElement>>(
    (evt) => {
      evt.stopPropagation();
      /*
       * We don't have, and can't inject all the required props that the component
       * is expecting when using it in a wizard
       */
      // @ts-ignore
      return openCreateDomainDialog({
        colony,
      });
    },
    [openCreateDomainDialog, colony],
  );

  const text = formatMessage(MSG.buttonCreateNewDomain);
  const isSupportedColonyVersion =
    parseInt(colony.version, 10) >= ColonyVersion.CeruleanLightweightSpaceship;
  return (
    <button
      className={styles.main}
      onClick={handleClick}
      type="button"
      disabled={!isSupportedColonyVersion}
    >
      <div className={`${styles.buttonPartIcon} ${styles.buttonPart}`}>
        <Icon name="circle-plus" title={text} />
      </div>
      <div className={styles.buttonPart}>{text}</div>
    </button>
  );
};

CreateDomainButton.displayName = displayName;

export default CreateDomainButton;
