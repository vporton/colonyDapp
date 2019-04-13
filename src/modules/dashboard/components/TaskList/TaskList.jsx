/* @flow */

// $FlowFixMe until hooks flow types
import React, { useState, useCallback, useMemo } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import type { Node } from 'react';

import { Table, TableBody } from '~core/Table';

import type { TaskDraftId, TaskType } from '~immutable';

import TaskListItem from './TaskListItem.jsx';

const MSG = defineMessages({
  noTasks: {
    id: 'dashboard.TaskList.noTasks',
    defaultMessage: 'No tasks',
  },
});

type Props = {|
  draftIds?: TaskDraftId[],
  filter?: (task: TaskType) => boolean,
  emptyState?: Node,
|};

const TaskList = ({ draftIds = [], filter, emptyState }: Props) => {
  // TODO: refactor this in the future to fetch tasks and perform filtering in
  // this component, thus removing the need for this crazy hook stuff!

  // keep track of which items aren't rendering due to being filtered out
  const [taskVisibility, setTaskVisibility] = useState({});
  const handleWillRender = useCallback(
    (draftId: string, willRender: boolean) => {
      if (taskVisibility[draftId] === willRender) return;
      setTaskVisibility({
        ...taskVisibility,
        [draftId]: willRender,
      });
    },
    [taskVisibility],
  );
  const visibleTaskCount = useMemo(
    () =>
      Object.values(taskVisibility).reduce(
        (count, isVisible) => (isVisible ? count + 1 : count),
        0,
      ),
    [taskVisibility],
  );

  // if the draftIds change, reset the state
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => setTaskVisibility({}), [draftIds]);

  return (
    <>
      <Table data-test="dashboardTaskList" scrollable>
        <TableBody>
          {draftIds.map(draftId => (
            <TaskListItem
              key={draftId}
              draftId={draftId}
              filter={filter}
              willRender={handleWillRender}
            />
          ))}
        </TableBody>
      </Table>
      {!visibleTaskCount &&
        (emptyState || (
          <p>
            <FormattedMessage {...MSG.noTasks} />
          </p>
        ))}
    </>
  );
};

export default TaskList;
