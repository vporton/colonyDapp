/* @flow */

import type { Match } from 'react-router';

// $FlowFixMe update flow!
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Redirect } from 'react-router';
import { subscribeActions as subscribeToReduxActions } from 'redux-action-watch/lib/actionCreators';
import { useDispatch } from 'redux-react-hook';
import throttle from 'lodash/throttle';

import type { TokenReferenceType, UserPermissionsType } from '~immutable';
import type { Address } from '~types';
import type { TasksFilterOptionType } from '../shared/tasksFilter';

import { ACTIONS } from '~redux';
import { useDataFetcher, useDataSubscriber, useSelector } from '~utils/hooks';
import { mergePayload } from '~utils/actions';
import { Tab, Tabs, TabList, TabPanel } from '~core/Tabs';
import { Select } from '~core/Fields';
import Button, { ActionButton } from '~core/Button';
import RecoveryModeAlert from '~admin/RecoveryModeAlert';
import LoadingTemplate from '~pages/LoadingTemplate';
import {
  TASKS_FILTER_OPTIONS,
  tasksFilterSelectOptions,
} from '../shared/tasksFilter';

import { colonyNativeTokenSelector } from '../../selectors';
import { currentUserColonyPermissionsFetcher } from '../../../users/fetchers';
import { colonyAddressFetcher } from '../../fetchers';
import { colonySubscriber } from '../../subscribers';
import {
  canAdminister,
  canCreateTask as canCreateTaskCheck,
  isFounder,
} from '../../../users/checks';
import { isInRecoveryMode as isInRecoveryModeCheck } from '../../checks';

import ColonyDomains from './ColonyDomains';
import ColonyInitialFunding from './ColonyInitialFunding';
import ColonyMeta from './ColonyMeta';
import ColonyTasks from './ColonyTasks';

import styles from './ColonyHome.css';

const MSG = defineMessages({
  loadingText: {
    id: 'dashboard.Admin.loadingText',
    defaultMessage: 'Loading Colony',
  },
  tabContribute: {
    id: 'dashboard.ColonyHome.tabContribute',
    defaultMessage: 'Contribute',
  },
  labelFilter: {
    id: 'dashboard.ColonyHome.labelFilter',
    defaultMessage: 'Filter',
  },
  placeholderFilter: {
    id: 'dashboard.ColonyHome.placeholderFilter',
    defaultMessage: 'Filter',
  },
  newTaskButton: {
    id: 'dashboard.ColonyHome.newTaskButton',
    defaultMessage: 'New Task',
  },
});

type Props = {|
  match: Match,
|};

const displayName = 'dashboard.ColonyHome';

