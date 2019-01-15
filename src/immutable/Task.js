/* @flow */

import type { RecordFactory, RecordOf } from 'immutable';

import { Record, List } from 'immutable';

import { TASK_STATE } from './constants';

import type { ENSName } from '~types';
import type { TaskFeedItemRecord } from './TaskFeedItem';
import type { TaskPayoutRecord } from './TaskPayout';
import type { UserRecord } from './User';

export type TaskRating = 1 | 2 | 3;

export type TaskCurrentState = $Keys<typeof TASK_STATE>;

export type TaskProps = {
  assignee?: UserRecord,
  colonyENSName: ENSName,
  creator: string,
  currentState: TaskCurrentState,
  domainId: number,
  dueDate?: Date,
  evaluatorHasRated: boolean, // secret was submitted
  evaluatorPayoutClaimed: boolean,
  evaluatorRateFail: boolean, // if they didn't rate or reveal
  feedItems: List<TaskFeedItemRecord>,
  id: number,
  managerHasRated: boolean, // secret was submitted
  managerPayoutClaimed: boolean,
  managerRateFail: boolean, // // if they didn't rate or reveal
  managerRating?: TaskRating,
  payouts: List<TaskPayoutRecord>,
  reputation: number, // TODO: should be BigNumber
  skillId: number,
  title: string,
  workerHasRated: boolean, // secret was submitted
  workerPayoutClaimed: boolean,
  workerRateFail: boolean, // if they didn't rate or reveal
  workerRating?: TaskRating,
};

export type TaskRecord = RecordOf<TaskProps>;

const defaultValues: $Shape<TaskProps> = {
  assignee: undefined,
  colonyENSName: undefined,
  creator: undefined,
  currentState: undefined,
  domainId: undefined,
  dueDate: undefined,
  evaluatorHasRated: undefined,
  evaluatorPayoutClaimed: undefined,
  evaluatorRateFail: undefined,
  feedItems: new List(),
  id: undefined,
  managerHasRated: undefined,
  managerPayoutClaimed: undefined,
  managerRateFail: undefined,
  managerRating: undefined,
  payouts: new List(),
  reputation: undefined,
  skillId: undefined,
  title: undefined,
  workerHasRated: undefined,
  workerPayoutClaimed: undefined,
  workerRateFail: undefined,
  workerRating: undefined,
};

// TODO: validate required props, rather than above defaults
const Task: RecordFactory<TaskProps> = Record(defaultValues);

export default Task;
