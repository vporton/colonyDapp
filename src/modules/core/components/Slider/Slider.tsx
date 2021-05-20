import React, { useState, useMemo, useCallback, useEffect } from 'react';
import ReactSlider from 'rc-slider';
import { useField } from 'formik';

import 'rc-slider/assets/index.css';

import styles from './Slider.css';

export type Appearance = {
  theme?: 'primary' | 'danger';
  size?: 'thin' | 'thick';
};

interface Props {
  value: number;
  max?: number;
  min?: number;
  limit?: number;
  appearance?: Appearance;
  onChange?: (val: any) => void;
  name: string;
  disabled?: boolean;
  step?: number;
  onReset?: (val: any) => void;
}

const displayName = 'Slider';

const Slider = ({
  value,
  max = 100,
  min = 0,
  onChange,
  limit,
  appearance,
  name,
  step = 1,
  disabled = false,
}: Props) => {
  const [sliderValue, setSliderValue] = useState<number>(value);
  const [, , { setValue }] = useField(name);

  /*
   * This is needed to trigger an outside reset of the slider
   * Eg: when using `setFieldValue` after submitting a form
   */
  useEffect(() => {
    if (value !== sliderValue) {
      setSliderValue(value);
    }
  }, [sliderValue, value, setSliderValue]);

  const limitValue = useMemo(() => {
    return limit ? limit * 100 : 0;
  }, [limit]);

  const onSliderChange = useCallback(
    (val): void => {
      if (
        (limitValue && sliderValue < limitValue) ||
        val < sliderValue ||
        !limitValue
      ) {
        setSliderValue(val);
        setValue(val);
        if (onChange) {
          onChange(val);
        }
      }
      if (limitValue && (sliderValue > limitValue || val > limitValue)) {
        setSliderValue(limitValue);
        setValue(limitValue);

        if (onChange) {
          onChange(limitValue);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setSliderValue, onChange, limitValue, sliderValue],
  );

  const marks = {};

  if (limit && limit < max) {
    marks[limit] = {};
  }

  const SliderColorsObject = {
    primary: {
      backgroundColor: '#68D2D2',
      borderColor: '#68D2D2',
    },
    danger: {
      backgroundColor: '#FE5E7C',
      borderColor: '#FE5E7C',
    },
  };

  const SliderSizesObject = {
    thin: {
      height: 1,
      markHeight: 5,
      markWidth: 1,
      markPositionTop: -2,
    },
    thick: {
      height: 3,
      markHeight: 8,
      markWidth: 2,
      markPositionTop: -3,
    },
  };

  const colors = SliderColorsObject[appearance?.theme || 'primary'];
  const sizes = SliderSizesObject[appearance?.size || 'thin'];

  return (
    <div className={`${styles.main} ${styles[appearance?.theme || 'primary']}`}>
      <ReactSlider
        min={min}
        step={step}
        value={sliderValue}
        onChange={onSliderChange}
        marks={marks}
        max={max}
        disabled={disabled}
        trackStyle={{
          backgroundColor: colors.backgroundColor,
          height: sizes.height,
        }}
        handleStyle={{
          borderColor: colors.borderColor,
          borderWidth: 6,
          height: 15,
          width: 15,
          marginTop: -7,
          backgroundColor: '#FFFFFF',
        }}
        dotStyle={{
          height: sizes.markHeight,
          width: sizes.markWidth,
          backgroundColor: '#76748B',
          border: 0,
          borderRadius: 0,
          top: sizes.markPositionTop,
          marginLeft: `${limitValue}%`,
        }}
        railStyle={{
          backgroundColor: '#C2CCCC',
          height: sizes.height,
          backgroundImage: `linear-gradient(90deg, #76748B 0% ${limitValue}%, transparent ${limitValue}%)`,
        }}
      />
    </div>
  );
};

Slider.displayName = displayName;

export default Slider;
