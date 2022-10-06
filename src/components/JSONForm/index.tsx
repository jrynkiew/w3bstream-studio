import React from 'react';
import { useLocalObservable, observer, Observer } from 'mobx-react-lite';
import { JSONSchemaState } from '../../store/standard/JSONSchemaState';
import Form, { FormState, IChangeEvent, withTheme } from '@rjsf/core';

interface Props {
  jsonstate: JSONSchemaState<any>;
  children?: any;
}

export const JSONForm = observer(({ children, jsonstate: jsonState }: Props) => {
  if (!jsonState.dynamicData.ready) return <></>;
  return (
    <Form
      formData={jsonState.formData}
      readonly={jsonState.readonly}
      uiSchema={jsonState.uiSchema}
      schema={jsonState.schema}
      onChange={jsonState.onChange}
      onSubmit={jsonState.onSubmit}
      validator={jsonState.validator}
    >
      {children && children}
    </Form>
  );
});
