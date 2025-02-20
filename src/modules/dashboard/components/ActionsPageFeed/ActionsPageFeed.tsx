import React, { useState, useMemo, ReactElement, ReactNode } from 'react';
import { nanoid } from 'nanoid';
import { defineMessages } from 'react-intl';
import { BigNumber } from 'ethers/utils';

import Comment from '~core/Comment';
import { MiniSpinnerLoader } from '~core/Preloaders';

import { getEventsForActions } from '~utils/events';

import {
  AnyUser,
  OneDomain,
  ColonyAction,
  Colony,
  TransactionMessageFragment,
  ParsedEvent,
  useLoggedInUser,
  useCommentsSubscription,
  TokenInfoQuery,
} from '~data/index';
import { ActionUserRoles, ColonyActions, Address } from '~types/index';
import { MotionVote } from '~utils/colonyMotions';
import { useTransformer } from '~utils/hooks';
import { commentTransformer } from '~modules/dashboard/transformers';
import { getAllUserRoles } from '~modules/transformers';
import { hasRoot, canAdminister } from '~modules/users/checks';

import ActionsPageEvent from './ActionsPageEvent';
import ActionsPageSystemInfo from './ActionsPageSystemInfo';
import ActionsPageSystemMessage from './ActionsPageSystemMessage';
import { ActionsPageFeedType, SystemInfo, SystemMessage } from './types';
import styles from './ActionsPageFeed.css';

const displayName = 'dashboard.ActionsPageFeed';

const MSG = defineMessages({
  loading: {
    id: 'dashboard.ActionsPageFeed.loading',
    defaultMessage: 'Loading more feed items ...',
  },
});

export interface EventValues {
  actionType: string;
  amount?: string | ReactElement;
  token?: TokenInfoQuery['tokenInfo'];
  tokenSymbol?: string | ReactElement;
  decimals?: number;
  fromDomain?: OneDomain;
  toDomain?: OneDomain;
  motionDomain?: OneDomain;
  oldVersion?: string;
  newVersion?: string;
  colonyName?: string | ReactElement;
  roles?: ActionUserRoles[];
  user?: Address;
  agent?: Address;
  creator?: Address;
  slot?: string;
  toValue?: string;
  fromValue?: string;
  initiator?: string | ReactElement;
  staker?: string;
  stakeAmount?: BigNumber;
  vote?: MotionVote;
  voter?: Address;
  motionTag?: ReactElement;
  objectionTag?: ReactElement;
  reputationChange?: string;
  isSmiteAction?: boolean;
}

export type FeedItemWithId<T> = T & { uniqueId: string };

export type FeedItems = Array<
  | FeedItemWithId<ParsedEvent>
  | FeedItemWithId<TransactionMessageFragment>
  | FeedItemWithId<SystemInfo>
  | FeedItemWithId<SystemMessage>
>;

type CustomChildrenRenderFn = (eventsFeedItems: FeedItems) => ReactNode;

interface Props {
  transactionHash: string;
  networkEvents?: ParsedEvent[];
  systemInfos?: SystemInfo[];
  systemMessages?: SystemMessage[];
  recipient?: AnyUser;
  values?: EventValues;
  actionType?: string;
  actionData: ColonyAction;
  colony: Colony;
  children?: ReactNode | CustomChildrenRenderFn;
  loading?: boolean;
  rootHash?: string;
}

