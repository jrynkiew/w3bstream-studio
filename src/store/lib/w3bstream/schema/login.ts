import { JSONSchemaState } from '@/store/standard/JSONSchemaState';
import { FromSchema } from 'json-schema-to-ts';
import { JSONSchema7 } from 'json-schema';
import axios from 'axios';

export const schema = {
  // export const configSchema: JSONSchema7 = {
  title: 'Login Test',
  type: 'object',
  properties: {
    username: { type: 'string' },
    password: { type: 'string' }
  },
  require: ['username', 'password']
} as const;

type ConfigType = FromSchema<typeof schema>;

export const loginSchema = new JSONSchemaState<ConfigType>({
  schema,
  uiSchema: {
    'ui:submitButtonOptions': {
      norender: false,
      submitText: 'Login'
    }
  },
  reactive: true,
  onSubmit(e): void {
    console.log(e.formData);
    axios.request({
      method: 'put',
      url: '/srv-applet-mgr/v0/login',
      data: e.formData
    });
  },
  formData: {}
});
