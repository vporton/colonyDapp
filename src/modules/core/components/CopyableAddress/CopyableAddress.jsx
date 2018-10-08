/* @flow */

import React, { Component } from 'react';
import { defineMessages } from 'react-intl';
import copy from 'copy-to-clipboard';

import { getMainClasses } from '~utils/css';

import MaskedAddress from '~core/MaskedAddress';

import styles from './CopyableAddress.css';

import Button from '../Button';

const MSG = defineMessages({
  buttonCopy: {
    id: 'CopyableAddress.buttonCopy',
    defaultMessage: `{copiedAddress, select,
      true {Copied}
      false {Copy}
    }`,
  },
});

type Appearance = {
  theme: 'big',
};

type Props = {
  /** Appearance object */
  appearance?: Appearance,
  /** Address to display */
  children: string,
  /** Indicates that the full addrres should be shown instead of an abbreviated one */
  full?: boolean,
};

type State = {
  copiedAddress: boolean,
};

class CopyableAddress extends Component<Props, State> {
  timeout: TimeoutID;

  state = {
    copiedAddress: false,
  };

  componentWillUnmount() {
    clearTimeout(this.timeout);
  }

  handleCopyAddress = (evt: SyntheticEvent<HTMLButtonElement>) => {
    const { children: address } = this.props;
    evt.preventDefault();
    copy(address);
    this.setState({ copiedAddress: true });
    this.timeout = setTimeout(() => {
      this.setState({
        copiedAddress: false,
      });
    }, 2000);
  };

  getAddress = () => {
    const { children: address, full } = this.props;
    if (full) {
      return address;
    }
    return <MaskedAddress address={address} />;
  };

  render() {
    const { appearance } = this.props;
    const { copiedAddress } = this.state;

    return (
      <div className={getMainClasses(appearance, styles)}>
        {this.getAddress()}
        <Button
          appearance={{ size: 'small', theme: 'blue' }}
          disabled={copiedAddress}
          onClick={this.handleCopyAddress}
          text={{ ...MSG.buttonCopy }}
          textValues={{ copiedAddress }}
        />
      </div>
    );
  }
}

export default CopyableAddress;
