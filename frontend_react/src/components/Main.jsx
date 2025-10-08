import React, { useMemo } from 'react';

// PUBLIC_INTERFACE
export const FIELDS = {
  ASSET_STATUSES: 'ASSET_STATUSES',
  // other fields can be added here as needed
};

/**
 * Mock helper that would normally compute data and base disabled flag for a select.
 * In the real codebase, this would be imported and used directly.
 */
function getDataForSelect(fieldName, options = {}) {
  // Example shape returned: { items: [], disabled: false }
  // This is a placeholder to allow the component to render.
  return {
    items: options.items || [],
    disabled: Boolean(options.disabled),
  };
}

/**
 * PUBLIC_INTERFACE
 * Main component simulating device form rendering, including a Status select
 * that must be disabled when a device is newly enabled (enabled === true and status is empty/undefined).
 */
export default function Main({
  state = {},
  formDisabled = false,
  selectOptions = {},
  onChange = () => {},
}) {
  /**
   * PUBLIC_INTERFACE
   * Render a generic select field with logic hooks for specific field names.
   * - For FIELDS.ASSET_STATUSES:
   *    - value comes from state.status
   *    - compute newDeviceJustEnabledDisabled = !!state?.enabled && (!state?.status || state?.status === '')
   *    - computedDisabled = disabled || newDeviceJustEnabledDisabled || formDisabled
   * - For other fields:
   *    - computedDisabled = disabled || formDisabled
   */
  const renderSelect = (fieldName, props = {}) => {
    const base = getDataForSelect(fieldName, {
      items: selectOptions[fieldName] || [],
      disabled: props.disabled,
    });
    const disabled = Boolean(base.disabled);
    const items = base.items || [];

    let value = props.value;
    let computedDisabled = disabled || formDisabled; // default behavior

    // Keep any existing specialized logic (e.g., antenna model rules) outside of this new rule.
    if (fieldName === FIELDS.ASSET_STATUSES) {
      value = state?.status;
      const newDeviceJustEnabledDisabled =
        !!state?.enabled && (!state?.status || state?.status === '');
      computedDisabled = disabled || newDeviceJustEnabledDisabled || formDisabled;
    }

    return (
      <select
        name={fieldName}
        value={value ?? ''}
        disabled={computedDisabled}
        onChange={(e) => onChange(fieldName, e.target.value)}
      >
        <option value="" disabled>
          Select...
        </option>
        {items.map((opt) => (
          <option key={opt.value ?? opt} value={opt.value ?? opt}>
            {opt.label ?? opt}
          </option>
        ))}
      </select>
    );
  };

  // PUBLIC_INTERFACE
  // Example rendering function to show device fields, including status select
  const renderDevice = useMemo(() => {
    return (
      <div className="device-form">
        <div className="field">
          <label>
            Enabled:
            <input
              type="checkbox"
              checked={!!state.enabled}
              onChange={(e) => onChange('enabled', e.target.checked)}
              disabled={formDisabled}
            />
          </label>
        </div>
        <div className="field">
          <label>Status:</label>
          {renderSelect(FIELDS.ASSET_STATUSES, {
            value: state?.status,
            disabled: false, // base disabled; combined inside renderSelect with new rule and formDisabled
          })}
        </div>
      </div>
    );
  }, [state?.enabled, state?.status, formDisabled, selectOptions, onChange]);

  return <div>{renderDevice}</div>;
}