const ActionsPageFeed = ({
  transactionHash,
  networkEvents = [],
  systemInfos = [],
  systemMessages = [],
  values,
  actionType,
  actionData,
  colony,
  children,
  loading: extenalLoadingState = false,
  rootHash,
}: Props) => {
  const [autogeneratedIds] = useState<string[]>(
    [
      ...new Array(
        networkEvents.length + systemInfos.length + systemMessages.length,
      ),
    ].map(nanoid),
  );

  /*
   * @NOTE Sadly, due to the combination of both subscriptions and the way we
   * do user authentication on the server (and the fact that we must display
   * content for non-authenticated users), we can't do this filtering on the
   * server, so we are forced to do it on the client.
   *
   * This is a hard limitation of our stack, and can't really fix it (unless
   * we find another way of authentication, different from JWT)
   */
  const { walletAddress, username, ethereal } = useLoggedInUser();
  const hasRegisteredProfile = !!username && !ethereal;
  const allUserRoles = useTransformer(getAllUserRoles, [colony, walletAddress]);
  const canAdministerComments =
    hasRegisteredProfile &&
    (hasRoot(allUserRoles) || canAdminister(allUserRoles));

  const {
    data: serverComments,
    loading: loadingServerComments,
    error,
  } = useCommentsSubscription({
    variables: { transactionHash },
  });

  const filteredEvents = useMemo(() => {
    if (networkEvents) {
      return getEventsForActions(networkEvents, actionType as ColonyActions);
    }
    return [];
  }, [actionType, networkEvents]);

  const filteredComments = useMemo(() => {
    const comments = serverComments?.transactionMessages?.messages || [];
    return commentTransformer(comments, walletAddress, canAdministerComments);
  }, [canAdministerComments, serverComments, walletAddress]);

  const sortedFeed = useMemo(() => {
    const feedItems: FeedItems = [
      ...filteredEvents,
      ...filteredComments,
      ...systemMessages,
    ]
      .map((feedItem, index) => ({
        ...feedItem,
        /*
         * Use the autogenerated Id, but fallback to index for safety
         */
        uniqueId: (autogeneratedIds[index] || index) as string,
      }))
      .sort(
        ({ createdAt: createdAtFirst }, { createdAt: createdAtSecond }) =>
          new Date(createdAtFirst).getTime() -
          new Date(createdAtSecond).getTime(),
      );
    /*
     * If we need to show a system info message in the feed, we take the sorted
     * feed and splice in the required ones based on their manually entered position
     */
    if (systemInfos?.length) {
      systemInfos.map((systemInfoItem: FeedItemWithId<SystemInfo>) => {
        const { position } = systemInfoItem;
        return feedItems.splice(position, 0, {
          ...systemInfoItem,
          /*
           * Use the autogenerated Id, but fallback to index for safety
           *
           * This differs from the first instance since we are using the
           * last index of the feed items (length + 1)
           */
          uniqueId: (autogeneratedIds[feedItems.length + 1] ||
            feedItems.length + 1) as string,
        });
      });
    }
    return feedItems;
  }, [
    filteredEvents,
    filteredComments,
    systemMessages,
    systemInfos,
    autogeneratedIds,
  ]);

  if (error) {
    console.error(error);
  }

  const customRenderWithFallback = () => {
    /*
     * If we have a custom rendering function, or child component, render them
     */
    if (children) {
      return typeof children === 'function' ? children(sortedFeed) : children;
    }
    /*
     * Default render method
     */
    return sortedFeed.map((feedItem, index) => {
      /*
       * Event
       */
      if (feedItem.type === ActionsPageFeedType.NetworkEvent) {
        const {
          name,
          createdAt,
          emmitedBy,
          uniqueId,
          values: eventValues,
          transactionHash: eventTransactionHash,
        } = feedItem as FeedItemWithId<ParsedEvent>;
        return (
          <ActionsPageEvent
            key={uniqueId}
            eventIndex={index}
            createdAt={new Date(createdAt)}
            transactionHash={eventTransactionHash}
            eventName={name}
            actionData={actionData}
            values={{
              ...((eventValues as unknown) as EventValues),
              ...values,
            }}
            emmitedBy={emmitedBy}
            colony={colony}
            rootHash={rootHash}
          />
        );
      }
      /*
       * Comment
       */
      if (feedItem.type === ActionsPageFeedType.ServerComment) {
        const {
          initiator: messageInitiator,
          createdAt,
          context: { message, deleted, adminDelete, userBanned },
          uniqueId,
          sourceId,
        } = (feedItem as unknown) as FeedItemWithId<TransactionMessageFragment>;
        return (
          <Comment
            key={uniqueId}
            createdAt={createdAt}
            colony={colony}
            comment={message}
            commentMeta={{
              id: sourceId,
              deleted,
              adminDelete,
              userBanned,
            }}
            user={messageInitiator}
            showControls
          />
        );
      }
      /*
       * System Info
       */
      if (feedItem.type === ActionsPageFeedType.SystemInfo) {
        const {
          text,
          textValues,
          appearance,
          uniqueId,
        } = feedItem as FeedItemWithId<SystemInfo>;
        return (
          <ActionsPageSystemInfo
            key={uniqueId}
            tip={text}
            tipValues={textValues}
            appearance={appearance}
          />
        );
      }
      /*
       * System Message
       */
      if (feedItem.type === ActionsPageFeedType.SystemMessage) {
        const { uniqueId } = feedItem as FeedItemWithId<SystemMessage>;
        return (
          <ActionsPageSystemMessage
            key={uniqueId}
            systemMessage={feedItem as SystemMessage}
            values={values}
          />
        );
      }
      return null;
    });
  };

  /*
   * Otherwise fallback to the default rendering setup
   */
  return (
    <>
      <ul className={styles.main}>{customRenderWithFallback()}</ul>
      {(loadingServerComments || extenalLoadingState) && (
        <MiniSpinnerLoader
          className={styles.loading}
          loadingTextClassName={styles.loaderMessage}
          loadingText={MSG.loading}
        />
      )}
    </>
  );
};

ActionsPageFeed.displayName = displayName;

export default ActionsPageFeed;