const ColonyHome = ({
  match: {
    params: { colonyName },
  },
}: Props) => {
  const [filterOption, setFilterOption] = useState(
    TASKS_FILTER_OPTIONS.ALL_OPEN,
  );
  const [filteredDomainId, setFilteredDomainId] = useState();
  const [isTaskBeingCreated, setIsTaskBeingCreated] = useState(false);

  const dispatch = useDispatch();
  /*
   * @NOTE this needs to return the `subscribeToReduxActions` function, since that returns an
   * unsubscriber, and that gets called when the component is unmounted
   */
  useEffect(
    () =>
      subscribeToReduxActions(dispatch)({
        [ACTIONS.TASK_CREATE]: () => setIsTaskBeingCreated(true),
        [ACTIONS.TASK_CREATE_SUCCESS]: () => setIsTaskBeingCreated(false),
        [ACTIONS.TASK_CREATE_ERROR]: () => setIsTaskBeingCreated(false),
      }),
    [dispatch, setIsTaskBeingCreated],
  );

  const formSetFilter = useCallback(
    (_: string, value: TasksFilterOptionType) => setFilterOption(value),
    [setFilterOption],
  );

  const { data: colonyAddress, error: addressError } = useDataFetcher<Address>(
    colonyAddressFetcher,
    [colonyName],
    [colonyName],
  );

  const colonyArgs = [colonyAddress || undefined];
  const {
    data: colony,
    isFetching: isFetchingColony,
    error: colonyError,
  } = useDataSubscriber<*>(colonySubscriber, colonyArgs, colonyArgs);

  const { data: permissions } = useDataFetcher<UserPermissionsType>(
    currentUserColonyPermissionsFetcher,
    colonyArgs,
    colonyArgs,
  );

  const nativeTokenRef: ?TokenReferenceType = useSelector(
    colonyNativeTokenSelector,
    colonyArgs,
  );

  const transform = useCallback(mergePayload({ colonyAddress }), [
    colonyAddress,
  ]);

  const canCreateTask = canCreateTaskCheck(permissions);
  const isInRecoveryMode = isInRecoveryModeCheck(colony);

  const renderFundingWidget = () => {
    /*
     * Since we're calling this before the Loader, we can't actually render
     * if the colony data is not yet loaded
     */
    if (!(colony && colonyAddress)) {
      return null;
    }
    /*
     * Small helpers to make the funding display logic easier to read
     */
    const isBalanceZero =
      nativeTokenRef &&
      nativeTokenRef.balance &&
      nativeTokenRef.balance.isZero();
    const isFounderOrAdmin =
      canAdminister(permissions) && isFounder(permissions);
    /*
     * If it's a native token, balance is 0 and the user can mint it
     */
    if (
      nativeTokenRef &&
      !nativeTokenRef.isExternal &&
      isBalanceZero &&
      colony.canMintNativeToken
    ) {
      return (
        <ColonyInitialFunding
          colonyAddress={colonyAddress}
          displayName={colony.displayName}
          tokenAddress={nativeTokenRef.address}
          isExternal={false}
        />
      );
    }
    /*
     * If it's an external token, balance is zero, and the user is and Admin or Founder
     */
    if (
      nativeTokenRef &&
      nativeTokenRef.isExternal &&
      isBalanceZero &&
      isFounderOrAdmin
    ) {
      return (
        <ColonyInitialFunding
          colonyAddress={colonyAddress}
          displayName={colony.displayName}
          tokenAddress={nativeTokenRef.address}
          isExternal
        />
      );
    }
    /*
     * If it's not any of the above, show the tasks list
     * (The list handles it's own empty state)
     */
    return (
      <ColonyTasks
        canCreateTask={canCreateTask}
        colonyAddress={colonyAddress}
        filteredDomainId={filteredDomainId}
        filterOption={filterOption}
        isInRecoveryMode={isInRecoveryMode}
      />
    );
  };

  const memoizedFundingWidget = useMemo(renderFundingWidget, [
    nativeTokenRef,
    permissions,
    colony,
    colonyAddress,
    canCreateTask,
    filteredDomainId,
    filterOption,
    isInRecoveryMode,
  ]);

  if (colonyError || addressError) {
    return <Redirect to="/404" />;
  }

  if (!(colony && colonyAddress) || isFetchingColony) {
    return <LoadingTemplate loadingText={MSG.loadingText} />;
  }

  const filterSelect = (
    <Select
      appearance={{ alignOptions: 'right', theme: 'alt' }}
      connect={false}
      elementOnly
      label={MSG.labelFilter}
      name="filter"
      options={tasksFilterSelectOptions}
      placeholder={MSG.placeholderFilter}
      form={{ setFieldValue: formSetFilter }}
      $value={filterOption}
    />
  );

  return (
    <div className={styles.main}>
      <aside className={styles.colonyInfo}>
        <ColonyMeta
          colony={colony}
          canAdminister={!isInRecoveryMode && canAdminister(permissions)}
        />
      </aside>
      <main className={styles.content}>
        <Tabs>
          <TabList extra={filterSelect}>
            <Tab>
              <FormattedMessage {...MSG.tabContribute} />
            </Tab>
          </TabList>
          <TabPanel>{memoizedFundingWidget}</TabPanel>
        </Tabs>
      </main>
      <aside className={styles.sidebar}>
        {canCreateTask && (
          <ActionButton
            button={({ onClick, disabled, loading }) => (
              <Button
                appearance={{ theme: 'primary', size: 'large' }}
                text={MSG.newTaskButton}
                disabld={disabled}
                loading={loading}
                onClick={throttle(onClick, 2000)}
              />
            )}
            disabled={isInRecoveryMode}
            error={ACTIONS.TASK_CREATE_ERROR}
            submit={ACTIONS.TASK_CREATE}
            success={ACTIONS.TASK_CREATE_SUCCESS}
            transform={transform}
            loading={isTaskBeingCreated}
          />
        )}
        <ColonyDomains
          colonyAddress={colonyAddress}
          filteredDomainId={filteredDomainId}
          setFilteredDomainId={setFilteredDomainId}
        />
      </aside>
      {isInRecoveryMode && <RecoveryModeAlert />}
    </div>
  );
};

ColonyHome.displayName = displayName;

export default ColonyHome;
