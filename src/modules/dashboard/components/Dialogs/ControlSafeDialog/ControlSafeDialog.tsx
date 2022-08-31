import React, { useCallback, useEffect, useState } from 'react';
import { FormikProps } from 'formik';
import * as yup from 'yup';
import toFinite from 'lodash/toFinite';
import { defineMessages } from 'react-intl';
import { ethers } from 'ethers';
import Decimal from 'decimal.js';
import { isHexString } from 'ethers/utils';
import { MaxUint256 } from 'ethers/constants';

import { AnyUser } from '~data/index';
import Dialog, { DialogProps, ActionDialogProps } from '~core/Dialog';
import { ActionForm } from '~core/Fields';

import { ActionTypes } from '~redux/index';
import { WizardDialogType } from '~utils/hooks';
import { Address } from '~types/index';
import { AbiItemExtended } from '~utils/getContractUsefulMethods';

import { TransactionTypes } from './constants';
import ControlSafeForm, { NFT } from './ControlSafeForm';

const MSG = defineMessages({
  requiredFieldError: {
    id: 'dashboard.ControlSafeDialog.requiredFieldError',
    defaultMessage: 'Please enter a value',
  },
  gtZeroError: {
    id: 'dashboard.ControlSafeDialog.amountZero',
    defaultMessage: 'Amount must be greater than zero',
  },
  notIntegerError: {
    id: 'dashboard.ControlSafeDialog.integer',
    defaultMessage: 'Amount must be an integer',
  },
  notAddressArrayError: {
    id: 'dashboard.ControlSafeDialog.notAddressArray',
    defaultMessage: 'Addresses must be formatted correctly',
  },
  notHexError: {
    id: 'dashboard.ControlSafeDialog.notHexError',
    defaultMessage: 'Value must be a valid hex string',
  },
  notAddressError: {
    id: 'dashboard.ControlSafeDialog.notAddress',
    defaultMessage: 'Address must be formatted correctly',
  },
  notBooleanError: {
    id: 'dashboard.ControlSafeDialog.notBooleanError',
    defaultMessage: 'Value must be a valid boolean',
  },
  notSafeIntegerError: {
    id: 'dashboard.ControlSafeDialog.notSafeIntegerError',
    defaultMessage: 'Amount must be a safe integer',
  },
});

export interface FormValues {
  transactions: {
    transactionType: string;
    tokenAddress?: Address;
    amount?: number;
    recipient?: AnyUser;
    data?: string;
    contract?: AnyUser;
    abi?: string;
    contractFunction?: string;
    nft: NFT;
  }[];
  safe: AnyUser;
  forceAction: boolean;
  transactionsTitle: string;
}

const displayName = 'dashboard.ControlSafeDialog';

type Props = DialogProps &
  Partial<WizardDialogType<object>> &
  ActionDialogProps;

