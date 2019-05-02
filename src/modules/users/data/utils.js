/* @flow */

import type { UserMetadataStore } from '~data/types';
import { USER_EVENT_TYPES } from '~data/constants';
import { getUserTokensReducer } from './reducers';

const { TOKEN_ADDED, TOKEN_REMOVED } = USER_EVENT_TYPES;

export const getUserTokenAddresses = (metadataStore: UserMetadataStore) =>
  metadataStore
    .all()
    .filter(({ type }) => type === TOKEN_ADDED || type === TOKEN_REMOVED)
    .reduce(getUserTokensReducer, []);

export const transformNotificationEventNames = (eventName: string): string => {
  const notificationsToEventsMapping = {
    ColonyAdminRoleSet: 'notificationAdminOtherAdded',
    ColonyAdminRoleRemoved: 'notificationAdminOtherRemoved',
    ColonyLabelRegistered: 'notificationAdminENSCreated',
    DomainAdded: 'notificationAdminColonyLabelAdded',
  };
  return notificationsToEventsMapping[eventName];
};
