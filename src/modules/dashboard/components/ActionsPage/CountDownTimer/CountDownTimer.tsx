import React, { useEffect, useState, useCallback } from 'react';
import { FormattedMessage, defineMessage } from 'react-intl';

import { MiniSpinnerLoader } from '~core/Preloaders';

import { useMotionTimeoutPeriodsQuery, Colony } from '~data/index';
import { splitTimePeriod } from '~utils/time';
import { MotionState } from '~utils/colonyMotions';

import styles from './CountDownTimer.css';

const MSG = defineMessage({
  title: {
    id: 'dashboard.ActionsPage.CountDownTimer.title',
    defaultMessage: `{motionState, select,
      StakeRequired {Time left to stake}
      Motion {Motion will pass in}
      Objection {Motion will fail in}
      Voting {Voting ends in}
      Reveal {Reveal ends in}
      Escalation {Time left to escalate}
      other {Timeout}
    }`,
  },
  days: {
    id: 'dashboard.ActionsPage.CountDownTimer.days',
    defaultMessage: ' {days}d',
  },
  hours: {
    id: 'dashboard.ActionsPage.CountDownTimer.hours',
    defaultMessage: ' {hours}h',
  },
  minutes: {
    id: 'dashboard.ActionsPage.CountDownTimer.minutes',
    defaultMessage: ' {minutes}m',
  },
  seconds: {
    id: 'dashboard.ActionsPage.CountDownTimer.seconds',
    defaultMessage: ' {seconds}s',
  },
  loadingText: {
    id: 'dashboard.ActionsPage.CountDownTimer.loadingText',
    defaultMessage: 'Loading countdown period',
  },
});

interface Props {
  colony: Colony;
  state: MotionState;
  motionId: number;
}

const displayName = 'dashboard.ActionsPage.CountDownTimer';

const CountDownTimer = ({
  colony: { colonyAddress },
  state,
  motionId,
}: Props) => {
  const { data, loading } = useMotionTimeoutPeriodsQuery({
    variables: {
      colonyAddress,
      motionId,
    },
  });

  const currentStatePeriod = useCallback(() => {
    switch (state) {
      case MotionState.StakeRequired:
      case MotionState.Motion:
      case MotionState.Objection:
        return data?.motionTimeoutPeriods?.timeLeftToStake || 0;
      case MotionState.Voting:
        return data?.motionTimeoutPeriods?.timeLeftToSubmit || 0;
      case MotionState.Reveal:
        return data?.motionTimeoutPeriods?.timeLeftToReveal || 0;
      case MotionState.Escalation:
        return data?.motionTimeoutPeriods?.timeLeftToEscalate || 0;
      default:
        return 0;
    }
  }, [data, state]);

  const [timeLeft, setTimeLeft] = useState<number>(-1);

  /*
   * Set the initial timeout
   */
  useEffect(() => setTimeLeft(currentStatePeriod() / 1000), [
    currentStatePeriod,
  ]);

  /*
   * Count it down
   */
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);
    if (timeLeft < 0) {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [timeLeft, currentStatePeriod]);

  /*
   * Split the time into h/m/s for display purpouses
   */
  const splitTime = splitTimePeriod(timeLeft);

  if (loading || !data) {
    return <MiniSpinnerLoader loadingText={MSG.loadingText} />;
  }

  if (splitTime === undefined) {
    return null;
  }

  return (
    <div className={styles.container}>
      <FormattedMessage {...MSG.title} values={{ motionState: state }} />
      <span className={styles.time}>
        {splitTime.days > 0 && (
          <FormattedMessage {...MSG.days} values={{ days: splitTime.days }} />
        )}
        {(splitTime.days > 0 || splitTime.hours > 0) && (
          <FormattedMessage
            {...MSG.hours}
            values={{ hours: splitTime.hours }}
          />
        )}
        {(splitTime.days > 0 || splitTime.hours > 0 || splitTime.minutes) >
          0 && (
          <FormattedMessage
            {...MSG.minutes}
            values={{ minutes: splitTime.minutes }}
          />
        )}
        <FormattedMessage
          {...MSG.seconds}
          values={{ seconds: splitTime.seconds }}
        />
      </span>
    </div>
  );
};

CountDownTimer.displayName = displayName;

export default CountDownTimer;