const ControlSafeDialog = ({
  colony,
  cancel,
  callStep,
  prevStep,
  isVotingExtensionEnabled,
}: Props) => {
  const [showPreview, setShowPreview] = useState(false);
  const [selectedContractMethods, setSelectedContractMethods] = useState<{
    [key: number]: AbiItemExtended | undefined;
  }>();
  const [expandedValidationSchema, setExpandedValidationSchema] = useState<
    Record<string, any>
  >({});
  const { safes } = colony;

  const getMethodInputValidation = useCallback(
    (inputType: string, contractName: string, isArraySchema?: boolean) => {
      if (inputType.slice(-2) === '[]') {
        return yup.array().when('contractFunction', {
          is: (contractFunction) => contractFunction === contractName,
          then: yup
            .array()
            .ensure()
            .of(
              getMethodInputValidation(
                inputType.slice(0, -2),
                contractName,
                true,
              ),
            ),
          otherwise: false,
        });
      }
      if (inputType === 'uint256' || inputType === 'int256') {
        return yup.number().when('contractFunction', {
          is: (contractFunction) =>
            contractFunction === contractName || isArraySchema,
          then: yup
            .number()
            .test(
              'is-integer',
              () => MSG.notIntegerError,
              (value) => new Decimal(value || 0).isInteger(),
            )
            .test(
              'is-integer-safe',
              () => MSG.notSafeIntegerError,
              (value) =>
                new Decimal(value || 0).lte(new Decimal(MaxUint256.toString())),
            )
            .required(() => MSG.requiredFieldError),
          otherwise: false,
        });
      }
      if (inputType === 'address') {
        return yup.string().when('contractFunction', {
          is: (contractFunction) => {
            return contractFunction === contractName || isArraySchema;
          },
          then: yup
            .string()
            .address(() =>
              isArraySchema ? MSG.notAddressArrayError : MSG.notAddressError,
            )
            .required(() => MSG.requiredFieldError),
          otherwise: false,
        });
      }
      if (inputType === 'bytes') {
        return yup.string().when('contractFunction', {
          is: (contractFunction) => {
            return contractFunction === contractName || isArraySchema;
          },
          then: yup
            .string()
            .required(() => MSG.requiredFieldError)
            .test(
              'is-hex',
              () => MSG.notHexError,
              (value) => isHexString(value),
            ),
          otherwise: false,
        });
      }
      if (inputType === 'bool') {
        return yup.bool().when('contractFunction', {
          is: (contractFunction) =>
            contractFunction === contractName || isArraySchema,
          then: yup
            .bool()
            .typeError(() => MSG.notBooleanError)
            .required(() => MSG.requiredFieldError),
          otherwise: false,
        });
      }
      return yup.string().when('contractFunction', {
        is: (contractFunction) =>
          contractFunction === contractName || isArraySchema,
        then: yup.string().required(() => MSG.requiredFieldError),
        otherwise: false,
      });
    },
    [],
  );

  useEffect(() => {
    if (selectedContractMethods) {
      const updatedExpandedValidationSchema = {};

      Object.values(selectedContractMethods).forEach((method) => {
        method?.inputs?.forEach((input) => {
          updatedExpandedValidationSchema[
            input.name
          ] = getMethodInputValidation(input.type, method.name);
        });
      });

      setExpandedValidationSchema(updatedExpandedValidationSchema);
    }
  }, [selectedContractMethods, getMethodInputValidation]);

  const validationSchema = yup.object().shape({
    safe: yup.string().required(() => MSG.requiredFieldError),
    ...(showPreview ? { transactionsTitle: yup.string().required() } : {}),
    transactions: yup.array(
      yup.object().shape({
        transactionType: yup.string().required(() => MSG.requiredFieldError),
        recipient: yup.object().when('transactionType', {
          is: (transactionType) =>
            transactionType === TransactionTypes.TRANSFER_FUNDS ||
            transactionType === TransactionTypes.TRANSFER_NFT,
          then: yup.object().shape({
            id: yup.string().address().required(),
            profile: yup.object().shape({
              walletAddress: yup
                .string()
                .address()
                .required(() => MSG.requiredFieldError),
            }),
          }),
          otherwise: yup.object().nullable(),
        }),
        amount: yup.number().when('transactionType', {
          is: (transactionType) =>
            transactionType === TransactionTypes.TRANSFER_FUNDS ||
            transactionType === TransactionTypes.RAW_TRANSACTION,
          then: yup
            .number()
            .transform((value) => toFinite(value))
            .required(() => MSG.requiredFieldError)
            .moreThan(0, () => MSG.gtZeroError)
            .integer(() => MSG.notIntegerError),
          otherwise: false,
        }),
        tokenAddress: yup.string().when('transactionType', {
          is: (transactionType) =>
            transactionType === TransactionTypes.TRANSFER_FUNDS,
          then: yup
            .string()
            .address()
            .required(() => MSG.requiredFieldError),
          otherwise: false,
        }),
        data: yup.string().when('transactionType', {
          is: (transactionType) =>
            transactionType === TransactionTypes.RAW_TRANSACTION,
          then: yup
            .string()
            .required(() => MSG.requiredFieldError)
            .test(
              'is-hex',
              () => MSG.notHexError,
              (value) => ethers.utils.isHexString(value),
            ),
          otherwise: false,
        }),
        contract: yup.object().when('transactionType', {
          is: (transactionType) =>
            transactionType === TransactionTypes.CONTRACT_INTERACTION,
          then: yup.object().shape({
            profile: yup.object().shape({
              walletAddress: yup
                .string()
                .address()
                .required(() => MSG.requiredFieldError),
            }),
          }),
          otherwise: yup.object().nullable(),
        }),
        abi: yup.string().when('transactionType', {
          is: (transactionType) =>
            transactionType === TransactionTypes.CONTRACT_INTERACTION,
          then: yup.string().required(() => MSG.requiredFieldError),
          otherwise: false,
        }),
        contractFunction: yup.string().when('transactionType', {
          is: (transactionType) =>
            transactionType === TransactionTypes.CONTRACT_INTERACTION,
          then: yup.string().required(() => MSG.requiredFieldError),
          otherwise: false,
        }),
        nft: yup.object().when('transactionType', {
          is: (transactionType) =>
            transactionType === TransactionTypes.TRANSFER_NFT,
          then: yup.object().shape({
            profile: yup.object().shape({
              displayName: yup.string().required(() => MSG.requiredFieldError),
              walletAddress: yup
                .string()
                .address()
                .required(() => MSG.requiredFieldError),
            }),
          }),
          otherwise: yup.object().nullable(),
        }),
        ...expandedValidationSchema,
      }),
    ),
  });

  return (
    <ActionForm
      initialValues={{
        safe: '',
        transactionsTitle: undefined,
        transactions: [
          {
            transactionType: '',
            tokenAddress: colony.nativeTokenAddress,
            amount: undefined,
            recipient: undefined,
            data: '',
            contract: undefined,
            abi: '',
            contractFunction: '',
            nft: null,
          },
        ],
      }}
      validationSchema={validationSchema}
      submit={ActionTypes.ACTION_GENERIC}
      success={ActionTypes.ACTION_GENERIC_SUCCESS}
      error={ActionTypes.ACTION_GENERIC_ERROR}
      validateOnMount
    >
      {(formValues: FormikProps<FormValues>) => (
        <Dialog cancel={cancel}>
          <ControlSafeForm
            {...formValues}
            back={callStep && prevStep ? () => callStep(prevStep) : undefined}
            colony={colony}
            safes={safes}
            isVotingExtensionEnabled={isVotingExtensionEnabled}
            showPreview={showPreview}
            handleShowPreview={setShowPreview}
            selectedContractMethods={selectedContractMethods}
            handleSelectedContractMethods={setSelectedContractMethods}
          />
        </Dialog>
      )}
    </ActionForm>
  );
};

ControlSafeDialog.displayName = displayName;

export default ControlSafeDialog;