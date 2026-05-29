import React, { useState } from 'react';
import { Modal, Button, Field, Input, Select, ColorPicker, IconButton } from '@grafana/ui';
import { ValueMapping, ValueMappingEntry, ValueMappingType, ValueMappingAlertState } from '../../types';
import { VALUE_MAPPING_ALERT_STATE_OPTIONS, VALUE_MAPPING_TYPE_OPTIONS } from '../../constants';
import { COLORS, FONT, SECTION_HEADER } from '../../styles/tokens';

interface Props {
  mappings: ValueMapping[];
  onSave: (mappings: ValueMapping[]) => void;
  onClose: () => void;
}

const createEntry = (type: ValueMappingType): ValueMappingEntry => ({
  id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  value: type === 'value' ? '' : undefined,
  from: type === 'range' ? 0 : undefined,
  to: type === 'range' ? 100 : undefined,
  pattern: type === 'regex' ? '' : undefined,
  text: '',
  color: COLORS.textWhite,
  alertState: 'none',
});

const createMapping = (): ValueMapping => ({
  id: `mapping-${Date.now()}`,
  name: 'New mapping',
  type: 'value',
  entries: [createEntry('value')],
});

const toOptionalNumber = (value: string): number | undefined => {
  if (value === '') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const getDefaultAlertColor = (state: ValueMappingAlertState, currentColor?: string): string | undefined => {
  if (currentColor && currentColor !== COLORS.textWhite) {
    return currentColor;
  }
  if (state === 'warning') {
    return COLORS.warning;
  }
  if (state === 'alert') {
    return COLORS.warning;
  }
  return currentColor || COLORS.textWhite;
};

export const ValueMappingsModal: React.FC<Props> = ({ mappings, onSave, onClose }) => {
  const [draft, setDraft] = useState<ValueMapping[]>(
    mappings.map((mapping) => ({
      ...mapping,
      entries:
        mapping.entries && mapping.entries.length > 0
          ? mapping.entries.map((entry) => ({ ...entry, alertState: entry.alertState || 'none' }))
          : [createEntry(mapping.type)],
    }))
  );

  const updateMapping = (index: number, partial: Partial<ValueMapping>) => {
    const updated = [...draft];
    updated[index] = { ...updated[index], ...partial };
    setDraft(updated);
  };

  const removeMapping = (index: number) => {
    setDraft(draft.filter((_, i) => i !== index));
  };

  const updateEntry = (mappingIndex: number, entryIndex: number, partial: Partial<ValueMappingEntry>) => {
    const updated = [...draft];
    const entries = [...updated[mappingIndex].entries];
    entries[entryIndex] = { ...entries[entryIndex], ...partial };
    updated[mappingIndex] = { ...updated[mappingIndex], entries };
    setDraft(updated);
  };

  const addEntry = (mappingIndex: number) => {
    const updated = [...draft];
    updated[mappingIndex] = {
      ...updated[mappingIndex],
      entries: [...updated[mappingIndex].entries, createEntry(updated[mappingIndex].type)],
    };
    setDraft(updated);
  };

  const removeEntry = (mappingIndex: number, entryIndex: number) => {
    const updated = [...draft];
    const entries = updated[mappingIndex].entries.filter((_, i) => i !== entryIndex);
    updated[mappingIndex] = {
      ...updated[mappingIndex],
      entries: entries.length > 0 ? entries : [createEntry(updated[mappingIndex].type)],
    };
    setDraft(updated);
  };

  const changeType = (mappingIndex: number, type: ValueMappingType) => {
    const updated = [...draft];
    updated[mappingIndex] = {
      ...updated[mappingIndex],
      type,
      entries: updated[mappingIndex].entries.map((entry) => ({
        id: entry.id,
        text: entry.text,
        color: entry.color,
        alertState: entry.alertState || 'none',
        value: type === 'value' ? entry.value || '' : undefined,
        from: type === 'range' ? entry.from ?? 0 : undefined,
        to: type === 'range' ? entry.to ?? 100 : undefined,
        pattern: type === 'regex' ? entry.pattern || '' : undefined,
      })),
    };
    setDraft(updated);
  };

  return (
    <Modal title="Global Value Mappings" isOpen={true} onDismiss={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {draft.map((mapping, mappingIndex) => (
          <div
            key={mapping.id}
            style={{
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              padding: 12,
              background: 'rgba(255,255,255,0.03)',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px 28px', gap: 8, alignItems: 'end' }}>
              <Field label="Name">
                <Input
                  value={mapping.name}
                  onChange={(e) => updateMapping(mappingIndex, { name: e.currentTarget.value })}
                />
              </Field>
              <Field label="Type">
                <Select
                  options={VALUE_MAPPING_TYPE_OPTIONS}
                  value={mapping.type}
                  onChange={(v) => changeType(mappingIndex, (v.value as ValueMappingType) || 'value')}
                />
              </Field>
              <IconButton
                name="trash-alt"
                variant="destructive"
                tooltip="Remove mapping"
                onClick={() => removeMapping(mappingIndex)}
              />
            </div>

            <div style={{ ...SECTION_HEADER, marginTop: 8, fontSize: FONT.label }}>Rules</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {mapping.entries.map((entry, entryIndex) => (
                <div
                  key={entry.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      mapping.type === 'range' ? '1fr 1fr 1fr 120px 120px 28px' : '1fr 1fr 120px 120px 28px',
                    gap: 8,
                    alignItems: 'end',
                  }}
                >
                  {mapping.type === 'value' && (
                    <Field label="Value">
                      <Input
                        value={entry.value || ''}
                        onChange={(e) => updateEntry(mappingIndex, entryIndex, { value: e.currentTarget.value })}
                      />
                    </Field>
                  )}
                  {mapping.type === 'range' && (
                    <>
                      <Field label="From">
                        <Input
                          type="number"
                          value={entry.from ?? ''}
                          onChange={(e) =>
                            updateEntry(mappingIndex, entryIndex, { from: toOptionalNumber(e.currentTarget.value) })
                          }
                        />
                      </Field>
                      <Field label="To">
                        <Input
                          type="number"
                          value={entry.to ?? ''}
                          onChange={(e) =>
                            updateEntry(mappingIndex, entryIndex, { to: toOptionalNumber(e.currentTarget.value) })
                          }
                        />
                      </Field>
                    </>
                  )}
                  {mapping.type === 'regex' && (
                    <Field label="Pattern">
                      <Input
                        value={entry.pattern || ''}
                        onChange={(e) => updateEntry(mappingIndex, entryIndex, { pattern: e.currentTarget.value })}
                      />
                    </Field>
                  )}
                  <Field label="Display Text">
                    <Input
                      value={entry.text}
                      onChange={(e) => updateEntry(mappingIndex, entryIndex, { text: e.currentTarget.value })}
                    />
                  </Field>
                  <Field label="Color">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <ColorPicker
                        color={entry.color || COLORS.textWhite}
                        onChange={(color) => updateEntry(mappingIndex, entryIndex, { color })}
                      />
                      <span style={{ fontSize: FONT.body, color: COLORS.textMuted }}>{entry.color}</span>
                    </div>
                  </Field>
                  <Field label="Alert">
                    <Select
                      options={VALUE_MAPPING_ALERT_STATE_OPTIONS}
                      value={entry.alertState || 'none'}
                      onChange={(v) => {
                        const alertState = (v.value as ValueMappingAlertState) || 'none';
                        updateEntry(mappingIndex, entryIndex, {
                          alertState,
                          color: getDefaultAlertColor(alertState, entry.color),
                        });
                      }}
                    />
                  </Field>
                  <IconButton
                    name="times"
                    variant="secondary"
                    tooltip="Remove rule"
                    onClick={() => removeEntry(mappingIndex, entryIndex)}
                  />
                </div>
              ))}
            </div>

            <Button variant="secondary" icon="plus" size="sm" onClick={() => addEntry(mappingIndex)}>
              Add Rule
            </Button>
          </div>
        ))}

        {draft.length === 0 && (
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 8,
              border: `1px dashed ${COLORS.borderStrong}`,
              color: COLORS.textMuted,
              fontSize: FONT.body,
            }}
          >
            No mappings yet. Create one to reuse the same display rules across nodes and links.
          </div>
        )}

        <Button variant="secondary" icon="plus" onClick={() => setDraft([...draft, createMapping()])} fullWidth>
          Add Value Mapping
        </Button>
      </div>

      <Modal.ButtonRow>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            onSave(draft);
            onClose();
          }}
        >
          Save
        </Button>
      </Modal.ButtonRow>
    </Modal>
  );
};
