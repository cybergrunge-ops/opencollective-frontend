import React from 'react';
import PropTypes from 'prop-types';
import { isNil } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import INTERVALS from '../../lib/constants/intervals';
import { formatCurrency } from '../../lib/currency-utils';

import Container from '../Container';
import { Flex } from '../Grid';
import StyledInputAmount from '../StyledInputAmount';
import StyledSelect from '../StyledSelect';
import { P, Span } from '../Text';

import illustration from './fees-on-top-illustration.png';

const msg = defineMessages({
  noThankYou: {
    id: 'NoThankYou',
    defaultMessage: 'No thank you',
  },
  other: {
    id: 'platformFee.Other',
    defaultMessage: 'Other',
  },
});

const Illustration = styled.img.attrs({ src: illustration })`
  width: 40px;
  height: 40px;
`;

const DEFAULT_PERCENTAGES = [0.1, 0.15, 0.2];

const getOptionFromPercentage = (amount, currency, percentage) => {
  const feeAmount = isNaN(amount) ? 0 : Math.round(amount * percentage);
  let label = `${feeAmount / 100} ${currency}`;
  if (feeAmount) {
    label += ` (${percentage * 100}%)`; // Don't show percentages of 0
  }

  return {
    // Value must be unique, so we set a special key if feeAmount is 0
    value: feeAmount || `${percentage}%`,
    feeAmount,
    percentage,
    currency,
    label,
  };
};

const getOptions = (amount, currency, intl) => {
  return [
    ...DEFAULT_PERCENTAGES.map(percentage => {
      return getOptionFromPercentage(amount, currency, percentage);
    }),
    {
      label: intl.formatMessage(msg.noThankYou),
      value: 0,
    },
    {
      label: intl.formatMessage(msg.other),
      value: 'CUSTOM',
    },
  ];
};

const PlatformTipInput = ({ currency, amount, quantity, fees, onChange, isEmbed }) => {
  const intl = useIntl();
  const orderAmount = amount * quantity;
  const options = React.useMemo(() => getOptions(orderAmount, currency, intl), [orderAmount, currency]);
  const formatOptionLabel = option => {
    if (option.currency) {
      return (
        <span>
          {formatCurrency(option.feeAmount, option.currency, { locale: intl.locale })}{' '}
          {Boolean(option.feeAmount) && <Span color="black.500">({option.percentage * 100}%)</Span>}
        </span>
      );
    } else {
      return option.label;
    }
  };
  const [selectedOption, setSelectedOption] = React.useState(options[1]);
  const [isReady, setReady] = React.useState(false);

  // Load initial value on mount
  React.useEffect(() => {
    if (!isNil(fees)) {
      const option = options.find(({ value }) => value === fees) || options.find(({ value }) => value === 'CUSTOM');
      setSelectedOption(option);
    }
    setReady(true);
  }, []);

  // Dispatch new fees on top when amount changes
  React.useEffect(() => {
    if (!isReady) {
      return;
    } else if (selectedOption.value === 0 && fees) {
      onChange(0);
    } else if (selectedOption.percentage) {
      const newOption = getOptionFromPercentage(orderAmount, currency, selectedOption.percentage);
      if (newOption.feeAmount !== fees) {
        onChange(newOption.feeAmount);
        setSelectedOption(newOption);
      }
    }
  }, [selectedOption, orderAmount, isReady]);

  return (
    <Container data-cy="PlatformTipInput" display={amount === 0 ? 'none' : 'block'}>
      <P fontWeight="400" fontSize="14px" lineHeight="21px" color="black.900" my={32}>
        {!isEmbed ? (
          <FormattedMessage
            id="platformFee.info"
            defaultMessage="Tips from contributors like you allow us to keep Open Collective free for Collectives. Thanks for any support!"
          />
        ) : (
          <FormattedMessage defaultMessage="This page is powered by Open Collective, a platform that lets you collect and spend money transparently. Open Collective is free for charitable communities, we rely on the generosity of contributors like you to make this possible." />
        )}
      </P>
      <Flex justifyContent="space-between" flexWrap={['wrap', 'nowrap']}>
        <Flex alignItems="center">
          <Illustration alt="" />
          <P fontWeight={500} fontSize="12px" lineHeight="18px" color="black.900" mx={10}>
            <FormattedMessage id="platformFee.thankYou" defaultMessage="Thank you for your contribution:" />
          </P>
        </Flex>
        <StyledSelect
          inputId="donation-percentage"
          aria-label="Donation percentage"
          width="100%"
          maxWidth={['100%', 190]}
          mt={[2, 0]}
          isSearchable={false}
          fontSize="15px"
          options={options}
          onChange={setSelectedOption}
          formatOptionLabel={formatOptionLabel}
          value={selectedOption}
          disabled={!amount} // Don't allow changing the platform tip if the amount is not set
        />
      </Flex>
      {selectedOption.value === 'CUSTOM' && (
        <Flex justifyContent="flex-end" mt={2}>
          <StyledInputAmount id="feesOnTop" name="platformTip" currency={currency} onChange={onChange} value={fees} />
        </Flex>
      )}
    </Container>
  );
};

PlatformTipInput.propTypes = {
  currency: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  amount: PropTypes.number,
  quantity: PropTypes.number,
  fees: PropTypes.number,
  isEmbed: PropTypes.bool,
  interval: PropTypes.oneOf(Object.values(INTERVALS)),
};

export default PlatformTipInput;
