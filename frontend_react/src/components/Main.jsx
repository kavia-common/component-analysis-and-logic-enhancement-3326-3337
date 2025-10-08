import React, { useMemo, useCallback } from 'react';

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
 * that must be disabled when a device is newly enabled.
 *
 * Newly enabled detection:
 * - Preferred minimal change: enabled === true and status is empty string/undefined/null.
 * - If upstream logic auto-sets status on enable (e.g., "To Be Installed"), consumers can pass
 *   a transient flag state.hasJustBeenEnabled = true which this component will honor.
 *
 * Handling hooks to integrate with host app (documented for implementers of parent component):
 * - PUBLIC_INTERFACE handleDeviceEnabled(e, asset): set hasJustBeenEnabled: true when enabling.
 * - PUBLIC_INTERFACE onStatusChange(e, deviceState): clear hasJustBeenEnabled: false after change.
 * - PUBLIC_INTERFACE onClickSave(): clear hasJustBeenEnabled flags after successful save.
 */
export default function Main({
  state = {},
  formDisabled = false,
  selectOptions = {},
  onChange = () => {},
  // Optional callbacks a host may wire; we no-op if not provided
  onStatusChange, // (newStatus) => void
  onClickSave,    // () => Promise<boolean> | boolean
}) {
  // Wrap status change to ensure transient flag is cleared as required by the spec.
  const handleStatusChange = useCallback(
    async (newStatus) => {
      // Notify host first so its own logic runs (e.g., filtering options, validations)
      if (typeof onStatusChange === 'function') {
        onStatusChange(newStatus);
      }
      // Ensure transient flag is cleared for UX to proceed.
      // Parent reducer should merge this appropriately; here we pass a structured change hint.
      onChange('status', newStatus);
      onChange('hasJustBeenEnabled', false);
    },
    [onStatusChange, onChange]
  );

  // Optional save click handler wrapper to ensure transient flags are cleared after successful save.
  const handleClickSave = useCallback(
    async () => {
      if (typeof onClickSave === 'function') {
        try {
          const res = await onClickSave();
          const statusIsSuccess = res === true;
          if (statusIsSuccess) {
            // Clear transient flag after successful save.
            onChange('clearHasJustBeenEnabledForAll', true);
          }
        } catch (e) {
          // swallow errors here; host likely handles surfacing them
        }
      }
    },
    [onClickSave, onChange]
  );

  /**
   * PUBLIC_INTERFACE
   * Render a generic select field with logic hooks for specific field names.
   *
   * For FIELDS.ASSET_STATUSES:
   * - value comes from state.status
   * - compute isNewlyEnabled as:
   *     Boolean(state?.hasJustBeenEnabled) ||
   *     (Boolean(state?.enabled) && (!state?.status || state?.status === ''))
   * - Preserve any existing specialized disabling logic from the host by allowing base props.disabled,
   *   and only append our rule to disabled state.
   * - Do not change any filtering rules for statuses; only affect the disabled state.
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

    // Maintain any existing specialized logic (e.g., antenna model rules) outside of this new rule.
    if (fieldName === FIELDS.ASSET_STATUSES) {
      value = state?.status;

      // isNewlyEnabled covers both flows: empty status on enable, or transient flag from host.
      const isNewlyEnabled =
        Boolean(state?.hasJustBeenEnabled) ||
        (Boolean(state?.enabled) && (!state?.status || state?.status === ''));

      // Append the isNewlyEnabled rule to existing disabled computation.
      computedDisabled = disabled || formDisabled || isNewlyEnabled;
    }

    return (
      <select
        name={fieldName}
        value={value ?? ''}
        disabled={computedDisabled}
        onChange={(e) => {
          if (fieldName === FIELDS.ASSET_STATUSES) {
            handleStatusChange(e.target.value);
          } else {
            onChange(fieldName, e.target.value);
          }
        }}
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
  // Note: Parent should implement:
  // - handleDeviceEnabled(e, asset): when enabling (checked===true), set hasJustBeenEnabled: true.
  // - onStatusChange(newStatus): set hasJustBeenEnabled: false after change (handled by wrapper too).
  // - onClickSave(): clear hasJustBeenEnabled flags after successful save (handled by wrapper too).
  const renderDevice = useMemo(() => {
    return (
      <div className="device-form">
        <div className="field">
          <label>
            Enabled:
            <input
              type="checkbox"
              checked={!!state.enabled}
              // The parent should set hasJustBeenEnabled: true when enabling and clear when disabling.
              // We forward the change up; host logic stays intact.
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

        {/* Example Save button to illustrate clearing transient flag post-save if the host wires it */}
        {typeof onClickSave === 'function' && (
          <div className="actions">
            <button type="button" onClick={handleClickSave} disabled={formDisabled}>
              Save
            </button>
          </div>
        )}
      </div>
    );
  }, [
    state?.enabled,
    state?.status,
    state?.hasJustBeenEnabled,
    formDisabled,
    selectOptions,
    onChange,
    onClickSave,
    handleClickSave,
  ]);

  return <div>{renderDevice}</div>;
}
