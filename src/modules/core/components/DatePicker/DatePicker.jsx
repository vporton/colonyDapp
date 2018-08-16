/* @flow */

import type { MessageDescriptor } from 'react-intl';

import React, { Component } from 'react';
import createDate from 'sugar-date/date/create';
import formatDate from 'sugar-date/date/format';
import DayPicker, { DateUtils } from 'react-day-picker';

import styles from './DatePicker.css';

import type { InputComponentAppearance } from '../Fields/Input';
import type { PopoverTrigger } from '../Popover';

import { asField } from '../Fields';
import Popover from '../Popover';
import InputField from './InputField.jsx';

import CaptionElement from './CaptionElement.jsx';
import NavbarElement from './NavbarElement.jsx';

type Props = {
  /** Appearance object, will be passed down to `Input`, see [InputComponent](#inputcomponent) */
  appearance?: InputComponentAppearance,
  /** Connect to form state (will inject `$value`, `$id`, `$error`, `$touched`), is `true` by default */
  connect?: boolean,
  /** Just render the `<input>` element without label */
  elementOnly?: boolean,
  /** Input field name (form variable) */
  name: string,
  /** Help text (will appear next to label text) */
  help?: string | MessageDescriptor,
  /** Values for help text (react-intl interpolation) */
  helpValues?: { [string]: string },
  /** Pass a ref to the `<input>` element */
  innerRef?: (ref: ?HTMLElement) => void,
  /** Label text */
  label: string | MessageDescriptor,
  /** Values for label text (react-intl interpolation) */
  labelValues?: { [string]: string },
  /** Placeholder for input */
  placeholder?: string,
  /** Custom trigger to render (render prop), see [Popover](#popover) for details */
  renderTrigger?: PopoverTrigger,
  /** Callback to call when a date is picked. Only needed when using `connect={false}` */
  setValue: (val: Date) => void,
  /** @ignore Will be injected by `asField` */
  $error?: string,
  /** @ignore Will be injected by `asField` */
  $value?: Date,
  /** @ignore Will be injected by `asField` */
  setError: (val: any) => void,
  /** @ignore Will be injected by `asField` */
  onBlur: (evt: SyntheticFocusEvent<HTMLInputElement>) => void,
  /** @ignore Will be injected by `asField` */
  onChange: (evt: SyntheticInputEvent<HTMLInputElement>) => void,
};

type State = {
  inputValue: string,
  currentDate: ?Date,
};

const getShortDate = (date: Date) => formatDate(date, '{date} {Mon} {year}');

class DatePicker extends Component<Props, State> {
  static displayName = 'DatePicker';

  static defaultProps = {
    $value: null,
  };

  state = {
    inputValue: '',
    currentDate: null,
  };

  handlePopoverClose = (day, { cancelled } = {}) => {
    const { $value, setValue } = this.props;
    const { currentDate, inputValue } = this.state;
    // User cancelled using ESC
    if (cancelled) {
      this.setState({
        inputValue: $value ? getShortDate($value) : '',
        currentDate: $value || null,
      });
      return;
    }
    // User clicked on the day
    if (day && day instanceof Date) {
      setValue(day);
      this.setState({
        inputValue: getShortDate(day),
        currentDate: null,
      });
      return;
    }
    // User removed the input value and closed
    if (!inputValue) {
      setValue(null);
      this.setState({
        inputValue: '',
        currentDate: null,
      });
      return;
    }
    // User typed in a day and tabbed out
    if (currentDate) {
      setValue(currentDate);
      this.setState({
        inputValue: getShortDate(currentDate),
        currentDate: null,
      });
    }
  };

  handleInputChange = evt => {
    const maybeDate = createDate(evt.target.value);
    if (maybeDate instanceof Date && !Number.isNaN(maybeDate.valueOf())) {
      this.setState({
        currentDate: maybeDate,
        inputValue: evt.target.value,
      });
    } else {
      this.setState({ inputValue: evt.target.value });
    }
  };

  getTrigger = () => {
    const {
      appearance,
      label,
      name,
      placeholder,
      renderTrigger,
      onBlur,
      onChange,
      setError,
      setValue,
      $value,
      ...datePickerProps
    } = this.props;
    const { inputValue } = this.state;
    if (renderTrigger) return renderTrigger;
    return ({ ref, ...props }) => (
      <InputField
        appearance={appearance}
        name={name}
        label={label}
        innerRef={ref}
        onChange={this.handleInputChange}
        placeholder={placeholder}
        value={inputValue}
        {...datePickerProps}
        {...props}
      />
    );
  };

  render() {
    const { $value } = this.props;
    const { currentDate } = this.state;
    const selectedDay = currentDate || $value;
    return (
      <div className={styles.main}>
        <Popover
          className={styles.picker}
          placement="bottom"
          retainRefFocus
          onClose={this.handlePopoverClose}
          content={({ close }) => (
            <DayPicker
              classNames={styles}
              enableOutsideDays
              month={currentDate || new Date()}
              onDayClick={close}
              selectedDays={day => DateUtils.isSameDay(selectedDay, day)}
              captionElement={props => <CaptionElement {...props} />}
              navbarElement={props => <NavbarElement {...props} />}
            />
          )}
        >
          {this.getTrigger()}
        </Popover>
      </div>
    );
  }
}

export default asField()(DatePicker);
